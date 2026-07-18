export type CoordinateType = 'GEO' | 'DMS' | 'UTM' | 'TM3' | 'BATCH' | 'BIDANG';

export interface GeographicCoord {
  lat: number;
  lon: number;
}

export interface DmsValue {
  d: number;
  m: number;
  s: number;
}

export interface UtmCoord {
  x: number;
  y: number;
  zone: number;
  hemi: 'N' | 'S';
}

export interface Tm3Coord {
  x: number;
  y: number;
  zone: string;
}

export interface BatchCoordinateItem {
  id: string;
  name: string;
  inputRaw: string;
  lat: number | null;
  lon: number | null;
  utmX: number | null;
  utmY: number | null;
  utmZone: number | null;
  utmHemi: 'N' | 'S' | null;
  tm3X: number | null;
  tm3Y: number | null;
  tm3Zone: string | null;
  isValid: boolean;
  error?: string;
}

export interface ConversionHistoryItem {
  id: string;
  timestamp: string;
  inputType: CoordinateType;
  inputDescription: string;
  geo: GeographicCoord;
  utm: UtmCoord;
  tm3: Tm3Coord;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface BidangTanah {
  id: string;
  nama: string;
  coordinates: GeographicCoord[];
  luasSqm: number;
  luasHa: number;
  warna: string;
}
