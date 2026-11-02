# Deploy screening on Render

The repository-root `render.yaml` builds the existing screening Dockerfile.
It selects one Standard service (1 CPU, 2 GB RAM), port 8000, and `/readyz`
health checks. Automatic deploys are disabled. The verified model is baked into
the image; no persistent disk or database is required. Render provides HTTPS.

1. Publish these changes to GitHub using your usual workflow.
2. In Render, choose **New > Blueprint**, connect the repository, and select the
   branch containing `render.yaml`.
3. Review the current price before applying. Your $25 credit is a balance, not a
   spending cap. Check eligibility, expiry, and billing in your dashboard.
4. Enter `FASTDRS_API_TOKEN` when prompted, using the same long random secret as
   the backend Worker. Never commit this secret or place it in the frontend.
5. Apply the Blueprint and watch build/runtime logs. The build installs CPU
   PyTorch and downloads the checksum-verified model.
6. Verify `https://<your-service>.onrender.com/readyz` returns HTTP 200.

For manual Web Service creation instead: Root Directory `backend/inference`,
Dockerfile Path `./Dockerfile`, Docker Build Context `.`, health check `/readyz`,
and environment values as in the Blueprint. Leave Docker Command blank.
Blueprint Docker paths are relative to the repository root.

## Connect the backend Worker

Set these production secrets through the Cloudflare dashboard:

- `FASTDRS_API_URL`: Render's HTTPS base URL, without `/v1/screen`.
- `FASTDRS_API_TOKEN`: the matching Render service secret.
- `SCREENING_CONTEXT_SECRET`: preserve the existing value, or create a separate
  random secret of at least 32 characters if absent.

Redeploy the Worker if required to activate configuration. Check
`/api/screen/health`, open `/screen`, upload a synthetic test image, and verify
the result and its separate conversation. This checks the software path, not
clinical accuracy. Keep credentials server-side.

If readiness fails, inspect Render logs for model-load or missing-token errors.
Inspect memory metrics before upgrading plans and review any added cost.
Suspend or delete the service when the demo is finished to stop compute use.

## Verification limits

No Render resources are created by adding these files. Docker is unavailable in
the authoring environment; container build, Render startup, memory usage, and
the hosted end-to-end flow still require verification after deployment.

References: [Docker](https://render.com/docs/docker),
[Blueprint fields](https://render.com/docs/blueprint-spec),
[compute plans](https://render.com/docs/compute-plans),
[pricing](https://render.com/pricing).
