import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const oldFn = `  const handleDownloadTemplateLuas = () => {
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
  };`;

const newFn = `  const handleDownloadTemplateLuas = (format: 'csv' | 'txt' = 'csv') => {
    let fileContent = "";
    let mimeType = format === 'csv' ? 'text/csv' : 'text/plain';
    
    if (luasCoordSystem === 'DD' || luasCoordSystem === 'DMS') {
      if (format === 'csv') {
        fileContent = "Latitude,Longitude,Nama Titik\\n-7.885494, 110.332192, Titik 1\\n-7.889000, 110.335000, Titik 2\\n-7.890000, 110.330000, Titik 3";
      } else {
        fileContent = "-7.885494, 110.332192, Titik 1\\n-7.889000, 110.335000, Titik 2\\n-7.890000, 110.330000, Titik 3";
      }
    } else if (luasCoordSystem === 'UTM') {
      if (format === 'csv') {
        fileContent = "X,Y,Zone,Hemisphere,Nama Titik\\n426365.12, 9128345.82, 49, S, Titik 1\\n426365.12, 9128145.82, 49, S, Titik 2\\n426165.12, 9128245.82, 49, S, Titik 3";
      } else {
        fileContent = "426365.12, 9128345.82, 49, S, Titik 1\\n426365.12, 9128145.82, 49, S, Titik 2\\n426165.12, 9128245.82, 49, S, Titik 3";
      }
    } else if (luasCoordSystem === 'TM3') {
      if (format === 'csv') {
        fileContent = "X,Y,Zone,Nama Titik\\n241285.50, 1428510.40, 49.1, Titik 1\\n241285.50, 1428310.40, 49.1, Titik 2\\n241085.50, 1428410.40, 49.1, Titik 3";
      } else {
        fileContent = "241285.50, 1428510.40, 49.1, Titik 1\\n241285.50, 1428310.40, 49.1, Titik 2\\n241085.50, 1428410.40, 49.1, Titik 3";
      }
    }
    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`template_import_\${luasCoordSystem}.\${format}\`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };`;

content = content.replace(oldFn, newFn);

const oldUI = `                          <button 
                            type="button" 
                            onClick={handleDownloadTemplateLuas}
                            className="text-[9px] text-[#1B3F79] hover:underline font-bold self-center cursor-pointer flex items-center gap-1"
                          >
                            <FileDown className="w-3 h-3" /> Unduh Template CSV
                          </button>
                        </div>`;

const newUI = `                          <div className="flex items-center justify-center gap-2 mt-1">
                            <span className="text-[9px] text-slate-500 font-bold">Unduh Template:</span>
                            <button 
                              type="button" 
                              onClick={() => handleDownloadTemplateLuas('csv')}
                              className="text-[9px] text-[#1B3F79] hover:underline font-bold self-center cursor-pointer flex items-center gap-0.5"
                            >
                              <FileDown className="w-3 h-3" /> CSV
                            </button>
                            <span className="text-[9px] text-slate-300">|</span>
                            <button 
                              type="button" 
                              onClick={() => handleDownloadTemplateLuas('txt')}
                              className="text-[9px] text-[#1B3F79] hover:underline font-bold self-center cursor-pointer flex items-center gap-0.5"
                            >
                              <FileDown className="w-3 h-3" /> TXT
                            </button>
                          </div>
                        </div>`;

content = content.replace(oldUI, newUI);
fs.writeFileSync('src/App.tsx', content);

