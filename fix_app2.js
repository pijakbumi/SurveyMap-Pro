import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// In handleRestoreHistory
content = content.replace(
  "setActiveMapCoord(item.geo);",
  "setActiveMapCoord(item.geo);\n    setTimeout(() => { document.getElementById('gis-map-canvas')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);"
);

// In batch list onClick
content = content.replace(
  "setActiveMapCoord({ lat: item.lat, lon: item.lon });",
  "setActiveMapCoord({ lat: item.lat, lon: item.lon });\n                                setTimeout(() => { document.getElementById('gis-map-canvas')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);"
);

fs.writeFileSync('src/App.tsx', content);
