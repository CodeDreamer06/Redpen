"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { QuestionRenderer } from "@/components/assessment/question-renderer";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  answerCompletionPct,
  ensureAnswer,
  totalTimeSpent,
  updateAnswer,
} from "@/lib/analytics";
import {
  loadAnswers,
  loadAssessment,
  loadCalibration,
  saveAnswers,
  saveAssessment,
  saveReport,
} from "@/lib/storage";
import type { Assessment, CandidateAnswer, Report } from "@/lib/types";

const subjects = [
  "Computer Science",
  "Machine Learning",
  "System Design",
  "Data Structures",
];

export const TestShell = () => {
  const [subject, setSubject] = useState(subjects[0]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<CandidateAnswer[]>([]);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existingAssessment = loadAssessment();
    if (existingAssessment) {
      setAssessment(existingAssessment);
      setAnswers(loadAnswers());
    }
  }, []);

  useEffect(() => {
    if (!assessment) return;
    const interval = setInterval(() => {
      const q = assessment.questions[index];
      if (!q) return;
      setAnswers((current) => {
        const next = updateAnswer(current, q.id, (answer) => ({
          ...answer,
          timeSpentSeconds: answer.timeSpentSeconds + 1,
        }));
        saveAnswers(next);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [assessment, index]);

  const startAssessment = async () => {
    setError(null);
    setBusy(true);
    const response = await fetch("/api/assessment/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject }),
    });
    const payload = (await response.json()) as { assessment?: Assessment };
    const generated = payload.assessment;
    if (!generated) {
      setError("Failed to generate assessment. Please try again.");
      setBusy(false);
      return;
    }
    const initialAnswers = generated.questions.map((q) => ({
      questionId: q.id,
      timeSpentSeconds: 0,
    }));
    setAssessment(generated);
    setAnswers(initialAnswers);
    setIndex(0);
    saveAssessment(generated);
    saveAnswers(initialAnswers);
    setBusy(false);
  };

  const currentQuestion = assessment?.questions[index];
  const currentAnswer = currentQuestion
    ? ensureAnswer(answers, currentQuestion.id)
    : null;

  const progress = useMemo(() => {
    if (!assessment) return 0;
    return answerCompletionPct(answers, assessment.questions.length);
  }, [assessment, answers]);

  const submit = async () => {
    if (!assessment) return;
    setError(null);
    setBusy(true);
    const calibration = loadCalibration() ?? undefined;
    const response = await fetch("/api/assessment/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessment, answers, calibration }),
    });
    const payload = (await response.json()) as { report?: Report };
    const report = payload.report;
    if (!report) {
      setError("Evaluation failed. Please retry submission.");
      setBusy(false);
      return;
    }
    saveReport(report);
    setBusy(false);
    window.location.href = "/report";
  };

  if (!assessment) {
    return (
      <div className="min-h-screen bg-bg text-ink">
        <ProgressBar progress={0} />
        <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-8 md:px-8 md:py-12">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">redpen</h1>
              <p className="text-sm text-muted">
                Adaptive interview assessments with reviewer-first analytics.
              </p>
            </div>
            <ThemeToggle />
          </header>

          <section className="grid gap-6 rounded-2xl border border-line bg-panel p-6 md:grid-cols-[1.6fr_1fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-soft">
                Create test
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Generate question paper on start
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                The LLM chooses question count, pacing, and difficulty ramp
                based on subject complexity. You can preview and edit in
                reviewer mode before locking.
              </p>

              <label
                className="mt-6 block text-sm text-muted"
                htmlFor="subject-select"
              >
                Subject
              </label>
              <select
                id="subject-select"
                className="mt-2 w-full rounded-lg border border-line bg-elevated p-2 text-sm"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              >
                {subjects.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={startAssessment}
                disabled={busy}
                className="mt-6 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Generating..." : "Start assessment"}
              </button>
              {error ? (
                <p className="mt-3 text-sm text-warning">{error}</p>
              ) : null}
            </div>

            <aside className="space-y-3 rounded-xl border border-line bg-elevated p-4 text-sm text-muted">
              <p className="font-medium text-ink">Must-have experience ready</p>
              <p>Markdown + LaTeX prompts and answers.</p>
              <p>MCQ shortcuts, ambient progress, autosave.</p>
              <p>Coding questions with language switch + hidden tests.</p>
              <p>Reviewer-side trace, overrides, percentile, radar charts.</p>
              <div className="pt-2">
                <Link
                  href="/reviewer"
                  className="text-accent underline-offset-2 hover:underline"
                >
                  Open reviewer preview
                </Link>
              </div>
            </aside>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-8 text-ink">
      <ProgressBar progress={progress} />

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">{assessment.title}</h1>
            <p className="text-sm text-muted">
              Reading time estimate: {assessment.readingTimeMinutes} min · LLM
              strategy: {assessment.strategyNote}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/reviewer"
              className="rounded-md border border-line bg-elevated px-3 py-1.5 text-xs text-muted"
            >
              Reviewer preview
            </Link>
            <Link
              href="/report"
              className="rounded-md border border-line bg-elevated px-3 py-1.5 text-xs text-muted"
            >
              Report
            </Link>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {currentQuestion && currentAnswer ? (
              <QuestionRenderer
                question={currentQuestion}
                answer={currentAnswer}
                index={index}
                total={assessment.questions.length}
                onAnswerChange={(answer) => {
                  const next = updateAnswer(
                    answers,
                    answer.questionId,
                    () => answer,
                  );
                  setAnswers(next);
                  saveAnswers(next);
                }}
                onConfirm={() => {
                  const next = updateAnswer(
                    answers,
                    currentQuestion.id,
                    (answer) => ({
                      ...answer,
                      confirmed: true,
                    }),
                  );
                  setAnswers(next);
                  saveAnswers(next);
                  setIndex((prev) =>
                    Math.min(assessment.questions.length - 1, prev + 1),
                  );
                }}
              />
            ) : null}
          </motion.div>

          <aside className="h-fit space-y-3 rounded-xl border border-line bg-panel p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-soft">
              Session
            </p>
            <p className="text-sm text-muted">
              Total time: {Math.round(totalTimeSpent(answers) / 60)} min
            </p>
            <p className="text-sm text-muted">Completion: {progress}%</p>
            <p className="text-sm text-muted">
              Flagged: {answers.filter((a) => a.flagged).length}/
              {assessment.questions.length}
            </p>

            <div className="grid grid-cols-5 gap-1 pt-2">
              {assessment.questions.map((q, i) => {
                const answer = ensureAnswer(answers, q.id);
                return (
                  <button
                    type="button"
                    key={q.id}
                    onClick={() => setIndex(i)}
                    className={`rounded border p-1 text-xs ${
                      i === index
                        ? "border-accent bg-accent text-white"
                        : answer.flagged
                          ? "border-warning text-warning"
                          : answer.confirmed
                            ? "border-correct text-correct"
                            : "border-line text-muted"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
                className="flex-1 rounded border border-line bg-elevated px-2 py-1.5 text-xs text-muted"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() =>
                  setIndex((prev) =>
                    Math.min(assessment.questions.length - 1, prev + 1),
                  )
                }
                className="flex-1 rounded border border-line bg-elevated px-2 py-1.5 text-xs text-muted"
              >
                Next
              </button>
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={submit}
              className="mt-2 w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {busy ? "Evaluating..." : "Submit and evaluate"}
            </button>
            {error ? <p className="text-xs text-warning">{error}</p> : null}
          </aside>
        </div>
      </main>
    </div>
  );
};
