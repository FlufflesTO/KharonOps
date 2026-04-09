# Kharon Unified Rebuild v1

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
