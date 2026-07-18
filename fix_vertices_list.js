import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStr = `                            {draftVertices.map((vertex, idx) => {
                              const itemResults = convertFromGeo(vertex.lat, vertex.lon);
                              
                              let displayText = '';
                              let subText = '';
                              
                              if (luasCoordSystem === 'DD') {
                                displayText = \`\${vertex.lat.toFixed(4)}, \${vertex.lon.toFixed(4)}\`;
                                subText = 'WGS84';
                              } else if (luasCoordSystem === 'DMS') {
                                const dmsLat = DESIMAL_KE_DMS(vertex.lat);
                                const dmsLon = DESIMAL_KE_DMS(vertex.lon);
                                const latDir = vertex.lat >= 0 ? 'LU' : 'LS';
                                const lonDir = vertex.lon >= 0 ? 'BT' : 'BB';
                                displayText = \`\${Math.abs(dmsLat.d)}°\${dmsLat.m}'\${dmsLat.s.toFixed(1)}\"\${latDir}\`;
                                subText = \`\${Math.abs(dmsLon.d)}°\${dmsLon.m}'\${dmsLon.s.toFixed(1)}\"\${lonDir}\`;
                              } else if (luasCoordSystem === 'UTM') {
                                displayText = \`X:\${itemResults.utm.x.toFixed(4)} Y:\${itemResults.utm.y.toFixed(4)}\`;
                                subText = \`Zone \${itemResults.utm.zone}\${itemResults.utm.hemi}\`;
                              } else if (luasCoordSystem === 'TM3') {
                                displayText = \`X:\${itemResults.tm3.x.toFixed(4)} Y:\${itemResults.tm3.y.toFixed(4)}\`;
                                subText = \`Zone \${itemResults.tm3.zone}\`;
                              }
                              
                              return (
                                <div key={idx} className="flex items-center justify-between text-[10px] bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-100 font-mono">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="font-extrabold text-[#1B3F79] shrink-0">Pt {idx + 1}</span>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-slate-800 font-black truncate max-w-[125px] sm:max-w-[145px]" title={displayText}>
                                        {displayText}
                                      </span>
                                      <span className="text-[8px] text-slate-500 font-bold tracking-wide uppercase leading-none">
                                        {subText}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Individual delete button */}
                                  <button
                                    type="button"
                                    onClick={() => setDraftVertices(prev => prev.filter((_, i) => i !== idx))}
                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all shrink-0 cursor-pointer"
                                    title="Hapus titik ini"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}`;

const replaceStr = `                            {draftVertices.map((vertex, idx) => {
                              const itemResults = convertFromGeo(vertex.lat, vertex.lon);
                              
                              let displayText = '';
                              let subText = '';
                              
                              if (luasCoordSystem === 'DD') {
                                displayText = \`\${vertex.lat.toFixed(4)}, \${vertex.lon.toFixed(4)}\`;
                              } else if (luasCoordSystem === 'DMS') {
                                const dmsLat = DESIMAL_KE_DMS(vertex.lat);
                                const dmsLon = DESIMAL_KE_DMS(vertex.lon);
                                const latDir = vertex.lat >= 0 ? 'LU' : 'LS';
                                const lonDir = vertex.lon >= 0 ? 'BT' : 'BB';
                                displayText = \`\${Math.abs(dmsLat.d)}°\${dmsLat.m}'\${dmsLat.s.toFixed(1)}\"\${latDir}, \${Math.abs(dmsLon.d)}°\${dmsLon.m}'\${dmsLon.s.toFixed(1)}\"\${lonDir}\`;
                              } else if (luasCoordSystem === 'UTM') {
                                displayText = \`X:\${itemResults.utm.x.toFixed(4)} Y:\${itemResults.utm.y.toFixed(4)} Z:\${itemResults.utm.zone}\${itemResults.utm.hemi}\`;
                              } else if (luasCoordSystem === 'TM3') {
                                displayText = \`X:\${itemResults.tm3.x.toFixed(4)} Y:\${itemResults.tm3.y.toFixed(4)} Z:\${itemResults.tm3.zone}\`;
                              }
                              
                              return (
                                <div key={idx} className="flex items-center justify-between text-[10px] bg-slate-50 hover:bg-slate-100 p-2 rounded-lg border border-slate-100 font-mono">
                                  <div className="flex items-start gap-2">
                                    <span className="font-extrabold text-[#1B3F79] shrink-0 mt-0.5">Pt {idx + 1}</span>
                                    <div className="flex flex-col">
                                      <span className="text-slate-800 font-black whitespace-normal break-all sm:break-normal">
                                        {displayText}
                                      </span>
                                      {subText && (
                                        <span className="text-[8px] text-slate-500 font-bold tracking-wide uppercase leading-none mt-0.5">
                                          {subText}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <button
                                    type="button"
                                    onClick={() => setDraftVertices(prev => prev.filter((_, i) => i !== idx))}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all shrink-0 cursor-pointer self-start"
                                    title="Hapus titik ini"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync('src/App.tsx', content);
  console.log("Success");
} else {
  console.log("Not found");
}

