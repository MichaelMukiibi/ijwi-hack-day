# Ijwi retinal screening service

An isolated **FastAPI + Docker + FastDRS** CPU inference service for the `/screen` feature. The existing general chatbot continues to use `/api/chat` and does not depend on this container.

## What is implemented

- JPEG/PNG fundus-image upload, maximum **5 MiB** and **20 million decoded pixels**.
- A real, checksum-verified **MobileNetV2** FastDRS checkpoint; five DR classes.
- All five model scores, model/image provenance, and inference timing.
- Bearer-token service authentication, readiness checks, one inference at a time, and bounded request size.
- A separate React `/screen` page and Worker `/api/screen` proxy.
- A separate `/api/screen/chat` conversation that receives the signed screening result as context. The image is not sent to Gemma.

Research demonstration only. The service does not assess whether an image is actually a suitable fundus photograph and does not make a clinical diagnosis or determine referral urgency. Model scores are not validated probabilities of disease. A synthetic smoke test confirms the software path, not clinical accuracy.

## How it fits together

```text
Browser /screen
  -> frontend Worker /api/* proxy
  -> backend Worker POST /api/screen
  -> HTTPS inference service on DigitalOcean POST /v1/screen
  -> FastDRS CPU prediction
  <- result + one-hour signed context token

Browser /screen result conversation
  -> backend Worker POST /api/screen/chat
  -> verify context signature and expiry
  -> Gemma 4 with prediction, scores and provenance
```

No new database, GPU, Redis, or object-storage service is required. Images and conversations are not durably stored by this feature. Multipart parsing can use temporary files; FastAPI closes them after the request. The model file is stored on the service disk. Browser preview URLs are revoked when the selection changes or the page unmounts.

## Model and reproducibility

| Setting | Value |
| --- | --- |
| Library | fastdrs 0.1.15 |
| Model | mobilenet_v2 |
| Weights release | v0.1.1 |
| Checkpoint size | 9,168,971 bytes |
| Input | RGB, 224 px preprocessing through FastDRS |
| Runtime | CPU-only PyTorch, one inference worker |
| SHA-256 | 8e522e9090449d12de94aaaab947e9e747be43952a520b6a1942e94870eb8cec |

