# Phase 3 SME Productization

## Objective

Turn Kharon Unified Rebuild from an internal or single-business operating platform into a sellable SME product.

This phase should only begin after:

1. the current stack is safely in production
2. Postgres is the source of truth
3. async jobs are no longer tightly coupled to request handling

## Product Boundary Change

Before this phase, the product is effectively:

- one company
- one service model
- one operational hierarchy

After this phase, the product must support:

- multiple customer organizations
- clean data separation
- tenant-level configuration
- tenant-level admin workflows
- support and billing operations

## Required Product Capabilities

### Capability 1: Multi-tenancy

Add:

- `tenants`
- `tenant_users`
- `tenant_roles`
- tenant-scoped ownership rules

Every major entity must become tenant-aware:

- jobs
- sites
- clients
- technicians
- documents
- schedules
- audits

### Capability 2: Tenant-safe auth and RBAC

Current roles are operational:

- client
- technician
- dispatcher
- finance
- admin
- super_admin

For a product, add:

- platform_admin
- tenant_admin
- tenant_dispatcher
- tenant_technician
- tenant_client_contact

Server-side authorization must become:

- role-aware
- tenant-aware
- ownership-aware

### Capability 3: Tenant onboarding

You need a repeatable onboarding flow:

1. create tenant
2. create first admin
3. configure branding and contact settings
4. configure service regions and operating hours
5. import sites, assets, and contacts
6. configure document templates and notification rules
7. map legacy operational roles into tenant-scoped equivalents

This should not require engineering intervention for every customer.

### Capability 4: Commercial controls

Add:

- plan definitions
- usage limits
- billing state
- feature flags by plan
- trial and suspension states

Suggested future tables:

- `plans`
- `subscriptions`
- `tenant_entitlements`
- `usage_events`

### Capability 5: Support tooling

You will need internal product support functions:

- tenant lookup
- audit search
- support-safe impersonation
- job replay tools
- export tooling
- incident investigation tools

Do not try to sell the system without support operations built in.

### Capability 6: Customer data portability

For SME buyers, add:

- CSV exports
- PDF report bundles
- tenant-level backup/export
- deletion workflows
- account close and retention policy tooling

### Capability 7: Product-grade observability

Per tenant, you need visibility into:

- login failures
- API errors
- sync conflicts
- notification failures
- document generation failures
- queue backlogs

## Implementation Sequence

### Step 1: Add tenant data model

Introduce tenant tables and foreign keys before changing the UI.

Start by making these entities tenant-scoped:

- users
- clients
- sites
- jobs
- schedules
- documents

### Step 2: Refactor API access rules

Update the API so every read and write is tenant-scoped in addition to role-scoped.

Review:

- `packages/domain`
- `apps/api/src/auth/*`
- `apps/api/src/middleware/auth.ts`
- store filters and ownership rules

### Step 3: Add tenant setup surfaces

You will eventually need:

- tenant admin setup screens
- invites
- member management
- site import
- service configuration

This should likely live in the portal, but with platform-admin-only routes for operator support.

### Step 4: Add async workflow control

By this stage, workflows should already be queue-based.

Add:

- retry dashboard
- dead-letter inspection
- job replay controls
- notification failure handling

### Step 5: Add billing and entitlement checks

Only after tenant and support models are stable:

1. add billing provider integration
2. add plan controls
3. gate features by entitlement
4. expose usage to tenant admins

### Step 6: Add onboarding and data import

Create deterministic import flows for:

- sites
- client contacts
- technicians
- maintenance schedules
- installed-system metadata

### Step 7: Add product packaging

Before serious selling, finalize:

- legal and privacy posture
- retention defaults
- tenant backup/export policy
- support SLAs
- incident response procedure

## Recommended Future Product Stack

For the sellable SME version, the recommended default stack is:

- Cloudflare for delivery and runtime
- Postgres for transactional state
- R2 for file storage
- Queues for async workflows
- Google Workspace only as optional integrations

If you want more bundled platform primitives, evaluate:

- Supabase for Postgres, auth, and storage

But do that deliberately. Do not drift into a hybrid architecture accidentally.

## Exit Criteria

This phase is done when:

1. multiple tenants can coexist safely
2. tenant admins can self-manage core setup
3. billing and entitlement controls exist
4. support operations are practical
5. data export and audit expectations are met
