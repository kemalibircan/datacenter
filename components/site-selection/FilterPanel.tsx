"use client";
import React from "react";
import { useSiteSelectionStore } from "@/store/site-selection.store";
import {
  TIER_CRITERIA,
  CRITERION_LAYERS,
  TIER_LABELS,
  type TierLevel,
} from "@/rules/tier-criteria";
import { useLanguage } from "@/context/LanguageContext";
import {
  Zap,
  Plane,
  Fuel,
  Route,
  Cross,
  Flame,
  Droplets,
  Layers,
  Eye,
  EyeOff,
  Settings2,
  MapPin,
  RotateCcw,
} from "lucide-react";

const ICONS: Record<string, React.ElementType> = {
  Zap,
  Plane,
  Fuel,
  Route,
  Cross,
  Flame,
  Droplets,
};

const LAYER_NAMES: Record<string, { en: string; tr: string }> = {
  powerPlant: { en: "Power Plant", tr: "Enerji Santrali" },
  flightPath: { en: "Flight Path", tr: "Uçuş Yolu" },
  fuelStation: { en: "Fuel Station", tr: "Yakıt İstasyonu" },
  highway: { en: "Highway", tr: "Otoyol" },
  hospital: { en: "Hospital", tr: "Hastane" },
  fireStation: { en: "Fire Station", tr: "İtfaiye" },
  waterBody: { en: "Water Body", tr: "Su Kaynağı" },
};

const WORKLOAD_LABELS: Record<string, { en: string; tr: string }> = {
  "general-it": { en: "General IT", tr: "Genel IT" },
  hpc: { en: "HPC", tr: "Yüksek Performans" },
  "ai-gpu": { en: "AI / GPU", tr: "AI / GPU" },
  mixed: { en: "Mixed", tr: "Karma" },
};

// Max slider values per layer (reasonable max for each criterion)
const RADIUS_MAX: Record<string, number> = {
  powerPlant: 80,
  flightPath: 30,
  fuelStation: 50,
  highway: 40,
  hospital: 60,
  fireStation: 30,
  waterBody: 10,
};

