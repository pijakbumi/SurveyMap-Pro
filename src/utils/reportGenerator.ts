import { BidangTanah } from '../types';
import { convertFromGeo, convertFromTm3, convertFromUtm } from './coordinateMath';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFExportSettings {
  basemap: string;
  coordinateSystem: string;
}

const fetchImageAsBase64 = async (url: string) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return null;
  }
};

export const generateReportHTML = async (polygon: BidangTanah, settings: PDFExportSettings) => {
  const pts = polygon.coordinates.map(c => {
    const out = convertFromGeo(c.lat, c.lon);
    return { geo: c, utm: out.utm, tm3: out.tm3 };
  });

  const getCoord = (p: any) => {
    if (settings.coordinateSystem === 'tm3') return { x: p.tm3.x, y: p.tm3.y };
    if (settings.coordinateSystem === 'wgs84') return { x: p.geo.lon, y: p.geo.lat };
    return { x: p.utm.x, y: p.utm.y };
  };

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  
  pts.forEach(p => {
    const c = getCoord(p);
    if (c.x < minX) minX = c.x;
    if (c.x > maxX) maxX = c.x;
    if (c.y < minY) minY = c.y;
    if (c.y > maxY) maxY = c.y;

    if (p.geo.lat < minLat) minLat = p.geo.lat;
    if (p.geo.lat > maxLat) maxLat = p.geo.lat;
    if (p.geo.lon < minLon) minLon = p.geo.lon;
    if (p.geo.lon > maxLon) maxLon = p.geo.lon;
  });

  const rangeX = maxX - minX || 0.0001;
  const rangeY = maxY - minY || 0.0001;
  const padding = 70;
  const svgW = 500;
  const svgH = 420;

  const rawScale = Math.min((svgW - 2 * padding) / rangeX, (svgH - 2 * padding) / rangeY);
  
  let scaleDenominator;
  if (settings.coordinateSystem === 'wgs84') {
     scaleDenominator = (3779.52 * 111320) / rawScale;
  } else {
     scaleDenominator = 3779.52 / rawScale;
  }
  
  const roundScale = (val: number) => {
     if (val <= 100) return Math.ceil(val / 10) * 10;
     if (val <= 1000) return Math.ceil(val / 10) * 10;
     if (val <= 10000) return Math.ceil(val / 100) * 100;
     if (val <= 100000) return Math.ceil(val / 1000) * 1000;
     return Math.ceil(val / 10000) * 10000;
  };
  
  const niceScaleDenominator = roundScale(scaleDenominator);
  
  let scale;
  if (settings.coordinateSystem === 'wgs84') {
     scale = (3779.52 / niceScaleDenominator) * 111320;
  } else {
     scale = 3779.52 / niceScaleDenominator;
  }

  const finalSvgW = svgW;
  const finalSvgH = svgH;

  const mapX = (x: number) => padding + (x - minX) * scale + (finalSvgW - 2 * padding - rangeX * scale) / 2;
  const mapY = (y: number) => padding + (maxY - y) * scale + (finalSvgH - 2 * padding - rangeY * scale) / 2;

  const unmapX = (svgX: number) => minX + (svgX - padding - (finalSvgW - 2 * padding - rangeX * scale) / 2) / scale;
  const unmapY = (svgY: number) => maxY - (svgY - padding - (finalSvgH - 2 * padding - rangeY * scale) / 2) / scale;

  const svgPts = pts.map(p => {
    const c = getCoord(p);
    return { x: mapX(c.x), y: mapY(c.y) };
  });

  const polygonPointsStr = svgPts.map(p => `${p.x},${p.y}`).join(' ');

  let perimeter = 0;
  const edges = svgPts.map((p1, i) => {
    const p2 = svgPts[(i + 1) % svgPts.length];
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    
    const svgDx = p2.x - p1.x;
    const svgDy = p2.y - p1.y;
    let angle = Math.atan2(svgDy, svgDx) * (180 / Math.PI);
    if (angle > 90 || angle < -90) {
      angle += 180;
    }
    
    const utm1 = pts[i].utm;
    const utm2 = pts[(i + 1) % pts.length].utm;
    const dx = utm2.x - utm1.x;
    const dy = utm2.y - utm1.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    perimeter += dist;
    
    const distPx = Math.sqrt(svgDx*svgDx + svgDy*svgDy);
    return { midX, midY, angle, dist, distPx };
  });

  let cx = 0, cy = 0;
  svgPts.forEach(p => { cx += p.x; cy += p.y; });
  cx /= svgPts.length;
  cy /= svgPts.length;

  let stepMeters = 10;
  if (rangeX > 1000) stepMeters = 500;
  else if (rangeX > 500) stepMeters = 100;
  else if (rangeX > 100) stepMeters = 50;
  else if (rangeX > 20) stepMeters = 10;
  else stepMeters = 5;

  let centroidLat = 0, centroidLon = 0;
  let centroidUtmX = 0, centroidUtmY = 0;
  let centroidTm3X = 0, centroidTm3Y = 0;
  if (pts.length > 0) {
    pts.forEach(p => {
      centroidLat += p.geo.lat;
      centroidLon += p.geo.lon;
      centroidUtmX += p.utm.x;
      centroidUtmY += p.utm.y;
      centroidTm3X += p.tm3.x;
      centroidTm3Y += p.tm3.y;
    });
    centroidLat /= pts.length;
    centroidLon /= pts.length;
    centroidUtmX /= pts.length;
    centroidUtmY /= pts.length;
    centroidTm3X /= pts.length;
    centroidTm3Y /= pts.length;
  }

  // wPx needs to be relative to the coordinate system scale.
  // If it's WGS84, stepMeters is meaningless directly unless we convert it.
  const wPx = settings.coordinateSystem === 'wgs84' ? stepMeters * (scale / 111320) : stepMeters * scale;

  const dateStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
  const zoneStr = pts.length > 0 ? `ZONA ${pts[0].utm.zone}${pts[0].utm.hemi}` : '';
  const tm3ZoneStr = pts.length > 0 ? pts[0].tm3.zone : '';

  let tileHtml = '';
  if (settings.basemap !== 'none') {
    const xLeft = unmapX(0);
    const xRight = unmapX(finalSvgW);
    const yTop = unmapY(0);
    const yBottom = unmapY(finalSvgH);

    let expMinLat, expMaxLat, expMinLon, expMaxLon;

    if (settings.coordinateSystem === 'tm3') {
        const zone = pts[0].tm3.zone;
        const p1 = convertFromTm3(xLeft, yBottom, zone);
        const p2 = convertFromTm3(xRight, yTop, zone);
        expMinLon = Math.min(p1.geo.lon, p2.geo.lon);
        expMaxLon = Math.max(p1.geo.lon, p2.geo.lon);
        expMinLat = Math.min(p1.geo.lat, p2.geo.lat);
        expMaxLat = Math.max(p1.geo.lat, p2.geo.lat);
    } else if (settings.coordinateSystem === 'utm') {
        const zone = pts[0].utm.zone;
        const hemi = pts[0].utm.hemi;
        const p1 = convertFromUtm(xLeft, yBottom, zone, hemi);
        const p2 = convertFromUtm(xRight, yTop, zone, hemi);
        expMinLon = Math.min(p1.geo.lon, p2.geo.lon);
        expMaxLon = Math.max(p1.geo.lon, p2.geo.lon);
        expMinLat = Math.min(p1.geo.lat, p2.geo.lat);
        expMaxLat = Math.max(p1.geo.lat, p2.geo.lat);
    } else {
        expMinLon = Math.min(xLeft, xRight);
        expMaxLon = Math.max(xLeft, xRight);
        expMinLat = Math.min(yBottom, yTop);
        expMaxLat = Math.max(yBottom, yTop);
    }

    const maxDiff = Math.max(expMaxLat - expMinLat, expMaxLon - expMinLon);
    let zoom = 19;
    if (maxDiff > 0.1) zoom = 13;
    else if (maxDiff > 0.05) zoom = 14;
    else if (maxDiff > 0.02) zoom = 15;
    else if (maxDiff > 0.01) zoom = 16;
    else if (maxDiff > 0.005) zoom = 17;
    else if (maxDiff > 0.002) zoom = 18;

    const lon2tile = (lon: number, zoom: number) => Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
    const lat2tile = (lat: number, zoom: number) => Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    const tile2lon = (x: number, z: number) => (x / Math.pow(2, z)) * 360 - 180;
    const tile2lat = (y: number, z: number) => {
      const n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
      return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    };

    const txMin = lon2tile(expMinLon, zoom);
    const txMax = lon2tile(expMaxLon, zoom);
    const tyMin = lat2tile(expMaxLat, zoom);
    const tyMax = lat2tile(expMinLat, zoom);

    for (let tx = txMin; tx <= txMax; tx++) {
      for (let ty = tyMin; ty <= tyMax; ty++) {
        const lat1 = tile2lat(ty, zoom);
        const lon1 = tile2lon(tx, zoom);
        const lat2 = tile2lat(ty + 1, zoom);
        const lon2 = tile2lon(tx + 1, zoom);

        const p1 = convertFromGeo(lat1, lon1);
        const p2 = convertFromGeo(lat2, lon2);

        const c1 = getCoord({ geo: p1.geo, utm: p1.utm, tm3: p1.tm3 });
        const c2 = getCoord({ geo: p2.geo, utm: p2.utm, tm3: p2.tm3 });

        const x1 = mapX(c1.x);
        const y1 = mapY(c1.y); 
        const x2 = mapX(c2.x);
        const y2 = mapY(c2.y); 

        const svgX = Math.min(x1, x2);
        const svgY = Math.min(y1, y2);
        const w = Math.abs(x2 - x1);
        const h = Math.abs(y2 - y1);

        const url = settings.basemap === 'satellite'
          ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ty}/${tx}`
          : `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`;
        
        const b64 = await fetchImageAsBase64(url);
        if (b64) {
          tileHtml += `<image x="${svgX}" y="${svgY}" width="${w}" height="${h}" href="${b64}" preserveAspectRatio="none" opacity="${settings.basemap === 'satellite' ? 1.0 : 0.6}"/>`;
        }
      }
    }
  }

  const cInk = '#1B3F79';
  const cPanel = '#FFFFFF';
  const cFaint = '#CBD5E1';
  const cMuted = '#64748B';
  const cAccent = '#0284C7';
  const cPaper = '#F8FAFC';
  const cLine = '#E2E8F0';
  const cStripe = '#F1F5F9';

  const isWgs84 = settings.coordinateSystem === 'wgs84';
  const isUtm = settings.coordinateSystem === 'utm';
  const isTm3 = settings.coordinateSystem === 'tm3';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap" rel="stylesheet">
      <meta charset="utf-8">
      <style>
        
        body { margin: 0; padding: 0; background: #ffffff; }
        .report-root {
          font-family: 'IBM Plex Mono', monospace;
          color: ${cInk};
          background: ${cPaper};
          width: 100%;
          max-width: 820px;
          margin: 0 auto;
          box-sizing: border-box;
        }
        .report-header {
          background: ${cInk};
          color: #fff;
          padding: 34px 40px 64px;
          position: relative;
        }
        .eyebrow {
          font-family: monospace;
          font-size: 11px;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: #38BDF8;
          margin-bottom: 10px;
          line-height: normal;
        }
        .eyebrow::before { content: ""; width: 16px; height: 2px; background: #38BDF8; display: inline-block; vertical-align: middle; margin-right: 8px; margin-top: -2px; }
        .report-header h1 {
          font-size: 34px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -.01em;
        }
        .report-header .sub {
          margin-top: 6px;
          font-size: 13.5px;
          color: #94A3B8;
        }
        .header-tags {
          margin-top: 20px; text-align: left;
        }
        .tag {
          font-family: monospace;
          font-size: 13.5px;
          font-weight: 700;
          color: #E2E8F0;
          display: inline-block;
          vertical-align: middle;
          line-height: normal;
        }
        .summary-grid {
          display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1px;
          background: ${cLine};
          margin: -18px 40px 0;
          position: relative;
          z-index: 10;
          border-radius: 12px;
          overflow: hidden;
        }
        .stat { background: ${cPanel}; padding: 16px 18px; }
        .stat .label {
          font-size: 10.5px; text-transform: uppercase; letter-spacing: .09em;
          color: #475569; font-weight: 600; margin-bottom: 6px;
        }
        .stat .value { font-weight: 700; font-size: 21px; color: ${cInk}; }
        .stat .value small { font-weight: 500; font-size: 12px; color: ${cMuted}; margin-left: 4px; }
        .stat.accent .value { color: ${cAccent}; }
        section { padding: 6px 40px 8px; }
        .section-title {
          display: flex; align-items: center; gap: 10px; margin: 22px 0 14px;
          line-height: normal;
        }
        .section-title h2 { font-size: 16px; font-weight: 600; margin: 0; padding-bottom: 2px; }
        .section-title .idx { font-family: monospace; font-size: 11px; color: ${cAccent}; font-weight: bold; padding-bottom: 2px; }
        .section-title::after { content: ""; flex: 1; height: 1px; background: transparent; }
        .sketch-wrap {
          background: ${cPanel}; border: 1px solid ${cLine}; border-radius: 14px; padding: 10px;
          overflow: auto;
        }
        .sketch-wrap svg { display: block; width: 100%; height: auto; }
        .sketch-caption {
          display: flex; justify-content: space-between; align-items: center;
          font-family: monospace; font-size: 10.5px; color: ${cMuted};
          padding: 10px 6px 2px;
        }
        .table-wrap {
          background: ${cPanel}; border: 1px solid ${cLine}; border-radius: 14px; overflow: hidden;
        }
        table { width: 100%; border-collapse: collapse; }
        thead th {
          background: ${cInk}; color: #fff;
          font-size: 12.5px; font-weight: 600; padding: 10px 10px; text-align: center;
          border-left: 1px solid rgba(255,255,255,.12);
        }
        thead tr.cols th {
          background: #1B3F79; color: #CBD5E1; font-family: monospace; font-size: 12.5px; padding: 8px;
        }
        tbody td {
          font-family: monospace; font-size: 14px; text-align: center; padding: 14px 10px;
          border-top: 1px solid ${cLine};
        }
        tbody tr:nth-child(even) { background: ${cStripe}; }
        .badge {
          color: ${cInk}; font-weight: 700; font-size: 14.5px;
          line-height: normal;
        }
        .report-footer {
          margin-top: 8px; padding: 20px 40px 30px;
          display: flex; justify-content: space-between; align-items: flex-end;
        }
        .report-footer .note { font-size: 11px; color: ${cFaint}; max-width: 420px; line-height: 1.5; }
        .report-footer .gen { font-family: monospace; font-size: 10.5px; color: ${cMuted}; text-align: right; }
      </style>
    </head>
    <body>
      <div class="report-root">
        <div style="min-height: 1160px;">
        <header class="report-header">
          
          <h1>${polygon.nama}</h1>
          
          <div class="header-tags">
            
            <span class="tag" style="margin-right:16px;">BASEMAP: ${settings.basemap === 'none' ? 'TIDAK ADA' : settings.basemap.toUpperCase()}</span>
            <span class="tag" style="margin-right:16px;">SKALA 1:${niceScaleDenominator}</span>
            <span class="tag">UTM ${zoneStr}</span>
          </div>
        </header>

        <div class="summary-grid">
          <div class="stat">
            <div class="label">Luas Bidang</div>
            <div class="value">${Math.floor(polygon.luasSqm).toLocaleString('id-ID')}<small>m²</small> <span style="font-size: 16px; font-weight: 600; color: #64748B;">(${polygon.luasHa.toFixed(2)} Ha)</span></div>
          </div>
          <div class="stat">
            <div class="label">Keliling</div>
            <div class="value">${perimeter.toLocaleString('id-ID', { maximumFractionDigits: 2 })}<small>m</small></div>
          </div>
          <div class="stat">
            <div class="label">Jumlah Titik</div>
            <div class="value">${pts.length}<small>titik</small></div>
          </div>
        </div>

        <section>
          <div class="section-title"><span class="idx">01</span><h2>Sketsa Bidang</h2></div>
          <div class="sketch-wrap">
            <svg viewBox="0 0 ${finalSvgW} ${finalSvgH}" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="${finalSvgW}" height="${finalSvgH}" fill="#F8FAFC" stroke="${cLine}" stroke-width="1.5"/>
              ${tileHtml}
              <!-- Polygon -->
              <polygon points="${polygonPointsStr}" fill="${cAccent}" fill-opacity="0.16" stroke="${cAccent}" stroke-width="2.5" stroke-linejoin="round"/>

              <!-- Edge labels -->
              ${edges.map(e => `
                <text transform="translate(${e.midX}, ${e.midY}) rotate(${e.angle})" y="-4" text-anchor="middle" font-family="monospace" font-size="${Math.min(12, Math.max(5, e.distPx * 0.15))}" font-weight="600" fill="${cInk}" paint-order="stroke" stroke="${cPanel}" stroke-width="2.5">${e.dist.toLocaleString('id-ID', { maximumFractionDigits: 2 })} m</text>
              `).join('')}

              <!-- Patok markers -->
              <g font-family="system-ui, sans-serif" font-weight="700" font-size="${Math.max(4, Math.min(9, 200 / pts.length))}" fill="#fff">
                ${svgPts.map((p, i) => `
                  <circle cx="${p.x}" cy="${p.y}" r="${Math.max(4, Math.min(9, 200 / pts.length))}" fill="${cAccent}" stroke="#fff" stroke-width="2"/>
                  <text x="${p.x}" y="${p.y + Math.max(4, Math.min(9, 200 / pts.length)) * 0.35}" text-anchor="middle">${i + 1}</text>
                `).join('')}
              </g>

              <!-- North arrow -->
              <g transform="translate(${finalSvgW - 40}, 52)">
                <polygon points="0,-20 7,4 0,-2 -7,4" fill="${cInk}"/>
                <text x="0" y="20" text-anchor="middle" font-family="monospace" font-size="11" font-weight="600" fill="${cInk}">U</text>
              </g>

              <!-- Corner coord ticks -->
              <text x="34" y="${finalSvgH - 8}" font-family="monospace" font-size="9" fill="${cFaint}">${settings.coordinateSystem === 'wgs84' ? `${minX.toFixed(5)}° / ${minY.toFixed(5)}°` : `${minX.toFixed(1)} mE / ${minY.toFixed(1)} mN`}</text>
              <text x="${finalSvgW - 34}" y="14" text-anchor="end" font-family="monospace" font-size="9" fill="${cFaint}">${settings.coordinateSystem === 'wgs84' ? `${maxX.toFixed(5)}° / ${maxY.toFixed(5)}°` : `${maxX.toFixed(1)} mE / ${maxY.toFixed(1)} mN`}</text>
            </svg>
            
          </div>
        </section>
        </div>

        <section>
          <div class="section-title"><span class="idx">02</span><h2>Daftar Koordinat Titik</h2></div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th rowspan="2" style="width:64px; border-left:none;">Titik</th>
                  ${isWgs84 ? '<th colspan="2">Geografis (WGS84)</th>' : ''}
                  ${isUtm ? '<th colspan="3">UTM</th>' : ''}
                  ${isTm3 ? `<th colspan="3">TM3</th>` : ''}
                  ${(!isWgs84 && !isUtm && !isTm3) ? `<th colspan="2">Geografis (WGS84)</th><th colspan="3">UTM</th><th colspan="3">TM3</th>` : ''}
                </tr>
                <tr class="cols">
                  ${isWgs84 ? '<th style="border-left:none;">Latitude</th><th>Longitude</th>' : ''}
                  ${isUtm ? '<th style="border-left:none;">X</th><th>Y</th><th>Zona</th>' : ''}
                  ${isTm3 ? '<th style="border-left:none;">X</th><th>Y</th><th>Zona TM3</th>' : ''}
                  ${(!isWgs84 && !isUtm && !isTm3) ? '<th style="border-left:none;">Latitude</th><th>Longitude</th><th>X</th><th>Y</th><th>Zona</th><th>X</th><th>Y</th><th>Zona TM3</th>' : ''}
                </tr>
              </thead>
              <tbody>
                ${pts.map((p, i) => `
                  <tr>
                    <td style="padding: 8px;"><span class="badge">${i + 1}</span></td>
                    ${isWgs84 ? `<td>${p.geo.lat.toFixed(4)}</td><td>${p.geo.lon.toFixed(4)}</td>` : ''}
                    ${isUtm ? `<td>${p.utm.x.toFixed(4)}</td><td>${p.utm.y.toFixed(4)}</td><td style="color:${cMuted}; font-size:12.5px;">${p.utm.zone}${p.utm.hemi}</td>` : ''}
                    ${isTm3 ? `<td>${p.tm3.x.toFixed(4)}</td><td>${p.tm3.y.toFixed(4)}</td><td style="color:${cMuted}; font-size:12.5px;">${p.tm3.zone}</td>` : ''}
                    ${(!isWgs84 && !isUtm && !isTm3) ? `
                      <td>${p.geo.lat.toFixed(4)}</td><td>${p.geo.lon.toFixed(4)}</td>
                      <td>${p.utm.x.toFixed(4)}</td><td>${p.utm.y.toFixed(4)}</td>
                      <td style="color:${cMuted}; font-size:12.5px;">${p.utm.zone}${p.utm.hemi}</td>
                      <td>${p.tm3.x.toFixed(4)}</td><td>${p.tm3.y.toFixed(4)}</td><td style="color:${cMuted}; font-size:12.5px;">${p.tm3.zone}</td>
                    ` : ''}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </section>

        <section style="margin: 40px 40px; padding-top: 30px; border-top: 2px dashed ${cLine};">
          <h2 style="font-size: 14px; margin-bottom: 12px; color: ${cInk}; letter-spacing: -0.02em;">SYARAT, KETENTUAN, DAN PENOLAKAN JAMINAN (DISCLAIMER)</h2>
          <h3 style="font-size: 12px; margin-bottom: 12px; color: ${cMuted};">Hasil Digitasi dan Perhitungan Luas Bidang Tanah Digital</h3>
          
          <div style="background: rgba(239, 68, 68, 0.05); border-left: 3px solid #ef4444; padding: 12px; margin-bottom: 16px; font-size: 11px;">
            <strong style="color: #ef4444;">PENTING:</strong> Peta sketsa, koordinat titik, dan luas bidang dalam laporan ini <strong>bukan</strong> produk hukum resmi dan <strong>tidak memiliki kekuatan hukum</strong>.
          </div>

          <div style="font-size: 11px; line-height: 1.6; color: ${cMuted}; display: grid; gap: 12px;">
            <div>
              <strong style="color: ${cInk}; display: block; margin-bottom: 2px;">1. Dasar Data dan Keterbatasan Akurasi</strong>
              Digitasi dilakukan di atas citra satelit (basemap satellite), bukan hasil pengukuran terestris atau kadastral. Metode ini berpotensi mengandung pergeseran geometris, distorsi proyeksi, dan keterbatasan resolusi spasial yang memengaruhi presisi batas bidang yang diplot.
            </div>
            
            <div>
              <strong style="color: ${cInk}; display: block; margin-bottom: 2px;">2. Bukan Batas Bidang Tanah Resmi</strong>
              Garis batas dan titik koordinat tidak menggantikan atau merepresentasikan batas kepemilikan tanah yang sah.
            </div>

            <div>
              <strong style="color: ${cInk}; display: block; margin-bottom: 2px;">3. Larangan Penggunaan dan Batasan Tanggung Jawab</strong>
              Laporan disediakan sebagaimana adanya dan dilarang dijadikan:<br>
              <strong>a.</strong> alat bukti hukum atau dokumen formal dalam sengketa pertanahan, di dalam maupun di luar pengadilan;<br>
              <strong>b.</strong> dasar transaksi jual-beli, sewa-menyewa, agunan perbankan, atau penetapan nilai investasi yang mengikat secara finansial;<br>
              <strong>c.</strong> acuan konstruksi fisik atau pemancangan patok batas riil tanpa verifikasi lapangan.<br><br>
              Penyedia dibebaskan dari segala tuntutan hukum serta kerugian materiil maupun immateriil &mdash; langsung, tidak langsung, maupun konsekuensial &mdash; yang timbul akibat kelalaian, kesalahan interpretasi, atau penyalahgunaan laporan oleh pengguna maupun pihak ketiga.
            </div>

            <div>
              <strong style="color: ${cInk}; display: block; margin-bottom: 2px;">4. Rekomendasi Penggunaan</strong>
              Laporan berID <strong>${polygon.id.substring(0, 8).toUpperCase()}</strong> ini hanya berlaku untuk estimasi awal, perencanaan internal informal, atau studi akademik. Kepastian luas dan batas yang berkekuatan hukum tetap wajib diperoleh melalui permohonan pengukuran resmi sesuai ketentuan perundang-undangan yang berlaku.
            </div>
          </div>
          
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid ${cLine}; font-size: 10px; color: ${cMuted}; font-style: italic;">
            Dihasilkan otomatis oleh sistem SurveyMap Pro pada ${dateStr}.
          </div>
        </section>
      </div>
    </body>
    </html>
  `;
}

export const generateAndDownloadPDF = async (polygon: BidangTanah, settings: PDFExportSettings) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.left = '-9999px';
  iframe.style.top = '0px';
  iframe.style.width = '840px';
  iframe.style.height = '4000px'; 
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error("Iframe document not accessible");
  }

  const html = await generateReportHTML(polygon, settings);
  
  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  try {
    await iframeDoc.fonts?.ready;
    await new Promise(r => setTimeout(r, 800));

    const element = iframeDoc.querySelector('.report-root') as HTMLElement;
    if (!element) throw new Error("Report element not found in iframe");
    
    element.style.width = '820px';
    
    const canvas = await html2canvas(element, {
      scale: 4,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 820
    });
    
    const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error("Failed to load image from canvas data URL"));
    });

    const ratio = img.height / img.width;
    const renderHeight = pdfWidth * ratio;
    
    let yPos = 0;
    while (yPos < renderHeight) {
      if (yPos > 0) pdf.addPage();
      
      const drawHeight = Math.min(pdfHeight, renderHeight - yPos);
      
      pdf.addImage(
        img, 
        'JPEG', 
        0, 
        -yPos,
        pdfWidth, 
        renderHeight, 
        '', 
        'FAST'
      );
      yPos += pdfHeight;
    }

    pdf.save(`Laporan_Bidang_${polygon.nama.replace(/\s+/g, '_')}.pdf`);
  } catch (err: any) {
    console.error("PDF generation error", err);
    alert(`Terjadi kesalahan saat membuat PDF: ${err.message || err}`);
  } finally {
    document.body.removeChild(iframe);
  }
};
