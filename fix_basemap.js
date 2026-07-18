import fs from 'fs';
let content = fs.readFileSync('src/utils/reportGenerator.ts', 'utf-8');

content = content.replace(
  "import { convertFromGeo } from './coordinateMath';",
  "import { convertFromGeo, convertFromTm3, convertFromUtm } from './coordinateMath';"
);

// We need to insert unmapX and unmapY after mapX and mapY
const mapXstr = "const mapX = (x: number) => padding + (x - minX) * scale + (finalSvgW - 2 * padding - rangeX * scale) / 2;\n  const mapY = (y: number) => padding + (maxY - y) * scale + (finalSvgH - 2 * padding - rangeY * scale) / 2;";
const unmapXstr = mapXstr + "\n\n  const unmapX = (svgX: number) => minX + (svgX - padding - (finalSvgW - 2 * padding - rangeX * scale) / 2) / scale;\n  const unmapY = (svgY: number) => maxY - (svgY - padding - (finalSvgH - 2 * padding - rangeY * scale) / 2) / scale;";
content = content.replace(mapXstr, unmapXstr);

const oldBasemapCode = `
    const latSpan = maxLat - minLat || 0.0001;
    const lonSpan = maxLon - minLon || 0.0001;
    const expMaxLat = maxLat + latSpan * 0.5;
    const expMinLat = minLat - latSpan * 0.5;
    const expMaxLon = maxLon + lonSpan * 0.5;
    const expMinLon = minLon - lonSpan * 0.5;
`;

const newBasemapCode = `
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
`;
content = content.replace(oldBasemapCode, newBasemapCode);

fs.writeFileSync('src/utils/reportGenerator.ts', content);
