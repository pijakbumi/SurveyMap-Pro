import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const oldSistem = `              ) : (
                <div className="space-y-1.5 bg-[#F8FAFC] border border-slate-200 p-3 rounded-2xl animate-fade-in">
                  <label className="text-[10px] font-black text-slate-500 uppercase block">Sistem Koordinat Input</label>`;

const newSistem = `              ) : (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-[10px] font-black text-slate-500 uppercase block">Sistem Koordinat Input</label>`;

content = content.replace(oldSistem, newSistem);

fs.writeFileSync('src/App.tsx', content);
