import { NextResponse } from "next/server";
import { generateAssessment } from "@/lib/assessment-service";
import { persistAssessmentSnapshot } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { subject?: string };
    const subject = body.subject?.trim() || "Computer Science";
    const assessment = await generateAssessment(subject);
    await persistAssessmentSnapshot(assessment);
    return NextResponse.json({ ok: true, assessment });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to generate",
      },
      { status: 500 },
    );
  }
}
