# Deployment

## Targets

- Static surfaces: Netlify
- API runtime: Cloudflare Workers

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

### Required Netlify Environment Variables
- `NETLIFY_WORKER_ORIGIN`
- `GOOGLE_CLIENT_ID` (for frontend context if exposed intentionally)

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
