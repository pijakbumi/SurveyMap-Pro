import { Instagram, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full max-w-[1600px] 2xl:max-w-[95%] mx-auto mt-2 mb-24 lg:mb-8 px-4 lg:px-6 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <h4 className="text-[#1B3F79] font-black text-sm uppercase tracking-wider">Pijak Bumi Dev</h4>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Developer perorangan yang membangun aplikasi pemetaan & GIS menggunakan pendekatan vibe coding. SurveyMap Pro dirancang sebagai tools praktis untuk pengolahan koordinat dan survei lapangan.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
            <a href="https://instagram.com/pijak.bumi_" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#1B3F79] transition-colors">
              <Instagram className="w-4 h-4" />
              @pijak.bumi_
            </a>
            <a href="mailto:pijakbumi.dev@gmail.com" className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#1B3F79] transition-colors">
              <Mail className="w-4 h-4" />
              pijakbumi.dev@gmail.com
            </a>
          </div>
        </div>
        
        <div className="flex flex-col md:items-end gap-3 w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mt-1">
            © 2026 Pijak Bumi Dev &middot; Version 1.0
          </div>
        </div>
      </div>
    </footer>
  );
}
