import { describe, expect, it } from "vitest";
import { loginAs, makeTestApp } from "./helpers";

describe("contract: role and ownership boundaries", () => {
  it("blocks client from reading another client's job", async () => {
    const app = makeTestApp();
    const cookie = await loginAs(app, "dev-client");

    const response = await app.request("/api/v1/jobs/JOB-2002", {
      method: "GET",
      headers: {
        cookie
      }
    });

    expect(response.status).toBe(403);
  });

  it("blocks technician from updating unassigned job", async () => {
    const app = makeTestApp();
    const cookie = await loginAs(app, "dev-technician");

    const response = await app.request("/api/v1/jobs/JOB-2002/status", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        status: "en_route",
        row_version: 1
      })
    });

    expect(response.status).toBe(403);
  });
});
