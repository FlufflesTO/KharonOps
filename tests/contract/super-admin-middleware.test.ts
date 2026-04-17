import { describe, expect, it } from "vitest";
import { issueSessionCookie, makeTestApp } from "./helpers";

describe("contract: super admin middleware access", () => {
  it("allows a super admin session through admin middleware surfaces", async () => {
    const app = makeTestApp();
    const cookie = await issueSessionCookie({
      user_uid: "USR-SUPER-1",
      email: "super.admin@kharon.invalid",
      role: "super_admin",
      display_name: "Platform Command",
      client_uid: "",
      technician_uid: ""
    });

    const response = await app.request("/api/v1/admin/health", {
      method: "GET",
      headers: {
        cookie
      }
    });

    expect(response.status).toBe(200);
  });
});
