import { describe, expect, it } from "vitest";
import { makeTestApp } from "./helpers";

describe("contract: api security headers", () => {
  it("applies no-store and security headers to api responses", async () => {
    const app = makeTestApp();

    const response = await app.request("/api/v1/auth/session", {
      method: "GET"
    });

    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("vary")).toContain("Cookie");
  });
});
