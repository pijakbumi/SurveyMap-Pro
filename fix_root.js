import fs from 'fs';
let content = fs.readFileSync('src/utils/reportGenerator.ts', 'utf-8');

content = content.replace(
  "width: 100%;\n          box-sizing: border-box;",
  "width: 100%;\n          max-width: 820px;\n          margin: 0 auto;\n          box-sizing: border-box;"
);

fs.writeFileSync('src/utils/reportGenerator.ts', content);
