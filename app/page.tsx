"use client";
import Link from "next/link";
import { NavBar } from "@/components/layout/NavBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEMO_SCENARIOS } from "@/features/scenarios/config";
import {
  Map,
  BarChart3,
  GitCompare,
  ChevronRight,
  Layers,
  Zap,
  Shield,
  Thermometer,
  BookOpen,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

const BTN_PRIMARY = "inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium whitespace-nowrap transition-all";
const BTN_OUTLINE = "inline-flex items-center justify-center rounded-lg border border-border text-sm font-medium whitespace-nowrap transition-all hover:bg-muted";

export default function LandingPage() {
  const { t } = useLanguage();

  const FEATURES = [
    { icon: Map, title: t("feat_analysis_title"), description: t("feat_analysis_desc"), color: "text-blue-400", bg: "bg-blue-500/10" },
    { icon: BarChart3, title: t("feat_planning_title"), description: t("feat_planning_desc"), color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { icon: Activity, title: t("feat_operations_title"), description: t("feat_operations_desc"), color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { icon: GitCompare, title: t("feat_compare_title"), description: t("feat_compare_desc"), color: "text-purple-400", bg: "bg-purple-500/10" },
    { icon: BookOpen, title: t("feat_educational_title"), description: t("feat_educational_desc"), color: "text-amber-400", bg: "bg-amber-500/10" },
    { icon: Shield, title: t("feat_honest_title"), description: t("feat_honest_desc"), color: "text-rose-400", bg: "bg-rose-500/10" },
    { icon: Zap, title: t("feat_demo_title"), description: t("feat_demo_desc"), color: "text-yellow-400", bg: "bg-yellow-500/10" },
  ];

  const WHAT_IS_EVALUATED = [
    { icon: Thermometer, label: t("home_eval_climate") },
    { icon: Shield, label: t("home_eval_hazards") },
    { icon: Zap, label: t("home_eval_logistics") },
    { icon: Layers, label: t("home_eval_infra") },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-4 py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "linear-gradient(rgba(59,130,246,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.4) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <Badge className="mb-6 bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs px-3 py-1">
            {t("home_badge")}
          </Badge>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-br from-white via-white/90 to-blue-300 bg-clip-text text-transparent">
            {t("home_hero_title_1")}
            <br />
            <span className="text-blue-400">{t("home_hero_title_2")}</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("home_hero_desc")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/analyze" className={cn(BTN_PRIMARY, "bg-blue-600 hover:bg-blue-700 h-12 px-8 gap-2")}>
              {t("home_btn_start_analysis")} <ChevronRight className="h-4 w-4" />
            </Link>
            <Link href="/operations" className={cn(BTN_PRIMARY, "bg-cyan-700 hover:bg-cyan-600 h-12 px-8 gap-2")}>
              <Activity className="h-4 w-4" /> {t("home_btn_operations")}
            </Link>
            <Link href="/scenarios" className={cn(BTN_OUTLINE, "h-12 px-8")}>
              {t("home_btn_scenarios")}
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {WHAT_IS_EVALUATED.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/40 bg-card/40 text-sm text-muted-foreground">
                <Icon className="h-3.5 w-3.5 text-blue-400" />{label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-3 bg-amber-500/10 border-y border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2 text-sm text-amber-300">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span><strong>{t("home_disclaimer").split(".")[0]}.</strong> {t("home_disclaimer").split(".").slice(1).join(".").trim()}</span>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">{t("home_features_title")}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("home_features_desc")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, description, color, bg }) => (
              <Card key={title} className="bg-card/60 border-border/40 hover:border-border/80 transition-colors">
                <CardHeader className="pb-3">
                  <div className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Scenarios */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">{t("home_scenarios_title")}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("home_scenarios_desc")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {DEMO_SCENARIOS.map((scenario) => (
              <Card key={scenario.id} className="bg-card/60 border-border/40 hover:border-blue-500/30 transition-all hover:-translate-y-0.5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{scenario.label}</CardTitle>
                  <p className="text-xs text-muted-foreground">{scenario.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {scenario.highlights.map((h) => (
                      <Badge key={h} variant="secondary" className="text-[10px]">{h}</Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                    {scenario.teachingPoints.map((pt) => (
                      <li key={pt} className="flex gap-1.5"><span className="text-blue-400 mt-0.5">•</span>{pt}</li>
                    ))}
                  </ul>
                  <Link
                    href={`/analyze?lat=${scenario.coordinates.lat}&lng=${scenario.coordinates.lng}`}
                    className={cn(BTN_OUTLINE, "w-full text-xs gap-1 px-3 py-1.5 h-8")}
                  >
                    {t("home_analyze_site")} <ChevronRight className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">{t("home_cta_title")}</h2>
          <p className="text-muted-foreground mb-8">{t("home_cta_desc")}</p>
          <Link href="/analyze" className={cn(BTN_PRIMARY, "bg-blue-600 hover:bg-blue-700 px-6 py-2")}>
            {t("home_cta_btn")}
          </Link>
        </div>
      </section>

      <footer className="py-6 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-muted-foreground">
          {t("home_footer")}
          <br />
          {t("home_footer_data")}
        </div>
      </footer>
    </div>
  );
}
