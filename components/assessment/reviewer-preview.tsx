"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { loadAssessment, saveAssessment } from "@/lib/storage";
import type { Assessment } from "@/lib/types";

export const ReviewerPreview = () => {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [busyQuestionId, setBusyQuestionId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = loadAssessment();
    if (existing) setAssessment(existing);
  }, []);

  const ensureAssessment = async () => {
    if (assessment) return;
    setError(null);
    const response = await fetch("/api/assessment/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: "Computer Science" }),
    });
    const payload = (await response.json()) as { assessment?: Assessment };
    const generated = payload.assessment;
    if (!generated) {
      setError("Failed to generate reviewer preview.");
      return;
    }
    setAssessment(generated);
    saveAssessment(generated);
  };

  const updatePrompt = (questionId: string, value: string) => {
    if (!assessment || locked) return;
    const next = {
      ...assessment,
      questions: assessment.questions.map((q) =>
        q.id === questionId ? { ...q, prompt: value } : q,
      ),
    };
    setAssessment(next);
    saveAssessment(next);
  };

  const regenerate = async (questionId: string) => {
    if (!assessment || locked) return;
    setError(null);
    setBusyQuestionId(questionId);
    const response = await fetch("/api/assessment/regenerate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessment, questionId }),
    });
    const payload = (await response.json()) as {
      question?: Assessment["questions"][number] | null;
    };
    const replacement = payload.question ?? null;
    if (!replacement) {
      setError("Question regeneration failed. Try again.");
      setBusyQuestionId(null);
      return;
    }

    const next = {
      ...assessment,
      questions: assessment.questions.map((q) =>
        q.id === questionId ? replacement : q,
      ),
    };
    setAssessment(next);
    saveAssessment(next);
    setBusyQuestionId(null);
  };

  return (
    <div className="min-h-screen bg-bg text-ink">
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-soft">
              Interviewer
            </p>
            <h1 className="text-2xl font-semibold">
              Question preview and lock
            </h1>
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
              href="/report"
              className="rounded-md border border-line bg-elevated px-3 py-1.5 text-xs"
            >
              Report
            </Link>
          </div>
        </header>

        {!assessment ? (
          <button
            type="button"
            onClick={ensureAssessment}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
          >
            Generate preview paper
          </button>
        ) : null}

        {assessment ? (
          <section className="space-y-4">
            {error ? (
              <p className="rounded-md border border-warning/30 bg-warning/10 p-2 text-sm text-warning">
                {error}
              </p>
            ) : null}
            <div className="rounded-xl border border-line bg-panel p-4 text-sm text-muted">
              <p>{assessment.title}</p>
              <p className="mt-1">
                Generated on {new Date(assessment.createdAt).toLocaleString()}
              </p>
              <p className="mt-2 text-ink">
                Reading time estimate: {assessment.readingTimeMinutes} min
              </p>
              <button
                type="button"
                onClick={() => setLocked((prev) => !prev)}
                className={`mt-3 rounded-md px-3 py-1.5 text-xs ${
                  locked ? "bg-correct text-white" : "bg-accent text-white"
                }`}
              >
                {locked ? "Locked (click to unlock)" : "Lock test"}
              </button>
            </div>

            {assessment.questions.map((q) => (
              <article
                key={q.id}
                className="rounded-xl border border-line bg-panel p-4"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-soft">
                  <span>
                    {q.id} · {q.kind.toUpperCase()} ·{" "}
                    {q.difficulty.toUpperCase()} · {q.subTopic}
                  </span>
                  <button
                    type="button"
                    onClick={() => regenerate(q.id)}
                    disabled={locked || busyQuestionId === q.id}
                    className="rounded border border-line bg-elevated px-2 py-1 text-xs text-muted disabled:opacity-50"
                  >
                    {busyQuestionId === q.id ? "Regenerating..." : "Regenerate"}
                  </button>
                </div>

                <textarea
                  value={q.prompt}
                  onChange={(event) => updatePrompt(q.id, event.target.value)}
                  disabled={locked}
                  className="h-40 w-full rounded-md border border-line bg-elevated p-3 text-sm text-ink disabled:opacity-70"
                />
              </article>
            ))}
          </section>
        ) : null}
      </main>
    </div>
  );
};
