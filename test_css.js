import fs from 'fs';
let content = fs.readFileSync('src/utils/reportGenerator.ts', 'utf-8');

content = content.replace(
  "padding: 6px 10px;\n          border-radius: 100px;\n          display: inline-flex;\n          align-items: center;\n          line-height: 1;",
  "padding: 5px 10px 7px;\n          border-radius: 100px;\n          display: inline-block;\n          vertical-align: middle;\n          line-height: normal;"
);

content = content.replace(
  "display: flex; gap: 8px; margin-top: 20px; justify-content: flex-start;",
  "margin-top: 20px; text-align: left;"
);

// tags gap
content = content.replace(
  "<span class=\"tag\">BASEMAP",
  "<span class=\"tag\" style=\"margin-right:8px;\">BASEMAP"
);
content = content.replace(
  "<span class=\"tag\">SKALA",
  "<span class=\"tag\" style=\"margin-right:8px;\">SKALA"
);


// section-title
content = content.replace(
  ".section-title {\n          display: flex; align-items: center; gap: 10px; margin: 22px 0 14px;\n        }",
  ".section-title {\n          display: flex; align-items: center; gap: 10px; margin: 22px 0 14px;\n          line-height: normal;\n        }"
);
content = content.replace(
  ".section-title h2 { font-size: 16px; font-weight: 600; margin: 0; }",
  ".section-title h2 { font-size: 16px; font-weight: 600; margin: 0; padding-bottom: 2px; }"
);
content = content.replace(
  ".section-title .idx { font-family: monospace; font-size: 11px; color: ${cAccent}; font-weight: bold; }",
  ".section-title .idx { font-family: monospace; font-size: 11px; color: ${cAccent}; font-weight: bold; padding-bottom: 2px; }"
);


fs.writeFileSync('src/utils/reportGenerator.ts', content);
