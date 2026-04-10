# Postgres SQL Scaffold

These files are the migration starting point for moving the workbook-backed API to Postgres.

Current status:

- `001_initial_schema.sql` defines the transactional tables and product-support tables.
- `002_indexes.sql` adds the first-pass operational indexes.
- nothing in the current build, deploy, or Worker boot path executes these files yet.

Implementation notes:

1. Keep the runtime on `STORE_BACKEND=sheets` or the local default until the Postgres store is implemented.
2. Apply these SQL files with an explicit `search_path` if you do not want `public`.
3. Add a real migration runner before production cutover. The placeholder scripts under `scripts/` are planning aids only.
4. Preserve API semantics when wiring the store: RBAC, row-version conflict handling, and sync replay behavior must remain store-agnostic.
