import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { GeographicCoord, BatchCoordinateItem, BidangTanah } from '../types';
import { Layers, Globe, Map, Compass } from 'lucide-react';

// Monkeypatch Leaflet to prevent "Invalid LatLng object: (NaN, NaN)" from crashing the app
if (typeof window !== 'undefined' && L) {
  const OriginalLatLng = L.LatLng;
  const OriginalLatLngBounds = L.LatLngBounds;

  const sanitizeSingleValue = (val: any, fallback: number): number => {
    if (val === undefined || val === null) return fallback;
    const num = Number(val);
    if (isNaN(num) || !isFinite(num)) return fallback;
    return num;
  };

  const sanitizeLatLng = (val: any, fallbackLat = -2.5, fallbackLon = 118.0): any => {
    if (val === undefined || val === null) {
      return { lat: fallbackLat, lng: fallbackLon };
    }

    // If it's a LatLngBounds, or looks like one, return as-is
    if (
      (OriginalLatLngBounds && val instanceof OriginalLatLngBounds) ||
      (val.constructor && val.constructor.name === 'LatLngBounds') ||
      typeof val.getSouthWest === 'function'
    ) {
      return val;
    }

    // If it's already an array
    if (Array.isArray(val)) {
      if (val.length === 0) {
        return [fallbackLat, fallbackLon];
      }
      // If it's a 1D array of coordinates [lat, lng, ...]
      const first = val[0];
      const isPrimitive = first === null || first === undefined || typeof first === 'number' || typeof first === 'string' || typeof first === 'boolean';
      if (isPrimitive) {
        const lat = sanitizeSingleValue(val[0], fallbackLat);
        const lng = sanitizeSingleValue(val[1], fallbackLon);
        const copy = [...val];
        copy[0] = lat;
        copy[1] = lng;
        return copy;
      } else {
        // If it's a 2D or deeper array (e.g., polygon paths)
        return val.map(v => sanitizeLatLng(v, fallbackLat, fallbackLon));
      }
    }

    // If it's an object
    if (typeof val === 'object') {
      const isLatLngInstance = val instanceof OriginalLatLng || (val.constructor && val.constructor.name === 'LatLng');
      const hasCoords = val.lat !== undefined || val.lng !== undefined || val.lon !== undefined || val.x !== undefined || val.y !== undefined;

      if (isLatLngInstance || hasCoords) {
        const latVal = val.lat !== undefined ? val.lat : (val.y !== undefined ? val.y : undefined);
        const lonVal = val.lng !== undefined ? val.lng : (val.lon !== undefined ? val.lon : (val.x !== undefined ? val.x : undefined));
        
        const safeLat = sanitizeSingleValue(latVal, fallbackLat);
        const safeLon = sanitizeSingleValue(lonVal, fallbackLon);
        
        if (isLatLngInstance) {
          try {
            val.lat = safeLat;
            val.lng = safeLon;
            return val;
          } catch (e) {
            return new (OriginalLatLng as any)(safeLat, safeLon);
          }
        }
        
        return { ...val, lat: safeLat, lng: safeLon, lon: safeLon };
      }

      // If it's some other object (like a config object) and has no coordinates, don't modify it!
      return val;
    }

    // Fallback if it is a primitive number/string passed directly
    const singleNum = Number(val);
    if (!isNaN(singleNum) && isFinite(singleNum)) {
      return singleNum;
    }

    return { lat: fallbackLat, lng: fallbackLon };
  };

  // Custom LatLng constructor wrapper
  function SafeLatLng(this: any, lat: any, lng: any, alt: any) {
    let safeLat = lat;
    let safeLng = lng;
    
    if (Array.isArray(lat)) {
      safeLat = lat[0];
      safeLng = lat[1];
    } else if (lat && typeof lat === 'object') {
      safeLat = lat.lat !== undefined ? lat.lat : (lat.y !== undefined ? lat.y : undefined);
      safeLng = lat.lng !== undefined ? lat.lng : (lat.lon !== undefined ? lat.lon : (lat.x !== undefined ? lat.x : undefined));
    }
    
    safeLat = sanitizeSingleValue(safeLat, -2.5);
    safeLng = sanitizeSingleValue(safeLng, 118.0);
    
    try {
      return new (OriginalLatLng as any)(safeLat, safeLng, alt);
    } catch (e) {
      console.warn('Leaflet SafeLatLng constructor failed, falling back safely:', e);
      return new (OriginalLatLng as any)(-2.5, 118.0, alt);
    }
  }
  
  SafeLatLng.prototype = OriginalLatLng.prototype;
  (L as any).LatLng = SafeLatLng;
  
  // Also patch L.latLng factory
  const originalLatLngFactory = L.latLng;
  (L as any).latLng = function(a: any, b: any, c: any) {
    try {
      if (a === undefined || a === null) {
        return originalLatLngFactory(-2.5, 118.0);
      }
      
      // Case 1: L.latLng(lat, lng) where both or one are numbers/strings/NaNs/undefined
      if (b !== undefined || typeof a === 'number' || typeof a === 'string') {
        if (b === undefined) {
          const safeA = sanitizeSingleValue(a, -2.5);
          return originalLatLngFactory(safeA, 118.0, c);
        }
        const safeA = sanitizeSingleValue(a, -2.5);
        const safeB = sanitizeSingleValue(b, 118.0);
        return originalLatLngFactory(safeA, safeB, c);
      }
      
      // Case 2: L.latLng([lat, lng]) or L.latLng({lat, lng})
      const safeA = sanitizeLatLng(a, -2.5, 118.0);
      return originalLatLngFactory(safeA, undefined, c);
    } catch (e) {
      console.warn('Leaflet L.latLng factory error caught. Using fallback [-2.5, 118.0]:', e);
      return originalLatLngFactory(-2.5, 118.0);
    }
  };

  // Also patch L.latLngBounds factory
  const originalLatLngBounds = L.latLngBounds;
  (L as any).latLngBounds = function(a: any, b: any) {
    try {
      const safeA = sanitizeLatLng(a, -2.5, 118.0);
      const safeB = b !== undefined ? sanitizeLatLng(b, -2.5, 118.0) : undefined;
      return originalLatLngBounds(safeA, safeB);
    } catch (e) {
      console.warn('Leaflet L.latLngBounds factory error caught. Using fallback bounding box:', e);
      return originalLatLngBounds([-3.0, 117.0], [-2.0, 119.0]);
    }
  };

  // Also patch L.polygon factory
  const originalPolygon = L.polygon;
  (L as any).polygon = function(latlngs: any, options: any) {
    try {
      const safeLatLngs = sanitizeLatLng(latlngs, -2.5, 118.0);
      return originalPolygon(safeLatLngs, options);
    } catch (e) {
      console.warn('Leaflet L.polygon factory error caught:', e);
      return originalPolygon([], options);
    }
  };

  // Also patch L.polyline factory
  const originalPolyline = L.polyline;
  (L as any).polyline = function(latlngs: any, options: any) {
    try {
      const safeLatLngs = sanitizeLatLng(latlngs, -2.5, 118.0);
      return originalPolyline(safeLatLngs, options);
    } catch (e) {
      console.warn('Leaflet L.polyline factory error caught:', e);
      return originalPolyline([], options);
    }
  };

  // Also patch L.marker factory
  const originalMarker = L.marker;
  (L as any).marker = function(latlng: any, options: any) {
    try {
      const safeLatLng = sanitizeLatLng(latlng, -2.5, 118.0);
      return originalMarker(safeLatLng, options);
    } catch (e) {
      console.warn('Leaflet L.marker factory error caught:', e);
      return originalMarker([-2.5, 118.0], options);
    }
  };

  // Patch prototypes to intercept and sanitize inputs at the very core Leaflet class methods
  if (L.Map && L.Map.prototype) {
    const originalMapSetView = L.Map.prototype.setView;
    L.Map.prototype.setView = function(center: any, zoom: any, options: any) {
      try {
        const safeCenter = sanitizeLatLng(center, -2.5, 118.0);
        return originalMapSetView.call(this, safeCenter, zoom, options);
      } catch (e) {
        console.warn('Leaflet Map.setView error caught:', e);
        return originalMapSetView.call(this, [-2.5, 118.0], zoom, options);
      }
    };

    const originalMapPanTo = L.Map.prototype.panTo;
    L.Map.prototype.panTo = function(center: any, options: any) {
      try {
        const safeCenter = sanitizeLatLng(center, -2.5, 118.0);
        return originalMapPanTo.call(this, safeCenter, options);
      } catch (e) {
        console.warn('Leaflet Map.panTo error caught:', e);
        return originalMapPanTo.call(this, [-2.5, 118.0], options);
      }
    };

    const originalMapFlyTo = L.Map.prototype.flyTo;
    L.Map.prototype.flyTo = function(center: any, zoom: any, options: any) {
      try {
        const safeCenter = sanitizeLatLng(center, -2.5, 118.0);
        return originalMapFlyTo.call(this, safeCenter, zoom, options);
      } catch (e) {
        console.warn('Leaflet Map.flyTo error caught:', e);
        return originalMapFlyTo.call(this, [-2.5, 118.0], zoom, options);
      }
    };

    const originalMapFitBounds = L.Map.prototype.fitBounds;
    L.Map.prototype.fitBounds = function(bounds: any, options: any) {
      try {
        if (bounds && typeof bounds.getSouthWest === 'function') {
          return originalMapFitBounds.call(this, bounds, options);
        }
        const safeBounds = sanitizeLatLng(bounds, -2.5, 118.0);
        return originalMapFitBounds.call(this, safeBounds, options);
      } catch (e) {
        console.warn('Leaflet Map.fitBounds error caught:', e);
        return originalMapFitBounds.call(this, [[-3.0, 117.0], [-2.0, 119.0]], options);
      }
    };

    const originalUnproject = L.Map.prototype.unproject;
    L.Map.prototype.unproject = function(point: any, zoom: any) {
      try {
        if (point) {
          point.x = sanitizeSingleValue(point.x, 0);
          point.y = sanitizeSingleValue(point.y, 0);
        }
        const res = originalUnproject.call(this, point, zoom);
        if (res && (isNaN(res.lat) || isNaN(res.lng))) {
          res.lat = sanitizeSingleValue(res.lat, -2.5);
          res.lng = sanitizeSingleValue(res.lng, 118.0);
        }
        return res;
      } catch (e) {
        return (L as any).latLng(-2.5, 118.0);
      }
    };

    const originalLayerPointToLatLng = L.Map.prototype.layerPointToLatLng;
    L.Map.prototype.layerPointToLatLng = function(point: any) {
      try {
        if (point) {
          point.x = sanitizeSingleValue(point.x, 0);
          point.y = sanitizeSingleValue(point.y, 0);
        }
        const res = originalLayerPointToLatLng.call(this, point);
        if (res && (isNaN(res.lat) || isNaN(res.lng))) {
          res.lat = sanitizeSingleValue(res.lat, -2.5);
          res.lng = sanitizeSingleValue(res.lng, 118.0);
        }
        return res;
      } catch (e) {
        return (L as any).latLng(-2.5, 118.0);
      }
    };

    const originalContainerPointToLatLng = L.Map.prototype.containerPointToLatLng;
    L.Map.prototype.containerPointToLatLng = function(point: any) {
      try {
        if (point) {
          point.x = sanitizeSingleValue(point.x, 0);
          point.y = sanitizeSingleValue(point.y, 0);
        }
        const res = originalContainerPointToLatLng.call(this, point);
        if (res && (isNaN(res.lat) || isNaN(res.lng))) {
          res.lat = sanitizeSingleValue(res.lat, -2.5);
          res.lng = sanitizeSingleValue(res.lng, 118.0);
        }
        return res;
      } catch (e) {
        return (L as any).latLng(-2.5, 118.0);
      }
    };
  }

  // Patch L.point factory to catch NaNs in pixel calculations early
  if (L.point) {
    const originalPoint: any = L.point;
    (L as any).point = function(x: any, y: any, round: any) {
      try {
        if (Array.isArray(x)) {
          const safeX = sanitizeSingleValue(x[0], 0);
          const safeY = sanitizeSingleValue(x[1], 0);
          return originalPoint([safeX, safeY], y);
        }
        if (x && typeof x === 'object') {
          const safeX = sanitizeSingleValue(x.x, 0);
          const safeY = sanitizeSingleValue(x.y, 0);
          return originalPoint({ x: safeX, y: safeY });
        }
        const safeX = sanitizeSingleValue(x, 0);
        const safeY = sanitizeSingleValue(y, 0);
        return originalPoint(safeX, safeY, round);
      } catch (e) {
        return originalPoint(0, 0);
      }
    };
  }

  // Patch L.Projection unproject methods to intercept LatLng instantiation with NaNs
  if (L.Projection) {
    if (L.Projection.SphericalMercator) {
      const origSphericalUnproject = L.Projection.SphericalMercator.unproject;
      L.Projection.SphericalMercator.unproject = function(point: any) {
        try {
          if (point) {
            point.x = sanitizeSingleValue(point.x, 0);
            point.y = sanitizeSingleValue(point.y, 0);
          }
          const res = origSphericalUnproject.call(this, point);
          if (res && (isNaN(res.lat) || isNaN(res.lng))) {
            res.lat = sanitizeSingleValue(res.lat, -2.5);
            res.lng = sanitizeSingleValue(res.lng, 118.0);
          }
          return res;
        } catch (e) {
          return new (OriginalLatLng as any)(-2.5, 118.0);
        }
      };
    }

    if ((L.Projection as any).Mercator) {
      const origMercatorUnproject = (L.Projection as any).Mercator.unproject;
      if (origMercatorUnproject) {
        (L.Projection as any).Mercator.unproject = function(point: any) {
          try {
            if (point) {
              point.x = sanitizeSingleValue(point.x, 0);
              point.y = sanitizeSingleValue(point.y, 0);
            }
            const res = origMercatorUnproject.call(this, point);
            if (res && (isNaN(res.lat) || isNaN(res.lng))) {
              res.lat = sanitizeSingleValue(res.lat, -2.5);
              res.lng = sanitizeSingleValue(res.lng, 118.0);
            }
            return res;
          } catch (e) {
            return new (OriginalLatLng as any)(-2.5, 118.0);
          }
        };
      }
    }

    if (L.Projection.LonLat) {
      const origLonLatUnproject = L.Projection.LonLat.unproject;
      if (origLonLatUnproject) {
        L.Projection.LonLat.unproject = function(point: any) {
          try {
            if (point) {
              point.x = sanitizeSingleValue(point.x, 0);
              point.y = sanitizeSingleValue(point.y, 0);
            }
            const res = origLonLatUnproject.call(this, point);
            if (res && (isNaN(res.lat) || isNaN(res.lng))) {
              res.lat = sanitizeSingleValue(res.lat, -2.5);
              res.lng = sanitizeSingleValue(res.lng, 118.0);
            }
            return res;
          } catch (e) {
            return new (OriginalLatLng as any)(-2.5, 118.0);
          }
        };
      }
    }
  }

  // Patch L.CRS unproject methods
  const patchCRS = (crs: any) => {
    if (crs && crs.unproject) {
      const origUnproject = crs.unproject;
      crs.unproject = function(point: any) {
        try {
          if (point) {
            point.x = sanitizeSingleValue(point.x, 0);
            point.y = sanitizeSingleValue(point.y, 0);
          }
          const res = origUnproject.call(this, point);
          if (res && (isNaN(res.lat) || isNaN(res.lng))) {
            res.lat = sanitizeSingleValue(res.lat, -2.5);
            res.lng = sanitizeSingleValue(res.lng, 118.0);
          }
          return res;
        } catch (e) {
          return new (OriginalLatLng as any)(-2.5, 118.0);
        }
      };
    }
  };

  if (L.CRS) {
    patchCRS(L.CRS.EPSG3857);
    patchCRS(L.CRS.EPSG4326);
    patchCRS((L.CRS as any).EPSG900913);
    patchCRS(L.CRS.Simple);
    patchCRS(L.CRS);
  }

  // Patch L.LatLngBounds.prototype.extend to intercept NaNs during bounds calculation
  if (L.LatLngBounds && L.LatLngBounds.prototype) {
    const originalLatLngBoundsExtend = L.LatLngBounds.prototype.extend;
    L.LatLngBounds.prototype.extend = function(obj: any) {
      try {
        if (!obj) return this;
        const safeObj = sanitizeLatLng(obj, -2.5, 118.0);
        return originalLatLngBoundsExtend.call(this, safeObj);
      } catch (e) {
        console.warn('Leaflet LatLngBounds.extend error caught:', e);
        return this;
      }
    };
  }

  if (L.Marker && L.Marker.prototype) {
    const originalMarkerInit = (L.Marker.prototype as any).initialize;
    (L.Marker.prototype as any).initialize = function(latlng: any, options: any) {
      try {
        const safeLatLng = sanitizeLatLng(latlng, -2.5, 118.0);
        return originalMarkerInit.call(this, safeLatLng, options);
      } catch (e) {
        console.warn('Leaflet Marker.initialize error caught:', e);
        return originalMarkerInit.call(this, [-2.5, 118.0], options);
      }
    };

    const originalMarkerSetLatLng = L.Marker.prototype.setLatLng;
    L.Marker.prototype.setLatLng = function(latlng: any) {
      try {
        const safeLatLng = sanitizeLatLng(latlng, -2.5, 118.0);
        return originalMarkerSetLatLng.call(this, safeLatLng);
      } catch (e) {
        console.warn('Leaflet Marker.setLatLng error caught:', e);
        return this;
      }
    };
  }

  if (L.Polyline && L.Polyline.prototype) {
    const originalPolylineInit = (L.Polyline.prototype as any).initialize;
    (L.Polyline.prototype as any).initialize = function(latlngs: any, options: any) {
      try {
        const safeLatLngs = sanitizeLatLng(latlngs, -2.5, 118.0);
        return originalPolylineInit.call(this, safeLatLngs, options);
      } catch (e) {
        console.warn('Leaflet Polyline.initialize error caught:', e);
        return originalPolylineInit.call(this, [], options);
      }
    };

    const originalPolylineSetLatLngs = L.Polyline.prototype.setLatLngs;
    L.Polyline.prototype.setLatLngs = function(latlngs: any) {
      try {
        const safeLatLngs = sanitizeLatLng(latlngs, -2.5, 118.0);
        return originalPolylineSetLatLngs.call(this, safeLatLngs);
      } catch (e) {
        console.warn('Leaflet Polyline.setLatLngs error caught:', e);
        return this;
      }
    };
  }

  if (L.Polygon && L.Polygon.prototype) {
    const originalPolygonInit = (L.Polygon.prototype as any).initialize;
    if (originalPolygonInit) {
      (L.Polygon.prototype as any).initialize = function(latlngs: any, options: any) {
        try {
          const safeLatLngs = sanitizeLatLng(latlngs, -2.5, 118.0);
          return originalPolygonInit.call(this, safeLatLngs, options);
        } catch (e) {
          console.warn('Leaflet Polygon.initialize error caught:', e);
          return originalPolygonInit.call(this, [], options);
        }
      };
    }
  }

  if (L.CircleMarker && L.CircleMarker.prototype) {
    const originalCircleMarkerInit = (L.CircleMarker.prototype as any).initialize;
    if (originalCircleMarkerInit) {
      (L.CircleMarker.prototype as any).initialize = function(latlng: any, options: any) {
        try {
          const safeLatLng = sanitizeLatLng(latlng, -2.5, 118.0);
          return originalCircleMarkerInit.call(this, safeLatLng, options);
        } catch (e) {
          console.warn('Leaflet CircleMarker.initialize error caught:', e);
          return originalCircleMarkerInit.call(this, [-2.5, 118.0], options);
        }
      };
    }
    const originalCircleMarkerSetLatLng = L.CircleMarker.prototype.setLatLng;
    if (originalCircleMarkerSetLatLng) {
      L.CircleMarker.prototype.setLatLng = function(latlng: any) {
        try {
          const safeLatLng = sanitizeLatLng(latlng, -2.5, 118.0);
          return originalCircleMarkerSetLatLng.call(this, safeLatLng);
        } catch (e) {
          console.warn('Leaflet CircleMarker.setLatLng error caught:', e);
          return this;
        }
      };
    }
  }

  if (L.Popup && L.Popup.prototype) {
    const originalPopupInit = (L.Popup.prototype as any).initialize;
    if (originalPopupInit) {
      (L.Popup.prototype as any).initialize = function(options: any, source: any) {
        return originalPopupInit.call(this, options, source);
      };
    }
    const originalPopupSetLatLng = L.Popup.prototype.setLatLng;
    if (originalPopupSetLatLng) {
      L.Popup.prototype.setLatLng = function(latlng: any) {
        try {
          const safeLatLng = sanitizeLatLng(latlng, -2.5, 118.0);
          return originalPopupSetLatLng.call(this, safeLatLng);
        } catch (e) {
          console.warn('Leaflet Popup.setLatLng error caught:', e);
          return this;
        }
      };
    }
  }

  if (L.Tooltip && L.Tooltip.prototype) {
    const originalTooltipInit = (L.Tooltip.prototype as any).initialize;
    if (originalTooltipInit) {
      (L.Tooltip.prototype as any).initialize = function(options: any, source: any) {
        return originalTooltipInit.call(this, options, source);
      };
    }
    const originalTooltipSetLatLng = L.Tooltip.prototype.setLatLng;
    if (originalTooltipSetLatLng) {
      L.Tooltip.prototype.setLatLng = function(latlng: any) {
        try {
          const safeLatLng = sanitizeLatLng(latlng, -2.5, 118.0);
          return originalTooltipSetLatLng.call(this, safeLatLng);
        } catch (e) {
          console.warn('Leaflet Tooltip.setLatLng error caught:', e);
          return this;
        }
      };
    }
  }
}

