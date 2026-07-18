import fs from 'fs';
let content = fs.readFileSync('src/utils/reportGenerator.ts', 'utf-8');

content = content.replace(
  "let zoom = 18;",
  "let zoom = 19;" // Increase max zoom
);

content = content.replace(
  "if (maxDiff > 0.1) zoom = 12;\n    else if (maxDiff > 0.05) zoom = 13;\n    else if (maxDiff > 0.02) zoom = 14;\n    else if (maxDiff > 0.01) zoom = 15;\n    else if (maxDiff > 0.005) zoom = 16;\n    else if (maxDiff > 0.002) zoom = 17;",
  "if (maxDiff > 0.1) zoom = 13;\n    else if (maxDiff > 0.05) zoom = 14;\n    else if (maxDiff > 0.02) zoom = 15;\n    else if (maxDiff > 0.01) zoom = 16;\n    else if (maxDiff > 0.005) zoom = 17;\n    else if (maxDiff > 0.002) zoom = 18;"
);

// also let's make image opacity 1.0 for satellite to reduce blending issues if any
content = content.replace(
  "opacity=\"${settings.basemap === 'satellite' ? 0.9 : 0.6}\"",
  "opacity=\"${settings.basemap === 'satellite' ? 1.0 : 0.6}\""
);

fs.writeFileSync('src/utils/reportGenerator.ts', content);
