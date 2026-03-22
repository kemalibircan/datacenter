// Scoring Service - applies weighted multi-factor model to raw provider data
import type {
  SiteAnalysisResult,
  LocationInfo,
  ClimateProfile,
  LogisticsData,
  HazardIndicators,
  CompositeScore,
  CategoryScore,
  FactorScore,
  SuitabilityLabel,
  ConfidenceLevel,
} from "@/types/domain";
import {
  CATEGORY_WEIGHTS,
  NATURAL_HAZARD_FACTOR_WEIGHTS,
  LOGISTICS_FACTOR_WEIGHTS,
  CLIMATE_FACTOR_WEIGHTS,
} from "@/rules/scoring-weights";
import {
  AIRPORT_DISTANCE_THRESHOLDS,
  HOSPITAL_DISTANCE_THRESHOLDS,
  FIRE_STATION_DISTANCE_THRESHOLDS,
  POLICE_DISTANCE_THRESHOLDS,
  FUEL_DISTANCE_THRESHOLDS,
  HIGHWAY_DISTANCE_THRESHOLDS,
  AVG_TEMP_THRESHOLDS,
  HOT_DAYS_THRESHOLDS,
  ELEVATION_THRESHOLDS,
  WATER_PROXIMITY_THRESHOLDS,
  COMPOSITE_SCORE_LABELS,
  type ThresholdBreakpoint,
} from "@/rules/thresholds";

// ─── Threshold Scoring Helper ─────────────────────────────────────────────────
function scoreFromThresholds(value: number, thresholds: ThresholdBreakpoint[]): number {
  for (const t of thresholds) {
    if (t.maxValue === null || value <= t.maxValue) return t.score;
  }
  return thresholds[thresholds.length - 1].score;
}

// ─── Hazard Level to Score ─────────────────────────────────────────────────────
const HAZARD_LEVEL_SCORES: Record<string, number> = {
  "very-low": 100,
  "low": 80,
  "moderate": 55,
  "high": 25,
  "very-high": 0,
  "unknown": 50,
};

function hazardScore(level: string): number {
  return HAZARD_LEVEL_SCORES[level] ?? 50;
}

// ─── Natural Hazards Category ─────────────────────────────────────────────────
function scoreNaturalHazards(
  hazards: HazardIndicators | null,
  location: LocationInfo
): CategoryScore {
  const elev = location.elevation ?? 50;

  const seismicScore = hazardScore(hazards?.seismicRiskProxy ?? "unknown");
  const floodScore = hazards?.nearWaterBodyKm !== null && hazards?.nearWaterBodyKm !== undefined
    ? scoreFromThresholds(hazards.nearWaterBodyKm, WATER_PROXIMITY_THRESHOLDS) * 0.5 +
      hazardScore(hazards.floodRiskProxy) * 0.5
    : hazardScore(hazards?.floodRiskProxy ?? "unknown");
  const windScore = hazardScore(hazards?.windExposureProxy ?? "unknown");
  const heatScore = hazardScore(hazards?.heatStressProxy ?? "unknown");
  const wildfireScore = hazardScore(hazards?.wildfireProxy ?? "unknown");
  const elevScore = scoreFromThresholds(elev, ELEVATION_THRESHOLDS);

  const factors: FactorScore[] = [
    { id: "seismic", label: "Seismic Risk", value: 0, score: seismicScore, weight: NATURAL_HAZARD_FACTOR_WEIGHTS.seismic, confidence: "low", dataSource: "Proxy Estimate" },
    { id: "flood", label: "Flood Risk", value: elev, score: floodScore, weight: NATURAL_HAZARD_FACTOR_WEIGHTS.flood, confidence: "low", dataSource: "Proxy Estimate" },
    { id: "wind", label: "Wind / Storm Exposure", value: 0, score: windScore, weight: NATURAL_HAZARD_FACTOR_WEIGHTS.wind, confidence: "low", dataSource: "Proxy Estimate" },
    { id: "heat", label: "Heat Stress", value: 0, score: heatScore, weight: NATURAL_HAZARD_FACTOR_WEIGHTS.heat, confidence: "medium", dataSource: "Proxy Estimate" },
    { id: "wildfire", label: "Wildfire Risk", value: 0, score: wildfireScore, weight: NATURAL_HAZARD_FACTOR_WEIGHTS.wildfire, confidence: "low", dataSource: "Proxy Estimate" },
    { id: "elevation", label: "Elevation / Terrain", value: elev, score: elevScore, weight: NATURAL_HAZARD_FACTOR_WEIGHTS.elevation, confidence: "high", dataSource: "API Data" },
  ];

  const score = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  return { id: "natural-hazards", label: "Natural Hazards", score: Math.round(score), weight: CATEGORY_WEIGHTS.naturalHazards, factors };
}

