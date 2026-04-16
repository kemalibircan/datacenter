"use client";
import React from "react";
import { useSiteSelectionStore } from "@/store/site-selection.store";
import { CRITERION_LAYERS } from "@/rules/tier-criteria";
import { useLanguage } from "@/context/LanguageContext";
import {
  MapPin,
  DollarSign,
  Building2,
  Ruler,
  Shield,
  Check,
  X,
  ChevronRight,
  Navigation2,
} from "lucide-react";

const LAYER_NAMES_TR: Record<string, string> = {
  powerPlant: "Enerji Santrali Mesafesi",
  flightPath: "Uçuş Yolu Mesafesi",
  fuelStation: "Yakıt İstasyonu Mesafesi",
  highway: "Otoyol Mesafesi",
  hospital: "Hastane Mesafesi",
  fireStation: "İtfaiye Mesafesi",
  waterBody: "Su Kaynağı Mesafesi",
};

const LAYER_NAMES_EN: Record<string, string> = {
  powerPlant: "Power Plant Distance",
  flightPath: "Flight Path Distance",
  fuelStation: "Fuel Station Distance",
  highway: "Highway Distance",
  hospital: "Hospital Distance",
  fireStation: "Fire Station Distance",
  waterBody: "Water Body Distance",
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 65) return "text-green-400";
  if (score >= 50) return "text-yellow-400";
  if (score >= 35) return "text-orange-400";
  return "text-red-400";
}

function getScoreLabel(score: number, lang: string): string {
  if (score >= 80) return lang === "tr" ? "Mükemmel" : "Excellent";
  if (score >= 65) return lang === "tr" ? "İyi" : "Good";
  if (score >= 50) return lang === "tr" ? "Orta" : "Moderate";
  if (score >= 35) return lang === "tr" ? "Zorlu" : "Challenging";
  return lang === "tr" ? "Zayıf" : "Poor";
}

function getZoningColor(zoning: string): string {
  switch (zoning) {
    case "Industrial":
    case "Organized Industrial Zone":
      return "text-emerald-400";
    case "Commercial":
    case "Mixed Use":
      return "text-yellow-400";
    case "Agricultural":
      return "text-orange-400";
    default:
      return "text-red-400";
  }
}

