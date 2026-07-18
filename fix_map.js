import fs from 'fs';
let content = fs.readFileSync('src/components/MapComponent.tsx', 'utf-8');

// dimensi
content = content.replace(
  /dist\.toFixed\(4\)/g,
  "dist.toFixed(2)"
);

// luas m2
content = content.replace(
  /poly\.luasSqm\.toLocaleString\('id-ID', \{ minimumFractionDigits: 1, maximumFractionDigits: 1 \}\)/g,
  "Math.floor(poly.luasSqm).toLocaleString('id-ID')"
);

// luas ha
content = content.replace(
  /poly\.luasHa\.toFixed\(3\)/g,
  "poly.luasHa.toFixed(2)"
);

fs.writeFileSync('src/components/MapComponent.tsx', content);
