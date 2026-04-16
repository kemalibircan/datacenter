// Tier criteria configuration for data center site selection
// Defines distance/area thresholds per Tier level (I–IV)

export type TierLevel = 1 | 2 | 3 | 4;

export interface TierCriteriaThresholds {
  minClosedAreaM2: number;
  minPowerPlantDistanceKm: number;   // Min distance FROM power plant (safety)
  minFlightPathDistanceKm: number;   // Min distance from flight paths
  maxFuelStationDistanceKm: number;  // Max distance TO fuel station
  maxHighwayDistanceKm: number;      // Max distance TO highway
  maxHospitalDistanceKm: number;     // Max distance TO hospital
  maxFireStationDistanceKm: number;  // Max distance TO fire station
  minWaterBodyDistanceKm: number;    // Min distance FROM water body (flood)
  minPowerCapacityMW: number;
}

export interface CriterionLayerConfig {
  id: string;
  labelKey: string;          // i18n key
  color: string;             // Map circle color
  fillColor: string;         // Map circle fill (with alpha)
  icon: string;              // Lucide icon name
  type: "min-distance" | "max-distance";  // min = must be farther, max = must be closer
  thresholdKey: keyof TierCriteriaThresholds;
}

// ─── Tier Thresholds ────────────────────────────────────────────────────────
export const TIER_CRITERIA: Record<TierLevel, TierCriteriaThresholds> = {
  1: {
    minClosedAreaM2: 500,
    minPowerPlantDistanceKm: 50,
    minFlightPathDistanceKm: 5,
    maxFuelStationDistanceKm: 30,
    maxHighwayDistanceKm: 25,
    maxHospitalDistanceKm: 40,
    maxFireStationDistanceKm: 20,
    minWaterBodyDistanceKm: 0.5,
    minPowerCapacityMW: 0.5,
  },
  2: {
    minClosedAreaM2: 1000,
    minPowerPlantDistanceKm: 30,
    minFlightPathDistanceKm: 5,
    maxFuelStationDistanceKm: 20,
    maxHighwayDistanceKm: 15,
    maxHospitalDistanceKm: 20,
    maxFireStationDistanceKm: 10,
    minWaterBodyDistanceKm: 1,
    minPowerCapacityMW: 2,
  },
  3: {
    minClosedAreaM2: 2500,
    minPowerPlantDistanceKm: 20,
    minFlightPathDistanceKm: 10,
    maxFuelStationDistanceKm: 15,
    maxHighwayDistanceKm: 10,
    maxHospitalDistanceKm: 15,
    maxFireStationDistanceKm: 5,
    minWaterBodyDistanceKm: 2,
    minPowerCapacityMW: 5,
  },
  4: {
    minClosedAreaM2: 5000,
    minPowerPlantDistanceKm: 10,
    minFlightPathDistanceKm: 15,
    maxFuelStationDistanceKm: 10,
    maxHighwayDistanceKm: 5,
    maxHospitalDistanceKm: 10,
    maxFireStationDistanceKm: 3,
    minWaterBodyDistanceKm: 3,
    minPowerCapacityMW: 20,
  },
};

// ─── Layer Configurations ───────────────────────────────────────────────────
export const CRITERION_LAYERS: CriterionLayerConfig[] = [
  {
    id: "powerPlant",
    labelKey: "layer_power_plant",
    color: "#ef4444",       // red
    fillColor: "rgba(239, 68, 68, 0.12)",
    icon: "Zap",
    type: "min-distance",
    thresholdKey: "minPowerPlantDistanceKm",
  },
  {
    id: "flightPath",
    labelKey: "layer_flight_path",
    color: "#f97316",       // orange
    fillColor: "rgba(249, 115, 22, 0.12)",
    icon: "Plane",
    type: "min-distance",
    thresholdKey: "minFlightPathDistanceKm",
  },
  {
    id: "fuelStation",
    labelKey: "layer_fuel_station",
    color: "#eab308",       // yellow
    fillColor: "rgba(234, 179, 8, 0.12)",
    icon: "Fuel",
    type: "max-distance",
    thresholdKey: "maxFuelStationDistanceKm",
  },
  {
    id: "highway",
    labelKey: "layer_highway",
    color: "#3b82f6",       // blue
    fillColor: "rgba(59, 130, 246, 0.12)",
    icon: "Route",
    type: "max-distance",
    thresholdKey: "maxHighwayDistanceKm",
  },
  {
    id: "hospital",
    labelKey: "layer_hospital",
    color: "#22c55e",       // green
    fillColor: "rgba(34, 197, 94, 0.12)",
    icon: "Cross",
    type: "max-distance",
    thresholdKey: "maxHospitalDistanceKm",
  },
  {
    id: "fireStation",
    labelKey: "layer_fire_station",
    color: "#06b6d4",       // cyan
    fillColor: "rgba(6, 182, 212, 0.12)",
    icon: "Flame",
    type: "max-distance",
    thresholdKey: "maxFireStationDistanceKm",
  },
  {
    id: "waterBody",
    labelKey: "layer_water_body",
    color: "#a855f7",       // purple
    fillColor: "rgba(168, 85, 247, 0.12)",
    icon: "Droplets",
    type: "min-distance",
    thresholdKey: "minWaterBodyDistanceKm",
  },
];

// ─── Tier Labels ────────────────────────────────────────────────────────────
export const TIER_LABELS: Record<TierLevel, { en: string; tr: string; description: { en: string; tr: string } }> = {
  1: {
    en: "Tier I — Basic",
    tr: "Tier I — Temel",
    description: { en: "Single path, no redundancy", tr: "Tek yol, yedekleme yok" },
  },
  2: {
    en: "Tier II — Redundant Components",
    tr: "Tier II — Yedekli Bileşenler",
    description: { en: "Redundant capacity components", tr: "Yedekli kapasite bileşenleri" },
  },
  3: {
    en: "Tier III — Concurrently Maintainable",
    tr: "Tier III — Eş Zamanlı Bakım",
    description: { en: "Dual power path, one active", tr: "Çift güç yolu, biri aktif" },
  },
  4: {
    en: "Tier IV — Fault Tolerant",
    tr: "Tier IV — Hata Toleranslı",
    description: { en: "Fully redundant, fault tolerant", tr: "Tam yedekli, hataya dayanıklı" },
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Create a GeoJSON circle polygon (approximation) from center + radius in km */
export function createGeoJSONCircle(
  center: [number, number], // [lng, lat]
  radiusKm: number,
  points = 64
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const distanceX = radiusKm / (111.32 * Math.cos((center[1] * Math.PI) / 180));
  const distanceY = radiusKm / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([center[0] + x, center[1] + y]);
  }
  coords.push(coords[0]); // close the ring

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
  };
}
