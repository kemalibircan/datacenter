import { NextRequest, NextResponse } from "next/server";
import { analyzeSite } from "@/services/analysis.service";
import { z } from "zod";

const schema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid coordinates", details: parsed.error.flatten() }, { status: 400 });
    }

    const result = await analyzeSite(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[analyze] Error:", error);
    return NextResponse.json(
      { error: "Analysis failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