Weights: [FastDRS model release](https://github.com/MichaelMukiibi/fastdrs-models/releases/tag/v0.1.1). The Docker build downloads the checkpoint from this fixed release and verifies its hash. It does not download arbitrary user-provided models. Dependency versions and CPU-only indexes are recorded in `uv.lock` / `pyproject.toml`; no CUDA packages are required on Linux.

`FASTDRS_USE_BEN_GRAHAM=false` matches the library's default inference transform. It is configurable and recorded in every result. Confirm the training preprocessing and validate the model on appropriate retinal data before any real-world clinical pilot; no such validation is claimed here.

## Local setup with uv

From the repository root:

```sh
uv --directory backend/inference sync --extra model
uv --directory backend/inference run --extra model python -m scripts.download_model
```

Copy `.env.example` to `.env` **inside backend/inference** if it does not exist. Set `FASTDRS_API_TOKEN` to a long random secret. In `backend/.env`, set the same `FASTDRS_API_TOKEN`, set `FASTDRS_API_URL=http://127.0.0.1:8000`, and set a separate random `SCREENING_CONTEXT_SECRET` of at least 32 characters. Local ignored files may already contain generated matching secrets; do not overwrite them. Never commit them.

Start inference from the repository root:

```sh
uv --directory backend/inference run --extra model --env-file .env uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 1 --no-access-log
```

Then start the usual application in separate terminals:

```sh
pnpm dev:backend
pnpm dev:frontend
```

Open http://127.0.0.1:5173/screen. The health check at `/api/screen/health` distinguishes missing configuration from a model that is not ready. General conversation remains available at `/#chat`.

## Direct API

`GET /healthz` is process health. `GET /readyz` returns HTTP 200 only after the model loads and service authentication is configured; otherwise HTTP 503. These reveal no keys or image data.

`POST /v1/screen` accepts **multipart/form-data**, field name **file**, with `Authorization: Bearer <FASTDRS_API_TOKEN>`.

```sh
curl --fail-with-body \
  -H "Authorization: Bearer $FASTDRS_API_TOKEN" \
  -F "file=@/path/to/fundus.jpg;type=image/jpeg" \
  https://screen.example.com/v1/screen
```

On Windows use `curl.exe` and the appropriate shell environment-variable syntax. API documentation is at `/docs` and machine-readable schemas at `/openapi.json`.

A successful response includes:

```json
{
  "prediction_id": "a-unique-run-id",
  "class_id": 2,
  "class_name": "Moderate",
  "score": 0.6,
  "scores": [
    {"class_id": 0, "class_name": "No DR", "score": 0.1},
    {"class_id": 1, "class_name": "Mild", "score": 0.1},
    {"class_id": 2, "class_name": "Moderate", "score": 0.6},
    {"class_id": 3, "class_name": "Severe", "score": 0.1},
    {"class_id": 4, "class_name": "Proliferative", "score": 0.1}
  ],
  "model": {"name": "mobilenet_v2", "version": "v0.1.1", "sha256": "...", "library_version": "0.1.15", "image_size": 224, "use_ben_graham": false},
  "image": {"width": 512, "height": 512, "sha256": "..."},
  "latency_ms": 250,
  "created_at": "2026-10-31T12:00:00Z",
  "scope": "research-screening",
  "limitations": ["Research prediction, not a clinical diagnosis."]
}
```

This JSON is illustrative, not a model benchmark or patient result; hashes and run ID are abbreviated. Actual result schemas and validation are in `app/schemas.py`.

| HTTP status | Meaning |
| --- | --- |
| 401 | Missing/wrong bearer token |
| 413 | Image/request size or decoded dimensions exceed limits |
| 415 | Unsupported or animated image format |
| 422 | Missing file field or invalid/truncated image |
| 429 | Another inference is already running; retry later |
| 503 | Missing model/configuration or inference failed; no fake result returned |

Worker endpoints use the same multipart file field at `POST /api/screen`; service credentials stay server-side. That endpoint returns `{result, screeningToken}`. Send `{messages, screeningToken}` to `POST /api/screen/chat`. The token is signed, expires after one hour, and is not encrypted. It contains the result, not the image or a patient identifier. Altered, expired, or unsigned context is rejected before Gemma runs. Neither a token nor a model score is clinical certification.

## Tests and checks

From the repository root:

```sh
uv --directory backend/inference run pytest
uv --directory backend/inference run ruff check app scripts tests
pnpm check
pnpm test
pnpm build
```

Python unit tests inject a test engine; this is not an exposed mock mode. Real-model testing requires `--extra model`. The model fails readiness if its dependency, file, or checksum is missing; it never silently substitutes random weights or fixed predictions. See [DigitalOcean deployment](DIGITALOCEAN.md) for deployment, budget, security configuration, verification, and rollback.

## Verification record for this increment

- 9 Python API tests passed, including authentication, decoding, size/dimension limits, readiness, model-output failure, OpenAPI schema, and concurrent-inference rejection.
- 23 Worker/API tests and 10 frontend tests passed, including the original chatbot regression suite and signed-context tampering/expiry.
- Strict TypeScript, frontend production build, Ruff checks, and both Worker deployment dry runs passed.
- Linux x86_64 CPU dependency selection passed uv's frozen dry run without CUDA packages.
- A generated synthetic image completed the local HTTP path from frontend proxy through FastAPI/FastDRS to live Cloudflare Gemma with verified result context.
- Docker is not installed in the authoring workspace, so a container build and live DigitalOcean deployment remain to be verified on the target host. No DigitalOcean resources were created or credits spent by these changes.

Cancelling an upload stops waiting for its response; an inference already executing on the service may finish. Retry may briefly return 429 until that slot becomes available.
