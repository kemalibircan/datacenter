// Monitoring Service — generates educational simulation telemetry
// ALL values are synthetic, bounded, and clearly labeled as "Simulated"
import type {
  MonitoringScenario,
  MonitoringScenarioId,
  TelemetrySnapshot,
  AlarmEvent,
  IncidentRecord,
  MaintenanceTask,
  FacilityProfile,
} from "@/types/domain";

// ─── Scenario Configurations ──────────────────────────────────────────────────
export const MONITORING_SCENARIOS: MonitoringScenario[] = [
  {
    id: "normal",
    label: "Normal Operation",
    description: "Steady-state operation — typical facility at average load",
    icon: "CheckCircle2",
    educationalNote:
      "In normal operation, a data center runs below its design capacity with cooling well within limits and minimal alarms. This is the baseline for measuring efficiency metrics like PUE.",
    effects: {
      pueMultiplier: 1.0,
      coolingLoadPercent: 55,
      itLoadPercent: 60,
      networkUtilPercent: 45,
      alarmCount: 2,
      criticalAlarmCount: 0,
      maintenanceRisk: "low",
    },
  },
  {
    id: "ai-workload",
    label: "AI / GPU Workload",
    description: "High-density GPU cluster running AI training workloads",
    icon: "Cpu",
    educationalNote:
      "AI/GPU workloads can push rack densities above 40–80 kW/rack, far exceeding what conventional air cooling handles. This scenario demonstrates why liquid cooling is increasingly essential and how IT load dominates facility power.",
    effects: {
      pueMultiplier: 0.92,
      coolingLoadPercent: 88,
      itLoadPercent: 92,
      networkUtilPercent: 75,
      alarmCount: 5,
      criticalAlarmCount: 1,
      maintenanceRisk: "medium",
    },
  },
  {
    id: "cooling-stress",
    label: "Cooling Stress",
    description: "Cooling system near capacity — thermal headroom reduced",
    icon: "Thermometer",
    educationalNote:
      "Cooling stress happens when ambient temperatures spike, equipment is added beyond design, or cooling units fail. This is when hotspots form and rack inlet temperatures approach ASHRAE Class A1 limits (27°C). Data centers monitor this to prevent thermal shutdowns.",
    effects: {
      pueMultiplier: 1.28,
      coolingLoadPercent: 95,
      itLoadPercent: 72,
      networkUtilPercent: 55,
      alarmCount: 8,
      criticalAlarmCount: 2,
      maintenanceRisk: "high",
    },
  },
  {
    id: "utility-instability",
    label: "Utility Instability",
    description: "Grid feed degraded — UPS active, generator on standby",
    icon: "Zap",
    educationalNote:
      "Grid instability is one of the most common operational risks. Data centers use a chain: utility → transformer → UPS → PDU → IT equipment. When utility fails, UPS provides bridge power while generators start (typically 10–30 seconds). This scenario shows why backup power is critical.",
    effects: {
      pueMultiplier: 1.18,
      coolingLoadPercent: 62,
      itLoadPercent: 65,
      networkUtilPercent: 48,
      alarmCount: 12,
      criticalAlarmCount: 3,
      maintenanceRisk: "high",
    },
  },
  {
    id: "maintenance-backlog",
    label: "Maintenance Backlog",
    description: "Preventive maintenance deferred — resilience degraded",
    icon: "Wrench",
    educationalNote:
      "Deferred maintenance is a silent risk multiplier. When preventive maintenance (PM) is skipped, equipment degrades and redundancy assumptions break down. A facility may believe it has N+1 cooling, but an uninspected unit could fail unnoticed.",
    effects: {
      pueMultiplier: 1.15,
      coolingLoadPercent: 70,
      itLoadPercent: 68,
      networkUtilPercent: 52,
      alarmCount: 9,
      criticalAlarmCount: 1,
      maintenanceRisk: "high",
    },
  },
  {
    id: "traffic-spike",
    label: "Traffic Spike",
    description: "Sudden surge in network traffic and compute demand",
    icon: "TrendingUp",
    educationalNote:
      "Traffic spikes test capacity planning assumptions. An undersized network fabric or compute layer will saturate quickly. This scenario illustrates why capacity headroom (typically 20–30% buffer) is designed into data center infrastructure.",
    effects: {
      pueMultiplier: 1.05,
      coolingLoadPercent: 80,
      itLoadPercent: 87,
      networkUtilPercent: 94,
      alarmCount: 6,
      criticalAlarmCount: 1,
      maintenanceRisk: "medium",
    },
  },
];

