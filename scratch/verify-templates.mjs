import { buildGoogleRuntimeConfig, googleApiRequest } from "../packages/google/src/index.js";
import { parse } from "dotenv";
import { readFileSync } from "fs";

async function verify() {
  const envRaw = readFileSync(".env", "utf8");
  const env = parse(envRaw);
  const config = buildGoogleRuntimeConfig(env);

  const templates = [
    env.GOOGLE_JOBCARD_TEMPLATE_ID,
    env.GOOGLE_SERVICE_REPORT_TEMPLATE_ID,
    env.GOOGLE_FIRE_CERTIFICATE_TEMPLATE_ID,
    env.GOOGLE_ASSESSMENT_TEMPLATE_ID
  ];

  console.log("Verifying Drive access for templates...");

  for (const id of templates) {
    try {
      const res = await googleApiRequest({
        config,
        service: "drive",
        url: `https://www.googleapis.com/drive/v3/files/${id}?fields=id,name`,
        scopes: ["https://www.googleapis.com/auth/drive.readonly"]
      });
      console.log(`[OK] Found template: ${res.name} (${res.id})`);
    } catch (error) {
      console.error(`[FAIL] Template ${id}:`, error.message);
    }
  }
}

verify();
