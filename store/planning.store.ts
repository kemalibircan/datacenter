// Zustand store for planning state
import { create } from "zustand";
import type { PlanningInput, PlanningRecommendation } from "@/types/domain";

interface PlanningState {
  planningInput: Partial<PlanningInput>;
  recommendation: PlanningRecommendation | null;
  isPlanning: boolean;
  error: string | null;

  setPlanningInput: (input: Partial<PlanningInput>) => void;
  startPlanning: () => void;
  setRecommendation: (rec: PlanningRecommendation) => void;
  setError: (error: string | null) => void;
  resetPlanning: () => void;
}

const DEFAULT_PLANNING_INPUT: Partial<PlanningInput> = {
  whiteSpaceM2: 400,
  workloadType: "general-it",
  rackDensityKw: 8,
  availabilityTier: "N+1",
  growthYears: 5,
  sustainabilityPriority: "medium",
  waterSensitivity: "medium",
};

export const usePlanningStore = create<PlanningState>((set) => ({
  planningInput: DEFAULT_PLANNING_INPUT,
  recommendation: null,
  isPlanning: false,
  error: null,

  setPlanningInput: (input) =>
    set((state) => ({ planningInput: { ...state.planningInput, ...input } })),

  startPlanning: () => set({ isPlanning: true, error: null }),

  setRecommendation: (recommendation) =>
    set({ recommendation, isPlanning: false, error: null }),

  setError: (error) => set({ error, isPlanning: false }),

  resetPlanning: () =>
    set({ planningInput: DEFAULT_PLANNING_INPUT, recommendation: null, error: null }),
}));
