import fs from 'fs';
let content = fs.readFileSync('src/utils/reportGenerator.ts', 'utf-8');

// eyebrow
content = content.replace(
  ".eyebrow {\n          font-family: monospace;\n          font-size: 11px;\n          letter-spacing: .14em;\n          text-transform: uppercase;\n          color: #38BDF8;\n          display: flex; align-items: center; gap: 8px;\n          margin-bottom: 10px;\n          line-height: 1;\n        }",
  ".eyebrow {\n          font-family: monospace;\n          font-size: 11px;\n          letter-spacing: .14em;\n          text-transform: uppercase;\n          color: #38BDF8;\n          margin-bottom: 10px;\n          line-height: normal;\n        }"
);
content = content.replace(
  ".eyebrow::before { content: \"\"; width: 16px; height: 2px; background: #38BDF8; display: block; }",
  ".eyebrow::before { content: \"\"; width: 16px; height: 2px; background: #38BDF8; display: inline-block; vertical-align: middle; margin-right: 8px; margin-top: -2px; }"
);

// badge
content = content.replace(
  ".badge {\n          display: inline-flex; align-items: center; justify-content: center;\n          color: ${cInk}; font-weight: 700; font-size: 14.5px;\n          line-height: 1;\n        }",
  ".badge {\n          color: ${cInk}; font-weight: 700; font-size: 14.5px;\n          line-height: normal;\n        }"
);

fs.writeFileSync('src/utils/reportGenerator.ts', content);
