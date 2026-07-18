import fs from 'fs';
let content = fs.readFileSync('src/utils/reportGenerator.ts', 'utf-8');

// 1. Remove eyebrow
content = content.replace(
  '<div class="eyebrow">Laporan Digitasi Bidang Tanah</div>',
  ''
);

// 2. Remove tag style background, enlarge text
const oldTagCSS = `.tag {
          font-family: monospace;
          font-size: 10.5px;
          color: #E2E8F0;
          border: 1px solid rgba(255,255,255,.22);
          background: rgba(255,255,255,.05);
          padding: 5px 10px 7px;
          border-radius: 100px;
          display: inline-block;
          vertical-align: middle;
          line-height: normal;
        }`;
const newTagCSS = `.tag {
          font-family: monospace;
          font-size: 13.5px;
          font-weight: 700;
          color: #E2E8F0;
          display: inline-block;
          vertical-align: middle;
          line-height: normal;
        }`;
content = content.replace(oldTagCSS, newTagCSS);

// Also remove margin-right from tags inline style, and add margin-right: 16px
content = content.replace(
  /<span class="tag" style="margin-right:8px;">/g,
  '<span class="tag" style="margin-right:16px;">'
);


// 3. Remove "Luas (Hektar)", combine to Luas Bidang
const oldSummaryGridCss = `.summary-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px;`;
const newSummaryGridCss = `.summary-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;`;
content = content.replace(oldSummaryGridCss, newSummaryGridCss);

const oldLuasHtml = `<div class="stat">
            <div class="label">Luas Bidang</div>
            <div class="value">\${Math.floor(polygon.luasSqm).toLocaleString('id-ID')}<small>m²</small></div>
          </div>
          <div class="stat">
            <div class="label">Luas (Hektar)</div>
            <div class="value">\${polygon.luasHa.toFixed(2)}<small>Ha</small></div>
          </div>`;
const newLuasHtml = `<div class="stat">
            <div class="label">Luas Bidang</div>
            <div class="value">\${Math.floor(polygon.luasSqm).toLocaleString('id-ID')}<small>m²</small> <span style="font-size: 16px; font-weight: 600; color: #64748B;">(\${polygon.luasHa.toFixed(2)} Ha)</span></div>
          </div>`;
content = content.replace(oldLuasHtml, newLuasHtml);


// 4. Color font total jumlah titik disamakan dengan keliling.
const oldTitikHtml = `<div class="stat accent">
            <div class="label">Jumlah Titik</div>
            <div class="value">\${pts.length}<small>titik</small></div>
          </div>`;
const newTitikHtml = `<div class="stat">
            <div class="label">Jumlah Titik</div>
            <div class="value">\${pts.length}<small>titik</small></div>
          </div>`;
content = content.replace(oldTitikHtml, newTitikHtml);

// 5. Remove line element after "Sketsa Bidang" and "Data Koordinat Patok"
// and 6. Data Koordinat Patok -> Daftar Koordinat Titik
const oldSectionTitleCSS = `.section-title::after { content: ""; flex: 1; height: 1px; background: \${cLine}; }`;
const newSectionTitleCSS = `.section-title::after { content: ""; flex: 1; height: 1px; background: transparent; }`;
content = content.replace(oldSectionTitleCSS, newSectionTitleCSS);

content = content.replace(
  '<h2>Data Koordinat Patok</h2>',
  '<h2>Daftar Koordinat Titik</h2>'
);

// 7. Ukuran font X Y Zona disamakan dengan Titik
const oldColsCSS = `thead tr.cols th {
          background: #1B3F79; color: #CBD5E1; font-family: monospace; font-size: 11px; padding: 8px;
        }`;
const newColsCSS = `thead tr.cols th {
          background: #1B3F79; color: #CBD5E1; font-family: monospace; font-size: 12.5px; padding: 8px;
        }`;
content = content.replace(oldColsCSS, newColsCSS);


// 8. font size disesuaikan dengan skala (distPx)
content = content.replace(
  'return { midX, midY, angle, dist };',
  'const distPx = Math.sqrt(svgDx*svgDx + svgDy*svgDy);\n    return { midX, midY, angle, dist, distPx };'
);

const oldEdgeLabelHtml = `<text transform="translate(\${e.midX}, \${e.midY}) rotate(\${e.angle})" y="-4" text-anchor="middle" font-family="monospace" font-size="11.5" font-weight="600" fill="\${cInk}" paint-order="stroke" stroke="\${cPanel}" stroke-width="5">\${e.dist.toLocaleString('id-ID', { maximumFractionDigits: 2 })} m</text>`;
const newEdgeLabelHtml = `<text transform="translate(\${e.midX}, \${e.midY}) rotate(\${e.angle})" y="-4" text-anchor="middle" font-family="monospace" font-size="\${Math.min(12, Math.max(5, e.distPx * 0.15))}" font-weight="600" fill="\${cInk}" paint-order="stroke" stroke="\${cPanel}" stroke-width="5">\${e.dist.toLocaleString('id-ID', { maximumFractionDigits: 2 })} m</text>`;
content = content.replace(oldEdgeLabelHtml, newEdgeLabelHtml);

const oldPatokHtml = `<g font-family="system-ui, sans-serif" font-weight="700" font-size="9" fill="#fff">
                \${svgPts.map((p, i) => \`
                  <circle cx="\${p.x}" cy="\${p.y}" r="9" fill="\${cAccent}" stroke="#fff" stroke-width="2"/>
                  <text x="\${p.x}" y="\${p.y + 3}" text-anchor="middle">\${i + 1}</text>
                \`).join('')}
              </g>`;
const newPatokHtml = `<g font-family="system-ui, sans-serif" font-weight="700" font-size="\${Math.max(4, Math.min(9, 200 / pts.length))}" fill="#fff">
                \${svgPts.map((p, i) => \`
                  <circle cx="\${p.x}" cy="\${p.y}" r="\${Math.max(4, Math.min(9, 200 / pts.length))}" fill="\${cAccent}" stroke="#fff" stroke-width="2"/>
                  <text x="\${p.x}" y="\${p.y + Math.max(4, Math.min(9, 200 / pts.length)) * 0.35}" text-anchor="middle">\${i + 1}</text>
                \`).join('')}
              </g>`;
content = content.replace(oldPatokHtml, newPatokHtml);

fs.writeFileSync('src/utils/reportGenerator.ts', content);
