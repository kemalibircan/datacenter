// Zustand store for analysis state
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SiteAnalysisResult, Coordinates } from "@/types/domain";

interface AnalysisState {
  currentAnalysis: SiteAnalysisResult | null;
  savedAnalyses: SiteAnalysisResult[];
  selectedCoords: Coordinates | null;
  isAnalyzing: boolean;
  error: string | null;

  setSelectedCoords: (coords: Coordinates) => void;
  startAnalysis: () => void;
  setAnalysisResult: (result: SiteAnalysisResult) => void;
  setError: (error: string | null) => void;
  saveCurrentAnalysis: () => void;
  addToCompare: (analysis: SiteAnalysisResult) => void;
  removeSavedAnalysis: (id: string) => void;
  clearCurrent: () => void;
}

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set, get) => ({
      currentAnalysis: null,
      savedAnalyses: [],
      selectedCoords: null,
      isAnalyzing: false,
      error: null,

      setSelectedCoords: (coords) => set({ selectedCoords: coords }),

      startAnalysis: () => set({ isAnalyzing: true, error: null }),

      setAnalysisResult: (result) =>
        set({ currentAnalysis: result, isAnalyzing: false, error: null }),

      setError: (error) => set({ error, isAnalyzing: false }),

      saveCurrentAnalysis: () => {
        const { currentAnalysis, savedAnalyses } = get();
        if (!currentAnalysis) return;

        const id = Date.now().toString();
        const withId = { ...currentAnalysis, id };

        // Deduplicate by approximate location
        const exists = savedAnalyses.some(
          (a) =>
            a.location.coordinates.lat.toFixed(3) ===
              withId.location.coordinates.lat.toFixed(3) &&
            a.location.coordinates.lng.toFixed(3) ===
              withId.location.coordinates.lng.toFixed(3)
        );

        if (!exists) {
          set({ savedAnalyses: [...savedAnalyses, withId] });
        }
      },

      addToCompare: (analysis) => {
        const { savedAnalyses } = get();
        const id = analysis.id ?? Date.now().toString();
        const withId = { ...analysis, id };

        // Deduplicate by approximate location
        const exists = savedAnalyses.some(
          (a) =>
            a.location.coordinates.lat.toFixed(3) ===
              withId.location.coordinates.lat.toFixed(3) &&
            a.location.coordinates.lng.toFixed(3) ===
              withId.location.coordinates.lng.toFixed(3)
        );

        if (!exists) {
          set({ savedAnalyses: [...savedAnalyses, withId] });
        }
      },

      removeSavedAnalysis: (id) =>
        set((state) => ({
          savedAnalyses: state.savedAnalyses.filter((a) => a.id !== id),
        })),

      clearCurrent: () => set({ currentAnalysis: null, selectedCoords: null }),
    }),
    {
      name: "dc-sitelab-analysis",
      partialize: (state) => ({
        savedAnalyses: state.savedAnalyses,
      }),
    }
  )
);

