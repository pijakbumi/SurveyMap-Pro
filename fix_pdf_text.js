import fs from 'fs';
let content = fs.readFileSync('src/utils/reportGenerator.ts', 'utf-8');

// fix .tag
content = content.replace(
  ".tag {\n          font-family: monospace;\n          font-size: 10.5px;\n          color: #E2E8F0;\n          border: 1px solid rgba(255,255,255,.22);\n          background: rgba(255,255,255,.05);\n          padding: 5px 10px;\n          border-radius: 100px;\n        }",
  ".tag {\n          font-family: monospace;\n          font-size: 10.5px;\n          color: #E2E8F0;\n          border: 1px solid rgba(255,255,255,.22);\n          background: rgba(255,255,255,.05);\n          padding: 6px 10px;\n          border-radius: 100px;\n          display: inline-flex;\n          align-items: center;\n          line-height: 1;\n        }"
);

// fix .eyebrow
content = content.replace(
  ".eyebrow {\n          font-family: monospace;\n          font-size: 11px;\n          letter-spacing: .14em;\n          text-transform: uppercase;\n          color: #38BDF8;\n          display: flex; align-items: center; gap: 8px;\n          margin-bottom: 10px;\n        }",
  ".eyebrow {\n          font-family: monospace;\n          font-size: 11px;\n          letter-spacing: .14em;\n          text-transform: uppercase;\n          color: #38BDF8;\n          display: flex; align-items: center; gap: 8px;\n          margin-bottom: 10px;\n          line-height: 1;\n        }"
);

content = content.replace(
  ".eyebrow::before { content: \"\"; width: 16px; height: 2px; background: #38BDF8; display: inline-block; }",
  ".eyebrow::before { content: \"\"; width: 16px; height: 2px; background: #38BDF8; display: block; }"
);

// fix .section-title
content = content.replace(
  ".section-title {\n          display: flex; align-items: baseline; gap: 10px; margin: 22px 0 14px;\n        }",
  ".section-title {\n          display: flex; align-items: center; gap: 10px; margin: 22px 0 14px;\n        }"
);

// fix html2canvas options
content = content.replace(
  "scale: 3,",
  "scale: 4,"
);
content = content.replace(
  "canvas.toDataURL('image/jpeg', 0.95);",
  "canvas.toDataURL('image/jpeg', 1.0);"
);

fs.writeFileSync('src/utils/reportGenerator.ts', content);
