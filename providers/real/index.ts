// Real API providers - production implementations
// These are used when API keys are available and NEXT_PUBLIC_MOCK_MODE is false.

import type {
  GeocodingProvider,
  GeocodingResult,
  ElevationProvider,
  ElevationResult,
  ClimateProvider,
  POIProvider,
  HazardProvider,
} from "@/providers/interfaces";
import type {
  Coordinates,
  LocationInfo,
  ClimateProfile,
  MonthlyClimate,
  LogisticsData,
  HazardIndicators,
  HazardLevel,
  ClimateZone,
} from "@/types/domain";

// ─── Nominatim Geocoding ──────────────────────────────────────────────────────
export class NominatimGeocodingProvider implements GeocodingProvider {
  private baseUrl = "https://nominatim.openstreetmap.org";
  private userAgent = "DC-SiteLab/1.0 (educational-simulator)";

  async geocode(query: string): Promise<GeocodingResult[]> {
    const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": this.userAgent },
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Nominatim geocode failed: ${res.status}`);

    const data = await res.json();
    return data.map((item: any) => ({
      displayName: item.display_name,
      coordinates: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) },
      city: item.address?.city || item.address?.town || item.address?.village || null,
      country: item.address?.country || null,
      region: item.address?.state || null,
    }));
  }

  async reverseGeocode(coords: Coordinates): Promise<LocationInfo> {
    const url = `${this.baseUrl}/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": this.userAgent },
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Nominatim reverse geocode failed: ${res.status}`);

    const data = await res.json();
    const addr = data.address || {};
    return {
      coordinates: coords,
      elevation: null, // will be filled by elevation provider
      address: data.display_name || null,
      city: addr.city || addr.town || addr.village || addr.county || null,
      country: addr.country || null,
      region: addr.state || null,
    };
  }
}

// ─── Open-Elevation ───────────────────────────────────────────────────────────
export class OpenElevationProvider implements ElevationProvider {
  private baseUrl = "https://api.open-elevation.com/api/v1";

  async getElevation(coords: Coordinates): Promise<ElevationResult> {
    const url = `${this.baseUrl}/lookup?locations=${coords.lat},${coords.lng}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`Open-Elevation failed: ${res.status}`);

    const data = await res.json();
    const elevation = data.results?.[0]?.elevation ?? null;

    return {
      elevationM: elevation ?? 0,
      confidence: elevation !== null ? "high" : "low",
      source: "Open-Elevation (SRTM 30m)",
    };
  }
}

// ─── Open-Meteo Climate ───────────────────────────────────────────────────────
export class OpenMeteoClimateProvider implements ClimateProvider {
  private baseUrl = "https://archive-api.open-meteo.com/v1/archive";

  async getClimateProfile(coords: Coordinates): Promise<ClimateProfile> {
    // Use 10-year historical average (2014-2023)
    const params = new URLSearchParams({
      latitude: String(coords.lat),
      longitude: String(coords.lng),
      start_date: "2014-01-01",
      end_date: "2023-12-31",
      daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
      timezone: "UTC",
    });

    const res = await fetch(`${this.baseUrl}?${params}`, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`Open-Meteo failed: ${res.status}`);

    const data = await res.json();
    return parseOpenMeteoResponse(data);
  }
}

function parseOpenMeteoResponse(data: any): ClimateProfile {
  const daily = data.daily;
  const tempMax: number[] = daily?.temperature_2m_max ?? [];
  const tempMin: number[] = daily?.temperature_2m_min ?? [];
  const precip: number[] = daily?.precipitation_sum ?? [];

  const tempAvg = tempMax.map((max: number, i: number) => (max + tempMin[i]) / 2);

  const annualAvg = tempAvg.reduce((a: number, b: number) => a + b, 0) / tempAvg.length;
  const annualMax = Math.max(...tempMax);
  const annualMin = Math.min(...tempMin);
  const hotDays = tempMax.filter((t: number) => t > 35).length;
  const coldDays = tempMin.filter((t: number) => t < -10).length;
  const annualPrecip = precip.reduce((a: number, b: number) => a + (b || 0), 0) / 10; // 10 years

  // Monthly averages
  const monthly: MonthlyClimate[] = [];
  for (let m = 0; m < 12; m++) {
    let sumAvg = 0, sumMax = 0, sumMin = 0, sumPrecip = 0, count = 0;
    tempMax.forEach((max: number, i: number) => {
      const date = new Date(daily.time[i]);
      if (date.getMonth() === m) {
        sumMax += max;
        sumMin += tempMin[i];
        sumAvg += tempAvg[i];
        sumPrecip += precip[i] || 0;
        count++;
      }
    });
    monthly.push({
      month: m + 1,
      avgTempC: parseFloat((sumAvg / count).toFixed(1)),
      maxTempC: parseFloat((sumMax / count).toFixed(1)),
      minTempC: parseFloat((sumMin / count).toFixed(1)),
      precipMm: parseFloat((sumPrecip / 10).toFixed(1)), // annual avg
    });
  }

  return {
    annualAvgTempC: parseFloat(annualAvg.toFixed(1)),
    annualMaxTempC: parseFloat(annualMax.toFixed(1)),
    annualMinTempC: parseFloat(annualMin.toFixed(1)),
    hotDaysPerYear: Math.round(hotDays / 10),
    coldDaysPerYear: Math.round(coldDays / 10),
    annualPrecipMm: parseFloat((annualPrecip).toFixed(0)),
    climateZone: deriveClimateZone(annualAvg, annualPrecip, hotDays / 10),
    monthly,
  };
}

