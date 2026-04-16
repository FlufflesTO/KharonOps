import fs from 'node:fs';
import { WORKBOOK_HEADERS } from '../packages/domain/dist/index.js';
import { createWorkspaceRails } from '../packages/google/dist/index.js';



async function main() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const env = { ...process.env };
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([^#\s][^=]*)\s*=\s*(.*)$/);
    if (match) {
      let key = match[1].trim();
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      env[key] = value;
    }
  });

  const rails = createWorkspaceRails(env);
  console.log(`Starting migration using ${rails.mode} rails...`);
  
  try {
    await rails.sheets.ensureWorkbookSchema(WORKBOOK_HEADERS);
    console.log(`✅ Workbook schema ensured successfully.`);
  } catch (error) {
    console.error(`❌ Migration failed:`);
    console.error(error);
    process.exit(1);
  }
}

main();
