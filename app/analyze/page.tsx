"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useCallback, useState, Suspense } from "react";
import { NavBar } from "@/components/layout/NavBar";
import { MapSelector } from "@/components/map/MapSelector";
import { AnalysisPanel } from "@/components/analysis/AnalysisPanel";
import { ClimateChart } from "@/components/charts/ClimateChart";
import { useAnalysisStore } from "@/store/analysis.store";
import type { Coordinates, SiteAnalysisResult } from "@/types/domain";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentAnalysis, isAnalyzing, error, selectedCoords, setSelectedCoords, startAnalysis, setAnalysisResult, setError, saveCurrentAnalysis } = useAnalysisStore();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showChart, setShowChart] = useState(false);

  // Handle URL coords on mount (from demo scenario links)
  useEffect(() => {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    if (lat && lng) {
      const coords: Coordinates = { lat: parseFloat(lat), lng: parseFloat(lng) };
      setSelectedCoords(coords);
      triggerAnalysis(coords);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerAnalysis = useCallback(async (coords: Coordinates) => {
    startAnalysis();
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coords),
      });
      if (!res.ok) throw new Error("Analysis request failed");
      const result: SiteAnalysisResult = await res.json();
      setAnalysisResult(result);
      setShowChart(!!result.climate);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    }
  }, [startAnalysis, setAnalysisResult, setError]);

  const handleLocationSelected = useCallback((coords: Coordinates) => {
    setSelectedCoords(coords);
    triggerAnalysis(coords);
  }, [setSelectedCoords, triggerAnalysis]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`, {
        headers: { "User-Agent": "DC-SiteLab/1.0" }
      });
      const data = await res.json();
      if (data[0]) {
        const coords: Coordinates = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setSelectedCoords(coords);
        triggerAnalysis(coords);
      }
    } catch {
      // ignore
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <NavBar />
      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          {/* Search bar overlay */}
          <div className="absolute top-3 left-3 z-20 w-80">
            <form onSubmit={handleSearch} className="flex gap-1.5">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("analyze_search_placeholder")}
                className="h-9 text-sm bg-background/90 backdrop-blur-sm border-border/60"
              />
              <Button type="submit" size="sm" className="h-9 px-3 bg-blue-600 hover:bg-blue-700" disabled={isGeocoding}>
                {isGeocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </form>
          </div>

          <MapSelector
            initialCoords={selectedCoords ?? undefined}
            onLocationSelected={handleLocationSelected}
            analysisResult={currentAnalysis}
          />
        </div>

        {/* Analysis Panel */}
        <div className="w-80 xl:w-96 border-l border-border/40 bg-card/50 flex flex-col overflow-hidden">
          <AnalysisPanel
            result={currentAnalysis}
            isLoading={isAnalyzing}
            onSave={currentAnalysis ? saveCurrentAnalysis : undefined}
          />
        </div>
      </div>

      {/* Climate Chart */}
      {showChart && currentAnalysis?.climate && (
        <div className="border-t border-border/40 bg-card/30 p-4">
          <div className="max-w-4xl mx-auto">
            <ClimateChart climate={currentAnalysis.climate} />
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-destructive/90 text-destructive-foreground text-xs px-4 py-2 rounded-md shadow-lg max-w-xs">
          ⚠ {error}
        </div>
      )}
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-muted-foreground text-sm">Loading…</div>}>
      <AnalyzeContent />
    </Suspense>
  );
}
