# Tequit Interim Domain Cutover

This runbook moves the current public Kharon stack from `*.workers.dev` to `tequit.co.za` as an interim production and testing domain.

## Recommended Hostnames

- Production public app: `https://tequit.co.za`
- Staging public app: `https://staging.tequit.co.za`
- Future internal admin host: `https://internal.tequit.co.za`

The current public worker serves the marketing site, `/portal/`, and `/api/*` on one host. Keep that shape for now.

## Phase 1: Put `tequit.co.za` Under Cloudflare

### What you do

1. Sign in to [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left sidebar, click `Websites`.
3. Click `Add a domain`.
4. Enter `tequit.co.za`.
5. Choose the same Cloudflare account that already owns the Workers.
6. Pick your plan and continue.
7. Review the imported DNS records carefully.

### What must exist after this step

- the zone `tequit.co.za` exists in Cloudflare
- Cloudflare shows the required nameservers for the zone

### Where to change nameservers

At the registrar where `tequit.co.za` was purchased:

1. Sign in to your registrar account.
2. Open the domain management page for `tequit.co.za`.
3. Find `Nameservers` or `DNS delegation`.
4. Replace the old nameservers with the two Cloudflare nameservers shown on the Cloudflare zone setup page.
5. Save the change.

### Stop condition

Do not continue until Cloudflare marks the zone as `Active`.

## Phase 2: Attach the Public Workers to the Domain

### Production custom domain

1. In Cloudflare, go to `Workers & Pages`.
2. Open `kharon-unified-api-public`.
3. Open `Settings`.
4. Open `Domains & Routes`.
5. Click `Add custom domain`.
6. Enter `tequit.co.za`.
7. Save.

Cloudflare should create and manage the DNS record automatically because the zone is in the same account.

### Staging custom domain

1. Go back to `Workers & Pages`.
2. Open `kharon-unified-api-staging-public`.
3. Open `Settings`.
4. Open `Domains & Routes`.
5. Click `Add custom domain`.
6. Enter `staging.tequit.co.za`.
7. Save.

### What I will do after you finish this

- verify both custom domains resolve
- smoke test `/`, `/portal/`, and `/api/v1/auth/config`
- confirm the custom domains are serving the latest bundle

## Phase 3: Update Google Auth Platform

This is the part most likely to break login if it is skipped.

### Where to go

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. In the top bar, select the project that owns the current `GOOGLE_CLIENT_ID`.
3. In the left sidebar, open `Google Auth Platform`.

### Branding page

Open `Branding` and set:

- Application name: Kharon Fire & Security
- Support email: your production support email
- Homepage: `https://tequit.co.za`
- Privacy policy: `https://tequit.co.za/privacy`
- Terms of service: `https://tequit.co.za/terms`
- Authorized domains: `tequit.co.za`

If the app must be used by accounts outside your Google Workspace, the app should be in production and not left in testing.

### Clients page

Open `Clients`, then open the web client used by this repo.

Under `Authorized JavaScript origins`, add:

- `https://tequit.co.za`
- `https://staging.tequit.co.za`
- keep the current `workers.dev` origins until cutover is confirmed

Do not include any path. These must be origin only.

### What I will do after you finish this

- verify `/api/v1/auth/config`
- verify the portal can render the Google button on `tequit.co.za`
- verify sign-in no longer depends on `workers.dev`

## Phase 4: Provision Real Users For All Roles

The app does not derive roles from Google. It derives them from `Users_Master`.

### Where the real role mapping lives

See:

- `Users_Master` in the workbook
- [WORKBOOK_SCHEMA.md](C:/Users/User/KharonOps/KharonOps/docs/WORKBOOK_SCHEMA.md)
- [rbac.ts](C:/Users/User/KharonOps/KharonOps/packages/domain/src/rbac.ts)

### Required user rows

Every real user must have:

- `email`
- `display_name`
- `role`
- `active=true`

Role-specific requirements:

- `client`: must also have `client_uid`
- `technician`: must also have `technician_uid`
- `dispatcher`: leave `client_uid` and `technician_uid` blank unless there is a specific reason
- `admin`: leave `client_uid` and `technician_uid` blank unless there is a specific reason

### Minimum pilot provisioning

- 1 client user with a real Google account
- 1 technician user with a real Google account
- 1 dispatcher user with a real Google account
- 2 admin users with real Google accounts

### What must also exist

The user must have data to see after login:

- client users need matching jobs by `client_uid`
- technician users need matching jobs by `technician_uid`

Otherwise login succeeds but the workspace appears empty.

## Phase 5: Cutover Verification

### Production checks

Open:

- `https://tequit.co.za/`
- `https://tequit.co.za/portal/`
- `https://tequit.co.za/api/v1/auth/config`

Expected:

- site loads
- portal loads
- `auth/config` returns JSON
- Google sign-in button appears on the portal login screen

### Role checks

Run one real sign-in for each role:

1. client
2. technician
3. dispatcher
4. admin

For each one confirm:

- sign-in succeeds
- the correct role banner appears
- the role sees expected data
- restricted actions remain restricted

## Phase 6: Internal Admin Host Later

Do not do this until public auth is stable.

Future target:

- attach `internal.tequit.co.za` to `kharon-unified-api`
- protect it with Cloudflare Access
- keep public users on `tequit.co.za`

## Repo-Side Notes

The repo is already set up so no code change is required just to move from `workers.dev` to a custom public hostname. Relative paths are already in use for:

- `/`
- `/portal/`
- `/api/*`

Temporary policy pages now exist at:

- `/privacy`
- `/terms`

## Immediate Next Action

Complete Phase 1 and tell Codex when `tequit.co.za` is `Active` in Cloudflare.
