# FlowRunner Deployment Runbooks

These runbooks document the exact steps needed to promote FlowRunner through staging to production with reproducible, observable pipelines.

## 1. Prerequisites
- Node.js 20+, npm 10+
- Access to the Git repository with branch protection enabled for required checks (**CI / Lint** and **CI / Test**).
- Access to the target database (staging + production) and OpenAI credentials.
- Populate `.env.staging` and `.env.production` from the provided templates in the repo root.

## 2. Environment Preparation
1. Copy the appropriate template:
   ```bash
   cp .env.staging.example .env.staging
   cp .env.production.example .env.production
   ```
2. Fill the database URL, OpenAI keys/models, public URLs, and observability webhook targets.
3. Pull remote settings to avoid drift (for Vercel deployments):
   ```bash
   vercel env pull .env.production
   vercel env pull .env.staging
   ```
4. Generate Prisma client and apply migrations against the target database:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

## 3. CI + Merge Gating
- GitHub Actions workflow `.github/workflows/ci.yml` runs `npm run lint` and `npm test` on every push and pull request.
- Protect the `main` branch with required status checks for both jobs to **block merges when either fails**.
- Local pre-push sanity check:
  ```bash
  npm ci
  npm run lint
  npm test
  ```

## 4. Deployment Flow
1. Create or update a PR. CI must pass before merging.
2. Merge to `main` to trigger production deployment (Vercel) or deploy manually with `vercel deploy --prod` once migrations have been applied.
3. For staging validation, deploy from a feature branch or run `vercel deploy` with staging environment variables loaded.

## 5. Health & Telemetry Verification
- API health: `GET /api/health` returns database connectivity and emits a `health_check` telemetry event.
- Queue health: `GET /api/health/queues` surfaces pending/processing/completed/failed counts for image generation queues and logs telemetry for observability hooks.
- Renderer/pattern telemetry remains available via existing `/api/patterns/health` endpoints.

## 6. Production Smoke Test Checklist
- Hit `/api/health` and `/api/health/queues` and confirm `status: ok`.
- Generate a flow via the UI; confirm hero image generation and palette extraction succeed.
- Validate persistence by creating a flow and verifying it appears in the database.
- Review telemetry dashboards fed by `PIPELINE_TELEMETRY_ENDPOINT` and `QUEUE_HEALTH_WEBHOOK` to ensure pipeline stages and workers are reporting.

## 7. Rollback/Recovery
- Redeploy the previous successful build via `vercel deploy --prod --prebuilt`.
- If migrations caused issues, restore from the latest database snapshot and redeploy the prior build.
- Drain or pause image generation queues by scaling down workers if queue health shows runaway failures, then re-enable once the root cause is resolved.
