// Analysis Service - orchestrates all providers and scoring to produce SiteAnalysisResult
import type { Coordinates, SiteAnalysisResult } from "@/types/domain";
import {
  getGeocodingProvider,
  getElevationProvider,
  getClimateProvider,
  getPOIProvider,
  getHazardProvider,
} from "@/providers/registry";
import { runScoringEngine } from "@/services/scoring.service";
import { generateExplanations } from "@/services/explanation.service";

const ANALYSIS_VERSION = "1.0.0";

export async function analyzeSite(coords: Coordinates): Promise<SiteAnalysisResult> {
  const mockMode = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

  const [geocodingProvider, elevationProvider, climateProvider, poiProvider, hazardProvider] = [
    getGeocodingProvider(),
    getElevationProvider(),
    getClimateProvider(),
    getPOIProvider(),
    getHazardProvider(),
  ];

  // Fetch all data concurrently - failures are graceful
  const [locationResult, elevationResult, climateResult, logisticsResult] = await Promise.allSettled([
    geocodingProvider.reverseGeocode(coords),
    elevationProvider.getElevation(coords),
    climateProvider.getClimateProfile(coords),
    poiProvider.getLogisticsData(coords),
  ]);

  const location = locationResult.status === "fulfilled" ? locationResult.value : {
    coordinates: coords,
    elevation: null,
    address: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
    city: null,
    country: null,
    region: null,
  };

  const elevationM = elevationResult.status === "fulfilled" ? elevationResult.value.elevationM : null;
  if (elevationM !== null) location.elevation = elevationM;

  const climate = climateResult.status === "fulfilled" ? climateResult.value : null;
  const logistics = logisticsResult.status === "fulfilled" ? logisticsResult.value : null;

  // Hazards depend on elevation + climate
  const hazardResult = await hazardProvider.getHazardIndicators(coords, elevationM, climate).catch(() => null);

  // Run scoring engine
  const compositeScore = runScoringEngine(location, climate, logistics, hazardResult);

  // Generate explanation cards
  const explanations = generateExplanations(location, climate, logistics, hazardResult, compositeScore);

  return {
    location,
    climate,
    logistics,
    hazards: hazardResult,
    compositeScore,
    explanations,
    mockMode,
    analysisVersion: ANALYSIS_VERSION,
  };
}
