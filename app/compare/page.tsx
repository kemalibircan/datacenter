"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/layout/NavBar";
import { useAnalysisStore } from "@/store/analysis.store";
import type { SiteAnalysisResult } from "@/types/domain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ScoreGauge } from "@/components/shared/ConfidenceBadge";
import { Trash2, Plus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

function SiteColumn({ analysis, onRemove, onPlan }: { analysis: SiteAnalysisResult; onRemove: () => void; onPlan: () => void }) {
  const { t } = useLanguage();
  const scoreColor = analysis.compositeScore.total >= 65 ? "text-green-400" :
    analysis.compositeScore.total >= 50 ? "text-yellow-400" :
    analysis.compositeScore.total >= 35 ? "text-orange-400" : "text-red-400";

  return (
    <Card className="bg-card/60 border-border/40 flex-1 min-w-0">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm truncate">
              {analysis.location.city ?? t("compare_unknown")}
              {analysis.location.country && `, ${analysis.location.country}`}
            </CardTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
              {analysis.location.coordinates.lat.toFixed(3)}°, {analysis.location.coordinates.lng.toFixed(3)}°
            </p>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={onRemove}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex justify-center mt-2">
          <ScoreGauge score={analysis.compositeScore.total} size="lg" />
        </div>
        <p className={`text-center text-sm font-semibold mt-1 ${scoreColor}`}>
          {analysis.compositeScore.label.charAt(0).toUpperCase() + analysis.compositeScore.label.slice(1)}
        </p>
      </CardHeader>

      <CardContent className="space-y-2 text-xs">
        {analysis.compositeScore.categories.map((cat) => (
          <div key={cat.id}>
            <div className="flex justify-between mb-0.5">
              <span className="text-muted-foreground">{cat.label}</span>
              <span className="font-mono">{cat.score}</span>
            </div>
            <div className="h-1 bg-muted/30 rounded-full">
              <div
                className={`h-full rounded-full ${cat.score >= 65 ? "bg-green-500" : cat.score >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${cat.score}%` }}
              />
            </div>
          </div>
        ))}

        <div className="pt-2 border-t border-border/30 space-y-1 text-muted-foreground">
          {analysis.location.elevation !== null && (
            <div className="flex justify-between">
              <span>{t("compare_elevation")}</span>
              <span className="font-mono">{analysis.location.elevation.toFixed(0)} m</span>
            </div>
          )}
          {analysis.climate && (
            <div className="flex justify-between">
              <span>{t("compare_avg_temp")}</span>
              <span className="font-mono">{analysis.climate.annualAvgTempC.toFixed(1)}°C</span>
            </div>
          )}
          {analysis.climate && (
            <div className="flex justify-between">
              <span>{t("compare_hot_days")}</span>
              <span className="font-mono">{analysis.climate.hotDaysPerYear}</span>
            </div>
          )}
          {analysis.logistics?.nearestAirportKm.found && (
            <div className="flex justify-between">
              <span>{t("compare_airport")}</span>
              <span className="font-mono">{analysis.logistics.nearestAirportKm.distanceKm.toFixed(1)} km</span>
            </div>
          )}
          {analysis.hazards && (
            <div className="flex justify-between">
              <span>{t("compare_seismic")}</span>
              <Badge variant="outline" className="text-[9px] h-4 capitalize">{analysis.hazards.seismicRiskProxy}</Badge>
            </div>
          )}
          {analysis.hazards && (
            <div className="flex justify-between">
              <span>{t("compare_flood")}</span>
              <Badge variant="outline" className="text-[9px] h-4 capitalize">{analysis.hazards.floodRiskProxy}</Badge>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-xs flex items-center gap-1"
          onClick={onPlan}
        >
          {t("compare_plan_site")} <ArrowRight className="h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ComparePage() {
  const router = useRouter();
  const { savedAnalyses, removeSavedAnalysis, setAnalysisResult } = useAnalysisStore();
  const { t } = useLanguage();

  const handlePlan = (analysis: SiteAnalysisResult) => {
    setAnalysisResult(analysis);
    router.push("/plan");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">{t("compare_title")}</h1>
            <p className="text-sm text-muted-foreground">
              {savedAnalyses.length} {savedAnalyses.length !== 1 ? t("compare_saved_plural") : t("compare_saved")} — {t("compare_hint")}
            </p>
          </div>
          <Link href="/analyze" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 text-xs flex items-center gap-1.5")}>
            <Plus className="h-3.5 w-3.5" />{t("compare_add_site")}
          </Link>
        </div>

        {savedAnalyses.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-medium mb-2">{t("compare_no_analyses")}</p>
            <p className="text-sm mb-6">{t("compare_no_analyses_desc")}</p>
            <Link href="/analyze" className={cn(buttonVariants(), "bg-blue-600 hover:bg-blue-700")}>
              {t("compare_start")}
            </Link>
          </div>
        ) : (
          <div className="flex gap-4 items-start overflow-x-auto pb-4">
            {savedAnalyses.map((analysis) => (
              <SiteColumn
                key={analysis.id ?? analysis.location.coordinates.lat}
                analysis={analysis}
                onRemove={() => analysis.id && removeSavedAnalysis(analysis.id)}
                onPlan={() => handlePlan(analysis)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
