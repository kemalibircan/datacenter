// Explanation Service - generates human-readable explanation cards for all metrics
import type {
  ExplanationCard,
  LocationInfo,
  ClimateProfile,
  LogisticsData,
  HazardIndicators,
  CompositeScore,
  ThresholdRow,
} from "@/types/domain";
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
  type ThresholdBreakpoint,
} from "@/rules/thresholds";

function thresholdsToRows(
  thresholds: ThresholdBreakpoint[],
  unit: string = ""
): ThresholdRow[] {
  return thresholds.map((t) => ({
    range: t.maxValue !== null ? `≤ ${t.maxValue}${unit}` : `> ${thresholds[thresholds.length - 2]?.maxValue ?? "..."}${unit}`,
    interpretation: t.label,
    score: `${t.score}/100`,
  }));
}

export function generateExplanations(
  location: LocationInfo,
  climate: ClimateProfile | null,
  logistics: LogisticsData | null,
  hazards: HazardIndicators | null,
  compositeScore: CompositeScore
): ExplanationCard[] {
  const cards: ExplanationCard[] = [];

  // Elevation
  if (location.elevation !== null) {
    const factorScore = compositeScore.categories
      .find(c => c.id === "natural-hazards")?.factors.find(f => f.id === "elevation");
    cards.push({
      metricId: "elevation",
      title: "Site Elevation",
      valueDisplay: `${location.elevation.toFixed(0)} m above sea level`,
      score: factorScore?.score ?? 75,
      category: "Natural Hazards",
      importance:
        "Elevation is a key flood risk indicator. Sites at very low elevation (especially below 10m) are more exposed to surface flooding, storm surge, and drainage issues. Very high elevation can introduce altitude-related MEP design complexity and logistics challenges.",
      interpretation: interpretElevation(location.elevation),
      confidenceLevel: "high",
      dataSource: "API Data",
      limitations: [
        "Elevation data uses 30m resolution SRTM data — local micro-elevation variations are not captured.",
        "Elevation alone does not determine flood risk; local drainage, groundwater, and flood zone maps are needed.",
      ],
      thresholds: thresholdsToRows(ELEVATION_THRESHOLDS, " m"),
      mitigationNote:
        location.elevation < 20
          ? "Consider site-specific flood study and drainage assessment. Evaluate raised floor level/slab strategy and flood barriers."
          : undefined,
    });
  }

  // Airport
  if (logistics?.nearestAirportKm) {
    const factorScore = compositeScore.categories
      .find(c => c.id === "logistics")?.factors.find(f => f.id === "airport");
    const dist = logistics.nearestAirportKm.distanceKm;
    cards.push({
      metricId: "airport",
      title: "Airport Proximity",
      valueDisplay: dist < 500 ? `${dist.toFixed(1)} km — ${logistics.nearestAirportKm.name ?? "Airport"}` : "Not found within range",
      score: factorScore?.score ?? 70,
      category: "Logistics & Accessibility",
      importance:
        "Proximity to airports affects data center siting in multiple ways: (1) Noise and vibration may impact sensitive equipment. (2) Aviation height restrictions and Obstacle Limitation Surfaces (OLS) may limit building height and crane operations during construction. (3) Avigation easements may restrict land use near runways.",
      interpretation: interpretAirportDist(dist),
      confidenceLevel: "high",
      dataSource: "API Data",
      limitations: [
        "OSM airport data may be incomplete in some regions.",
        "Actual height restrictions depend on the specific airport's OLS maps — a manual review is required.",
      ],
      thresholds: thresholdsToRows(AIRPORT_DISTANCE_THRESHOLDS, " km"),
      mitigationNote:
        dist < 10
          ? "Request the airport's Obstacle Limitation Surface (OLS) map and verify height restrictions for the specific plot before proceeding."
          : undefined,
    });
  }

  // Hospital
  if (logistics?.nearestHospitalKm) {
    const factorScore = compositeScore.categories
      .find(c => c.id === "logistics")?.factors.find(f => f.id === "hospital");
    cards.push({
      metricId: "hospital",
      title: "Hospital / Medical Facility",
      valueDisplay: `${logistics.nearestHospitalKm.distanceKm.toFixed(1)} km — ${logistics.nearestHospitalKm.name ?? "Hospital"}`,
      score: factorScore?.score ?? 70,
      category: "Logistics & Accessibility",
      importance:
        "Proximity to medical facilities matters for staff safety and emergency response. In a critical incident involving personnel, emergency response time can be life-critical. It is also a consideration for staff wellbeing and site attractiveness for employees.",
      interpretation: interpretDistance(logistics.nearestHospitalKm.distanceKm, "hospital", HOSPITAL_DISTANCE_THRESHOLDS),
      confidenceLevel: "high",
      dataSource: "API Data",
      limitations: ["OSM hospital data may not distinguish between full hospitals and smaller clinics."],
      thresholds: thresholdsToRows(HOSPITAL_DISTANCE_THRESHOLDS, " km"),
    });
  }

  // Fire Station
  if (logistics?.nearestFireStationKm) {
    const factorScore = compositeScore.categories
      .find(c => c.id === "logistics")?.factors.find(f => f.id === "fire-station");
    cards.push({
      metricId: "fire-station",
      title: "Fire Station",
      valueDisplay: `${logistics.nearestFireStationKm.distanceKm.toFixed(1)} km — ${logistics.nearestFireStationKm.name ?? "Fire Station"}`,
      score: factorScore?.score ?? 70,
      category: "Logistics & Accessibility",
      importance:
        "Fire response time is critical for a data center. Data centers house high-value electrical and IT equipment. A delayed fire response can result in complete facility loss. Insurance providers and Tier/EN 50600 frameworks consider fire protection as a key criterion.",
      interpretation: interpretDistance(logistics.nearestFireStationKm.distanceKm, "fire station", FIRE_STATION_DISTANCE_THRESHOLDS),
      confidenceLevel: "high",
      dataSource: "API Data",
      limitations: ["OSM data may not include all volunteer or industrial fire stations."],
      thresholds: thresholdsToRows(FIRE_STATION_DISTANCE_THRESHOLDS, " km"),
    });
  }

  // Highway
  if (logistics?.nearestHighwayKm) {
    const factorScore = compositeScore.categories
      .find(c => c.id === "logistics")?.factors.find(f => f.id === "highway");
    cards.push({
      metricId: "highway",
      title: "Major Road / Highway Access",
      valueDisplay: `${logistics.nearestHighwayKm.distanceKm.toFixed(1)} km — ${logistics.nearestHighwayKm.name ?? "Major Road"}`,
      score: factorScore?.score ?? 80,
      category: "Logistics & Accessibility",
      importance:
        "Major road access is critical for: (1) IT equipment delivery (large UPS units, generators, server racks require truck access). (2) Regular maintenance logistics. (3) Fuel delivery for backup generators. (4) Staff commuting. (5) Emergency vehicle access.",
      interpretation: interpretDistance(logistics.nearestHighwayKm.distanceKm, "major road", HIGHWAY_DISTANCE_THRESHOLDS),
      confidenceLevel: "high",
      dataSource: "API Data",
      limitations: ["Road quality and weight limits (for heavy equipment trucks) cannot be confirmed from map data."],
      thresholds: thresholdsToRows(HIGHWAY_DISTANCE_THRESHOLDS, " km"),
    });
  }

  // Climate Temperature
  if (climate) {
    const factorScore = compositeScore.categories
      .find(c => c.id === "climate")?.factors.find(f => f.id === "avg-temp");
    cards.push({
      metricId: "avg-temp",
      title: "Annual Average Temperature",
      valueDisplay: `${climate.annualAvgTempC.toFixed(1)}°C annual average`,
      score: factorScore?.score ?? 75,
      category: "Climate Suitability",
      importance:
        "Climate temperature directly impacts data center cooling strategy, efficiency, and OPEX. Cooler climates allow more economizer hours (free cooling), reducing energy consumption. Hot climates require more mechanical cooling infrastructure and increase OPEX.",
      interpretation: `Annual average of ${climate.annualAvgTempC.toFixed(1)}°C with peaks to ${climate.annualMaxTempC.toFixed(0)}°C. ${climate.hotDaysPerYear} extreme heat days (>35°C) per year estimated.`,
      confidenceLevel: "high",
      dataSource: "API Data",
      limitations: [
        "Based on 10-year historical averages from Open-Meteo.",
        "Future climate trends may shift temperature profiles.",
        "Microclimate effects (urban heat island, local topography) are not captured.",
      ],
      thresholds: thresholdsToRows(AVG_TEMP_THRESHOLDS, "°C"),
      assumptions: ["Temperature data uses ERA5 reanalysis data from 2014–2023."],
    });
  }

  // Seismic
  if (hazards) {
    const factorScore = compositeScore.categories
      .find(c => c.id === "natural-hazards")?.factors.find(f => f.id === "seismic");
    cards.push({
      metricId: "seismic",
      title: "Seismic Risk",
      valueDisplay: `${hazards.seismicRiskProxy.replace("-", " ").toUpperCase()} (Proxy Estimate)`,
      score: factorScore?.score ?? 70,
      category: "Natural Hazards",
      importance:
        "Seismic activity can cause structural damage, equipment rack topple, floor slab cracks, and utility line disruption. High seismic risk zones require seismically-rated structural design, equipment restraint systems, and potentially more expensive foundation solutions.",
      interpretation: `Rough seismic risk proxy: ${hazards.seismicRiskProxy}. This estimate is based on approximate geographic zone heuristics only, NOT a formal seismic hazard assessment.`,
      confidenceLevel: "low",
      dataSource: "Proxy Estimate",
      limitations: [
        "No real seismic hazard API is used. This is a geographic zone approximation only.",
        "Actual seismic hazard requires USGS PGA maps or equivalent national hazard maps.",
        "Microzonation, soil amplification, and liquefaction potential are not assessed.",
      ],
      mitigationNote:
        hazards.seismicRiskProxy === "high" || hazards.seismicRiskProxy === "very-high"
          ? "Commission a site-specific seismic hazard assessment. Design to applicable seismic standards (ASCE 7, Eurocode 8, or local equivalent)."
          : undefined,
      thresholds: [
        { range: "Very Low", interpretation: "Low seismic zone, minimal concern", score: "100" },
        { range: "Low", interpretation: "Minor seismic activity, standard design", score: "80" },
        { range: "Moderate", interpretation: "Elevated concern — seismic design required", score: "55" },
        { range: "High", interpretation: "Significant seismic zone — specialist required", score: "25" },
        { range: "Very High", interpretation: "Ring of Fire / major fault zone — high design cost", score: "0" },
      ],
    });
  }

  return cards;
}

