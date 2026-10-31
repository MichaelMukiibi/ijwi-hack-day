# Local development

Requires Node.js 20.19+ or 22.12+ and npm. From the repository root:

```sh
npm install
npm run dev:backend
```

In a second terminal:

```sh
npm run dev:frontend
```

Open the Vite URL (normally http://127.0.0.1:5173). The frontend proxies `/api` to the backend on port 8787. TanStack Query handles fetching, cancellation, caching, and errors. Switch the workspace tabs to request real HTTP responses containing explicitly labeled sample data. Stop the backend to inspect the error and retry states.

## Layout

- `frontend/`: React, Vite, TanStack Query, original landing-page styling and illustration.
- `backend/`: Cloudflare-compatible Request/Response handler and dependency-free Node development server. This is the application API; a future Docker/FastDRS inference service remains separate.
- `backend/src/handler.js`: GET `/api/health`, GET `/api/preview/{case|conversation|summary}`. Unknown routes return 404; unsupported methods return 405.

No inference, live AI, case persistence, or patient data is involved yet. Preview responses are fixtures served by the backend, not model outputs.

`frontend/.env.example` documents the optional `VITE_API_BASE_URL`. Default to the same origin; never put secrets in frontend variables. A cross-origin API requires an explicit backend CORS policy, which is not enabled here. The root Wrangler configuration serves the frontend build and routes `/api/*` through the backend handler in the same Worker, keeping production requests on the same origin. Build before deploying. `backend/wrangler.jsonc` is an optional standalone API Worker configuration. Neither has been deployed.

```sh
npm run build
npm test
```

Workflow: work on `feat/<scope>`, merge finished work into local `dev`, and leave pushes to the owner.