interface MapComponentProps {
  key?: string;
  activeCoord: GeographicCoord | null;
  onMapClick: (lat: number, lon: number) => void;
  batchCoords?: BatchCoordinateItem[];
  onSelectBatchItem?: (id: string) => void;
  polygons?: BidangTanah[];
  selectedPolygonId?: string | null;
  draftPolygonVertices?: GeographicCoord[];
  isDraftingMode?: boolean;
  isSnapToVertex?: boolean;
  isShowDimensions?: boolean;
  onSelectPolygon?: (id: string) => void;
  appTab?: string;
}

type BasemapType = 'google_hybrid' | 'google_satellite' | 'google_streets' | 'google_terrain';

// Helper for great-circle distance calculation (Haversine formula in meters)
function getHaversineDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper to retrieve Tile Layer URL, attribution, and subdomains for each Basemap Type
function getTileLayerConfig(basemap: BasemapType) {
  let url = '';
  let attribution = '';
  let subdomains: string[] | string = 'abc';

  switch (basemap) {
    case 'google_hybrid':
      url = 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      attribution = '&copy; Google Maps (Satellite Hybrid)';
      subdomains = '0123';
      break;
    case 'google_satellite':
      url = 'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
      attribution = '&copy; Google Maps (Satellite Only)';
      subdomains = '0123';
      break;
    case 'google_streets':
      url = 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      attribution = '&copy; Google Maps (Streets)';
      subdomains = '0123';
      break;
    case 'google_terrain':
      url = 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';
      attribution = '&copy; Google Maps (Terrain)';
      subdomains = '0123';
      break;
    default:
      // Fallback to google_hybrid as default
      url = 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      attribution = '&copy; Google Maps (Satellite Hybrid)';
      subdomains = '0123';
      break;
  }
  return { url, attribution, subdomains };
}

