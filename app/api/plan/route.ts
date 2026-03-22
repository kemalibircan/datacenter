import { NextRequest, NextResponse } from "next/server";
import { generatePlanning } from "@/services/planning.service";
import { z } from "zod";
import type { Lang } from "@/lib/i18n";

const schema = z.object({
  planningInput: z.object({
    whiteSpaceM2: z.number().min(10).max(100000),
    workloadType: z.enum(["general-it", "hpc", "ai-gpu", "mixed"]),
    rackDensityKw: z.number().min(1).max(100),
    availabilityTier: z.enum(["N", "N+1", "2N"]),
    growthYears: z.number().min(1).max(30),
    sustainabilityPriority: z.enum(["low", "medium", "high"]),
    waterSensitivity: z.enum(["low", "medium", "high"]),
    manualOverrides: z.optional(z.object({
      gridQuality: z.enum(["poor", "average", "good", "excellent"]).optional(),
      geotechnicalRisk: z.enum(["low", "medium", "high"]).optional(),
      fiberAvailability: z.enum(["none", "limited", "good", "excellent"]).optional(),
      permittingComplexity: z.enum(["simple", "moderate", "complex"]).optional(),
      customNotes: z.string().optional(),
    })),
  }),
  analysis: z.optional(z.any()),
  lang: z.enum(["en", "tr"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { planningInput, analysis, lang } = parsed.data;
    const result = generatePlanning(planningInput, analysis ?? null, (lang ?? "en") as Lang);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[plan] Error:", error);
    return NextResponse.json(
      { error: "Planning failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
