import { NextResponse } from "next/server";
import { evaluateAssessment } from "@/lib/assessment-service";
import { persistAttemptSnapshot, persistReportSnapshot } from "@/lib/db";
import type {
  Assessment,
  CandidateAnswer,
  ReviewerCalibration,
} from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      assessment: Assessment;
      answers: CandidateAnswer[];
      calibration?: ReviewerCalibration;
    };

    const report = await evaluateAssessment(
      body.assessment,
      body.answers,
      body.calibration,
    );
    await persistAttemptSnapshot(body.assessment.id, body.answers);
    await persistReportSnapshot(report);
    return NextResponse.json({ ok: true, report });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to evaluate",
      },
      { status: 500 },
    );
  }
}
