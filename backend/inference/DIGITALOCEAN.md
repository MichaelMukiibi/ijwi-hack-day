# DigitalOcean deployment: CPU screening within a $25 credit budget

## Deployment choice

Start with **one Basic Droplet: 1 vCPU, 2 GiB RAM, $12/month**. DigitalOcean currently lists this size at **$0.01786/hour**. Use a region near your expected users, Ubuntu 24.04, and Docker Compose. No GPU, managed database, load balancer, paid registry, or attached volume is needed for this feature. Measure memory after deploying; the compose service has a 1,500 MiB memory ceiling.

At the listed base rate, $25 covers roughly two months of this one $12/month server, excluding other account resources, taxes, and optional services. Set a billing alert and check credit expiry before creating the Droplet; an alert is not a hard spending cap. Do not select automatic paid backups or extras for this demo. A powered-off Droplet is still billable (see [DigitalOcean destruction guidance](https://docs.digitalocean.com/products/droplets/how-to/destroy/)): destroy the dedicated demo Droplet when finished if you want compute charges to stop.

Pricing reference, checked October 31, 2026: [DigitalOcean Droplets](https://www.digitalocean.com/pricing/droplets). This repository does not provision or spend credits automatically. No live DigitalOcean deployment or Docker build is claimed by the local tests.

## 1. Prepare the Droplet

Create the dedicated Basic Droplet in your DigitalOcean account. Add your SSH key. Install Docker Engine and the Compose plugin using [Docker's official Ubuntu instructions](https://docs.docker.com/engine/install/ubuntu/), or choose DigitalOcean's Docker-ready image if available. Confirm `docker compose version` works.

Use a domain such as `screen.your-domain.example` with an A record pointing to the Droplet IP. Initially use a DNS-only record while obtaining the TLS certificate. Allow inbound SSH from your own IP and HTTP/HTTPS (80/443); do not publicly expose port 8000. Both Cloudflare Workers remain deployed separately.

No domain? DigitalOcean App Platform can supply HTTPS for a Docker service, but its [2 GiB tier](https://www.digitalocean.com/pricing/app-platform) is currently $25/month and consumes the whole stated budget. Confirm its current price and memory fit before choosing that alternative. The Droplet instructions below assume a domain and Caddy-managed HTTPS.

## 2. Get this feature onto the server

Push the completed local dev changes to your repository first, then on the Droplet:

```sh
git clone --branch dev https://github.com/MichaelMukiibi/ijwi-hack-day.git
cd ijwi-hack-day/backend/inference
cp .env.example .env
```

Set a long random `FASTDRS_API_TOKEN` in `.env`. Keep `FASTDRS_MODEL_PATH=models/mobilenet_v2.pth` for the built-in verified checkpoint. Restrict permissions with `chmod 600 .env`. The token must exactly match the backend Worker's secret; never put it in React variables or GitHub source.

Build and start only this service:

```sh
docker compose build
docker compose up -d
docker compose ps
curl --fail http://127.0.0.1:8000/readyz
```

The first build downloads CPU wheels and the fixed 9 MB checkpoint. Readiness may take longer on first startup. Compose binds only to 127.0.0.1. There is one Uvicorn worker and one inference slot to limit memory use and protect the non-thread-safe model execution path.

## 3. Enable HTTPS

Install Caddy using its [official packaged installation](https://caddyserver.com/docs/install). Edit the supplied `Caddyfile`, replacing `screen.example.com` with your actual domain, then use it as `/etc/caddy/Caddyfile`. Validate and reload:

```sh
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy serves HTTPS and proxies to localhost:8000, with a 6 MB HTTP body cap. Verify:

```sh
curl --fail https://screen.your-domain.example/readyz
```

Do not disable TLS verification or expose an unauthenticated inference endpoint to get around a setup problem. The public `/healthz`, `/readyz`, `/docs`, and `/openapi.json` endpoints contain no keys or patient data; `/v1/screen` requires the bearer token. The app does not enable browser CORS because uploads reach it server-to-server through the Worker.

## 4. Configure the existing backend Worker

In Cloudflare **Workers & Pages → ijwi-api → Settings → Variables and Secrets**:

| Name | Type | Value |
| --- | --- | --- |
| FASTDRS_API_URL | Variable | https://screen.your-domain.example, without /v1/screen |
| FASTDRS_API_TOKEN | Secret | Same token as the inference service's .env |
| SCREENING_CONTEXT_SECRET | Secret | A separate random secret, at least 32 characters |

Keep existing `AI` and Google fallback settings. The new settings are used only for screening endpoints and do not change the general chatbot's prompt or credentials. Store production secrets in the dashboard or enter them with `pnpm exec wrangler secret put NAME --config backend/wrangler.jsonc` when you intend to change a deployed version.

Deploy the updated backend Worker and frontend using the existing scripts. The frontend's existing BACKEND service binding forwards the new `/api/screen*` paths automatically. No new API keys go into the frontend. Keep VITE_API_BASE_URL empty for same-origin routing.

## 5. Verify the complete feature

1. Open the frontend's `/api/screen/health`: expect `{configured:true, ready:true}`.
2. Open `/screen`, choose an authorized JPEG/PNG fundus demonstration image, and run screening.
3. Confirm a real predicted class, all five scores, model version, and model/image hashes appear. These are research outputs, not clinical claims.
4. Select **Explain this result**. Confirm Gemma discusses the attached result without pretending it examined the image.
5. Run a second image: the previous result conversation must be replaced so context does not mix between images.
6. Open `/#chat` and verify the original chatbot still works.
7. Stop the dedicated inference container temporarily: `/screen` should fail clearly, while the general chatbot continues to work. Restart afterward.

## Operations and troubleshooting

- `docker compose logs --tail 100 inference`: startup and failure categories; image bodies and API tokens are not logged by this app.
- `docker stats --no-stream`: measure memory and CPU before leaving it running.
- Readiness 503: confirm model file/checksum, installed CPU dependencies, and nonempty token. Model files are baked into the image; do not mount an empty folder over `/app/models`.
- Worker credential error: FASTDRS_API_TOKEN must match byte-for-byte in Docker and Cloudflare.
- Worker model-not-ready error: inspect `/readyz` and container logs; never replace failure with a fake prediction.
- Result-context error after an hour or after rotating SCREENING_CONTEXT_SECRET: run screening again.
- 429: only one prediction executes at a time. Retry after it finishes; the Worker also limits repeated requests per IP.
- OOM/restarts: confirm one process and no CUDA dependencies, inspect actual memory, then reassess hosting size against remaining credits.
- Updating: pull the intended dev revision and run `docker compose up -d --build`. Retain the previous commit ID for rollback.

## Rollback and stopping costs

Removing FASTDRS_API_URL or stopping the inference service disables only screening. Do not remove or replace the existing `/api/chat` implementation. To roll back, check out the previously verified feature revision on the dedicated server and rebuild this compose project. Images/results are not durably stored by the application.

`docker compose down` stops the containers but does not stop DigitalOcean Droplet billing. After the demo, retain any needed source/configuration safely and destroy the dedicated Droplet through DigitalOcean if it is no longer needed. Do not delete other account resources. Check the billing page afterward for remaining resources and credit usage.
