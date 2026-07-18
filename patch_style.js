import fs from 'fs';
let content = fs.readFileSync('src/utils/reportGenerator.ts', 'utf-8');

// 1. report-header padding bottom
content = content.replace(
  "padding: 34px 40px 28px;",
  "padding: 34px 40px 48px;"
);

// 2. header-tags left align
content = content.replace(
  "display: flex; gap: 8px; margin-top: 20px; flex-wrap: wrap; justify-content: center;",
  "display: flex; gap: 8px; margin-top: 20px; flex-wrap: wrap; justify-content: flex-start;"
);

// 3. remove badge background and change color
content = content.replace(
  ".badge {\n          display: inline-flex; align-items: center; justify-content: center;\n          width: 24px; height: 24px; border-radius: 50%;\n          background: ${cAccent}; color: #fff; font-weight: 700; font-size: 11.5px;\n        }",
  ".badge {\n          display: inline-flex; align-items: center; justify-content: center;\n          color: ${cInk}; font-weight: 700; font-size: 13.5px;\n        }"
);

// 4. increase table text size
content = content.replace(
  "font-family: monospace; font-size: 12px; text-align: center; padding: 10px;",
  "font-family: monospace; font-size: 13.5px; text-align: center; padding: 12px 10px;"
);

// 5. increase thead th text size
content = content.replace(
  "font-size: 11px; font-weight: 600; padding: 9px 10px; text-align: center;",
  "font-size: 12.5px; font-weight: 600; padding: 10px 10px; text-align: center;"
);

// 6. increase thead tr.cols th text size
content = content.replace(
  "background: #1B3F79; color: #CBD5E1; font-family: monospace; font-size: 10px;",
  "background: #1B3F79; color: #CBD5E1; font-family: monospace; font-size: 11px; padding: 8px;"
);

// 7. increase font-size for zone in tbody
content = content.replace(
  /font-size:11px;/g,
  "font-size:12.5px;"
);

fs.writeFileSync('src/utils/reportGenerator.ts', content);
