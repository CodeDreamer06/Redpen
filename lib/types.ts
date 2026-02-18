export type Difficulty = "easy" | "medium" | "hard";
export type QuestionKind = "mcq" | "descriptive" | "coding";

export type RubricCriterion = {
  label: string;
  weight: number;
  description: string;
};

export type Option = {
  id: string;
  label: string;
  text: string;
};

export type CodeLanguage =
  | "python"
  | "go"
  | "javascript"
  | "typescript"
  | "java"
  | "cpp"
  | "csharp"
  | "rust"
  | "kotlin"
  | "swift"
  | "ruby"
  | "php";

export type EditorTheme = "vs-dark" | "vs-light" | "hc-black" | "hc-light";

export type CodeTemplate = {
  language: CodeLanguage;
  starter: string;
};

export type TestCase = {
  input: string;
  expected: string;
  hidden?: boolean;
};

export type Question = {
  id: string;
  topic: string;
  subTopic: string;
  difficulty: Difficulty;
  kind: QuestionKind;
  prompt: string;
  definitions?: Record<string, string>;
  options?: Option[];
  correctOptionId?: string;
  rubric: RubricCriterion[];
  estimatedSeconds: number;
  codeTemplates?: CodeTemplate[];
  testCases?: TestCase[];
};

export type Assessment = {
  id: string;
  subject: string;
  title: string;
  createdAt: string;
  questions: Question[];
  readingTimeMinutes: number;
  strategyNote: string;
};

export type CandidateAnswer = {
  questionId: string;
  selectedOptionId?: string;
  descriptiveAnswer?: string;
  codeByLanguage?: Partial<Record<CodeLanguage, string>>;
  selectedLanguage?: CodeLanguage;
  editorTheme?: EditorTheme;
  autocompleteEnabled?: boolean;
  confirmed?: boolean;
  flagged?: boolean;
  timeSpentSeconds: number;
  codeTimeline?: Array<{ atMs: number; language: CodeLanguage; code: string }>;
};

export type ScoreBreakdown = {
  criterion: string;
  score: number;
  maxScore: number;
  reasoning: string;
};

export type Evaluation = {
  questionId: string;
  score: number;
  maxScore: number;
  confidence: number;
  borderline: boolean;
  reasoningTrace: string;
  rubricScores: ScoreBreakdown[];
};

export type Report = {
  assessmentId: string;
  candidateId: string;
  submittedAt: string;
  totalScore: number;
  maxScore: number;
  percentile: number;
  evaluations: Evaluation[];
  strongestTopics: Array<{ topic: string; scorePct: number }>;
  weakestTopics: Array<{ topic: string; scorePct: number }>;
  timeline: Array<{ index: number; accuracyPct: number; avgTime: number }>;
  topicRadar: Array<{ topic: string; score: number }>;
  reviewerOverrides: Array<{
    questionId: string;
    previousScore: number;
    newScore: number;
    note: string;
    at: string;
  }>;
};

export type ReviewerCalibration = {
  subject: string;
  adjustmentFactor: number;
  overrideCount: number;
};
