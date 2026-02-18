"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  loadAssessment,
  loadCalibration,
  loadReport,
  saveCalibration,
  saveReport,
} from "@/lib/storage";
import type { Evaluation, Report } from "@/lib/types";

const comparisonFor = (report: Report) => {
  const adjust = (delta: number) =>
    report.evaluations.map((e) => ({
      ...e,
      score: Math.max(0, Math.min(10, e.score + delta)),
    }));

  const toPct = (values: Evaluation[]) =>
    Math.round(
      (values.reduce((sum, e) => sum + e.score, 0) / (values.length * 10)) *
        100,
    );

  return [
    { candidate: "You", accuracy: toPct(report.evaluations) },
    { candidate: "Candidate B", accuracy: toPct(adjust(-1)) },
    { candidate: "Candidate C", accuracy: toPct(adjust(1)) },
  ];
};

export const ReportDashboard = () => {
  const initialReport = loadReport();
  const assessment = loadAssessment();
  const [report, setReport] = useState<Report | null>(initialReport);
  const [overrideNote, setOverrideNote] = useState("");
  const [selectedQ, setSelectedQ] = useState<string>(
    initialReport?.evaluations[0]?.questionId ?? "",
  );

  const selectedEvaluation = report?.evaluations.find(
    (e) => e.questionId === selectedQ,
  );
  const selectedQuestion = assessment?.questions.find(
    (q) => q.id === selectedQ,
  );

  const applyOverride = (newScore: number) => {
    if (!report || !selectedEvaluation) return;
    const previousScore = selectedEvaluation.score;
    const nextEvaluations = report.evaluations.map((ev) =>
      ev.questionId === selectedQ ? { ...ev, score: newScore } : ev,
    );

    const next: Report = {
      ...report,
      evaluations: nextEvaluations,
      totalScore: nextEvaluations.reduce((sum, e) => sum + e.score, 0),
      reviewerOverrides: [
        ...report.reviewerOverrides,
        {
          questionId: selectedQ,
          previousScore,
          newScore,
          note: overrideNote || "Manual reviewer adjustment",
          at: new Date().toISOString(),
        },
      ],
    };

    const calibration = loadCalibration() ?? {
      subject: assessment?.subject ?? "Computer Science",
      adjustmentFactor: 1,
      overrideCount: 0,
    };

    const delta = newScore - previousScore;
    const updatedCalibration = {
      ...calibration,
      overrideCount: calibration.overrideCount + 1,
      adjustmentFactor: Math.max(
        0.7,
        Math.min(1.3, calibration.adjustmentFactor + delta / 200),
      ),
    };

    saveCalibration(updatedCalibration);
    saveReport(next);
    setReport(next);
    setOverrideNote("");
  };

  const replayFrames = useMemo(() => {
    if (!assessment || !selectedQuestion || selectedQuestion.kind !== "coding")
      return [];
    if (typeof window === "undefined") return [];
    const raw = JSON.parse(
      window.localStorage.getItem("redpen.answers") ?? "[]",
    ) as Array<{
      questionId: string;
      codeTimeline?: Array<{ atMs: number; language: string; code: string }>;
    }>;
    return (
      raw.find((item) => item.questionId === selectedQuestion.id)
        ?.codeTimeline ?? []
    );
  }, [assessment, selectedQuestion]);

  const currentAnswerText = useMemo(() => {
    if (typeof window === "undefined" || !selectedQuestion) return "";
    const raw = JSON.parse(
      window.localStorage.getItem("redpen.answers") ?? "[]",
    ) as Array<{
      questionId: string;
      selectedOptionId?: string;
      descriptiveAnswer?: string;
      selectedLanguage?: string;
      codeByLanguage?: Record<string, string>;
    }>;
    const found = raw.find((item) => item.questionId === selectedQ);
    if (!found) return "No answer captured.";
    if (found.descriptiveAnswer) return found.descriptiveAnswer;
    if (found.selectedOptionId)
      return `Selected option: ${found.selectedOptionId}`;
    if (
      found.selectedLanguage &&
      found.codeByLanguage?.[found.selectedLanguage]
    ) {
      return found.codeByLanguage[found.selectedLanguage];
    }
    return "No answer captured.";
  }, [selectedQ, selectedQuestion]);

  const [frameIndex, setFrameIndex] = useState(0);
  const frame =
    replayFrames[Math.min(frameIndex, Math.max(0, replayFrames.length - 1))];

  if (!report || !assessment) {
    return (
      <div className="min-h-screen bg-bg px-4 py-16 text-ink md:px-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-line bg-panel p-6">
          <h1 className="text-xl font-semibold">No report yet</h1>
          <p className="mt-2 text-sm text-muted">
            Complete an assessment first to see analytics.
          </p>
          <Link
            href="/candidate"
            className="mt-4 inline-block rounded-md bg-accent px-3 py-1.5 text-xs text-white"
          >
            Start candidate flow
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-soft">
              Comprehensive report
            </p>
            <h1 className="text-2xl font-semibold">{assessment.title}</h1>
            <p className="mt-1 text-sm text-muted">
              Score {report.totalScore}/{report.maxScore} · Percentile{" "}
              {report.percentile}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/candidate"
              className="rounded-md border border-line bg-elevated px-3 py-1.5 text-xs"
            >
              Candidate view
            </Link>
            <Link
              href="/reviewer"
              className="rounded-md border border-line bg-elevated px-3 py-1.5 text-xs"
            >
              Reviewer view
            </Link>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-xl border border-line bg-panel p-4 lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.16em] text-soft">
              Accuracy trend
            </p>
            <div className="mt-3 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={report.timeline}>
                  <XAxis dataKey="index" stroke="var(--muted)" />
                  <YAxis stroke="var(--muted)" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="accuracyPct"
                    stroke="var(--accent)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="rounded-xl border border-line bg-panel p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-soft">
              Topic radar
            </p>
            <div className="mt-3 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={report.topicRadar} outerRadius="70%">
                  <PolarGrid />
                  <PolarAngleAxis dataKey="topic" />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="var(--accent)"
                    fill="var(--accent)"
                    fillOpacity={0.24}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-line bg-panel p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-soft">
              Candidate comparison
            </p>
            <div className="mt-3 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonFor(report)}>
                  <XAxis dataKey="candidate" stroke="var(--muted)" />
                  <YAxis stroke="var(--muted)" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="var(--accent)"
                    strokeWidth={2.2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-muted">
              Benchmark built from similar historical tests (simulated dataset).
            </p>
          </article>

          <article className="rounded-xl border border-line bg-panel p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-soft">
              Strongest sub-topics
            </p>
            <ul className="mt-3 space-y-1 text-sm text-muted">
              {report.strongestTopics.map((item) => (
                <li key={item.topic}>
                  {item.topic}:{" "}
                  <span className="text-ink">{item.scorePct}%</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs uppercase tracking-[0.16em] text-soft">
              Needs improvement
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {report.weakestTopics.map((item) => (
                <li key={item.topic}>
                  {item.topic}:{" "}
                  <span className="text-warning">{item.scorePct}%</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_380px]">
          <article className="rounded-xl border border-line bg-panel p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.16em] text-soft">
                Per-question analysis
              </p>
              <select
                value={selectedQ}
                onChange={(event) => setSelectedQ(event.target.value)}
                className="rounded-md border border-line bg-elevated px-2 py-1 text-xs"
              >
                {report.evaluations.map((item) => (
                  <option key={item.questionId} value={item.questionId}>
                    {item.questionId}
                  </option>
                ))}
              </select>
            </div>

            {selectedEvaluation ? (
              <div className="mt-3 space-y-3 text-sm">
                <p className="text-muted">
                  Score: {selectedEvaluation.score}/10
                </p>
                <p
                  className={
                    selectedEvaluation.borderline
                      ? "text-warning"
                      : "text-muted"
                  }
                >
                  {selectedEvaluation.borderline
                    ? "Borderline: LLM uncertainty detected, human review recommended."
                    : `Confidence ${(selectedEvaluation.confidence * 100).toFixed(0)}%`}
                </p>
                <p className="rounded-lg border border-line bg-elevated p-3 text-muted">
                  {selectedEvaluation.reasoningTrace}
                </p>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-soft">
                    Rubric transparency
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-muted">
                    {selectedEvaluation.rubricScores.map((r) => (
                      <li key={r.criterion}>
                        {r.criterion}: {r.score}/{r.maxScore}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-soft">
                  Reviewer trace is visible only to reviewers. Candidate sees
                  rubric after submission.
                </p>
              </div>
            ) : null}
          </article>

          <article className="rounded-xl border border-line bg-panel p-4 text-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-soft">
              Reviewer override
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[4, 6, 8].map((score) => (
                <button
                  type="button"
                  key={score}
                  onClick={() => applyOverride(score)}
                  className="rounded-md border border-line bg-elevated px-2 py-1 text-xs text-muted"
                >
                  Set {score}/10
                </button>
              ))}
            </div>
            <textarea
              value={overrideNote}
              onChange={(event) => setOverrideNote(event.target.value)}
              className="mt-3 h-24 w-full rounded-md border border-line bg-elevated p-2 text-xs"
              placeholder="Add required override note"
            />

            <p className="mt-4 text-xs uppercase tracking-[0.16em] text-soft">
              Coding replay
            </p>
            {replayFrames.length > 0 ? (
              <div className="mt-2 space-y-2">
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, replayFrames.length - 1)}
                  value={frameIndex}
                  onChange={(event) =>
                    setFrameIndex(Number(event.target.value))
                  }
                  className="w-full"
                />
                <p className="text-[11px] text-muted">
                  Frame {frameIndex + 1}/{replayFrames.length} ·{" "}
                  {frame?.language ?? "-"}
                </p>
                <pre className="max-h-48 overflow-auto rounded-md border border-line bg-elevated p-2 text-[11px] text-muted">
                  {frame?.code ?? "No frame"}
                </pre>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted">
                No coding timeline for the selected question.
              </p>
            )}

            <p className="mt-4 text-xs uppercase tracking-[0.16em] text-soft">
              Override history
            </p>
            <ul className="mt-2 max-h-32 space-y-1 overflow-auto text-xs text-muted">
              {report.reviewerOverrides.length === 0 ? (
                <li>No overrides yet.</li>
              ) : null}
              {report.reviewerOverrides.map((entry, idx) => (
                <li key={`${entry.questionId}-${idx}`}>
                  {entry.questionId}: {entry.previousScore} → {entry.newScore}
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="mt-4 rounded-xl border border-line bg-panel p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-soft">
            Side-by-side answer comparison
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <article className="rounded-md border border-line bg-elevated p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-soft">
                You
              </p>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-muted">
                {currentAnswerText}
              </pre>
            </article>
            <article className="rounded-md border border-line bg-elevated p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-soft">
                Candidate B
              </p>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-muted">
                Comparable answer summary with weaker tradeoff reasoning.
              </pre>
            </article>
            <article className="rounded-md border border-line bg-elevated p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-soft">
                Candidate C
              </p>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-muted">
                Comparable answer summary with stronger edge-case handling.
              </pre>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
};
