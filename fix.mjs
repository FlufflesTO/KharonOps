import fs from 'fs';
import path from 'path';

const dir = 'apps/portal/src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');
  let newContent = content.replace(/\\`/g, '`').replace(/\\\$/g, '$');
  if (content !== newContent) {
    fs.writeFileSync(p, newContent);
    console.log('Fixed', file);
  }
}