function deriveClimateZone(avgTemp: number, precip: number, hotDays: number): ClimateZone {
  if (avgTemp < -5) return "polar";
  if (avgTemp < 2) return "subarctic";
  if (avgTemp < 10 && precip > 400) return "temperate-oceanic";
  if (avgTemp < 10) return "temperate-continental";
  if (avgTemp < 18 && precip < 250) return "semi-arid";
  if (avgTemp < 18) return "temperate-oceanic";
  if (precip < 200) return "arid";
  if (avgTemp > 22 && precip > 1500) return "tropical";
  return "subtropical";
}

// ─── Overpass POI Provider ────────────────────────────────────────────────────
export class OverpassPOIProvider implements POIProvider {
  private baseUrl = "https://overpass-api.de/api/interpreter";

  async getLogisticsData(coords: Coordinates): Promise<LogisticsData> {
    const radius = 50000; // 50 km search radius
    const { lat, lng } = coords;

    const query = `
      [out:json][timeout:25];
      (
        node["aeroway"="aerodrome"](around:${radius},${lat},${lng});
        way["aeroway"="aerodrome"](around:${radius},${lat},${lng});
        node["amenity"="hospital"](around:${radius},${lat},${lng});
        node["amenity"="fire_station"](around:${radius},${lat},${lng});
        node["amenity"="police"](around:${radius},${lat},${lng});
        node["amenity"="fuel"](around:${radius},${lat},${lng});
        way["highway"~"^(motorway|trunk|primary)$"](around:15000,${lat},${lng});
      );
      out center;
    `;

    const res = await fetch(this.baseUrl, {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error(`Overpass failed: ${res.status}`);

    const data = await res.json();
    return parseOverpassResponse(data.elements || [], coords);
  }
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearest(elements: any[], tags: Record<string, string | RegExp>, coords: Coordinates) {
  let nearest: any = null;
  let minDist = Infinity;

  for (const el of elements) {
    const elLat = el.lat ?? el.center?.lat;
    const elLng = el.lon ?? el.center?.lon;
    if (!elLat || !elLng) continue;

    const matchesTags = Object.entries(tags).every(([k, v]) => {
      const val = el.tags?.[k];
      return v instanceof RegExp ? v.test(val) : val === v;
    });
    if (!matchesTags) continue;

    const dist = haversineKm(coords.lat, coords.lng, elLat, elLng);
    if (dist < minDist) {
      minDist = dist;
      nearest = el;
    }
  }

  return nearest ? { name: nearest.tags?.name || null, dist: minDist } : null;
}

function parseOverpassResponse(elements: any[], coords: Coordinates): LogisticsData {
  const airport = findNearest(elements, { aeroway: "aerodrome" }, coords);
  const hospital = findNearest(elements, { amenity: "hospital" }, coords);
  const fire = findNearest(elements, { amenity: "fire_station" }, coords);
  const police = findNearest(elements, { amenity: "police" }, coords);
  const fuel = findNearest(elements, { amenity: "fuel" }, coords);

  // Find nearest major road
  let nearestRoadDist = Infinity;
  let nearestRoadName: string | null = null;
  for (const el of elements) {
    const hw = el.tags?.highway;
    if (!["motorway", "trunk", "primary"].includes(hw)) continue;
    const elLat = el.lat ?? el.center?.lat;
    const elLng = el.lon ?? el.center?.lon;
    if (!elLat || !elLng) continue;
    const dist = haversineKm(coords.lat, coords.lng, elLat, elLng);
    if (dist < nearestRoadDist) {
      nearestRoadDist = dist;
      nearestRoadName = el.tags?.name || el.tags?.ref || null;
    }
  }

  return {
    nearestAirportKm: airport
      ? { name: airport.name, distanceKm: parseFloat(airport.dist.toFixed(1)), found: true }
      : { name: null, distanceKm: 999, found: false },
    nearestHospitalKm: hospital
      ? { name: hospital.name, distanceKm: parseFloat(hospital.dist.toFixed(1)), found: true }
      : { name: null, distanceKm: 999, found: false },
    nearestFireStationKm: fire
      ? { name: fire.name, distanceKm: parseFloat(fire.dist.toFixed(1)), found: true }
      : { name: null, distanceKm: 999, found: false },
    nearestPoliceKm: police
      ? { name: police.name, distanceKm: parseFloat(police.dist.toFixed(1)), found: true }
      : { name: null, distanceKm: 999, found: false },
    nearestFuelKm: fuel
      ? { name: fuel.name, distanceKm: parseFloat(fuel.dist.toFixed(1)), found: true }
      : { name: null, distanceKm: 999, found: false },
    nearestHighwayKm:
      nearestRoadDist < 999
        ? { name: nearestRoadName, distanceKm: parseFloat(nearestRoadDist.toFixed(1)), found: true }
        : { name: null, distanceKm: 999, found: false },
  };
}

// ─── Hazard Provider (Proxy-Based) ────────────────────────────────────────────
// This uses elevation, climate, and OSM data to derive hazard proxy estimates.
// It does NOT use any real seismic or FEMA API.
export class ProxyHazardProvider implements HazardProvider {
  async getHazardIndicators(
    coords: Coordinates,
    elevation: number | null,
    climate: ClimateProfile | null
  ): Promise<HazardIndicators> {
    const elev = elevation ?? 50;
    const avgTemp = climate?.annualAvgTempC ?? 15;
    const hotDays = climate?.hotDaysPerYear ?? 20;
    const precip = climate?.annualPrecipMm ?? 600;
    const zone = climate?.climateZone ?? "temperate-oceanic";

    // Seismic: rough geographic proxy by latitude bands and known zones
    const seismic = deriveSeismicProxy(coords);
    // Flood: low elevation + proximity (elevation proxy only)
    const flood: HazardLevel = elev < 5 ? "very-high" : elev < 20 ? "high" : elev < 50 ? "moderate" : "low";
    // Wind: coastal and tropical zones
    const wind: HazardLevel =
      zone === "tropical" || zone === "subtropical" ? "high"
      : zone === "temperate-oceanic" ? "moderate"
      : "low";
    // Heat
    const heat: HazardLevel =
      hotDays > 90 ? "very-high" : hotDays > 60 ? "high" : hotDays > 30 ? "moderate" : "low";
    // Wildfire: arid + semi-arid + subtropical with low precip
    const wildfire: HazardLevel =
      (zone === "arid" || zone === "semi-arid") && avgTemp > 25 ? "high"
      : zone === "subtropical" && precip < 600 ? "moderate"
      : "low";

    return {
      seismicRiskProxy: seismic,
      floodRiskProxy: flood,
      windExposureProxy: wind,
      heatStressProxy: heat,
      wildfireProxy: wildfire,
      nearWaterBodyKm: null, // would come from Overpass if integrated
      coastalProximityKm: null,
    };
  }
}

function deriveSeismicProxy(coords: Coordinates): HazardLevel {
  const { lat, lng } = coords;
  // Very rough geographic heuristics for educational purpose
  // Pacific Ring of Fire approximation
  if ((lat > 30 && lat < 50 && lng > 130 && lng < 150)) return "very-high"; // Japan area
  if ((lat > 30 && lat < 50 && lng > 120 && lng < 130)) return "high";     // China coast
  if ((lat > 32 && lat < 48 && lng > -125 && lng < -115)) return "high";   // US West Coast
  if ((lat > -55 && lat < 12 && lng > -80 && lng < -65)) return "high";    // Andes
  if ((lat > 35 && lat < 45 && lng > 25 && lng < 45)) return "moderate";   // Turkey/Greece
  if ((lat > 25 && lat < 40 && lng > 45 && lng < 65)) return "moderate";   // Iran/Pakistan
  return "low";
}
