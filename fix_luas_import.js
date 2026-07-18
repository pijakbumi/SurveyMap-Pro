import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const importHandler = `  const handleImportLuasBatch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const sourceType = (luasCoordSystem === 'DD' || luasCoordSystem === 'DMS') ? 'GEO' : luasCoordSystem;
        const parsed = parseBatchCoordinates(text, sourceType);
        
        const newVertices = parsed
          .filter(p => p.isValid && p.lat !== null && p.lon !== null)
          .map(p => ({ lat: p.lat as number, lon: p.lon as number }));
          
        if (newVertices.length > 0) {
          setDraftVertices(prev => [...prev, ...newVertices]);
          const last = newVertices[newVertices.length - 1];
          const out = convertFromGeo(last.lat, last.lon);
          setActiveMapCoord({lat: last.lat, lon: last.lon});
          setResults(out);
          setErrors([]);
        } else {
          setErrors([{ field: 'Import Batch', message: 'Tidak ada koordinat valid ditemukan. Pastikan format input sesuai.' }]);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (`;

content = content.replace("  return (", importHandler);

const oldActions = `                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleTambahTitikManual}
                          className="bg-white border-2 border-[#1B3F79] hover:bg-slate-50 text-[#1B3F79] text-[10px] font-extrabold py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#1B3F79]" />
                          Tambah Titik
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            if (draftVertices.length < 3) return;
                            const areaResult = calculateArea(draftVertices);
                            const newPoly: BidangTanah = {
                              id: \`poly-\${Date.now()}-\${Math.random().toString(36).substr(2, 4)}\`,
                              nama: draftNama.trim() || \`Bidang \${polygons.length + 1}\`,
                              coordinates: draftVertices,
                              luasSqm: areaResult.luasSqm,
                              luasHa: areaResult.luasHa,
                              warna: '#1B3F79'
                            };
                            setPolygons(prev => [...prev, newPoly]);
                            setIsDrafting(false);
                            setDraftVertices([]);
                          }}
                          disabled={draftVertices.length < 3}
                          className="bg-[#1B3F79] disabled:opacity-50 hover:bg-[#2455A2] text-white text-[10px] font-extrabold py-2 px-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Simpan Bidang
                        </button>
                      </div>`;

const newActions = `                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleTambahTitikManual}
                          className="bg-white border-2 border-[#1B3F79] hover:bg-slate-50 text-[#1B3F79] text-[10px] font-extrabold py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#1B3F79]" />
                          Tambah Titik
                        </button>
                        
                        <label className="bg-white border-2 border-slate-300 hover:bg-slate-50 text-slate-700 text-[10px] font-extrabold py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm">
                          <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                          Import TXT/CSV
                          <input type="file" accept=".txt,.csv" className="hidden" onChange={handleImportLuasBatch} />
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (draftVertices.length < 3) return;
                          const areaResult = calculateArea(draftVertices);
                          const newPoly: BidangTanah = {
                            id: \`poly-\${Date.now()}-\${Math.random().toString(36).substr(2, 4)}\`,
                            nama: draftNama.trim() || \`Bidang \${polygons.length + 1}\`,
                            coordinates: draftVertices,
                            luasSqm: areaResult.luasSqm,
                            luasHa: areaResult.luasHa,
                            warna: '#1B3F79'
                          };
                          setPolygons(prev => [...prev, newPoly]);
                          setIsDrafting(false);
                          setDraftVertices([]);
                        }}
                        disabled={draftVertices.length < 3}
                        className="w-full bg-[#1B3F79] disabled:opacity-50 hover:bg-[#2455A2] text-white text-[10px] font-extrabold py-2 px-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer mt-2"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Simpan Bidang
                      </button>`;

content = content.replace(oldActions, newActions);

fs.writeFileSync('src/App.tsx', content);

