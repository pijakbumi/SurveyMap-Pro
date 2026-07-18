import { GeographicCoord, UtmCoord, Tm3Coord } from '../types';

// Konstanta Ellipsoid WGS84
export const a_ellips = 6378137.0;
export const f_ellips = 1.0 / 298.257223563;
export const k0_UTM = 0.9996;
export const k0_TM3 = 0.9999;

export function Deg2Rad(deg: number): number {
  return (deg * Math.PI) / 180.0;
}

export function Rad2Deg(rad: number): number {
  return (rad * 180.0) / Math.PI;
}

export function ParseTM3Zone(zoneStr: string): number {
  const cleanStr = zoneStr.replace(',', '.');
  const parts = cleanStr.split('.');

  if (parts.length < 2) {
    throw new Error('Format Zona TM3 Salah. Harus berformat Zone.Subzone (contoh: 48.1 atau 50.2)');
  }

  const mainZone = parseInt(parts[0], 10);
  const subZone = parseInt(parts[1], 10);
  
  if (isNaN(mainZone) || isNaN(subZone)) {
    throw new Error('Nilai zona TM3 harus berupa angka.');
  }

  const utmCM = (mainZone - 31) * 6 + 3;

  if (subZone === 1) {
    return utmCM - 1.5;
  } else {
    return utmCM + 1.5;
  }
}

export function ForwardTM(
  lat: number,
  lon: number,
  lon0: number,
  k0: number,
  FE: number,
  FN: number
): { X: number; Y: number } {
  const b = a_ellips * (1.0 - f_ellips);
  const e2 = 2.0 * f_ellips - f_ellips * f_ellips;
  const ep2 = e2 / (1.0 - e2);

  const latRad = Deg2Rad(lat);
  const lonRad = Deg2Rad(lon);
  const lon0Rad = Deg2Rad(lon0);

  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);

  const N = a_ellips / Math.sqrt(1.0 - e2 * sinLat * sinLat);
  const T = Math.pow(Math.tan(latRad), 2);
  const C = ep2 * cosLat * cosLat;
  const A_val = (lonRad - lon0Rad) * cosLat;

  const m =
    a_ellips *
    ((1.0 - e2 / 4.0 - (3.0 * e2 * e2) / 64.0 - (5.0 * Math.pow(e2, 3)) / 256.0) * latRad -
      ((3.0 * e2) / 8.0 + (3.0 * e2 * e2) / 32.0 + (45.0 * Math.pow(e2, 3)) / 1024.0) * Math.sin(2.0 * latRad) +
      ((15.0 * e2 * e2) / 256.0 + (45.0 * Math.pow(e2, 3)) / 1024.0) * Math.sin(4.0 * latRad) -
      ((35.0 * Math.pow(e2, 3)) / 3072.0) * Math.sin(6.0 * latRad));

  const X =
    FE +
    k0 *
      N *
      (A_val +
        ((1.0 - T + C) * Math.pow(A_val, 3)) / 6.0 +
        ((5.0 - 18.0 * T + T * T + 72.0 * C - 58.0 * ep2) * Math.pow(A_val, 5)) / 120.0);

  const Y =
    FN +
    k0 * m +
    k0 *
      N *
      Math.tan(latRad) *
      ((A_val * A_val) / 2.0 +
        ((5.0 - T + 9.0 * C + 4.0 * C * C) * Math.pow(A_val, 4)) / 24.0 +
        ((61.0 - 58.0 * T + T * T + 600.0 * C - 330.0 * ep2) * Math.pow(A_val, 6)) / 720.0);

  return { X, Y };
}

