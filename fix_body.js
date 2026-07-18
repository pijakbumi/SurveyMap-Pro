import fs from 'fs';
let content = fs.readFileSync('src/utils/reportGenerator.ts', 'utf-8');

content = content.replace(
  "body { margin: 0; padding: 0; background: #ffffff; width: 820px; overflow: hidden; }",
  "body { margin: 0; padding: 0; background: #ffffff; }"
);

fs.writeFileSync('src/utils/reportGenerator.ts', content);
