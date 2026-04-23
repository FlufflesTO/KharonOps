import { describe, expect, it } from "vitest";
import finance from "../../../apps/api/src/routes/finance";
import { makeRouteHarness } from "./helpers";

describe("unit: finance route module", () => {
  it("enforces role-based access", async () => {
    const app = makeRouteHarness({
      route: finance,
      sessionUser: {
        user_id: "USR-TECH-1",
        email: "tech@kharon.co.za",
        role: "technician",
        display_name: "Technician",
        client_id: "",
        technician_id: "TECH-1"
      }
    });

    const response = await app.request("/quotes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        job_id: "JOB-1",
        client_id: "CLI-1",
        description: "Quote",
        amount: 1000
      })
    });

    expect(response.status).toBe(403);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe("forbidden");
  });
});