export function InverseTM(
  X: number,
  Y: number,
  lon0: number,
  k0: number,
  FE: number,
  FN: number
): { lat: number; lon: number } {
  const trueY = Y - FN;
  const e2 = 2.0 * f_ellips - f_ellips * f_ellips;
  const ep2 = e2 / (1.0 - e2);
  const e1 = (1.0 - Math.sqrt(1.0 - e2)) / (1.0 + Math.sqrt(1.0 - e2));

  const m = trueY / k0;
  const mu =
    m / (a_ellips * (1.0 - e2 / 4.0 - (3.0 * e2 * e2) / 64.0 - (5.0 * Math.pow(e2, 3)) / 256.0));

  const phi1 =
    mu +
    ((3.0 * e1) / 2.0 - (27.0 * Math.pow(e1, 3)) / 32.0) * Math.sin(2.0 * mu) +
    ((21.0 * e1 * e1) / 16.0 - (55.0 * Math.pow(e1, 4)) / 32.0) * Math.sin(4.0 * mu) +
    ((151.0 * Math.pow(e1, 3)) / 96.0) * Math.sin(6.0 * mu);

  const sinPhi1 = Math.sin(phi1);
  const cosPhi1 = Math.cos(phi1);
  const tanPhi1 = Math.tan(phi1);

  const N1 = a_ellips / Math.sqrt(1.0 - e2 * sinPhi1 * sinPhi1);
  const T1 = tanPhi1 * tanPhi1;
  const C1 = ep2 * cosPhi1 * cosPhi1;
  const R1 = (a_ellips * (1.0 - e2)) / Math.pow(1.0 - e2 * sinPhi1 * sinPhi1, 1.5);
  const d = (X - FE) / (N1 * k0);

  let lat =
    phi1 -
    ((N1 * tanPhi1) / R1) *
      ((d * d) / 2.0 -
        ((5.0 + 3.0 * T1 + 10.0 * C1 - 4.0 * C1 * C1 - 9.0 * ep2) * Math.pow(d, 4)) / 24.0 +
        ((61.0 + 90.0 * T1 + 298.0 * C1 + 45.0 * T1 * T1 - 252.0 * ep2 - 3.0 * C1 * C1) *
          Math.pow(d, 6)) /
          720.0);

  let lon =
    Deg2Rad(lon0) +
    (d -
      ((1.0 + 2.0 * T1 + C1) * Math.pow(d, 3)) / 6.0 +
      ((5.0 - 2.0 * C1 + 28.0 * T1 - 3.0 * C1 * C1 + 8.0 * ep2 + 24.0 * T1 * T1) * Math.pow(d, 5)) /
        120.0) /
      cosPhi1;

  lat = Rad2Deg(lat);
  lon = Rad2Deg(lon);

  return { lat, lon };
}

// DMS <-> DESIMAL Helpers
export function DMS_KE_DESIMAL(d: number, m: number, s: number): number {
  const sign = d < 0 ? -1 : 1;
  return sign * (Math.abs(d) + m / 60.0 + s / 3600.0);
}

export function DESIMAL_KE_DMS(decimal: number): { d: number; m: number; s: number } {
  const sign = decimal < 0 ? -1 : 1;
  const absVal = Math.abs(decimal);
  const d = Math.floor(absVal);
  const remMinutes = (absVal - d) * 60;
  const m = Math.floor(remMinutes);
  const s = Math.round((remMinutes - m) * 60 * 10000) / 10000; // 4 desimal untuk detik
  return { d: d * sign, m, s };
}

// GEO -> UTM
export function GEO_KE_UTM_ZONA(lon: number): number {
  return Math.floor((lon + 180.0) / 6.0) + 1;
}

export function GEO_KE_UTM_HEMI(lat: number): 'N' | 'S' {
  return lat >= 0 ? 'N' : 'S';
}

export function GEO_KE_UTM_X(lat: number, lon: number): number {
  const z = GEO_KE_UTM_ZONA(lon);
  const cm = (z - 31) * 6 + 3;
  const FN = lat < 0 ? 10000000.0 : 0.0;
  const result = ForwardTM(lat, lon, cm, k0_UTM, 500000.0, FN);
  return result.X;
}

export function GEO_KE_UTM_Y(lat: number, lon: number): number {
  const z = GEO_KE_UTM_ZONA(lon);
  const cm = (z - 31) * 6 + 3;
  const FN = lat < 0 ? 10000000.0 : 0.0;
  const result = ForwardTM(lat, lon, cm, k0_UTM, 500000.0, FN);
  return result.Y;
}

// GEO -> TM-3 BPN
export function GEO_KE_TM3_ZONA(lon: number): string {
  const z = Math.floor((lon + 180.0) / 6.0) + 1;
  const cm = (z - 31) * 6 + 3;
  return lon < cm ? `${z}.1` : `${z}.2`;
}

export function GEO_KE_TM3_X(lat: number, lon: number): number {
  const zoneStr = GEO_KE_TM3_ZONA(lon);
  const cm = ParseTM3Zone(zoneStr);
  const result = ForwardTM(lat, lon, cm, k0_TM3, 200000.0, 1500000.0);
  return result.X;
}

export function GEO_KE_TM3_Y(lat: number, lon: number): number {
  const zoneStr = GEO_KE_TM3_ZONA(lon);
  const cm = ParseTM3Zone(zoneStr);
  const result = ForwardTM(lat, lon, cm, k0_TM3, 200000.0, 1500000.0);
  return result.Y;
}

// UTM -> GEO & TM-3
export function UTM_KE_GEO_LAT(xUtm: number, yUtm: number, zone: number, hemi: 'N' | 'S'): number {
  const cm = (zone - 31) * 6 + 3;
  const FN = hemi === 'S' ? 10000000.0 : 0.0;
  const result = InverseTM(xUtm, yUtm, cm, k0_UTM, 500000.0, FN);
  return result.lat;
}

