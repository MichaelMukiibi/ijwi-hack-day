FROM ghcr.io/astral-sh/uv:0.13.6 AS uv
FROM python:3.11-slim
COPY --from=uv /uv /usr/local/bin/uv
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 OMP_NUM_THREADS=1
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates libglib2.0-0 libgomp1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --extra model
COPY app ./app
COPY scripts ./scripts
RUN uv run --no-sync python -m scripts.download_model && useradd --create-home --uid 10001 ijwi && chown -R ijwi:ijwi /app
USER ijwi
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s CMD ["/app/.venv/bin/python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/readyz', timeout=3)"]
CMD ["/app/.venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--no-access-log", "--limit-concurrency", "8"]
