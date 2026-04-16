const tables = [
  "svr_users",
  "svr_jobs",
  "svr_job_events",
  "svr_job_documents",
  "svr_schedule_requests",
  "svr_schedules",
  "svr_automation_jobs",
  "svr_sync_queue",
  "svr_audit_log"
];

function resolveConnectionString() {
  return process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_DIRECT_URL || "";
}

async function runParity(connectionString) {
  const { Client } = await import("pg");
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const summary = {};
    for (const table of tables) {
      const { rows } = await client.query(`SELECT COUNT(*)::bigint AS count FROM ${table}`);
      summary[table] = Number(rows[0]?.count ?? 0);
    }
    return summary;
  } finally {
    await client.end();
  }
}

async function main() {
  const connectionString = resolveConnectionString();
  if (!connectionString) {
    console.log("No connection string found (POSTGRES_URL / DATABASE_URL / POSTGRES_DIRECT_URL).");
    console.log("Parity check skipped.");
    return;
  }

  const summary = await runParity(connectionString);
  console.log("Postgres table counts:");
  for (const [table, count] of Object.entries(summary)) {
    console.log(`- ${table}: ${count}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
