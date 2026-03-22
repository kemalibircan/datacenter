"use client";
import type { AlarmEvent, IncidentRecord } from "@/types/domain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Info, Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface EventsAlarmsPanelProps {
  alarms: AlarmEvent[];
  incidents: IncidentRecord[];
  onAcknowledge: (id: string) => void;
}

const SEVERITY_CONFIG = {
  critical: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", badge: "bg-red-500/10 text-red-400 border-red-500/30" },
  warning: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", badge: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  info: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", badge: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
};

const INCIDENT_SEVERITY = {
  P1: { color: "text-red-400", label: "P1 — Critical" },
  P2: { color: "text-orange-400", label: "P2 — High" },
  P3: { color: "text-amber-400", label: "P3 — Medium" },
  P4: { color: "text-blue-400", label: "P4 — Low" },
};

export function EventsAlarmsPanel({ alarms, incidents, onAcknowledge }: EventsAlarmsPanelProps) {
  const { t } = useLanguage();

  const critCount = alarms.filter(a => a.severity === "critical").length;
  const warnCount = alarms.filter(a => a.severity === "warning").length;
  const unacked = alarms.filter(a => !a.acknowledged).length;
  const openIncidents = incidents.filter(i => i.status !== "resolved" && i.status !== "closed");

  return (
    <div className="space-y-5">
      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        <Badge className={cn("border text-xs", critCount > 0 ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-muted text-muted-foreground border-border/40")}>
          <AlertTriangle className="h-3 w-3 mr-1" />
          {critCount} {t("ov_status_critical")}
        </Badge>
        <Badge className={cn("border text-xs", warnCount > 0 ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-muted text-muted-foreground border-border/40")}>
          {warnCount} {t("ov_status_warning")}
        </Badge>
        <Badge className="border text-xs bg-muted text-muted-foreground border-border/40">
          {alarms.length - critCount - warnCount} {t("ops_info")}
        </Badge>
        <Badge className={cn("border text-xs ml-auto", unacked > 0 ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-muted text-muted-foreground border-border/30")}>
          <Bell className="h-3 w-3 mr-1" />
          {unacked} {t("ea_unacked")}
        </Badge>
      </div>

      {/* Open Incidents */}
      {openIncidents.length > 0 && (
        <Card className="bg-red-500/5 border-red-500/20">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm text-red-300">{t("ea_active_incidents")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {openIncidents.map(inc => {
              const sc = INCIDENT_SEVERITY[inc.severity];
              return (
                <div key={inc.id} className="p-3 rounded-lg bg-card/60 border border-red-500/20 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-bold", sc.color)}>{sc.label}</span>
                        <Badge variant="outline" className="text-[10px] border-border/40">{inc.id}</Badge>
                        <Badge variant="outline" className={cn("text-[10px]", inc.status === "open" ? "text-red-400 border-red-500/30" : "text-amber-400 border-amber-500/30")}>
                          {inc.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium mt-1">{inc.title}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div><span className="text-foreground/60">{t("ea_root_cause")}</span> {inc.rootCauseHint}</div>
                    <div><span className="text-foreground/60">{t("ea_response_team")}</span> {inc.responseTeam}</div>
                    <div><span className="text-foreground/60">{t("ea_sla_target")}</span> {inc.slaTarget}</div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Alarm Feed */}
      <Card className="bg-card/60 border-border/40">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm">{t("ea_alarm_feed")}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {alarms.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm py-4 justify-center">
              <CheckCircle2 className="h-4 w-4" />
              {t("ea_no_alarms")}
            </div>
          ) : (
            alarms.map(alarm => {
              const sc = SEVERITY_CONFIG[alarm.severity];
              return (
                <div key={alarm.id} className={cn(
                  "p-3 rounded-lg border space-y-2 transition-opacity",
                  sc.bg, sc.border,
                  alarm.acknowledged ? "opacity-60" : ""
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={cn("h-3.5 w-3.5 flex-shrink-0 mt-0.5", sc.color)} />
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-[10px] border", sc.badge)}>{alarm.severity}</Badge>
                          <Badge variant="outline" className="text-[10px] border-border/30 uppercase">{alarm.category}</Badge>
                          {alarm.acknowledged && <BellOff className="h-3 w-3 text-muted-foreground" />}
                        </div>
                        <p className="text-sm font-medium mt-1">{alarm.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{alarm.message}</p>
                      </div>
                    </div>
                    {!alarm.acknowledged && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs shrink-0"
                        onClick={() => onAcknowledge(alarm.id)}
                      >
                        {t("ea_ack")}
                      </Button>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground/80 bg-black/20 rounded p-2">
                    <span className="font-medium text-foreground/60">{t("ea_action")} </span>{alarm.recommendedAction}
                  </div>
                  {alarm.educationalNote && (
                    <div className="flex items-start gap-1.5 text-xs text-blue-300/70">
                      <Info className="h-3 w-3 flex-shrink-0 mt-0.5 text-blue-400" />
                      <span>{alarm.educationalNote}</span>
                    </div>
                  )}
                  <div className="text-[10px] text-muted-foreground/50">
                    {alarm.timestamp.toLocaleTimeString()} · {alarm.id}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Educational Card */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm text-blue-300">{t("ea_edu_title")}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 text-xs text-muted-foreground space-y-2 leading-relaxed">
          <p>{t("ea_edu_p1")}</p>
          <ul className="space-y-1 ml-2">
            <li><span className="text-red-400">■</span> <strong className="text-foreground/80">{t("ea_edu_critical")}</strong></li>
            <li><span className="text-amber-400">■</span> <strong className="text-foreground/80">{t("ea_edu_warning")}</strong></li>
            <li><span className="text-blue-400">■</span> <strong className="text-foreground/80">{t("ea_edu_info")}</strong></li>
          </ul>
          <p>{t("ea_edu_p2")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