// ─── Logistics Category ────────────────────────────────────────────────────────
function scoreLogistics(logistics: LogisticsData | null): CategoryScore {
  const l = logistics;

  const airportDist = l?.nearestAirportKm.distanceKm ?? 15;
  const hospitalDist = l?.nearestHospitalKm.distanceKm ?? 10;
  const fireDist = l?.nearestFireStationKm.distanceKm ?? 5;
  const policeDist = l?.nearestPoliceKm.distanceKm ?? 5;
  const fuelDist = l?.nearestFuelKm.distanceKm ?? 5;
  const highwayDist = l?.nearestHighwayKm.distanceKm ?? 5;

  const factors: FactorScore[] = [
    { id: "airport", label: "Airport Proximity", value: airportDist, score: scoreFromThresholds(airportDist, AIRPORT_DISTANCE_THRESHOLDS), weight: LOGISTICS_FACTOR_WEIGHTS.airportProximity, confidence: "high", dataSource: "API Data" },
    { id: "highway", label: "Highway / Major Road Access", value: highwayDist, score: scoreFromThresholds(highwayDist, HIGHWAY_DISTANCE_THRESHOLDS), weight: LOGISTICS_FACTOR_WEIGHTS.highwayAccess, confidence: "high", dataSource: "API Data" },
    { id: "hospital", label: "Hospital Proximity", value: hospitalDist, score: scoreFromThresholds(hospitalDist, HOSPITAL_DISTANCE_THRESHOLDS), weight: LOGISTICS_FACTOR_WEIGHTS.hospital, confidence: "high", dataSource: "API Data" },
    { id: "fire-station", label: "Fire Station Proximity", value: fireDist, score: scoreFromThresholds(fireDist, FIRE_STATION_DISTANCE_THRESHOLDS), weight: LOGISTICS_FACTOR_WEIGHTS.fireStation, confidence: "high", dataSource: "API Data" },
    { id: "police", label: "Police Proximity", value: policeDist, score: scoreFromThresholds(policeDist, POLICE_DISTANCE_THRESHOLDS), weight: LOGISTICS_FACTOR_WEIGHTS.police, confidence: "high", dataSource: "API Data" },
    { id: "fuel", label: "Fuel Supply Access", value: fuelDist, score: scoreFromThresholds(fuelDist, FUEL_DISTANCE_THRESHOLDS), weight: LOGISTICS_FACTOR_WEIGHTS.fuel, confidence: "high", dataSource: "API Data" },
  ];

  const score = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  return { id: "logistics", label: "Logistics & Accessibility", score: Math.round(score), weight: CATEGORY_WEIGHTS.logistics, factors };
}

// ─── Climate Category ─────────────────────────────────────────────────────────
function scoreClimate(climate: ClimateProfile | null): CategoryScore {
  const avgTemp = climate?.annualAvgTempC ?? 15;
  const hotDays = climate?.hotDaysPerYear ?? 20;
  const coldDays = climate?.coldDaysPerYear ?? 10;
  const precip = climate?.annualPrecipMm ?? 600;

  const avgTempScore = scoreFromThresholds(avgTemp, AVG_TEMP_THRESHOLDS);
  const hotDaysScore = scoreFromThresholds(hotDays, HOT_DAYS_THRESHOLDS);
  // Cold days: more is worse (affects mechanical systems)
  const coldDaysScore = coldDays === 0 ? 100 : coldDays < 20 ? 85 : coldDays < 60 ? 65 : 45;
  // Precipitation: extreme precip is negative (flooding, roof loads), very low also a concern
  const precipScore = precip < 150 ? 75 : precip < 400 ? 90 : precip < 1200 ? 100 : precip < 2000 ? 75 : 55;

  const factors: FactorScore[] = [
    { id: "avg-temp", label: "Annual Average Temperature", value: avgTemp, score: avgTempScore, weight: CLIMATE_FACTOR_WEIGHTS.annualAvgTemp, confidence: climate ? "high" : "low", dataSource: climate ? "API Data" : "Proxy Estimate" },
    { id: "hot-days", label: "Extreme Heat Days / Year", value: hotDays, score: hotDaysScore, weight: CLIMATE_FACTOR_WEIGHTS.hotDays, confidence: climate ? "high" : "low", dataSource: climate ? "API Data" : "Proxy Estimate" },
    { id: "cold-days", label: "Extreme Cold Days / Year", value: coldDays, score: coldDaysScore, weight: CLIMATE_FACTOR_WEIGHTS.coldDays, confidence: climate ? "high" : "low", dataSource: climate ? "API Data" : "Proxy Estimate" },
    { id: "precipitation", label: "Annual Precipitation", value: precip, score: precipScore, weight: CLIMATE_FACTOR_WEIGHTS.precipitation, confidence: climate ? "high" : "low", dataSource: climate ? "API Data" : "Proxy Estimate" },
  ];

  const score = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  return { id: "climate", label: "Climate Suitability", score: Math.round(score), weight: CATEGORY_WEIGHTS.climate, factors };
}

