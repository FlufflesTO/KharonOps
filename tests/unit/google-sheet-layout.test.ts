import { describe, expect, it } from "vitest";
import { detectSheetLayout } from "../../packages/google/src/production";

describe("google sheet layout detection", () => {
  it("uses the first row when the sheet is already canonical", () => {
    const layout = detectSheetLayout([
      ["user_id", "email", "role"],
      ["USR-001", "connor@kharon.co.za", "admin"]
    ]);

    expect(layout.headerRowIndex).toBe(0);
    expect(layout.headers).toEqual(["user_id", "email", "role"]);
  });

  it("skips a single-cell title row and uses the real header row beneath it", () => {
    const layout = detectSheetLayout([
      ["Jobs_Master"],
      ["job_id", "row_version", "client_id", "site_id"],
      ["JOB-00001", "1", "CLT-001", "SITE-001"]
    ]);

    expect(layout.headerRowIndex).toBe(1);
    expect(layout.headers).toEqual(["job_id", "row_version", "client_id", "site_id"]);
  });
});
