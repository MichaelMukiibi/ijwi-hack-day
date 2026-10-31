import hashlib
import io
import logging
import math
import secrets
import threading
import time
import warnings
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import Annotated
from uuid import uuid4

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError
from starlette.responses import JSONResponse

from .engine import FastDRSEngine
from .schemas import ScreeningResult
from .settings import CLASS_NAMES, MODEL_SHA256, Settings

logger = logging.getLogger("ijwi.inference")


class BodyLimit:
    def __init__(self, app, max_bytes):
        self.app, self.max_bytes = app, max_bytes

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        total = 0

        async def limited_receive():
            nonlocal total
            message = await receive()
            total += len(message.get("body", b""))
            if total > self.max_bytes:
                raise HTTPException(413, "Upload is too large. Maximum image size is 5 MiB.")
            return message

        await self.app(scope, limited_receive, send)


def create_app(settings=None, engine=None):
    settings = settings or Settings.from_env()
    engine = engine or FastDRSEngine(settings)
    slot = threading.BoundedSemaphore(1)
    state = {"ready": False}

    @asynccontextmanager
    async def lifespan(app):
        try:
            engine.load()
            state["ready"] = True
        except Exception as exc:  # noqa: BLE001 - fail closed at the model boundary
            logger.error("model_startup_failed: %s", type(exc).__name__)
        yield
        state["ready"] = False

    app = FastAPI(title="Ijwi FastDRS inference", version="0.2.0", lifespan=lifespan)
    app.add_middleware(BodyLimit, max_bytes=settings.max_bytes + 65536)

    @app.middleware("http")
    async def headers(request, call_next):
        response = await call_next(request)
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    def authorize(authorization: str | None = Header(default=None)):
        expected = f"Bearer {settings.token}"
        if not settings.token:
            raise HTTPException(503, "Service authentication is not configured.")
        if not secrets.compare_digest((authorization or "").encode(), expected.encode()):
            raise HTTPException(401, "Invalid service credentials.")

    @app.get("/healthz")
    def health():
        return {"status": "ok", "service": "ijwi-fastdrs"}

    @app.get("/readyz")
    def readiness():
        ready = state["ready"] and bool(settings.token)
        return JSONResponse({"ready": ready}, status_code=200 if ready else 503)

    @app.post(
        "/v1/screen",
        response_model=ScreeningResult,
        dependencies=[Depends(authorize)],
        responses={
            401: {"description": "Invalid service token"},
            413: {"description": "Image too large"},
            415: {"description": "Unsupported image format"},
            429: {"description": "Inference busy"},
            503: {"description": "Model unavailable"},
        },
    )
    def screen(file: Annotated[UploadFile, File()]):
        if not state["ready"]:
            raise HTTPException(503, "Screening model is not ready. Check model setup.")
        if not slot.acquire(blocking=False):
            raise HTTPException(429, "Screening is busy. Retry after the current image finishes.")
        try:
            if file.content_type not in {"image/jpeg", "image/png"}:
                raise HTTPException(415, "Upload a JPEG or PNG fundus photograph.")
            raw = file.file.read(settings.max_bytes + 1)
            if not raw or len(raw) > settings.max_bytes:
                raise HTTPException(413, "Image must contain 1 byte to 5 MiB.")
            try:
                with warnings.catch_warnings():
                    warnings.simplefilter("error", Image.DecompressionBombWarning)
                    with Image.open(io.BytesIO(raw)) as probe:
                        if probe.format not in {"JPEG", "PNG"}:
                            raise HTTPException(415, "The file is not JPEG or PNG.")
                        if probe.width * probe.height > settings.max_pixels:
                            raise HTTPException(413, "Image exceeds 20 million pixels.")
                        if getattr(probe, "n_frames", 1) != 1:
                            raise HTTPException(415, "Animated images are not supported.")
                        probe.verify()
                    with Image.open(io.BytesIO(raw)) as decoded:
                        image = ImageOps.exif_transpose(decoded).convert("RGB")
                        image.load()
            except HTTPException:
                raise
            except (Image.DecompressionBombError, Image.DecompressionBombWarning):
                raise HTTPException(413, "Image dimensions are too large.") from None
            except (UnidentifiedImageError, OSError, ValueError, SyntaxError):
                raise HTTPException(422, "Image could not be decoded.") from None
            start = time.perf_counter()
            prediction = engine.predict(image)
            scores = [float(value) for value in prediction.probabilities]
            if len(scores) != 5 or any(not math.isfinite(x) or x < 0 or x > 1 for x in scores):
                raise RuntimeError("Invalid model output")
            if abs(sum(scores) - 1) > 0.001 or prediction.class_id != max(
                range(5), key=scores.__getitem__
            ):
                raise RuntimeError("Invalid model output")
            return {
                "prediction_id": str(uuid4()),
                "class_id": int(prediction.class_id),
                "class_name": CLASS_NAMES[prediction.class_id],
                "score": scores[prediction.class_id],
                "scores": [
                    {"class_id": i, "class_name": name, "score": scores[i]}
                    for i, name in enumerate(CLASS_NAMES)
                ],
                "model": {
                    "name": "mobilenet_v2",
                    "version": "v0.1.1",
                    "sha256": MODEL_SHA256,
                    "library_version": engine.library_version,
                    "image_size": 224,
                    "use_ben_graham": settings.use_ben_graham,
                },
                "image": {
                    "width": image.width,
                    "height": image.height,
                    "sha256": hashlib.sha256(raw).hexdigest(),
                },
                "latency_ms": round((time.perf_counter() - start) * 1000, 2),
                "created_at": datetime.now(UTC).isoformat(),
                "scope": "research-screening",
                "limitations": [
                    "Research prediction, not a clinical diagnosis.",
                    "Model scores are not validated disease probabilities.",
                    "Image suitability and clinical urgency have not been assessed.",
                ],
            }
        except HTTPException:
            raise
        except Exception as exc:  # noqa: BLE001 - fail closed at the model boundary
            logger.error("inference_failed: %s", type(exc).__name__)
            raise HTTPException(
                503, "Screening could not complete. No prediction was produced."
            ) from None
        finally:
            slot.release()

    return app


app = create_app()
