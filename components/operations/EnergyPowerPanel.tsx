"use client";
import type { TelemetrySnapshot } from "@/types/domain";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { Zap, Battery, Info } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface EnergyPowerPanelProps {
  telemetry: TelemetrySnapshot | null;
  trend: TelemetrySnapshot[];
}

function InfoTip({ text }: { text: string }) {
  return (
    <div className="mt-2 flex items-start gap-2 p-2.5 rounded bg-blue-500/5 border border-blue-500/15">
      <Info className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}

function PowerBar({ label, kw, maxKw, color }: { label: string; kw: number; maxKw: number; color: string }) {
  const pct = Math.min(100, (kw / maxKw) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{kw.toLocaleString()} kW</span>
      </div>
      <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function EnergyPowerPanel({ telemetry: tel, trend }: EnergyPowerPanelProps) {
  const { t } = useLanguage();

  if (!tel) return <div className="text-muted-foreground text-sm p-4">{t("ep_no_data")}</div>;

  const maxKw = tel.totalFacilityKw * 1.2;

  const chartData = trend.slice(-12).map((s, i) => ({
    time: `${i * 2}h`,
    IT: Math.round(s.itLoadKw),
    Cooling: Math.round(s.coolingKw),
    Aux: Math.round(s.lightingAuxKw),
    PUE: s.pue,
  }));

  const pueColor = tel.pue <= 1.4 ? "text-emerald-400" : tel.pue <= 2.0 ? "text-amber-400" : "text-red-400";
  const upsColor = tel.upsEfficiencyPercent >= 96 ? "text-emerald-400" : "text-amber-400";

  return (
    <div className="space-y-5">
      {/* PUE Hero */}
      <Card className="bg-card/60 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Battery className="h-4 w-4 text-blue-400" />
            {t("ep_pue_title")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("ep_pue_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div>
              <div className={cn("text-5xl font-bold tabular-nums", pueColor)}>{tel.pue.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-1">{t("ep_current_pue")}</div>
            </div>
            <div className="flex-1 space-y-2 text-xs">
              {[
                { range: "1.0–1.2", labelKey: "ep_hyperscale" as const, color: "bg-emerald-500" },
                { range: "1.2–1.5", labelKey: "ep_modern" as const, color: "bg-blue-500" },
                { range: "1.5–2.0", labelKey: "ep_average_dc" as const, color: "bg-amber-500" },
                { range: "> 2.0", labelKey: "ep_legacy" as const, color: "bg-red-500" },
              ].map(r => (
                <div key={r.range} className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${r.color}`} />
                  <span className="text-muted-foreground w-16">{r.range}</span>
                  <span>{t(r.labelKey)}</span>
                </div>
              ))}
            </div>
          </div>
          <InfoTip text={t("ep_pue_tip")} />
        </CardContent>
      </Card>

      {/* Power Breakdown */}
      <Card className="bg-card/60 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-400" />
            {t("ep_power_breakdown")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { labelKey: "ep_total_facility" as const, value: `${tel.totalFacilityKw.toLocaleString()} kW`, color: "text-foreground" },
              { labelKey: "ep_it_equipment" as const, value: `${tel.itLoadKw.toLocaleString()} kW`, color: "text-blue-400" },
              { labelKey: "ep_ups_efficiency" as const, value: `${tel.upsEfficiencyPercent}%`, color: upsColor },
            ].map(m => (
              <div key={m.labelKey} className="p-2 rounded bg-muted/20 border border-border/20 text-center">
                <div className={cn("text-lg font-bold", m.color)}>{m.value}</div>
                <div className="text-[10px] text-muted-foreground">{t(m.labelKey)}</div>
              </div>
            ))}
          </div>
          <PowerBar label={t("ep_it_load_bar")} kw={tel.itLoadKw} maxKw={maxKw} color="bg-blue-500" />
          <PowerBar label={t("ep_cooling_bar")} kw={tel.coolingKw} maxKw={maxKw} color="bg-cyan-500" />
          <PowerBar label={t("ep_lighting_bar")} kw={tel.lightingAuxKw} maxKw={maxKw} color="bg-slate-500" />
          <InfoTip text={t("ep_power_tip")} />
        </CardContent>
      </Card>

      {/* Power Trend Chart */}
      <Card className="bg-card/60 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("ep_trend_title")}</CardTitle>
          <CardDescription className="text-xs">{t("ep_trend_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e2130", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: "#9ca3af" }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="IT" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="IT (kW)" />
              <Area type="monotone" dataKey="Cooling" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} name="Cooling (kW)" />
              <Area type="monotone" dataKey="Aux" stackId="1" stroke="#6b7280" fill="#6b7280" fillOpacity={0.2} name="Aux (kW)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-3">
            <div className="text-xs text-muted-foreground mb-2">{t("ep_pue_trend")}</div>
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={chartData} margin={{ top: 0, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6b7280" }} />
                <YAxis domain={[1, 2.5]} tick={{ fontSize: 10, fill: "#6b7280" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e2130", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
                />
                <Bar dataKey="PUE" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Generator Status */}
      <Card className="bg-card/60 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("ep_gen_ups_title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              { labelKey: "ep_gen_a" as const, statusKey: "ep_gen_a_status" as const, level: "ok" as const },
              { labelKey: "ep_gen_b" as const, statusKey: "ep_gen_b_status" as const, level: "warn" as const },
              { labelKey: "ep_ups_a" as const, statusKey: "ep_ups_a_status" as const, level: "ok" as const },
              { labelKey: "ep_ups_b" as const, statusKey: "ep_ups_b_status" as const, level: "warn" as const },
            ].map(item => {
              const colors = {
                ok: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
                warn: "text-amber-400 border-amber-500/30 bg-amber-500/5",
                crit: "text-red-400 border-red-500/30 bg-red-500/5",
              };
              return (
                <div key={item.labelKey} className={cn("p-2 rounded border", colors[item.level])}>
                  <div className="font-medium">{t(item.labelKey)}</div>
                  <div className="opacity-80">{t(item.statusKey)}</div>
                </div>
              );
            })}
          </div>
          <InfoTip text={t("ep_gen_tip")} />
        </CardContent>
      </Card>
    </div>
  );
}