export function ParcelInfoPanel() {
  const { selectedParcel, setSelectedParcel, dcSpecs, setFlyTo } =
    useSiteSelectionStore();
  const { lang } = useLanguage();

  if (!selectedParcel) {
    return (
      <div className="p-4 text-center">
        <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-3">
          <MapPin className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">
          {lang === "tr"
            ? "Arazi bilgisi görmek için haritada bir noktaya tıklayın"
            : "Click on the map to view parcel information"}
        </p>
      </div>
    );
  }

  const p = selectedParcel;
  const meetsArea = p.areaM2 >= dcSpecs.closedAreaM2;
  const zoningOk =
    p.zoningStatus === "Industrial" ||
    p.zoningStatus === "Organized Industrial Zone" ||
    p.zoningStatus === "Mixed Use";
  const complianceEntries = Object.entries(p.tierCompliance);
  const passedCount = complianceEntries.filter(([, v]) => v).length;

  return (
    <div className="flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-blue-400" />
            {lang === "tr" ? "Arazi Bilgisi" : "Parcel Info"}
          </h3>
          <button
            onClick={() => setSelectedParcel(null)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground font-mono">
          {p.coordinates.lat.toFixed(5)}, {p.coordinates.lng.toFixed(5)}
        </p>
      </div>

      {/* Suitability Score */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div
            className={`text-3xl font-bold font-mono ${getScoreColor(
              p.suitabilityScore
            )}`}
          >
            {p.suitabilityScore}
          </div>
          <div>
            <div
              className={`text-sm font-semibold ${getScoreColor(
                p.suitabilityScore
              )}`}
            >
              {getScoreLabel(p.suitabilityScore, lang)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {lang === "tr" ? "Uygunluk skoru" : "Suitability score"}
            </div>
          </div>
        </div>
        {/* Score bar */}
        <div className="mt-2 h-1.5 rounded-full bg-muted/50 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${p.suitabilityScore}%`,
              background:
                p.suitabilityScore >= 65
                  ? "linear-gradient(90deg, #22c55e, #16a34a)"
                  : p.suitabilityScore >= 35
                    ? "linear-gradient(90deg, #eab308, #f97316)"
                    : "linear-gradient(90deg, #ef4444, #dc2626)",
            }}
          />
        </div>
      </div>

      {/* Price & Zoning */}
      <div className="p-4 border-b border-border/30 space-y-3">
        {/* Area */}
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Ruler className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-muted-foreground">
              {lang === "tr" ? "Arazi Alanı" : "Parcel Area"}
            </div>
            <div className="text-sm font-semibold flex items-center gap-1.5">
              {p.areaM2.toLocaleString()} m²
              {meetsArea ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <X className="h-3 w-3 text-red-400" />
              )}
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-muted-foreground">
              {lang === "tr" ? "Tahmini Fiyat" : "Estimated Price"}
            </div>
            <div className="text-sm font-semibold">
              {p.estimatedPricePerM2.toLocaleString()} ₺/m²
              <span className="text-[10px] text-muted-foreground ml-1.5 font-normal">
                (
                {lang === "tr" ? "Toplam" : "Total"}:{" "}
                {(p.estimatedTotalPrice / 1_000_000).toFixed(1)}M ₺)
              </span>
            </div>
          </div>
        </div>

        {/* Zoning */}
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-purple-500/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-muted-foreground">
              {lang === "tr" ? "İmar Durumu" : "Zoning Status"}
            </div>
            <div
              className={`text-sm font-semibold flex items-center gap-1.5 ${getZoningColor(
                p.zoningStatus
              )}`}
            >
              {lang === "tr" ? p.zoningStatusTr : p.zoningStatus}
              {zoningOk ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <X className="h-3 w-3 text-red-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nearby Facilities (real POI names — clickable) */}
      {p.nearbyPOIs && p.nearbyPOIs.length > 0 && (
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-blue-400" />
            <h4 className="text-xs font-semibold">
              {lang === "tr" ? "En Yakın Tesisler" : "Nearest Facilities"}
            </h4>
          </div>
          <p className="text-[9px] text-muted-foreground mb-2.5">
            {lang === "tr"
              ? "Tesis adına tıklayarak haritada konumuna gidin"
              : "Click a facility name to fly to its location"}
          </p>
          <div className="space-y-1.5">
            {p.nearbyPOIs.map((poi, i) => {
              const layerConfig = CRITERION_LAYERS.find((l) => l.id === poi.type);
              const color = layerConfig?.color || "#9ca3af";
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (poi.lat && poi.lng) {
                      setFlyTo({ lat: poi.lat, lng: poi.lng, zoom: 14 });
                    }
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md bg-muted/20 hover:bg-muted/40 text-xs transition-colors text-left group"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-offset-1 ring-offset-background"
                    style={{ background: color }}
                  />
                  <span className="flex-1 text-foreground font-medium truncate group-hover:text-blue-400 transition-colors">
                    {poi.name}
                  </span>
                  <span className="text-muted-foreground text-[10px] flex-shrink-0">
                    {poi.distanceKm} km
                  </span>
                  <Navigation2 className="h-3 w-3 text-muted-foreground/40 group-hover:text-blue-400 flex-shrink-0 transition-colors" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tier Compliance */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-xs font-semibold">
            Tier {dcSpecs.tierLevel}{" "}
            {lang === "tr" ? "Uyumluluk" : "Compliance"}
          </h4>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {passedCount}/{complianceEntries.length}
          </span>
        </div>
        <div className="space-y-1">
          {complianceEntries.map(([key, passed]) => {
            const layerName =
              lang === "tr"
                ? LAYER_NAMES_TR[key] || key
                : LAYER_NAMES_EN[key] || key;

            return (
              <div
                key={key}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs ${
                  passed
                    ? "bg-emerald-500/5 text-emerald-400"
                    : "bg-red-500/5 text-red-400"
                }`}
              >
                {passed ? (
                  <Check className="h-3 w-3 flex-shrink-0" />
                ) : (
                  <X className="h-3 w-3 flex-shrink-0" />
                )}
                <span className="font-medium">{layerName}</span>
              </div>
            );
          })}
        </div>

        {/* Simulated data disclaimer */}
        <div className="mt-4 p-2 rounded-md bg-amber-500/5 border border-amber-500/15">
          <p className="text-[10px] text-amber-400 leading-relaxed">
            ⚠{" "}
            {lang === "tr"
              ? "Fiyat ve imar verileri simülasyondur. Gerçek veriler için resmi kaynaklara başvurun."
              : "Price and zoning data are simulated. Consult official sources for real data."}
          </p>
        </div>
      </div>
    </div>
  );
}
