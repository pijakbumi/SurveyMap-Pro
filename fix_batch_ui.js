import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const oldGeoRender = `{item.isValid && item.lat !== null && item.lon !== null ? (
                                <div>
                                  <span className="font-bold text-slate-700">{item.lat.toFixed(4)}</span>
                                  <br />
                                  <span className="text-slate-400 font-normal">{item.lon.toFixed(4)}</span>
                                </div>
                              ) : (`;

const newGeoRender = `{item.isValid && item.lat !== null && item.lon !== null ? (
                                <div>
                                  <span className="text-slate-500 font-medium text-[10px] mr-1">Lat:</span><span className="font-bold text-slate-700">{item.lat.toFixed(4)}</span>
                                  <br />
                                  <span className="text-slate-500 font-medium text-[10px] mr-1">Lon:</span><span className="font-bold text-slate-700">{item.lon.toFixed(4)}</span>
                                </div>
                              ) : (`;

const oldUtmRender = `{item.isValid && item.utmX !== null && item.utmY !== null ? (
                                <div>
                                  <span className="font-bold text-slate-700">{item.utmX.toFixed(4)}</span>
                                  <br />
                                  <span className="text-slate-400 font-normal">{item.utmY.toFixed(4)} ({item.utmZone}{item.utmHemi})</span>
                                </div>
                              ) : (`;

const newUtmRender = `{item.isValid && item.utmX !== null && item.utmY !== null ? (
                                <div>
                                  <span className="text-slate-500 font-medium text-[10px] mr-1">X:</span><span className="font-bold text-slate-700">{item.utmX.toFixed(4)}</span>
                                  <br />
                                  <span className="text-slate-500 font-medium text-[10px] mr-1">Y:</span><span className="font-bold text-slate-700">{item.utmY.toFixed(4)} <span className="text-[10px] font-normal text-slate-500">({item.utmZone}{item.utmHemi})</span></span>
                                </div>
                              ) : (`;

const oldTm3Render = `{item.isValid && item.tm3X !== null && item.tm3Y !== null ? (
                                <div>
                                  <span className="font-bold text-[#1B3F79]">{item.tm3X.toFixed(4)}</span>
                                  <br />
                                  <span className="text-slate-400 font-normal">Y:{item.tm3Y.toFixed(4)} ({item.tm3Zone})</span>
                                </div>
                              ) : (`;

const newTm3Render = `{item.isValid && item.tm3X !== null && item.tm3Y !== null ? (
                                <div>
                                  <span className="text-slate-500 font-medium text-[10px] mr-1">X:</span><span className="font-bold text-slate-700">{item.tm3X.toFixed(4)}</span>
                                  <br />
                                  <span className="text-slate-500 font-medium text-[10px] mr-1">Y:</span><span className="font-bold text-slate-700">{item.tm3Y.toFixed(4)} <span className="text-[10px] font-normal text-slate-500">({item.tm3Zone})</span></span>
                                </div>
                              ) : (`;

content = content.replace(oldGeoRender, newGeoRender);
content = content.replace(oldUtmRender, newUtmRender);
content = content.replace(oldTm3Render, newTm3Render);

// Change DXF button to support UTM and TM3
const oldDxfButton = `<button
                      onClick={handleDownloadDXF}
                      disabled={batchList.length === 0}
                      className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-[#1B3F79] text-[10px] font-extrabold px-2.5 py-1.5 rounded-xl border border-slate-300 shadow-sm cursor-pointer transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      DXF
                    </button>`;

const newDxfButtons = `<button
                      onClick={() => handleDownloadDXF('UTM')}
                      disabled={batchList.length === 0}
                      className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-[#1B3F79] text-[10px] font-extrabold px-2.5 py-1.5 rounded-xl border border-slate-300 shadow-sm cursor-pointer transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      DXF (UTM)
                    </button>
                    <button
                      onClick={() => handleDownloadDXF('TM3')}
                      disabled={batchList.length === 0}
                      className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-[#1B3F79] text-[10px] font-extrabold px-2.5 py-1.5 rounded-xl border border-slate-300 shadow-sm cursor-pointer transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      DXF (TM3)
                    </button>`;

content = content.replace(oldDxfButton, newDxfButtons);

const oldHandleDxf = `const handleDownloadDXF = () => {
    if (batchList.length === 0) return;
    
    const dxfContent = generateBatchDXF(batchList);`;

const newHandleDxf = `const handleDownloadDXF = (crs: 'UTM' | 'TM3' = 'UTM') => {
    if (batchList.length === 0) return;
    
    const dxfContent = generateBatchDXF(batchList, crs);`;

content = content.replace(oldHandleDxf, newHandleDxf);

fs.writeFileSync('src/App.tsx', content);

const dxfContent = `export function generateBatchDXF(batchList: any[], crs: 'UTM' | 'TM3' = 'UTM'): string {
  let dxf = "  0\\nSECTION\\n  2\\nENTITIES\\n";

  batchList.forEach(item => {
    let xStr = "";
    let yStr = "";
    let valid = false;

    if (crs === 'UTM' && item.isValid && item.utmX !== null && item.utmY !== null) {
      xStr = item.utmX.toFixed(4);
      yStr = item.utmY.toFixed(4);
      valid = true;
    } else if (crs === 'TM3' && item.isValid && item.tm3X !== null && item.tm3Y !== null) {
      xStr = item.tm3X.toFixed(4);
      yStr = item.tm3Y.toFixed(4);
      valid = true;
    }

    if (valid) {
      const name = item.name || 'Point';
      
      // Add Point
      dxf += "  0\\nPOINT\\n  8\\nPOINTS\\n 10\\n" + xStr + "\\n 20\\n" + yStr + "\\n 30\\n0.0\\n";
      
      // Add Text
      dxf += "  0\\nTEXT\\n  8\\nLABELS\\n 10\\n" + xStr + "\\n 20\\n" + yStr + "\\n 30\\n0.0\\n 40\\n1.0\\n  1\\n" + name + "\\n";
    }
  });

  dxf += "  0\\nENDSEC\\n  0\\nEOF\\n";

  return dxf;
}
`;

fs.writeFileSync('src/utils/dxfGenerator.ts', dxfContent);

