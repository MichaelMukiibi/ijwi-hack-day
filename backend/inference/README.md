# FastDRS inference service

Reserved for the Python service that will run in Docker. No inference implementation or model is included yet. The application Worker API remains in `backend/src/`.

Use uv for all Python dependencies and execution:

```sh
uv sync --project backend/inference
uv run --project backend/inference ruff check .
```

Add future dependencies with `uv add --project backend/inference <package>`. Commit `uv.lock`; do not commit `.venv`. No pip or requirements.txt workflow is used.