export function FilterPanel() {
  const {
    dcSpecs,
    setDCSpecs,
    layers,
    toggleLayer,
    setAllLayers,
    showHeatMap,
    toggleHeatMap,
    layerRadii,
    setLayerRadius,
    resetLayerRadii,
    isLoadingPOIs,
  } = useSiteSelectionStore();
  const { lang } = useLanguage();

  const criteria = TIER_CRITERIA[dcSpecs.tierLevel];
  const tierLabel = TIER_LABELS[dcSpecs.tierLevel];
  const allVisible = Object.values(layers).every(Boolean);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* DC Specs */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Settings2 className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">
              {lang === "tr" ? "DC Özellikleri" : "DC Specifications"}
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {lang === "tr"
                ? "Veri merkezi parametrelerini ayarlayın"
                : "Configure data center parameters"}
            </p>
          </div>
        </div>

        {/* Tier Level */}
        <label className="block mb-3">
          <span className="text-xs font-medium text-muted-foreground mb-1 block">
            {lang === "tr" ? "Tier Seviyesi" : "Tier Level"}
          </span>
          <select
            value={dcSpecs.tierLevel}
            onChange={(e) =>
              setDCSpecs({ tierLevel: Number(e.target.value) as TierLevel })
            }
            className="w-full h-9 rounded-md border border-border/60 bg-background/80 px-3 text-sm focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-colors"
          >
            {([1, 2, 3, 4] as TierLevel[]).map((tier) => (
              <option key={tier} value={tier}>
                {lang === "tr" ? TIER_LABELS[tier].tr : TIER_LABELS[tier].en}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-muted-foreground mt-1 block">
            {lang === "tr"
              ? tierLabel.description.tr
              : tierLabel.description.en}
          </span>
        </label>

        {/* Closed Area */}
        <label className="block mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">
              {lang === "tr" ? "Kapalı Alan" : "Closed Area"}
            </span>
            <span className="text-xs font-mono text-blue-400">
              {dcSpecs.closedAreaM2.toLocaleString()} m²
            </span>
          </div>
          <input
            type="range"
            min={500}
            max={50000}
            step={500}
            value={dcSpecs.closedAreaM2}
            onChange={(e) =>
              setDCSpecs({ closedAreaM2: Number(e.target.value) })
            }
            className="w-full h-1.5 accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground/60 mt-0.5">
            <span>500 m²</span>
            <span>
              Min: {criteria.minClosedAreaM2.toLocaleString()} m²
            </span>
            <span>50,000 m²</span>
          </div>
        </label>

        {/* Power MW */}
        <label className="block mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">
              {lang === "tr" ? "Güç Kapasitesi" : "Power Capacity"}
            </span>
            <span className="text-xs font-mono text-blue-400">
              {dcSpecs.powerMW} MW
            </span>
          </div>
          <input
            type="range"
            min={0.5}
            max={100}
            step={0.5}
            value={dcSpecs.powerMW}
            onChange={(e) =>
              setDCSpecs({ powerMW: Number(e.target.value) })
            }
            className="w-full h-1.5 accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground/60 mt-0.5">
            <span>0.5 MW</span>
            <span>Min: {criteria.minPowerCapacityMW} MW</span>
            <span>100 MW</span>
          </div>
        </label>

        {/* Workload Type */}
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground mb-1 block">
            {lang === "tr" ? "İş Yükü Tipi" : "Workload Type"}
          </span>
          <select
            value={dcSpecs.workloadType}
            onChange={(e) =>
              setDCSpecs({
                workloadType: e.target.value as DCSpecsWorkload,
              })
            }
            className="w-full h-9 rounded-md border border-border/60 bg-background/80 px-3 text-sm focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-colors"
          >
            {Object.entries(WORKLOAD_LABELS).map(([key, labels]) => (
              <option key={key} value={key}>
                {lang === "tr" ? labels.tr : labels.en}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Layer Toggles + Radius Sliders */}
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">
              {lang === "tr" ? "Katmanlar" : "Layers"}
            </h3>
            {isLoadingPOIs && (
              <span className="text-[9px] text-blue-400 animate-pulse">
                {lang === "tr" ? "POI yükleniyor…" : "Loading POIs…"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetLayerRadii}
              className="text-[10px] text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-0.5"
              title={lang === "tr" ? "Tier standartlarına sıfırla" : "Reset to tier defaults"}
            >
              <RotateCcw className="h-3 w-3" />
            </button>
            <button
              onClick={() => setAllLayers(!allVisible)}
              className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
            >
              {allVisible
                ? lang === "tr"
                  ? "Tümünü Kapat"
                  : "Hide All"
                : lang === "tr"
                  ? "Tümünü Aç"
                  : "Show All"}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {CRITERION_LAYERS.map((layer) => {
            const Icon = ICONS[layer.icon] || MapPin;
            const isVisible =
              layers[layer.id as keyof typeof layers];
            const name = LAYER_NAMES[layer.id];
            const currentRadius = layerRadii[layer.id] ?? 10;
            const tierDefault = criteria[layer.thresholdKey] as number;
            const maxRadius = RADIUS_MAX[layer.id] || 50;
            const typeLabel =
              layer.type === "min-distance"
                ? lang === "tr"
                  ? "min. uzaklık"
                  : "min distance"
                : lang === "tr"
                  ? "max. uzaklık"
                  : "max distance";
            const isCustom = Math.abs(currentRadius - tierDefault) > 0.1;

            return (
              <div
                key={layer.id}
                className={`rounded-lg transition-all ${
                  isVisible
                    ? "bg-card/80 border border-border/50"
                    : "opacity-40"
                }`}
              >
                {/* Layer header */}
                <button
                  onClick={() =>
                    toggleLayer(layer.id as keyof typeof layers)
                  }
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left"
                >
                  <span
                    className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isVisible
                        ? `${layer.color}20`
                        : "transparent",
                    }}
                  >
                    <Icon
                      className="h-3.5 w-3.5"
                      style={{ color: layer.color }}
                    />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">
                      {lang === "tr" ? name.tr : name.en}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {typeLabel}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isCustom && (
                      <span className="text-[9px] text-amber-400 font-medium">
                        {lang === "tr" ? "özel" : "custom"}
                      </span>
                    )}
                    {isVisible ? (
                      <Eye className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                    )}
                  </div>
                </button>

                {/* Radius slider (only when visible) */}
                {isVisible && (
                  <div className="px-3 pb-2.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        {lang === "tr" ? "Yarıçap" : "Radius"}
                      </span>
                      <span
                        className="text-[10px] font-mono font-semibold"
                        style={{ color: layer.color }}
                      >
                        {currentRadius} km
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min={0.5}
                        max={maxRadius}
                        step={0.5}
                        value={currentRadius}
                        onChange={(e) =>
                          setLayerRadius(
                            layer.id,
                            Number(e.target.value)
                          )
                        }
                        className="w-full h-1 cursor-pointer accent-current"
                        style={{ color: layer.color } as React.CSSProperties}
                      />
                      {/* Tier default indicator */}
                      <div
                        className="absolute top-0 h-3 w-px pointer-events-none"
                        style={{
                          left: `${(tierDefault / maxRadius) * 100}%`,
                          background: "rgba(255,255,255,0.5)",
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[9px] mt-0.5">
                      <span className="text-muted-foreground/50">0.5</span>
                      <span className="text-muted-foreground/80 flex items-center gap-1">
                        Tier {dcSpecs.tierLevel} {lang === "tr" ? "standart" : "default"}: <strong className="text-foreground/60">{tierDefault} km</strong>
                        {isCustom && (
                          <button
                            onClick={() =>
                              setLayerRadius(layer.id, tierDefault)
                            }
                            className="text-amber-400 hover:text-amber-300 ml-0.5"
                            title={lang === "tr" ? "Standarta sıfırla" : "Reset to default"}
                          >
                            <RotateCcw className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </span>
                      <span className="text-muted-foreground/50">{maxRadius}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Heat Map Toggle */}
        <div className="mt-4 pt-3 border-t border-border/30">
          <button
            onClick={toggleHeatMap}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all ${
              showHeatMap
                ? "bg-emerald-500/10 border border-emerald-500/30"
                : "opacity-50 hover:opacity-75"
            }`}
          >
            <span
              className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
              style={{
                background: showHeatMap
                  ? "rgba(34, 197, 94, 0.15)"
                  : "transparent",
              }}
            >
              <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            </span>
            <div className="flex-1">
              <div className="text-xs font-medium text-foreground">
                {lang === "tr" ? "Uygunluk Isı Haritası" : "Suitability Heat Map"}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {lang === "tr"
                  ? "Yeşil = daha uygun arazi"
                  : "Green = more suitable land"}
              </div>
            </div>
            {showHeatMap ? (
              <Eye className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

type DCSpecsWorkload = "general-it" | "hpc" | "ai-gpu" | "mixed";
