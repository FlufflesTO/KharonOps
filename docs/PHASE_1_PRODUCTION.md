# Phase 1 Production Implementation

## Objective

Launch the current architecture safely:

- Netlify for static delivery
- Cloudflare Workers for the API
- Google Workspace rails for operational integrations
- Google Sheets as the temporary canonical store

This phase is about shipping the current system safely, not replacing major infrastructure.

## Required Inputs

Before starting, confirm these exist:

- final production domain names
- final staging domain names
- Cloudflare account and Worker ownership
- Netlify project ownership
- Google Cloud service account
- production workbook, Drive root, Docs templates, Calendar, Gmail sender, Chat webhook
- two high-entropy session keys

## Production Checklist

### Step 1: Finish public-site content freeze

Do this before infra work:

1. Replace remaining illustrative proof points and example projects.
2. Confirm service coverage wording and contact details.
3. Freeze marketing copy for the first production launch.

Files:

- `apps/site/src/App.tsx`
- `apps/site/index.html`

### Step 2: Lock final domains

Choose and document final domains:

1. `www` domain for the public site
2. `portal` domain or `/portal/` path for the portal
3. `api` domain or Cloudflare-routed Worker hostname for the API

Then update:

- `netlify.toml`
- `.env.example`
- `docs/DEPLOYMENT.md`

Decisions:

- If keeping Netlify in front, keep `/api/*` proxying to the Cloudflare public Worker.
- Do not leave `workers.dev` as the final public customer-facing API hostname if you can avoid it.

### Step 3: Create clear environments

You need at least:

1. local
2. staging
3. production

For each environment, isolate:

- workbook ID
- Drive root folder
- Docs template IDs
- session secrets
- Google sender/calendar/chat integrations
- Worker URL

Do not share production credentials with staging.

### Step 4: Standardize environment variables

Review and complete:

- `.env.example`
- `wrangler.toml`
- Netlify environment variables in the dashboard

Cloudflare Worker secrets and vars:

- `SESSION_KEYS`
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

Worker config already exists in:

- `wrangler.toml`

Important:

- The API should fail fast in production if session keys are weak or required Google rails values are missing.
- Do not allow production deployments to silently fall back to local rails behavior.

### Step 5: Harden Netlify configuration

Update `netlify.toml` and Netlify dashboard settings:

1. Confirm publish output is `dist/public`.
2. Confirm build command is `npm run build:web` or `npm run build`, depending on your release process.
3. Replace any placeholder Worker proxy origin with the final public Worker origin.
4. Tighten CSP `connect-src` to only the final API domain.
5. Re-enable secrets scanning before production if it was disabled only for setup convenience.

Files:

- `netlify.toml`
- `README.md`
- `docs/DEPLOYMENT.md`

### Step 6: Harden Cloudflare Worker configuration

Update `wrangler.toml`:

1. Keep `kharon-unified-api` as the internal or Access-protected origin.
2. Keep `kharon-unified-api-public` as the public portal API origin.
3. Turn on observability and logging for production.
4. Confirm cookie and Access settings match the final environment.

Files:

- `wrangler.toml`

### Step 7: Lock session and auth posture

Validate the production auth model already described in:

- `docs/SECURITY_MODEL.md`
- `apps/api/src/config.ts`
- `apps/api/src/auth/*`
- `apps/api/src/middleware/auth.ts`

Checklist:

1. Use at least two high-entropy session keys.
2. Confirm `httpOnly`, `secure`, and `sameSite=Lax` cookie behavior on final domains.
3. Confirm Google ID token verification works in staging and production.
4. Confirm no client role claims are trusted anywhere.
5. Confirm admin endpoints require the correct role server-side.

### Step 8: Validate Google rails before cutover

Run a full permissions and template check for:

1. Sheets
2. Drive
3. Docs templates
4. Calendar
5. Gmail sender
6. Chat webhook

Checklist:

1. Service account can read and write the workbook.
2. Service account can create documents in the correct Drive folder.
3. Jobcard and service report templates render successfully.
4. Calendar writes succeed.
5. Gmail sends from the correct address.
6. Chat notifications land in the correct space.

### Step 9: Run the production gate locally

From repo root:

```bash
npm install
npm run check
npm run build
npm run test
npm run lint
node scripts/migrate-workbook.mjs
node scripts/cutover-rehearsal.mjs
```

Do not skip the rehearsal artifact review in `dist/cutover`.

### Step 10: Deploy staging first

Deploy the Worker and static bundle to staging before touching production.

Commands:

```bash
npx wrangler deploy --env staging
npx wrangler deploy --env staging-public
```

For production:

```bash
npx wrangler deploy
npx wrangler deploy --env public
```

Then deploy the static site to the staging Netlify site.

Run smoke tests:

1. public site load
2. portal login
3. session fetch
4. jobs list
5. status update
6. note write
7. schedule request
8. schedule confirm
9. document generation
10. document publish
11. admin health

### Step 11: Run production cutover

Use these runbooks:

- `docs/CUTOVER_RUNBOOK.md`
- `docs/ROLLBACK_RUNBOOK.md`

Production order:

1. Freeze non-critical changes.
2. Deploy internal Worker.
3. Deploy public Worker.
4. Deploy Netlify static bundle.
5. Execute smoke sequence.
6. Enable client access only after internal validation passes.

### Step 12: Hypercare

For the first 24 to 72 hours:

1. Review `/api/v1/admin/health`
2. Review audit outputs
3. Review sync conflict rate
4. Review Google integration success and failures
5. Track response-path latency and API failures

## Exit Criteria

This phase is done when:

1. The public site and portal are live on final domains.
2. Auth and RBAC work in production.
3. Controlled documents publish correctly.
4. No critical data-integrity incidents exist.
5. Rollback has been rehearsed and is credible.
6. The system can support the pilot without ad hoc operator intervention.

## Not In Scope

Do not do these in Phase 1:

- replacing Sheets with Postgres
- multi-tenancy
- billing
- replatforming the whole app to a new host
- deep productization work
