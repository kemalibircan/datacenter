// Provider interfaces - all external data access goes through these abstractions
import type {
  Coordinates,
  LocationInfo,
  ClimateProfile,
  LogisticsData,
  HazardIndicators,
} from "@/types/domain";

// ─── Geocoding Provider ───────────────────────────────────────────────────────
export interface GeocodingProvider {
  geocode(query: string): Promise<GeocodingResult[]>;
  reverseGeocode(coords: Coordinates): Promise<LocationInfo>;
}

export interface GeocodingResult {
  displayName: string;
  coordinates: Coordinates;
  city: string | null;
  country: string | null;
  region: string | null;
}

// ─── Elevation Provider ───────────────────────────────────────────────────────
export interface ElevationProvider {
  getElevation(coords: Coordinates): Promise<ElevationResult>;
}

export interface ElevationResult {
  elevationM: number;
  confidence: "high" | "medium" | "low";
  source: string;
}

// ─── Climate Provider ─────────────────────────────────────────────────────────
export interface ClimateProvider {
  getClimateProfile(coords: Coordinates): Promise<ClimateProfile>;
}

// ─── POI Provider ─────────────────────────────────────────────────────────────
export interface POIProvider {
  getLogisticsData(coords: Coordinates): Promise<LogisticsData>;
}

// ─── Hazard Provider ──────────────────────────────────────────────────────────
export interface HazardProvider {
  getHazardIndicators(
    coords: Coordinates,
    elevation: number | null,
    climate: ClimateProfile | null
  ): Promise<HazardIndicators>;
}