export default function MapComponent({ 
  activeCoord, 
  onMapClick, 
  batchCoords, 
  onSelectBatchItem,
  polygons,
  selectedPolygonId,
  draftPolygonVertices,
  isDraftingMode,
  isSnapToVertex,
  isShowDimensions = true,
  onSelectPolygon,
  appTab
}: MapComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const batchMarkersGroupRef = useRef<L.FeatureGroup | null>(null);
  const polygonsLayerGroupRef = useRef<L.FeatureGroup | null>(null);
  const draftLayerGroupRef = useRef<L.FeatureGroup | null>(null);

  const polygonsRef = useRef<BidangTanah[]>([]);
  const draftPolygonVerticesRef = useRef<GeographicCoord[]>([]);
  const isSnapToVertexRef = useRef<boolean>(false);

  useEffect(() => {
    polygonsRef.current = polygons || [];
  }, [polygons]);

  useEffect(() => {
    draftPolygonVerticesRef.current = draftPolygonVertices || [];
  }, [draftPolygonVertices]);

  useEffect(() => {
    isSnapToVertexRef.current = !!isSnapToVertex;
  }, [isSnapToVertex]);

  // Basemap State - default to Google Hybrid for best field survey mapping experience
  const [activeBasemap, setActiveBasemap] = useState<BasemapType>('google_hybrid');
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const lastClickWasMapRef = useRef<boolean>(false);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Indonesia center coordinates as default fallback
    const defaultCenter: [number, number] = [-2.5, 118.0];
    const defaultZoom = 5;

    // Create Map
    const map = L.map(containerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: false, // will add in custom position
    });

    mapRef.current = map;
    setMapInstance(map);

    // Add scale control
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    // Add zoom control at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Map Click Handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!e || !e.latlng) return;
      lastClickWasMapRef.current = true;
      let { lat, lng } = e.latlng;
      if (
        typeof lat !== 'number' ||
        typeof lng !== 'number' ||
        isNaN(lat) ||
        isNaN(lng) ||
        !isFinite(lat) ||
        !isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        return;
      }

      // Snap to nearest vertex if enabled
      if (isSnapToVertexRef.current) {
        let nearestVertex: GeographicCoord | null = null;
        let minDistancePx = Infinity;
        const thresholdPx = 15; // 15 pixel snap threshold
        const currentPoint = map.latLngToContainerPoint([lat, lng]);

        // Check saved polygons
        if (polygonsRef.current) {
          polygonsRef.current.forEach(poly => {
            if (poly.coordinates) {
              poly.coordinates.forEach(coord => {
                if (
                  coord && 
                  typeof coord.lat === 'number' && 
                  typeof coord.lon === 'number' && 
                  !isNaN(coord.lat) && 
                  !isNaN(coord.lon) && 
                  isFinite(coord.lat) && 
                  isFinite(coord.lon)
                ) {
                  const vertexPoint = map.latLngToContainerPoint([coord.lat, coord.lon]);
                  const distPx = currentPoint.distanceTo(vertexPoint);
                  if (distPx < minDistancePx && distPx <= thresholdPx) {
                    minDistancePx = distPx;
                    nearestVertex = coord;
                  }
                }
              });
            }
          });
        }

        // Check active draft polygon vertices
        if (draftPolygonVerticesRef.current) {
          draftPolygonVerticesRef.current.forEach(coord => {
            if (
              coord && 
              typeof coord.lat === 'number' && 
              typeof coord.lon === 'number' && 
              !isNaN(coord.lat) && 
              !isNaN(coord.lon) && 
              isFinite(coord.lat) && 
              isFinite(coord.lon)
            ) {
              const vertexPoint = map.latLngToContainerPoint([coord.lat, coord.lon]);
              const distPx = currentPoint.distanceTo(vertexPoint);
              if (distPx < minDistancePx && distPx <= thresholdPx) {
                minDistancePx = distPx;
                nearestVertex = coord;
              }
            }
          });
        }

        if (
          nearestVertex && 
          typeof lat === 'number' && 
          typeof lng === 'number' && 
          !isNaN(lat) && 
          !isNaN(lng) && 
          isFinite(lat) && 
          isFinite(lng)
        ) {
          lat = (nearestVertex as GeographicCoord).lat;
          lng = (nearestVertex as GeographicCoord).lon;
          
          // Show temporary visual snap feedback indicator
          const snapIcon = L.divIcon({
            className: 'custom-gis-snap-indicator',
            html: `
              <div class="relative flex items-center justify-center w-8 h-8 pointer-events-none">
                <span class="absolute inline-flex h-full w-full rounded-full bg-[#1B3F79] opacity-60 animate-ping"></span>
                <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#1B3F79] border-2 border-white shadow-md"></span>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });
          
          if (
            typeof lat === 'number' && 
            typeof lng === 'number' && 
            !isNaN(lat) && 
            !isNaN(lng) && 
            isFinite(lat) && 
            isFinite(lng)
          ) {
            const snapMarker = L.marker([lat, lng], { icon: snapIcon }).addTo(map);
            setTimeout(() => {
              snapMarker.remove();
            }, 800);
          }
        }
      }

      // Cap values to logical world bounds and ensure they are valid finite numbers
      if (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        !isNaN(lat) &&
        !isNaN(lng) &&
        isFinite(lat) &&
        isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      ) {
        onMapClickRef.current(lat, lng);
      }
    });

    // Real-time hover snapping indicator group
    const hoverSnapMarkerGroup = L.featureGroup().addTo(map);

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      if (!isSnapToVertexRef.current || !e || !e.latlng) {
        hoverSnapMarkerGroup.clearLayers();
        return;
      }
      
      const { lat, lng } = e.latlng;
      if (
        typeof lat !== 'number' ||
        typeof lng !== 'number' ||
        isNaN(lat) ||
        isNaN(lng) ||
        !isFinite(lat) ||
        !isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        hoverSnapMarkerGroup.clearLayers();
        return;
      }

      let nearestVertex: GeographicCoord | null = null;
      let minDistancePx = Infinity;
      const thresholdPx = 15; // 15 pixel snap threshold
      const currentPoint = map.latLngToContainerPoint([lat, lng]);
      
      // Check saved polygons
      if (polygonsRef.current) {
        polygonsRef.current.forEach(poly => {
          if (poly.coordinates) {
            poly.coordinates.forEach(coord => {
              if (
                coord &&
                typeof coord.lat === 'number' &&
                typeof coord.lon === 'number' &&
                !isNaN(coord.lat) &&
                !isNaN(coord.lon) &&
                isFinite(coord.lat) &&
                isFinite(coord.lon) &&
                coord.lat >= -90 &&
                coord.lat <= 90 &&
                coord.lon >= -180 &&
                coord.lon <= 180
              ) {
                const vertexPoint = map.latLngToContainerPoint([coord.lat, coord.lon]);
                const distPx = currentPoint.distanceTo(vertexPoint);
                if (distPx < minDistancePx && distPx <= thresholdPx) {
                  minDistancePx = distPx;
                  nearestVertex = coord;
                }
              }
            });
          }
        });
      }
      
      // Check active draft polygon vertices
      if (draftPolygonVerticesRef.current) {
        draftPolygonVerticesRef.current.forEach(coord => {
          if (
            coord &&
            typeof coord.lat === 'number' &&
            typeof coord.lon === 'number' &&
            !isNaN(coord.lat) &&
            !isNaN(coord.lon) &&
            isFinite(coord.lat) &&
            isFinite(coord.lon) &&
            coord.lat >= -90 &&
            coord.lat <= 90 &&
            coord.lon >= -180 &&
            coord.lon <= 180
          ) {
            const vertexPoint = map.latLngToContainerPoint([coord.lat, coord.lon]);
            const distPx = currentPoint.distanceTo(vertexPoint);
            if (distPx < minDistancePx && distPx <= thresholdPx) {
              minDistancePx = distPx;
              nearestVertex = coord;
            }
          }
        });
      }
      
      if (
        nearestVertex &&
        typeof nearestVertex.lat === 'number' &&
        typeof nearestVertex.lon === 'number' &&
        !isNaN(nearestVertex.lat) &&
        !isNaN(nearestVertex.lon) &&
        isFinite(nearestVertex.lat) &&
        isFinite(nearestVertex.lon) &&
        nearestVertex.lat >= -90 &&
        nearestVertex.lat <= 90 &&
        nearestVertex.lon >= -180 &&
        nearestVertex.lon <= 180
      ) {
        hoverSnapMarkerGroup.clearLayers();
        
        // Render a gorgeous professional-style snap target box (a square with a center dot)
        const snapBoxIcon = L.divIcon({
          className: 'custom-hover-snap-indicator',
          html: `
            <div class="relative flex items-center justify-center w-8 h-8 pointer-events-none">
              <!-- Glow pulse -->
              <span class="absolute inline-flex h-full w-full rounded-full bg-[#1B3F79]/20 animate-ping"></span>
              <!-- Square box border -->
              <span class="absolute inline-flex h-5 w-5 border-2 border-[#1B3F79] bg-white/40 shadow-sm"></span>
              <!-- Central solid core -->
              <span class="relative inline-flex h-2.5 w-2.5 bg-[#1B3F79] border border-white"></span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        
        L.marker([nearestVertex.lat, nearestVertex.lon], { icon: snapBoxIcon, interactive: false }).addTo(hoverSnapMarkerGroup);
      } else {
        hoverSnapMarkerGroup.clearLayers();
      }
    });

    map.on('mouseout', () => {
      hoverSnapMarkerGroup.clearLayers();
    });

    // Add Layer Groups for Polygons and Draft Lines
    polygonsLayerGroupRef.current = L.featureGroup().addTo(map);
    draftLayerGroupRef.current = L.featureGroup().addTo(map);

    // Setup ResizeObserver to guarantee correct sizes on parent container updates
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Force map size update
    map.invalidateSize();

    // Force invalidation after brief timeout to guarantee correct layout rendering on first load
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        tileLayerRef.current = null;
        batchMarkersGroupRef.current = null;
        polygonsLayerGroupRef.current = null;
        draftLayerGroupRef.current = null;
      }
    };
  }, []);

  // Handle active tile layer updates dynamically when basemap changes
  useEffect(() => {
    const map = mapInstance;
    if (!map) return;

    // Remove existing tile layer if it exists
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
      tileLayerRef.current = null;
    }

    const config = getTileLayerConfig(activeBasemap);
    const newLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: 20,
      subdomains: config.subdomains,
      crossOrigin: true,
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [mapInstance, activeBasemap]);

  // Fix basemap rendering issues on state changes with progressive size invalidation
  useEffect(() => {
    if (!mapInstance) return;

    const timers = [
      setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize({ animate: false }); }, 50),
      setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize({ animate: false }); }, 150),
      setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize({ animate: false }); }, 300),
      setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize({ animate: false }); }, 600),
      setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize({ animate: false }); }, 1000)
    ];

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [mapInstance, appTab, isDraftingMode, activeBasemap, polygons?.length, batchCoords?.length]);

  // Update Marker & Position
  useEffect(() => {
    const map = mapInstance;
    if (!map) return;

    if (
      activeCoord &&
      typeof activeCoord.lat === 'number' &&
      typeof activeCoord.lon === 'number' &&
      !isNaN(activeCoord.lat) &&
      !isNaN(activeCoord.lon) &&
      isFinite(activeCoord.lat) &&
      isFinite(activeCoord.lon) &&
      activeCoord.lat >= -90 &&
      activeCoord.lat <= 90 &&
      activeCoord.lon >= -180 &&
      activeCoord.lon <= 180
    ) {
      const { lat, lon } = activeCoord;
      const position: [number, number] = [lat, lon];

      // Custom pulsing blue marker to avoid broken default image assets and fit professional professional brand tone
      const customIcon = L.divIcon({
        className: 'custom-gis-marker',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <span class="absolute inline-flex h-full w-full rounded-full bg-[#1B3F79] opacity-30 animate-ping"></span>
            <span class="relative inline-flex rounded-full h-4.5 w-4.5 bg-[#1B3F79] border-2 border-white shadow-[0_0_12px_rgba(27,63,121,0.6)]"></span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      if (appTab === 'HITUNG_LUAS') {
        if (markerRef.current) {
          markerRef.current.remove();
          markerRef.current = null;
        }
      } else {
        if (markerRef.current) {
          markerRef.current.setLatLng(position);
          markerRef.current.setIcon(customIcon);
        } else {
          const marker = L.marker(position, { icon: customIcon }).addTo(map);
          markerRef.current = marker;
        }
      }

      // Pan or Fly smoothly to coordinate only if NOT a map click
      if (!lastClickWasMapRef.current) {
        const currentZoom = map.getZoom();
        const targetZoom = (currentZoom && currentZoom > 12) ? currentZoom : 18;
        map.flyTo(position, targetZoom, {
          animate: true,
          duration: 1.2,
        });
      }
      // Always reset the map click ref
      lastClickWasMapRef.current = false;
    } else {
      // If active coord is cleared, remove marker
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    }
  }, [mapInstance, activeCoord, isDraftingMode, appTab]);

  // Update Batch Markers Group
  useEffect(() => {
    const map = mapInstance;
    if (!map) return;

    if (!batchMarkersGroupRef.current) {
      batchMarkersGroupRef.current = L.featureGroup().addTo(map);
    } else {
      batchMarkersGroupRef.current.clearLayers();
    }

    if (!batchCoords || batchCoords.length === 0) {
      return;
    }

    // Fit map bounds to show all valid batch coordinates
    const validBatchItems = batchCoords.filter(
      item => item.isValid && 
      item.lat !== null && item.lon !== null && 
      typeof item.lat === 'number' && typeof item.lon === 'number' &&
      !isNaN(item.lat) && !isNaN(item.lon) && isFinite(item.lat) && isFinite(item.lon) &&
      item.lat >= -90 && item.lat <= 90 && item.lon >= -180 && item.lon <= 180
    );
    if (validBatchItems.length > 0) {
      const first = validBatchItems[0];
      const bounds = L.latLngBounds([first.lat!, first.lon!], [first.lat!, first.lon!]);
      for (let i = 1; i < validBatchItems.length; i++) {
        bounds.extend([validBatchItems[i].lat!, validBatchItems[i].lon!]);
      }
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }

    batchCoords.forEach((item) => {
      if (
        item.isValid && 
        item.lat !== null && item.lon !== null && 
        typeof item.lat === 'number' && typeof item.lon === 'number' &&
        !isNaN(item.lat) && !isNaN(item.lon) && isFinite(item.lat) && isFinite(item.lon)
      ) {
        const position: [number, number] = [item.lat, item.lon];
        
        // Is this the selected/active coordinate on map?
        const isActive = activeCoord && 
          Math.abs(activeCoord.lat - item.lat) < 1e-7 && 
          Math.abs(activeCoord.lon - item.lon) < 1e-7;

        const pulseElement = isActive 
          ? `<span class="absolute inline-flex h-8 w-8 rounded-full bg-[#1B3F79] opacity-40 animate-ping"></span>` 
          : '';
        const markerBg = isActive ? 'bg-[#2455A2]' : 'bg-[#1B3F79]';

        const customIcon = L.divIcon({
          className: 'custom-gis-batch-marker',
          html: `
            <div class="relative flex items-center justify-center w-8 h-8">
              ${pulseElement}
              <span class="relative inline-flex rounded-full h-3.5 w-3.5 ${markerBg} border border-white shadow-md"></span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker(position, { icon: customIcon });

        marker.bindTooltip(
          `<div class="text-[11px] bg-white text-slate-800 px-3 py-1.5 border border-slate-300 rounded-xl shadow-md font-sans leading-normal">
            <strong class="text-[#1B3F79] font-extrabold block pb-0.5 mb-1">${item.name || 'Titik Tanpa Nama'}</strong>
            <span class="block text-[9px] text-slate-400 font-mono mt-0.5">Klik untuk memfokuskan</span>
          </div>`,
          { permanent: false, direction: 'top', className: 'bg-transparent border-0 shadow-none' }
        );

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (onSelectBatchItem) {
            onSelectBatchItem(item.id);
          }
        });

        batchMarkersGroupRef.current?.addLayer(marker);
      }
    });
  }, [mapInstance, batchCoords, activeCoord, onSelectBatchItem]);

  // Update Polygons & Draft Layers on map
  useEffect(() => {
    const map = mapInstance;
    if (!map) return;

    const showPolygons = appTab === 'HITUNG_LUAS';

    // 1. Render Saved Polygons
    if (!polygonsLayerGroupRef.current) {
      polygonsLayerGroupRef.current = L.featureGroup().addTo(map);
    } else {
      polygonsLayerGroupRef.current.clearLayers();
    }

    if (showPolygons && polygons && polygons.length > 0) {
      polygons.forEach((poly) => {
        if (!poly.coordinates || poly.coordinates.length < 3) return;

        const validCoords = poly.coordinates.filter(
          c => c && typeof c.lat === 'number' && typeof c.lon === 'number' &&
          !isNaN(c.lat) && !isNaN(c.lon) && isFinite(c.lat) && isFinite(c.lon) &&
          c.lat >= -90 && c.lat <= 90 && c.lon >= -180 && c.lon <= 180
        );

        if (validCoords.length < 3) return;

        const latlngs = validCoords.map(c => [c.lat, c.lon] as [number, number]);
        
        const isSelected = selectedPolygonId === poly.id;
        const polyColor = isSelected ? '#F59E0B' : (poly.warna || '#1B3F79');
        const polyFill = isSelected ? '#FBBF24' : (poly.warna || '#1B3F79');

        // Render Polygon with high glare visibility styling
        const polygonLayer = L.polygon(latlngs, {
          color: polyColor,
          fillColor: polyFill,
          fillOpacity: isSelected ? 0.4 : 0.25,
          weight: isSelected ? 4 : 3,
        }).addTo(polygonsLayerGroupRef.current!);

        // Bind Permanent Tooltip with Nama Bidang & Luasan Bidang (no background, borders, or shadow)
        polygonLayer.bindTooltip(
          `<div class="text-center p-1 min-w-[90px]">
            <div class="font-extrabold text-[11px] text-[#1B3F79] tracking-tight leading-tight uppercase pb-0.5 mb-0.5 font-sans">${poly.nama}</div>
            <div class="font-mono font-black text-xs text-[#1B3F79] leading-none">${Math.floor(poly.luasSqm).toLocaleString('id-ID')} m²</div>
            <div class="font-mono text-[9px] text-[#1B3F79]/80 leading-none mt-0.5 font-bold">(${poly.luasHa.toFixed(2)} ha)</div>
          </div>`,
          {
            permanent: true,
            direction: 'center',
            className: 'custom-polygon-tooltip no-bg-tooltip font-bold'
          }
        );

        // Render segment dimensions for saved polygon - rotated to align with the segment line (no background, borders, or shadow)
        if (isShowDimensions) {
          for (let i = 0; i < validCoords.length; i++) {
            const vStart = validCoords[i];
            const vEnd = validCoords[(i + 1) % validCoords.length];
            
            const dist = getHaversineDistanceInMeters(vStart.lat, vStart.lon, vEnd.lat, vEnd.lon);
            const midLat = (vStart.lat + vEnd.lat) / 2;
            const midLon = (vStart.lon + vEnd.lon) / 2;
            
            const dLat = vEnd.lat - vStart.lat;
            const dLon = (vEnd.lon - vStart.lon) * Math.cos((midLat * Math.PI) / 180);
            let angle = -Math.atan2(dLat, dLon) * (180 / Math.PI);
            
            // Normalize angle to keep text readable and right-side up (range between -90 and 90 degrees)
            if (angle > 90) {
              angle -= 180;
            } else if (angle < -90) {
              angle += 180;
            }
            
            const labelIcon = L.divIcon({
              className: 'custom-segment-dimension-label',
              html: `
                <div class="text-[${poly.warna || '#1B3F79'}] text-[10px] font-black font-mono flex items-center justify-center whitespace-nowrap" style="transform: rotate(${angle.toFixed(1)}deg); transform-origin: center center; display: inline-flex;">
                  ${dist.toFixed(2)} m
                </div>
              `,
              iconSize: [60, 20],
              iconAnchor: [30, 10],
            });
            
            L.marker([midLat, midLon], { icon: labelIcon, interactive: false }).addTo(polygonsLayerGroupRef.current!);
          }
        }

        // Map Click or select polygon callback
        polygonLayer.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (onSelectPolygon) {
            onSelectPolygon(poly.id);
          }
        });
      });
    }

    // 2. Render Active Draft Polygon
    if (!draftLayerGroupRef.current) {
      draftLayerGroupRef.current = L.featureGroup().addTo(map);
    } else {
      draftLayerGroupRef.current.clearLayers();
    }

    if (showPolygons && draftPolygonVertices && draftPolygonVertices.length > 0) {
      const validDraftVertices = draftPolygonVertices.filter(
        c => c && typeof c.lat === 'number' && typeof c.lon === 'number' &&
        !isNaN(c.lat) && !isNaN(c.lon) && isFinite(c.lat) && isFinite(c.lon) &&
        c.lat >= -90 && c.lat <= 90 && c.lon >= -180 && c.lon <= 180
      );

      const latlngs = validDraftVertices.map(c => [c.lat, c.lon] as [number, number]);

      // Render Draft Vertices (SurveyMap Pro geodetic crosshair target markers)
      validDraftVertices.forEach((vertex, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === validDraftVertices.length - 1;
        const markerBg = isFirst ? 'bg-red-600' : (isLast ? 'bg-[#1B3F79]' : 'bg-[#5B6F7A]');
        const pulse = isLast ? '<span class="absolute inline-flex h-7 w-7 rounded-full bg-[#1B3F79] opacity-40 animate-ping"></span>' : '';

        const vertexIcon = L.divIcon({
          className: 'custom-draft-vertex-marker',
          html: `
            <div class="relative flex items-center justify-center w-8 h-8">
              ${pulse}
              <!-- Geodetic Crosshair target lines -->
              <div class="absolute w-6 h-0.5 bg-white/80"></div>
              <div class="absolute h-6 w-0.5 bg-white/80"></div>
              <!-- Outer geodetic ring -->
              <div class="absolute w-5 h-5 rounded-full border border-white shadow-sm"></div>
              <!-- Center solid marker circle -->
              <span class="relative flex items-center justify-center rounded-full h-3.5 w-3.5 ${markerBg} border border-white shadow-md">
                <span class="w-1 h-1 bg-white rounded-full"></span>
              </span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const vertexMarker = L.marker([vertex.lat, vertex.lon], { icon: vertexIcon }).addTo(draftLayerGroupRef.current!);
        
        vertexMarker.bindTooltip(
          `<div class="text-[10px] font-black font-mono text-[#1B3F79]">Pt ${idx + 1}</div>`,
          { permanent: true, direction: 'right', className: 'no-bg-tooltip' }
        );
      });

      // Render Segment Dimensions (Lengths) (no background, borders, or shadow)
      if (isShowDimensions && validDraftVertices.length >= 2) {
        for (let i = 0; i < validDraftVertices.length; i++) {
          const vStart = validDraftVertices[i];
          // If less than 3 points, only draw between consecutive points. If 3 or more points, close the loop.
          if (i === validDraftVertices.length - 1 && validDraftVertices.length < 3) {
            break;
          }
          const vEnd = validDraftVertices[(i + 1) % validDraftVertices.length];
          
          const dist = getHaversineDistanceInMeters(vStart.lat, vStart.lon, vEnd.lat, vEnd.lon);
          const midLat = (vStart.lat + vEnd.lat) / 2;
          const midLon = (vStart.lon + vEnd.lon) / 2;
          
          const dLat = vEnd.lat - vStart.lat;
          const dLon = (vEnd.lon - vStart.lon) * Math.cos((midLat * Math.PI) / 180);
          let angle = -Math.atan2(dLat, dLon) * (180 / Math.PI);
          
          // Normalize angle to keep text readable and right-side up (range between -90 and 90 degrees)
          if (angle > 90) {
            angle -= 180;
          } else if (angle < -90) {
            angle += 180;
          }
          
          const labelIcon = L.divIcon({
            className: 'custom-segment-dimension-label',
            html: `
              <div class="text-[#1B3F79] text-[10px] font-black font-mono flex items-center justify-center whitespace-nowrap" style="transform: rotate(${angle.toFixed(1)}deg); transform-origin: center center; display: inline-flex;">
                ${dist.toFixed(2)} m
              </div>
            `,
            iconSize: [60, 20],
            iconAnchor: [30, 10],
          });
          
          L.marker([midLat, midLon], { icon: labelIcon, interactive: false }).addTo(draftLayerGroupRef.current!);
        }
      }

      // Render Draft Line or completed preview Polygon
      if (validDraftVertices.length >= 2) {
        if (validDraftVertices.length >= 3) {
          L.polygon(latlngs, {
            color: '#1B3F79',
            fillColor: '#1B3F79',
            fillOpacity: 0.18,
            weight: 2.5,
            dashArray: '5, 5',
          }).addTo(draftLayerGroupRef.current!);
        } else {
          L.polyline(latlngs, {
            color: '#1B3F79',
            weight: 2.5,
            dashArray: '5, 5',
          }).addTo(draftLayerGroupRef.current!);
        }
      }
    }
  }, [mapInstance, polygons, selectedPolygonId, draftPolygonVertices, onSelectPolygon, isDraftingMode, appTab, isShowDimensions]);

  // Update Map Container cursor classes safely without clobbering Leaflet's own classes
  useEffect(() => {
    if (containerRef.current) {
      if (isDraftingMode) {
        containerRef.current.classList.add('drafting-active');
        containerRef.current.classList.remove('pointer-active');
      } else {
        containerRef.current.classList.add('pointer-active');
        containerRef.current.classList.remove('drafting-active');
      }
    }
  }, [isDraftingMode]);

  return (
    <div className="relative w-full h-full min-h-[420px] lg:min-h-[520px] rounded-2xl overflow-hidden border border-slate-300 shadow-xl flex flex-col">
      {/* Map Element */}
      <div 
        ref={containerRef} 
        className="w-full h-[480px] flex-1 z-10" 
        id="gis-map-canvas" 
      />

      {/* Floating Map Instructions Overlay */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none hidden sm:block">
        {!isDraftingMode && (
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 text-slate-800 text-[11px] px-3.5 py-2 rounded-xl shadow-md flex items-center gap-2 font-bold">
            <span className="w-2 h-2 rounded-full bg-[#1B3F79] animate-pulse shadow-[0_0_8px_rgba(27,63,121,0.5)]"></span>
            <span>
              {appTab === 'HITUNG_LUAS' ? 'Pilih fitur atau mulai digitasi baru' : 
               appTab === 'BATCH' ? 'Pilih koordinat dari tabel' : 
               'Klik peta untuk mengambil koordinat'}
            </span>
          </div>
        )}
      </div>

      {/* Floating Basemap Selector Controls */}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-1.5 rounded-2xl shadow-lg flex items-center gap-1.5">
          <div className="p-1.5 text-slate-500 flex items-center justify-center" title="Sistem Basemap">
            <Layers className="w-4 h-4 text-[#1B3F79]" />
          </div>
          <div className="h-4 w-[1px] bg-slate-200" />
          
          {[
            { id: 'google_hybrid', label: 'Google Hybrid', icon: <Globe className="w-4 h-4" /> },
            { id: 'google_satellite', label: 'Google Satelit', icon: <Map className="w-4 h-4" /> },
            { id: 'google_streets', label: 'Google Jalan', icon: <Compass className="w-4 h-4" /> },
            { id: 'google_terrain', label: 'Google Kontur', icon: <Layers className="w-4 h-4" /> }
          ].map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveBasemap(item.id as BasemapType)}
              title={item.label}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                activeBasemap === item.id
                  ? 'bg-[#1B3F79] text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
