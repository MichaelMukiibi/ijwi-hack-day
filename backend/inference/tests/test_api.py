import io
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import create_app
from app.settings import MODEL_SHA256, Settings


class Engine:
    library_version = "test-double"

    def load(self):
        pass

    def predict(self, image):
        assert image.mode == "RGB"
        return SimpleNamespace(class_id=2, probabilities=[0.1, 0.1, 0.6, 0.1, 0.1])


def picture(format="PNG", size=(32, 32)):
    output = io.BytesIO()
    Image.new("RGB", size, "black").save(output, format=format)
    return output.getvalue()


@pytest.fixture
def client():
    settings = Settings(token="test-token", model_path=Path("unused"))
    with TestClient(create_app(settings, Engine())) as client:
        yield client


def upload(client, raw=None, mime="image/png", token="test-token"):
    return client.post(
        "/v1/screen",
        files={"file": ("fundus.png", picture() if raw is None else raw, mime)},
        headers={"Authorization": f"Bearer {token}"},
    )


def test_prediction_contract_and_provenance(client):
    response = upload(client)
    assert response.status_code == 200
    result = response.json()
    assert result["class_name"] == "Moderate"
    assert len(result["scores"]) == 5
    assert result["model"]["sha256"] == MODEL_SHA256
    assert len(result["image"]["sha256"]) == 64
    assert result["scope"] == "research-screening"
    assert response.headers["Cache-Control"] == "no-store"


def test_invalid_auth_and_uploads(client):
    assert upload(client, token="wrong").status_code == 401
    assert upload(client, raw=b"not-an-image").status_code == 422
    assert upload(client, raw=picture("GIF")).status_code == 415
    assert upload(client, mime="application/octet-stream").status_code == 415
    assert upload(client, raw=b"x" * (5 * 1024 * 1024 + 1)).status_code == 413


def test_dimension_limit():
    settings = Settings(token="test-token", model_path=Path("unused"), max_pixels=100)
    with TestClient(create_app(settings, Engine())) as client:
        assert upload(client).status_code == 413


def test_model_failure_is_not_a_fake_prediction():
    class MissingEngine(Engine):
        def load(self):
            raise RuntimeError("weights missing")

    with TestClient(
        create_app(Settings(token="test-token", model_path=Path("unused")), MissingEngine())
    ) as client:
        assert client.get("/healthz").status_code == 200
        assert client.get("/readyz").status_code == 503
        assert upload(client).status_code == 503


def test_invalid_model_output_fails_closed():
    class InvalidEngine(Engine):
        def predict(self, image):
            return SimpleNamespace(class_id=2, probabilities=[float("nan")] * 5)

    with TestClient(
        create_app(Settings(token="test-token", model_path=Path("unused")), InvalidEngine())
    ) as client:
        response = upload(client)
        assert response.status_code == 503
        assert "class_id" not in response.json()


def test_ready_requires_service_credentials():
    with TestClient(create_app(Settings(token="", model_path=Path("unused")), Engine())) as client:
        assert client.get("/readyz").status_code == 503
        assert upload(client).status_code == 503


def test_openapi_documents_the_result(client):
    schema = client.get("/openapi.json").json()
    assert "ScreeningResult" in schema["components"]["schemas"]
    assert "multipart/form-data" in schema["paths"]["/v1/screen"]["post"]["requestBody"]["content"]


def test_multipart_body_limit(client):
    assert upload(client, raw=b"x" * (6 * 1024 * 1024)).status_code == 413


def test_busy_service_rejects_parallel_inference():
    import threading
    from concurrent.futures import ThreadPoolExecutor

    class BlockingEngine(Engine):
        started = threading.Event()
        finish = threading.Event()

        def predict(self, image):
            self.started.set()
            assert self.finish.wait(5)
            return super().predict(image)

    engine = BlockingEngine()
    settings = Settings(token="test-token", model_path=Path("unused"))
    with TestClient(create_app(settings, engine)) as client, ThreadPoolExecutor(1) as pool:
        first = pool.submit(upload, client)
        try:
            assert engine.started.wait(3)
            assert upload(client).status_code == 429
        finally:
            engine.finish.set()
        assert first.result(timeout=5).status_code == 200
