# Deployment

## Targets

- Static surfaces: Cloudflare Workers static assets
- API runtime: Cloudflare Workers

## Worker Topology

- `kharon-unified-api`
  Production internal Worker
- `kharon-unified-api-staging`
  Staging internal Worker
- `kharon-unified-api-public`
  Production public Worker with static assets from `dist/public`
- `kharon-unified-api-staging-public`
  Staging public Worker with static assets from `dist/public`

The public Workers serve:

- `/`
- `/portal/`
- `/api/v1/*`

The internal Workers remain API-only.

## Build Output

`npm run build` produces:

- `apps/api/dist`
- `apps/site/dist`
- `apps/portal/dist`
- `dist/public`

`dist/public` is assembled by [build-static.mjs](C:/Users/User/KharonOps/KharonOps/scripts/build-static.mjs) and includes:

- the site root build
- the portal build under `/portal`
- `_headers`
- `_redirects`

## Worker Configuration

[wrangler.toml](C:/Users/User/KharonOps/KharonOps/wrangler.toml) defines:

- public asset-backed environments for `public` and `staging-public`
- required secrets for all environments
- Cloudflare Access config for internal environments
- observability for runtime visibility

The public environments use:

- `directory = "./dist/public"`
- `run_worker_first = ["/api/*"]`

That keeps static requests on the asset path while ensuring `/api/*` executes Worker code first.

## Required Secrets

- `SESSION_KEYS`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `WORKBOOK_SPREADSHEET_ID`
- `GOOGLE_DRIVE_ROOT_FOLDER_ID`
- `GOOGLE_JOBCARD_TEMPLATE_ID`
- `GOOGLE_SERVICE_REPORT_TEMPLATE_ID`
- `GOOGLE_CHAT_WEBHOOK_URL`
- `GOOGLE_CALENDAR_ID`
- `GMAIL_SENDER_ADDRESS`

Compatibility fallbacks still supported by runtime:

- `GOOGLE_DOCCARD_TEMPLATE_ID` as a legacy fallback for the jobcard template
- `PORTAL_SESSION_SECRET` as a fallback for `SESSION_KEYS`
- `GOOGLE_SERVICE_ACCOUNT_JSON` as a fallback source for service account credentials
- `KHARON_DOC_TEMPLATE_JOBCARD_ID` as a legacy Kharon alias

## Deploy Steps

1. Install and validate:
   ```bash
   npm install
   npm run check
   ```
2. Deploy staging:
   ```bash
   npx wrangler deploy --env staging
   npx wrangler deploy --env staging-public
   ```
3. Deploy production:
   ```bash
   npx wrangler deploy
   npx wrangler deploy --env public
   ```
4. Validate:
   - `/`
   - `/portal/`
   - `/api/v1/auth/session`
   - `/api/v1/public/contact`
   - `/api/v1/admin/health` with an authenticated admin session

## Cutover Utilities

Workbook migration:

```bash
node scripts/migrate-workbook.mjs
```

Cutover rehearsal:

```bash
node scripts/cutover-rehearsal.mjs
```

Artifacts are written to `dist/cutover`.
