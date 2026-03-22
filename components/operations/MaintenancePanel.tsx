"use client";
import type { MaintenanceTask } from "@/types/domain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface MaintenancePanelProps {
  tasks: MaintenanceTask[];
}

function InfoTip({ text }: { text: string }) {
  return (
    <div className="mt-2 flex items-start gap-2 p-2.5 rounded bg-blue-500/5 border border-blue-500/15">
      <Info className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}

export function MaintenancePanel({ tasks }: MaintenancePanelProps) {
  const { t } = useLanguage();

  const overdue = tasks.filter(t => t.status === "overdue");
  const scheduled = tasks.filter(t => t.status === "scheduled");
  const inProgress = tasks.filter(t => t.status === "in-progress");

  const statusConfig = {
    overdue: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", icon: AlertTriangle },
    urgent: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
    important: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
    routine: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
    scheduled: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
    "in-progress": { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
    completed: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  };

  function daysUntil(date: Date): number {
    const diff = date.getTime() - Date.now();
    return Math.round(diff / 86_400_000);
  }

  const resilienceItems = [
    { ok: true, noteKey: "mt_res_dual_feeds" as const },
    { ok: overdue.length === 0, noteKey: overdue.length === 0 ? "mt_res_pm_ok" as const : "mt_res_pm_overdue" as const },
    { ok: true, noteKey: "mt_res_gen_test" as const },
    { ok: true, noteKey: "mt_res_ups_test" as const },
    { ok: false, noteKey: "mt_res_thermography" as const },
  ];

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { labelKey: "mt_overdue" as const, count: overdue.length, color: overdue.length > 0 ? "text-red-400" : "text-muted-foreground", bg: overdue.length > 0 ? "bg-red-500/5 border-red-500/20" : "bg-muted/20 border-border/30" },
          { labelKey: "mt_in_progress" as const, count: inProgress.length, color: "text-blue-400", bg: "bg-blue-500/5 border-blue-500/20" },
          { labelKey: "mt_scheduled" as const, count: scheduled.length, color: "text-emerald-400", bg: "bg-emerald-500/5 border-emerald-500/20" },
        ].map(s => (
          <div key={s.labelKey} className={cn("p-3 rounded-lg border text-center", s.bg)}>
            <div className={cn("text-2xl font-bold", s.color)}>{s.count}</div>
            <div className="text-xs text-muted-foreground">{t(s.labelKey)}</div>
          </div>
        ))}
      </div>

      {/* Overdue tasks — prominent */}
      {overdue.length > 0 && (
        <Card className="bg-red-500/5 border-red-500/20">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm text-red-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {t("mt_overdue_title")} ({overdue.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {overdue.map(task => (
              <div key={task.id} className="p-3 rounded-lg bg-card/60 border border-red-500/20 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="text-[10px] bg-red-500/10 text-red-400 border-red-500/30 border">{task.priority.toUpperCase()}</Badge>
                      <span className="text-[10px] text-muted-foreground">{task.id}</span>
                    </div>
                    <p className="text-sm font-medium mt-1">{task.description}</p>
                    <p className="text-xs text-muted-foreground">{task.system}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-red-400 text-xs font-medium">{Math.abs(daysUntil(task.dueDate))}{t("mt_days_overdue")}</div>
                    <div className="text-muted-foreground text-[10px]">{task.estimatedHours}{t("mt_hours_work")}</div>
                  </div>
                </div>
                <div className="text-xs text-amber-300/80 bg-amber-500/5 border border-amber-500/20 rounded p-2">
                  <span className="font-medium">{t("mt_risk_deferred")} </span>{task.impactIfDeferred}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* All Tasks */}
      <Card className="bg-card/60 border-border/40">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wrench className="h-4 w-4 text-blue-400" />
            {t("mt_schedule_title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {tasks.map(task => {
            const days = daysUntil(task.dueDate);
            const isOverdue = task.status === "overdue";
            const priorityC = statusConfig[task.priority] ?? statusConfig.routine;
            return (
              <div key={task.id} className={cn("p-3 rounded-lg border space-y-1.5", isOverdue ? "bg-red-500/5 border-red-500/20" : "bg-muted/10 border-border/30")}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Badge className={cn("text-[10px] border capitalize", priorityC.bg, priorityC.border, priorityC.color)}>{task.priority}</Badge>
                      <span className="text-[10px] text-muted-foreground">{task.system}</span>
                    </div>
                    <p className="text-xs font-medium mt-1">{task.description}</p>
                  </div>
                  <div className="text-right shrink-0 text-xs">
                    <div className={cn("font-medium", isOverdue ? "text-red-400" : days <= 7 ? "text-amber-400" : "text-muted-foreground")}>
                      {isOverdue ? `${Math.abs(days)}${t("mt_days_overdue")}` : days === 0 ? t("mt_due_today") : `${days}${t("mt_days")}`}
                    </div>
                    <div className="text-muted-foreground text-[10px]">{task.estimatedHours}h</div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Resilience Card */}
      <Card className="bg-card/60 border-border/40">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            {t("mt_resilience_title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          {resilienceItems.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              {item.ok
                ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                : <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              }
              <span className={item.ok ? "text-foreground/80" : "text-amber-300/80"}>{t(item.noteKey)}</span>
            </div>
          ))}
          <InfoTip text={t("mt_resilience_tip")} />
        </CardContent>
      </Card>
    </div>
  );
}
