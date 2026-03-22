// Thresholds configuration for all scoring factors.
// Each threshold defines score breakpoints for a given metric.
// Units and scale are documented per threshold.

export interface ThresholdBreakpoint {
  maxValue: number | null; // null = infinity (upper bound)
  score: number;           // 0-100
  label: string;
}

// Airport distance (km) - too close is bad
export const AIRPORT_DISTANCE_THRESHOLDS: ThresholdBreakpoint[] = [
  { maxValue: 2,    score: 0,  label: "Very High Risk — within 2 km" },
  { maxValue: 5,    score: 30, label: "High Caution — 2–5 km" },
  { maxValue: 10,   score: 60, label: "Moderate — 5–10 km" },
  { maxValue: 20,   score: 85, label: "Good — 10–20 km" },
  { maxValue: null, score: 100, label: "Excellent — > 20 km" },
];

// Hospital distance (km) - closer is better for emergency response
export const HOSPITAL_DISTANCE_THRESHOLDS: ThresholdBreakpoint[] = [
  { maxValue: 2,    score: 100, label: "Excellent — within 2 km" },
  { maxValue: 5,    score: 90,  label: "Very Good — 2–5 km" },
  { maxValue: 10,   score: 75,  label: "Good — 5–10 km" },
  { maxValue: 20,   score: 55,  label: "Moderate — 10–20 km" },
  { maxValue: 40,   score: 35,  label: "Limited — 20–40 km" },
  { maxValue: null, score: 15,  label: "Remote — > 40 km" },
];

// Fire station distance (km)
export const FIRE_STATION_DISTANCE_THRESHOLDS: ThresholdBreakpoint[] = [
  { maxValue: 2,    score: 100, label: "Excellent — within 2 km" },
  { maxValue: 5,    score: 90,  label: "Very Good — 2–5 km" },
  { maxValue: 10,   score: 70,  label: "Good — 5–10 km" },
  { maxValue: 20,   score: 45,  label: "Moderate — 10–20 km" },
  { maxValue: null, score: 20,  label: "Poor — > 20 km" },
];

// Police distance (km)
export const POLICE_DISTANCE_THRESHOLDS: ThresholdBreakpoint[] = [
  { maxValue: 2,    score: 100, label: "Excellent — within 2 km" },
  { maxValue: 5,    score: 85,  label: "Very Good — 2–5 km" },
  { maxValue: 10,   score: 65,  label: "Good — 5–10 km" },
  { maxValue: 20,   score: 40,  label: "Moderate — 10–20 km" },
  { maxValue: null, score: 20,  label: "Poor — > 20 km" },
];

// Fuel distance (km) - backup generator fuel supply
export const FUEL_DISTANCE_THRESHOLDS: ThresholdBreakpoint[] = [
  { maxValue: 2,    score: 100, label: "Excellent — within 2 km" },
  { maxValue: 5,    score: 90,  label: "Very Good — 2–5 km" },
  { maxValue: 15,   score: 70,  label: "Good — 5–15 km" },
  { maxValue: 30,   score: 50,  label: "Moderate — 15–30 km" },
  { maxValue: null, score: 25,  label: "Poor — > 30 km" },
];

// Highway/major road distance (km) - closer is better for logistics
export const HIGHWAY_DISTANCE_THRESHOLDS: ThresholdBreakpoint[] = [
  { maxValue: 1,    score: 100, label: "Excellent — within 1 km" },
  { maxValue: 3,    score: 90,  label: "Very Good — 1–3 km" },
  { maxValue: 10,   score: 70,  label: "Good — 3–10 km" },
  { maxValue: 25,   score: 45,  label: "Moderate — 10–25 km" },
  { maxValue: null, score: 20,  label: "Poor — > 25 km" },
];

// Annual average temperature (°C) - moderate temps best for cooling efficiency
export const AVG_TEMP_THRESHOLDS: ThresholdBreakpoint[] = [
  { maxValue: -10, score: 55,  label: "Very Cold — < -10°C avg" },
  { maxValue: 0,   score: 70,  label: "Cold — -10 to 0°C avg" },
  { maxValue: 10,  score: 90,  label: "Cool — 0–10°C avg" },
  { maxValue: 18,  score: 100, label: "Temperate — 10–18°C avg" },
  { maxValue: 25,  score: 80,  label: "Warm — 18–25°C avg" },
  { maxValue: 32,  score: 55,  label: "Hot — 25–32°C avg" },
  { maxValue: null, score: 30, label: "Very Hot — > 32°C avg" },
];

// Hot days per year (days > 35°C)
export const HOT_DAYS_THRESHOLDS: ThresholdBreakpoint[] = [
  { maxValue: 0,   score: 100, label: "None — no extreme heat days" },
  { maxValue: 10,  score: 90,  label: "Very few — < 10 days/year" },
  { maxValue: 30,  score: 75,  label: "Moderate — 10–30 days/year" },
  { maxValue: 60,  score: 55,  label: "Frequent — 30–60 days/year" },
  { maxValue: 90,  score: 35,  label: "High — 60–90 days/year" },
  { maxValue: null, score: 15, label: "Very High — > 90 days/year" },
];

// Elevation (m above sea level)
export const ELEVATION_THRESHOLDS: ThresholdBreakpoint[] = [
  { maxValue: -5,   score: 20,  label: "Below sea level — high flood risk" },
  { maxValue: 10,   score: 50,  label: "Very low — elevated flood risk" },
  { maxValue: 100,  score: 80,  label: "Low to moderate elevation" },
  { maxValue: 500,  score: 100, label: "Good elevation — low flood risk" },
  { maxValue: 1500, score: 85,  label: "Elevated — some logistics considerations" },
  { maxValue: 2500, score: 65,  label: "High altitude — MEP complexity" },
  { maxValue: null, score: 40,  label: "Very high altitude — significant design impact" },
];

// Water body proximity (km) - flood risk proxy
export const WATER_PROXIMITY_THRESHOLDS: ThresholdBreakpoint[] = [
  { maxValue: 0.1,  score: 0,  label: "Immediately adjacent — very high flood risk" },
  { maxValue: 0.5,  score: 20, label: "Very close — high flood risk" },
  { maxValue: 2,    score: 55, label: "Near — moderate flood risk" },
  { maxValue: 5,    score: 80, label: "Moderate distance" },
  { maxValue: null, score: 100, label: "Distant — low indicator of flood risk" },
];

// Composite score to suitability label mapping
export const COMPOSITE_SCORE_LABELS: Array<{min: number; max: number; label: string; color: string}> = [
  { min: 80, max: 100, label: "Excellent",    color: "emerald" },
  { min: 65, max: 79,  label: "Good",         color: "green" },
  { min: 50, max: 64,  label: "Moderate",     color: "yellow" },
  { min: 35, max: 49,  label: "Challenging",  color: "orange" },
  { min: 0,  max: 34,  label: "Poor",         color: "red" },
];
