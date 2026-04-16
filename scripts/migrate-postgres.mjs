import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sqlFiles = [
  path.join(repoRoot, "apps", "api", "sql", "001_initial_schema.sql"),
  path.join(repoRoot, "apps", "api", "sql", "002_indexes.sql")
];

function resolveConnectionString() {
  return process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_DIRECT_URL || "";
}

async function loadSqlFiles() {
  const files = [];
  for (const file of sqlFiles) {
    await access(file);
    files.push({
      file,
      relative: path.relative(repoRoot, file),
      sql: await readFile(file, "utf8")
    });
  }
  return files;
}

async function applyMigrations(connectionString, migrations) {
  const { Client } = await import("pg");
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query("BEGIN");
    for (const migration of migrations) {
      console.log(`Applying ${migration.relative}`);
      await client.query(migration.sql);
    }
    await client.query("COMMIT");
    console.log("Postgres migrations applied successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

async function main() {
  const apply = process.argv.includes("--apply");
  const migrations = await loadSqlFiles();
  const connectionString = resolveConnectionString();

  console.log("Postgres migration plan:");
  for (const migration of migrations) {
    console.log(`- ${migration.relative}`);
  }

  if (!connectionString) {
    console.log("No connection string found (POSTGRES_URL / DATABASE_URL / POSTGRES_DIRECT_URL).");
    console.log("Plan only mode complete.");
    return;
  }

  if (!apply) {
    console.log("Connection string detected, but apply mode is disabled.");
    console.log("Run with --apply to execute migrations.");
    return;
  }

  await applyMigrations(connectionString, migrations);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
