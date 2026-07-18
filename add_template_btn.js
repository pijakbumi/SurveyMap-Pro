import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const downloadTemplateFn = `  const handleDownloadTemplateLuas = () => {
    let csvContent = "";
    if (luasCoordSystem === 'DD' || luasCoordSystem === 'DMS') {
      csvContent = "Latitude,Longitude,Nama Titik\\n-7.885494, 110.332192, Titik 1\\n-7.889000, 110.335000, Titik 2\\n-7.890000, 110.330000, Titik 3";
    } else if (luasCoordSystem === 'UTM') {
      csvContent = "X,Y,Zone,Hemisphere,Nama Titik\\n426365.12, 9128345.82, 49, S, Titik 1\\n426365.12, 9128145.82, 49, S, Titik 2\\n426165.12, 9128245.82, 49, S, Titik 3";
    } else if (luasCoordSystem === 'TM3') {
      csvContent = "X,Y,Zone,Nama Titik\\n241285.50, 1428510.40, 49.1, Titik 1\\n241285.50, 1428310.40, 49.1, Titik 2\\n241085.50, 1428410.40, 49.1, Titik 3";
    }
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`template_import_\${luasCoordSystem}.csv\`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportLuasBatch`;

content = content.replace("  const handleImportLuasBatch", downloadTemplateFn);

const oldActions = `                        <label className="bg-white border-2 border-slate-300 hover:bg-slate-50 text-slate-700 text-[10px] font-extrabold py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm">
                          <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                          Import TXT/CSV
                          <input type="file" accept=".txt,.csv" className="hidden" onChange={handleImportLuasBatch} />
                        </label>`;

const newActions = `                        <div className="flex flex-col gap-1.5">
                          <label className="bg-white border-2 border-slate-300 hover:bg-slate-50 text-slate-700 text-[10px] font-extrabold py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm w-full">
                            <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                            Import TXT/CSV
                            <input type="file" accept=".txt,.csv" className="hidden" onChange={handleImportLuasBatch} />
                          </label>
                          <button 
                            type="button" 
                            onClick={handleDownloadTemplateLuas}
                            className="text-[9px] text-[#1B3F79] hover:underline font-bold self-center cursor-pointer flex items-center gap-1"
                          >
                            <FileDown className="w-3 h-3" /> Unduh Template CSV
                          </button>
                        </div>`;

content = content.replace(oldActions, newActions);

fs.writeFileSync('src/App.tsx', content);

