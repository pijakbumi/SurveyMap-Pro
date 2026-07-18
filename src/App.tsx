import { useState, useEffect } from 'react';
import { 
  CoordinateType, 
  GeographicCoord, 
  UtmCoord, 
  Tm3Coord, 
  ConversionHistoryItem, 
  ValidationError,
  BatchCoordinateItem,
  BidangTanah
} from './types';
import { 
  convertFromGeo, 
  convertFromUtm, 
  convertFromTm3, 
  DESIMAL_KE_DMS,
  DMS_KE_DESIMAL
} from './utils/coordinateMath';
import { generateBatchDXF } from './utils/dxfGenerator';
import MapComponent from './components/MapComponent';
import CoordinateHistory from './components/CoordinateHistory';
import HeaderPro from './components/HeaderPro';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import { 
  Globe, 
  Layers, 
  MapPin, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertTriangle, 
  FileSpreadsheet, 
  Compass, 
  BookOpen, 
  Sparkles,
  Map,
  Trash2,
  Download,
  UploadCloud,
  Plus,
  Archive,
  Ruler,
  Sliders,
  Undo,
  FileDown,
  X
} from 'lucide-react';

export default function App() {
  // --- SURVEYMAP PRO GLOBAL NAVIGATION STATE ---
  const [currentAppTab, setCurrentAppTab] = useState<'CONVERTER' | 'HITUNG_LUAS'>('CONVERTER');

  const handleTabChange = (tab: 'CONVERTER' | 'HITUNG_LUAS') => {
    setCurrentAppTab(tab);
    if (tab === 'HITUNG_LUAS') {
      setActiveTab('BIDANG');
    } else {
      if (activeTab === 'BIDANG') {
        setActiveTab('GEO');
      }
    }
  };

  const [profileName, setProfileName] = useState<string>('ARFIKA ANANG');
  const [officeName, setOfficeName] = useState<string>('KANTOR PERTANAHAN');
  const [simulatedAccuracy, setSimulatedAccuracy] = useState<number>(7.1);
  const [isGpsFix, setIsGpsFix] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Peralatan Survey widget states
  const [activeSurveyTool, setActiveSurveyTool] = useState<'NONE' | 'KOMPAS' | 'JARAK' | 'OFFSET'>('NONE');
  const [manualCompassHeading, setManualCompassHeading] = useState<number>(245);
  
  // Jarak & Azimuth tool states
  const [calcPt1Lat, setCalcPt1Lat] = useState<string>('-7.8855');
  const [calcPt1Lon, setCalcPt1Lon] = useState<string>('110.3322');
  const [calcPt2Lat, setCalcPt2Lat] = useState<string>('-7.8890');
  const [calcPt2Lon, setCalcPt2Lon] = useState<string>('110.3350');
  const [calcDistResult, setCalcDistResult] = useState<number | null>(null);
  const [calcAzimuthResult, setCalcAzimuthResult] = useState<number | null>(null);

  // Offset Koordinat tool states
  const [offsetBaseLat, setOffsetBaseLat] = useState<string>('-7.8855');
  const [offsetBaseLon, setOffsetBaseLon] = useState<string>('110.3322');
  const [offsetAzimuth, setOffsetAzimuth] = useState<string>('45');
  const [offsetDistance, setOffsetDistance] = useState<string>('120');
  const [offsetResult, setOffsetResult] = useState<GeographicCoord | null>(null);

  // Active Input Tab for Converter: 'GEO' (DD), 'DMS', 'UTM', 'TM3', 'BATCH', 'BIDANG'
  const [activeTab, setActiveTab] = useState<CoordinateType>('GEO');

  // 1. Geografis DD Inputs
  const [latInput, setLatInput] = useState<string>('-7.8855');
  const [lonInput, setLonInput] = useState<string>('110.3322');

  // 2. Geografis DMS Inputs (LU/LS and BT/BB)
  const [dmsLatD, setDmsLatD] = useState<string>('7');
  const [dmsLatM, setDmsLatM] = useState<string>('53');
  const [dmsLatS, setDmsLatS] = useState<string>('7.78');
  const [dmsLatDir, setDmsLatDir] = useState<'N' | 'S'>('S');

  const [dmsLonD, setDmsLonD] = useState<string>('110');
  const [dmsLonM, setDmsLonM] = useState<string>('19');
  const [dmsLonS, setDmsLonS] = useState<string>('55.89');
  const [dmsLonDir, setDmsLonDir] = useState<'E' | 'W'>('E');

  // 3. UTM Inputs
  const [utmX, setUtmX] = useState<string>('426365.1200');
  const [utmY, setUtmY] = useState<string>('9128345.8200');
  const [utmZone, setUtmZone] = useState<number>(49);
  const [utmHemi, setUtmHemi] = useState<'N' | 'S'>('S');

  // 4. TM-3 BPN Inputs
  const [tm3X, setTm3X] = useState<string>('241285.5000');
  const [tm3Y, setTm3Y] = useState<string>('1428510.4000');
  const [tm3Zone, setTm3Zone] = useState<string>('49.1');

  // Converted outputs (Initial state set to Bantul coordinates)
  const [results, setResults] = useState<{
    geo: GeographicCoord;
    utm: UtmCoord;
    tm3: Tm3Coord;
  }>(() => convertFromGeo(-7.885494, 110.332192));

  const [exportPdfSettings, setExportPdfSettings] = useState<{
    isOpen: boolean;
    polygon: BidangTanah | null;
    basemap: string;
    coordinateSystem: string;
  }>({
    isOpen: false,
    polygon: null,
    basemap: 'none',
    coordinateSystem: 'utm'
  });

  const [previewHtml, setPreviewHtml] = useState<string>('');

  useEffect(() => {
    let active = true;
    if (exportPdfSettings.isOpen && exportPdfSettings.polygon) {
      import('./utils/reportGenerator').then(mod => {
        mod.generateReportHTML(exportPdfSettings.polygon!, {
          basemap: exportPdfSettings.basemap,
          coordinateSystem: exportPdfSettings.coordinateSystem
        }).then(html => {
          if (active) setPreviewHtml(html);
        });
      });
    } else {
      setPreviewHtml('');
    }
    return () => { active = false; };
  }, [exportPdfSettings.isOpen, exportPdfSettings.basemap, exportPdfSettings.coordinateSystem, exportPdfSettings.polygon]);

  const [activeMapCoord, _setActiveMapCoord] = useState<GeographicCoord | null>({
    lat: -7.885494,
    lon: 110.332192,
  });

  const setActiveMapCoord = (coord: GeographicCoord | null | ((prev: GeographicCoord | null) => GeographicCoord | null)) => {
    if (typeof coord === 'function') {
      _setActiveMapCoord(prev => {
        const next = coord(prev);
        if (next && (isNaN(next.lat) || isNaN(next.lon) || !isFinite(next.lat) || !isFinite(next.lon) || next.lat < -90 || next.lat > 90 || next.lon < -180 || next.lon > 180)) {
          console.warn('Blocked setting invalid activeMapCoord', next);
          return null;
        }
        return next;
      });
    } else {
      if (coord && (isNaN(coord.lat) || isNaN(coord.lon) || !isFinite(coord.lat) || !isFinite(coord.lon) || coord.lat < -90 || coord.lat > 90 || coord.lon < -180 || coord.lon > 180)) {
        console.warn('Blocked setting invalid activeMapCoord', coord);
        _setActiveMapCoord(null);
      } else {
        _setActiveMapCoord(coord);
      }
    }
  };

  // Validation States
  const [errors, setErrors] = useState<ValidationError[]>([]);

  // History Log State
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);

  // Clipboard Copied State
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Polygons / Saved Land Parcels states
  const [polygons, setPolygons] = useState<BidangTanah[]>([]);
  const [draftVertices, setDraftVertices] = useState<GeographicCoord[]>([]);
  const [isDrafting, setIsDrafting] = useState<boolean>(false);
  const [isSnapEnabled, setIsSnapEnabled] = useState<boolean>(true);
  const [isShowDimensions, setIsShowDimensions] = useState<boolean>(true);
  const [draftNama, setDraftNama] = useState<string>('');
  const [selectedPolygonId, setSelectedPolygonId] = useState<string | null>(null);
  const [luasCoordSystem, setLuasCoordSystem] = useState<'DD' | 'DMS' | 'UTM' | 'TM3'>('DD');

  // Manual Coordinate Input States for Hitung Luas / Tambah Titik
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLon, setManualLon] = useState<string>('');

  const [manualDmsLatDeg, setManualDmsLatDeg] = useState<string>('');
  const [manualDmsLatMin, setManualDmsLatMin] = useState<string>('');
  const [manualDmsLatSec, setManualDmsLatSec] = useState<string>('');
  const [manualDmsLatDir, setManualDmsLatDir] = useState<'LU' | 'LS'>('LS');

  const [manualDmsLonDeg, setManualDmsLonDeg] = useState<string>('');
  const [manualDmsLonMin, setManualDmsLonMin] = useState<string>('');
  const [manualDmsLonSec, setManualDmsLonSec] = useState<string>('');
  const [manualDmsLonDir, setManualDmsLonDir] = useState<'BT' | 'BB'>('BT');

  const [manualUtmX, setManualUtmX] = useState<string>('');
  const [manualUtmY, setManualUtmY] = useState<string>('');
  const [manualUtmZone, setManualUtmZone] = useState<string>('49');
  const [manualUtmHemi, setManualUtmHemi] = useState<'N' | 'S'>('S');

  const [manualTm3X, setManualTm3X] = useState<string>('');
  const [manualTm3Y, setManualTm3Y] = useState<string>('');
  const [manualTm3Zone, setManualTm3Zone] = useState<string>('49.1');

  const syncManualLuasInputs = (lat: number, lon: number) => {
    if (isNaN(lat) || isNaN(lon)) return;
    setManualLat(lat.toFixed(4));
    setManualLon(lon.toFixed(4));

    const dmsLat = DESIMAL_KE_DMS(lat);
    const dmsLon = DESIMAL_KE_DMS(lon);
    
    setManualDmsLatDeg(Math.abs(dmsLat.d).toString());
    setManualDmsLatMin(dmsLat.m.toString());
    setManualDmsLatSec(dmsLat.s.toFixed(2));
    setManualDmsLatDir(lat >= 0 ? 'LU' : 'LS');

    setManualDmsLonDeg(Math.abs(dmsLon.d).toString());
    setManualDmsLonMin(dmsLon.m.toString());
    setManualDmsLonSec(dmsLon.s.toFixed(2));
    setManualDmsLonDir(lon >= 0 ? 'BT' : 'BB');

    try {
      const out = convertFromGeo(lat, lon);
      setManualUtmX(out.utm.x.toFixed(4));
      setManualUtmY(out.utm.y.toFixed(4));
      setManualUtmZone(out.utm.zone.toString());
      setManualUtmHemi(out.utm.hemi);

      setManualTm3X(out.tm3.x.toFixed(4));
      setManualTm3Y(out.tm3.y.toFixed(4));
      setManualTm3Zone(out.tm3.zone);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTambahTitikManual = () => {
    let lat: number | null = null;
    let lon: number | null = null;
    let errorsFound: string[] = [];

    if (luasCoordSystem === 'DD') {
      const l = parseFloat(manualLat);
      const r = parseFloat(manualLon);
      if (isNaN(l) || isNaN(r)) {
        errorsFound.push("Format DD tidak valid.");
      } else if (l < -90 || l > 90 || r < -180 || r > 180) {
        errorsFound.push("DD di luar range (Lat -90 s.d 90, Lon -180 s.d 180).");
      } else {
        lat = l;
        lon = r;
      }
    } else if (luasCoordSystem === 'DMS') {
      const latDegVal = parseFloat(manualDmsLatDeg);
      const latMinVal = parseFloat(manualDmsLatMin);
      const latSecVal = parseFloat(manualDmsLatSec);
      
      const lonDegVal = parseFloat(manualDmsLonDeg);
      const lonMinVal = parseFloat(manualDmsLonMin);
      const lonSecVal = parseFloat(manualDmsLonSec);

      if (
        isNaN(latDegVal) || isNaN(latMinVal) || isNaN(latSecVal) ||
        isNaN(lonDegVal) || isNaN(lonMinVal) || isNaN(lonSecVal)
      ) {
        errorsFound.push("Format DMS tidak lengkap atau tidak valid.");
      } else {
        let latDec = Math.abs(latDegVal) + (latMinVal / 60) + (latSecVal / 3600);
        if (manualDmsLatDir === 'LS') latDec = -latDec;

        let lonDec = Math.abs(lonDegVal) + (lonMinVal / 60) + (lonSecVal / 3600);
        if (manualDmsLonDir === 'BB') lonDec = -lonDec;

        if (latDec < -90 || latDec > 90 || lonDec < -180 || lonDec > 180) {
          errorsFound.push("DMS di luar range (Lat -90 s.d 90, Lon -180 s.d 180).");
        } else {
          lat = latDec;
          lon = lonDec;
        }
      }
    } else if (luasCoordSystem === 'UTM') {
      const x = parseFloat(manualUtmX);
      const y = parseFloat(manualUtmY);
      const zone = parseInt(manualUtmZone);
      const hemi = manualUtmHemi;

      if (isNaN(x) || isNaN(y) || isNaN(zone)) {
        errorsFound.push("Format UTM tidak valid.");
      } else {
        try {
          const converted = convertFromUtm(x, y, zone, hemi);
          if (converted && converted.geo && !isNaN(converted.geo.lat) && !isNaN(converted.geo.lon)) {
            lat = converted.geo.lat;
            lon = converted.geo.lon;
          } else {
            errorsFound.push("Gagal konversi UTM ke Geografis.");
          }
        } catch (e: any) {
          errorsFound.push(e.message || "Gagal konversi UTM ke Geografis.");
        }
      }
    } else if (luasCoordSystem === 'TM3') {
      const x = parseFloat(manualTm3X);
      const y = parseFloat(manualTm3Y);
      const zone = manualTm3Zone;

      if (isNaN(x) || isNaN(y) || !zone) {
        errorsFound.push("Format TM-3 tidak valid.");
      } else {
        try {
          const converted = convertFromTm3(x, y, zone);
          if (converted && converted.geo && !isNaN(converted.geo.lat) && !isNaN(converted.geo.lon)) {
            lat = converted.geo.lat;
            lon = converted.geo.lon;
          } else {
            errorsFound.push("Gagal konversi TM-3 ke Geografis.");
          }
        } catch (e: any) {
          errorsFound.push(e.message || "Gagal konversi TM-3 ke Geografis.");
        }
      }
    }

    if (errorsFound.length > 0) {
      alert(errorsFound.join("\n"));
      return;
    }

    if (lat !== null && lon !== null) {
      const coord = { lat, lon };
      setDraftVertices(prev => [...prev, coord]);
      
      const out = convertFromGeo(lat, lon);
      setActiveMapCoord(coord);
      setResults(out);
      syncManualLuasInputs(lat, lon);
    }
  };

  // Batch states
  const [batchList, setBatchList] = useState<BatchCoordinateItem[]>([]);
  const [batchSourceType, setBatchSourceType] = useState<'GEO' | 'UTM' | 'TM3'>('GEO');
  const [batchRawInput, setBatchRawInput] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Live ticking clock in Indonesian format
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync manual heading changes if device orientation is unavailable or simulated
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) {
        setManualCompassHeading(Math.round(360 - e.alpha));
      }
    };
    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // Sync Hitung Luas App Tab automatically to activeTab='BIDANG' for direct digitization
  useEffect(() => {
    if (currentAppTab === 'HITUNG_LUAS') {
      setActiveTab('BIDANG');
      if (!isDrafting) {
        setIsDrafting(true);
        setDraftVertices([]);
        setDraftNama(`Bidang ${polygons.length + 1}`);
      }
    }
  }, [currentAppTab]);

  // Calculator logic for distance & bearing
  const handleCalculateDistanceAndAzimuth = () => {
    const lat1 = parseFloat(calcPt1Lat);
    const lon1 = parseFloat(calcPt1Lon);
    const lat2 = parseFloat(calcPt2Lat);
    const lon2 = parseFloat(calcPt2Lon);
    
    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
      alert('Mohon masukkan nilai koordinat secara lengkap.');
      return;
    }
    
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    bearing = (bearing + 360) % 360;
    
    setCalcDistResult(distance);
    setCalcAzimuthResult(bearing);
  };

  // Calculator logic for coordinate offset
  const handleCalculateOffset = () => {
    const lat = parseFloat(offsetBaseLat);
    const lon = parseFloat(offsetBaseLon);
    const az = parseFloat(offsetAzimuth);
    const dist = parseFloat(offsetDistance);
    
    if (isNaN(lat) || isNaN(lon) || isNaN(az) || isNaN(dist)) {
      alert('Mohon masukkan semua data offset secara lengkap.');
      return;
    }
    
    const R = 6371000; // Earth radius in meters
    const brng = az * Math.PI / 180;
    const dR = dist / R;
    
    const latRad = lat * Math.PI / 180;
    const lonRad = lon * Math.PI / 180;
    
    const endLat = Math.asin(Math.sin(latRad) * Math.cos(dR) +
                   Math.cos(latRad) * Math.sin(dR) * Math.cos(brng));
    const endLon = lonRad + Math.atan2(Math.sin(brng) * Math.sin(dR) * Math.cos(latRad),
                   Math.cos(dR) - Math.sin(latRad) * Math.sin(endLat));
    
    const resultCoord = {
      lat: endLat * 180 / Math.PI,
      lon: ((endLon * 180 / Math.PI) + 540) % 360 - 180
    };
    
    setOffsetResult(resultCoord);
  };

  // Helper date formatter
  const formatIndonesianDateTime = (date: Date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} • ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')} WIB`;
  };

  // Helper parser for batch coordinate import/paste
  const parseBatchCoordinates = (text: string, sourceType: 'GEO' | 'UTM' | 'TM3') => {
    const lines = text.split(/\r?\n/);
    const items: BatchCoordinateItem[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let delimiter = ',';
      if (trimmed.includes('\t')) {
        delimiter = '\t';
      } else if (trimmed.includes(';')) {
        delimiter = ';';
      } else if (trimmed.includes(',') && !trimmed.includes(';')) {
        delimiter = ',';
      } else {
        delimiter = /\s+/ as any;
      }

      const parts = trimmed.split(delimiter).map(p => p.trim()).filter(Boolean);
      if (parts.length < 2) return;

      const id = `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`;
      
      if (sourceType === 'GEO') {
        let latVal = parseFloat(parts[0]);
        let lonVal = parseFloat(parts[1]);
        let name = `Titik ${index + 1}`;
        
        if (parts.length >= 3) {
          name = parts[2];
        }

        if (isNaN(latVal) && !isNaN(parseFloat(parts[1])) && !isNaN(parseFloat(parts[2]))) {
          name = parts[0];
          latVal = parseFloat(parts[1]);
          lonVal = parseFloat(parts[2]);
        }

        if (isNaN(latVal) || isNaN(lonVal)) {
          items.push({
            id, name, inputRaw: trimmed,
            lat: null, lon: null,
            utmX: null, utmY: null, utmZone: null, utmHemi: null,
            tm3X: null, tm3Y: null, tm3Zone: null,
            isValid: false,
            error: 'Format angka koordinat tidak valid.'
          });
          return;
        }

        if (latVal < -90 || latVal > 90 || lonVal < -180 || lonVal > 180) {
          items.push({
            id, name, inputRaw: trimmed,
            lat: latVal, lon: lonVal,
            utmX: null, utmY: null, utmZone: null, utmHemi: null,
            tm3X: null, tm3Y: null, tm3Zone: null,
            isValid: false,
            error: 'Koordinat di luar batas bumi (Lat -90 s.d 90, Lon -180 s.d 180).'
          });
          return;
        }

        try {
          const converted = convertFromGeo(latVal, lonVal);
          items.push({
            id, name, inputRaw: trimmed,
            lat: latVal, lon: lonVal,
            utmX: converted.utm.x, utmY: converted.utm.y, utmZone: converted.utm.zone, utmHemi: converted.utm.hemi,
            tm3X: converted.tm3.x, tm3Y: converted.tm3.y, tm3Zone: converted.tm3.zone,
            isValid: true
          });
        } catch (err: any) {
          items.push({
            id, name, inputRaw: trimmed,
            lat: latVal, lon: lonVal,
            utmX: null, utmY: null, utmZone: null, utmHemi: null,
            tm3X: null, tm3Y: null, tm3Zone: null,
            isValid: false,
            error: err.message || 'Gagal menghitung konversi.'
          });
        }
      } else if (sourceType === 'UTM') {
        let xIdx = 0, yIdx = 1, zoneIdx = 2, hemiIdx = 3, nameIdx = 4;
        let hasNameFirst = isNaN(parseFloat(parts[0]));
        if (hasNameFirst && parts.length >= 5) {
          nameIdx = 0; xIdx = 1; yIdx = 2; zoneIdx = 3; hemiIdx = 4;
        }

        const xVal = parseFloat(parts[xIdx]);
        const yVal = parseFloat(parts[yIdx]);
        const zoneVal = parseInt(parts[zoneIdx]);
        let hemiVal = (parts[hemiIdx] || 'S').toUpperCase() as 'N' | 'S';
        let name = parts[nameIdx] || `Titik ${index + 1}`;

        if (hemiVal !== 'N' && hemiVal !== 'S') hemiVal = 'S';

        if (isNaN(xVal) || isNaN(yVal) || isNaN(zoneVal)) {
          items.push({
            id, name, inputRaw: trimmed,
            lat: null, lon: null,
            utmX: null, utmY: null, utmZone: null, utmHemi: null,
            tm3X: null, tm3Y: null, tm3Zone: null,
            isValid: false,
            error: 'Format UTM salah (butuh Easting, Northing, Zona, Hemisfer).'
          });
          return;
        }

        try {
          const converted = convertFromUtm(xVal, yVal, zoneVal, hemiVal);
          const isConvertedValid = converted && 
            typeof converted.geo.lat === 'number' && 
            typeof converted.geo.lon === 'number' && 
            !isNaN(converted.geo.lat) && 
            !isNaN(converted.geo.lon) && 
            isFinite(converted.geo.lat) && 
            isFinite(converted.geo.lon);

          items.push({
            id, name, inputRaw: trimmed,
            lat: isConvertedValid ? converted.geo.lat : null,
            lon: isConvertedValid ? converted.geo.lon : null,
            utmX: xVal, utmY: yVal, utmZone: zoneVal, utmHemi: hemiVal,
            tm3X: isConvertedValid ? converted.tm3.x : null,
            tm3Y: isConvertedValid ? converted.tm3.y : null,
            tm3Zone: isConvertedValid ? converted.tm3.zone : null,
            isValid: isConvertedValid,
            error: isConvertedValid ? undefined : 'Hasil konversi menghasilkan koordinat tidak valid (NaN).'
          });
        } catch (err: any) {
          items.push({
            id, name, inputRaw: trimmed,
            lat: null, lon: null,
            utmX: xVal, utmY: yVal, utmZone: zoneVal, utmHemi: hemiVal,
            tm3X: null, tm3Y: null, tm3Zone: null,
            isValid: false,
            error: err.message || 'Gagal menghitung konversi UTM.'
          });
        }
      } else if (sourceType === 'TM3') {
        let xIdx = 0, yIdx = 1, zoneIdx = 2, nameIdx = 3;
        let hasNameFirst = isNaN(parseFloat(parts[0]));
        if (hasNameFirst && parts.length >= 4) {
          nameIdx = 0; xIdx = 1; yIdx = 2; zoneIdx = 3;
        }

        const xVal = parseFloat(parts[xIdx]);
        const yVal = parseFloat(parts[yIdx]);
        const zoneVal = parts[zoneIdx]?.replace(',', '.');
        let name = parts[nameIdx] || `Titik ${index + 1}`;

        if (isNaN(xVal) || isNaN(yVal) || !zoneVal) {
          items.push({
            id, name, inputRaw: trimmed,
            lat: null, lon: null,
            utmX: null, utmY: null, utmZone: null, utmHemi: null,
            tm3X: null, tm3Y: null, tm3Zone: null,
            isValid: false,
            error: 'Format TM-3 salah (butuh Easting, Northing, Zona TM3).'
          });
          return;
        }

        try {
          const converted = convertFromTm3(xVal, yVal, zoneVal);
          const isConvertedValid = converted && 
            typeof converted.geo.lat === 'number' && 
            typeof converted.geo.lon === 'number' && 
            !isNaN(converted.geo.lat) && 
            !isNaN(converted.geo.lon) && 
            isFinite(converted.geo.lat) && 
            isFinite(converted.geo.lon);

          items.push({
            id, name, inputRaw: trimmed,
            lat: isConvertedValid ? converted.geo.lat : null,
            lon: isConvertedValid ? converted.geo.lon : null,
            utmX: isConvertedValid ? converted.utm.x : null,
            utmY: isConvertedValid ? converted.utm.y : null,
            utmZone: isConvertedValid ? converted.utm.zone : null,
            utmHemi: isConvertedValid ? converted.utm.hemi : null,
            tm3X: xVal, tm3Y: yVal, tm3Zone: zoneVal,
            isValid: isConvertedValid,
            error: isConvertedValid ? undefined : 'Hasil konversi menghasilkan koordinat tidak valid (NaN).'
          });
        } catch (err: any) {
          items.push({
            id, name, inputRaw: trimmed,
            lat: null, lon: null,
            utmX: null, utmY: null, utmZone: null, utmHemi: null,
            tm3X: xVal, tm3Y: yVal, tm3Zone: zoneVal,
            isValid: false,
            error: err.message || 'Gagal menghitung konversi TM-3.'
          });
        }
      }
    });

    return items;
  };

  const handleProcessBatch = () => {
    if (!batchRawInput.trim()) return;
    const parsed = parseBatchCoordinates(batchRawInput, batchSourceType);
    setBatchList(parsed);
  };

  const handleClearBatch = () => {
    setBatchList([]);
    setBatchRawInput('');
    localStorage.removeItem('gis_bpn_batch');
  };

  const handleCopyBatchToExcel = () => {
    if (batchList.length === 0) return;

    const header = ['Nama', 'Latitude (WGS84)', 'Longitude (WGS84)', 'UTM Easting (X)', 'UTM Northing (Y)', 'UTM Zone', 'UTM Hemi', 'TM3 Easting (X)', 'TM3 Northing (Y)', 'TM3 Zone', 'Status'].join('\t');
    
    const rows = batchList.map(item => {
      return [
        item.name,
        item.isValid && item.lat !== null ? item.lat.toFixed(4) : '-',
        item.isValid && item.lon !== null ? item.lon.toFixed(4) : '-',
        item.isValid && item.utmX !== null ? item.utmX.toFixed(4) : '-',
        item.isValid && item.utmY !== null ? item.utmY.toFixed(4) : '-',
        item.isValid && item.utmZone !== null ? item.utmZone : '-',
        item.isValid && item.utmHemi !== null ? item.utmHemi : '-',
        item.isValid && item.tm3X !== null ? item.tm3X.toFixed(4) : '-',
        item.isValid && item.tm3Y !== null ? item.tm3Y.toFixed(4) : '-',
        item.isValid && item.tm3Zone !== null ? item.tm3Zone : '-',
        item.isValid ? 'Valid' : `Error: ${item.error}`
      ].join('\t');
    });

    const fullText = [header, ...rows].join('\n');
    navigator.clipboard.writeText(fullText).then(() => {
      setCopiedField('batch_excel');
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handleDownloadCSV = () => {
    if (batchList.length === 0) return;

    const header = ['Nama', 'Latitude (WGS84)', 'Longitude (WGS84)', 'UTM Easting (X)', 'UTM Northing (Y)', 'UTM Zone', 'UTM Hemi', 'TM3 Easting (X)', 'TM3 Northing (Y)', 'TM3 Zone', 'Status'].join(',');
    
    const rows = batchList.map(item => {
      return [
        `"${item.name.replace(/"/g, '""')}"`,
        item.isValid && item.lat !== null ? item.lat.toFixed(4) : '',
        item.isValid && item.lon !== null ? item.lon.toFixed(4) : '',
        item.isValid && item.utmX !== null ? item.utmX.toFixed(4) : '',
        item.isValid && item.utmY !== null ? item.utmY.toFixed(4) : '',
        item.isValid && item.utmZone !== null ? item.utmZone : '',
        item.isValid && item.utmHemi !== null ? item.utmHemi : '',
        item.isValid && item.tm3X !== null ? item.tm3X.toFixed(4) : '',
        item.isValid && item.tm3Y !== null ? item.tm3Y.toFixed(4) : '',
        item.isValid && item.tm3Zone !== null ? item.tm3Zone : '',
        item.isValid ? 'Valid' : `Error: ${item.error}`
      ].join(',');
    });

    const csvContent = "\ufeff" + [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'kalkulator_bpn_batch_konversi.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate area from geographic vertices using TM-3 projection (conformal Transverse Mercator)
  const calculateArea = (coords: GeographicCoord[]): { luasSqm: number; luasHa: number } => {
    if (coords.length < 3) return { luasSqm: 0, luasHa: 0 };
    
    const projectedCoords = coords.map(c => {
      try {
        const out = convertFromGeo(c.lat, c.lon);
        return { x: out.tm3.x, y: out.tm3.y };
      } catch {
        return { x: 0, y: 0 };
      }
    });

    // Shoelace area formula
    let area = 0;
    const n = projectedCoords.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += projectedCoords[i].x * projectedCoords[j].y;
      area -= projectedCoords[j].x * projectedCoords[i].y;
    }
    area = Math.abs(area) / 2;

    return {
      luasSqm: area,
      luasHa: area / 10000
    };
  };

  // Sync batchList to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gis_bpn_batch', JSON.stringify(batchList));
    } catch (e) {
      console.error('Failed to save batch list:', e);
    }
  }, [batchList]);

  // Sync saved parcels to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gis_bpn_parcels', JSON.stringify(polygons));
    } catch (e) {
      console.error('Failed to save land parcels:', e);
    }
  }, [polygons]);

  // Initialize: Load history & trigger default conversion with defensive validation
  useEffect(() => {
    const saved = localStorage.getItem('gis_bpn_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validHistory = parsed.filter(h => h && typeof h === 'object' && h.id && h.inputType && h.geo);
          setHistory(validHistory);
        }
      } catch (e) {
        console.error('Failed to parse history:', e);
        try { localStorage.removeItem('gis_bpn_history'); } catch {}
      }
    }
    const savedBatch = localStorage.getItem('gis_bpn_batch');
    if (savedBatch) {
      try {
        const parsed = JSON.parse(savedBatch);
        if (Array.isArray(parsed)) {
          const validBatch = parsed
            .filter(b => b && typeof b === 'object' && b.id && b.name)
            .map(b => ({
              ...b,
              lat: typeof b.lat === 'number' && !isNaN(b.lat) && isFinite(b.lat) ? b.lat : null,
              lon: typeof b.lon === 'number' && !isNaN(b.lon) && isFinite(b.lon) ? b.lon : null,
              utmX: typeof b.utmX === 'number' && !isNaN(b.utmX) && isFinite(b.utmX) ? b.utmX : null,
              utmY: typeof b.utmY === 'number' && !isNaN(b.utmY) && isFinite(b.utmY) ? b.utmY : null,
              tm3X: typeof b.tm3X === 'number' && !isNaN(b.tm3X) && isFinite(b.tm3X) ? b.tm3X : null,
              tm3Y: typeof b.tm3Y === 'number' && !isNaN(b.tm3Y) && isFinite(b.tm3Y) ? b.tm3Y : null,
            }));
          setBatchList(validBatch);
        }
      } catch (e) {
        console.error('Failed to parse batch:', e);
        try { localStorage.removeItem('gis_bpn_batch'); } catch {}
      }
    }
    const savedParcels = localStorage.getItem('gis_bpn_parcels');
    if (savedParcels) {
      try {
        const parsed = JSON.parse(savedParcels);
        if (Array.isArray(parsed)) {
          const validPolygons = parsed
            .filter(p => p && typeof p === 'object' && p.id && Array.isArray(p.coordinates))
            .map(p => ({
              ...p,
              coordinates: p.coordinates.filter(
                (c: any) => c && typeof c.lat === 'number' && typeof c.lon === 'number' &&
                !isNaN(c.lat) && !isNaN(c.lon) && isFinite(c.lat) && isFinite(c.lon)
              )
            }))
            .filter(p => p.coordinates.length >= 3);
          setPolygons(validPolygons);
        }
      } catch (e) {
        console.error('Failed to parse parcels:', e);
        try { localStorage.removeItem('gis_bpn_parcels'); } catch {}
      }
    }
    syncDmsInputs(-7.885494, 110.332192);
  }, []);

  // Sync helper for DMS states
  const syncDmsInputs = (lat: number, lon: number) => {
    const latDms = DESIMAL_KE_DMS(lat);
    const lonDms = DESIMAL_KE_DMS(lon);

    setDmsLatD(Math.abs(latDms.d).toString());
    setDmsLatM(latDms.m.toString());
    setDmsLatS(latDms.s.toFixed(2));
    setDmsLatDir(lat >= 0 ? 'N' : 'S');

    setDmsLonD(Math.abs(lonDms.d).toString());
    setDmsLonM(lonDms.m.toString());
    setDmsLonS(lonDms.s.toFixed(2));
    setDmsLonDir(lon >= 0 ? 'E' : 'W');
  };

  // Save history helper
  const saveHistory = (item: ConversionHistoryItem) => {
    const updated = [item, ...history.filter(h => h.inputDescription !== item.inputDescription)].slice(0, 15);
    setHistory(updated);
    localStorage.setItem('gis_bpn_history', JSON.stringify(updated));
  };

  // Click handler to copy text
  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  // Reset inputs
  const handleReset = () => {
    setErrors([]);
    if (activeTab === 'GEO') {
      setLatInput('');
      setLonInput('');
    } else if (activeTab === 'DMS') {
      setDmsLatD('');
      setDmsLatM('');
      setDmsLatS('');
      setDmsLonD('');
      setDmsLonM('');
      setDmsLonS('');
    } else if (activeTab === 'UTM') {
      setUtmX('');
      setUtmY('');
    } else {
      setTm3X('');
      setTm3Y('');
    }
  };

  // Primary calculation trigger
  const handleCalculate = () => {
    const newErrors: ValidationError[] = [];
    setErrors([]);

    try {
      if (activeTab === 'GEO') {
        const lat = parseFloat(latInput);
        const lon = parseFloat(lonInput);

        if (isNaN(lat) || lat < -90 || lat > 90) {
          newErrors.push({ field: 'Latitude', message: 'Latitude harus bernilai antara -90° hingga 90°.' });
        }
        if (isNaN(lon) || lon < -180 || lon > 180) {
          newErrors.push({ field: 'Longitude', message: 'Longitude harus bernilai antara -180° hingga 180°.' });
        }

        if (newErrors.length > 0) {
          setErrors(newErrors);
          return;
        }

        const out = convertFromGeo(lat, lon);
        setResults(out);
        setActiveMapCoord(out.geo);
        syncDmsInputs(lat, lon);

        setUtmX(out.utm.x.toFixed(4));
        setUtmY(out.utm.y.toFixed(4));
        setUtmZone(out.utm.zone);
        setUtmHemi(out.utm.hemi);

        setTm3X(out.tm3.x.toFixed(4));
        setTm3Y(out.tm3.y.toFixed(4));
        setTm3Zone(out.tm3.zone);

        saveHistory({
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          inputType: 'GEO',
          inputDescription: `DD: ${lat.toFixed(4)}°, ${lon.toFixed(4)}°`,
          geo: out.geo,
          utm: out.utm,
          tm3: out.tm3,
        });

      } else if (activeTab === 'DMS') {
        const latD = parseFloat(dmsLatD);
        const latM = parseFloat(dmsLatM);
        const latS = parseFloat(dmsLatS);

        const lonD = parseFloat(dmsLonD);
        const lonM = parseFloat(dmsLonM);
        const lonS = parseFloat(dmsLonS);

        if (isNaN(latD) || latD < 0 || latD > 90 || isNaN(latM) || latM < 0 || latM >= 60 || isNaN(latS) || latS < 0 || latS >= 60) {
          newErrors.push({ field: 'DMS Latitude', message: 'Input DMS Latitude tidak valid (Derajat 0-90, Menit 0-59, Detik 0-59.99).' });
        }
        if (isNaN(lonD) || lonD < 0 || lonD > 180 || isNaN(lonM) || lonM < 0 || lonM >= 60 || isNaN(lonS) || lonS < 0 || lonS >= 60) {
          newErrors.push({ field: 'DMS Longitude', message: 'Input DMS Longitude tidak valid (Derajat 0-180, Menit 0-59, Detik 0-59.99).' });
        }

        if (newErrors.length > 0) {
          setErrors(newErrors);
          return;
        }

        const latDec = dmsLatDir === 'S' ? -DMS_KE_DESIMAL(latD, latM, latS) : DMS_KE_DESIMAL(latD, latM, latS);
        const lonDec = dmsLonDir === 'W' ? -DMS_KE_DESIMAL(lonD, lonM, lonS) : DMS_KE_DESIMAL(lonD, lonM, lonS);

        const out = convertFromGeo(latDec, lonDec);
        setResults(out);
        setActiveMapCoord(out.geo);

        setLatInput(latDec.toFixed(4));
        setLonInput(lonDec.toFixed(4));

        setUtmX(out.utm.x.toFixed(4));
        setUtmY(out.utm.y.toFixed(4));
        setUtmZone(out.utm.zone);
        setUtmHemi(out.utm.hemi);

        setTm3X(out.tm3.x.toFixed(4));
        setTm3Y(out.tm3.y.toFixed(4));
        setTm3Zone(out.tm3.zone);

        saveHistory({
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          inputType: 'DMS',
          inputDescription: `DMS: ${latD}° ${latM}' ${latS.toFixed(2)}" ${dmsLatDir === 'S' ? 'LS' : 'LU'}, ${lonD}° ${lonM}' ${lonS.toFixed(2)}" ${dmsLonDir === 'W' ? 'BB' : 'BT'}`,
          geo: out.geo,
          utm: out.utm,
          tm3: out.tm3,
        });

      } else if (activeTab === 'UTM') {
        const x = parseFloat(utmX);
        const y = parseFloat(utmY);

        if (isNaN(x) || x < 100000 || x > 900000) {
          newErrors.push({ field: 'UTM Easting', message: 'Easting UTM biasanya berkisar antara 100,000m hingga 900,000m.' });
        }
        if (isNaN(y) || y < 0 || y > 10000000) {
          newErrors.push({ field: 'UTM Northing', message: 'Northing UTM harus positif dan bernilai < 10,000,000m.' });
        }
        if (utmZone < 1 || utmZone > 60) {
          newErrors.push({ field: 'UTM Zona', message: 'Zona UTM harus bernilai antara 1 hingga 60.' });
        }

        if (newErrors.length > 0) {
          setErrors(newErrors);
          return;
        }

        const out = convertFromUtm(x, y, utmZone, utmHemi);
        setResults(out);
        setActiveMapCoord(out.geo);
        syncDmsInputs(out.geo.lat, out.geo.lon);

        setLatInput(out.geo.lat.toFixed(4));
        setLonInput(out.geo.lon.toFixed(4));

        setTm3X(out.tm3.x.toFixed(4));
        setTm3Y(out.tm3.y.toFixed(4));
        setTm3Zone(out.tm3.zone);

        saveHistory({
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          inputType: 'UTM',
          inputDescription: `UTM Zone ${utmZone}${utmHemi}: X=${x.toFixed(4)}, Y=${y.toFixed(4)}`,
          geo: out.geo,
          utm: out.utm,
          tm3: out.tm3,
        });

      } else {
        const x = parseFloat(tm3X);
        const y = parseFloat(tm3Y);

        if (isNaN(x) || x < 10000 || x > 500000) {
          newErrors.push({ field: 'TM-3 Easting', message: 'Easting TM-3° biasanya berkisar antara 10,000m hingga 500,000m.' });
        }
        if (isNaN(y) || y < 100000 || y > 3000000) {
          newErrors.push({ field: 'TM-3 Northing', message: 'Northing TM-3° biasanya berkisar antara 100,000m hingga 3,000,000m.' });
        }

        const zoneParts = tm3Zone.split('.');
        if (zoneParts.length !== 2 || isNaN(parseInt(zoneParts[0])) || (zoneParts[1] !== '1' && zoneParts[1] !== '2')) {
          newErrors.push({ field: 'TM-3 Zona', message: 'Format Zona TM-3 harus [Zone UTM].[1 atau 2] (contoh: 48.2).' });
        }

        if (newErrors.length > 0) {
          setErrors(newErrors);
          return;
        }

        const out = convertFromTm3(x, y, tm3Zone);
        setResults(out);
        setActiveMapCoord(out.geo);
        syncDmsInputs(out.geo.lat, out.geo.lon);

        setLatInput(out.geo.lat.toFixed(4));
        setLonInput(out.geo.lon.toFixed(4));

        setUtmX(out.utm.x.toFixed(4));
        setUtmY(out.utm.y.toFixed(4));
        setUtmZone(out.utm.zone);
        setUtmHemi(out.utm.hemi);

        saveHistory({
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          inputType: 'TM3',
          inputDescription: `TM-3 Zone ${tm3Zone}: X=${x.toFixed(4)}, Y=${y.toFixed(4)}`,
          geo: out.geo,
          utm: out.utm,
          tm3: out.tm3,
        });
      }
    } catch (e: any) {
      console.error(e);
      newErrors.push({ field: 'General', message: e.message || 'Terjadi kesalahan kalkulasi proyeksi.' });
      setErrors(newErrors);
    }
  };

  const exportPolygonToPDF = (polygon: BidangTanah) => {
    setExportPdfSettings(prev => ({ ...prev, isOpen: true, polygon }));
  };

  const handleConfirmExportPDF = async () => {
    if (!exportPdfSettings.polygon) return;
    try {
      const { generateAndDownloadPDF } = await import('./utils/reportGenerator');
      await generateAndDownloadPDF(exportPdfSettings.polygon, {
        basemap: exportPdfSettings.basemap,
        coordinateSystem: exportPdfSettings.coordinateSystem
      });
      setExportPdfSettings(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      console.error(err);
      alert('Gagal membuat PDF laporan.');
    }
  };

  // Map click triggers updates

  const handleDownloadDXF = (crs: 'UTM' | 'TM3' = 'UTM') => {
    if (batchList.length === 0) return;
    
    const dxfContent = generateBatchDXF(batchList, crs);
    const blob = new Blob([dxfContent], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'hasil_konversi_batch.dxf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMapClick = (lat: number, lon: number) => {
    const out = convertFromGeo(lat, lon);

    if (isDrafting && currentAppTab === 'HITUNG_LUAS') {
      setDraftVertices(prev => [...prev, { lat, lon }]);
      setActiveMapCoord(out.geo);
      setResults(out);
      syncManualLuasInputs(lat, lon);
      return;
    }

    if (activeTab === 'BATCH') {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const name = `Peta Pt ${batchList.length + 1}`;
      const newItem: BatchCoordinateItem = {
        id,
        name,
        inputRaw: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        lat,
        lon,
        utmX: out.utm.x,
        utmY: out.utm.y,
        utmZone: out.utm.zone,
        utmHemi: out.utm.hemi,
        tm3X: out.tm3.x,
        tm3Y: out.tm3.y,
        tm3Zone: out.tm3.zone,
        isValid: true
      };
      setBatchList(prev => [...prev, newItem]);
      setActiveMapCoord(out.geo);
      return;
    }

    setResults(out);
    setActiveMapCoord(out.geo);

    setLatInput(lat.toFixed(4));
    setLonInput(lon.toFixed(4));

    syncDmsInputs(lat, lon);

    setUtmX(out.utm.x.toFixed(4));
    setUtmY(out.utm.y.toFixed(4));
    setUtmZone(out.utm.zone);
    setUtmHemi(out.utm.hemi);

    setTm3X(out.tm3.x.toFixed(4));
    setTm3Y(out.tm3.y.toFixed(4));
    setTm3Zone(out.tm3.zone);

    saveHistory({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      inputType: 'GEO',
      inputDescription: `Klik Peta: ${lat.toFixed(4)}°, ${lon.toFixed(4)}°`,
      geo: out.geo,
      utm: out.utm,
      tm3: out.tm3,
    });
  };

  // Restore history item
  const handleRestoreHistory = (item: ConversionHistoryItem) => {
    if (
      !item || 
      !item.geo || 
      typeof item.geo.lat !== 'number' || 
      typeof item.geo.lon !== 'number' || 
      isNaN(item.geo.lat) || 
      isNaN(item.geo.lon) || 
      !isFinite(item.geo.lat) || 
      !isFinite(item.geo.lon)
    ) {
      console.warn('Cannot restore history item with invalid coordinates');
      return;
    }
    setResults({
      geo: item.geo,
      utm: item.utm,
      tm3: item.tm3,
    });
    setActiveMapCoord(item.geo);
    setTimeout(() => { document.getElementById('gis-map-canvas')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);

    setLatInput(item.geo.lat.toFixed(4));
    setLonInput(item.geo.lon.toFixed(4));

    syncDmsInputs(item.geo.lat, item.geo.lon);

    setUtmX(item.utm.x.toFixed(4));
    setUtmY(item.utm.y.toFixed(4));
    setUtmZone(item.utm.zone);
    setUtmHemi(item.utm.hemi);

    setTm3X(item.tm3.x.toFixed(4));
    setTm3Y(item.tm3.y.toFixed(4));
    setTm3Zone(item.tm3.zone);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('gis_bpn_history', JSON.stringify(updated));
  };

  const handleClearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem('gis_bpn_history');
  };

  // Check if position is inside typical Indonesian borders
  const isInsideIndonesia = (lat: number, lon: number): boolean => {
    return lat >= -11.0 && lat <= 6.0 && lon >= 95.0 && lon <= 141.0;
  };

  const handleDownloadTemplateLuas = (format: 'csv' | 'txt' = 'csv') => {
    let fileContent = "";
    let mimeType = format === 'csv' ? 'text/csv' : 'text/plain';
    
    if (luasCoordSystem === 'DD' || luasCoordSystem === 'DMS') {
      if (format === 'csv') {
        fileContent = "Latitude,Longitude,Nama Titik\n-7.885494, 110.332192, Titik 1\n-7.889000, 110.335000, Titik 2\n-7.890000, 110.330000, Titik 3";
      } else {
        fileContent = "-7.885494, 110.332192, Titik 1\n-7.889000, 110.335000, Titik 2\n-7.890000, 110.330000, Titik 3";
      }
    } else if (luasCoordSystem === 'UTM') {
      if (format === 'csv') {
        fileContent = "X,Y,Zone,Hemisphere,Nama Titik\n426365.12, 9128345.82, 49, S, Titik 1\n426365.12, 9128145.82, 49, S, Titik 2\n426165.12, 9128245.82, 49, S, Titik 3";
      } else {
        fileContent = "426365.12, 9128345.82, 49, S, Titik 1\n426365.12, 9128145.82, 49, S, Titik 2\n426165.12, 9128245.82, 49, S, Titik 3";
      }
    } else if (luasCoordSystem === 'TM3') {
      if (format === 'csv') {
        fileContent = "X,Y,Zone,Nama Titik\n241285.50, 1428510.40, 49.1, Titik 1\n241285.50, 1428310.40, 49.1, Titik 2\n241085.50, 1428410.40, 49.1, Titik 3";
      } else {
        fileContent = "241285.50, 1428510.40, 49.1, Titik 1\n241285.50, 1428310.40, 49.1, Titik 2\n241085.50, 1428410.40, 49.1, Titik 3";
      }
    }
    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_import_${luasCoordSystem}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportLuasBatch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const sourceType = (luasCoordSystem === 'DD' || luasCoordSystem === 'DMS') ? 'GEO' : luasCoordSystem;
        const parsed = parseBatchCoordinates(text, sourceType);
        
        const newVertices = parsed
          .filter(p => p.isValid && p.lat !== null && p.lon !== null)
          .map(p => ({ lat: p.lat as number, lon: p.lon as number }));
          
        if (newVertices.length > 0) {
          setDraftVertices(prev => [...prev, ...newVertices]);
          const last = newVertices[newVertices.length - 1];
          const out = convertFromGeo(last.lat, last.lon);
          setActiveMapCoord({lat: last.lat, lon: last.lon});
          setResults(out);
          setErrors([]);
        } else {
          setErrors([{ field: 'Import Batch', message: 'Tidak ada koordinat valid ditemukan. Pastikan format input sesuai.' }]);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // DMS string generation
  const getDmsString = (val: number, isLat: boolean) => {
    const { d, m, s } = DESIMAL_KE_DMS(val);
    const suffix = isLat 
      ? (d >= 0 ? 'LU' : 'LS') 
      : (d >= 0 ? 'BT' : 'BB');
    return `${Math.abs(d)}° ${m}' ${s.toFixed(2)}" ${suffix}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 bg-radial-glow bg-grid-pattern text-slate-800 flex flex-col font-sans pb-16 lg:pb-0">
      <HeaderPro 
        currentTab={currentAppTab}
        onTabChange={handleTabChange}
        activeMapCoord={activeMapCoord}
        isInsideIndonesia={isInsideIndonesia}
      />

      {/* 2. CONVERTER OR HITUNG_LUAS TAB */}
      {(currentAppTab === 'CONVERTER' || currentAppTab === 'HITUNG_LUAS') && (
        <main className="flex-1 max-w-[1600px] 2xl:max-w-[95%] w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column (Control & Input Panel) */}
          <section className={`lg:col-span-5 space-y-6 ${currentAppTab === 'HITUNG_LUAS' ? 'lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto custom-scrollbar lg:pr-2 lg:sticky lg:top-24' : ''}`}>
            <div className="glass-panel rounded-3xl p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 tracking-wide">
                  <Sparkles className="w-4 h-4 text-[#1B3F79]" />
                  Parameter Input
                </h2>
                <span className="text-xs text-slate-500 font-bold">Pilih Tab Input</span>
              </div>

              {/* Tab options: DD, DMS, UTM, TM-3, Batch */}
              {currentAppTab === 'CONVERTER' ? (
                <div className="grid grid-cols-5 gap-1 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
                  {[
                    { id: 'GEO', label: 'DD', icon: <Globe className="w-3.5 h-3.5" /> },
                    { id: 'DMS', label: 'DMS', icon: <Compass className="w-3.5 h-3.5" /> },
                    { id: 'UTM', label: 'UTM', icon: <Layers className="w-3.5 h-3.5" /> },
                    { id: 'TM3', label: 'TM-3°', icon: <MapPin className="w-3.5 h-3.5" /> },
                    { id: 'BATCH', label: 'Batch', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => { setActiveTab(item.id as CoordinateType); setErrors([]); }}
                      className={`flex flex-col items-center gap-1 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                        activeTab === item.id
                          ? 'bg-[#1B3F79] text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-[10px] font-black text-slate-500 uppercase block">Sistem Koordinat Input</label>
                  <div className="grid grid-cols-4 gap-1 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
                    {[
                      { id: 'DD', label: 'DD', icon: <Globe className="w-3.5 h-3.5" /> },
                      { id: 'DMS', label: 'DMS', icon: <Compass className="w-3.5 h-3.5" /> },
                      { id: 'UTM', label: 'UTM', icon: <Layers className="w-3.5 h-3.5" /> },
                      { id: 'TM3', label: 'TM-3°', icon: <MapPin className="w-3.5 h-3.5" /> }
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLuasCoordSystem(item.id as 'DD' | 'DMS' | 'UTM' | 'TM3')}
                        className={`flex flex-col items-center gap-1 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                          luasCoordSystem === item.id
                            ? 'bg-[#1B3F79] text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                        }`}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Error messages */}
              {errors.map((err, idx) => (
                <div key={idx} className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex gap-3 items-start text-xs text-red-700 shadow-sm animate-fade-in">
                  <AlertTriangle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold uppercase text-[10px] tracking-wider block mb-1">Kesalahan {err.field}</span>
                    <p className="leading-relaxed font-bold">{err.message}</p>
                  </div>
                </div>
              ))}

              {/* Render input elements */}
              {activeTab === 'BIDANG' ? (
                <div className="space-y-4 animate-fade-in">
                  {/* Preferences Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Snap switch */}
                    <div className="flex items-center justify-between bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-800">Snap to Vertex</span>
                        <span className="text-[8px] text-slate-500 font-medium">Pelekatan otomatis</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSnapEnabled(!isSnapEnabled)}
                        className={`w-8 h-4 flex items-center rounded-full p-0.5 cursor-pointer transition-all duration-300 ${isSnapEnabled ? 'bg-[#1B3F79] justify-end' : 'bg-slate-300 justify-start'}`}
                      >
                        <span className="w-3 h-3 bg-white rounded-full shadow-md"></span>
                      </button>
                    </div>

                    {/* Show Dimensions switch */}
                    <div className="flex items-center justify-between bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-800">Tampilkan Dimensi</span>
                        <span className="text-[8px] text-slate-500 font-medium">Panjang sisi bidang</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsShowDimensions(!isShowDimensions)}
                        className={`w-8 h-4 flex items-center rounded-full p-0.5 cursor-pointer transition-all duration-300 ${isShowDimensions ? 'bg-[#1B3F79] justify-end' : 'bg-slate-300 justify-start'}`}
                      >
                        <span className="w-3 h-3 bg-white rounded-full shadow-md"></span>
                      </button>
                    </div>
                  </div>

                  {!isDrafting ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDrafting(true);
                        setDraftVertices([]);
                        setDraftNama(`Bidang ${polygons.length + 1}`);
                        if (results?.geo) {
                          syncManualLuasInputs(results.geo.lat, results.geo.lon);
                        } else {
                          syncManualLuasInputs(-6.2, 106.8); // Jakarta default
                        }
                      }}
                      className="w-full bg-[#1B3F79] hover:bg-[#2455A2] text-white text-xs font-extrabold py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Mulai Gambar Bidang Baru
                    </button>
                  ) : (
                    <div className="border-2 border-[#1B3F79]/40 bg-[#E9EEF2]/40 p-4 space-y-4 shadow-sm animate-fade-in">
                      <div className="flex justify-between items-center pb-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (draftVertices.length > 0) {
                              setDraftVertices(prev => prev.slice(0, -1));
                            }
                          }}
                          disabled={draftVertices.length === 0}
                          className={`text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                            draftVertices.length === 0 
                              ? 'text-slate-400 cursor-not-allowed' 
                              : 'text-[#1B3F79] hover:text-[#2455A2] cursor-pointer'
                          }`}
                        >
                          <Undo className="w-3.5 h-3.5" />
                          Undo Titik
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsDrafting(false);
                            setDraftVertices([]);
                          }}
                          className="text-[10px] text-red-600 font-extrabold hover:underline cursor-pointer"
                        >
                          Batalkan Digitasi
                        </button>
                      </div>

                      {/* Label Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Nama Label Bidang</label>
                        <input
                          type="text"
                          value={draftNama}
                          onChange={(e) => setDraftNama(e.target.value)}
                          placeholder="Contoh: Bidang A / Sawah Pak Kades"
                          className="w-full high-glare-input rounded-xl px-3 py-2 text-xs font-extrabold bg-white border border-slate-200"
                        />
                      </div>

                      {/* Parameter Input Manual */}
                      <div className="space-y-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-black text-[#1B3F79] uppercase tracking-wider block border-b border-slate-100 pb-1">
                          Input Koordinat Titik Baru
                        </span>

                        {luasCoordSystem === 'DD' && (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase">Latitude (Y)</label>
                              <input
                                type="text"
                                value={manualLat}
                                onChange={(e) => setManualLat(e.target.value.replace(',', '.'))}
                                placeholder="Contoh: -7.885494"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:bg-white focus:border-[#1B3F79] outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase">Longitude (X)</label>
                              <input
                                type="text"
                                value={manualLon}
                                onChange={(e) => setManualLon(e.target.value.replace(',', '.'))}
                                placeholder="Contoh: 110.332192"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:bg-white focus:border-[#1B3F79] outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {luasCoordSystem === 'DMS' && (
                          <div className="space-y-2">
                            {/* DMS Latitude */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase block">Latitude (Y)</label>
                              <div className="grid grid-cols-4 gap-1">
                                <input
                                  type="text"
                                  value={manualDmsLatDeg}
                                  onChange={(e) => setManualDmsLatDeg(e.target.value)}
                                  placeholder="Deg"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-mono font-bold text-center"
                                />
                                <input
                                  type="text"
                                  value={manualDmsLatMin}
                                  onChange={(e) => setManualDmsLatMin(e.target.value)}
                                  placeholder="Min"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-mono font-bold text-center"
                                />
                                <input
                                  type="text"
                                  value={manualDmsLatSec}
                                  onChange={(e) => setManualDmsLatSec(e.target.value)}
                                  placeholder="Sec"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-mono font-bold text-center"
                                />
                                <select
                                  value={manualDmsLatDir}
                                  onChange={(e) => setManualDmsLatDir(e.target.value as 'LU' | 'LS')}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1 py-1 text-xs font-mono font-bold text-center cursor-pointer"
                                >
                                  <option value="LS">LS</option>
                                  <option value="LU">LU</option>
                                </select>
                              </div>
                            </div>

                            {/* DMS Longitude */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase block">Longitude (X)</label>
                              <div className="grid grid-cols-4 gap-1">
                                <input
                                  type="text"
                                  value={manualDmsLonDeg}
                                  onChange={(e) => setManualDmsLonDeg(e.target.value)}
                                  placeholder="Deg"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-mono font-bold text-center"
                                />
                                <input
                                  type="text"
                                  value={manualDmsLonMin}
                                  onChange={(e) => setManualDmsLonMin(e.target.value)}
                                  placeholder="Min"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-mono font-bold text-center"
                                />
                                <input
                                  type="text"
                                  value={manualDmsLonSec}
                                  onChange={(e) => setManualDmsLonSec(e.target.value)}
                                  placeholder="Sec"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-mono font-bold text-center"
                                />
                                <select
                                  value={manualDmsLonDir}
                                  onChange={(e) => setManualDmsLonDir(e.target.value as 'BT' | 'BB')}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1 py-1 text-xs font-mono font-bold text-center cursor-pointer"
                                >
                                  <option value="BT">BT</option>
                                  <option value="BB">BB</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {luasCoordSystem === 'UTM' && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase">Easting X (m)</label>
                                <input
                                  type="text"
                                  value={manualUtmX}
                                  onChange={(e) => setManualUtmX(e.target.value.replace(',', '.'))}
                                  placeholder="Contoh: 426315"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase">Northing Y (m)</label>
                                <input
                                  type="text"
                                  value={manualUtmY}
                                  onChange={(e) => setManualUtmY(e.target.value.replace(',', '.'))}
                                  placeholder="Contoh: 9128540"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase">Zona UTM</label>
                                <input
                                  type="text"
                                  value={manualUtmZone}
                                  onChange={(e) => setManualUtmZone(e.target.value)}
                                  placeholder="Contoh: 49"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-center"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase">Hemisfer</label>
                                <select
                                  value={manualUtmHemi}
                                  onChange={(e) => setManualUtmHemi(e.target.value as 'N' | 'S')}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-center cursor-pointer"
                                >
                                  <option value="S">S (Selatan)</option>
                                  <option value="N">N (Utara)</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {luasCoordSystem === 'TM3' && (
                          <div className="grid grid-cols-3 gap-1.5">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase">Zona TM3</label>
                              <input
                                type="text"
                                value={manualTm3Zone}
                                onChange={(e) => setManualTm3Zone(e.target.value)}
                                placeholder="49.1"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1 py-1.5 text-xs font-mono font-bold text-center"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase">Easting X</label>
                              <input
                                type="text"
                                value={manualTm3X}
                                onChange={(e) => setManualTm3X(e.target.value.replace(',', '.'))}
                                placeholder="X (m)"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1 py-1.5 text-xs font-mono font-bold text-center"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase">Northing Y</label>
                              <input
                                type="text"
                                value={manualTm3Y}
                                onChange={(e) => setManualTm3Y(e.target.value.replace(',', '.'))}
                                placeholder="Y (m)"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1 py-1.5 text-xs font-mono font-bold text-center"
                              />
                            </div>
                          </div>
                        )}
                      </div>



                      {/* Vertices list and add controls */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-700">Daftar Titik Batas ({draftVertices.length} Titik)</span>
                          {draftVertices.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setDraftVertices(prev => prev.slice(0, -1))}
                              className="text-[10px] text-[#5B6F7A] hover:text-[#1B3F79] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              Hapus Titik Terakhir
                            </button>
                          )}
                        </div>

                        {draftVertices.length === 0 ? (
                          <div className="text-center py-4 bg-white border border-dashed border-slate-300 rounded-xl text-slate-500 text-[11px] font-bold px-2">
                            Klik langsung di peta atau masukkan koordinat di atas lalu klik Tambah Titik.
                          </div>
                        ) : (
                          <div className="max-h-[160px] overflow-y-auto space-y-1 border border-slate-200 rounded-xl bg-white p-2 custom-scrollbar">
                            {draftVertices.map((vertex, idx) => {
                              const itemResults = convertFromGeo(vertex.lat, vertex.lon);
                              
                              let displayText = '';
                              let subText = '';
                              
                              if (luasCoordSystem === 'DD') {
                                displayText = `${vertex.lat.toFixed(4)}, ${vertex.lon.toFixed(4)}`;
                              } else if (luasCoordSystem === 'DMS') {
                                const dmsLat = DESIMAL_KE_DMS(vertex.lat);
                                const dmsLon = DESIMAL_KE_DMS(vertex.lon);
                                const latDir = vertex.lat >= 0 ? 'LU' : 'LS';
                                const lonDir = vertex.lon >= 0 ? 'BT' : 'BB';
                                displayText = `${Math.abs(dmsLat.d)}°${dmsLat.m}'${dmsLat.s.toFixed(1)}"${latDir}, ${Math.abs(dmsLon.d)}°${dmsLon.m}'${dmsLon.s.toFixed(1)}"${lonDir}`;
                              } else if (luasCoordSystem === 'UTM') {
                                displayText = `X:${itemResults.utm.x.toFixed(4)} Y:${itemResults.utm.y.toFixed(4)} Zone ${itemResults.utm.zone}${itemResults.utm.hemi}`;
                              } else if (luasCoordSystem === 'TM3') {
                                displayText = `X:${itemResults.tm3.x.toFixed(4)} Y:${itemResults.tm3.y.toFixed(4)} Zone ${itemResults.tm3.zone}`;
                              }
                              
                              return (
                                <div key={idx} className="flex items-center justify-between text-sm bg-slate-50 hover:bg-slate-100 p-2 rounded-lg border border-slate-100 font-mono">
                                  <div className="flex items-start gap-2">
                                    <span className="font-extrabold text-[#1B3F79] shrink-0 mt-0.5 w-10 text-xs">Pt {idx + 1}</span>
                                    <div className="flex flex-col">
                                      <span className="text-slate-800 font-black whitespace-normal break-all sm:break-normal text-xs">
                                        {displayText}
                                      </span>
                                      {subText && (
                                        <span className="text-[8px] text-slate-500 font-bold tracking-wide uppercase leading-none mt-0.5">
                                          {subText}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <button
                                    type="button"
                                    onClick={() => setDraftVertices(prev => prev.filter((_, i) => i !== idx))}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all shrink-0 cursor-pointer self-start"
                                    title="Hapus titik ini"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Display calculations */}
                      {draftVertices.length >= 3 && (
                        <div className="bg-[#E9EEF2] border border-[#D1DCE3] rounded-xl p-3 text-center space-y-0.5 animate-fade-in">
                          <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Estimasi Luas Saat Ini</span>
                          <div className="text-sm font-black text-[#1B3F79] font-mono">
                            {Math.floor(calculateArea(draftVertices).luasSqm).toLocaleString('id-ID')} m²
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono font-bold">
                            ({calculateArea(draftVertices).luasHa.toFixed(2)} ha)
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleTambahTitikManual}
                          className="bg-white border-2 border-[#1B3F79] hover:bg-slate-50 text-[#1B3F79] text-[10px] font-extrabold py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#1B3F79]" />
                          Tambah Titik
                        </button>
                        
                        <div className="flex flex-col gap-1.5">
                          <label className="bg-white border-2 border-slate-300 hover:bg-slate-50 text-slate-700 text-[10px] font-extrabold py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm w-full">
                            <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                            Import TXT/CSV
                            <input type="file" accept=".txt,.csv" className="hidden" onChange={handleImportLuasBatch} />
                          </label>
                          <div className="flex items-center justify-center gap-2 mt-1">
                            <span className="text-[9px] text-slate-500 font-bold">Unduh Template:</span>
                            <button 
                              type="button" 
                              onClick={() => handleDownloadTemplateLuas('csv')}
                              className="text-[9px] text-[#1B3F79] hover:underline font-bold self-center cursor-pointer flex items-center gap-0.5"
                            >
                              <FileDown className="w-3 h-3" /> CSV
                            </button>
                            <span className="text-[9px] text-slate-300">|</span>
                            <button 
                              type="button" 
                              onClick={() => handleDownloadTemplateLuas('txt')}
                              className="text-[9px] text-[#1B3F79] hover:underline font-bold self-center cursor-pointer flex items-center gap-0.5"
                            >
                              <FileDown className="w-3 h-3" /> TXT
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (draftVertices.length < 3) return;
                          const areaResult = calculateArea(draftVertices);
                          const newPoly: BidangTanah = {
                            id: `poly-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                            nama: draftNama.trim() || `Bidang ${polygons.length + 1}`,
                            coordinates: draftVertices,
                            luasSqm: areaResult.luasSqm,
                            luasHa: areaResult.luasHa,
                            warna: '#1B3F79'
                          };
                          setPolygons(prev => [...prev, newPoly]);
                          setIsDrafting(false);
                          setDraftVertices([]);
                        }}
                        disabled={draftVertices.length < 3}
                        className="w-full bg-[#1B3F79] disabled:opacity-50 hover:bg-[#2455A2] text-white text-[10px] font-extrabold py-2 px-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer mt-2"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Simpan Bidang
                      </button>
                    </div>
                  )}

                  {/* Parcels List */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#1B3F79]" />
                      Daftar Bidang Tersimpan ({polygons.length})
                    </h3>

                    {polygons.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-slate-300 bg-slate-50 rounded-2xl text-slate-500 text-xs font-bold leading-normal px-4">
                        Belum ada bidang tanah yang digambar.<br />
                        Mulai gambar bidang dengan mengklik tombol "Mulai Gambar Bidang Baru" di atas.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                        {polygons.map((poly) => (
                          <div
                            key={poly.id}
                            className={`border p-3 rounded-2xl transition-all flex flex-col gap-2 bg-white ${
                              selectedPolygonId === poly.id ? 'border-[#1B3F79] ring-2 ring-[#1B3F79]/20' : 'border-slate-200 hover:border-slate-300 shadow-sm'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPolygonId(poly.id);
                                  const validCoords = poly.coordinates.filter(
                                    c => c && typeof c.lat === 'number' && typeof c.lon === 'number' &&
                                    !isNaN(c.lat) && !isNaN(c.lon) && isFinite(c.lat) && isFinite(c.lon)
                                  );
                                  if (validCoords.length > 0) {
                                    let latSum = 0;
                                    let lonSum = 0;
                                    validCoords.forEach(c => {
                                      latSum += c.lat;
                                      lonSum += c.lon;
                                    });
                                    setActiveMapCoord({
                                      lat: latSum / validCoords.length,
                                      lon: lonSum / validCoords.length
                                    });
                                  }
                                }}
                                className="text-left font-sans cursor-pointer group"
                              >
                                <span className="text-xs font-black text-slate-900 group-hover:text-[#1B3F79] flex items-center gap-1.5 uppercase">
                                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: poly.warna }} />
                                  {poly.nama}
                                </span>
                                <span className="text-[9px] text-slate-500 font-bold block mt-0.5">
                                  Terdiri dari {poly.coordinates.length} patok sudut batas
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Apakah Anda yakin ingin menghapus bidang tanah "${poly.nama}"?`)) {
                                    setPolygons(prev => prev.filter(p => p.id !== poly.id));
                                    if (selectedPolygonId === poly.id) {
                                      setSelectedPolygonId(null);
                                    }
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-red-600 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-100 p-2 rounded-xl text-center font-mono">
                              <div>
                                <span className="text-[8px] uppercase tracking-wider text-slate-400 font-black block font-sans">Luas Tanah</span>
                                <span className="text-xs font-bold text-slate-800">
                                  {Math.floor(poly.luasSqm).toLocaleString('id-ID')} m²
                                </span>
                              </div>
                              <div>
                                <span className="text-[8px] uppercase tracking-wider text-slate-400 font-black block font-sans">Hektar</span>
                                <span className="text-xs font-bold text-[#1B3F79]">
                                  {poly.luasHa.toFixed(2)} ha
                                </span>
                              </div>
                            </div>
                            {selectedPolygonId === poly.id && (
                              <button
                                type="button"
                                onClick={() => exportPolygonToPDF(poly)}
                                className="w-full mt-1 flex items-center justify-center gap-1.5 bg-[#1B3F79] hover:bg-[#2455A2] text-white py-1.5 px-3 rounded-lg text-[10px] font-extrabold transition-all shadow-sm cursor-pointer"
                              >
                                <FileDown className="w-3.5 h-3.5" />
                                Export Laporan (PDF)
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === 'BATCH' ? (
                <div className="space-y-5 animate-fade-in">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex justify-between items-center">
                      <span>Format Proyeksi Input</span>
                      <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Wajib Dipilih</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2 bg-slate-100 border border-slate-200 rounded-xl p-1">
                      {['GEO', 'UTM', 'TM3'].map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setBatchSourceType(mode as any)}
                          className={`py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                            batchSourceType === mode ? 'bg-[#1B3F79] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {mode === 'GEO' ? 'Geografis (DD)' : mode === 'UTM' ? 'UTM' : 'TM-3°'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Drag and Drop */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Import File Koordinat (.csv, .txt)</label>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            const text = evt.target?.result as string;
                            if (text) {
                              setBatchRawInput(text);
                              const parsed = parseBatchCoordinates(text, batchSourceType);
                              setBatchList(parsed);
                            }
                          };
                          reader.readAsText(file);
                        }
                      }}
                      className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                        isDragging ? 'border-[#1B3F79] bg-[#E9EEF2]/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                      }`}
                      onClick={() => document.getElementById('batch-file-input')?.click()}
                    >
                      <UploadCloud className="w-8 h-8 text-[#1B3F79]" />
                      <span className="text-xs font-bold text-slate-700 text-center">Tarik & lepas file Anda di sini atau <span className="text-[#1B3F79] underline">cari berkas</span></span>
                      <span className="text-[10px] text-slate-500 font-medium text-center">Mendukung format CSV, TXT, TXT tab-separated (UTF-8)</span>
                      <input
                        id="batch-file-input"
                        type="file"
                        accept=".csv,.txt"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              const text = evt.target?.result as string;
                              if (text) {
                                setBatchRawInput(text);
                                const parsed = parseBatchCoordinates(text, batchSourceType);
                                setBatchList(parsed);
                              }
                            };
                            reader.readAsText(file);
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex justify-between items-center">
                      <span>Input Koordinat Manual / Tempel Teks</span>
                      <span className="text-[9px] text-[#1B3F79] font-extrabold bg-[#E9EEF2] px-1.5 py-0.5 rounded border border-[#D1DCE3]">Deteksi Pemisah Otomatis</span>
                    </label>
                    <textarea
                      rows={6}
                      value={batchRawInput}
                      onChange={(e) => {
                        setBatchRawInput(e.target.value);
                        const parsed = parseBatchCoordinates(e.target.value, batchSourceType);
                        setBatchList(parsed);
                      }}
                      placeholder={
                        batchSourceType === 'GEO'
                          ? "-6.1754, 106.8272, Monas\n-6.1931, 106.8218, Bundaran HI"
                          : batchSourceType === 'UTM'
                          ? "702051.4, 9317052.2, 48, S, Titik A\n702111.2, 9317112.5, 48, S, Titik B"
                          : "202051.4, 1517052.2, 48.2, Monas TM3"
                      }
                      className="w-full high-glare-input rounded-xl p-3 text-xs font-mono resize-none focus:ring-[#1B3F79]"
                    />
                    <div className="text-[10px] text-slate-500 font-bold leading-normal bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                      <p className="text-slate-700 font-extrabold text-[11px]">Format Kolom:</p>
                      <ul className="list-disc list-inside space-y-0.5 font-sans">
                        <li><strong className="text-slate-800">Geografis (DD)</strong>: <code className="bg-slate-200/60 px-1 rounded font-mono">Lat, Lon, [Nama]</code></li>
                        <li><strong className="text-slate-800">UTM</strong>: <code className="bg-slate-200/60 px-1 rounded font-mono">Easting, Northing, Zona, Hemisfer, [Nama]</code></li>
                        <li><strong className="text-slate-800">TM-3°</strong>: <code className="bg-slate-200/60 px-1 rounded font-mono">Easting, Northing, Zona_TM3, [Nama]</code></li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClearBatch}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      Hapus Semua
                    </button>
                    <button
                      type="button"
                      onClick={handleProcessBatch}
                      className="flex-[2] bg-[#1B3F79] hover:bg-[#2455A2] text-white text-xs font-extrabold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Proses Konversi
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleCalculate(); }} className="space-y-5">
                  {/* DD (Geografis Desimal Derajat) */}
                  {activeTab === 'GEO' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                            <span>Latitude (Sumbu Y)</span>
                            <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">DD</span>
                          </label>
                          <input
                            type="text"
                            value={latInput}
                            onChange={(e) => setLatInput(e.target.value.replace(',', '.'))}
                            placeholder="Contoh: -6.1754"
                            className="w-full high-glare-input rounded-xl px-3 py-2.5 text-sm font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                            <span>Longitude (Sumbu X)</span>
                            <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">DD</span>
                          </label>
                          <input
                            type="text"
                            value={lonInput}
                            onChange={(e) => setLonInput(e.target.value.replace(',', '.'))}
                            placeholder="Contoh: 106.8272"
                            className="w-full high-glare-input rounded-xl px-3 py-2.5 text-sm font-mono"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <strong className="text-[#1B3F79]">Deteksi Zona Otomatis:</strong> Nilai UTM Zone dan TM-3 Subzone akan secara otomatis terdeteksi berdasarkan koordinat geografis yang diinputkan.
                      </p>
                    </div>
                  )}

                  {/* DMS (Derajat Menit Detik) */}
                  {activeTab === 'DMS' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3 animate-fade-in">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-700">Latitude</span>
                            <div className="flex bg-slate-200/75 rounded-xl p-1 border border-slate-300 text-[10px] shadow-inner">
                              <button
                                type="button"
                                onClick={() => setDmsLatDir('N')}
                                className={`px-2 py-1 rounded-lg font-black transition-all cursor-pointer ${dmsLatDir === 'N' ? 'bg-[#1B3F79] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                              >
                                LU
                              </button>
                              <button
                                type="button"
                                onClick={() => setDmsLatDir('S')}
                                className={`px-2 py-1 rounded-lg font-black transition-all cursor-pointer ${dmsLatDir === 'S' ? 'bg-[#1B3F79] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                              >
                                LS
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[9px] text-slate-500 font-bold block mb-1">Derajat (D)</label>
                              <input
                                type="number"
                                value={dmsLatD}
                                onChange={(e) => setDmsLatD(e.target.value)}
                                placeholder="0-90"
                                className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-slate-900 font-mono font-bold text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-500 font-bold block mb-1">Menit (M)</label>
                              <input
                                type="number"
                                value={dmsLatM}
                                onChange={(e) => setDmsLatM(e.target.value)}
                                placeholder="0-59"
                                className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-slate-900 font-mono font-bold text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-500 font-bold block mb-1">Detik (S)</label>
                              <input
                                type="number"
                                step="any"
                                value={dmsLatS}
                                onChange={(e) => setDmsLatS(e.target.value)}
                                placeholder="0-59.9"
                                className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-slate-900 font-mono font-bold text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 animate-fade-in">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-700">Longitude</span>
                            <div className="flex bg-slate-200/75 rounded-xl p-1 border border-slate-300 text-[10px] shadow-inner">
                              <button
                                type="button"
                                onClick={() => setDmsLonDir('E')}
                                className={`px-2 py-1 rounded-lg font-black transition-all cursor-pointer ${dmsLonDir === 'E' ? 'bg-[#1B3F79] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                              >
                                BT
                              </button>
                              <button
                                type="button"
                                onClick={() => setDmsLonDir('W')}
                                className={`px-2 py-1 rounded-lg font-black transition-all cursor-pointer ${dmsLonDir === 'W' ? 'bg-[#1B3F79] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                              >
                                BB
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[9px] text-slate-500 font-bold block mb-1">Derajat (D)</label>
                              <input
                                type="number"
                                value={dmsLonD}
                                onChange={(e) => setDmsLonD(e.target.value)}
                                placeholder="0-180"
                                className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-slate-900 font-mono font-bold text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-500 font-bold block mb-1">Menit (M)</label>
                              <input
                                type="number"
                                value={dmsLonM}
                                onChange={(e) => setDmsLonM(e.target.value)}
                                placeholder="0-59"
                                className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-slate-900 font-mono font-bold text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-500 font-bold block mb-1">Detik (S)</label>
                              <input
                                type="number"
                                step="any"
                                value={dmsLonS}
                                onChange={(e) => setDmsLonS(e.target.value)}
                                placeholder="0-59.9"
                                className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-slate-900 font-mono font-bold text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <strong className="text-[#1B3F79]">Deteksi Zona Otomatis:</strong> UTM & TM-3 akan disesuaikan otomatis berdasarkan format DMS.
                      </p>
                    </div>
                  )}

                  {/* UTM */}
                  {activeTab === 'UTM' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                            <span>Easting (X)</span>
                            <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Meter</span>
                          </label>
                          <input
                            type="text"
                            value={utmX}
                            onChange={(e) => setUtmX(e.target.value.replace(',', '.'))}
                            placeholder="Contoh: 702000"
                            className="w-full high-glare-input rounded-xl px-3 py-2.5 text-sm font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                            <span>Northing (Y)</span>
                            <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Meter</span>
                          </label>
                          <input
                            type="text"
                            value={utmY}
                            onChange={(e) => setUtmY(e.target.value.replace(',', '.'))}
                            placeholder="Contoh: 9317000"
                            className="w-full high-glare-input rounded-xl px-3 py-2.5 text-sm font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Zona UTM (1 - 60)</label>
                          <input
                            type="number"
                            min="1"
                            max="60"
                            value={utmZone}
                            onChange={(e) => setUtmZone(parseInt(e.target.value) || 48)}
                            className="w-full high-glare-input rounded-xl px-3 py-2.5 text-sm font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Belahan Bumi</label>
                          <div className="grid grid-cols-2 gap-2 bg-slate-100 border border-slate-200 rounded-xl p-1">
                            <button
                              type="button"
                              onClick={() => setUtmHemi('N')}
                              className={`py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${utmHemi === 'N' ? 'bg-[#1B3F79] text-white shadow-sm' : 'text-slate-600'}`}
                            >
                              N (Utara)
                            </button>
                            <button
                              type="button"
                              onClick={() => setUtmHemi('S')}
                              className={`py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${utmHemi === 'S' ? 'bg-[#1B3F79] text-white shadow-sm' : 'text-slate-600'}`}
                            >
                              S (Selatan)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TM-3 BPN */}
                  {activeTab === 'TM3' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                            <span>Easting (X)</span>
                            <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Meter</span>
                          </label>
                          <input
                            type="text"
                            value={tm3X}
                            onChange={(e) => setTm3X(e.target.value.replace(',', '.'))}
                            placeholder="Contoh: 202000"
                            className="w-full high-glare-input rounded-xl px-3 py-2.5 text-sm font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                            <span>Northing (Y)</span>
                            <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Meter</span>
                          </label>
                          <input
                            type="text"
                            value={tm3Y}
                            onChange={(e) => setTm3Y(e.target.value.replace(',', '.'))}
                            placeholder="Contoh: 1517000"
                            className="w-full high-glare-input rounded-xl px-3 py-2.5 text-sm font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Zona TM-3</label>
                          <input
                            type="text"
                            value={tm3Zone}
                            onChange={(e) => setTm3Zone(e.target.value)}
                            placeholder="Contoh: 48.2"
                            className="w-full high-glare-input rounded-xl px-3 py-2.5 text-sm font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Reset
                    </button>
                    <button
                      type="submit"
                      className="flex-[2] bg-[#1B3F79] hover:bg-[#2455A2] text-white text-xs font-extrabold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5 animate-spin-slow" />
                      Hitung Konversi
                    </button>
                  </div>
                </form>
              )}
            </div>

            {currentAppTab === 'CONVERTER' && (
              <CoordinateHistory
                historyList={history}
                onSelectHistory={handleRestoreHistory}
                onDeleteHistory={handleDeleteHistoryItem}
                onClearAll={handleClearAllHistory}
              />
            )}
          </section>

          {/* Right Column (Results Panel + Map Visualizer) */}
          <section className={`lg:col-span-7 space-y-6 ${currentAppTab === 'HITUNG_LUAS' ? 'lg:sticky lg:top-24' : ''}`}>
            
            {currentAppTab === 'CONVERTER' && (activeTab === 'BATCH' ? (
              <div className="glass-panel rounded-3xl p-6 shadow-md space-y-6 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="space-y-1">
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 tracking-wide">
                      <FileSpreadsheet className="w-4 h-4 text-[#1B3F79]" />
                      Daftar Hasil Konversi Batch ({batchList.length} Titik)
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold font-sans">
                      {batchList.filter(b => b.isValid).length} Sukses • {batchList.filter(b => !b.isValid).length} Gagal
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCopyBatchToExcel}
                      disabled={batchList.length === 0}
                      className="flex items-center gap-1 bg-[#E9EEF2] hover:bg-[#D1DCE3] disabled:opacity-50 text-[#1B3F79] text-[10px] font-extrabold px-2.5 py-1.5 rounded-xl border border-[#D1DCE3] shadow-sm cursor-pointer transition-all"
                    >
                      {copiedField === 'batch_excel' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      Excel
                    </button>
                    <button
                      onClick={handleDownloadCSV}
                      disabled={batchList.length === 0}
                      className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-[#1B3F79] text-[10px] font-extrabold px-2.5 py-1.5 rounded-xl border border-slate-300 shadow-sm cursor-pointer transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      CSV
                    </button>
                    <button
                      onClick={() => handleDownloadDXF('UTM')}
                      disabled={batchList.length === 0}
                      className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-[#1B3F79] text-[10px] font-extrabold px-2.5 py-1.5 rounded-xl border border-slate-300 shadow-sm cursor-pointer transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      DXF (UTM)
                    </button>
                    <button
                      onClick={() => handleDownloadDXF('TM3')}
                      disabled={batchList.length === 0}
                      className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-[#1B3F79] text-[10px] font-extrabold px-2.5 py-1.5 rounded-xl border border-slate-300 shadow-sm cursor-pointer transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      DXF (TM3)
                    </button>
                  </div>
                </div>

                {batchList.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-center bg-slate-50 border border-slate-200 rounded-2xl">
                    <FileSpreadsheet className="w-10 h-10 text-slate-300" />
                    <span className="text-xs font-extrabold text-slate-500">Belum Ada Titik Koordinat</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white max-h-96 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold sticky top-0 z-20 shadow-sm">
                        <tr>
                          <th className="py-2.5 px-3 font-extrabold">Nama</th>
                          <th className="py-2.5 px-3 font-extrabold">Geografis (DD)</th>
                          <th className="py-2.5 px-3 font-extrabold">UTM</th>
                          <th className="py-2.5 px-3 font-extrabold">TM-3°</th>
                          <th className="py-2.5 px-3 font-extrabold text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {batchList.map((item) => (
                          <tr 
                            key={item.id} 
                            onClick={() => {
                              if (
                                item.isValid && 
                                item.lat !== null && 
                                item.lon !== null && 
                                typeof item.lat === 'number' && 
                                typeof item.lon === 'number' && 
                                !isNaN(item.lat) && 
                                !isNaN(item.lon) && 
                                isFinite(item.lat) && 
                                isFinite(item.lon)
                              ) {
                                setActiveMapCoord({ lat: item.lat, lon: item.lon });
                                setTimeout(() => { document.getElementById('gis-map-canvas')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
                              }
                            }}
                            className={`group cursor-pointer transition-colors ${
                              activeMapCoord && 
                              item.lat !== null && 
                              item.lon !== null && 
                              typeof item.lat === 'number' && 
                              typeof item.lon === 'number' && 
                              !isNaN(item.lat) && 
                              !isNaN(item.lon) && 
                              typeof activeMapCoord.lat === 'number' && 
                              typeof activeMapCoord.lon === 'number' && 
                              !isNaN(activeMapCoord.lat) && 
                              !isNaN(activeMapCoord.lon) && 
                              Math.abs(activeMapCoord.lat - item.lat) < 0.000001 && 
                              Math.abs(activeMapCoord.lon - item.lon) < 0.000001
                                ? 'bg-[#E9EEF2]/70 hover:bg-[#D1DCE3]/50' 
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-2 px-3 font-sans font-extrabold text-slate-800">
                              <span className="truncate max-w-[80px]" title={item.name}>{item.name}</span>
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              {item.isValid && item.lat !== null && item.lon !== null ? (
                                <div>
                                  <span className="text-slate-500 font-medium text-[10px] mr-1">Lat:</span><span className="font-bold text-slate-700">{item.lat.toFixed(4)}</span>
                                  <br />
                                  <span className="text-slate-500 font-medium text-[10px] mr-1">Lon:</span><span className="font-bold text-slate-700">{item.lon.toFixed(4)}</span>
                                </div>
                              ) : (
                                <span className="text-red-500 font-sans font-bold text-[10px]" title={item.error}>{item.error || 'Invalid'}</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              {item.isValid && item.utmX !== null && item.utmY !== null ? (
                                <div>
                                  <span className="text-slate-500 font-medium text-[10px] mr-1">X:</span><span className="font-bold text-slate-700">{item.utmX.toFixed(4)}</span>
                                  <br />
                                  <span className="text-slate-500 font-medium text-[10px] mr-1">Y:</span><span className="font-bold text-slate-700">{item.utmY.toFixed(4)} <span className="text-[10px] font-normal text-slate-500">({item.utmZone}{item.utmHemi})</span></span>
                                </div>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              {item.isValid && item.tm3X !== null && item.tm3Y !== null ? (
                                <div>
                                  <span className="text-slate-500 font-medium text-[10px] mr-1">X:</span><span className="font-bold text-slate-700">{item.tm3X.toFixed(4)}</span>
                                  <br />
                                  <span className="text-slate-500 font-medium text-[10px] mr-1">Y:</span><span className="font-bold text-slate-700">{item.tm3Y.toFixed(4)} <span className="text-[10px] font-normal text-slate-500">({item.tm3Zone})</span></span>
                                </div>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setBatchList(prev => prev.filter(b => b.id !== item.id));
                                }}
                                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer inline-flex items-center justify-center"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-6 shadow-md space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 tracking-wide">
                    <FileSpreadsheet className="w-4 h-4 text-[#1B3F79]" />
                    Output Hasil Konversi
                  </h2>
                  <div className="flex items-center gap-2">
                    {activeMapCoord && (
                      isInsideIndonesia(activeMapCoord.lat, activeMapCoord.lon) ? (
                        <span className="flex items-center gap-1.5 bg-[#E9EEF2]/40 text-[#1B3F79] text-[10px] font-extrabold px-3 py-1 rounded-xl border border-[#1B3F79]/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1B3F79] animate-pulse"></span>
                          Koordinat Valid
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 bg-red-50 text-red-600 text-[10px] font-extrabold px-3 py-1 rounded-xl border border-red-200 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                          Luar Wilayah Indonesia
                        </span>
                      )
                    )}
                    <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-2 py-1 rounded border border-slate-200">WGS84 Reference</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Card 1: DD or DMS depending on activeTab */}
                  {(activeTab === 'DMS' || activeTab === 'UTM' || activeTab === 'TM3') && (
                    <div className="bg-[#F8FAFC] border-2 border-[#1B3F79]/80 rounded-2xl p-4.5 space-y-3.5 shadow-sm relative overflow-hidden group hover:border-[#1B3F79] transition-all">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#1B3F79]/10 rounded-full blur-2xl pointer-events-none" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-4 h-4 text-[#1B3F79]" />
                          <span className="text-xs font-black text-[#1B3F79] uppercase tracking-wider font-sans">Desimal Derajat (DD)</span>
                        </div>
                        
                      </div>

                      <div className="space-y-3 font-mono text-xs relative z-10">
                        <div>
                          <div className="text-[10px] text-[#1B3F79] font-sans font-bold block mb-1">Latitude (Y)</div>
                          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#D1DCE3] shadow-sm">
                            <span className="text-[#1B3F79] font-black text-sm truncate">{results.geo.lat.toFixed(4)}°</span>
                            <button
                              onClick={() => handleCopy(results.geo.lat.toFixed(4), 'geo_lat')}
                              className="text-[#1B3F79] hover:text-[#2455A2] p-1 hover:bg-[#F8FAFC] rounded-lg transition-all cursor-pointer"
                            >
                              {copiedField === 'geo_lat' ? <Check className="w-3.5 h-3.5 text-[#1B3F79]" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-[#1B3F79] font-sans font-bold block mb-1">Longitude (X)</div>
                          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#D1DCE3] shadow-sm">
                            <span className="text-[#1B3F79] font-black text-sm truncate">{results.geo.lon.toFixed(4)}°</span>
                            <button
                              onClick={() => handleCopy(results.geo.lon.toFixed(4), 'geo_lon')}
                              className="text-[#1B3F79] hover:text-[#2455A2] p-1 hover:bg-[#F8FAFC] rounded-lg transition-all cursor-pointer"
                            >
                              {copiedField === 'geo_lon' ? <Check className="w-3.5 h-3.5 text-[#1B3F79]" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="pt-1.5">
                          <button
                            onClick={() => handleCopy(`${results.geo.lat.toFixed(4)},${results.geo.lon.toFixed(4)}`, 'geo_pair')}
                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#1B3F79] bg-white hover:bg-[#F8FAFC] text-[10px] font-black text-[#1B3F79] transition-all cursor-pointer shadow-md"
                          >
                            {copiedField === 'geo_pair' ? 'Disalin!' : 'Salin Koordinat'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Card 2: DMS for GEO, UTM, TM3 inputs */}
                  {(activeTab === 'GEO' || activeTab === 'UTM' || activeTab === 'TM3') && (
                    <div className="bg-[#F8FAFC] border-2 border-[#1B3F79]/80 rounded-2xl p-4.5 space-y-3.5 shadow-sm relative overflow-hidden group hover:border-[#1B3F79] transition-all">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#1B3F79]/10 rounded-full blur-2xl pointer-events-none" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Compass className="w-4 h-4 text-[#1B3F79]" />
                          <span className="text-xs font-black text-[#1B3F79] uppercase tracking-wider font-sans">Derajat Menit Detik (DMS)</span>
                        </div>
                        
                      </div>

                      <div className="space-y-3 font-mono text-xs relative z-10">
                        <div>
                          <div className="text-[10px] text-[#1B3F79] font-sans font-bold block mb-1">Latitude (Y)</div>
                          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#D1DCE3] shadow-sm">
                            <span className="text-[#1B3F79] font-black text-sm truncate">{getDmsString(results.geo.lat, true)}</span>
                            <button
                              onClick={() => handleCopy(getDmsString(results.geo.lat, true), 'dms_lat')}
                              className="text-[#1B3F79] hover:text-[#2455A2] p-1 hover:bg-[#F8FAFC] rounded-lg transition-all cursor-pointer"
                            >
                              {copiedField === 'dms_lat' ? <Check className="w-3.5 h-3.5 text-[#1B3F79]" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-[#1B3F79] font-sans font-bold block mb-1">Longitude (X)</div>
                          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#D1DCE3] shadow-sm">
                            <span className="text-[#1B3F79] font-black text-sm truncate">{getDmsString(results.geo.lon, false)}</span>
                            <button
                              onClick={() => handleCopy(getDmsString(results.geo.lon, false), 'dms_lon')}
                              className="text-[#1B3F79] hover:text-[#2455A2] p-1 hover:bg-[#F8FAFC] rounded-lg transition-all cursor-pointer"
                            >
                              {copiedField === 'dms_lon' ? <Check className="w-3.5 h-3.5 text-[#1B3F79]" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="pt-1.5">
                          <button
                            onClick={() => handleCopy(`${getDmsString(results.geo.lat, true)},${getDmsString(results.geo.lon, false)}`, 'dms_pair')}
                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#1B3F79] bg-white hover:bg-[#F8FAFC] text-[10px] font-black text-[#1B3F79] transition-all cursor-pointer shadow-md"
                          >
                            {copiedField === 'dms_pair' ? 'Disalin!' : 'Salin Koordinat'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Card 3: UTM for GEO, DMS, TM3 inputs */}
                  {(activeTab === 'GEO' || activeTab === 'DMS' || activeTab === 'TM3') && (
                    <div className="bg-[#F8FAFC] border-2 border-[#1B3F79]/80 rounded-2xl p-4.5 space-y-3.5 shadow-sm relative overflow-hidden group hover:border-[#1B3F79] transition-all">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#1B3F79]/10 rounded-full blur-2xl pointer-events-none" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-[#1B3F79]" />
                          <span className="text-xs font-black text-[#1B3F79] uppercase tracking-wider font-sans">UTM</span>
                        </div>
                        <span className="text-[10px] bg-[#1B3F79] text-white px-2.5 py-1 rounded-lg font-mono font-extrabold shadow-sm">Zone {results.utm.zone}{results.utm.hemi}</span>
                      </div>

                      <div className="space-y-3 font-mono text-xs relative z-10">
                        <div>
                          <div className="text-[10px] text-[#1B3F79] font-sans font-bold block mb-1">Easting (X)</div>
                          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#D1DCE3] shadow-sm">
                            <span className="text-[#1B3F79] font-black text-sm truncate">{results.utm.x.toFixed(4)} m</span>
                            <button
                              onClick={() => handleCopy(results.utm.x.toFixed(4), 'utm_x')}
                              className="text-[#1B3F79] hover:text-[#2455A2] p-1 hover:bg-[#F8FAFC] rounded-lg transition-all cursor-pointer"
                            >
                              {copiedField === 'utm_x' ? <Check className="w-3.5 h-3.5 text-[#1B3F79]" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-[#1B3F79] font-sans font-bold block mb-1">Northing (Y)</div>
                          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#D1DCE3] shadow-sm">
                            <span className="text-[#1B3F79] font-black text-sm truncate">{results.utm.y.toFixed(4)} m</span>
                            <button
                              onClick={() => handleCopy(results.utm.y.toFixed(4), 'utm_y')}
                              className="text-[#1B3F79] hover:text-[#2455A2] p-1 hover:bg-[#F8FAFC] rounded-lg transition-all cursor-pointer"
                            >
                              {copiedField === 'utm_y' ? <Check className="w-3.5 h-3.5 text-[#1B3F79]" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-[#1B3F79] font-sans font-bold block mb-1">Parameter Meridian</div>
                          <div className="bg-white p-2.5 rounded-xl border border-[#D1DCE3] space-y-1.5 text-[10px] font-bold text-[#5B6F7A]">
                            <div className="flex justify-between">
                              <span className="text-[#5B6F7A]">Meridian Tengah:</span>
                              <span className="text-[#1B3F79] font-black">{((results.utm.zone - 31) * 6 + 3)}° E</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#5B6F7A]">Skala Utama (k0):</span>
                              <span className="text-[#1B3F79] font-black">0.9996</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-1.5">
                          <button
                            onClick={() => handleCopy(`${results.utm.x.toFixed(4)},${results.utm.y.toFixed(4)}`, 'utm_pair')}
                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#1B3F79] bg-white hover:bg-[#F8FAFC] text-[10px] font-black text-[#1B3F79] transition-all cursor-pointer shadow-md"
                          >
                            {copiedField === 'utm_pair' ? 'Disalin!' : 'Salin Koordinat'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Card 4: TM-3 for GEO, DMS, UTM inputs */}
                  {(activeTab === 'GEO' || activeTab === 'DMS' || activeTab === 'UTM') && (
                    <div className="bg-[#F8FAFC] border-2 border-[#1B3F79]/80 rounded-2xl p-4.5 space-y-3.5 shadow-sm relative overflow-hidden group hover:border-[#1B3F79] transition-all">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#1B3F79]/10 rounded-full blur-2xl pointer-events-none" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4.5 h-4.5 text-[#1B3F79]" />
                          <span className="text-xs font-black text-[#1B3F79] uppercase tracking-wider font-sans">TM-3°</span>
                        </div>
                        <span className="text-[10px] bg-[#1B3F79] text-white px-2.5 py-1 rounded-lg font-mono font-extrabold shadow-sm">Zone {results.tm3.zone}</span>
                      </div>

                      <div className="space-y-3 font-mono text-xs relative z-10">
                        <div>
                          <div className="text-[10px] text-[#1B3F79] font-sans font-bold block mb-1">Easting (X)</div>
                          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#D1DCE3] shadow-sm">
                            <span className="text-[#1B3F79] font-black text-sm truncate">{results.tm3.x.toFixed(4)} m</span>
                            <button
                              onClick={() => handleCopy(results.tm3.x.toFixed(4), 'tm3_x')}
                              className="text-[#1B3F79] hover:text-[#2455A2] p-1 hover:bg-[#F8FAFC] rounded-lg transition-all cursor-pointer"
                            >
                              {copiedField === 'tm3_x' ? <Check className="w-3.5 h-3.5 text-[#1B3F79]" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-[#1B3F79] font-sans font-bold block mb-1">Northing (Y)</div>
                          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#D1DCE3] shadow-sm">
                            <span className="text-[#1B3F79] font-black text-sm truncate">{results.tm3.y.toFixed(4)} m</span>
                            <button
                              onClick={() => handleCopy(results.tm3.y.toFixed(4), 'tm3_y')}
                              className="text-[#1B3F79] hover:text-[#2455A2] p-1 hover:bg-[#F8FAFC] rounded-lg transition-all cursor-pointer"
                            >
                              {copiedField === 'tm3_y' ? <Check className="w-3.5 h-3.5 text-[#1B3F79]" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-[#1B3F79] font-sans font-bold block mb-1">Parameter Meridian</div>
                          <div className="bg-white p-2.5 rounded-xl border border-[#D1DCE3] space-y-1.5 text-[10px] font-bold text-[#5B6F7A]">
                            <div className="flex justify-between">
                              <span className="text-[#5B6F7A]">Meridian Tengah (CM):</span>
                              <span className="text-[#1B3F79] font-black">
                                {(() => {
                                  try {
                                    const mainZone = parseInt(results.tm3.zone.split('.')[0]);
                                    const subZone = parseInt(results.tm3.zone.split('.')[1]);
                                    const utmCM = (mainZone - 31) * 6 + 3;
                                    return subZone === 1 ? (utmCM - 1.5) : (utmCM + 1.5);
                                  } catch {
                                    return '-';
                                  }
                                })()}° E
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#5B6F7A]">Faktor Skala (k0):</span>
                              <span className="text-[#1B3F79] font-black">0.9999</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-1.5">
                          <button
                            onClick={() => handleCopy(`${results.tm3.x.toFixed(4)},${results.tm3.y.toFixed(4)}`, 'tm3_pair')}
                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#1B3F79] bg-white hover:bg-[#F8FAFC] text-[10px] font-black text-[#1B3F79] transition-all cursor-pointer shadow-md"
                          >
                            {copiedField === 'tm3_pair' ? 'Disalin!' : 'Salin Koordinat'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Interactive Leaflet Map Visualizer */}
            <div className="glass-panel rounded-3xl p-6 shadow-md space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Map className="w-4 h-4 text-[#1B3F79]" />
                  Tampilan Peta
                </h3>
              </div>
              <MapComponent 
                key={currentAppTab}
                activeCoord={activeMapCoord} 
                onMapClick={handleMapClick} 
                batchCoords={batchList}
                appTab={currentAppTab}
                onSelectBatchItem={(id) => {
                  const item = batchList.find(b => b.id === id);
                  if (
                    item && 
                    item.isValid && 
                    item.lat !== null && 
                    item.lon !== null &&
                    typeof item.lat === 'number' && 
                    typeof item.lon === 'number' &&
                    !isNaN(item.lat) && 
                    !isNaN(item.lon) && 
                    isFinite(item.lat) && 
                    isFinite(item.lon)
                  ) {
                    setActiveMapCoord({ lat: item.lat, lon: item.lon });
                  }
                }}
                polygons={polygons}
                selectedPolygonId={selectedPolygonId}
                draftPolygonVertices={draftVertices}
                isDraftingMode={isDrafting && currentAppTab === 'HITUNG_LUAS'}
                isSnapToVertex={isSnapEnabled}
                isShowDimensions={isShowDimensions}
                onSelectPolygon={(id) => {
                  setSelectedPolygonId(id);
                  const poly = polygons.find(p => p.id === id);
                  if (poly) {
                    const validCoords = poly.coordinates.filter(
                      c => c && typeof c.lat === 'number' && typeof c.lon === 'number' &&
                      !isNaN(c.lat) && !isNaN(c.lon) && isFinite(c.lat) && isFinite(c.lon)
                    );
                    if (validCoords.length > 0) {
                      let latSum = 0;
                      let lonSum = 0;
                      validCoords.forEach(c => {
                        latSum += c.lat;
                        lonSum += c.lon;
                      });
                      setActiveMapCoord({
                        lat: latSum / validCoords.length,
                        lon: lonSum / validCoords.length
                      });
                    }
                  }
                }}
              />
            </div>
          </section>
        </main>
      )}

      {/* 3. ARCHIVE APP TAB */}
      {currentAppTab === 'ARCHIVE' && (
        <main className="flex-1 max-w-[1600px] 2xl:max-w-[95%] w-full mx-auto p-4 lg:p-6 space-y-6">
          <div className="glass-panel rounded-3xl p-6 shadow-md space-y-6">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 tracking-wide border-b border-slate-200 pb-3 uppercase">
              <Archive className="w-4 h-4 text-[#1B3F79]" />
              Arsip Data Bidang Tanah & Hasil Ukur
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Saved Parcels */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Bidang Tanah Tersimpan ({polygons.length})</h3>
                {polygons.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-300 rounded-2xl bg-white text-slate-500 text-xs font-bold leading-normal">
                    Belum ada bidang tanah tersimpan.<br />
                    Mulai digitasi bidang di tab "Hitung Luas".
                  </div>
                ) : (
                  <div className="space-y-3">
                    {polygons.map(poly => (
                      <div key={poly.id} className="border p-4 rounded-3xl bg-white shadow-sm flex items-center justify-between border-slate-200 hover:border-slate-300 transition-all">
                        <div className="space-y-1">
                          <span className="text-xs font-black text-[#1B3F79] block uppercase flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: poly.warna }} />
                            {poly.nama}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold block font-mono">
                            Luas: {Math.floor(poly.luasSqm).toLocaleString('id-ID')} m² ({poly.luasHa.toFixed(2)} ha)
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold block">
                            Terdiri dari {poly.coordinates.length} patok batas
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPolygonId(poly.id);
                              const validCoords = poly.coordinates.filter(
                                c => c && typeof c.lat === 'number' && typeof c.lon === 'number' &&
                                !isNaN(c.lat) && !isNaN(c.lon) && isFinite(c.lat) && isFinite(c.lon)
                              );
                              if (validCoords.length > 0) {
                                let latSum = 0;
                                let lonSum = 0;
                                validCoords.forEach(c => {
                                  latSum += c.lat;
                                  lonSum += c.lon;
                                });
                                setActiveMapCoord({
                                  lat: latSum / validCoords.length,
                                  lon: lonSum / validCoords.length
                                });
                              }
                              setCurrentAppTab('HITUNG_LUAS');
                              setActiveTab('BIDANG');
                            }}
                            className="p-2 bg-[#E9EEF2] hover:bg-[#D1DCE3] rounded-xl text-[#1B3F79] text-[10px] font-black transition-all cursor-pointer"
                          >
                            Buka di Peta
                          </button>
                          <button
                            type="button"
                            onClick={() => exportPolygonToPDF(poly)}
                            className="p-2 bg-[#E9EEF2] hover:bg-[#D1DCE3] rounded-xl text-[#1B3F79] transition-all cursor-pointer"
                            title="Export PDF"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Hapus bidang tanah "${poly.nama}"?`)) {
                                setPolygons(prev => prev.filter(p => p.id !== poly.id));
                              }
                            }}
                            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* History conversions */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Riwayat Konversi Titik</h3>
                <CoordinateHistory
                  historyList={history}
                  onSelectHistory={(item) => {
                    handleRestoreHistory(item);
                    setCurrentAppTab('CONVERTER');
                  }}
                  onDeleteHistory={handleDeleteHistoryItem}
                  onClearAll={handleClearAllHistory}
                />
              </div>
            </div>
          </div>
        </main>
      )}

      <Footer />

      {/* Export PDF Modal */}
      {exportPdfSettings.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] lg:max-w-7xl overflow-hidden animate-slide-up flex flex-col h-[95vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h3 className="font-bold text-slate-800">Export Laporan PDF</h3>
              <button 
                onClick={() => setExportPdfSettings(prev => ({ ...prev, isOpen: false }))}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
              <div className="w-full lg:w-80 p-5 space-y-4 border-r border-slate-100 overflow-y-auto shrink-0 bg-white">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Basemap</label>
                  <select 
                    value={exportPdfSettings.basemap}
                    onChange={(e) => setExportPdfSettings(prev => ({ ...prev, basemap: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1B3F79]/20 focus:border-[#1B3F79] outline-none transition-all"
                  >
                    <option value="none">Tanpa Basemap</option>
                    <option value="satellite">Citra Satelit</option>
                    <option value="streets">Peta Jalan (OSM)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Sistem Koordinat</label>
                  <select 
                    value={exportPdfSettings.coordinateSystem}
                    onChange={(e) => setExportPdfSettings(prev => ({ ...prev, coordinateSystem: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1B3F79]/20 focus:border-[#1B3F79] outline-none transition-all"
                  >
                    <option value="utm">UTM (Universal Transverse Mercator)</option>
                    <option value="tm3">TM-3 (Zona {exportPdfSettings.polygon && exportPdfSettings.polygon.coordinates.length > 0 ? convertFromGeo(exportPdfSettings.polygon.coordinates[0].lat, exportPdfSettings.polygon.coordinates[0].lon).tm3.zone : ''})</option>
                    <option value="wgs84">Geografis (WGS84)</option>
                  </select>
                </div>
                
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                  <button 
                    onClick={handleConfirmExportPDF}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-[#1B3F79] rounded-xl hover:bg-[#2455A2] transition-colors shadow-sm"
                  >
                    <FileDown className="w-4 h-4" />
                    Export & Download PDF
                  </button>
                  <button 
                    onClick={() => setExportPdfSettings(prev => ({ ...prev, isOpen: false }))}
                    className="w-full px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
              
              <div className="flex-1 bg-slate-100 overflow-hidden relative min-h-[400px]">
                {previewHtml ? (
                  <iframe 
                    srcDoc={previewHtml} 
                    className="w-full h-full border-0 bg-white"
                    title="PDF Preview"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                    <span className="text-sm font-medium">Memuat Pratinjau...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav 
        currentTab={currentAppTab}
        onTabChange={handleTabChange}
      />

    </div>
  );
}
