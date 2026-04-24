import fs from 'fs';
import path from 'path';

const dir = 'apps/portal/src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');
  let newContent = content
    .replace(/color:\s*#fff/gi, 'color: var(--color-text)')
    .replace(/color:\s*#cbd5e1/gi, 'color: var(--color-text-muted)')
    .replace(/color:\s*#10b981/gi, 'color: var(--color-positive, #10b981)')
    .replace(/color:\s*#f59e0b/gi, 'color: var(--color-warning, #f59e0b)')
    .replace(/color:\s*#6b7280/gi, 'color: var(--color-text-muted, #6b7280)')
    .replace(/color:\s*#4ade80/gi, 'color: var(--color-positive)')
    .replace(/color:\s*#facc15/gi, 'color: var(--color-warning)');
  
  if (content !== newContent) {
    fs.writeFileSync(p, newContent);
    console.log('Fixed colors in', file);
  }
}
