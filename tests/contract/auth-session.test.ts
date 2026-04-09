import { describe, expect, it } from "vitest";
import { makeTestApp, loginAs } from "./helpers";

describe("contract: auth/session lifecycle", () => {
  it("logs in, returns session, and logs out", async () => {
    const app = makeTestApp();
    const cookie = await loginAs(app, "dev-client");

    const sessionResponse = await app.request("/api/v1/auth/session", {
      method: "GET",
      headers: {
        cookie
      }
    });

    expect(sessionResponse.status).toBe(200);
    const sessionBody = (await sessionResponse.json()) as { data: { session: { role: string } } };
    expect(sessionBody.data.session.role).toBe("client");

    const logoutResponse = await app.request("/api/v1/auth/logout", {
      method: "POST",
      headers: {
        cookie
      }
    });

    expect(logoutResponse.status).toBe(200);

    const afterLogout = await app.request("/api/v1/auth/session", {
      method: "GET"
    });

    expect(afterLogout.status).toBe(401);
  });
});
