import fs from 'fs';
let content = fs.readFileSync('src/utils/reportGenerator.ts', 'utf-8');

content = content.replace(
  ".badge {\n          display: inline-flex; align-items: center; justify-content: center;\n          color: ${cInk}; font-weight: 700; font-size: 14.5px;\n        }",
  ".badge {\n          display: inline-flex; align-items: center; justify-content: center;\n          color: ${cInk}; font-weight: 700; font-size: 14.5px;\n          line-height: 1;\n        }"
);

fs.writeFileSync('src/utils/reportGenerator.ts', content);
