import { describe, expect, it } from "vitest";
import { loginAs, makeTestApp } from "./helpers";

describe("contract: public contact intake", () => {
  it("accepts a public contact request and audits the submission", async () => {
    const app = makeTestApp();

    const submitResponse = await app.request("/api/v1/public/contact", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: "Site Contact",
        email: "site.contact@example.com",
        phone: "+27610000000",
        company: "Example Site",
        site_location: "Cape Town",
        enquiry_type: "project",
        message: "Need a scoped fire detection upgrade assessment.",
        company_size: "Single site",
        honey: ""
      })
    });

    expect(submitResponse.status).toBe(200);
    const submitBody = (await submitResponse.json()) as { data: { submitted: boolean } };
    expect(submitBody.data.submitted).toBe(true);

    const adminCookie = await loginAs(app, "dev-admin");
    const auditsResponse = await app.request("/api/v1/admin/audits", {
      method: "GET",
      headers: {
        cookie: adminCookie
      }
    });

    expect(auditsResponse.status).toBe(200);
    const auditsBody = (await auditsResponse.json()) as {
      data: Array<{ action: string; entry_type?: string }>;
    };
    expect(auditsBody.data.some((entry) => entry.action === "public.contact.submit" && entry.entry_type === "public_contact")).toBe(true);
  });
});
