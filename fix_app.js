import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace("import SupportBanner from './components/SupportBanner';\n", "");
content = content.replace("import SupportBanner from './components/SupportBanner';", "");
content = content.replace("      <SupportBanner />\n", "");
content = content.replace("      <SupportBanner />", "");

fs.writeFileSync('src/App.tsx', content);
