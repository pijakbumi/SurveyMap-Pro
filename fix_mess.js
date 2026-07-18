import fs from 'fs';
let c = fs.readFileSync('src/App.tsx', 'utf-8');
c = c.replace(/    const handleImportLuasBatch = \([\s\S]*?    e\.target\.value = '';\n  };\n\n  return \(\) => { active = false; };/, "    return () => { active = false; };");
fs.writeFileSync('src/App.tsx', c);