// ─── Infrastructure (Proxy) Category ─────────────────────────────────────────
function scoreInfrastructure(
  logistics: LogisticsData | null,
  climate: ClimateProfile | null
): CategoryScore {
  // All proxy estimates - use highway as grid proxy, climate zone as context
  const highwayDist = logistics?.nearestHighwayKm.distanceKm ?? 10;
  const gridProxyScore = Math.min(100, Math.max(0, 100 - highwayDist * 3));
  const telecomProxy = highwayDist < 5 ? 70 : highwayDist < 15 ? 50 : 30; // rough proxy
  const waterProxy = (climate?.annualPrecipMm ?? 600) > 400 ? 80 : 55;

  const factors: FactorScore[] = [
    { id: "grid-proxy", label: "Grid / Power Infrastructure (Proxy)", value: highwayDist, score: Math.round(gridProxyScore), weight: 0.40, confidence: "low", dataSource: "Proxy Estimate" },
    { id: "telecom-proxy", label: "Telecom / Fiber Readiness (Proxy)", value: 0, score: telecomProxy, weight: 0.35, confidence: "low", dataSource: "Proxy Estimate" },
    { id: "water-proxy", label: "Water Availability (Proxy)", value: 0, score: waterProxy, weight: 0.25, confidence: "low", dataSource: "Proxy Estimate" },
  ];

  const score = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  return { id: "infrastructure", label: "Infrastructure Proximity (Proxy)", score: Math.round(score), weight: CATEGORY_WEIGHTS.infrastructure, factors };
}

// ─── Operational Context (Proxy) Category ────────────────────────────────────
function scoreOperationalContext(
  hazards: HazardIndicators | null,
  logistics: LogisticsData | null
): CategoryScore {
  const coastal = hazards?.coastalProximityKm ?? 100;
  const coastalScore = coastal < 2 ? 55 : coastal < 10 ? 75 : 90; // salt air concern very close
  const urbanProxy = (logistics?.nearestFireStationKm.distanceKm ?? 10) < 5 ? 80 : 65;
  const terrainScore = 75; // default without detailed terrain data

  const factors: FactorScore[] = [
    { id: "urban-density", label: "Urban Density Context (Proxy)", value: 0, score: urbanProxy, weight: 0.50, confidence: "low", dataSource: "Proxy Estimate" },
    { id: "coastal-context", label: "Coastal Salt Air Exposure (Proxy)", value: coastal, score: coastalScore, weight: 0.30, confidence: "low", dataSource: "Proxy Estimate" },
    { id: "terrain", label: "Terrain Complexity (Proxy)", value: 0, score: terrainScore, weight: 0.20, confidence: "low", dataSource: "Proxy Estimate" },
  ];

  const score = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  return { id: "operational", label: "Operational Context (Proxy)", score: Math.round(score), weight: CATEGORY_WEIGHTS.operationalContext, factors };
}

// ─── Composite Score ─────────────────────────────────────────────────────────
export function computeCompositeScore(categories: CategoryScore[]): CompositeScore {
  const total = categories.reduce((sum, c) => sum + c.score * c.weight, 0);
  const rounded = Math.round(total);

  const labelEntry = COMPOSITE_SCORE_LABELS.find(l => rounded >= l.min && rounded <= l.max);
  const label = (labelEntry?.label.toLowerCase() ?? "moderate") as SuitabilityLabel;

  // Composite confidence = based on how many proxy factors there are
  const proxyFactorCount = categories.flatMap(c => c.factors).filter(f => f.dataSource === "Proxy Estimate").length;
  const totalFactors = categories.flatMap(c => c.factors).length;
  const proxyRatio = proxyFactorCount / totalFactors;

  const confidence: ConfidenceLevel = proxyRatio > 0.6 ? "low" : proxyRatio > 0.3 ? "medium" : "high";

  return { total: rounded, label, categories, confidence };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────
export function runScoringEngine(
  location: LocationInfo,
  climate: ClimateProfile | null,
  logistics: LogisticsData | null,
  hazards: HazardIndicators | null
): CompositeScore {
  const categories = [
    scoreNaturalHazards(hazards, location),
    scoreLogistics(logistics),
    scoreClimate(climate),
    scoreInfrastructure(logistics, climate),
    scoreOperationalContext(hazards, logistics),
  ];

  return computeCompositeScore(categories);
}
