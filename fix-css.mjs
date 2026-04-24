import fs from 'fs';

const file = 'apps/portal/src/styles.css';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove text-transform uppercase
content = content.replace(/text-transform:\s*uppercase;/g, '');

// 2. Remove conflicting mobile media query for detail-grid
const targetBlock = `@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}`;
content = content.replace(targetBlock, '');

fs.writeFileSync(file, content);
console.log('Fixed styles.css');
