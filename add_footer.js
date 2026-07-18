import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(
  "import HeaderPro from './components/HeaderPro';",
  "import HeaderPro from './components/HeaderPro';\nimport Footer from './components/Footer';"
);

content = content.replace(
  "        </main>\n      )}\n\n      {/* Export PDF Modal */}",
  "        </main>\n      )}\n\n      <Footer />\n\n      {/* Export PDF Modal */}"
);

fs.writeFileSync('src/App.tsx', content);
