import { access, readFile } from "node:fs/promises";
import path from "node:path";

const importSpec = [
  { file: "users.json", table: "svr_users", key: "user_uid" },
  { file: "jobs.json", table: "svr_jobs", key: "job_uid" },
  { file: "job_documents.json", table: "svr_job_documents", key: "document_uid" },
  { file: "schedule_requests.json", table: "svr_schedule_requests", key: "request_uid" },
  { file: "schedules.json", table: "svr_schedules", key: "schedule_uid" }
];

function resolveConnectionString() {
  return process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_DIRECT_URL || "";
}

function parseArg(flag, fallback = "") {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return fallback;
  return process.argv[idx + 1] || fallback;
}

async function readRows(filePath) {
  await access(filePath);
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`${path.basename(filePath)} must contain a JSON array.`);
  }
  return parsed;
}

function buildUpsert(table, key, sample) {
  const columns = Object.keys(sample);
  if (!columns.includes(key)) {
    throw new Error(`Row for table ${table} is missing key column ${key}.`);
  }
  const colList = columns.map((c) => `"${c}"`).join(", ");
  const valueList = columns.map((_, idx) => `$${idx + 1}`).join(", ");
  const updates = columns.filter((c) => c !== key).map((c) => `"${c}"=EXCLUDED."${c}"`).join(", ");
  return {
    columns,
    sql: `INSERT INTO ${table} (${colList}) VALUES (${valueList}) ON CONFLICT ("${key}") DO UPDATE SET ${updates}`
  };
}

async function main() {
  const sourceDir = parseArg("--source-dir", path.join(process.cwd(), "scripts", "data", "backfill"));
  const apply = process.argv.includes("--apply");
  const connectionString = resolveConnectionString();

  const datasets = [];
  for (const spec of importSpec) {
    const fullPath = path.join(sourceDir, spec.file);
    try {
      const rows = await readRows(fullPath);
      datasets.push({ ...spec, fullPath, rows });
    } catch {
      // Optional dataset; skip when missing.
    }
  }

  if (datasets.length === 0) {
    console.log(`No import datasets found in ${sourceDir}.`);
    console.log("Expected optional files: users.json, jobs.json, job_documents.json, schedule_requests.json, schedules.json");
    return;
  }

  console.log("Backfill plan:");
  for (const dataset of datasets) {
    console.log(`- ${dataset.table}: ${dataset.rows.length} rows (${dataset.file})`);
  }

  if (!connectionString) {
    console.log("No connection string found (POSTGRES_URL / DATABASE_URL / POSTGRES_DIRECT_URL). Plan only.");
    return;
  }

  if (!apply) {
    console.log("Run with --apply to execute backfill.");
    return;
  }

  const { Client } = await import("pg");
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query("BEGIN");
    for (const dataset of datasets) {
      if (dataset.rows.length === 0) continue;
      const { columns, sql } = buildUpsert(dataset.table, dataset.key, dataset.rows[0]);
      for (const row of dataset.rows) {
        const values = columns.map((column) => row[column] ?? null);
        await client.query(sql, values);
      }
    }
    await client.query("COMMIT");
    console.log("Backfill applied.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
