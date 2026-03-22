"use client";
import { useEffect, useState, Suspense } from "react";
import { NavBar } from "@/components/layout/NavBar";
import { ScenarioSelector } from "@/components/operations/ScenarioSelector";
import { OverviewDashboard } from "@/components/operations/OverviewDashboard";
import { EnergyPowerPanel } from "@/components/operations/EnergyPowerPanel";
import { CoolingThermalPanel } from "@/components/operations/CoolingThermalPanel";
import { TrafficCapacityPanel } from "@/components/operations/TrafficCapacityPanel";
import { EventsAlarmsPanel } from "@/components/operations/EventsAlarmsPanel";
import { ServiceOperationsPanel } from "@/components/operations/ServiceOperationsPanel";
import { MaintenancePanel } from "@/components/operations/MaintenancePanel";
import { SustainabilityPanel } from "@/components/operations/SustainabilityPanel";
import { useMonitoringStore } from "@/store/monitoring.store";
import type { MonitoringScenarioId } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

type TabId = "overview" | "energy" | "cooling" | "traffic" | "alarms" | "service-ops" | "maintenance" | "sustainability";

function OperationsContent() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const { t } = useLanguage();

  const TABS = [
    { id: "overview" as TabId, label: t("ops_tab_overview") },
    { id: "energy" as TabId, label: t("ops_tab_energy") },
    { id: "cooling" as TabId, label: t("ops_tab_cooling") },
    { id: "traffic" as TabId, label: t("ops_tab_traffic") },
    { id: "alarms" as TabId, label: t("ops_tab_alarms") },
    { id: "service-ops" as TabId, label: t("ops_tab_service") },
    { id: "maintenance" as TabId, label: t("ops_tab_maintenance") },
    { id: "sustainability" as TabId, label: t("ops_tab_sustainability") },
  ];

  const facilityRows = [
    { labelKey: "ops_name" as const },
    { labelKey: "ops_white_space" as const },
    { labelKey: "ops_design_it" as const },
    { labelKey: "ops_rack_density" as const },
    { labelKey: "ops_cooling_strategy" as const },
    { labelKey: "ops_design_pue" as const },
    { labelKey: "ops_availability" as const },
  ];

  const {
    scenarioId,
    facilityProfile,
    currentTelemetry,
    historicalTrend,
    alarms,
    incidents,
    maintenanceTasks,
    isLoading,
    lastRefreshed,
    setScenario,
    refresh,
    acknowledgeAlarm,
  } = useMonitoringStore();

  // Initial load
  useEffect(() => {
    setScenario("normal");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScenarioChange = (id: MonitoringScenarioId) => {
    setScenario(id);
  };

  const facilityValues = [
    facilityProfile.name,
    `${facilityProfile.whiteSpaceM2} m²`,
    `${facilityProfile.designITLoadKw} kW`,
    `${facilityProfile.rackDensityKw} kW/rack`,
    facilityProfile.coolingStrategy.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    facilityProfile.designPUE.toFixed(2),
    facilityProfile.availabilityTier,
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <NavBar />

      {/* Page Header */}
      <div className="border-b border-border/40 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">{t("ops_title")}</h1>
                <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30 border">
                  {t("ops_simulated")}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">{t("ops_educational")}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("ops_desc")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {lastRefreshed && (
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {t("ops_updated")} {lastRefreshed.toLocaleTimeString()}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={refresh}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                <span className="ml-1 hidden sm:inline">{t("ops_refresh")}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Left — Scenario Selector */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border/40 bg-card/50">
            <ScenarioSelector
              selectedId={scenarioId}
              onSelect={handleScenarioChange}
            />
          </div>
          {/* Facility Summary */}
          <div className="p-4 rounded-xl border border-border/40 bg-card/50 space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("ops_facility_profile")}</h3>
            <div className="space-y-1.5">
              {facilityRows.map((row, i) => (
                <div key={row.labelKey} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t(row.labelKey)}</span>
                  <span className="font-medium">{facilityValues[i]}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/60 pt-1 border-t border-border/30">
              {t("ops_demo_profile")}{" "}
              <a href="/plan" className="text-blue-400 underline">{t("ops_plan_module")}</a>
            </p>
          </div>

          {/* Alarm summary mini-widget */}
          {!isLoading && currentTelemetry && (
            <div className="p-4 rounded-xl border border-border/40 bg-card/50 space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("ops_alarm_summary")}</h3>
              {alarms.length === 0 ? (
                <p className="text-xs text-emerald-400">{t("ops_no_alarms")}</p>
              ) : (
                <div className="space-y-1">
                  {[
                    { key: "critical", label: t("ops_critical") },
                    { key: "warning", label: t("ops_warning") },
                    { key: "info", label: t("ops_info") },
                  ].map(({ key: sev, label }) => {
                    const count = alarms.filter(a => a.severity === sev).length;
                    if (!count) return null;
                    const color = sev === "critical" ? "text-red-400" : sev === "warning" ? "text-amber-400" : "text-blue-400";
                    return (
                      <div key={sev} className="flex justify-between text-xs">
                        <span className={cn("capitalize", color)}>{label}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — Main Content */}
        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="flex overflow-x-auto gap-1 border border-border/40 bg-card/30 p-1 rounded-xl">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-blue-500/15 text-blue-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                {tab.label}
                {tab.id === "alarms" && alarms.filter(a => !a.acknowledged && a.severity === "critical").length > 0 && (
                  <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white font-bold">
                    {alarms.filter(a => !a.acknowledged && a.severity === "critical").length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("ops_generating")}
              </div>
            </div>
          )}

          {/* Tab Content */}
          {!isLoading && (
            <div className="rounded-xl border border-border/40 bg-card/30 p-4 sm:p-5">
              {activeTab === "overview" && (
                <OverviewDashboard
                  telemetry={currentTelemetry}
                  alarms={alarms}
                  incidents={incidents}
                  facilityName={facilityProfile.name}
                />
              )}
              {activeTab === "energy" && (
                <EnergyPowerPanel telemetry={currentTelemetry} trend={historicalTrend} />
              )}
              {activeTab === "cooling" && (
                <CoolingThermalPanel telemetry={currentTelemetry} trend={historicalTrend} />
              )}
              {activeTab === "traffic" && (
                <TrafficCapacityPanel telemetry={currentTelemetry} trend={historicalTrend} />
              )}
              {activeTab === "alarms" && (
                <EventsAlarmsPanel
                  alarms={alarms}
                  incidents={incidents}
                  onAcknowledge={acknowledgeAlarm}
                />
              )}
              {activeTab === "service-ops" && <ServiceOperationsPanel />}
              {activeTab === "maintenance" && <MaintenancePanel tasks={maintenanceTasks} />}
              {activeTab === "sustainability" && (
                <SustainabilityPanel telemetry={currentTelemetry} trend={historicalTrend} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OperationsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-muted-foreground text-sm">Loading Operations…</div>}>
      <OperationsContent />
    </Suspense>
  );
}
