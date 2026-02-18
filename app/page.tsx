import Link from "next/link";

const phases = [
  {
    title: "Phase 1 · Assessment foundation",
    tasks: [
      "Adaptive question generation on test start",
      "Difficulty ramp and timing strategy per subject",
      "Interviewer preview/edit/regenerate before lock",
    ],
  },
  {
    title: "Phase 2 · Candidate runtime",
    tasks: [
      "MCQ + descriptive + coding questions",
      "Markdown/LaTeX support and definitions tooltips",
      "Autosave, per-question timer, flags, keyboard shortcuts",
    ],
  },
  {
    title: "Phase 3 · Evaluation and reporting",
    tasks: [
      "LLM-style rubric scoring + reasoning traces",
      "Borderline answer detection and reviewer overrides",
      "Radar/timeline/comparison analytics + percentile",
    ],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <header className="border-b border-line pb-7">
          <p className="text-xs uppercase tracking-[0.16em] text-soft">
            redpen
          </p>
          <h1 className="mt-2 max-w-3xl font-headline text-4xl leading-tight md:text-5xl">
            Precise interview testing with adaptive generation, coding
            workflows, and reviewer-grade evaluation.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            The platform starts easy and ramps intelligently. Every interaction
            is tracked for deep reporting.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/candidate"
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
            >
              Open candidate flow
            </Link>
            <Link
              href="/reviewer"
              className="rounded-md border border-line bg-panel px-4 py-2 text-sm text-muted"
            >
              Open reviewer preview
            </Link>
            <Link
              href="/report"
              className="rounded-md border border-line bg-panel px-4 py-2 text-sm text-muted"
            >
              Open report
            </Link>
          </div>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {phases.map((phase) => (
            <article
              key={phase.title}
              className="rounded-xl border border-line bg-panel p-4"
            >
              <h2 className="font-medium">{phase.title}</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {phase.tasks.map((task) => (
                  <li key={task}>{task}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
