import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const targetOld = `                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 tracking-wide">
                    <FileSpreadsheet className="w-4 h-4 text-[#1B3F79]" />
                    Output Hasil Konversi
                  </h2>
                  <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">WGS84 Reference</span>`;

const targetNew = `                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 tracking-wide">
                    <FileSpreadsheet className="w-4 h-4 text-[#1B3F79]" />
                    Output Hasil Konversi
                  </h2>
                  <div className="flex items-center gap-2">
                    {activeMapCoord && (
                      isInsideIndonesia(activeMapCoord.lat, activeMapCoord.lon) ? (
                        <span className="flex items-center gap-1.5 bg-[#E9EEF2]/40 text-[#1B3F79] text-[10px] font-extrabold px-3 py-1 rounded-xl border border-[#1B3F79]/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1B3F79] animate-pulse"></span>
                          Koordinat Valid
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 bg-red-50 text-red-600 text-[10px] font-extrabold px-3 py-1 rounded-xl border border-red-200 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                          Luar Wilayah Indonesia
                        </span>
                      )
                    )}
                    <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-2 py-1 rounded border border-slate-200">WGS84 Reference</span>
                  </div>`;

content = content.replace(targetOld, targetNew);

fs.writeFileSync('src/App.tsx', content);

