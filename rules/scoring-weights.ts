// Scoring weights configuration - the single source of truth for all weights.
// Weights within a category must sum to 1.0.
// Category weights must sum to 1.0.

export const CATEGORY_WEIGHTS = {
  naturalHazards: 0.30,
  logistics: 0.20,
  climate: 0.20,
  infrastructure: 0.15,
  operationalContext: 0.15,
} as const;

// Factor weights within "Natural Hazards" category (must sum to 1.0)
export const NATURAL_HAZARD_FACTOR_WEIGHTS = {
  seismic: 0.25,
  flood: 0.25,
  wind: 0.15,
  heat: 0.15,
  wildfire: 0.10,
  elevation: 0.10,
} as const;

// Factor weights within "Logistics" category (must sum to 1.0)
export const LOGISTICS_FACTOR_WEIGHTS = {
  airportProximity: 0.20,    // too close is bad
  highwayAccess: 0.20,       // closer is better
  hospital: 0.20,            // closer is better
  fireStation: 0.20,         // closer is better
  police: 0.10,              // closer is better
  fuel: 0.10,                // closer is better
} as const;

// Factor weights within "Climate" category (must sum to 1.0)
export const CLIMATE_FACTOR_WEIGHTS = {
  annualAvgTemp: 0.30,
  hotDays: 0.30,
  coldDays: 0.15,
  precipitation: 0.25,
} as const;

// Factor weights within "Infrastructure" category (must sum to 1.0)
// NOTE: These are proxy estimates only
export const INFRASTRUCTURE_FACTOR_WEIGHTS = {
  gridProximityProxy: 0.40,    // from logistics / road proximity
  telecomProxyScore: 0.35,     // urban density proxy
  waterAvailabilityProxy: 0.25,
} as const;

// Factor weights within "Operational Context" category (must sum to 1.0)
export const OPERATIONAL_CONTEXT_FACTOR_WEIGHTS = {
  urbanDensityProxy: 0.50,   // urban = higher cost, rural = logistics challenge
  coastalContext: 0.30,      // salt air, humidity
  terrainComplexity: 0.20,
} as const;
