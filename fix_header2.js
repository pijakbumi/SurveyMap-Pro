import fs from 'fs';

let content = fs.readFileSync('src/components/HeaderPro.tsx', 'utf-8');

const targetStr = `        {/* Validation Badge inside Header */}
        {activeMapCoord && (
          <div className="flex items-center gap-2">
            {isInsideIndonesia(activeMapCoord.lat, activeMapCoord.lon) ? (
              <span className="flex items-center gap-1.5 bg-[#E9EEF2]/15 text-[#E9EEF2] text-[10px] font-extrabold px-3 py-1.5 rounded-xl border border-[#E9EEF2]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                Koordinat Valid
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-red-500/15 text-red-700 text-[10px] font-extrabold px-3 py-1.5 border border-red-500/30 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                Luar Wilayah Indonesia
              </span>
            )}
          </div>
        )}`;

content = content.replace(targetStr, "");
fs.writeFileSync('src/components/HeaderPro.tsx', content);

