"use client";
import React, { Suspense, useState } from "react";
import { NavBar } from "@/components/layout/NavBar";
import { SiteSelectionMap } from "@/components/map/SiteSelectionMap";
import { FilterPanel } from "@/components/site-selection/FilterPanel";
import { ParcelInfoPanel } from "@/components/site-selection/ParcelInfoPanel";
import { useSiteSelectionStore } from "@/store/site-selection.store";
import { useLanguage } from "@/context/LanguageContext";
import { PanelLeftClose, PanelLeftOpen, Info } from "lucide-react";

function SiteSelectionContent() {
  const { lang } = useLanguage();
  const { selectedParcel } = useSiteSelectionStore();
  const [leftOpen, setLeftOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen">
      <NavBar />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar — Filters */}
        <div
          className={`${
            leftOpen ? "w-96 xl:w-[420px]" : "w-0"
          } transition-all duration-300 border-r border-border/40 bg-card/50 flex flex-col overflow-hidden`}
        >
          {leftOpen && <FilterPanel />}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setLeftOpen(!leftOpen)}
          className="absolute top-[65px] left-1 z-30 h-8 w-8 flex items-center justify-center rounded-md bg-background/90 border border-border/50 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
          style={leftOpen ? { left: "calc(var(--left-w, 320px) + 4px)" } : {}}
        >
          {leftOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>

        {/* Map */}
        <div className="flex-1 relative">
          {/* Title overlay */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-background/90 backdrop-blur-sm rounded-lg border border-border/50 px-4 py-2 flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium">
              {lang === "tr"
                ? "Veri Merkezi Arazi Seçimi"
                : "Data Center Site Selection"}
            </span>
          </div>

          <SiteSelectionMap />
        </div>

        {/* Right Sidebar — Parcel Info */}
        <div
          className={`${
            selectedParcel ? "w-96 xl:w-[420px]" : "w-0"
          } transition-all duration-300 border-l border-border/40 bg-card/50 flex flex-col overflow-hidden`}
        >
          <ParcelInfoPanel />
        </div>
      </div>
    </div>
  );
}

export default function SiteSelectionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center text-muted-foreground text-sm">
          Loading…
        </div>
      }
    >
      <SiteSelectionContent />
    </Suspense>
  );
}
