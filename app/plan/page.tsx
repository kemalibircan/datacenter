"use client";
import { useSearchParams } from "next/navigation";
import { useMemo, Suspense, useState } from "react";

import Link from "next/link";
import { NavBar } from "@/components/layout/NavBar";
import { usePlanningStore } from "@/store/planning.store";
import { useAnalysisStore } from "@/store/analysis.store";
import type { PlanningInput, SiteAnalysisResult, PlanningRecommendation } from "@/types/domain";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfidenceBadge } from "@/components/shared/ConfidenceBadge";
import { Loader2, CheckCircle2, AlertTriangle, XCircle, ArrowLeft, GitCompare, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

function PlanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { planningInput, recommendation, isPlanning, error, setPlanningInput, startPlanning, setRecommendation, setError } = usePlanningStore();
  const { currentAnalysis, addToCompare, savedAnalyses } = useAnalysisStore();
  const [addedToCompare, setAddedToCompare] = useState(false);
  const { t, lang } = useLanguage();

  const analysis: SiteAnalysisResult | null = useMemo(() => {
    const raw = searchParams.get("analysis");
    if (raw) {
      try { return JSON.parse(decodeURIComponent(raw)); } catch { return null; }
    }
    return currentAnalysis;
  }, [searchParams, currentAnalysis]);

  const alreadyInCompare = analysis
    ? savedAnalyses.some(
        (a) =>
          a.location.coordinates.lat.toFixed(3) === analysis.location.coordinates.lat.toFixed(3) &&
          a.location.coordinates.lng.toFixed(3) === analysis.location.coordinates.lng.toFixed(3)
      )
    : false;

  const handleAddToCompare = () => {
    if (!analysis) return;
    addToCompare(analysis);
    setAddedToCompare(true);
    setTimeout(() => router.push("/compare"), 800);
  };

  const handleSubmit = async () => {
    if (!planningInput.whiteSpaceM2) return;
    startPlanning();
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planningInput, analysis, lang }),
      });
      if (!res.ok) throw new Error("Planning request failed");
      const result: PlanningRecommendation = await res.json();
      setRecommendation(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Planning failed");
    }
  };

  const verdictConfig = {
    "proceed": { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: t("plan_verdict_proceed") },
    "proceed-with-caution": { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", label: t("plan_verdict_caution") },
    "significant-concerns": { icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", label: t("plan_verdict_concerns") },
    "not-recommended": { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", label: t("plan_verdict_not_recommended") },
  };

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/analyze" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 text-xs text-muted-foreground flex items-center gap-1")}>
            <ArrowLeft className="h-3.5 w-3.5" />{t("plan_back")}
          </Link>
          <div>
            <h1 className="text-xl font-bold">{t("plan_title")}</h1>
            <p className="text-xs text-muted-foreground">
              {analysis ? `${t("plan_based_on")} ${analysis.location.city ?? "Selected location"}` : t("plan_no_analysis")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Planning Input Form */}
          <Card className="bg-card/60 border-border/40">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm">{t("plan_requirements")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">{t("plan_white_space")}</label>
                  <span className="text-sm font-mono font-bold text-blue-400">{planningInput.whiteSpaceM2 ?? 400} m²</span>
                </div>
                <Slider min={50} max={5000} step={50} value={[planningInput.whiteSpaceM2 ?? 400]} onValueChange={(v: number | readonly number[]) => setPlanningInput({ whiteSpaceM2: Array.isArray(v) ? (v as number[])[0] : (v as number) })} />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>50 m²</span><span>{t("plan_small_edge")}</span><span>5,000 m²</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">{t("plan_rack_density")}</label>
                  <span className="text-sm font-mono font-bold text-blue-400">{planningInput.rackDensityKw ?? 8} kW/rack</span>
                </div>
                <Slider min={2} max={60} step={1} value={[planningInput.rackDensityKw ?? 8]} onValueChange={(v: number | readonly number[]) => setPlanningInput({ rackDensityKw: Array.isArray(v) ? (v as number[])[0] : (v as number) })} />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>2 kW (basic)</span><span>15 kW (dense)</span><span>60 kW (AI/HPC)</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">{t("plan_growth_horizon")}</label>
                  <span className="text-sm font-mono font-bold text-blue-400">{planningInput.growthYears ?? 5} {t("plan_years")}</span>
                </div>
                <Slider min={1} max={20} step={1} value={[planningInput.growthYears ?? 5]} onValueChange={(v: number | readonly number[]) => setPlanningInput({ growthYears: Array.isArray(v) ? (v as number[])[0] : (v as number) })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{t("plan_workload")}</label>
                  <Select value={planningInput.workloadType ?? "general-it"} onValueChange={(v) => setPlanningInput({ workloadType: v as PlanningInput["workloadType"] })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general-it" className="text-xs">{t("plan_workload_general")}</SelectItem>
                      <SelectItem value="mixed" className="text-xs">{t("plan_workload_mixed")}</SelectItem>
                      <SelectItem value="hpc" className="text-xs">{t("plan_workload_hpc")}</SelectItem>
                      <SelectItem value="ai-gpu" className="text-xs">{t("plan_workload_ai")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{t("plan_availability")}</label>
                  <Select value={planningInput.availabilityTier ?? "N+1"} onValueChange={(v) => setPlanningInput({ availabilityTier: v as PlanningInput["availabilityTier"] })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N" className="text-xs">{t("plan_avail_n")}</SelectItem>
                      <SelectItem value="N+1" className="text-xs">{t("plan_avail_n1")}</SelectItem>
                      <SelectItem value="2N" className="text-xs">{t("plan_avail_2n")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{t("plan_sustainability")}</label>
                  <Select value={planningInput.sustainabilityPriority ?? "medium"} onValueChange={(v) => setPlanningInput({ sustainabilityPriority: v as PlanningInput["sustainabilityPriority"] })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low" className="text-xs">{t("plan_sus_low")}</SelectItem>
                      <SelectItem value="medium" className="text-xs">{t("plan_sus_medium")}</SelectItem>
                      <SelectItem value="high" className="text-xs">{t("plan_sus_high")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{t("plan_water")}</label>
                  <Select value={planningInput.waterSensitivity ?? "medium"} onValueChange={(v) => setPlanningInput({ waterSensitivity: v as PlanningInput["waterSensitivity"] })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low" className="text-xs">{t("plan_water_low")}</SelectItem>
                      <SelectItem value="medium" className="text-xs">{t("plan_water_medium")}</SelectItem>
                      <SelectItem value="high" className="text-xs">{t("plan_water_high")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSubmit} disabled={isPlanning} className="w-full bg-blue-600 hover:bg-blue-700">
                {isPlanning ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t("plan_generating")}</> : t("plan_generate")}
              </Button>

              {analysis && (
                <Button
                  onClick={handleAddToCompare}
                  disabled={addedToCompare || alreadyInCompare}
                  variant="outline"
                  className="w-full h-9 text-sm flex items-center gap-2"
                >
                  {addedToCompare || alreadyInCompare ? (
                    <><Check className="h-4 w-4 text-emerald-400" />{alreadyInCompare && !addedToCompare ? t("plan_already_compare") : t("plan_added_compare")}</>
                  ) : (
                    <><GitCompare className="h-4 w-4" />{t("plan_add_compare")}</>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Recommendation Output */}
          {recommendation ? (
            <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              {(() => {
                const vc = verdictConfig[recommendation.verdictLabel];
                const VIcon = vc.icon;
                return (
                  <div className={`rounded-lg border p-4 ${vc.bg}`}>
                    <div className={`flex items-center gap-2 font-semibold mb-2 ${vc.color}`}>
                      <VIcon className="h-5 w-5" />{vc.label}
                    </div>
                    <p className="text-sm text-muted-foreground">{recommendation.suitabilityVerdict}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <ConfidenceBadge confidence={recommendation.confidenceLevel} />
                    </div>
                  </div>
                );
              })()}

              <Card className="bg-card/60 border-border/40">
                <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">{t("plan_gross_area")}</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-400">
                    {recommendation.totalGrossEstimateM2.min.toLocaleString()}–{recommendation.totalGrossEstimateM2.max.toLocaleString()} m²
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("plan_multiplier")}: {recommendation.grossToNetMultiplier.min}×–{recommendation.grossToNetMultiplier.max}× {t("plan_white_space_label")}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/60 border-border/40">
                <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">{t("plan_space_breakdown")}</CardTitle></CardHeader>
                <CardContent className="space-y-2.5">
                  {recommendation.spaceAllocations.map((alloc) => (
                    <div key={alloc.category} className="text-xs">
                      <div className="flex items-start justify-between mb-0.5">
                        <span className="text-muted-foreground leading-snug">{alloc.category}</span>
                        <span className="font-mono font-semibold shrink-0 ml-2">{alloc.minM2}–{alloc.maxM2} m²</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground/70">{alloc.notes}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-card/60 border-border/40">
                <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">{t("plan_cooling_strategy")}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                    {recommendation.coolingRecommendation.label}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{recommendation.coolingRecommendation.rationale}</p>
                  {recommendation.coolingRecommendation.supplementalNote && (
                    <p className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded p-2">
                      💡 {recommendation.coolingRecommendation.supplementalNote}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-emerald-400 font-semibold mb-1">{t("plan_pros")}</p>
                      {recommendation.coolingRecommendation.pros.map((p) => (
                        <p key={p} className="text-[10px] text-muted-foreground">+ {p}</p>
                      ))}
                    </div>
                    <div>
                      <p className="text-[10px] text-red-400 font-semibold mb-1">{t("plan_cons")}</p>
                      {recommendation.coolingRecommendation.cons.map((c) => (
                        <p key={c} className="text-[10px] text-muted-foreground">− {c}</p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/60 border-border/40">
                <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">{t("plan_electrical")}</CardTitle></CardHeader>
                <CardContent className="text-xs space-y-2">
                  <p className="font-mono text-blue-400 text-sm">{recommendation.electricalConcept.conceptualConfig}</p>
                  <p className="text-muted-foreground">{recommendation.electricalConcept.redundancyNote}</p>
                </CardContent>
              </Card>

              {recommendation.operationalWarnings.length > 0 && (
                <Card className="bg-orange-500/5 border-orange-500/20">
                  <CardHeader className="pb-2"><CardTitle className="text-xs text-orange-400 uppercase tracking-wide">⚠ {t("plan_warnings")}</CardTitle></CardHeader>
                  <CardContent>
                    {recommendation.operationalWarnings.map((w, i) => (
                      <p key={i} className="text-xs text-muted-foreground mb-2">• {w}</p>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card className="bg-card/60 border-border/40">
                <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">{t("plan_actions")}</CardTitle></CardHeader>
                <CardContent>
                  {recommendation.mitigationRecommendations.map((m, i) => (
                    <p key={i} className="text-xs text-muted-foreground mb-2">→ {m}</p>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm border border-border/40 rounded-lg bg-card/20">
              <div className="text-center p-6">
                <p className="text-base font-medium mb-1">{t("plan_configure")}</p>
                <p className="text-xs">{t("plan_configure_desc")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>}>
      <PlanContent />
    </Suspense>
  );
}
