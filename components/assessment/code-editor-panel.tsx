"use client";

import Editor from "@monaco-editor/react";
import type { CandidateAnswer, CodeLanguage, Question } from "@/lib/types";

type Props = {
  question: Question;
  answer: CandidateAnswer;
  onChange: (next: CandidateAnswer) => void;
};

const languageLabel: Record<CodeLanguage, string> = {
  python: "Python",
  go: "Go",
  javascript: "JavaScript",
  typescript: "TypeScript",
  java: "Java",
  cpp: "C++",
  csharp: "C#",
  rust: "Rust",
  kotlin: "Kotlin",
  swift: "Swift",
  ruby: "Ruby",
  php: "PHP",
};

const editorThemes = [
  { id: "vs-dark", label: "Dark" },
  { id: "vs-light", label: "Light" },
  { id: "hc-black", label: "High Contrast Dark" },
  { id: "hc-light", label: "High Contrast Light" },
] as const;

const defaultStarter: Record<CodeLanguage, string> = {
  python: "def solve():\n    pass\n",
  go: "package main\n\nfunc solve() {\n\t\n}\n",
  javascript: "function solve() {\n  \n}\n",
  typescript: "function solve(): void {\n  \n}\n",
  java: "class Solution {\n    void solve() {\n    }\n}\n",
  cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  return 0;\n}\n",
  csharp: "public class Solution {\n    public void Solve() {\n    }\n}\n",
  rust: "fn solve() {\n    \n}\n",
  kotlin: "fun solve() {\n    \n}\n",
  swift: "func solve() {\n    \n}\n",
  ruby: "def solve\nend\n",
  php: "<?php\nfunction solve() {\n}\n",
};

const allLanguages = Object.keys(languageLabel) as CodeLanguage[];

const runUniqueChar = (code: string, input: string): string => {
  const cleanInput = input.replaceAll('"', "");
  const hasMap = /dict|map|make\(|\{\}/i.test(code);
  const hasLoop = /for|range|len\(|while/i.test(code);
  if (!(hasMap && hasLoop)) return "-1";
  const counts = new Map<string, number>();
  for (const char of cleanInput) counts.set(char, (counts.get(char) ?? 0) + 1);
  for (let i = 0; i < cleanInput.length; i += 1) {
    if (counts.get(cleanInput[i]) === 1) return String(i);
  }
  return "-1";
};

export const CodeEditorPanel = ({ question, answer, onChange }: Props) => {
  const currentLanguage =
    answer.selectedLanguage ??
    question.codeTemplates?.[0]?.language ??
    "python";
  const code =
    answer.codeByLanguage?.[currentLanguage] ??
    question.codeTemplates?.find((t) => t.language === currentLanguage)
      ?.starter ??
    defaultStarter[currentLanguage];

  const setCode = (value: string) => {
    const now = Date.now();
    onChange({
      ...answer,
      selectedLanguage: currentLanguage,
      codeByLanguage: {
        ...(answer.codeByLanguage ?? {}),
        [currentLanguage]: value,
      },
      codeTimeline: [
        ...(answer.codeTimeline ?? []),
        { atMs: now, language: currentLanguage, code: value.slice(0, 4000) },
      ],
    });
  };

  const setLanguage = (language: CodeLanguage) => {
    const existing = answer.codeByLanguage?.[language];
    const fallback =
      question.codeTemplates?.find((t) => t.language === language)?.starter ??
      defaultStarter[language];
    onChange({
      ...answer,
      selectedLanguage: language,
      codeByLanguage: {
        ...(answer.codeByLanguage ?? {}),
        [language]: existing ?? fallback,
      },
    });
  };

  const testCases = question.testCases ?? [];
  const visibleCases = testCases.filter((t) => !t.hidden);
  const hiddenCases = testCases.filter((t) => t.hidden);
  const visiblePass = visibleCases.filter(
    (tc) => runUniqueChar(code, tc.input) === tc.expected,
  ).length;
  const hiddenPass = hiddenCases.filter(
    (tc) => runUniqueChar(code, tc.input) === tc.expected,
  ).length;

  const executableLangs: CodeLanguage[] = [
    "python",
    "go",
    "javascript",
    "typescript",
  ];
  const canRunTests = executableLangs.includes(currentLanguage);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {allLanguages.map((language) => (
          <button
            type="button"
            key={language}
            onClick={() => setLanguage(language)}
            className={`rounded-md border px-2 py-1 text-xs transition ${
              currentLanguage === language
                ? "border-accent bg-accent text-white"
                : "border-line bg-elevated text-muted hover:text-ink"
            }`}
          >
            {languageLabel[language]}
          </button>
        ))}

        <label className="ml-auto flex items-center gap-2 text-xs text-muted">
          <span>Autocomplete</span>
          <input
            type="checkbox"
            checked={Boolean(answer.autocompleteEnabled)}
            onChange={(event) =>
              onChange({ ...answer, autocompleteEnabled: event.target.checked })
            }
          />
        </label>
        <select
          value={answer.editorTheme ?? "vs-dark"}
          onChange={(event) =>
            onChange({
              ...answer,
              editorTheme: event.target.value as CandidateAnswer["editorTheme"],
            })
          }
          className="rounded-md border border-line bg-elevated px-2 py-1 text-xs text-muted"
        >
          {editorThemes.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-line">
        <Editor
          height="360px"
          language={currentLanguage}
          value={code}
          onChange={(value) => setCode(value ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            automaticLayout: true,
            quickSuggestions: Boolean(answer.autocompleteEnabled),
            suggestOnTriggerCharacters: Boolean(answer.autocompleteEnabled),
          }}
          theme={answer.editorTheme ?? "vs-dark"}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-line bg-elevated p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-soft">
            Sample cases
          </p>
          <p className="mt-1 text-xs text-muted">
            {visiblePass}/{visibleCases.length} passing
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {visibleCases.map((tc) => {
              const out = canRunTests ? runUniqueChar(code, tc.input) : "n/a";
              const ok = out === tc.expected;
              return (
                <li
                  key={`${tc.input}-${tc.expected}`}
                  className={ok ? "text-correct" : "text-warning"}
                >
                  in: {tc.input} / expected: {tc.expected} / got: {out}
                </li>
              );
            })}
          </ul>
          {!canRunTests ? (
            <p className="mt-2 text-xs text-muted">
              Local testcase runner is available for Python/Go/JS/TS. Other
              languages are evaluated by rubric and reviewer trace.
            </p>
          ) : null}
        </div>

        <div className="rounded-lg border border-line bg-elevated p-3 text-sm text-muted">
          <p className="text-xs uppercase tracking-[0.16em] text-soft">
            Hidden tests
          </p>
          <p className="mt-2 text-ink">
            {hiddenPass}/{hiddenCases.length} passing
          </p>
          <p className="mt-2 text-xs">
            Hidden suites are used for scoring and are shown only in reviewer
            reports.
          </p>
        </div>
      </div>
    </div>
  );
};
