const parityChecks = [
  "row counts by table",
  "sample key parity for users, jobs, schedules, and documents",
  "row_version parity on mutable entities",
  "latest updated_at / correlation_id drift",
  "sync_queue status distribution",
  "audit and document edge-case spot checks"
];

async function main() {
  console.log("Store parity scaffold is present.");
  console.log("No Sheets or Postgres systems were queried.");
  console.log("Planned verification set:");
  for (const check of parityChecks) {
    console.log(`- ${check}`);
  }
  console.log("Next implementation step: add real connectors and fail thresholds before enabling dual-write.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
