"use client";

import { useEffect } from "react";
import { CodeEditorPanel } from "@/components/assessment/code-editor-panel";
import { MathMarkdown } from "@/components/markdown/math-markdown";
import type { CandidateAnswer, Question } from "@/lib/types";

type Props = {
  question: Question;
  answer: CandidateAnswer;
  index: number;
  total: number;
  onAnswerChange: (answer: CandidateAnswer) => void;
  onConfirm: () => void;
};

const autoFormatPastedCode = (input: string) => {
  if (
    /^\s*(def |func |class |const |let |var |if\s*\(|for\s*\(|while\s*\()/m.test(
      input,
    )
  ) {
    return `\n\n\`\`\`\n${input.trim()}\n\`\`\`\n`;
  }
  return input;
};

export const QuestionRenderer = ({
  question,
  answer,
  index,
  total,
  onAnswerChange,
  onConfirm,
}: Props) => {
  useEffect(() => {
    if (question.kind !== "mcq") return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        ["1", "2", "3", "4"].includes(event.key) &&
        question.options?.[Number(event.key) - 1]
      ) {
        const selected = question.options[Number(event.key) - 1];
        onAnswerChange({ ...answer, selectedOptionId: selected.id });
      }
      if (event.key === "Enter") {
        onConfirm();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [question, answer, onAnswerChange, onConfirm]);

  return (
    <section className="space-y-5 rounded-xl border border-line bg-panel p-5 md:p-7">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-soft">
            Question {index + 1}/{total}
          </p>
          <p className="mt-1 text-sm text-muted">
            {question.subTopic} · {question.difficulty.toUpperCase()} · ~
            {Math.round(question.estimatedSeconds / 60)}m
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            onAnswerChange({ ...answer, flagged: !answer.flagged })
          }
          className={`rounded-md border px-2.5 py-1 text-xs ${
            answer.flagged
              ? "border-accent bg-accent text-white"
              : "border-line bg-elevated text-muted hover:text-ink"
          }`}
        >
          {answer.flagged ? "Flagged" : "Flag"}
        </button>
      </header>

      <MathMarkdown
        content={question.prompt}
        definitions={question.definitions}
      />

      {question.kind === "mcq" ? (
        <div className="space-y-2">
          {(question.options ?? []).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() =>
                onAnswerChange({ ...answer, selectedOptionId: option.id })
              }
              className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                answer.selectedOptionId === option.id
                  ? "border-accent bg-accent/10 text-ink"
                  : "border-line bg-elevated text-muted hover:text-ink"
              }`}
            >
              <span className="mr-2 font-semibold">{option.label}.</span>
              {option.text}
            </button>
          ))}
          <p className="text-xs text-soft">
            Keyboard: `1-4` select option, `Enter` confirm.
          </p>
        </div>
      ) : null}

      {question.kind === "descriptive" ? (
        <textarea
          value={answer.descriptiveAnswer ?? ""}
          onChange={(event) =>
            onAnswerChange({ ...answer, descriptiveAnswer: event.target.value })
          }
          onPaste={(event) => {
            const pasted = event.clipboardData.getData("text");
            const formatted = autoFormatPastedCode(pasted);
            if (formatted !== pasted) {
              event.preventDefault();
              const next = `${answer.descriptiveAnswer ?? ""}${formatted}`;
              onAnswerChange({ ...answer, descriptiveAnswer: next });
            }
          }}
          className="h-56 w-full rounded-lg border border-line bg-elevated p-3 text-sm text-ink outline-none ring-accent transition focus:ring-1"
          placeholder="Write your answer in markdown. LaTeX is supported with $...$ or $$...$$."
        />
      ) : null}

      {question.kind === "coding" ? (
        <CodeEditorPanel
          question={question}
          answer={answer}
          onChange={onAnswerChange}
        />
      ) : null}

      <div className="flex items-center justify-between border-t border-line pt-4">
        <p className="text-xs text-soft">
          Current question time: {answer.timeSpentSeconds}s{" "}
          {answer.confirmed ? "· Confirmed" : ""}
        </p>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          Confirm & next
        </button>
      </div>
    </section>
  );
};
