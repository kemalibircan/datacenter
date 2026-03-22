"use client";
import type { TelemetrySnapshot } from "@/types/domain";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Wifi, Server, HardDrive, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface TrafficCapacityPanelProps {
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

function CapacityBar({ label, pct, icon: Icon }: { label: string; pct: number; icon: React.ComponentType<{ className?: string }> }) {
  const color = pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-blue-500";
  const textColor = pct >= 90 ? "text-red-400" : pct >= 75 ? "text-amber-400" : "text-blue-400";
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          <span>{label}</span>
        </div>
        <span className={cn("font-medium", textColor)}>{pct}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-muted/40 overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function TrafficCapacityPanel({ telemetry: tel, trend }: TrafficCapacityPanelProps) {
  const { t } = useLanguage();

  if (!tel) return <div className="text-muted-foreground text-sm p-4">{t("tc_no_data")}</div>;

  const networkData = trend.slice(-12).map((s, i) => ({
    time: `${i * 2}h`,
    In: s.inboundGbps,
    Out: s.outboundGbps,
  }));

  const computeData = trend.slice(-12).map((s, i) => ({
    time: `${i * 2}h`,
    Compute: s.computeUtilPercent,
    Racks: s.rackOccupancyPercent,
    Storage: s.storageUtilPercent,
  }));

  return (
    <div className="space-y-5">
      {/* Network Traffic */}
      <Card className="bg-card/60 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wifi className="h-4 w-4 text-purple-400" />
            {t("tc_network_title")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("tc_network_desc")} — {tel.bandwidthUtilPercent}% {t("tc_utilization")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{tel.inboundGbps} Gbps</div>
              <div className="text-xs text-muted-foreground">{t("tc_inbound")}</div>
            </div>
            <div className="flex-1 text-center">
              <div className={cn(
                "text-3xl font-bold",
                tel.bandwidthUtilPercent >= 90 ? "text-red-400" : tel.bandwidthUtilPercent >= 75 ? "text-amber-400" : "text-emerald-400"
              )}>
                {tel.bandwidthUtilPercent}%
              </div>
              <div className="text-xs text-muted-foreground">{t("tc_bandwidth_util")}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-400">{tel.outboundGbps} Gbps</div>
              <div className="text-xs text-muted-foreground">{t("tc_outbound")}</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={networkData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} unit=" G" />
              <Tooltip contentStyle={{ backgroundColor: "#1e2130", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="In" stroke="#a855f7" strokeWidth={2} dot={false} name="Inbound (Gbps)" />
              <Line type="monotone" dataKey="Out" stroke="#6366f1" strokeWidth={2} dot={false} name="Outbound (Gbps)" />
            </LineChart>
          </ResponsiveContainer>
          <InfoTip text={t("tc_network_tip")} />
        </CardContent>
      </Card>

      {/* Capacity Utilization */}
      <Card className="bg-card/60 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Server className="h-4 w-4 text-blue-400" />
            {t("tc_capacity_title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CapacityBar label={t("tc_compute_bar")} pct={tel.computeUtilPercent} icon={Server} />
          <CapacityBar label={t("tc_storage_bar")} pct={tel.storageUtilPercent} icon={HardDrive} />
          <CapacityBar label={t("tc_rack_bar")} pct={tel.rackOccupancyPercent} icon={Server} />
          <CapacityBar label={t("tc_bandwidth_bar")} pct={tel.bandwidthUtilPercent} icon={Wifi} />
          <InfoTip text={t("tc_capacity_tip")} />
        </CardContent>
      </Card>

      {/* Trend Chart */}
      <Card className="bg-card/60 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("tc_trend_title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={computeData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6b7280" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#6b7280" }} unit="%" />
              <Tooltip contentStyle={{ backgroundColor: "#1e2130", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="Compute" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Storage" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Racks" fill="#0ea5e9" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
