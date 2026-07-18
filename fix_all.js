import fs from 'fs';

// --- reportGenerator.ts ---
let reportStr = fs.readFileSync('src/utils/reportGenerator.ts', 'utf-8');

// 1. Export coordinates to 4 decimals
reportStr = reportStr.replace(/\.toFixed\(6\)/g, ".toFixed(4)");
reportStr = reportStr.replace(/\.toFixed\(3\)/g, ".toFixed(4)");

// 2. luas dalam m2 dibulatkan ke bawah
reportStr = reportStr.replace(
  "polygon.luasSqm.toLocaleString('id-ID', { maximumFractionDigits: 1 })",
  "Math.floor(polygon.luasSqm).toLocaleString('id-ID')"
);
reportStr = reportStr.replace(
  "polygon.luasSqm.toLocaleString('id-ID', { maximumFractionDigits: 0 })",
  "Math.floor(polygon.luasSqm).toLocaleString('id-ID')"
);

// 3. luas dalam hektar 2 angka
reportStr = reportStr.replace(
  "polygon.luasHa.toFixed(4)",
  "polygon.luasHa.toFixed(2)"
);
// wait, I just replaced .toFixed(3) with .toFixed(4) earlier in reportStr!
// Let's reload and be more specific for coordinates.
