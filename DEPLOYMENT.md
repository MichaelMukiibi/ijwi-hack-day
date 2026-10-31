# Deploy Ijwi from GitHub to Cloudflare Workers

There are two Workers. Deploy `ijwi-api` first, then `ijwi-hack-day`. This code has been dry-run validated, not deployed. Push the local dev changes yourself, then select the branch you want Cloudflare to deploy.

## Backend Worker

Create/connect a Workers Builds project for this GitHub repository:

- Worker name: `ijwi-api` (must match `backend/wrangler.jsonc`).
- Root directory: repository root.
- Install command, if prompted: `pnpm install --frozen-lockfile`.
- Build command: `pnpm check`.
- Deploy command: `pnpm exec wrangler deploy --config backend/wrangler.jsonc`.

Its Wrangler config creates an `AI` binding for Cloudflare Workers AI and a `CHAT_RATE_LIMITER` binding. Ensure Workers AI is enabled and model access/terms are satisfied for your account.

In the backend Worker's Settings → Variables and Secrets, add `GOOGLE_API_KEY` as a **Secret** to enable fallback. Optional ordinary variables are `CLOUDFLARE_GEMMA_MODEL`, `GOOGLE_GEMMA_MODEL`, and `ALLOWED_ORIGINS`. Defaults are documented in `backend/.env.example`. The deployed AI binding does not need a Cloudflare REST token in application secrets.

For local Node development, copy `backend/.env.example` to `backend/.env` and fill `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` (Workers AI permission) and/or `GOOGLE_API_KEY`. Cloudflare is primary; Google is fallback. Empty files are created locally for convenience and must not be committed. A configured provider is not proof that its key/model access works.

## Frontend Worker

Create/connect another Workers Builds project for the same repository:

- Worker name: `ijwi-hack-day` (must match `frontend/wrangler.jsonc`).
- Root directory: repository root, to preserve the pnpm workspace and root lockfile.
- Install command, if prompted: `pnpm install --frozen-lockfile`.
- Build command: `pnpm --filter @ijwi/frontend build`.
- Deploy command: `pnpm exec wrangler deploy --config frontend/wrangler.jsonc`.

The config is inside `frontend/`; asset and entry paths resolve relative to it. The frontend Worker serves `frontend/dist` and forwards `/api/*` to `ijwi-api` using the `BACKEND` service binding. Both Workers must be on the same Cloudflare account. No Google or Cloudflare API key belongs in frontend variables. Leave `VITE_API_BASE_URL` empty for this proxy design.

## Verification

Open the frontend URL. `/api/health` should return `status: ok`; `capabilities.gemma` reports configured provider availability. Send a synthetic workflow question using Talk to Ijwi and inspect the provider label under the response. Live success must be verified with valid credentials; the fixture previews are separate and labeled sample content.

Test the fallback in a controlled environment by temporarily configuring an invalid primary model and sending a synthetic question, then restore the correct model. The reply should identify Google as fallback. If both providers fail, the UI must show an error, never a cached reply presented as live output.

## Local deployment checks (no upload)

```sh
pnpm build
pnpm --filter @ijwi/frontend deploy:check
pnpm --filter @ijwi/backend deploy:check
```

Real local deployment commands, if you choose to deploy yourself:

```sh
pnpm deploy:backend
pnpm deploy:frontend
```

`.env` is local-only. Production Worker secrets are entered in the Cloudflare dashboard or through `pnpm exec wrangler secret put GOOGLE_API_KEY --config backend/wrangler.jsonc`. Wrangler may deploy a Worker version when setting a secret; run it only when you intend to change the deployment. Do not upload a full development `.env` containing unrelated credentials. Workers Builds authentication is separate from application runtime secrets.
