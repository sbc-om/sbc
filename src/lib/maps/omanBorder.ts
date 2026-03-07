"use client";

export type GeoJsonRing = [number, number][];
export type GeoJsonPolygon = GeoJsonRing[];
export type OmanBorderGeometry =
  | { type: "Polygon"; coordinates: GeoJsonPolygon }
  | { type: "MultiPolygon"; coordinates: GeoJsonPolygon[] };

export type OmanBorderFeature = {
  type: "Feature";
  properties?: Record<string, unknown>;
  geometry: OmanBorderGeometry;
};

export type OmanBorderFeatureCollection = {
  type: "FeatureCollection";
  features: OmanBorderFeature[];
};

let omanBorderPromise: Promise<OmanBorderFeatureCollection> | null = null;

export function loadOmanBorderGeoJson() {
  if (!omanBorderPromise) {
    omanBorderPromise = fetch("/geo/oman-border.geojson").then((response) => {
      if (!response.ok) throw new Error("Failed to load Oman border");
      return response.json() as Promise<OmanBorderFeatureCollection>;
    });
  }

  return omanBorderPromise;
}

export function getPrimaryOmanGeometry(geojson: OmanBorderFeatureCollection) {
  return geojson.features[0]?.geometry ?? null;
}

export function toMaskGeometry(geometry: OmanBorderGeometry) {
  const worldRing: GeoJsonRing = [
    [-180, -90],
    [180, -90],
    [180, 90],
    [-180, 90],
    [-180, -90],
  ];

  const holes =
    geometry.type === "Polygon"
      ? [geometry.coordinates[0]]
      : geometry.coordinates.map((polygon) => polygon[0]);

  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [worldRing, ...holes],
    },
  };
}

function pointInRing(lat: number, lng: number, ring: GeoJsonRing) {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersects =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / ((yj - yi) || Number.EPSILON) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

function pointInPolygon(lat: number, lng: number, polygon: GeoJsonPolygon) {
  if (polygon.length === 0) return false;
  if (!pointInRing(lat, lng, polygon[0])) return false;

  for (let index = 1; index < polygon.length; index += 1) {
    if (pointInRing(lat, lng, polygon[index])) return false;
  }

  return true;
}

export function isPointInsideOmanGeometry(
  lat: number,
  lng: number,
  geometry: OmanBorderGeometry | null | undefined
) {
  if (!geometry) return false;

  if (geometry.type === "Polygon") {
    return pointInPolygon(lat, lng, geometry.coordinates);
  }

  return geometry.coordinates.some((polygon) => pointInPolygon(lat, lng, polygon));
}