export function UTM_KE_GEO_LON(xUtm: number, yUtm: number, zone: number, hemi: 'N' | 'S'): number {
  const cm = (zone - 31) * 6 + 3;
  const FN = hemi === 'S' ? 10000000.0 : 0.0;
  const result = InverseTM(xUtm, yUtm, cm, k0_UTM, 500000.0, FN);
  return result.lon;
}

export function UTM_KE_TM3_X(xUtm: number, yUtm: number, zone: number, hemi: 'N' | 'S'): number {
  const lat = UTM_KE_GEO_LAT(xUtm, yUtm, zone, hemi);
  const lon = UTM_KE_GEO_LON(xUtm, yUtm, zone, hemi);
  return GEO_KE_TM3_X(lat, lon);
}

export function UTM_KE_TM3_Y(xUtm: number, yUtm: number, zone: number, hemi: 'N' | 'S'): number {
  const lat = UTM_KE_GEO_LAT(xUtm, yUtm, zone, hemi);
  const lon = UTM_KE_GEO_LON(xUtm, yUtm, zone, hemi);
  return GEO_KE_TM3_Y(lat, lon);
}

// TM-3 BPN -> GEO & UTM
export function TM3_KE_GEO_LAT(xTm3: number, yTm3: number, zoneTm3: string): number {
  const cm = ParseTM3Zone(zoneTm3);
  const result = InverseTM(xTm3, yTm3, cm, k0_TM3, 200000.0, 1500000.0);
  return result.lat;
}

export function TM3_KE_GEO_LON(xTm3: number, yTm3: number, zoneTm3: string): number {
  const cm = ParseTM3Zone(zoneTm3);
  const result = InverseTM(xTm3, yTm3, cm, k0_TM3, 200000.0, 1500000.0);
  return result.lon;
}

export function TM3_KE_UTM_X(xTm3: number, yTm3: number, zoneTm3: string): number {
  const lat = TM3_KE_GEO_LAT(xTm3, yTm3, zoneTm3);
  const lon = TM3_KE_GEO_LON(xTm3, yTm3, zoneTm3);
  return GEO_KE_UTM_X(lat, lon);
}

export function TM3_KE_UTM_Y(xTm3: number, yTm3: number, zoneTm3: string): number {
  const lat = TM3_KE_GEO_LAT(xTm3, yTm3, zoneTm3);
  const lon = TM3_KE_GEO_LON(xTm3, yTm3, zoneTm3);
  return GEO_KE_UTM_Y(lat, lon);
}

// Complete Bundled Converters
export function convertFromGeo(lat: number, lon: number): {
  geo: GeographicCoord;
  utm: UtmCoord;
  tm3: Tm3Coord;
} {
  const utmZone = GEO_KE_UTM_ZONA(lon);
  const utmHemi = GEO_KE_UTM_HEMI(lat);
  const utmX = GEO_KE_UTM_X(lat, lon);
  const utmY = GEO_KE_UTM_Y(lat, lon);

  const tm3Zone = GEO_KE_TM3_ZONA(lon);
  const tm3X = GEO_KE_TM3_X(lat, lon);
  const tm3Y = GEO_KE_TM3_Y(lat, lon);

  return {
    geo: { lat, lon },
    utm: { x: utmX, y: utmY, zone: utmZone, hemi: utmHemi },
    tm3: { x: tm3X, y: tm3Y, zone: tm3Zone }
  };
}

export function convertFromUtm(x: number, y: number, zone: number, hemi: 'N' | 'S'): {
  geo: GeographicCoord;
  utm: UtmCoord;
  tm3: Tm3Coord;
} {
  const lat = UTM_KE_GEO_LAT(x, y, zone, hemi);
  const lon = UTM_KE_GEO_LON(x, y, zone, hemi);

  const tm3Zone = GEO_KE_TM3_ZONA(lon);
  const tm3X = GEO_KE_TM3_X(lat, lon);
  const tm3Y = GEO_KE_TM3_Y(lat, lon);

  return {
    geo: { lat, lon },
    utm: { x, y, zone, hemi },
    tm3: { x: tm3X, y: tm3Y, zone: tm3Zone }
  };
}

export function convertFromTm3(x: number, y: number, zone: string): {
  geo: GeographicCoord;
  utm: UtmCoord;
  tm3: Tm3Coord;
} {
  const lat = TM3_KE_GEO_LAT(x, y, zone);
  const lon = TM3_KE_GEO_LON(x, y, zone);

  const utmZone = GEO_KE_UTM_ZONA(lon);
  const utmHemi = GEO_KE_UTM_HEMI(lat);
  const utmX = GEO_KE_UTM_X(lat, lon);
  const utmY = GEO_KE_UTM_Y(lat, lon);

  return {
    geo: { lat, lon },
    utm: { x: utmX, y: utmY, zone: utmZone, hemi: utmHemi },
    tm3: { x, y, zone }
  };
}
