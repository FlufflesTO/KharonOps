/**
 * KharonOps — Public Routes
 * Purpose: Unauthenticated public endpoints (website contact form).
 * Dependencies: @kharon/domain, ../services/utils.js
 */

import { Hono } from "hono";
import { envelopeSuccess, enquiryTypeLabel } from "@kharon/domain";
import { parseJsonBody } from "../services/parse.js";
import { createStoreContext } from "../services/meta.js";
import { logApiEvent } from "../services/utils.js";
import { publicContactRequestSchema } from "../schemas/requests.js";
import type { AppBindings } from "../context.js";

const publicRouter = new Hono<AppBindings>();

publicRouter.post("/contact", async (c) => {
  const correlationId = c.get("correlationId");
  const config = c.get("config");
  const store = c.get("store");
  const body = await parseJsonBody(c.req.raw, publicContactRequestSchema);

  if (body.honey !== "") {
    logApiEvent("warn", "public.contact.honeypot_triggered", { correlationId, email: body.email });
    return c.json(envelopeSuccess({ correlationId, data: { submitted: true } }));
  }

  const subject = `[Website] ${enquiryTypeLabel(body.enquiry_type)} | ${body.name}`;
  const message = [
    `Name: ${body.name}`,
    `Email: ${body.email}`,
    `Phone: ${body.phone}`,
    `Company: ${body.company || "Not provided"}`,
    `Site Location: ${body.site_location || "Not provided"}`,
    `Enquiry Type: ${enquiryTypeLabel(body.enquiry_type)}`,
    "",
    "Message:",
    body.message
  ].join("\n");

  await config.rails.gmail.sendNotification({
    to: config.gmailSenderAddress,
    subject,
    body: message
  });

  if (body.enquiry_type === "urgent_callout") {
    await config.rails.chat.sendAlert({
      severity: "critical",
      message: `Urgent website enquiry from ${body.name} (${body.phone})`
    });
  }

  await store.appendAudit({
    action: "public.contact.submit",
    entry_type: "public_contact",
    payload: { name: body.name, email: body.email, phone: body.phone, enquiry_type: body.enquiry_type },
    ctx: createStoreContext("public:web", correlationId)
  });

  return c.json(envelopeSuccess({ correlationId, data: { submitted: true } }));
});

export default publicRouter;
