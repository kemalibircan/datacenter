// Monitoring Store — Zustand state for the operations/monitoring module
import { create } from "zustand";
import type {
  MonitoringScenarioId,
  TelemetrySnapshot,
  AlarmEvent,
  IncidentRecord,
  MaintenanceTask,
  FacilityProfile,
} from "@/types/domain";
import {
  MONITORING_SCENARIOS,
  generateTelemetry,
  generateHistoricalTrend,
  generateAlarms,
  generateIncidents,
  generateMaintenanceTasks,
  DEFAULT_FACILITY_PROFILE,
} from "@/services/monitoring.service";

interface MonitoringState {
  scenarioId: MonitoringScenarioId;
  facilityProfile: FacilityProfile;
  currentTelemetry: TelemetrySnapshot | null;
  historicalTrend: TelemetrySnapshot[];
  alarms: AlarmEvent[];
  incidents: IncidentRecord[];
  maintenanceTasks: MaintenanceTask[];
  isLoading: boolean;
  lastRefreshed: Date | null;

  // Actions
  setScenario: (id: MonitoringScenarioId) => void;
  setFacilityProfile: (profile: FacilityProfile) => void;
  refresh: () => void;
  acknowledgeAlarm: (alarmId: string) => void;
}

export const useMonitoringStore = create<MonitoringState>((set, get) => ({
  scenarioId: "normal",
  facilityProfile: DEFAULT_FACILITY_PROFILE,
  currentTelemetry: null,
  historicalTrend: [],
  alarms: [],
  incidents: [],
  maintenanceTasks: [],
  isLoading: false,
  lastRefreshed: null,

  setScenario: (id: MonitoringScenarioId) => {
    set({ scenarioId: id, isLoading: true });
    const scenario = MONITORING_SCENARIOS.find(s => s.id === id)!;
    const profile = get().facilityProfile;
    setTimeout(() => {
      set({
        currentTelemetry: generateTelemetry(scenario, profile),
        historicalTrend: generateHistoricalTrend(scenario, profile, 24),
        alarms: generateAlarms(scenario, profile),
        incidents: generateIncidents(scenario),
        maintenanceTasks: generateMaintenanceTasks(scenario, profile),
        isLoading: false,
        lastRefreshed: new Date(),
      });
    }, 400);
  },

  setFacilityProfile: (profile: FacilityProfile) => {
    set({ facilityProfile: profile });
    get().refresh();
  },

  refresh: () => {
    const { scenarioId, facilityProfile } = get();
    const scenario = MONITORING_SCENARIOS.find(s => s.id === scenarioId)!;
    set({
      currentTelemetry: generateTelemetry(scenario, facilityProfile),
      historicalTrend: generateHistoricalTrend(scenario, facilityProfile, 24),
      alarms: generateAlarms(scenario, facilityProfile),
      incidents: generateIncidents(scenario),
      maintenanceTasks: generateMaintenanceTasks(scenario, facilityProfile),
      lastRefreshed: new Date(),
    });
  },

  acknowledgeAlarm: (alarmId: string) => {
    set(state => ({
      alarms: state.alarms.map(a => a.id === alarmId ? { ...a, acknowledged: true } : a),
    }));
  },
}));
