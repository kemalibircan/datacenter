// Core domain types for DC SiteLab

// ─── Coordinates ───────────────────────────────────────────────────────────
export interface Coordinates {
  lat: number;
  lng: number;
}

// ─── Confidence ─────────────────────────────────────────────────────────────
export type ConfidenceLevel = "high" | "medium" | "low" | "manual-only";
export type DataSourceLabel = "API Data" | "Proxy Estimate" | "Manual Assessment Required" | "Estimated";

// ─── Location ───────────────────────────────────────────────────────────────
export interface LocationInfo {
  coordinates: Coordinates;
  elevation: number | null;
  address: string | null;
  city: string | null;
  country: string | null;
  region: string | null;
}

// ─── Climate ────────────────────────────────────────────────────────────────
export interface MonthlyClimate {
  month: number; // 1-12
  avgTempC: number;
  maxTempC: number;
  minTempC: number;
  precipMm: number;
}

export interface ClimateProfile {
  annualAvgTempC: number;
  annualMaxTempC: number;
  annualMinTempC: number;
  hotDaysPerYear: number;      // days > 35°C
  coldDaysPerYear: number;     // days < -10°C
  annualPrecipMm: number;
  climateZone: ClimateZone;
  monthly: MonthlyClimate[];
}

export type ClimateZone =
  | "polar"
  | "subarctic"
  | "temperate-oceanic"
  | "temperate-continental"
  | "subtropical"
  | "tropical"
  | "arid"
  | "semi-arid"
  | "unknown";

// ─── POI Proximity ───────────────────────────────────────────────────────────
export interface POIDistance {
  name: string | null;
  distanceKm: number;
  found: boolean;
}

export interface LogisticsData {
  nearestAirportKm: POIDistance;
  nearestHospitalKm: POIDistance;
  nearestFireStationKm: POIDistance;
  nearestPoliceKm: POIDistance;
  nearestFuelKm: POIDistance;
  nearestHighwayKm: POIDistance;
}

// ─── Hazard ─────────────────────────────────────────────────────────────────
export interface HazardIndicators {
  seismicRiskProxy: HazardLevel;      // Proxy
  floodRiskProxy: HazardLevel;        // Proxy (elevation + water proximity)
  windExposureProxy: HazardLevel;     // Proxy (climate zone + coastal)
  heatStressProxy: HazardLevel;       // From climate data
  wildfireProxy: HazardLevel;         // Proxy (climate + vegetation zone)
  nearWaterBodyKm: number | null;     // OSM
  coastalProximityKm: number | null;  // OSM
}

export type HazardLevel = "very-low" | "low" | "moderate" | "high" | "very-high" | "unknown";

// ─── Scoring ─────────────────────────────────────────────────────────────────
export interface FactorScore {
  id: string;
  label: string;
  value: number;           // raw metric value
  score: number;           // 0-100
  weight: number;          // within category
  confidence: ConfidenceLevel;
  dataSource: DataSourceLabel;
}

export interface CategoryScore {
  id: string;
  label: string;
  score: number;           // 0-100 weighted average of factors
  weight: number;          // overall category weight
  factors: FactorScore[];
}

export interface CompositeScore {
  total: number;           // 0-100
  label: SuitabilityLabel;
  categories: CategoryScore[];
  confidence: ConfidenceLevel;
}

export type SuitabilityLabel =
  | "excellent"
  | "good"
  | "moderate"
  | "challenging"
  | "poor";

// ─── Explanation ─────────────────────────────────────────────────────────────
export interface ThresholdRow {
  range: string;
  interpretation: string;
  score: string;
}

export interface ExplanationCard {
  metricId: string;
  title: string;
  valueDisplay: string;
  score: number;
  category: string;
  importance: string;         // Why it matters for data centers
  interpretation: string;     // What this specific value means
  confidenceLevel: ConfidenceLevel;
  dataSource: DataSourceLabel;
  limitations: string[];
  mitigationNote?: string;
  thresholds: ThresholdRow[];
  assumptions?: string[];
}

// ─── Site Analysis Result ────────────────────────────────────────────────────
export interface SiteAnalysisResult {
  id?: string;
  createdAt?: Date;
  location: LocationInfo;
  climate: ClimateProfile | null;
  logistics: LogisticsData | null;
  hazards: HazardIndicators | null;
  compositeScore: CompositeScore;
  explanations: ExplanationCard[];
  mockMode: boolean;
  analysisVersion: string;
}

// ─── Planning Input ──────────────────────────────────────────────────────────
export type WorkloadType = "general-it" | "hpc" | "ai-gpu" | "mixed";
export type AvailabilityTier = "N" | "N+1" | "2N";
export type SustainabilityPriority = "low" | "medium" | "high";
export type WaterSensitivity = "low" | "medium" | "high";

export interface PlanningInput {
  whiteSpaceM2: number;
  workloadType: WorkloadType;
  rackDensityKw: number;
  availabilityTier: AvailabilityTier;
  growthYears: number;
  sustainabilityPriority: SustainabilityPriority;
  waterSensitivity: WaterSensitivity;
  manualOverrides?: ManualOverrides;
}

