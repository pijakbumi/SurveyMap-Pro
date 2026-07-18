import fs from 'fs';
let content = fs.readFileSync('src/utils/reportGenerator.ts', 'utf-8');

// grid-template-columns: repeat(3, 1fr) -> grid-template-columns: 2fr 1fr 1fr
content = content.replace(
  'grid-template-columns: repeat(3, 1fr); gap: 1px;',
  'grid-template-columns: 2fr 1fr 1fr; gap: 1px;'
);

// stroke-width="5" -> stroke-width="2.5"
content = content.replace(
  /stroke-width="5"/g,
  'stroke-width="2.5"'
);

fs.writeFileSync('src/utils/reportGenerator.ts', content);
