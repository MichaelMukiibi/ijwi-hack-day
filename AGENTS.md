# Repository workflow

- Work in this repository. Use `feat/<scope>` branches; merge completed features into local `dev`.
- Do not push or use browser automation; the owner handles GitHub publishing.
- Preserve the established Ijwi visual design unless a change is requested.
- Frontend: React, strict TypeScript, TanStack Query, pnpm. Use pnpm for JavaScript workspace dependencies and commands.
- Python: uv, pyproject.toml, uv.lock. The isolated Docker/FastDRS service lives in backend/inference.
- Update architecture.md with every feature or architecture change. archtitecture.md is a compatibility pointer only.
- Keep secrets in ignored .env files for local development and Worker secrets in production. Update applicable .env.example files when configuration changes; never place API keys in frontend variables.
- Run relevant type checks, builds, and tests before merging. Distinguish mocked provider tests from live integration verification.
