// Mock providers - realistic synthetic data for demo/offline mode
// These power the app when APIs are unavailable or mock mode is enabled.

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
  ClimateZone,
  LogisticsData,
  HazardIndicators,
  HazardLevel,
  MonthlyClimate,
} from "@/types/domain";

// ─── Helper to find closest demo preset ──────────────────────────────────────
function latLngKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

// ─── Mock Geocoding Provider ──────────────────────────────────────────────────
export class MockGeocodingProvider implements GeocodingProvider {
  async geocode(query: string): Promise<GeocodingResult[]> {
    // Return a plausible result based on the query
    return [
      {
        displayName: `${query} (Demo)`,
        coordinates: { lat: 48.85, lng: 2.35 },
        city: query,
        country: "France",
        region: "Île-de-France",
      },
    ];
  }

  async reverseGeocode(coords: Coordinates): Promise<LocationInfo> {
    const preset = findClosestPreset(coords);
    return {
      coordinates: coords,
      elevation: preset?.elevation ?? 50,
      address: preset?.address ?? `${coords.lat.toFixed(4)}°, ${coords.lng.toFixed(4)}°`,
      city: preset?.city ?? "Unknown City",
      country: preset?.country ?? "Unknown Country",
      region: preset?.region ?? null,
    };
  }
}

// ─── Mock Elevation Provider ──────────────────────────────────────────────────
export class MockElevationProvider implements ElevationProvider {
  async getElevation(coords: Coordinates): Promise<ElevationResult> {
    const preset = findClosestPreset(coords);
    return {
      elevationM: preset?.elevation ?? 45,
      confidence: "medium",
      source: "Mock (Demo Mode)",
    };
  }
}

// ─── Mock Climate Provider ────────────────────────────────────────────────────
export class MockClimateProvider implements ClimateProvider {
  async getClimateProfile(coords: Coordinates): Promise<ClimateProfile> {
    const preset = findClosestPreset(coords);
    return preset?.climate ?? DEFAULT_TEMPERATE_CLIMATE;
  }
}

// ─── Mock POI Provider ────────────────────────────────────────────────────────
export class MockPOIProvider implements POIProvider {
  async getLogisticsData(coords: Coordinates): Promise<LogisticsData> {
    const preset = findClosestPreset(coords);
    return preset?.logistics ?? DEFAULT_LOGISTICS;
  }
}

// ─── Mock Hazard Provider ─────────────────────────────────────────────────────
export class MockHazardProvider implements HazardProvider {
  async getHazardIndicators(
    coords: Coordinates,
    elevation: number | null,
    climate: ClimateProfile | null
  ): Promise<HazardIndicators> {
    const preset = findClosestPreset(coords);
    if (preset?.hazards) return preset.hazards;

    // Derive from elevation and climate if no preset
    const elev = elevation ?? 50;
    const avgTemp = climate?.annualAvgTempC ?? 15;
    const hotDays = climate?.hotDaysPerYear ?? 20;

    return {
      seismicRiskProxy: "low",
      floodRiskProxy: elev < 10 ? "high" : elev < 50 ? "moderate" : "low",
      windExposureProxy: "low",
      heatStressProxy: hotDays > 60 ? "high" : hotDays > 30 ? "moderate" : "low",
      wildfireProxy: avgTemp > 28 ? "moderate" : "low",
      nearWaterBodyKm: 5,
      coastalProximityKm: 50,
    };
  }
}

// ─── Demo Preset Data ─────────────────────────────────────────────────────────
interface DemoPreset {
  label: string;
  lat: number;
  lng: number;
  radius: number; // degrees - how close a point must be to match
  elevation: number;
  address: string;
  city: string;
  country: string;
  region: string | null;
  climate: ClimateProfile;
  logistics: LogisticsData;
  hazards: HazardIndicators;
}

function findClosestPreset(coords: Coordinates): DemoPreset | null {
  let closest: DemoPreset | null = null;
  let minDist = Infinity;

  for (const preset of DEMO_PRESETS) {
    const dist = Math.sqrt(
      Math.pow(coords.lat - preset.lat, 2) + Math.pow(coords.lng - preset.lng, 2)
    );
    if (dist < preset.radius && dist < minDist) {
      minDist = dist;
      closest = preset;
    }
  }

  return closest;
}

function makeMonthlyClimate(
  avgTemps: number[],
  precips: number[]
): MonthlyClimate[] {
  return avgTemps.map((avg, i) => ({
    month: i + 1,
    avgTempC: avg,
    maxTempC: avg + 6,
    minTempC: avg - 6,
    precipMm: precips[i],
  }));
}

const DEFAULT_TEMPERATE_CLIMATE: ClimateProfile = {
  annualAvgTempC: 12,
  annualMaxTempC: 28,
  annualMinTempC: -2,
  hotDaysPerYear: 8,
  coldDaysPerYear: 5,
  annualPrecipMm: 650,
  climateZone: "temperate-oceanic",
  monthly: makeMonthlyClimate(
    [3, 4, 7, 10, 14, 17, 20, 19, 16, 12, 7, 4],
    [55, 45, 50, 48, 55, 52, 48, 50, 55, 65, 65, 60]
  ),
};

