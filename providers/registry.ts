// Provider Registry - selects mock or real providers based on environment
import type {
  GeocodingProvider,
  ElevationProvider,
  ClimateProvider,
  POIProvider,
  HazardProvider,
} from "@/providers/interfaces";
import {
  MockGeocodingProvider,
  MockElevationProvider,
  MockClimateProvider,
  MockPOIProvider,
  MockHazardProvider,
} from "@/providers/mock";
import {
  NominatimGeocodingProvider,
  OpenElevationProvider,
  OpenMeteoClimateProvider,
  OverpassPOIProvider,
  ProxyHazardProvider,
} from "@/providers/real";

function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_MODE === "true";
}

export function getGeocodingProvider(): GeocodingProvider {
  return isMockMode() ? new MockGeocodingProvider() : new NominatimGeocodingProvider();
}

export function getElevationProvider(): ElevationProvider {
  return isMockMode() ? new MockElevationProvider() : new OpenElevationProvider();
}

export function getClimateProvider(): ClimateProvider {
  return isMockMode() ? new MockClimateProvider() : new OpenMeteoClimateProvider();
}

export function getPOIProvider(): POIProvider {
  return isMockMode() ? new MockPOIProvider() : new OverpassPOIProvider();
}

export function getHazardProvider(): HazardProvider {
  return isMockMode() ? new MockHazardProvider() : new ProxyHazardProvider();
}