// ─── Bounded Random Helper ────────────────────────────────────────────────────
function jitter(base: number, variance: number): number {
  return Math.max(0, base + (Math.random() - 0.5) * 2 * variance);
}

// ─── Telemetry Generator ──────────────────────────────────────────────────────
export function generateTelemetry(
  scenario: MonitoringScenario,
  profile: FacilityProfile
): TelemetrySnapshot {
  const { effects } = scenario;

  const designITKw = profile.designITLoadKw;
  const itLoadKw = Math.round(jitter(designITKw * (effects.itLoadPercent / 100), designITKw * 0.03));
  const coolingKw = Math.round(
    jitter(itLoadKw * (effects.coolingLoadPercent / 100) * 0.7, itLoadKw * 0.05)
  );
  const lightingAuxKw = Math.round(jitter(designITKw * 0.05, 5));
  const totalFacilityKw = itLoadKw + coolingKw + lightingAuxKw;
  const pue = parseFloat((totalFacilityKw / Math.max(itLoadKw, 1) * effects.pueMultiplier).toFixed(2));
  const upsEfficiency = Math.round(jitter(96, 1));

  // Cooling thermal
  const baseSupply = 14;
  const supplyTempC = parseFloat(jitter(baseSupply + effects.coolingLoadPercent * 0.05, 0.5).toFixed(1));
  const dtC = jitter(12 + effects.coolingLoadPercent * 0.08, 1.5);
  const returnTempC = parseFloat((supplyTempC + dtC).toFixed(1));
  const hotspotRisk: TelemetrySnapshot["hotspotRisk"] =
    effects.coolingLoadPercent > 85 ? "high" : effects.coolingLoadPercent > 70 ? "medium" : "low";

  // Network
  const designBandwidthGbps = 100;
  const inboundGbps = parseFloat(jitter(designBandwidthGbps * (effects.networkUtilPercent / 100) * 0.45, 2).toFixed(1));
  const outboundGbps = parseFloat(jitter(designBandwidthGbps * (effects.networkUtilPercent / 100) * 0.35, 2).toFixed(1));
  const bandwidthUtilPercent = Math.round(effects.networkUtilPercent + jitter(0, 5));

  // Capacity
  const rackOccupancyPercent = Math.round(jitter(62, 5));
  const computeUtilPercent = Math.round(jitter(effects.itLoadPercent, 8));
  const storageUtilPercent = Math.round(jitter(65, 6));

  // Sustainability
  const renewablePercent = Math.round(jitter(35, 10));
  const co2KgPerHour = parseFloat((totalFacilityKw * 0.233 * (1 - renewablePercent / 100)).toFixed(1));
  const waterLitersPerHour = parseFloat(jitter(itLoadKw * 1.8, itLoadKw * 0.2).toFixed(0));

  return {
    timestamp: new Date(),
    totalFacilityKw,
    itLoadKw,
    coolingKw,
    lightingAuxKw,
    upsEfficiencyPercent: upsEfficiency,
    pue,
    supplyTempC,
    returnTempC,
    coolingUsePercent: Math.round(effects.coolingLoadPercent + jitter(0, 5)),
    hotspotRisk,
    inboundGbps,
    outboundGbps,
    bandwidthUtilPercent,
    rackOccupancyPercent,
    computeUtilPercent,
    storageUtilPercent,
    renewablePercent,
    co2KgPerHour,
    waterLitersPerHour,
    dataLabel: "Simulated",
  };
}

