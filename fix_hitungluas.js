import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. & 3. Remove "Hitung Luas Bidang Tanah" and redesign "Sistem Koordinat Input"
const oldSistemKoordinat = `              ) : (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#E9EEF2] text-[#1B3F79] rounded-xl border border-[#D1DCE3]">
                    <Map className="w-4.5 h-4.5 text-[#1B3F79] animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider">Hitung Luas Bidang Tanah</span>
                  </div>

                  {/* Sistem Koordinat Input */}
                  <div className="space-y-1.5 bg-[#F8FAFC] border border-slate-200 p-3 rounded-2xl">
                    <label className="text-[10px] font-black text-slate-500 uppercase block">Sistem Koordinat Input</label>
                    <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      {(['DD', 'DMS', 'UTM', 'TM3'] as const).map(sys => (
                        <button
                          key={sys}
                          type="button"
                          onClick={() => setLuasCoordSystem(sys)}
                          className={\`text-[9px] font-black py-1 px-1.5 transition-all text-center rounded-lg cursor-pointer \${
                            luasCoordSystem === sys
                              ? 'bg-[#1B3F79] text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                          }\`}
                        >
                          {sys}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}`;

const newSistemKoordinat = `              ) : (
                <div className="space-y-1.5 bg-[#F8FAFC] border border-slate-200 p-3 rounded-2xl animate-fade-in">
                  <label className="text-[10px] font-black text-slate-500 uppercase block">Sistem Koordinat Input</label>
                  <div className="grid grid-cols-4 gap-1 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
                    {[
                      { id: 'DD', label: 'DD', icon: <Globe className="w-3.5 h-3.5" /> },
                      { id: 'DMS', label: 'DMS', icon: <Compass className="w-3.5 h-3.5" /> },
                      { id: 'UTM', label: 'UTM', icon: <Layers className="w-3.5 h-3.5" /> },
                      { id: 'TM3', label: 'TM-3°', icon: <MapPin className="w-3.5 h-3.5" /> }
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLuasCoordSystem(item.id as 'DD' | 'DMS' | 'UTM' | 'TM3')}
                        className={\`flex flex-col items-center gap-1 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer \${
                          luasCoordSystem === item.id
                            ? 'bg-[#1B3F79] text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                        }\`}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}`;

content = content.replace(oldSistemKoordinat, newSistemKoordinat);

// 2. Reduce space-y-6 to space-y-4 in Parameter Input glass-panel
content = content.replace(
  '<div className="glass-panel rounded-3xl p-6 shadow-md space-y-6">',
  '<div className="glass-panel rounded-3xl p-6 shadow-md space-y-4">'
);
content = content.replace(
  '<div className="space-y-5 animate-fade-in">',
  '<div className="space-y-4 animate-fade-in">'
);

fs.writeFileSync('src/App.tsx', content);
