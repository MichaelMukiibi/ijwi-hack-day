# Local development

Requires Node.js 20.19+ or 22.12+ and pnpm 10. Python inference work uses uv.

```sh
pnpm install --frozen-lockfile
```

Copy `backend/.env.example` to `backend/.env` if it does not exist, then fill provider keys. This file is ignored. The Node backend reads it automatically. Do not overwrite an existing .env containing your keys. The deployed backend uses its Workers AI binding and Worker secrets instead.

Start two terminals from the repository root:

```sh
pnpm dev:backend
```

```sh
pnpm dev:frontend
```

Open the Vite URL (normally http://127.0.0.1:5173). Vite proxies `/api` to port 8787. Backend preview content is explicitly labeled sample data; the separate chat calls actual Gemma providers when credentials are configured. Without keys, chat returns a configuration error. The frontend includes suggestion prompts, multi-turn context, loading, manual retry, cancellation, new conversation, and per-response provider labels. History is in memory only and clears on reload.

## Layout

- `frontend/`: React, strict TypeScript, Vite, TanStack Query, frontend proxy Worker and Wrangler config.
- `backend/`: application API Worker, Gemma provider adapters, and dependency-free Node development adapter.
- `backend/inference/`: uv-managed future Python FastDRS service; no model/inference implementation yet.
- `architecture.md`: canonical design and change record. Update it for every feature.
- `DEPLOYMENT.md`: GitHub / Cloudflare build and deployment settings.

## API

- GET `/api/health`: provider configuration availability and implemented capabilities.
- GET `/api/preview/{case|conversation|summary}`: sample workspace content.
- POST `/api/chat`: `{messages: [{role: "user", content: "..."}, ...]}`. Alternating user/assistant history, ending in user, at most 23 messages / 12 user turns, 4,000 characters per message and 16,000 total characters. Returns reply, provider, model, fallback flag, and request ID.

Cloudflare binding/REST is primary; Google Gemma 4 is fallback. No external clinical evidence, FastDRS prediction, or patient-record tool is attached yet. Synthetic examples only. The UI states fallback behavior before users send a message.

## Checks

```sh
pnpm check
pnpm build
pnpm test
pnpm --filter @ijwi/frontend deploy:check
pnpm --filter @ijwi/backend deploy:check
```

Provider tests use mocked network responses and do not incur model requests. Live authentication/model access needs verification with real keys.

## Python tooling

```sh
uv --directory backend/inference sync
uv --directory backend/inference run ruff check app scripts tests
```

Add Python packages with `uv --directory backend/inference add`. Commit uv.lock and pnpm-lock.yaml; never .env or .venv. Frontend variables beginning with VITE_ are public and must not contain secrets.

Workflow: work on `feat/<scope>`, merge finished work into local `dev`, leave pushing to the owner. No browser automation.

Local Vite is pinned to port 5173 (strict). The Node API adapter accepts both http://localhost:5173 and http://127.0.0.1:5173 without .env changes. For a different direct frontend origin, set ALLOWED_ORIGINS to its exact origin (scheme, hostname, and port). Production service-binding requests are origin-validated by the frontend Worker before proxying.

Chat explicitly disables Cloudflare thinking and uses Google minimal thinking for interactive responses. Provider deadlines are 30 seconds each; frontend timeout is 65 seconds. Error messages distinguish credentials/permissions, quota, missing models, timeouts, and missing Google fallback without exposing provider bodies. A missing GOOGLE_API_KEY means there is no configured fallback if Cloudflare fails.

## Image screening

The new `/screen` route is independent of the existing chatbot. See [inference README](backend/inference/README.md) for uv setup, uploads, API schema, model verification, and tests; see [DigitalOcean deployment](backend/inference/DIGITALOCEAN.md) for Docker, HTTPS, costs, and Worker secrets. The application still runs without inference configuration; only screening is unavailable.
