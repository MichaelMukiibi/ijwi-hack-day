# Local development

The landing page is dependency-free HTML, CSS, and JavaScript in `public/`. No AI, image processing, or patient storage is connected in this feature. All workspace-preview content is explicitly illustrative.

Preview with Python from the repository root:

```sh
python -m http.server 3000 --directory public
```

Open http://localhost:3000. Switch the three workspace-preview tabs using a pointer or the arrow, Home, and End keys.

`wrangler.jsonc` defines a Cloudflare Workers static-assets deployment. With Wrangler installed in your development environment, use `wrangler dev` for Cloudflare's local preview. Deployment is a separate action and has not been performed.

Run `node --check public/app.js` for JavaScript syntax validation. No external fonts, scripts, or image services are required.

Workflow: `feat/<scope>` branches merge into local `dev`; the owner pushes changes.
