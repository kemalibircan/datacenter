"use client";
import { MONITORING_SCENARIOS } from "@/services/monitoring.service";
import type { MonitoringScenarioId } from "@/types/domain";
import { cn } from "@/lib/utils";
import { CheckCircle2, Cpu, Thermometer, Zap, Wrench, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/LanguageContext";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  CheckCircle2, Cpu, Thermometer, Zap, Wrench, TrendingUp,
};

interface ScenarioSelectorProps {
  selectedId: MonitoringScenarioId;
  onSelect: (id: MonitoringScenarioId) => void;
}

export function ScenarioSelector({ selectedId, onSelect }: ScenarioSelectorProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold">{t("ss_title")}</h3>
          <p className="text-xs text-muted-foreground">{t("ss_desc")}</p>
        </div>
        <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400">
          {t("ss_simulated")}
        </Badge>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {MONITORING_SCENARIOS.map((s) => {
          const Icon = ICON_MAP[s.icon] ?? CheckCircle2;
          const isSelected = s.id === selectedId;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={cn(
                "flex flex-col gap-1.5 p-3 rounded-lg border text-left transition-all",
                isSelected
                  ? "border-blue-500/60 bg-blue-500/10 text-blue-300"
                  : "border-border/40 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", isSelected ? "text-blue-400" : "text-muted-foreground")} />
              <span className="text-xs font-medium leading-tight">{s.label}</span>
            </button>
          );
        })}
      </div>
      {/* Educational note for selected scenario */}
      <div className="mt-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
        <p className="text-xs text-blue-300/80 leading-relaxed">
          <span className="font-semibold text-blue-400">{t("ss_why_matters")} </span>
          {MONITORING_SCENARIOS.find(s => s.id === selectedId)?.educationalNote}
        </p>
      </div>
    </div>
  );
}