// ─── Historical Trend Generator ───────────────────────────────────────────────
export function generateHistoricalTrend(
  scenario: MonitoringScenario,
  profile: FacilityProfile,
  hours: number = 24
): TelemetrySnapshot[] {
  const now = new Date();
  const snapshots: TelemetrySnapshot[] = [];
  for (let h = hours; h >= 0; h--) {
    const ts = generateTelemetry(scenario, profile);
    ts.timestamp = new Date(now.getTime() - h * 3600_000);
    snapshots.push(ts);
  }
  return snapshots;
}

// ─── Alarm Generator ──────────────────────────────────────────────────────────
export function generateAlarms(
  scenario: MonitoringScenario,
  profile: FacilityProfile
): AlarmEvent[] {
  const alarms: AlarmEvent[] = [];
  const now = new Date();

  const ALARM_POOL: Omit<AlarmEvent, "id" | "timestamp" | "acknowledged">[] = [
    // Power alarms
    {
      severity: "critical",
      category: "power",
      title: "UPS Battery Degraded — String A",
      message: "UPS string A battery capacity estimated at 68% of rated. Bypass risk on extended outage.",
      incidentId: "INC-0041",
      recommendedAction: "Schedule battery replacement within 30 days. Review maintenance contract.",
      educationalNote: "UPS batteries have a 3–5 year lifecycle. Degraded batteries reduce the bridge time between utility loss and generator takeover, compressing the response window.",
    },
    {
      severity: "warning",
      category: "power",
      title: "Generator Fuel Level Low — Gen B",
      message: "Generator B fuel tank at 41%. Standard refill threshold is 50%.",
      recommendedAction: "Schedule fuel delivery within 48 hours.",
      educationalNote: "Data center guidelines recommend a minimum 48 hours of generator fuel on-site. Fuel at 41% with a 1 MW load represents approximately 20 hours of runtime — below best practice.",
    },
    {
      severity: "warning",
      category: "power",
      title: "PDU-3 Load Near Capacity",
      message: "PDU-3 showing 82% load utilization. Design limit is 80% continuous.",
      recommendedAction: "Redistribute loads from PDU-3. Review upcoming equipment additions.",
      educationalNote: "Power distribution units (PDUs) should be loaded to a maximum of 80% to maintain safe redundancy headroom and thermal margins on breakers.",
    },
    {
      severity: "critical",
      category: "power",
      title: "Utility Feed B — Loss of Supply",
      message: "Utility feed B has been lost. Running on feed A only. Redundancy is degraded.",
      incidentId: "INC-0045",
      recommendedAction: "Contact utility provider immediately. Verify generator auto-start status. Alert on-call manager.",
      educationalNote: "A dual-feed power configuration provides N+1 utility redundancy. With one feed lost, the site has no protection against a single power event on the remaining feed.",
    },
    // Cooling alarms
    {
      severity: "critical",
      category: "cooling",
      title: "CRAH Unit 4 — Fan Failure",
      message: "CRAH-04 fan array fault detected. Unit offline. Cooling capacity reduced by ~16%.",
      incidentId: "INC-0042",
      recommendedAction: "Dispatch facility technician immediately. Reduce IT load on hot aisle rows 7–9 if temps rise above 27°C intake.",
      educationalNote: "This is why N+1 cooling redundancy exists. With one CRAH offline, other units must absorb the load. If the facility was running at high utilization, thermal headroom may be insufficient.",
    },
    {
      severity: "warning",
      category: "cooling",
      title: "Rack Inlet Temperature — Zone B Row 5",
      message: "Row 5 Zone B inlet temperature at 26.8°C. ASHRAE Class A1 recommended limit is 27°C.",
      recommendedAction: "Check for airflow bypass, blanking panel gaps, or overloaded racks in this zone.",
      educationalNote: "ASHRAE Class A1 specifies an inlet temperature range of 18–27°C. Exceeding 27°C begins to reduce server fan speed margin and risks thermal throttling.",
    },
    {
      severity: "warning",
      category: "cooling",
      title: "Chilled Water Supply — ΔT Deviation",
      message: "Chilled water ΔT dropped to 4.2°C (target 8°C). Possible bypass valve or flow imbalance.",
      recommendedAction: "Review chiller plant controls. Check for open bypass valves or damaged flow meters.",
      educationalNote: "The chilled water ΔT (difference between supply and return temperature) indicates how effectively heat is being extracted. A low ΔT means the water is returning cold — energy is being used inefficiently.",
    },
    // Network alarms
    {
      severity: "warning",
      category: "network",
      title: "Core Switch — Uplink Utilization 88%",
      message: "North core switch uplink to ISP-A at 88% utilization for sustained period.",
      recommendedAction: "Review traffic spike cause. Consider traffic shaping or CDN offload. Notify network team.",
      educationalNote: "Network capacity is typically planned with 70–80% maximum utilization to provide headroom for bursts. Sustained utilization above 85% indicates near-saturation and potential packet drops.",
    },
    {
      severity: "info",
      category: "network",
      title: "BGP Route Change — ISP-B",
      message: "BGP session re-established on ISP-B path after 4-minute interruption.",
      recommendedAction: "Monitor for stability. Log event for trend analysis.",
      educationalNote: "BGP (Border Gateway Protocol) route changes are common in internet peering but should be monitored for patterns. Repeated BGP instability from a provider may indicate a reliability concern.",
    },
    // Security
    {
      severity: "warning",
      category: "security",
      title: "Access Control — After-Hours Entry",
      message: "Unscheduled badge entry detected on Door 3 (server hall) at 02:14. Entry was authenticated.",
      recommendedAction: "Review badge log. Confirm with individual. Log for security audit.",
      educationalNote: "After-hours access to data center floors is a security indicator. Even authorized access should be logged and reviewed as part of continuous security management.",
    },
    // Facility
    {
      severity: "warning",
      category: "facility",
      title: "Leak Detection — Under CRAH-7",
      message: "Moisture sensor triggered under CRAH unit 7 in mechanical aisle.",
      recommendedAction: "Dispatch technician for inspection. Check condensate drain and coil connections.",
      educationalNote: "Water in the white space is a critical risk for IT equipment. Leak detection systems under CRACs, piping, and below raised floors provide early warning to prevent equipment damage.",
    },
    {
      severity: "info",
      category: "facility",
      title: "Fire Suppression Test Completed",
      message: "Quarterly VESDA pre-action test completed successfully in Zone A. No issues found.",
      recommendedAction: "Log test results. Schedule next test in 90 days.",
      educationalNote: "Regular testing of fire suppression systems is a critical maintenance activity. Early smoke detection (VESDA) and pre-action suppress systems protect equipment while reducing false discharge risk.",
    },
    // IT Equipment
    {
      severity: "warning",
      category: "it-equipment",
      title: "Server PSU Failure — Rack B-14 U12",
      message: "Server at rack B-14, unit 12 has flagged a PSU failure on PSU-B. Running on single PSU.",
      recommendedAction: "Schedule PSU replacement. Monitor server health. Verify workload criticality.",
      educationalNote: "Dual PSU servers protect against single power supply failure, but the failed unit must be replaced to restore redundancy. A server on a single PSU has no protection against a subsequent supply failure.",
    },
    {
      severity: "info",
      category: "it-equipment",
      title: "Storage Array — Disk Predictive Failure",
      message: "SMART monitoring flagged predictive failure on drive bay 14 in storage array SA-2.",
      recommendedAction: "Order replacement drive. Begin hot-spare rebuild once drive is available.",
      educationalNote: "SMART (Self-Monitoring Analysis and Reporting Technology) can predict drive failure before it occurs. This allows proactive replacement without data loss in RAID-protected arrays.",
    },
  ];

  const { alarmCount, criticalAlarmCount } = scenario.effects;

  // Select critical alarms first
  const criticals = ALARM_POOL.filter(a => a.severity === "critical");
  const warnings = ALARM_POOL.filter(a => a.severity === "warning");
  const infos = ALARM_POOL.filter(a => a.severity === "info");

  const selectedCriticals = criticals.slice(0, Math.min(criticalAlarmCount, criticals.length));
  const remaining = alarmCount - selectedCriticals.length;
  const selectedWarnings = warnings.slice(0, Math.max(0, Math.min(remaining - 1, warnings.length)));
  const selectedInfos = infos.slice(0, 1);

  const selected = [...selectedCriticals, ...selectedWarnings, ...selectedInfos];

  selected.forEach((alarm, i) => {
    alarms.push({
      id: `ALM-${String(i + 1).padStart(4, "0")}`,
      timestamp: new Date(now.getTime() - Math.random() * 3 * 3600_000),
      acknowledged: i > 1,
      ...alarm,
    });
  });

  return alarms.sort((a, b) => {
    const sev = { critical: 0, warning: 1, info: 2 };
    return sev[a.severity] - sev[b.severity];
  });
}

