"use client";
import type { TelemetrySnapshot } from "@/types/domain";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { Leaf, Zap, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface SustainabilityPanelProps {
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

export function SustainabilityPanel({ telemetry: tel, trend }: SustainabilityPanelProps) {
  const { t } = useLanguage();

  if (!tel) return <div className="text-muted-foreground text-sm p-4">{t("sp_no_data")}</div>;

  const pueData = [{ name: "PUE", value: Math.min(100, Math.round((2.5 - tel.pue) * 67)), fill: tel.pue <= 1.4 ? "#10b981" : tel.pue <= 2.0 ? "#f59e0b" : "#ef4444" }];
  const renewableData = [{ name: "Renewable", value: tel.renewablePercent, fill: "#10b981" }];

  const sustainabilityTrend = trend.slice(-12).map((s, i) => ({
    time: `${i * 2}h`,
    PUE: s.pue,
    Renewable: s.renewablePercent,
    CO2: Math.round(s.co2KgPerHour),
  }));

  const pueGrade = tel.pue <= 1.2 ? { labelKey: "sp_pue_excellent" as const, color: "text-emerald-400" }
    : tel.pue <= 1.5 ? { labelKey: "sp_pue_good" as const, color: "text-blue-400" }
    : tel.pue <= 2.0 ? { labelKey: "sp_pue_average" as const, color: "text-amber-400" }
    : { labelKey: "sp_pue_poor" as const, color: "text-red-400" };

  const levers = [
    { nameKey: "sp_lever_free_cooling" as const, impactKey: "sp_lever_free_cooling_impact" as const, noteKey: "sp_lever_free_cooling_note" as const },
    { nameKey: "sp_lever_liquid" as const, impactKey: "sp_lever_liquid_impact" as const, noteKey: "sp_lever_liquid_note" as const },
    { nameKey: "sp_lever_renewable" as const, impactKey: "sp_lever_renewable_impact" as const, noteKey: "sp_lever_renewable_note" as const },
    { nameKey: "sp_lever_aisle" as const, impactKey: "sp_lever_aisle_impact" as const, noteKey: "sp_lever_aisle_note" as const },
    { nameKey: "sp_lever_virtual" as const, impactKey: "sp_lever_virtual_impact" as const, noteKey: "sp_lever_virtual_note" as const },
  ];

  return (
    <div className="space-y-5">
      {/* PUE + Renewable gauges */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card/60 border-border/40">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              PUE
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={120}>
                <RadialBarChart innerRadius="60%" outerRadius="90%" startAngle={90} endAngle={-270} data={pueData}>
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background dataKey="value" cornerRadius={6} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="text-center -mt-10">
                <div className={cn("text-3xl font-bold", pueGrade.color)}>{tel.pue.toFixed(2)}</div>
                <div className={cn("text-xs font-medium", pueGrade.color)}>{t(pueGrade.labelKey)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border/40">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Leaf className="h-4 w-4 text-emerald-400" />
              {t("sp_renewable_energy")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={120}>
                <RadialBarChart innerRadius="60%" outerRadius="90%" startAngle={90} endAngle={-270} data={renewableData}>
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background={{ fill: "rgba(255,255,255,0.05)" }} dataKey="value" cornerRadius={6} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="text-center -mt-10">
                <div className="text-3xl font-bold text-emerald-400">{tel.renewablePercent}%</div>
                <div className="text-xs text-muted-foreground">{t("sp_renewable_share")}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Carbon & Water */}
      <Card className="bg-card/60 border-border/40">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-sm">{t("sp_env_impact_title")}</CardTitle>
          <CardDescription className="text-xs">{t("sp_env_impact_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-center">
              <div className="text-2xl font-bold text-orange-400">{tel.co2KgPerHour.toFixed(0)} kg/h</div>
              <div className="text-xs text-muted-foreground">{t("sp_co2_rate")}</div>
              <div className="text-[10px] text-muted-foreground/60 mt-1">{(tel.co2KgPerHour * 24).toFixed(0)} {t("sp_co2_day")}</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-center">
              <div className="text-2xl font-bold text-blue-400">{Number(tel.waterLitersPerHour).toLocaleString()} L/h</div>
              <div className="text-xs text-muted-foreground">{t("sp_water_consumption")}</div>
              <div className="text-[10px] text-muted-foreground/60 mt-1">{t("sp_water_note")}</div>
            </div>
          </div>
          <InfoTip text={t("sp_env_tip")} />
        </CardContent>
      </Card>

      {/* Trend */}
      <Card className="bg-card/60 border-border/40">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-sm">{t("sp_trend_title")}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={sustainabilityTrend} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6b7280" }} />
              <YAxis yAxisId="pue" domain={[1, 2.5]} tick={{ fontSize: 10, fill: "#6b7280" }} />
              <YAxis yAxisId="ren" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: "#6b7280" }} unit="%" />
              <Tooltip contentStyle={{ backgroundColor: "#1e2130", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
              <Line yAxisId="pue" type="monotone" dataKey="PUE" stroke="#f59e0b" strokeWidth={2} dot={false} name="PUE" />
              <Line yAxisId="ren" type="monotone" dataKey="Renewable" stroke="#10b981" strokeWidth={2} dot={false} name="Renewable %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sustainability levers */}
      <Card className="bg-emerald-500/5 border-emerald-500/20">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm text-emerald-300">{t("sp_edu_title")}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2 text-xs text-muted-foreground">
          {levers.map(item => (
            <div key={item.nameKey} className="flex gap-2 p-2 rounded bg-emerald-500/5 border border-emerald-500/10">
              <Leaf className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-emerald-200">{t(item.nameKey)}</span>
                <Badge className="ml-2 text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border">{t(item.impactKey)}</Badge>
                <p className="mt-0.5 text-muted-foreground">{t(item.noteKey)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
