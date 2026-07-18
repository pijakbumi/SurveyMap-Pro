import fs from 'fs';
let content = fs.readFileSync('src/utils/reportGenerator.ts', 'utf-8');

content = content.replace(
  "${isUtm ? '<th style=\"border-left:none;\">X</th><th>Y</th><th>Zona TM3</th><th>Zona</th>' : ''}",
  "${isUtm ? '<th style=\"border-left:none;\">X</th><th>Y</th><th>Zona</th>' : ''}"
);

content = content.replace(
  "${isTm3 ? '<th style=\"border-left:none;\">X</th><th>Y</th>' : ''}",
  "${isTm3 ? '<th style=\"border-left:none;\">X</th><th>Y</th><th>Zona TM3</th>' : ''}"
);

fs.writeFileSync('src/utils/reportGenerator.ts', content);