// ─── Incident Generator ───────────────────────────────────────────────────────
export function generateIncidents(scenario: MonitoringScenario): IncidentRecord[] {
  const now = new Date();
  const allIncidents: IncidentRecord[] = [
    {
      id: "INC-0041",
      openedAt: new Date(now.getTime() - 2 * 24 * 3600_000),
      title: "UPS String A Battery Degradation",
      severity: "P2",
      status: "investigating",
      affectedSystems: ["UPS-A Power Chain", "Battery Bank A1-A3"],
      rootCauseHint: "Battery string A1 estimated end-of-life. Possible accelerated degradation due to elevated ambient temperature in UPS room during July.",
      responseTeam: "Electrical Engineering / Vendor Service",
      slaTarget: "Resolve within 5 business days",
    },
    {
      id: "INC-0042",
      openedAt: new Date(now.getTime() - 4 * 3600_000),
      title: "CRAH-04 Fan Array Failure",
      severity: "P1",
      status: "open",
      affectedSystems: ["Cooling Zone B", "Rows 7–9"],
      rootCauseHint: "Fan motor fault — pending physical inspection. Possible bearing failure or motor winding issue.",
      responseTeam: "Facility Operations / HVAC Vendor",
      slaTarget: "Resolve within 4 hours",
    },
    {
      id: "INC-0045",
      openedAt: new Date(now.getTime() - 1.5 * 3600_000),
      title: "Utility Feed B — Supply Loss",
      severity: "P1",
      status: "open",
      affectedSystems: ["Utility Feed B", "Transfer Switch B", "Downstream UPS-B chain"],
      rootCauseHint: "Utility provider reports transformer fault on feeder substation. Estimated restoration: 6–8 hours.",
      responseTeam: "Facility Operations / On-Call Manager / Utility Provider",
      slaTarget: "Restore within 2 hours or escalate to DR",
    },
  ];

  if (scenario.effects.criticalAlarmCount === 0) return [];
  if (scenario.id === "normal") return [];
  return allIncidents.slice(0, scenario.effects.criticalAlarmCount);
}

