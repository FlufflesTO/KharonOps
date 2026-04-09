# Kharon Unified Rebuild v1

[![Netlify Status](https://api.netlify.com/api/v1/badges/6cfc13ea-cf68-4281-b196-85fa6a4fc555/deploy-status)](https://app.netlify.com/projects/kharonop/deploys)

Unified public website + operations PWA for Kharon Fire and Security Solutions, with Cloudflare Worker API and Netlify static hosting.

## Stack

- Node.js 22+
- npm workspaces monorepo
- TypeScript-first
- Hono on Cloudflare Workers (`/api/v1/*`)
- Vite React apps for `site` and `portal`
- Google Workspace rails (Sheets/Drive/Docs/Calendar/Gmail/Chat/People)

## Monorepo

- `apps/site` marketing site
- `apps/portal` unified role-based PWA (client/technician/dispatcher/admin)
- `apps/api` Worker API
- `packages/domain` domain rules, schemas, envelopes, RBAC
- `packages/google` Google adapters and retry/error mapping
- `packages/ui` shared tokens/styles
- `tests/*` unit/integration/contract/offline suites
- `docs/*` architecture, API, security, deployment, cutover/rollback

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy and fill environment variables:
   - use `.env.example`
   - keep secrets in `.env` (never commit)
3. Validate:
   ```bash
   npm run check
   npm run build
   npm run test
   npm run lint
   ```

## Netlify Build Settings

- Repository: `FlufflesTO/KharonOps`
- Base directory: `/` (empty in UI)
- Build command: `npm run build`
- Publish directory: `dist/public`
- Functions directory: leave empty (not required for this architecture)
- Node runtime: `22`
- Framework preset: `Other`

`netlify.toml` already includes:
- `/portal` -> `/portal/` redirect
- `/api/*` proxy to Cloudflare Worker origin
- security headers + CSP

Production guidance:
- Do not load dev-bypass variables into Netlify production context.
- Keep backend-only secrets on Cloudflare Worker, not Netlify static build, unless strictly needed.

## Netlify CLI In This Monorepo

This repository has multiple npm workspace projects, so Netlify CLI must be called with a filter to avoid:
`Projects detected: @kharon/api, @kharon/portal, ...`.

Use:

```bash
npx netlify deploy --no-build --dir dist/public --site kharonop --filter @kharon/site --json
```

Trigger a production rebuild from Netlify without local upload:

```bash
curl -X POST -d {} https://api.netlify.com/build_hooks/69d81c8f76f6aef12b671b6b
```

Build hook:
- `stackbit-build-hook`
- `https://api.netlify.com/build_hooks/69d81c8f76f6aef12b671b6b`

Treat build hook URLs as sensitive trigger credentials. Rotate if exposed.

## Cloudflare Worker Settings

- Worker name: `kharon-unified-api`
- Entrypoint: `apps/api/src/index.ts`
- Root directory for Git builds: `/`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Non-production deploy command: `npx wrangler versions upload`

Runtime config is in `wrangler.toml`.

## Cloudflare Access (Optional, Hardened Mode)

If Access is enabled on Worker routes, enable server verification with:

- `CF_ACCESS_ENABLED=true`
- `CF_ACCESS_AUD=<audience>`
- `CF_ACCESS_JWKS_URL=https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`
- `CF_ACCESS_ISSUER=https://<team>.cloudflareaccess.com` (recommended)

The API then enforces `Cf-Access-Jwt-Assertion` on `/api/v1/*`.

## Deployment Flow

1. Push branch to GitHub.
2. Deploy Worker:
   ```bash
   npx wrangler deploy
   ```
3. Let Netlify build/deploy static bundle.
4. Smoke-test:
   - `/`
   - `/portal/`
   - authenticated `/api/v1/auth/session`
   - authenticated admin `/api/v1/admin/health`

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [API Spec](docs/API_SPEC.md)
- [Workbook Schema](docs/WORKBOOK_SCHEMA.md)
- [Security Model](docs/SECURITY_MODEL.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Cutover Runbook](docs/CUTOVER_RUNBOOK.md)
- [Rollback Runbook](docs/ROLLBACK_RUNBOOK.md)
- [Test Matrix](docs/TEST_MATRIX.md)
