"use client";
import type { TelemetrySnapshot, AlarmEvent, IncidentRecord } from "@/types/domain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity, AlertTriangle, CheckCircle2, BarChart3,
  Thermometer, Wifi, Server, Battery, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface OverviewDashboardProps {
  telemetry: TelemetrySnapshot | null;
  alarms: AlarmEvent[];
  incidents: IncidentRecord[];
  facilityName: string;
}

function StatusBadge({ level }: { level: "ok" | "warn" | "crit" }) {
  const { t } = useLanguage();
  const configs = {
    ok: { label: t("ov_status_nominal"), className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    warn: { label: t("ov_status_warning"), className: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
    crit: { label: t("ov_status_critical"), className: "bg-red-500/10 text-red-400 border-red-500/30" },
  };
  const c = configs[level];
  return <Badge className={cn("text-[10px] border", c.className)}>{c.label}</Badge>;
}

function MetricTile({
  icon: Icon, label, value, sub, status,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  status?: "ok" | "warn" | "crit";
}) {
  const colorMap = { ok: "text-emerald-400", warn: "text-amber-400", crit: "text-red-400" };
  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/20 border border-border/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          <span className="text-xs">{label}</span>
        </div>
        {status && <StatusBadge level={status} />}
      </div>
      <span className={cn("text-xl font-bold", status ? colorMap[status] : "text-foreground")}>{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
    </div>
  );
}

export function OverviewDashboard({ telemetry: tel, alarms, incidents, facilityName }: OverviewDashboardProps) {
  const { t } = useLanguage();

  if (!tel) return <div className="text-muted-foreground text-sm p-4">{t("ep_no_data")}</div>;

  const critAlarms = alarms.filter(a => a.severity === "critical");
  const warnAlarms = alarms.filter(a => a.severity === "warning");
  const openIncidents = incidents.filter(i => i.status !== "closed" && i.status !== "resolved");
  const unacked = alarms.filter(a => !a.acknowledged).length;

  const overallStatus: "ok" | "warn" | "crit" =
    critAlarms.length > 0 ? "crit" : warnAlarms.length > 2 ? "warn" : "ok";

  const pueStatus: "ok" | "warn" | "crit" =
    tel.pue <= 1.4 ? "ok" : tel.pue <= 2.0 ? "warn" : "crit";
  const coolingStatus: "ok" | "warn" | "crit" =
    tel.hotspotRisk === "high" ? "crit" : tel.hotspotRisk === "medium" ? "warn" : "ok";
  const bwStatus: "ok" | "warn" | "crit" =
    tel.bandwidthUtilPercent >= 90 ? "crit" : tel.bandwidthUtilPercent >= 75 ? "warn" : "ok";

  return (
    <div className="space-y-4">
      {/* Facility Header */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-card/60 border border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-blue-400" />
            <span className="font-semibold text-sm">{facilityName}</span>
            <StatusBadge level={overallStatus} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("ov_last_updated")} {tel.timestamp.toLocaleTimeString()} · <span className="text-amber-400">⚡ {tel.dataLabel}</span>
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {critAlarms.length > 0 && (
            <div className="flex items-center gap-1 text-red-400 text-xs font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              {critAlarms.length} {t("ov_status_critical")}
            </div>
          )}
          {warnAlarms.length > 0 && (
            <div className="flex items-center gap-1 text-amber-400 text-xs font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              {warnAlarms.length} {t("ov_status_warning")}
            </div>
          )}
          {critAlarms.length === 0 && warnAlarms.length === 0 && (
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t("ov_all_normal")}
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <MetricTile
          icon={Battery}
          label={t("ov_metric_pue")}
          value={tel.pue.toFixed(2)}
          sub="Power Usage Effectiveness"
          status={pueStatus}
        />
        <MetricTile
          icon={Activity}
          label={t("ov_metric_it_load")}
          value={`${tel.itLoadKw} kW`}
          sub={`of ${Math.round(tel.itLoadKw / 0.92)} kW design`}
          status="ok"
        />
        <MetricTile
          icon={Thermometer}
          label={t("ov_metric_hotspot")}
          value={tel.hotspotRisk.toUpperCase()}
          sub={`Supply: ${tel.supplyTempC}°C → ${tel.returnTempC}°C`}
          status={coolingStatus}
        />
        <MetricTile
          icon={Wifi}
          label={t("ov_metric_bandwidth")}
          value={`${tel.bandwidthUtilPercent}%`}
          sub={`↑${tel.inboundGbps}G / ↓${tel.outboundGbps}G`}
          status={bwStatus}
        />
        <MetricTile
          icon={BarChart3}
          label={t("ov_metric_rack_occ")}
          value={`${tel.rackOccupancyPercent}%`}
          sub={t("ov_installed_racks")}
        />
        <MetricTile
          icon={AlertTriangle}
          label={t("ov_metric_alarms")}
          value={String(alarms.length)}
          sub={`${unacked} ${t("ov_unacknowledged")}`}
          status={critAlarms.length > 0 ? "crit" : warnAlarms.length > 0 ? "warn" : "ok"}
        />
        <MetricTile
          icon={Clock}
          label={t("ov_metric_incidents")}
          value={String(openIncidents.length)}
          sub={openIncidents.length > 0 ? t("ov_requires_attention") : t("ov_no_open_incidents")}
          status={openIncidents.length > 0 ? (openIncidents.some(i => i.severity === "P1") ? "crit" : "warn") : "ok"}
        />
        <MetricTile
          icon={CheckCircle2}
          label={t("ov_metric_compute")}
          value={`${tel.computeUtilPercent}%`}
          sub={t("ov_estimated_util")}
          status={tel.computeUtilPercent >= 90 ? "crit" : tel.computeUtilPercent >= 75 ? "warn" : "ok"}
        />
      </div>

      {/* Educational Card */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm text-blue-300">{t("ov_edu_title")}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("ov_edu_desc")}
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            {[
              { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", label: t("ov_status_nominal"), desc: t("ov_within_spec") },
              { color: "text-amber-400 bg-amber-500/10 border-amber-500/20", label: t("ov_status_warning"), desc: t("ov_investigate_soon") },
              { color: "text-red-400 bg-red-500/10 border-red-500/20", label: t("ov_status_critical"), desc: t("ov_act_now") },
            ].map(({ color, label, desc }) => (
              <div key={label} className={`rounded p-1.5 border ${color} text-center`}>
                <div className="font-semibold">{label}</div>
                <div className="text-[10px] opacity-80">{desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
