import { sql } from "@vercel/postgres";
import type { Assessment, CandidateAnswer, Report } from "@/lib/types";

const enabled = process.env.ENABLE_VERCEL_DB === "1";

export const persistAssessmentSnapshot = async (
  assessment: Assessment,
): Promise<void> => {
  if (!enabled) return;
  try {
    await sql`
      create table if not exists redpen_assessments (
        id text primary key,
        subject text not null,
        payload jsonb not null,
        created_at timestamptz default now()
      );
    `;

    await sql`
      insert into redpen_assessments (id, subject, payload)
      values (${assessment.id}, ${assessment.subject}, ${JSON.stringify(assessment)}::jsonb)
      on conflict (id) do update set payload = excluded.payload;
    `;
  } catch {
    // best-effort persistence to avoid blocking candidate flow
  }
};

export const persistAttemptSnapshot = async (
  assessmentId: string,
  answers: CandidateAnswer[],
): Promise<void> => {
  if (!enabled) return;
  try {
    await sql`
      create table if not exists redpen_attempts (
        id bigserial primary key,
        assessment_id text not null,
        payload jsonb not null,
        created_at timestamptz default now()
      );
    `;

    await sql`
      insert into redpen_attempts (assessment_id, payload)
      values (${assessmentId}, ${JSON.stringify(answers)}::jsonb);
    `;
  } catch {
    // best-effort persistence to avoid blocking submission
  }
};

export const persistReportSnapshot = async (report: Report): Promise<void> => {
  if (!enabled) return;
  try {
    await sql`
      create table if not exists redpen_reports (
        id bigserial primary key,
        assessment_id text not null,
        candidate_id text not null,
        payload jsonb not null,
        created_at timestamptz default now()
      );
    `;

    await sql`
      insert into redpen_reports (assessment_id, candidate_id, payload)
      values (${report.assessmentId}, ${report.candidateId}, ${JSON.stringify(report)}::jsonb);
    `;
  } catch {
    // best-effort persistence to avoid blocking report delivery
  }
};
