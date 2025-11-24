## FlowRunner → Vercel Deployment Guide

This document captures everything you need to promote FlowRunner’s Next.js app to Vercel in a reproducible way.

### 1. Prerequisites
- Vercel account with access to the Git repository (GitHub/GitLab/Bitbucket).
- Local tooling: Node 18+, npm 10+, `vercel` CLI (`npm i -g vercel`).
- Production-ready database (Postgres is recommended; SQLite files cannot be used in Vercel’s serverless runtime).
- OpenAI API access for text/intent/image generation.

### 2. Project Preparation (local)
```bash
cd /Users/justincollins/CursorProjects/Flowrunner
npm install
npm run lint && npm run test
```

Make sure `prisma/schema.prisma` points at the provider you want in production (`postgresql` when using Neon/Vercel Postgres). Commit any schema updates before deploying.

### 3. Environment Variables
Add these inside **Vercel → Project → Settings → Environment Variables**. Use `vercel env pull .env.production` afterwards so local commands can target the same values.

| Key | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Prisma datasource (e.g. `postgresql://...`). Needed at build and runtime. |
| `OPENAI_API_KEY` | ✅ | Required by all OpenAI providers. |
| `OPENAI_TEXT_MODEL` | optional | Override text model (defaults to `gpt-5-mini`). |
| `OPENAI_INTENT_MODEL` | optional | Override intent model (defaults to `gpt-5-mini`). |
| `OPENAI_IMAGE_MODEL` | optional | Override image model (defaults to `dall-e-3`). |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Canonical site origin used in sharing links. Set to `https://<your-domain>`. |
| `NEXT_PUBLIC_APP_URL` | ✅ | Used by the renderer/editor when forming absolute links. Usually same as `NEXT_PUBLIC_SITE_URL`. |
| `NEXT_PUBLIC_ASSET_BASE_URL` | optional | Only needed if assets live somewhere other than the deployed domain/CDN. |
| `PATTERN_PREVIEW_BASE_URL` | optional | Only used when running `npm run patterns:previews`. Safe to omit in production. |

Vercel automatically injects `VERCEL_URL`, so links fall back gracefully if the public URL vars are missing, but setting them keeps all sharing features deterministic.

### 4. Database Setup
1. Provision a serverless Postgres instance (Vercel Postgres, Neon, Supabase, etc.).  
2. Grab the connection string (include `?pgbouncer=true&connect_timeout=15` if using Neon with PgBouncer).  
3. Update `DATABASE_URL` in your local `.env` and run:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```
   Run the same commands whenever the schema changes. For the first production migration, call `npx prisma migrate deploy` locally with `DATABASE_URL` pointing at the production database, then trigger a new deploy so Vercel builds against the migrated schema.

### 5. Create / Link the Vercel Project
#### Option A: Vercel Dashboard
1. Import the Git repository.
2. Framework preset: **Next.js** (auto-detected).
3. Root directory: repository root.
4. Build settings (already mirrored in `vercel.json`):
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Node.js version: set to **20.x** under “Environment → Build & Development Settings”.
6. Save, then add the environment variables from Section 3.

#### Option B: CLI
```bash
vercel login
vercel link  # choose the FlowRunner project
vercel env pull .env.production
```

### 6. Deployment Flow
1. **Preview deploys** happen automatically on every PR push once the repo is connected. Vercel injects `VERCEL_URL`, so previews work without extra configuration.
2. **Production deploy**: merge into the main branch (or run `vercel deploy --prod` from the CLI). Ensure the production DB is already migrated.
3. If you need to redeploy the latest build without pushing code, run `vercel deploy --prod --prebuilt`.

### 7. Post-Deploy Verification
Run through these checks after each production deploy:
- `vercel logs <deployment-url>` – confirm API routes (`/api/generate`, `/api/images/*`, etc.) are healthy.
- Visit `/flow-playground`, `/renderer-preview`, `/test-renderer` to ensure client components render with the correct container layouts.
- Trigger a sample flow generation; confirm hero image generation succeeds (ensures `OPENAI_API_KEY` is live).
- Create/restore a flow to make sure Prisma reads/writes succeed against the remote DB.

### 8. Troubleshooting Tips
- **Prisma client errors** – usually caused by missing migrations or an incompatible `DATABASE_URL`. Re-run `npx prisma migrate deploy` against the target database.
- **Image generation failures** – double-check `OPENAI_API_KEY` and confirm the account has access to DALL·E 3 or the configured image model.
- **Absolute links wrong** – set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_APP_URL`.
- **Build timeouts** – keep large test suites off the default workflow; Vercel only runs `npm run build`. Run `npm run test`/`npm run lint` in CI instead.
- **Environment drift** – routinely run `vercel env pull .env.production` locally so scripts that hit production services (e.g., migrations, manual exports) stay in sync.

With this checklist in place you can go from repo clone → production deployment in under ten minutes, and every engineer has a single source of truth for the knobs that affect FlowRunner in Vercel.

