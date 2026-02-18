import { canUseLiveLlm, chatJson } from "@/lib/llm";
import {
  evaluateAssessment as evaluateFallback,
  generateAssessment as generateFallback,
  regenerateQuestion as regenerateFallback,
} from "@/lib/mock-llm";
import type {
  Assessment,
  CandidateAnswer,
  CodeLanguage,
  Question,
  Report,
  ReviewerCalibration,
} from "@/lib/types";

const allowedLanguages: CodeLanguage[] = [
  "python",
  "go",
  "javascript",
  "typescript",
  "java",
  "cpp",
  "csharp",
  "rust",
  "kotlin",
  "swift",
  "ruby",
  "php",
];

const validateAssessment = (input: unknown): input is Assessment => {
  if (!input || typeof input !== "object") return false;
  const value = input as Partial<Assessment>;
  return (
    typeof value.id === "string" &&
    typeof value.subject === "string" &&
    Array.isArray(value.questions)
  );
};

const enforceLanguageSafety = (assessment: Assessment): Assessment => ({
  ...assessment,
  questions: assessment.questions.map((q) => ({
    ...q,
    codeTemplates: q.codeTemplates?.filter((tpl) =>
      allowedLanguages.includes(tpl.language),
    ),
  })),
});

export const generateAssessment = async (
  subject: string,
): Promise<Assessment> => {
  if (!canUseLiveLlm()) {
    return generateFallback(subject);
  }

  try {
    const generated = await chatJson<Assessment>([
      {
        role: "system",
        content:
          "You generate adaptive interview assessments. Return strict JSON only. Include id,title,subject,createdAt,readingTimeMinutes,strategyNote,questions[]. Questions must ramp easy->hard.",
      },
      {
        role: "user",
        content: `Generate one assessment for subject: ${subject}. Include MCQ, descriptive, and coding questions. coding templates should include at least python and go.`,
      },
    ]);

    if (!validateAssessment(generated)) {
      throw new Error(
        "Live generated assessment did not match required shape.",
      );
    }

    return enforceLanguageSafety(generated);
  } catch {
    return generateFallback(subject);
  }
};

export const evaluateAssessment = async (
  assessment: Assessment,
  answers: CandidateAnswer[],
  calibration?: ReviewerCalibration,
): Promise<Report> => {
  if (!canUseLiveLlm()) {
    return evaluateFallback(assessment, answers, calibration);
  }

  try {
    const report = await chatJson<Report>([
      {
        role: "system",
        content:
          "You evaluate interview answers with rubric transparency. Return strict JSON only for the final report. Provide per-question score, confidence, borderline flag, reasoningTrace, and rubricScores.",
      },
      {
        role: "user",
        content: JSON.stringify({ assessment, answers, calibration }),
      },
    ]);

    if (
      !report ||
      typeof report !== "object" ||
      !Array.isArray(report.evaluations)
    ) {
      throw new Error("Live evaluation result shape invalid");
    }

    return report;
  } catch {
    return evaluateFallback(assessment, answers, calibration);
  }
};

export const regenerateQuestion = async (
  assessment: Assessment,
  questionId: string,
): Promise<Question | null> => {
  if (!canUseLiveLlm()) {
    return regenerateFallback(assessment, questionId);
  }

  const target = assessment.questions.find((q) => q.id === questionId);
  if (!target) return null;

  try {
    const question = await chatJson<Question>([
      {
        role: "system",
        content:
          "Regenerate a single interview question preserving difficulty and type. Return strict JSON only.",
      },
      {
        role: "user",
        content: JSON.stringify({
          assessmentSubject: assessment.subject,
          question: target,
        }),
      },
    ]);

    if (!question || typeof question !== "object" || !question.id) {
      throw new Error("Live regeneration returned invalid question.");
    }

    return question;
  } catch {
    return regenerateFallback(assessment, questionId);
  }
};
