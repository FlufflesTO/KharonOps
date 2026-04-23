# Phase 1 Production Implementation

## Objective

Launch the current architecture safely:

- Cloudflare Workers for the API
- Cloudflare Workers static assets for the public site and portal
- Google Workspace rails for operational integrations
- Google Sheets as the temporary canonical store

This phase is about shipping the current system safely, not replacing major infrastructure.

## Required Inputs

- final production domain names
- final staging domain names
- Cloudflare account and Worker ownership
- Google Cloud service account
- production workbook, Drive root, Docs templates, Calendar, Gmail sender, and Chat webhook
- two high-entropy session keys

## Production Checklist

### Step 1: Finish public-site content freeze

1. Replace remaining illustrative proof points and example projects.
2. Confirm service coverage wording and contact details.
3. Reflect the live portal role set and support intake flow.
4. Freeze marketing copy for the first production launch.

### Step 2: Lock final domains

Choose and document final domains:

1. `www` or root domain for the public site
2. `portal` domain or `/portal/` path for the portal
3. `api` domain only if you later split API from the public Worker

Do not leave the long-term public launch only on `workers.dev`.

### Step 3: Create clear environments

You need at least:

1. local
2. staging
3. production

Isolate per environment:

- workbook ID
- Drive root folder
- Docs template IDs
- session secrets
- Google sender/calendar/chat integrations
- Worker hostname

### Step 4: Standardize environment variables

Review and complete:

- `.env.example`
- `wrangler.toml`

Required secrets:

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

### Step 5: Harden public static delivery

Confirm:

1. `dist/public` is generated successfully.
2. `_headers` contains the expected CSP, cache, and robots rules.
3. `_redirects` contains `/portal -> /portal/`.
4. `wrangler.toml` public environments point their assets directory at `dist/public`.

### Step 6: Harden Worker configuration

Confirm:

1. `kharon-unified-api` remains internal or Access-protected.
2. `kharon-unified-api-public` serves static assets plus `/api/*`.
3. observability is enabled.
4. cookie and Access settings match the final environment.

### Step 7: Lock session and auth posture

Validate:

1. at least two high-entropy session keys
2. `httpOnly`, `secure`, and `sameSite=Lax` cookie behavior
3. Google ID token verification in staging and production
4. no client role claims are trusted
5. admin endpoints require the correct role server-side

### Step 8: Validate Google rails before cutover

Check:

1. Sheets
2. Drive
3. Docs templates
4. Calendar
5. Gmail sender
6. Chat webhook

### Step 9: Run the production gate locally

```bash
npm install
npm run check
node scripts/migrate-workbook.mjs
node scripts/cutover-rehearsal.mjs
```

### Step 10: Deploy staging first

```bash
npx wrangler deploy --env staging
npx wrangler deploy --env staging-public
```

Smoke test:

1. public site load
2. portal load
3. portal login
4. session fetch
5. jobs list
6. status update
7. note write
8. schedule request
9. document generation
10. document publish
11. client support intake
12. admin health

### Step 11: Run production cutover

1. Freeze non-critical changes.
2. Deploy internal Worker.
3. Deploy public Worker.
4. Execute smoke sequence.
5. Enable client access only after internal validation passes.

### Step 12: Hypercare

For the first 24 to 72 hours:

1. review `/api/v1/admin/health`
2. review audit outputs
3. review sync conflict rate
4. review Google integration success and failures
5. track response-path latency and API failures
