// Overpass API service for fetching real POI data
// Used by site-selection map to get actual names of power plants, hospitals, etc.

export interface OverpassPOI {
  lat: number;
  lng: number;
  name: string;
  type: string;
  tags: Record<string, string>;
}

// Overpass query configs per layer type
const OVERPASS_QUERIES: Record<string, { query: string; fallbackName: (tags: Record<string, string>) => string }> = {
  powerPlant: {
    query: `[out:json][timeout:15];(node["power"="plant"]({{bbox}});way["power"="plant"]({{bbox}});node["power"="generator"]({{bbox}}););out center 20;`,
    fallbackName: (tags) => tags["plant:output:electricity"] ? `Enerji Santrali (${tags["plant:output:electricity"]})` : "Enerji Santrali",
  },
  flightPath: {
    query: `[out:json][timeout:15];(way["aeroway"="runway"]({{bbox}});node["aeroway"="aerodrome"]({{bbox}});way["aeroway"="aerodrome"]({{bbox}}););out center 20;`,
    fallbackName: (tags) => tags["aeroway"] === "runway" ? "Pist" : "Havaalanı",
  },
  fuelStation: {
    query: `[out:json][timeout:15];(node["amenity"="fuel"]({{bbox}}););out center 30;`,
    fallbackName: (tags) => tags["brand"] || tags["operator"] || "Yakıt İstasyonu",
  },
  highway: {
    query: `[out:json][timeout:15];(way["highway"="motorway"]({{bbox}});way["highway"="trunk"]({{bbox}});way["highway"="primary"]({{bbox}}););out center 30;`,
    fallbackName: (tags) => tags["ref"] || tags["highway"]?.replace("_", " ") || "Ana Yol",
  },
  hospital: {
    query: `[out:json][timeout:15];(node["amenity"="hospital"]({{bbox}});way["amenity"="hospital"]({{bbox}});node["amenity"="clinic"]({{bbox}}););out center 20;`,
    fallbackName: () => "Hastane",
  },
  fireStation: {
    query: `[out:json][timeout:15];(node["amenity"="fire_station"]({{bbox}});way["amenity"="fire_station"]({{bbox}}););out center 10;`,
    fallbackName: () => "İtfaiye",
  },
  waterBody: {
    query: `[out:json][timeout:15];(way["waterway"="river"]({{bbox}});way["natural"="water"]({{bbox}});relation["natural"="water"]({{bbox}}););out center 20;`,
    fallbackName: (tags) => tags["water"] === "lake" ? "Göl" : tags["waterway"] === "river" ? "Nehir" : "Su Kaynağı",
  },
};

// Cache to avoid re-fetching
const cache = new Map<string, { data: OverpassPOI[]; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch real POI data from Overpass API for a given layer type and bounding box.
 */
export async function fetchPOIsForLayer(
  layerId: string,
  center: { lat: number; lng: number },
  radiusKm: number = 50
): Promise<OverpassPOI[]> {
  const config = OVERPASS_QUERIES[layerId];
  if (!config) return [];

  // Build bounding box from center + radius
  const latDelta = radiusKm / 110.574;
  const lngDelta = radiusKm / (111.32 * Math.cos((center.lat * Math.PI) / 180));
  const bbox = `${center.lat - latDelta},${center.lng - lngDelta},${center.lat + latDelta},${center.lng + lngDelta}`;

  // Check cache
  const cacheKey = `${layerId}:${bbox}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const query = config.query.replace(/\{\{bbox\}\}/g, bbox);

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      console.warn(`Overpass API error for ${layerId}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const elements = data.elements || [];

    const pois: OverpassPOI[] = elements
      .map((el: any) => {
        const lat = el.lat ?? el.center?.lat;
        const lng = el.lon ?? el.center?.lon;
        if (!lat || !lng) return null;

        const tags = el.tags || {};
        const name = tags.name || tags["name:tr"] || tags["name:en"] || config.fallbackName(tags);

        return {
          lat,
          lng,
          name,
          type: layerId,
          tags,
        };
      })
      .filter(Boolean) as OverpassPOI[];

    // Deduplicate by proximity (within 100m)
    const deduped = deduplicatePOIs(pois);

    // Cache result
    cache.set(cacheKey, { data: deduped, timestamp: Date.now() });

    return deduped;
  } catch (err) {
    console.warn(`Overpass API fetch failed for ${layerId}:`, err);
    return [];
  }
}

function deduplicatePOIs(pois: OverpassPOI[]): OverpassPOI[] {
  const result: OverpassPOI[] = [];
  for (const poi of pois) {
    const isDupe = result.some(
      (existing) =>
        Math.abs(existing.lat - poi.lat) < 0.001 &&
        Math.abs(existing.lng - poi.lng) < 0.001 &&
        existing.name === poi.name
    );
    if (!isDupe) result.push(poi);
  }
  return result;
}

/**
 * Fetch all POI layers for the given center.
 */
export async function fetchAllPOIs(
  center: { lat: number; lng: number },
  radiusKm: number = 50
): Promise<Record<string, OverpassPOI[]>> {
  const layerIds = Object.keys(OVERPASS_QUERIES);
  const results: Record<string, OverpassPOI[]> = {};

  // Fetch sequentially to avoid rate limiting
  for (const layerId of layerIds) {
    try {
      results[layerId] = await fetchPOIsForLayer(layerId, center, radiusKm);
      // Small delay between requests to be polite to Overpass API
      await new Promise((r) => setTimeout(r, 300));
    } catch {
      results[layerId] = [];
    }
  }

  return results;
}
