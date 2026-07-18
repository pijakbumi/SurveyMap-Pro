import { useState } from 'react';
import { Compass, LayoutDashboard, MapPin, Archive, Settings, AlertTriangle, Heart, X, ExternalLink } from 'lucide-react';
import { GeographicCoord } from '../types';

interface HeaderProProps {
  currentTab: 'CONVERTER' | 'HITUNG_LUAS';
  onTabChange: (tab: 'CONVERTER' | 'HITUNG_LUAS') => void;
  activeMapCoord: GeographicCoord | null;
  isInsideIndonesia: (lat: number, lon: number) => boolean;
}

export default function HeaderPro({ currentTab, onTabChange, activeMapCoord, isInsideIndonesia }: HeaderProProps) {
  const [showSupportModal, setShowSupportModal] = useState(false);
  return (
    <>
    <header className="sticky top-0 z-50 bg-[#1B3F79] text-white px-4 py-3.5 lg:px-8 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/10 rounded-xl text-white shadow-inner border border-white/10">
          <Compass className="w-5 h-5 animate-spin-slow text-[#E9EEF2]" />
        </div>
        <div>
          <h1 className="text-base lg:text-lg font-black tracking-widest text-white flex items-center gap-2 uppercase font-mono">
            SURVEYMAP PRO
          </h1>
        </div>
      </div>
      
      {/* Desktop Navigation Tabs */}
      <nav id="tour-tab-container" className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
        <button
          onClick={() => onTabChange('CONVERTER')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            currentTab === 'CONVERTER' ? 'bg-white text-[#1B3F79] shadow-sm font-extrabold' : 'text-blue-100 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4" />
          Konversi Koordinat
        </button>
        <button
          onClick={() => onTabChange('HITUNG_LUAS')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            currentTab === 'HITUNG_LUAS' ? 'bg-white text-[#1B3F79] shadow-sm font-extrabold' : 'text-blue-100 hover:bg-white/10 hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Hitung Luas Bidang
        </button>
      </nav>

      <div className="flex items-center gap-3">
        {/* Support Button */}
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


      </div>
    </header>

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
}
