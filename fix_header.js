import fs from 'fs';

let content = fs.readFileSync('src/components/HeaderPro.tsx', 'utf-8');

const importsOld = "import { Compass, LayoutDashboard, MapPin, Archive, Settings, AlertTriangle } from 'lucide-react';";
const importsNew = "import { useState } from 'react';\nimport { Compass, LayoutDashboard, MapPin, Archive, Settings, AlertTriangle, Heart, X, ExternalLink } from 'lucide-react';";

content = content.replace(importsOld, importsNew);

const exportOld = "export default function HeaderPro({ currentTab, onTabChange, activeMapCoord, isInsideIndonesia }: HeaderProProps) {";
const exportNew = "export default function HeaderPro({ currentTab, onTabChange, activeMapCoord, isInsideIndonesia }: HeaderProProps) {\n  const [showSupportModal, setShowSupportModal] = useState(false);";

content = content.replace(exportOld, exportNew);

const returnOld = "  return (\n    <header";
const returnNew = "  return (\n    <>\n    <header";

content = content.replace(returnOld, returnNew);

const oldRightSide = "        {/* Validation Badge inside Header */}\n        {activeMapCoord && (";
const newRightSide = `        {/* Support Button */}
        <button
          onClick={() => setShowSupportModal(true)}
          className="hidden sm:flex items-center gap-1.5 bg-rose-500 hover:bg-rose-400 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-xl border border-rose-400 shadow-sm transition-colors cursor-pointer"
        >
          <Heart className="w-3.5 h-3.5 fill-white" />
          Dukung Proyek Ini
        </button>
        <button
          onClick={() => setShowSupportModal(true)}
          className="flex sm:hidden items-center justify-center bg-rose-500 hover:bg-rose-400 text-white w-8 h-8 rounded-xl border border-rose-400 shadow-sm transition-colors cursor-pointer"
        >
          <Heart className="w-4 h-4 fill-white" />
        </button>

        {/* Validation Badge inside Header */}
        {activeMapCoord && (`;

content = content.replace(oldRightSide, newRightSide);

const oldEnd = "    </header>\n  );\n}";
const newEnd = `    </header>

      {showSupportModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up text-slate-800">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-rose-50/50">
              <h3 className="font-bold text-rose-600 flex items-center gap-2">
                <Heart className="w-4 h-4 fill-rose-600" />
                Dukung Pijak Bumi Dev
              </h3>
              <button 
                onClick={() => setShowSupportModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-sm text-slate-600 leading-relaxed font-medium">
              <p className="text-slate-800 font-bold">
                Terima kasih sudah memberikan dukungan untuk Pijak Bumi Dev.
              </p>
              <p>
                Setiap kontribusi yang kamu berikan akan digunakan untuk mengembangkan fitur baru, meningkatkan kualitas aplikasi, dan menjaga proyek tetap berjalan.
              </p>
              <p>
                Dukungan kamu membantu saya untuk terus membangun tools yang sederhana, fungsional, dan benar-benar bisa digunakan di lapangan.
              </p>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowSupportModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <a
                href="https://trakteer.id/pijakbumi/tip"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowSupportModal(false)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
              >
                <Heart className="w-4 h-4 fill-white" />
                Dukung via Trakteer
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}`;

content = content.replace(oldEnd, newEnd);

fs.writeFileSync('src/components/HeaderPro.tsx', content);

