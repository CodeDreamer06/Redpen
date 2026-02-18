import { NextResponse } from "next/server";
import { regenerateQuestion } from "@/lib/assessment-service";
import type { Assessment } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      assessment: Assessment;
      questionId: string;
    };

    const question = await regenerateQuestion(body.assessment, body.questionId);
    return NextResponse.json({ ok: true, question });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to regenerate",
      },
      { status: 500 },
    );
  }
}
