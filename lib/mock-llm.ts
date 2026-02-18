import { csGlossary, mlGlossary } from "@/data/glossary";
import type {
  Assessment,
  CandidateAnswer,
  Difficulty,
  Evaluation,
  Question,
  Report,
  ReviewerCalibration,
} from "@/lib/types";

const difficultyWeight: Record<Difficulty, number> = {
  easy: 1,
  medium: 1.4,
  hard: 1.8,
};

const baseQuestionCountBySubject: Record<string, number> = {
  "Computer Science": 10,
  "Machine Learning": 9,
  "System Design": 8,
  "Data Structures": 10,
};

const strategyBySubject: Record<string, string> = {
  "Computer Science":
    "Starts with core recall, transitions to complexity reasoning, and finishes with synthesis + implementation.",
  "Machine Learning":
    "Begins with concept checks, moves into tradeoff analysis, then model critique and implementation choices.",
  "System Design":
    "Starts at requirement clarity, advances into scaling constraints, and ends with failure-mode reasoning.",
  "Data Structures":
    "Moves from identification to complexity tradeoffs and implementation-level edge-case handling.",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const pickGlossary = (subject: string) =>
  subject.includes("Machine") ? mlGlossary : csGlossary;

const buildQuestion = (
  subject: string,
  index: number,
  total: number,
  glossary: Record<string, string>,
): Question => {
  const ratio = index / Math.max(total - 1, 1);
  const difficulty: Difficulty =
    ratio < 0.35 ? "easy" : ratio < 0.75 ? "medium" : "hard";
  const kind =
    index % 5 === 4 ? "coding" : index % 3 === 2 ? "descriptive" : "mcq";

  const keyTerms = Object.keys(glossary);
  const term = keyTerms[index % keyTerms.length];
  const term2 = keyTerms[(index + 2) % keyTerms.length];

  const rubric =
    kind === "mcq"
      ? [
          {
            label: "Concept Correctness",
            weight: 0.8,
            description: "Checks the core concept.",
          },
          {
            label: "Decision Quality",
            weight: 0.2,
            description: "Checks choice under constraints.",
          },
        ]
      : kind === "coding"
        ? [
            {
              label: "Correctness",
              weight: 0.45,
              description: "Passes required scenarios.",
            },
            {
              label: "Complexity",
              weight: 0.25,
              description: "Time/space quality.",
            },
            {
              label: "Code clarity",
              weight: 0.15,
              description: "Readable and structured.",
            },
            {
              label: "Edge cases",
              weight: 0.15,
              description: "Handles corner conditions.",
            },
          ]
        : [
            {
              label: "Technical depth",
              weight: 0.4,
              description: "Correct and nuanced reasoning.",
            },
            {
              label: "Structure",
              weight: 0.25,
              description: "Clear argument flow.",
            },
            {
              label: "Tradeoff analysis",
              weight: 0.35,
              description: "Competing choices explained.",
            },
          ];

  const estimatedSeconds = Math.round(
    (95 + index * 18) * difficultyWeight[difficulty],
  );

  const sharedPrompt = `In ${subject}, explain how **${term}** influences system behavior. Include a concise contrast with **${term2}**. Also evaluate this expression: $O(n \\log n)$ vs $O(n^2)$ for $n=10^5$.`;

  if (kind === "mcq") {
    const options = [
      {
        id: "a",
        label: "1",
        text: "The first statement is always optimal regardless of scale.",
      },
      {
        id: "b",
        label: "2",
        text: "The tradeoff depends on growth rate and constraints; asymptotics matter.",
      },
      {
        id: "c",
        label: "3",
        text: "Complexity classes are irrelevant if latency is low on small inputs.",
      },
      {
        id: "d",
        label: "4",
        text: "Both options are equivalent once optimized by compilers.",
      },
    ];

    return {
      id: `q-${index + 1}`,
      topic: subject,
      subTopic: ["Foundations", "Algorithms", "Systems", "Reasoning"][
        index % 4
      ],
      difficulty,
      kind,
      prompt: `${sharedPrompt}\n\nPick the most defensible statement.`,
      options,
      correctOptionId: "b",
      rubric,
      estimatedSeconds,
      definitions: { [term]: glossary[term], [term2]: glossary[term2] },
    };
  }

  if (kind === "coding") {
    return {
      id: `q-${index + 1}`,
      topic: subject,
      subTopic: "Implementation",
      difficulty,
      kind,
      prompt:
        "Implement `first_unique_char(s)` returning the index of the first non-repeating character or `-1`. Explain complexity briefly in a comment.",
      rubric,
      estimatedSeconds,
      definitions: { invariant: glossary.invariant, latency: glossary.latency },
      codeTemplates: [
        {
          language: "python",
          starter:
            "def first_unique_char(s: str) -> int:\n    # write solution\n    return -1\n",
        },
        {
          language: "go",
          starter:
            "package main\n\nfunc firstUniqueChar(s string) int {\n\t// write solution\n\treturn -1\n}\n",
        },
      ],
      testCases: [
        { input: '"leetcode"', expected: "0" },
        { input: '"aabb"', expected: "-1" },
        { input: '"abac"', expected: "1", hidden: true },
        { input: '"xxyz"', expected: "2", hidden: true },
      ],
    };
  }

  return {
    id: `q-${index + 1}`,
    topic: subject,
    subTopic: "Analysis",
    difficulty,
    kind,
    prompt: `${sharedPrompt}\n\nWrite a structured answer with assumptions, approach, and failure cases.`,
    rubric,
    estimatedSeconds,
    definitions: { [term]: glossary[term], [term2]: glossary[term2] },
  };
};

export const generateAssessment = async (
  subject: string,
): Promise<Assessment> => {
  await sleep(700);

  const total = baseQuestionCountBySubject[subject] ?? 9;
  const glossary = pickGlossary(subject);
  const questions = Array.from({ length: total }, (_, i) =>
    buildQuestion(subject, i, total, glossary),
  );

  const readingTimeMinutes = Math.ceil(
    questions.reduce((sum, q) => sum + q.prompt.length / 18, 0) / 220,
  );

  return {
    id: `asmt-${Date.now()}`,
    subject,
    title: `${subject} Adaptive Assessment`,
    createdAt: new Date().toISOString(),
    questions,
    readingTimeMinutes,
    strategyNote:
      strategyBySubject[subject] ??
      "Starts from fundamentals and progressively increases abstraction and ambiguity.",
  };
};

const scoreMcq = (question: Question, answer: CandidateAnswer): number =>
  answer.selectedOptionId === question.correctOptionId ? 10 : 0;

const scoreDescriptive = (
  answerText: string | undefined,
  difficulty: Difficulty,
): number => {
  const text = (answerText ?? "").trim();
  if (!text) return 0;
  const lengthScore = Math.min(text.length / 240, 1) * 5;
  const structureScore = /assumption|tradeoff|edge|complexity/i.test(text)
    ? 3
    : 1.5;
  const clarityScore = /\n|\.|:/.test(text) ? 2 : 1;
  const raw = lengthScore + structureScore + clarityScore;
  return Math.min(Math.round(raw * difficultyWeight[difficulty]), 10);
};

const runUniqueChar = (code: string | undefined, tc: string): string => {
  if (!code) return "-1";
  const hasMap = /dict|map|make\(|\{\}/i.test(code);
  const hasTwoPass = /for .*for |count|range|len\(/i.test(code);
  const input = tc.replaceAll('"', "");
  const counts = new Map<string, number>();
  for (const char of input) counts.set(char, (counts.get(char) ?? 0) + 1);
  let result = -1;
  if (hasMap || hasTwoPass) {
    for (let i = 0; i < input.length; i += 1) {
      if (counts.get(input[i]) === 1) {
        result = i;
        break;
      }
    }
  }
  return String(result);
};

const scoreCoding = (
  question: Question,
  answer: CandidateAnswer,
): { score: number; confidence: number } => {
  const lang = answer.selectedLanguage ?? "python";
  const code = answer.codeByLanguage?.[lang] ?? "";
  const testCases = question.testCases ?? [];
  if (!testCases.length) return { score: 0, confidence: 0.35 };

  let passed = 0;
  for (const tc of testCases) {
    const out = runUniqueChar(code, tc.input);
    if (out === tc.expected) passed += 1;
  }

  const correctness = (passed / testCases.length) * 7;
  const hasComplexityNote = /O\(|complex/i.test(code) ? 1.5 : 0.2;
  const hasEdge = /-1|empty|len\(s\)==0|if s == ""|if len\(s\) == 0/i.test(code)
    ? 1.5
    : 0.5;

  return {
    score: Math.round(Math.min(10, correctness + hasComplexityNote + hasEdge)),
    confidence: Math.min(0.95, 0.45 + passed / testCases.length / 2),
  };
};

export const evaluateAssessment = async (
  assessment: Assessment,
  answers: CandidateAnswer[],
  calibration?: ReviewerCalibration,
): Promise<Report> => {
  await sleep(800);

  const evaluations: Evaluation[] = assessment.questions.map((q) => {
    const answer = answers.find((a) => a.questionId === q.id);
    let score = 0;
    let confidence = 0.65;

    if (q.kind === "mcq") {
      score = scoreMcq(q, answer ?? { questionId: q.id, timeSpentSeconds: 0 });
      confidence = 0.95;
    } else if (q.kind === "coding") {
      const out = scoreCoding(
        q,
        answer ?? { questionId: q.id, timeSpentSeconds: 0 },
      );
      score = out.score;
      confidence = out.confidence;
    } else {
      score = scoreDescriptive(answer?.descriptiveAnswer, q.difficulty);
      confidence = Math.min(
        0.9,
        0.45 + (answer?.descriptiveAnswer?.length ?? 0) / 1200,
      );
    }

    if (calibration) {
      score = Math.max(
        0,
        Math.min(10, Math.round(score * calibration.adjustmentFactor)),
      );
    }

    const rubricScores = q.rubric.map((criterion) => {
      const weighted = Math.round(criterion.weight * score);
      return {
        criterion: criterion.label,
        score: weighted,
        maxScore: Math.max(1, Math.round(criterion.weight * 10)),
        reasoning: `${criterion.label} assessed from answer structure and correctness signals.`,
      };
    });

    const borderline =
      confidence < 0.62 || (score >= 4 && score <= 6 && q.kind !== "mcq");

    return {
      questionId: q.id,
      score,
      maxScore: 10,
      confidence,
      borderline,
      reasoningTrace: `Model notes: difficulty=${q.difficulty}, kind=${q.kind}, confidence=${confidence.toFixed(
        2,
      )}. Score derived from rubric coverage, correctness signals, and clarity indicators.`,
      rubricScores,
    };
  });

  const totalScore = evaluations.reduce((sum, e) => sum + e.score, 0);
  const maxScore = evaluations.length * 10;

  const byTopic = new Map<string, { sum: number; count: number }>();
  for (const q of assessment.questions) {
    const ev = evaluations.find((e) => e.questionId === q.id);
    if (!ev) continue;
    const current = byTopic.get(q.subTopic) ?? { sum: 0, count: 0 };
    current.sum += ev.score;
    current.count += 1;
    byTopic.set(q.subTopic, current);
  }

  const topicPairs = Array.from(byTopic.entries()).map(([topic, agg]) => ({
    topic,
    scorePct: Math.round((agg.sum / (agg.count * 10)) * 100),
  }));

  const sorted = [...topicPairs].sort((a, b) => b.scorePct - a.scorePct);

  const timeline = assessment.questions.map((_q, i) => {
    const upTo = evaluations.slice(0, i + 1);
    const upToScore = upTo.reduce((sum, e) => sum + e.score, 0);
    const answered = answers.slice(0, i + 1);
    const avgTime =
      answered.length > 0
        ? Math.round(
            answered.reduce((sum, a) => sum + a.timeSpentSeconds, 0) /
              answered.length,
          )
        : 0;

    return {
      index: i + 1,
      accuracyPct: Math.round((upToScore / (upTo.length * 10)) * 100),
      avgTime,
    };
  });

  const percentile = Math.max(
    20,
    Math.min(98, Math.round((totalScore / maxScore) * 100 + 9)),
  );

  return {
    assessmentId: assessment.id,
    candidateId: "candidate-001",
    submittedAt: new Date().toISOString(),
    totalScore,
    maxScore,
    percentile,
    evaluations,
    strongestTopics: sorted.slice(0, 3),
    weakestTopics: sorted.slice(-3).reverse(),
    timeline,
    topicRadar: topicPairs.map((p) => ({ topic: p.topic, score: p.scorePct })),
    reviewerOverrides: [],
  };
};

export const regenerateQuestion = async (
  assessment: Assessment,
  questionId: string,
): Promise<Question | null> => {
  await sleep(500);
  const q = assessment.questions.find((item) => item.id === questionId);
  if (!q) return null;

  return {
    ...q,
    prompt: `${q.prompt}\n\n(Refined variant with different framing and an extra edge condition.)`,
    estimatedSeconds: Math.round(q.estimatedSeconds * 1.1),
  };
};
