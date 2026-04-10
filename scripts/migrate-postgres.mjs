import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sqlFiles = [
  path.join(repoRoot, "apps", "api", "sql", "001_initial_schema.sql"),
  path.join(repoRoot, "apps", "api", "sql", "002_indexes.sql")
];

async function main() {
  for (const file of sqlFiles) {
    await access(file);
  }

  console.log("Postgres migration scaffold is present.");
  console.log("No database changes were applied.");
  console.log("Planned migration order:");
  for (const file of sqlFiles) {
    console.log(`- ${path.relative(repoRoot, file)}`);
  }

  if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL && !process.env.POSTGRES_DIRECT_URL) {
    console.log("Set POSTGRES_URL, DATABASE_URL, or POSTGRES_DIRECT_URL before wiring a real runner.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
