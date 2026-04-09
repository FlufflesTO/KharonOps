import { WORKBOOK_HEADERS } from "../packages/domain/dist/index.js";
import { createWorkspaceRails } from "../packages/google/dist/index.js";

async function main() {
  const rails = createWorkspaceRails(process.env);
  await rails.sheets.ensureWorkbookSchema(WORKBOOK_HEADERS);
  console.log(`Workbook schema ensured using ${rails.mode} rails.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
