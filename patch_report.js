import fs from 'fs';

let content = fs.readFileSync('src/utils/reportGenerator.ts', 'utf-8');

// 1. dateStr month: 'short' -> 'long'
content = content.replace("month: 'short'", "month: 'long'");

// 2. header-tags justify-content: center
content = content.replace("display: flex; gap: 8px; margin-top: 20px; flex-wrap: wrap;", "display: flex; gap: 8px; margin-top: 20px; flex-wrap: wrap; justify-content: center;");

// 3. remove Hasil pengukuran digitasi N patok
content = content.replace(/<div class="sub">Hasil pengukuran digitasi \$\{pts\.length\} patok<\/div>/g, "");

// 4. remove SKALA tag
content = content.replace(/<span class="tag">SKALA 1:\$\{niceScaleDenominator\}<\/span>/g, "");

// 5. stat label color
content = content.replace("color: ${cFaint}; font-weight: 600; margin-bottom: 6px;", "color: #475569; font-weight: 600; margin-bottom: 6px;");

// 6. Jumlah Patok -> Jumlah Titik
content = content.replace('<div class="label">Jumlah Patok</div>', '<div class="label">Jumlah Titik</div>');

// 7. luasSqm maximumFractionDigits: 0
content = content.replace("polygon.luasSqm.toLocaleString('id-ID', { maximumFractionDigits: 2 })", "polygon.luasSqm.toLocaleString('id-ID', { maximumFractionDigits: 0 })");

// 8. sketch-caption and scale bar removal
content = content.replace(/<!-- Scale bar -->[\s\S]*?<\/g>\s*<!-- Corner coord ticks -->/, "<!-- Corner coord ticks -->");
content = content.replace(/<div class="sketch-caption">[\s\S]*?<\/div>/, "");

// 9. #1E293B -> #1B3F79 in table headers
content = content.replace("background: #1E293B; color: #94A3B8;", "background: #1B3F79; color: #CBD5E1;");

// 10. Label nama/nomor titik patok dikecilkan
content = content.replace(/font-size="12"/, 'font-size="9"');
content = content.replace(/r="13"/, 'r="9"');
content = content.replace(/y="\$\{p\.y \+ 4\.5\}"/, 'y="${p.y + 3}"');

// 11. Patok -> Titik in table
content = content.replace('<th rowspan="2" style="width:64px; border-left:none;">Patok</th>', '<th rowspan="2" style="width:64px; border-left:none;">Titik</th>');

// 12. TM3 table format
content = content.replace('<th colspan="2">TM3 (Zona ${tm3ZoneStr})</th>', '<th colspan="3">TM3</th>');
content = content.replace(/<th colspan="2">Geografis \(WGS84\)<\/th><th colspan="3">UTM<\/th><th colspan="2">TM3 \(Zona \$\{tm3ZoneStr\}\)<\/th>/, '<th colspan="2">Geografis (WGS84)</th><th colspan="3">UTM</th><th colspan="3">TM3</th>');
content = content.replace("<th style=\"border-left:none;\">X</th><th>Y</th>", "<th style=\"border-left:none;\">X</th><th>Y</th><th>Zona TM3</th>"); // the TM3 specific one
content = content.replace(/<th>Zona<\/th><th>X<\/th><th>Y<\/th>/, "<th>Zona</th><th>X</th><th>Y</th><th>Zona TM3</th>");

content = content.replace(/<td>\$\{p\.tm3\.x\.toFixed\(3\)\}<\/td><td>\$\{p\.tm3\.y\.toFixed\(3\)\}<\/td>(?!\s*<td style="color)/g, "<td>${p.tm3.x.toFixed(3)}</td><td>${p.tm3.y.toFixed(3)}</td><td style=\"color:${cMuted}; font-size:11px;\">${p.tm3.zone}</td>");

// 13. Dihasilkan otomatis
content = content.replace("Dihasilkan otomatis oleh sistem SurveyMap Pro pada ${dateStr}. Proyeksi kalkulasi: UTM/TM3, referensi datum WGS84.", "Dihasilkan otomatis oleh sistem SurveyMap Pro pada ${dateStr}.");

// 14. Data Koordinat Patok dimasukkan pada halaman 2
// Wrap header to section 01 in a div with min-height: 1160px;
// We can find `<header class="report-header">` and `</section>` (the first one)
const headerStart = content.indexOf('<header class="report-header">');
const firstSectionEnd = content.indexOf('</section>', headerStart) + '</section>'.length;

content = content.slice(0, headerStart) + '<div style="min-height: 1160px;">\n        ' + content.slice(headerStart, firstSectionEnd) + '\n        </div>' + content.slice(firstSectionEnd);

fs.writeFileSync('src/utils/reportGenerator.ts', content);
