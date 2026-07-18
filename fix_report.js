import fs from 'fs';
let content = fs.readFileSync('src/utils/reportGenerator.ts', 'utf-8');

// luas m2
content = content.replace(
  "polygon.luasSqm.toLocaleString('id-ID', { maximumFractionDigits: 1 })",
  "Math.floor(polygon.luasSqm).toLocaleString('id-ID')"
);
content = content.replace(
  "polygon.luasSqm.toLocaleString('id-ID', { maximumFractionDigits: 0 })",
  "Math.floor(polygon.luasSqm).toLocaleString('id-ID')"
);

// luas ha
content = content.replace(
  "polygon.luasHa.toFixed(3)",
  "polygon.luasHa.toFixed(2)"
);
content = content.replace(
  "polygon.luasHa.toFixed(4)",
  "polygon.luasHa.toFixed(2)"
);

// coordinate formatting
content = content.replace(
  /\.geo\.lat\.toFixed\(6\)/g,
  ".geo.lat.toFixed(4)"
);
content = content.replace(
  /\.geo\.lon\.toFixed\(6\)/g,
  ".geo.lon.toFixed(4)"
);
content = content.replace(
  /\.utm\.x\.toFixed\(3\)/g,
  ".utm.x.toFixed(4)"
);
content = content.replace(
  /\.utm\.y\.toFixed\(3\)/g,
  ".utm.y.toFixed(4)"
);
content = content.replace(
  /\.tm3\.x\.toFixed\(3\)/g,
  ".tm3.x.toFixed(4)"
);
content = content.replace(
  /\.tm3\.y\.toFixed\(3\)/g,
  ".tm3.y.toFixed(4)"
);

fs.writeFileSync('src/utils/reportGenerator.ts', content);
