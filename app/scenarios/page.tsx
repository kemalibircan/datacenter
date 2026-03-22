"use client";
import Link from "next/link";
import { NavBar } from "@/components/layout/NavBar";
import { DEMO_SCENARIOS } from "@/features/scenarios/config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

const BTN_PRIMARY = "inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium whitespace-nowrap transition-all";
const BTN_OUTLINE = "inline-flex items-center justify-center rounded-lg border border-border text-sm font-medium whitespace-nowrap transition-all hover:bg-muted";

export default function ScenariosPage() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-10">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">{t("scenarios_title")}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t("scenarios_desc")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {DEMO_SCENARIOS.map((scenario) => (
            <Card key={scenario.id} className="bg-card/60 border-border/40 hover:border-blue-500/30 transition-all flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{scenario.label}</CardTitle>
                <CardDescription className="text-xs">{scenario.description}</CardDescription>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {scenario.highlights.map((h) => (
                    <Badge key={h} variant="secondary" className="text-[10px]">{h}</Badge>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{t("scenarios_teaching_points")}</p>
                  <ul className="space-y-1.5">
                    {scenario.teachingPoints.map((pt) => (
                      <li key={pt} className="text-xs text-muted-foreground flex gap-1.5">
                        <span className="text-blue-400 shrink-0 mt-0.5">•</span>{pt}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2 pt-2">
                  <Link href={`/analyze?lat=${scenario.coordinates.lat}&lng=${scenario.coordinates.lng}`}
                    className={cn(BTN_PRIMARY, "flex-1 bg-blue-600 hover:bg-blue-700 h-8 text-xs gap-1 px-3")}
                  >
                    {t("scenarios_analyze")} <ChevronRight className="h-3 w-3" />
                  </Link>
                  <Link href={`/plan?lat=${scenario.coordinates.lat}&lng=${scenario.coordinates.lng}`}
                    className={cn(BTN_OUTLINE, "flex-1 h-8 text-xs gap-1 px-3")}
                  >
                    {t("scenarios_plan")} <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 p-5 rounded-lg bg-blue-500/5 border border-blue-500/10 text-center">
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            <span className="text-blue-400 font-semibold">{t("scenarios_tip")}</span> {t("scenarios_tip_desc")}
          </p>
        </div>
      </div>
    </div>
  );
}
