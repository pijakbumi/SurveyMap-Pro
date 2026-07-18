import { Compass, MapPin } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: 'CONVERTER' | 'HITUNG_LUAS';
  onTabChange: (tab: 'CONVERTER' | 'HITUNG_LUAS') => void;
}

export default function MobileBottomNav({ currentTab, onTabChange }: MobileBottomNavProps) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2.5 px-4 z-50 flex items-center justify-around shadow-[0_-4px_10px_rgba(0,0,0,0.06)] rounded-t-3xl">
      <button
        onClick={() => onTabChange('CONVERTER')}
        className={`flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
          currentTab === 'CONVERTER' ? 'text-[#1B3F79] scale-105' : 'text-slate-400'
        }`}
      >
        <Compass className="w-5 h-5" />
        <span className="text-[10px] font-black">Konversi</span>
      </button>
      <button
        onClick={() => onTabChange('HITUNG_LUAS')}
        className={`flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
          currentTab === 'HITUNG_LUAS' ? 'text-[#1B3F79] scale-105' : 'text-slate-400'
        }`}
      >
        <MapPin className="w-5 h-5" />
        <span className="text-[10px] font-black">Hitung Luas</span>
      </button>
    </div>
  );
}
