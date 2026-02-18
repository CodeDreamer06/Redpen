import type {
  Assessment,
  CandidateAnswer,
  Report,
  ReviewerCalibration,
} from "@/lib/types";

const KEYS = {
  assessment: "redpen.assessment",
  answers: "redpen.answers",
  report: "redpen.report",
  calibration: "redpen.calibration",
};

const isBrowser = () => typeof window !== "undefined";

const parse = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const saveAssessment = (assessment: Assessment) => {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.assessment, JSON.stringify(assessment));
};

export const loadAssessment = () => {
  if (!isBrowser()) return null;
  return parse<Assessment>(localStorage.getItem(KEYS.assessment));
};

export const saveAnswers = (answers: CandidateAnswer[]) => {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.answers, JSON.stringify(answers));
};

export const loadAnswers = () => {
  if (!isBrowser()) return [];
  return parse<CandidateAnswer[]>(localStorage.getItem(KEYS.answers)) ?? [];
};

export const saveReport = (report: Report) => {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.report, JSON.stringify(report));
};

export const loadReport = () => {
  if (!isBrowser()) return null;
  return parse<Report>(localStorage.getItem(KEYS.report));
};

export const loadCalibration = (): ReviewerCalibration | null =>
  isBrowser()
    ? parse<ReviewerCalibration>(localStorage.getItem(KEYS.calibration))
    : null;

export const saveCalibration = (value: ReviewerCalibration) => {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.calibration, JSON.stringify(value));
};
