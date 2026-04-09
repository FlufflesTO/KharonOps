import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const workerOrigin = process.env.WORKER_PUBLIC_URL ?? "http://127.0.0.1:8787";
const netlifyOrigin = process.env.SITE_PUBLIC_URL ?? "http://127.0.0.1:4173";

async function check(url) {
  const response = await fetch(url, { method: "GET" });
  const body = await response.text();
  return {
    url,
    status: response.status,
    ok: response.ok,
    body: body.slice(0, 500)
  };
}

async function main() {
  const checks = [
    await check(`${workerOrigin}/api/v1/admin/health`),
    await check(`${workerOrigin}/`),
    await check(`${netlifyOrigin}/`),
    await check(`${netlifyOrigin}/portal/`)
  ];

  const outputDir = resolve(process.cwd(), "dist/cutover");
  mkdirSync(outputDir, { recursive: true });

  const report = {
    at: new Date().toISOString(),
    workerOrigin,
    netlifyOrigin,
    checks,
    verdict: checks.every((entry) => entry.ok) ? "PASS" : "FAIL"
  };

  writeFileSync(resolve(outputDir, "cutover-rehearsal.json"), JSON.stringify(report, null, 2));
  writeFileSync(resolve(outputDir, "rollback-bundle.txt"), [
    `Cutover rehearsal at ${report.at}`,
    `Verdict: ${report.verdict}`,
    "Rollback package:",
    "1. Previous Netlify deploy id",
    "2. Previous Cloudflare Worker version id",
    "3. Legacy portal read-only DNS record",
    "4. Workbook snapshot export"
  ].join("\n"));

  if (report.verdict !== "PASS") {
    throw new Error("Cutover rehearsal failed. See dist/cutover/cutover-rehearsal.json");
  }

  console.log("Cutover rehearsal report generated.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