// ─── Interpretation Helpers ──────────────────────────────────────────────────
function interpretElevation(elev: number): string {
  if (elev < 0) return "Site is below sea level — very high flood risk indicator. Requires serious evaluation.";
  if (elev < 10) return "Very low elevation — elevated flood risk. Local drainage and flood study strongly recommended.";
  if (elev < 50) return "Low elevation — moderate flood risk proxy. Review local flood zone maps.";
  if (elev < 500) return "Good elevation range — generally favorable for flood risk.";
  if (elev < 1500) return "Elevated terrain — good from flood perspective; verify construction logistics.";
  if (elev < 2500) return "High altitude site — some MEP design complexity; air density affects cooling and generator sizing.";
  return "Very high altitude — significant design impact on cooling, combustion, and logistics.";
}

function interpretAirportDist(distKm: number): string {
  if (distKm < 2) return "Site is within 2 km of an airport. Very high risk of height restrictions, noise, and OLS constraints.";
  if (distKm < 5) return "Site is close to an airport. Height restrictions likely. Detailed OLS review required.";
  if (distKm < 10) return "Moderate airport proximity. Height restrictions may apply. Review OLS maps.";
  return "Airport is at a comfortable distance. Limited height restriction risk, but verify for your specific location.";
}

function interpretDistance(
  distKm: number,
  facility: string,
  thresholds: ThresholdBreakpoint[]
): string {
  const threshold = thresholds.find(t => t.maxValue === null || distKm <= t.maxValue);
  return threshold
    ? `${facility} is ${distKm.toFixed(1)} km away — ${threshold.label}`
    : `${facility} distance: ${distKm.toFixed(1)} km`;
}
