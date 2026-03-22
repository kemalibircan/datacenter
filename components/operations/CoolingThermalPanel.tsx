"use client";
import type { TelemetrySnapshot } from "@/types/domain";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Thermometer, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface CoolingThermalPanelProps {
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

export function CoolingThermalPanel({ telemetry: tel, trend }: CoolingThermalPanelProps) {
  const { t } = useLanguage();

  if (!tel) return <div className="text-muted-foreground text-sm p-4">{t("ct_no_data")}</div>;

  const temperatureData = trend.slice(-12).map((s, i) => ({
    time: `${i * 2}h`,
    Supply: s.supplyTempC,
    Return: s.returnTempC,
    Target: 22,
    Limit: 27,
  }));

  const hotspotColors = {
    low: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
    medium: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
    high: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  };
  const hc = hotspotColors[tel.hotspotRisk];
  const dt = (tel.returnTempC - tel.supplyTempC).toFixed(1);

  const coolingTechItems = [
    { nameKey: "ct_crac" as const, suitableKey: "ct_crac_suitable" as const, noteKey: "ct_crac_note" as const },
    { nameKey: "ct_crah" as const, suitableKey: "ct_crah_suitable" as const, noteKey: "ct_crah_note" as const },
    { nameKey: "ct_rear_door" as const, suitableKey: "ct_rear_door_suitable" as const, noteKey: "ct_rear_door_note" as const },
    { nameKey: "ct_dtc" as const, suitableKey: "ct_dtc_suitable" as const, noteKey: "ct_dtc_note" as const },
    { nameKey: "ct_immersion" as const, suitableKey: "ct_immersion_suitable" as const, noteKey: "ct_immersion_note" as const },
  ];

  return (
    <div className="space-y-5">
      {/* Hotspot Risk & Core Temps */}
      <Card className="bg-card/60 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-orange-400" />
            {t("ct_thermal_title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className={cn("p-3 rounded-lg border text-center", hc.bg, hc.border)}>
              <div className={cn("text-2xl font-bold capitalize", hc.text)}>{tel.hotspotRisk}</div>
              <div className="text-xs text-muted-foreground">{t("ct_hotspot_risk")}</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-center">
              <div className="text-2xl font-bold text-blue-400">{tel.supplyTempC}°C</div>
              <div className="text-xs text-muted-foreground">{t("ct_supply_air")}</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-center">
              <div className={cn("text-2xl font-bold", tel.returnTempC > 35 ? "text-red-400" : "text-orange-400")}>{tel.returnTempC}°C</div>
              <div className="text-xs text-muted-foreground">{t("ct_return_air")}</div>
            </div>
          </div>

          {/* ΔT indicator */}
          <div className="flex items-center justify-between text-xs p-2 rounded bg-muted/20 border border-border/20">
            <span className="text-muted-foreground">ΔT (Return − Supply)</span>
            <span className={cn("font-medium", parseFloat(dt) > 14 ? "text-red-400" : parseFloat(dt) > 10 ? "text-amber-400" : "text-emerald-400")}>
              +{dt}°C
            </span>
          </div>

          <InfoTip text={t("ct_ashrae_tip")} />
        </CardContent>
      </Card>

      {/* Temperature Trend */}
      <Card className="bg-card/60 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("ct_temp_trend")}</CardTitle>
          <CardDescription className="text-xs">{t("ct_ashrae_limit")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={temperatureData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6b7280" }} />
              <YAxis domain={[10, 40]} tick={{ fontSize: 10, fill: "#6b7280" }} unit="°C" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e2130", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
              />
              <ReferenceLine y={27} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: "27°C limit", fontSize: 10, fill: "#f59e0b", position: "right" }} />
              <Line type="monotone" dataKey="Supply" stroke="#3b82f6" strokeWidth={2} dot={false} name="Supply (°C)" />
              <Line type="monotone" dataKey="Return" stroke="#f97316" strokeWidth={2} dot={false} name="Return (°C)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cooling Strategy */}
      <Card className="bg-card/60 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("ct_cooling_util")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Utilization bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{t("ct_cap_util")}</span>
                <span className={cn("font-medium", tel.coolingUsePercent >= 90 ? "text-red-400" : tel.coolingUsePercent >= 75 ? "text-amber-400" : "text-emerald-400")}>
                  {tel.coolingUsePercent}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted/40 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", tel.coolingUsePercent >= 90 ? "bg-red-500" : tel.coolingUsePercent >= 75 ? "bg-amber-500" : "bg-emerald-500")}
                  style={{ width: `${tel.coolingUsePercent}%` }}
                />
              </div>
            </div>

            {/* CRAC/CRAH Status */}
            <div className="grid grid-cols-4 gap-1.5">
              {["CRAH-01", "CRAH-02", "CRAH-03", "CRAH-04", "CRAH-05", "CRAH-06", "CRAH-07", "CRAH-08"].map((unit, i) => {
                const failed = tel.hotspotRisk === "high" && i === 3;
                const stressed = tel.coolingUsePercent > 80 && Math.random() > 0.6;
                return (
                  <div key={unit} className={cn(
                    "p-1.5 rounded border text-center text-[10px]",
                    failed ? "bg-red-500/10 border-red-500/30 text-red-400" :
                    stressed ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                    "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  )}>
                    <div className="font-medium">{unit.replace("CRAH-0", "C")}</div>
                    <div>{failed ? t("ct_fault") : stressed ? t("ct_high") : t("ct_ok")}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <InfoTip text={t("ct_redundancy_tip")} />
        </CardContent>
      </Card>

      {/* Cooling Strategy Education */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm text-blue-300">{t("ct_edu_title")}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="space-y-2 text-xs">
            {coolingTechItems.map(item => (
              <div key={item.nameKey} className="flex gap-2 p-2 rounded bg-blue-500/5 border border-blue-500/10">
                <div className="w-36 font-medium text-blue-200 shrink-0">{t(item.nameKey)}</div>
                <div className="text-muted-foreground flex-1">
                  <span className="text-blue-300/70">{t(item.suitableKey)}</span> · {t(item.noteKey)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