export interface ManualOverrides {
  gridQuality?: "poor" | "average" | "good" | "excellent";
  geotechnicalRisk?: "low" | "medium" | "high";
  fiberAvailability?: "none" | "limited" | "good" | "excellent";
  permittingComplexity?: "simple" | "moderate" | "complex";
  customNotes?: string;
}

// ─── Planning Output ─────────────────────────────────────────────────────────
export interface SpaceAllocation {
  category: string;
  minM2: number;
  maxM2: number;
  notes: string;
  percentOfGross: { min: number; max: number };
}

export interface CoolingRecommendation {
  strategy: CoolingStrategy;
  label: string;
  rationale: string;
  pros: string[];
  cons: string[];
  applicability: string;
  supplementalNote?: string;
}

export type CoolingStrategy =
  | "basic-air"
  | "crac-crah"
  | "chilled-water"
  | "hybrid"
  | "liquid-cooling"
  | "liquid-cooling-plus-supplemental";

export interface ElectricalConcept {
  estimatedITLoadKw: number;
  estimatedTotalLoadKw: {min: number; max: number};
  redundancyNote: string;
  utilityNote: string;
  conceptualConfig: string;
  warnings: string[];
}

export interface PlanningRecommendation {
  suitabilityVerdict: string;
  verdictLabel: "proceed" | "proceed-with-caution" | "significant-concerns" | "not-recommended";
  totalGrossEstimateM2: { min: number; max: number };
  grossToNetMultiplier: { min: number; max: number };
  spaceAllocations: SpaceAllocation[];
  coolingRecommendation: CoolingRecommendation;
  electricalConcept: ElectricalConcept;
  operationalWarnings: string[];
  mitigationRecommendations: string[];
  explanationCards: ExplanationCard[];
  confidenceLevel: ConfidenceLevel;
}

// ─── Comparison ───────────────────────────────────────────────────────────────
export interface ComparisonItem {
  analysis: SiteAnalysisResult;
  label: string;
}

// ─── Demo Scenario ────────────────────────────────────────────────────────────
export interface DemoScenario {
  id: string;
  slug: string;
  label: string;
  description: string;
  coordinates: Coordinates;
  highlights: string[];
  teachingPoints: string[];
}

// ─── Monitoring / Operations Types ───────────────────────────────────────────

export type MonitoringScenarioId =
  | "normal"
  | "ai-workload"
  | "cooling-stress"
  | "utility-instability"
  | "maintenance-backlog"
  | "traffic-spike";

export interface MonitoringScenario {
  id: MonitoringScenarioId;
  label: string;
  description: string;
  icon: string;
  educationalNote: string;
  effects: {
    pueMultiplier: number;        // e.g. 1.1 = 10% worse PUE
    coolingLoadPercent: number;   // 0–100
    itLoadPercent: number;        // 0–100
    networkUtilPercent: number;   // 0–100
    alarmCount: number;
    criticalAlarmCount: number;
    maintenanceRisk: "low" | "medium" | "high";
  };
}

export interface TelemetrySnapshot {
  timestamp: Date;
  // Power
  totalFacilityKw: number;
  itLoadKw: number;
  coolingKw: number;
  lightingAuxKw: number;
  upsEfficiencyPercent: number;
  pue: number;
  // Cooling
  supplyTempC: number;
  returnTempC: number;
  coolingUsePercent: number;
  hotspotRisk: "low" | "medium" | "high";
  // Network
  inboundGbps: number;
  outboundGbps: number;
  bandwidthUtilPercent: number;
  // Capacity
  rackOccupancyPercent: number;
  computeUtilPercent: number;
  storageUtilPercent: number;
  // Sustainability
  renewablePercent: number;
  co2KgPerHour: number;
  waterLitersPerHour: number;
  // Labels
  dataLabel: "Simulated" | "Demo" | "Estimated";
}

export interface AlarmEvent {
  id: string;
  timestamp: Date;
  severity: "critical" | "warning" | "info";
  category: "power" | "cooling" | "network" | "security" | "facility" | "it-equipment";
  title: string;
  message: string;
  acknowledged: boolean;
  incidentId?: string;
  recommendedAction: string;
  educationalNote?: string;
}

export interface IncidentRecord {
  id: string;
  openedAt: Date;
  resolvedAt?: Date;
  title: string;
  severity: "P1" | "P2" | "P3" | "P4";
  status: "open" | "investigating" | "resolved" | "closed";
  affectedSystems: string[];
  rootCauseHint: string;
  responseTeam: string;
  slaTarget: string;
}

export interface MaintenanceTask {
  id: string;
  system: string;
  description: string;
  dueDate: Date;
  priority: "routine" | "important" | "urgent";
  status: "scheduled" | "overdue" | "in-progress" | "completed";
  estimatedHours: number;
  impactIfDeferred: string;
}

export interface FacilityProfile {
  name: string;
  whiteSpaceM2: number;
  rackDensityKw: number;
  coolingStrategy: CoolingStrategy;
  availabilityTier: AvailabilityTier;
  workloadType: WorkloadType;
  designITLoadKw: number;
  designPUE: number;
  location?: LocationInfo | null;
}
