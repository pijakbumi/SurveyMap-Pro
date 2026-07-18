import fs from 'fs';
let content = fs.readFileSync('src/utils/reportGenerator.ts', 'utf-8');

// 1. summary-grid margins
content = content.replace(
  "margin: 0 40px;\n          transform: translateY(-18px);",
  "margin: -18px 40px 0;\n          position: relative;\n          z-index: 10;"
);

// 2. report-header padding
content = content.replace(
  "padding: 34px 40px 48px;",
  "padding: 34px 40px 64px;"
);

// 3. header-tags remove flex-wrap if present
content = content.replace(
  "display: flex; gap: 8px; margin-top: 20px; flex-wrap: wrap; justify-content: flex-start;",
  "display: flex; gap: 8px; margin-top: 20px; justify-content: flex-start;"
);

// 4. change SKETSA: to SKALA
content = content.replace(
  "<span class=\"tag\">SKETSA: ${settings.coordinateSystem.toUpperCase()}</span>",
  "<span class=\"tag\">SKALA 1:${niceScaleDenominator}</span>"
);

// 5. html2canvas scale 2 -> 3 for better resolution
content = content.replace(
  "scale: 2,",
  "scale: 3,"
);

// 6. remove badge background and increase size in table
content = content.replace(
  ".badge {\n          display: inline-flex; align-items: center; justify-content: center;\n          color: ${cInk}; font-weight: 700; font-size: 13.5px;\n        }",
  ".badge {\n          display: inline-flex; align-items: center; justify-content: center;\n          color: ${cInk}; font-weight: 700; font-size: 14.5px;\n        }"
);
content = content.replace(
  "font-family: monospace; font-size: 13.5px; text-align: center; padding: 12px 10px;",
  "font-family: monospace; font-size: 14px; text-align: center; padding: 14px 10px;"
);

fs.writeFileSync('src/utils/reportGenerator.ts', content);
