/**
 * KharonOps — Name Enrichment Unit Tests
 * Purpose: Validates buildNameLookups priority hierarchy and edge cases.
 * Dependencies: vitest, @kharon/domain types, nameEnrichment service
 * Structural Role: tests/unit test battery
 */

import { describe, expect, it } from "vitest";
import { buildNameLookups } from "../../apps/api/src/services/nameEnrichment.js";
import type { ClientRow, TechnicianRow, UserRow } from "@kharon/domain";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function client(overrides: Partial<ClientRow> = {}): ClientRow {
  return {
    client_id: "CLT-001",
    client_name: "Acme Corp",
    billing_entity: "Acme",
    ops_email: "ops@acme.co",
    active: "true",
    ...overrides
  };
}

function technician(overrides: Partial<TechnicianRow> = {}): TechnicianRow {
  return {
    technician_id: "ROY001",
    display_name: "Roy Meyers",
    active: "true",
    ...overrides
  };
}

function userRow(overrides: Partial<UserRow> = {}): UserRow {
  return {
    user_uid: "USR-001",
    email: "user@example.com",
    display_name: "User One",
    role: "client",
    client_uid: "",
    technician_uid: "",
    active: "true",
    row_version: 1,
    updated_at: "2026-01-01T00:00:00Z",
    updated_by: "seed",
    correlation_id: "test",
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("buildNameLookups", () => {
  it("maps clients from Clients_Master when all sources present", () => {
    const result = buildNameLookups({
      clients: [client({ client_id: "CLT-001", client_name: "Acme Corp" })],
      technicians: [],
      users: []
    });

    expect(result.clientNameByUid.get("CLT-001")).toBe("Acme Corp");
    expect(result.clientNameByUid.size).toBe(1);
  });

  it("maps technicians from Technicians_Master when all sources present", () => {
    const result = buildNameLookups({
      clients: [],
      technicians: [technician({ technician_id: "ROY001", display_name: "Roy Meyers" })],
      users: []
    });

    expect(result.technicianNameByUid.get("ROY001")).toBe("Roy Meyers");
    expect(result.technicianNameByUid.size).toBe(1);
  });

  it("uses Users_Master as fallback for client when Clients_Master has no match", () => {
    const result = buildNameLookups({
      clients: [],
      technicians: [],
      users: [
        userRow({
          role: "client",
          client_uid: "PORTAL-CLT-001",
          display_name: "Portal Client"
        })
      ]
    });

    expect(result.clientNameByUid.get("PORTAL-CLT-001")).toBe("Portal Client");
  });

  it("uses Users_Master as fallback for technician when Technicians_Master has no match", () => {
    const result = buildNameLookups({
      clients: [],
      technicians: [],
      users: [
        userRow({
          role: "technician",
          technician_uid: "PORTAL-TECH-001",
          display_name: "Portal Tech"
        })
      ]
    });

    expect(result.technicianNameByUid.get("PORTAL-TECH-001")).toBe("Portal Tech");
  });

  it("prefers Clients_Master over Users_Master when both have the same UID", () => {
    const result = buildNameLookups({
      clients: [client({ client_id: "CLT-001", client_name: "Master Name" })],
      technicians: [],
      users: [
        userRow({
          role: "client",
          client_uid: "CLT-001",
          display_name: "Portal Override Name"
        })
      ]
    });

    // Master should win — Users_Master should NOT override.
    expect(result.clientNameByUid.get("CLT-001")).toBe("Master Name");
  });

  it("prefers Technicians_Master over Users_Master when both have the same UID", () => {
    const result = buildNameLookups({
      clients: [],
      technicians: [technician({ technician_id: "ROY001", display_name: "Master Tech Name" })],
      users: [
        userRow({
          role: "technician",
          technician_uid: "ROY001",
          display_name: "Portal Tech Override"
        })
      ]
    });

    expect(result.technicianNameByUid.get("ROY001")).toBe("Master Tech Name");
  });

  it("skips inactive client rows from Clients_Master", () => {
    const result = buildNameLookups({
      clients: [client({ client_id: "CLT-002", active: "false", client_name: "Inactive Corp" })],
      technicians: [],
      users: []
    });

    expect(result.clientNameByUid.has("CLT-002")).toBe(false);
  });

  it("skips inactive technician rows from Technicians_Master", () => {
    const result = buildNameLookups({
      clients: [],
      technicians: [technician({ technician_id: "MAG001", active: "false", display_name: "Inactive Tech" })],
      users: []
    });

    expect(result.technicianNameByUid.has("MAG001")).toBe(false);
  });

  it("skips client rows with empty client_id", () => {
    const result = buildNameLookups({
      clients: [client({ client_id: "", client_name: "Bad Row" })],
      technicians: [],
      users: []
    });

    expect(result.clientNameByUid.size).toBe(0);
  });

  it("skips technician rows with empty technician_id", () => {
    const result = buildNameLookups({
      clients: [],
      technicians: [technician({ technician_id: " ", display_name: "Whitespace ID" })],
      users: []
    });

    expect(result.technicianNameByUid.size).toBe(0);
  });

  it("returns empty maps when all sources are empty (graceful degradation)", () => {
    const result = buildNameLookups({
      clients: [],
      technicians: [],
      users: []
    });

    expect(result.clientNameByUid.size).toBe(0);
    expect(result.technicianNameByUid.size).toBe(0);
  });

  it("handles multiple clients and technicians correctly", () => {
    const result = buildNameLookups({
      clients: [
        client({ client_id: "CLT-001", client_name: "Alpha" }),
        client({ client_id: "CLT-002", client_name: "Bravo" }),
        client({ client_id: "CLT-003", client_name: "Charlie" })
      ],
      technicians: [
        technician({ technician_id: "ROY001", display_name: "Roy" }),
        technician({ technician_id: "MAG001", display_name: "Mag" })
      ],
      users: [
        userRow({ role: "client", client_uid: "CLT-NEW", display_name: "Portal New" })
      ]
    });

    expect(result.clientNameByUid.size).toBe(4);  // 3 master + 1 portal
    expect(result.technicianNameByUid.size).toBe(2);
    expect(result.clientNameByUid.get("CLT-NEW")).toBe("Portal New");
  });

  it("skips inactive Users_Master fallback rows", () => {
    const result = buildNameLookups({
      clients: [],
      technicians: [],
      users: [
        userRow({
          role: "client",
          client_uid: "CLT-INACTIVE",
          display_name: "Deactivated",
          active: "false"
        })
      ]
    });

    expect(result.clientNameByUid.has("CLT-INACTIVE")).toBe(false);
  });
});
