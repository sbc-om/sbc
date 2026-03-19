export const OMAN_DEFAULT_CENTER = { lat: 23.588, lng: 58.3829 } as const;

export const OMAN_BOUNDS = {
  south: 16.45,
  west: 51.85,
  north: 26.45,
  east: 59.9,
} as const;

export const OMAN_BOUNDS_TUPLE: [[number, number], [number, number]] = [
  [OMAN_BOUNDS.south, OMAN_BOUNDS.west],
  [OMAN_BOUNDS.north, OMAN_BOUNDS.east],
] ;

export const OMAN_MIN_ZOOM = 7;
export const OMAN_DEFAULT_ZOOM = 8;
export const OMAN_CITY_ZOOM = 12;
export const OMAN_DETAIL_ZOOM = 16;
export const OMAN_MAX_ZOOM = 18;

export const OMAN_TILE_ATTRIBUTION =
  'Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors • Tiles © <a href="https://carto.com/attributions">CARTO</a>';

export const OMAN_TILE_TEMPLATE =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

export const OMAN_DARK_TILE_TEMPLATE =
  "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png";

export const OMAN_TILE_SUBDOMAINS = ["a", "b", "c", "d"];

export const OMAN_TILE_LAYER_OPTIONS = {
  attribution: OMAN_TILE_ATTRIBUTION,
  subdomains: OMAN_TILE_SUBDOMAINS,
  maxZoom: OMAN_MAX_ZOOM,
  maxNativeZoom: OMAN_MAX_ZOOM,
  minZoom: OMAN_MIN_ZOOM,
  detectRetina: true,
  updateWhenIdle: false,
  updateWhenZooming: false,
  keepBuffer: 8,
  crossOrigin: true,
  noWrap: true,
  bounds: OMAN_BOUNDS_TUPLE,
} as const;

const WEB_MERCATOR_MAX_LAT = 85.05112878;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function isWithinOmanBounds(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= OMAN_BOUNDS.south &&
    lat <= OMAN_BOUNDS.north &&
    lng >= OMAN_BOUNDS.west &&
    lng <= OMAN_BOUNDS.east
  );
}

export function clampToOmanBounds(lat: number, lng: number) {
  return {
    lat: clamp(lat, OMAN_BOUNDS.south, OMAN_BOUNDS.north),
    lng: clamp(lng, OMAN_BOUNDS.west, OMAN_BOUNDS.east),
  };
}

type TileWarmupInput = {
  south: number;
  west: number;
  north: number;
  east: number;
  zooms: number[];
  devicePixelRatio?: number;
  limit?: number;
};

function lngToTileX(lng: number, zoom: number) {
  const worldTiles = 2 ** zoom;
  const normalizedLng = ((lng + 180) / 360) * worldTiles;
  return clamp(Math.floor(normalizedLng), 0, worldTiles - 1);
}

function latToTileY(lat: number, zoom: number) {
  const worldTiles = 2 ** zoom;
  const safeLat = clamp(lat, -WEB_MERCATOR_MAX_LAT, WEB_MERCATOR_MAX_LAT);
  const rad = (safeLat * Math.PI) / 180;
  const mercator = (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2;
  return clamp(Math.floor(mercator * worldTiles), 0, worldTiles - 1);
}

export function buildOmanTileWarmupUrls({
  south,
  west,
  north,
  east,
  zooms,
  devicePixelRatio = 1,
  limit = 36,
}: TileWarmupInput) {
  const urls: string[] = [];
  const retinaSuffix = devicePixelRatio > 1 ? "@2x" : "";

  for (const zoomLevel of zooms) {
    const zoom = clamp(Math.round(zoomLevel), OMAN_MIN_ZOOM, OMAN_MAX_ZOOM);
    const xStart = lngToTileX(west, zoom);
    const xEnd = lngToTileX(east, zoom);
    const yStart = latToTileY(north, zoom);
    const yEnd = latToTileY(south, zoom);

    for (let x = xStart; x <= xEnd; x += 1) {
      for (let y = yStart; y <= yEnd; y += 1) {
        const subdomain = OMAN_TILE_SUBDOMAINS[(x + y + zoom) % OMAN_TILE_SUBDOMAINS.length];
        urls.push(
          `https://${subdomain}.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${x}/${y}${retinaSuffix}.png`
        );
        if (urls.length >= limit) return urls;
      }
    }
  }

  return urls;
}
