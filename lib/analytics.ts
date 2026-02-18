import type { CandidateAnswer } from "@/lib/types";

export const answerCompletionPct = (
  answers: CandidateAnswer[],
  total: number,
) => {
  if (total === 0) return 0;
  const completed = answers.filter(
    (a) =>
      a.confirmed ||
      a.selectedOptionId ||
      a.descriptiveAnswer ||
      a.codeByLanguage,
  ).length;
  return Math.round((completed / total) * 100);
};

export const totalTimeSpent = (answers: CandidateAnswer[]) =>
  answers.reduce((sum, a) => sum + a.timeSpentSeconds, 0);

export const ensureAnswer = (
  answers: CandidateAnswer[],
  questionId: string,
): CandidateAnswer =>
  answers.find((a) => a.questionId === questionId) ?? {
    questionId,
    timeSpentSeconds: 0,
    codeByLanguage: {},
    codeTimeline: [],
  };

export const updateAnswer = (
  answers: CandidateAnswer[],
  questionId: string,
  updater: (answer: CandidateAnswer) => CandidateAnswer,
): CandidateAnswer[] => {
  const existing = ensureAnswer(answers, questionId);
  const next = updater(existing);
  const filtered = answers.filter((a) => a.questionId !== questionId);
  return [...filtered, next];
};
