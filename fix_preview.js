import fs from 'fs';
let content = fs.readFileSync('src/utils/reportGenerator.ts', 'utf-8');

// 1. replace iframe setup
content = content.replace(
  "iframe.style.width = '820px';\n  iframe.style.height = '2000px';",
  "iframe.style.width = '840px';\n  iframe.style.height = '4000px';"
);

// 2. replace timeout to wait for fonts
content = content.replace(
  "await new Promise(r => setTimeout(r, 400));",
  "await iframeDoc.fonts?.ready;\n    await new Promise(r => setTimeout(r, 800));"
);

// 3. add link tags and fix body width
content = content.replace(
  "@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');",
  ""
);
content = content.replace(
  "<head>",
  "<head>\n      <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n      <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n      <link href=\"https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap\" rel=\"stylesheet\">"
);
content = content.replace(
  "body { margin: 0; padding: 0; background: #ffffff; }",
  "body { margin: 0; padding: 0; background: #ffffff; width: 820px; overflow: hidden; }"
);

fs.writeFileSync('src/utils/reportGenerator.ts', content);
