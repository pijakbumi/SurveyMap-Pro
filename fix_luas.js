import fs from 'fs';
let content = fs.readFileSync('src/utils/reportGenerator.ts', 'utf-8');

content = content.replace(
  "polygon.luasSqm.toLocaleString('id-ID', { maximumFractionDigits: 0 })",
  "polygon.luasSqm.toLocaleString('id-ID', { maximumFractionDigits: 1 })"
);

content = content.replace(
  "polygon.luasHa.toFixed(4)",
  "polygon.luasHa.toFixed(3)"
);

fs.writeFileSync('src/utils/reportGenerator.ts', content);
