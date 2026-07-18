import fs from 'fs';

let app = fs.readFileSync('src/App.tsx', 'utf-8');

const oldReturn = `  return (
    <div className="min-h-screen bg-slate-50 bg-radial-glow bg-grid-pattern text-slate-800 flex flex-col font-sans pb-16 lg:pb-0">
      <HeaderPro 
        currentTab={currentAppTab}
        onTabChange={handleTabChange}
        activeMapCoord={activeMapCoord}
        isInsideIndonesia={isInsideIndonesia}
      />`;

const newReturn = `  return (
    <div className="min-h-screen bg-slate-50 bg-radial-glow bg-grid-pattern text-slate-800 flex flex-col font-sans pb-16 lg:pb-0">
      <SupportBanner />
      <HeaderPro 
        currentTab={currentAppTab}
        onTabChange={handleTabChange}
        activeMapCoord={activeMapCoord}
        isInsideIndonesia={isInsideIndonesia}
      />`;

app = app.replace(oldReturn, newReturn);
app = app.replace("import HeaderPro from './components/HeaderPro';", "import HeaderPro from './components/HeaderPro';\nimport SupportBanner from './components/SupportBanner';");

fs.writeFileSync('src/App.tsx', app);
