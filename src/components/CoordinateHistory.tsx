import { ConversionHistoryItem } from '../types';
import { History, Trash2, ArrowUpRight, Globe, Layers, MapPin, Compass } from 'lucide-react';

interface CoordinateHistoryProps {
  historyList: ConversionHistoryItem[];
  onSelectHistory: (item: ConversionHistoryItem) => void;
  onDeleteHistory: (id: string) => void;
  onClearAll: () => void;
}

export default function CoordinateHistory({
  historyList,
  onSelectHistory,
  onDeleteHistory,
  onClearAll,
}: CoordinateHistoryProps) {
  if (historyList.length === 0) {
    return (
      <div className="glass-panel rounded-3xl p-6 text-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-[#E9EEF2] flex items-center justify-center mx-auto text-slate-500 border border-[#D1DCE3]">
          <History className="w-5 h-5 text-[#1B3F79]" />
        </div>
        <p className="text-xs font-bold text-[#1B3F79]">Belum ada riwayat konversi.</p>
        <p className="text-[10px] text-slate-500 font-medium">
          Konversi pertama Anda akan otomatis tersimpan di sini.
        </p>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'GEO':
        return <Globe className="w-4.5 h-4.5 text-[#1B3F79]" />;
      case 'DMS':
        return <Compass className="w-4.5 h-4.5 text-[#1B3F79]" />;
      case 'UTM':
        return <Layers className="w-4.5 h-4.5 text-[#5B6F7A]" />;
      case 'TM3':
        return <MapPin className="w-4.5 h-4.5 text-emerald-600" />;
      default:
        return <History className="w-4.5 h-4.5 text-slate-500" />;
    }
  };

  const formatTimeWithZone = (dateString: string) => {
  const date = new Date(dateString);
  const timeString = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const tzParts = new Intl.DateTimeFormat('id-ID', { timeZoneName: 'short' }).formatToParts(date);
  const tzString = tzParts.find(p => p.type === 'timeZoneName')?.value || '';
  return `${timeString} ${tzString}`;
};

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'GEO':
        return <span className="bg-[#E9EEF2] text-[#1B3F79] px-2 py-0.5 rounded-lg text-[9px] font-extrabold border border-[#D1DCE3] font-mono">DD (DESIMAL)</span>;
      case 'DMS':
        return <span className="bg-slate-100 text-[#1B3F79] px-2 py-0.5 rounded-lg text-[9px] font-extrabold border border-[#D1DCE3] font-mono">DMS</span>;
      case 'UTM':
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 text-[9px] font-extrabold border border-slate-200 font-mono">UTM GRID</span>;
      case 'TM3':
        return <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-[9px] font-extrabold border border-emerald-200/60 font-mono">TM-3° BPN</span>;
      default:
        return null;
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 space-y-4 shadow-lg border border-[#D1DCE3]">
      <div className="flex items-center justify-between border-b border-[#D1DCE3] pb-3">
        <h3 className="text-sm font-bold text-[#1B3F79] flex items-center gap-2 uppercase tracking-wide">
          <History className="w-4.5 h-4.5 text-[#1B3F79]" />
          Riwayat Konversi
        </h3>
        <button
          onClick={onClearAll}
          className="text-[10px] text-red-600 hover:text-red-700 font-bold transition-colors flex items-center gap-1.5 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-xl border border-red-200/60 cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
          Hapus Semua
        </button>
      </div>

      <div className="max-h-[280px] overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
        {historyList.map((item) => (
          <div
            key={item.id}
            className="group flex items-center justify-between p-3 rounded-2xl bg-white border border-[#D1DCE3] hover:border-[#1B3F79] transition-all duration-200"
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="p-2 rounded-xl bg-[#E9EEF2] border border-[#D1DCE3] shadow-sm mt-0.5">
                {getTypeIcon(item.inputType)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {getTypeBadge(item.inputType)}
                  <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                    {formatTimeWithZone(item.timestamp)}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 font-mono truncate">
                  {item.inputDescription}
                </p>
                <p className="text-[10px] text-slate-500 font-bold truncate mt-0.5">
                  Lat: {item.geo.lat.toFixed(4)}°, Lon: {item.geo.lon.toFixed(4)}°
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={() => onSelectHistory(item)}
                title="Muat Ulang Koordinat"
                className="p-2 rounded-xl bg-[#E9EEF2] hover:bg-[#1B3F79] hover:text-white text-[#1B3F79] border border-[#D1DCE3] transition-all cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteHistory(item.id)}
                title="Hapus"
                className="p-2 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-[#D1DCE3] hover:border-red-200 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
