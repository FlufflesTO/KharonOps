# Deployment

## Targets

- Static surfaces: Netlify
- API runtime: Cloudflare Workers

## Dashboard Setup Values

### Netlify (single project for this monorepo)

- Project to deploy: `FlufflesTO/KharonOps` (repo root)
- Base directory (Root Directory): leave empty or `/`
- Build command: `npm run build`
- Publish directory (Build output): `dist/public`
- Framework preset: `Other`
- Node version: `22` (set in Netlify env if needed)

Netlify is hosting both:
- `/` -> marketing site
- `/portal/` -> unified portal PWA

### Cloudflare Workers (API project)

- Worker name: `kharon-unified-api` (from `wrangler.toml`)
- Entrypoint: `apps/api/src/index.ts`
- Compatibility date: `2026-04-09`
- Root Directory (if Git-connected build): repo root `/`
- Framework: none / Workers
- Deploy command (CI/manual): `npx wrangler deploy`

## Build Output

`npm run build` produces:
- `apps/api/dist` (Worker build artifacts)
- `apps/site/dist` (public site)
- `apps/portal/dist` (portal PWA)
- `dist/public` (combined static bundle for Netlify)

## Netlify Configuration

`netlify.toml` is configured to:
- publish `dist/public`
- proxy `/api/*` to Worker origin
- enforce secure response headers

Important:
- Update `netlify.toml` redirect target from placeholder to your real Worker URL:
  - `https://kharon-api.example.workers.dev` -> your deployed Cloudflare worker origin
- Update CSP `connect-src` to that same real origin.

### Required Netlify Environment Variables

Required:
- `NODE_VERSION=22`

Optional for future build/runtime metadata:
- `NETLIFY_WORKER_ORIGIN`
- `SITE_URL`

### Netlify CLI With npm Workspaces

This repository is an npm workspaces monorepo. Netlify CLI needs an explicit filter to avoid interactive project selection errors.

Use:

```bash
npx netlify deploy --no-build --dir dist/public --site kharonop --filter @kharon/site --json
```

## Cloudflare Worker Configuration

`wrangler.toml` defines worker entrypoint and compatibility date.

### Required Worker Secrets/Vars
- `KHARON_MODE`
- `SESSION_KEYS`
- `SESSION_COOKIE_NAME`
- `SESSION_TTL_SECONDS`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `WORKBOOK_SPREADSHEET_ID`
- `GOOGLE_DRIVE_ROOT_FOLDER_ID`
- `GOOGLE_DOCCARD_TEMPLATE_ID`
- `GOOGLE_SERVICE_REPORT_TEMPLATE_ID`
- `GOOGLE_CHAT_WEBHOOK_URL`
- `GOOGLE_CALENDAR_ID`
- `GMAIL_SENDER_ADDRESS`

Optional Cloudflare Access JWT verification at app layer:
- `CF_ACCESS_ENABLED=true`
- `CF_ACCESS_AUD=<access-audience>`
- `CF_ACCESS_JWKS_URL=https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`
- `CF_ACCESS_ISSUER=https://<team>.cloudflareaccess.com` (optional, recommended)
- `CF_ACCESS_JWKS_JSON=<jwks-json>` (optional local/test alternative to URL)

Compatibility aliases already supported by runtime (no code changes required):
- `PORTAL_SESSION_SECRET` as fallback for `SESSION_KEYS`
- `GOOGLE_SERVICE_ACCOUNT_JSON` as fallback source for:
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `KHARON_JOBS_SPREADSHEET_ID` as fallback for `WORKBOOK_SPREADSHEET_ID`
- `KHARON_DRIVE_ROOT_FOLDER_ID` as fallback for `GOOGLE_DRIVE_ROOT_FOLDER_ID`
- `KHARON_DOC_TEMPLATE_JOBCARD_ID` as fallback for `GOOGLE_DOCCARD_TEMPLATE_ID`
- `KHARON_DOC_TEMPLATE_SERVICE_REPORT_ID` as fallback for `GOOGLE_SERVICE_REPORT_TEMPLATE_ID`
- `KHARON_CHAT_WEBHOOK_URL` as fallback for `GOOGLE_CHAT_WEBHOOK_URL`
- `KHARON_CALENDAR_ID` as fallback for `GOOGLE_CALENDAR_ID`
- `KHARON_GMAIL_FROM` as fallback for `GMAIL_SENDER_ADDRESS`

## Deployment Steps

1. Install and validate:
   ```bash
   npm install
   npm run check
   npm run build
   npm run test
   npm run lint
   ```
2. Deploy Worker:
   ```bash
   npx wrangler deploy
   ```
3. Deploy Netlify static bundle (`dist/public`).
4. Validate:
   - `/`
   - `/portal/`
   - `/api/v1/admin/health` (authenticated admin session)

## Cloudflare Access + Netlify Proxy Note

If Netlify proxies `/api/*` to a Worker origin protected by Cloudflare Access, requests may return Access challenge HTML instead of API JSON unless a valid Access JWT is present.

Use one of these production-safe patterns:
1. Keep Access enabled and ensure API requests include a valid `Cf-Access-Jwt-Assertion` token.
2. Use a non-Access-protected origin specifically for Netlify proxy traffic (recommended for public client portal flows).

### Recommended Production Pattern (Implemented)

- Keep `kharon-unified-api` as internal Access-protected origin.
- Deploy `kharon-unified-api-public` for Netlify proxy traffic.
- Proxy `/api/*` from Netlify to `https://kharon-unified-api-public.connor-venter.workers.dev/api/:splat`.

## Workbook Migration

After Worker deployment and secrets setup:

```bash
node scripts/migrate-workbook.mjs
```

## Cutover Rehearsal

```bash
node scripts/cutover-rehearsal.mjs
```

Artifacts generated in `dist/cutover`:
- `cutover-rehearsal.json`
- `rollback-bundle.txt`
