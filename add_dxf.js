import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add import
content = content.replace(
  "import MapComponent from './components/MapComponent';",
  "import { generateBatchDXF } from './utils/dxfGenerator';\nimport MapComponent from './components/MapComponent';"
);

// 2. Add handleDownloadDXF after handleDownloadCSV
const handleDXF = `
  const handleDownloadDXF = () => {
    if (batchList.length === 0) return;
    
    const dxfContent = generateBatchDXF(batchList);
    const blob = new Blob([dxfContent], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'hasil_konversi_batch.dxf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
`;
content = content.replace(
  "  const handleMapClick",
  handleDXF + "\n  const handleMapClick"
);

// 3. Add DXF button
const csvButton = `<button
                      onClick={handleDownloadCSV}
                      disabled={batchList.length === 0}
                      className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-[#1B3F79] text-[10px] font-extrabold px-2.5 py-1.5 rounded-xl border border-slate-300 shadow-sm cursor-pointer transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      CSV
                    </button>`;
const dxfButton = `${csvButton}
                    <button
                      onClick={handleDownloadDXF}
                      disabled={batchList.length === 0}
                      className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-[#1B3F79] text-[10px] font-extrabold px-2.5 py-1.5 rounded-xl border border-slate-300 shadow-sm cursor-pointer transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      DXF
                    </button>`;
content = content.replace(csvButton, dxfButton);

fs.writeFileSync('src/App.tsx', content);
