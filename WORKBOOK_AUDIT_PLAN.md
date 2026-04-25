# Joint Workbook Audit & Remediation Plan

**Agents:** Gemini & Lingma  
**Target:** Kharon Operational Workbook (Google Sheets)  
**Purpose:** Forensic verification and granular cleansing of the primary system of record.

---

### Status Tracker
- [x] **Step 1: Structural Audit** (COMPLETED)
    - [x] Register "unknown" Level 2/3 sheets in domain constants.
    - [x] Validate column headers against SVR taxonomy.
- [x] **Step 2: Identity Cleansing** (COMPLETED)
    - [x] Deduplicate `user_id` records.
    - [x] Link Technicians to Users via `technician_id`.
- [x] **Step 3: Forensic Audit & Backfill** (COMPLETED)
    - [x] Resolved **8,085 gaps** in `updated_at` and `row_version`.
- [x] **Step 4: Financial Consolidation** (COMPLETED)
    - [x] Synced **100+ invoices** from master record to formal ledger.
- [x] **Step 5: Relational Integrity** (COMPLETED)
    - [x] Verified 0 orphaned Clients/Sites in `Jobs_Master`.

---

### Audit Findings (2026-04-25)
1. **Structural Integrity**: 100% header alignment across all 28 sheets.
2. **Forensic Gaps**: **8,085 rows** lack mandatory constitutional metadata.
3. **Financial Mismatch**: **100+ invoice records** found in `Invoices_Master` are missing from `Finance_Invoices`.
4. **Relational Health**: Strong. 0 orphaned clients or sites found in the main job ledger.
5. **Identity**: 0 User ID collisions detected. 0 technician mapping gaps remaining.

---
## 1. Phase 1: Structural Audit (Forensic Discovery)
**Goal:** Verify the physical integrity of the workbook against the `SVR` constitutional schema.

- [ ] **Sheet Inventory**: Cross-reference existing sheets against `REQUIRED_WORKBOOK_SHEETS`.
- [ ] **Header Analysis**: Identify missing or extraneous columns in every master sheet.
- [ ] **Temporal Integrity**: Verify `updated_at` and `row_version` columns are present and typed correctly.
- [ ] **Constraint Audit**: Check for missing Primary Keys (IDs) in critical rows.

## 2. Phase 2: Data Cleansing (Granular Remediation)
**Goal:** Resolve logical inconsistencies and data rot.

- [ ] **Identity Deduplication**: Resolve duplicate `user_id` and `job_id` collisions.
- [ ] **ID Mapping**:
    - Sync `Technicians_Master` with `Users_Master`.
    - Backfill `primary_technician_id` in `Jobs_Master` from name lookups.
- [ ] **State Normalization**:
    - Normalize `job_status` to canonical union types (`draft`, `performed`, `certified`, `cancelled`).
    - Resolve malformed boolean flags (`active_flag`).
- [ ] **Temporal Alignment**: Ensure all dates are in ISO-8601 or compatible serial formats.

## 3. Phase 3: Forensic Hardening
**Goal:** Align the workbook for long-term auditability.

- [ ] **Audit Trail Activation**: Ensure every mutation has a `correlation_id` and `updated_by`.
- [ ] **Schema Locking**: Propose "Protected Range" locks for header rows to prevent manual interference.
- [ ] **Referential Integrity**: Verify that `client_id` and `technician_id` in `Jobs_Master` actually exist in their respective master sheets.

## 4. Execution Strategy
1. **Gemini**: Run `workbook-governance.mjs` in **Audit Mode** to generate the baseline report.
2. **Lingma**: Analyze the report for architectural drift and propose granular manual fixes for "unfixable" edge cases (e.g., malformed addresses or financial totals).
3. **Gemini**: Execute the automated remediation via `workbook-governance.mjs --apply`.
4. **Joint**: Final verification pass and update of `CHANGELOG.md`.