// ─── Maintenance Task Generator ───────────────────────────────────────────────
export function generateMaintenanceTasks(
  scenario: MonitoringScenario,
  _profile: FacilityProfile
): MaintenanceTask[] {
  const now = new Date();
  const dayMs = 86_400_000;

  const allTasks: MaintenanceTask[] = [
    {
      id: "PM-001",
      system: "UPS System",
      description: "Annual UPS battery capacity test — full load discharge test",
      dueDate: new Date(now.getTime() + 15 * dayMs),
      priority: "important",
      status: "scheduled",
      estimatedHours: 4,
      impactIfDeferred: "Cannot validate actual battery runtime. Risk of unexpected shorter runtime during real outage.",
    },
    {
      id: "PM-002",
      system: "Generator",
      description: "Monthly generator load test — 30-minute full-load run",
      dueDate: new Date(now.getTime() + 5 * dayMs),
      priority: "routine",
      status: "scheduled",
      estimatedHours: 2,
      impactIfDeferred: "Generator may fail to start reliably. Fuel quality degrades without periodic exercise.",
    },
    {
      id: "PM-003",
      system: "Cooling Tower",
      description: "Quarterly cooling tower water treatment and Legionella check",
      dueDate: new Date(now.getTime() - 3 * dayMs),
      priority: "important",
      status: "overdue",
      estimatedHours: 3,
      impactIfDeferred: "Legionella risk increases with time between treatments. Regulatory non-compliance possible.",
    },
    {
      id: "PM-004",
      system: "CRAC/CRAH Units",
      description: "Semi-annual CRAC unit filter replacement — all 12 units",
      dueDate: new Date(now.getTime() - 7 * dayMs),
      priority: "routine",
      status: "overdue",
      estimatedHours: 6,
      impactIfDeferred: "Blocked filters reduce airflow, increase fan energy, and raise supply air temperature.",
    },
    {
      id: "PM-005",
      system: "Raised Floor",
      description: "Annual sub-floor inspection — check for cable obstruction and seal gaps",
      dueDate: new Date(now.getTime() + 45 * dayMs),
      priority: "routine",
      status: "scheduled",
      estimatedHours: 8,
      impactIfDeferred: "Airflow bypass from gaps under floor reduces cooling effectiveness by up to 50%.",
    },
    {
      id: "PM-006",
      system: "Fire Suppression",
      description: "Quarterly VESDA sensitivity calibration and nozzle inspection",
      dueDate: new Date(now.getTime() + 22 * dayMs),
      priority: "important",
      status: "scheduled",
      estimatedHours: 2,
      impactIfDeferred: "Miscalibrated smoke detection can cause false alarms (facility disruption) or missed alarms (fire risk).",
    },
    {
      id: "PM-007",
      system: "Electrical Distribution",
      description: "Annual thermal imaging scan of all switchboards and busways",
      dueDate: new Date(now.getTime() - 14 * dayMs),
      priority: "urgent",
      status: "overdue",
      estimatedHours: 4,
      impactIfDeferred: "Loose connections and overloaded breakers generate heat — an undetected fire risk and potential cause of power failure.",
    },
    {
      id: "PM-008",
      system: "BMS / DCIM",
      description: "Sensor calibration check — temperature, humidity, airflow sensors",
      dueDate: new Date(now.getTime() + 30 * dayMs),
      priority: "routine",
      status: "scheduled",
      estimatedHours: 4,
      impactIfDeferred: "Sensor drift leads to incorrect temperature readings, potentially allowing real hotspots to go undetected.",
    },
  ];

  if (scenario.id === "maintenance-backlog") {
    return allTasks; // Show all including overdue
  }
  return allTasks.filter(t => t.status !== "overdue" || t.priority === "urgent");
}

// ─── Default Facility Profile ─────────────────────────────────────────────────
export const DEFAULT_FACILITY_PROFILE: FacilityProfile = {
  name: "Demo Facility — Medium Enterprise",
  whiteSpaceM2: 500,
  rackDensityKw: 8,
  coolingStrategy: "crac-crah",
  availabilityTier: "N+1",
  workloadType: "general-it",
  designITLoadKw: 400,
  designPUE: 1.55,
};
