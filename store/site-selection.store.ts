// Zustand store for site selection map state
import { create } from "zustand";
import type { TierLevel } from "@/rules/tier-criteria";
import { TIER_CRITERIA, CRITERION_LAYERS } from "@/rules/tier-criteria";

export interface LayerVisibility {
  powerPlant: boolean;
  flightPath: boolean;
  fuelStation: boolean;
  highway: boolean;
  hospital: boolean;
  fireStation: boolean;
  waterBody: boolean;
}

// Custom radius overrides per layer (km)
export type LayerRadii = Record<string, number>;

export interface DCSpecs {
  closedAreaM2: number;
  tierLevel: TierLevel;
  powerMW: number;
  workloadType: "general-it" | "hpc" | "ai-gpu" | "mixed";
}

export interface POIItem {
  lat: number;
  lng: number;
  name: string;
  type: string;
}

export interface ParcelInfo {
  coordinates: { lat: number; lng: number };
  address: string | null;
  estimatedPricePerM2: number;
  estimatedTotalPrice: number;
  zoningStatus: string;
  zoningStatusTr: string;
  areaM2: number;
  suitabilityScore: number;
  tierCompliance: Record<string, boolean>;
  nearbyPOIs?: Array<{ name: string; type: string; distanceKm: number; lat: number; lng: number }>;
}

export interface SuitabilityCell {
  lat: number;
  lng: number;
  score: number; // 0-100
}

// Build default radii from tier criteria
function getDefaultRadii(tierLevel: TierLevel): LayerRadii {
  const criteria = TIER_CRITERIA[tierLevel];
  const radii: LayerRadii = {};
  for (const layer of CRITERION_LAYERS) {
    radii[layer.id] = criteria[layer.thresholdKey] as number;
  }
  return radii;
}

interface SiteSelectionState {
  // DC Specifications
  dcSpecs: DCSpecs;
  setDCSpecs: (specs: Partial<DCSpecs>) => void;

  // Layer visibility
  layers: LayerVisibility;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  setAllLayers: (visible: boolean) => void;

  // Custom layer radii
  layerRadii: LayerRadii;
  setLayerRadius: (layerId: string, radius: number) => void;
  resetLayerRadii: () => void;

  // Real POI data from Overpass API
  poiData: Record<string, POIItem[]>;
  setPOIData: (layerId: string, pois: POIItem[]) => void;
  isLoadingPOIs: boolean;
  setIsLoadingPOIs: (loading: boolean) => void;

  // Heat map
  showHeatMap: boolean;
  toggleHeatMap: () => void;
  suitabilityGrid: SuitabilityCell[];
  setSuitabilityGrid: (grid: SuitabilityCell[]) => void;

  // Selected parcel
  selectedParcel: ParcelInfo | null;
  setSelectedParcel: (parcel: ParcelInfo | null) => void;

  // Map center
  mapCenter: { lat: number; lng: number };
  setMapCenter: (center: { lat: number; lng: number }) => void;
  flyToCoords: { lat: number; lng: number; zoom?: number } | null;
  setFlyTo: (coords: { lat: number; lng: number; zoom?: number } | null) => void;

  // Search location
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Loading state
  isLoadingGrid: boolean;
  setIsLoadingGrid: (loading: boolean) => void;
}

export const useSiteSelectionStore = create<SiteSelectionState>()((set, get) => ({
  // Defaults
  dcSpecs: {
    closedAreaM2: 2500,
    tierLevel: 3,
    powerMW: 5,
    workloadType: "general-it",
  },
  setDCSpecs: (specs) =>
    set((state) => {
      const newSpecs = { ...state.dcSpecs, ...specs };
      // If tier changed, reset radii to new tier defaults
      if (specs.tierLevel && specs.tierLevel !== state.dcSpecs.tierLevel) {
        return {
          dcSpecs: newSpecs,
          layerRadii: getDefaultRadii(specs.tierLevel),
        };
      }
      return { dcSpecs: newSpecs };
    }),

  layers: {
    powerPlant: true,
    flightPath: true,
    fuelStation: true,
    highway: true,
    hospital: true,
    fireStation: true,
    waterBody: true,
  },
  toggleLayer: (layer) =>
    set((state) => ({
      layers: { ...state.layers, [layer]: !state.layers[layer] },
    })),
  setAllLayers: (visible) =>
    set(() => ({
      layers: {
        powerPlant: visible,
        flightPath: visible,
        fuelStation: visible,
        highway: visible,
        hospital: visible,
        fireStation: visible,
        waterBody: visible,
      },
    })),

  // Custom radii — default from Tier III
  layerRadii: getDefaultRadii(3),
  setLayerRadius: (layerId, radius) =>
    set((state) => ({
      layerRadii: { ...state.layerRadii, [layerId]: radius },
    })),
  resetLayerRadii: () =>
    set((state) => ({
      layerRadii: getDefaultRadii(state.dcSpecs.tierLevel),
    })),

  // Real POI data
  poiData: {},
  setPOIData: (layerId, pois) =>
    set((state) => ({
      poiData: { ...state.poiData, [layerId]: pois },
    })),
  isLoadingPOIs: false,
  setIsLoadingPOIs: (loading) => set({ isLoadingPOIs: loading }),

  showHeatMap: true,
  toggleHeatMap: () => set((state) => ({ showHeatMap: !state.showHeatMap })),
  suitabilityGrid: [],
  setSuitabilityGrid: (grid) => set({ suitabilityGrid: grid }),

  selectedParcel: null,
  setSelectedParcel: (parcel) => set({ selectedParcel: parcel }),

  mapCenter: { lat: 39.9, lng: 32.8 }, // Turkey center
  setMapCenter: (center) => set({ mapCenter: center }),
  flyToCoords: null,
  setFlyTo: (coords) => set({ flyToCoords: coords }),

  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),

  isLoadingGrid: false,
  setIsLoadingGrid: (loading) => set({ isLoadingGrid: loading }),
}));
