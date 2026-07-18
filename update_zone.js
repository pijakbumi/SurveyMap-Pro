import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(
  'displayText = \`X:\${itemResults.utm.x.toFixed(4)} Y:\${itemResults.utm.y.toFixed(4)} Z:\${itemResults.utm.zone}\${itemResults.utm.hemi}\`;',
  'displayText = \`X:\${itemResults.utm.x.toFixed(4)} Y:\${itemResults.utm.y.toFixed(4)} Zone \${itemResults.utm.zone}\${itemResults.utm.hemi}\`;'
);

content = content.replace(
  'displayText = \`X:\${itemResults.tm3.x.toFixed(4)} Y:\${itemResults.tm3.y.toFixed(4)} Z:\${itemResults.tm3.zone}\`;',
  'displayText = \`X:\${itemResults.tm3.x.toFixed(4)} Y:\${itemResults.tm3.y.toFixed(4)} Zone \${itemResults.tm3.zone}\`;'
);

fs.writeFileSync('src/App.tsx', content);