const DEFAULT_LOGISTICS: LogisticsData = {
  nearestAirportKm: { name: "International Airport", distanceKm: 18, found: true },
  nearestHospitalKm: { name: "General Hospital", distanceKm: 4, found: true },
  nearestFireStationKm: { name: "Fire Station", distanceKm: 3, found: true },
  nearestPoliceKm: { name: "Police Station", distanceKm: 3, found: true },
  nearestFuelKm: { name: "Fuel Station", distanceKm: 2, found: true },
  nearestHighwayKm: { name: "Highway", distanceKm: 3, found: true },
};

export const DEMO_PRESETS: DemoPreset[] = [
  // Frankfurt - Cool Climate Metro
  {
    label: "Frankfurt (Cool Climate Metro)",
    lat: 50.11,
    lng: 8.68,
    radius: 3,
    elevation: 112,
    address: "Frankfurt am Main, Germany",
    city: "Frankfurt",
    country: "Germany",
    region: "Hesse",
    climate: {
      annualAvgTempC: 10.8,
      annualMaxTempC: 32,
      annualMinTempC: -8,
      hotDaysPerYear: 8,
      coldDaysPerYear: 20,
      annualPrecipMm: 600,
      climateZone: "temperate-continental",
      monthly: makeMonthlyClimate(
        [1, 2, 6, 10, 14, 18, 21, 20, 16, 11, 5, 2],
        [48, 42, 52, 48, 65, 65, 58, 55, 55, 50, 52, 50]
      ),
    },
    logistics: {
      nearestAirportKm: { name: "Frankfurt Airport (FRA)", distanceKm: 12, found: true },
      nearestHospitalKm: { name: "Universitätsklinikum Frankfurt", distanceKm: 5, found: true },
      nearestFireStationKm: { name: "Feuerwehr Frankfurt", distanceKm: 2, found: true },
      nearestPoliceKm: { name: "Polizeipräsidium Frankfurt", distanceKm: 3, found: true },
      nearestFuelKm: { name: "Tankstelle", distanceKm: 1, found: true },
      nearestHighwayKm: { name: "A3 Autobahn", distanceKm: 4, found: true },
    },
    hazards: {
      seismicRiskProxy: "low",
      floodRiskProxy: "low",
      windExposureProxy: "low",
      heatStressProxy: "low",
      wildfireProxy: "very-low",
      nearWaterBodyKm: 2,
      coastalProximityKm: 450,
    },
  },
  // Dubai - Hot Dry Inland
  {
    label: "Dubai (Hot Dry Inland)",
    lat: 25.2,
    lng: 55.27,
    radius: 3,
    elevation: 15,
    address: "Dubai Industrial City, Dubai, UAE",
    city: "Dubai",
    country: "United Arab Emirates",
    region: "Dubai Emirate",
    climate: {
      annualAvgTempC: 27.5,
      annualMaxTempC: 48,
      annualMinTempC: 12,
      hotDaysPerYear: 120,
      coldDaysPerYear: 0,
      annualPrecipMm: 95,
      climateZone: "arid",
      monthly: makeMonthlyClimate(
        [19, 20, 23, 27, 32, 35, 38, 38, 35, 31, 25, 20],
        [10, 15, 20, 5, 0, 0, 0, 0, 0, 0, 5, 15]
      ),
    },
    logistics: {
      nearestAirportKm: { name: "Dubai International Airport (DXB)", distanceKm: 14, found: true },
      nearestHospitalKm: { name: "Mediclinic Hospital", distanceKm: 8, found: true },
      nearestFireStationKm: { name: "Dubai Civil Defence", distanceKm: 5, found: true },
      nearestPoliceKm: { name: "Dubai Police HQ", distanceKm: 6, found: true },
      nearestFuelKm: { name: "ENOC Station", distanceKm: 2, found: true },
      nearestHighwayKm: { name: "Sheikh Zayed Road (E11)", distanceKm: 2, found: true },
    },
    hazards: {
      seismicRiskProxy: "low",
      floodRiskProxy: "low",
      windExposureProxy: "moderate",
      heatStressProxy: "very-high",
      wildfireProxy: "very-low",
      nearWaterBodyKm: 10,
      coastalProximityKm: 12,
    },
  },
  // Mumbai - Coastal Flood Risk
  {
    label: "Mumbai (Coastal Flood Risk)",
    lat: 19.08,
    lng: 72.88,
    radius: 3,
    elevation: 8,
    address: "Andheri, Mumbai, Maharashtra, India",
    city: "Mumbai",
    country: "India",
    region: "Maharashtra",
    climate: {
      annualAvgTempC: 27.2,
      annualMaxTempC: 38,
      annualMinTempC: 16,
      hotDaysPerYear: 45,
      coldDaysPerYear: 0,
      annualPrecipMm: 2166,
      climateZone: "tropical",
      monthly: makeMonthlyClimate(
        [24, 25, 28, 30, 32, 30, 29, 28, 28, 29, 27, 24],
        [2, 2, 3, 15, 18, 485, 617, 340, 265, 64, 15, 5]
      ),
    },
    logistics: {
      nearestAirportKm: { name: "Chhatrapati Shivaji International Airport", distanceKm: 5, found: true },
      nearestHospitalKm: { name: "Kokilaben Dhirubhai Ambani Hospital", distanceKm: 6, found: true },
      nearestFireStationKm: { name: "Mumbai Fire Brigade", distanceKm: 3, found: true },
      nearestPoliceKm: { name: "Andheri Police Station", distanceKm: 2, found: true },
      nearestFuelKm: { name: "HP Petrol Pump", distanceKm: 1, found: true },
      nearestHighwayKm: { name: "Western Express Highway", distanceKm: 1, found: true },
    },
    hazards: {
      seismicRiskProxy: "low",
      floodRiskProxy: "very-high",
      windExposureProxy: "high",
      heatStressProxy: "moderate",
      wildfireProxy: "very-low",
      nearWaterBodyKm: 0.5,
      coastalProximityKm: 2,
    },
  },
  // Tokyo - Seismic Dense City
  {
    label: "Tokyo (Seismic Dense City)",
    lat: 35.68,
    lng: 139.69,
    radius: 3,
    elevation: 44,
    address: "Shinjuku, Tokyo, Japan",
    city: "Tokyo",
    country: "Japan",
    region: "Tokyo Metropolis",
    climate: {
      annualAvgTempC: 15.4,
      annualMaxTempC: 38,
      annualMinTempC: -3,
      hotDaysPerYear: 18,
      coldDaysPerYear: 10,
      annualPrecipMm: 1528,
      climateZone: "subtropical",
      monthly: makeMonthlyClimate(
        [5, 6, 9, 14, 19, 22, 27, 28, 24, 18, 12, 7],
        [52, 56, 118, 125, 138, 168, 154, 168, 210, 198, 98, 58]
      ),
    },
    logistics: {
      nearestAirportKm: { name: "Haneda Airport (HND)", distanceKm: 18, found: true },
      nearestHospitalKm: { name: "Tokyo Medical University Hospital", distanceKm: 3, found: true },
      nearestFireStationKm: { name: "Shinjuku Fire Station", distanceKm: 2, found: true },
      nearestPoliceKm: { name: "Shinjuku Police Station", distanceKm: 1, found: true },
      nearestFuelKm: { name: "ENEOS Station", distanceKm: 1, found: true },
      nearestHighwayKm: { name: "Metropolitan Expressway", distanceKm: 2, found: true },
    },
    hazards: {
      seismicRiskProxy: "very-high",
      floodRiskProxy: "moderate",
      windExposureProxy: "high",
      heatStressProxy: "moderate",
      wildfireProxy: "low",
      nearWaterBodyKm: 8,
      coastalProximityKm: 25,
    },
  },
  // Nairobi - Remote Logistics Challenge
  {
    label: "Nairobi (Remote Logistics Challenge)",
    lat: -1.29,
    lng: 36.82,
    radius: 3,
    elevation: 1795,
    address: "Industrial Area, Nairobi, Kenya",
    city: "Nairobi",
    country: "Kenya",
    region: "Nairobi County",
    climate: {
      annualAvgTempC: 17.8,
      annualMaxTempC: 28,
      annualMinTempC: 8,
      hotDaysPerYear: 2,
      coldDaysPerYear: 0,
      annualPrecipMm: 860,
      climateZone: "temperate-oceanic",
      monthly: makeMonthlyClimate(
        [19, 20, 20, 18, 17, 16, 15, 16, 17, 18, 18, 19],
        [38, 55, 120, 215, 165, 45, 18, 25, 30, 55, 108, 85]
      ),
    },
    logistics: {
      nearestAirportKm: { name: "Jomo Kenyatta International Airport", distanceKm: 16, found: true },
      nearestHospitalKm: { name: "Nairobi Hospital", distanceKm: 9, found: true },
      nearestFireStationKm: { name: "Nairobi Fire Brigade", distanceKm: 7, found: true },
      nearestPoliceKm: { name: "Industrial Area Police", distanceKm: 5, found: true },
      nearestFuelKm: { name: "Total Fuel Station", distanceKm: 3, found: true },
      nearestHighwayKm: { name: "Mombasa Road (A109)", distanceKm: 4, found: true },
    },
    hazards: {
      seismicRiskProxy: "low",
      floodRiskProxy: "low",
      windExposureProxy: "very-low",
      heatStressProxy: "very-low",
      wildfireProxy: "low",
      nearWaterBodyKm: 20,
      coastalProximityKm: 450,
    },
  },
];
