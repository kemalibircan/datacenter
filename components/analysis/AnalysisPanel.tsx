"use client";
import type { SiteAnalysisResult, ExplanationCard } from "@/types/domain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScoreGauge, ConfidenceBadge } from "@/components/shared/ConfidenceBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { MapPin, Thermometer, Navigation, Shield, Info, ChevronRight, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AnalysisPanelProps {
  result: SiteAnalysisResult | null;
  isLoading: boolean;
  onSave?: () => void;
}

export function AnalysisPanel({ result, isLoading, onSave }: AnalysisPanelProps) {
  const [selectedCard, setSelectedCard] = useState<ExplanationCard | null>(null);
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        <p className="text-sm">{t("ap_loading")}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground px-6 text-center">
        <MapPin className="h-10 w-10 text-blue-400/40" />
        <div>
          <p className="text-sm font-medium text-foreground mb-1">{t("ap_empty_title")}</p>
          <p className="text-xs">{t("ap_empty_desc")}</p>
        </div>
      </div>
    );
  }

  const { location, compositeScore, climate, logistics, hazards, explanations } = result;
  
  const scoreColor =
    compositeScore.total >= 80 ? "text-emerald-400"
    : compositeScore.total >= 65 ? "text-green-400"
    : compositeScore.total >= 50 ? "text-yellow-400"
    : compositeScore.total >= 35 ? "text-orange-400"
    : "text-red-400";

  const suitabilityLabel = compositeScore.label.charAt(0).toUpperCase() + compositeScore.label.slice(1);

  return (
    <>
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          {/* Location Header */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold truncate">
                  {location.city ?? "Selected Location"}
                  {location.country && `, ${location.country}`}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{location.address ?? `${location.coordinates.lat.toFixed(4)}°, ${location.coordinates.lng.toFixed(4)}°`}</p>
              </div>
              {result.mockMode && (
                <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 shrink-0">
                  Demo
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-muted/30 rounded-md px-3 py-2">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("ap_coordinates")}</div>
                <div className="text-xs font-mono mt-0.5">
                  {location.coordinates.lat.toFixed(4)}°, {location.coordinates.lng.toFixed(4)}°
                </div>
              </div>
              <div className="bg-muted/30 rounded-md px-3 py-2">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("ap_elevation")}</div>
                <div className="text-xs font-mono mt-0.5">
                  {location.elevation !== null ? `${location.elevation.toFixed(0)} m` : "—"}
                  <span className="text-[9px] text-muted-foreground ml-1">ASL</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="opacity-30" />

          {/* Composite Score */}
          <div className="flex items-center gap-4">
            <ScoreGauge score={compositeScore.total} size="md" />
            <div className="flex-1">
              <div className={`text-xl font-bold ${scoreColor}`}>
                {suitabilityLabel}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {t("ap_score_label")}
              </div>
              <ConfidenceBadge
                confidence={compositeScore.confidence}
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Category Scores */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("ap_score_breakdown")}</p>
            {compositeScore.categories.map((cat) => {
              const catColor =
                cat.score >= 80 ? "bg-emerald-500"
                : cat.score >= 65 ? "bg-green-500"
                : cat.score >= 50 ? "bg-yellow-500"
                : cat.score >= 35 ? "bg-orange-500"
                : "bg-red-500";

              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{cat.label}</span>
                    <span className="font-mono font-medium">{cat.score}</span>
                  </div>
                  <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${catColor} rounded-full transition-all duration-700`}
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <Separator className="opacity-30" />

          {/* Quick Stats */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("ap_site_details")}</p>
            
            {climate && (
              <div className="flex items-center gap-2 text-xs">
                <Thermometer className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                <span className="text-muted-foreground">{t("ap_climate")}:</span>
                <span className="font-medium">
                  {climate.annualAvgTempC.toFixed(1)}°C avg • {climate.hotDaysPerYear} {t("compare_hot_days")}
                </span>
              </div>
            )}
            
            {logistics?.nearestAirportKm.found && (
              <div className="flex items-center gap-2 text-xs">
                <Navigation className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span className="text-muted-foreground">{t("ap_airport")}:</span>
                <span className="font-medium">{logistics.nearestAirportKm.distanceKm.toFixed(1)} km</span>
              </div>
            )}
            
            {hazards && (
              <div className="flex items-center gap-2 text-xs">
                <Shield className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                <span className="text-muted-foreground">{t("ap_flood")}:</span>
                <span className="font-medium capitalize">{hazards.floodRiskProxy.replace("-", " ")}</span>
                <span className="text-muted-foreground">| {t("ap_seismic")}:</span>
                <span className="font-medium capitalize">{hazards.seismicRiskProxy.replace("-", " ")}</span>
              </div>
            )}
          </div>

          {/* Explanation Cards */}
          {explanations.length > 0 && (
            <>
              <Separator className="opacity-30" />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("ap_metric_details")}</p>
                {explanations.slice(0, 6).map((card) => (
                  <button
                    key={card.metricId}
                    onClick={() => setSelectedCard(card)}
                    className="w-full flex items-center justify-between p-2.5 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Info className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      <div>
                        <div className="text-xs font-medium">{card.title}</div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-40">{card.valueDisplay}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-mono">{card.score}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          <Separator className="opacity-30" />

          {/* Actions */}
          <div className="space-y-2 pb-2">
            <Link
              href="/plan"
              className={buttonVariants({ className: "w-full bg-blue-600 hover:bg-blue-700 h-8 text-xs flex items-center gap-2" })}
            >
              {t("ap_plan_site")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            {onSave && (
              <Button variant="outline" className="w-full h-8 text-xs" onClick={onSave}>
                {t("ap_save")}
              </Button>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Explanation Card Modal */}
      <Dialog open={!!selectedCard} onOpenChange={(open) => !open && setSelectedCard(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {selectedCard && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">{selectedCard.title}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{selectedCard.valueDisplay}</span>
                  <div className="flex flex-col items-end gap-1">
                    <ScoreGauge score={selectedCard.score} size="sm" showLabel={false} />
                    <span className="text-xs text-muted-foreground">{t("ap_score_of")}: {selectedCard.score}/100</span>
                  </div>
                </div>

                <ConfidenceBadge confidence={selectedCard.confidenceLevel} dataSource={selectedCard.dataSource} />

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t("ap_why_matters")}</p>
                  <p className="text-sm text-muted-foreground">{selectedCard.importance}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t("ap_interpretation")}</p>
                  <p className="text-sm">{selectedCard.interpretation}</p>
                </div>

                {selectedCard.mitigationNote && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
                    <p className="text-xs font-semibold text-amber-400 mb-1">{t("ap_recommended_action")}</p>
                    <p className="text-xs text-amber-300/80">{selectedCard.mitigationNote}</p>
                  </div>
                )}

                {selectedCard.limitations.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t("ap_limitations")}</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {selectedCard.limitations.map((l, i) => (
                        <li key={i} className="flex gap-1.5">
                          <span className="text-orange-400 mt-0.5">•</span>
                          {l}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedCard.thresholds.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t("ap_score_reference")}</p>
                    <div className="rounded-md border border-border/40 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/30">
                          <tr>
                            <th className="text-left p-2 font-medium">{t("ap_range")}</th>
                            <th className="text-left p-2 font-medium">{t("ap_interpretation")}</th>
                            <th className="text-right p-2 font-medium">{t("ap_score_of")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCard.thresholds.map((row, i) => (
                            <tr key={i} className="border-t border-border/20">
                              <td className="p-2 font-mono">{row.range}</td>
                              <td className="p-2 text-muted-foreground">{row.interpretation}</td>
                              <td className="p-2 text-right font-mono">{row.score}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
