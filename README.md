# redpen

Redpen is an adaptive interview assessment platform for technical and non-technical subjects. It generates question papers at test start, evaluates responses with rubric-based scoring, and produces reviewer-grade analytics.

## Product Goals
- Build serious, high-signal interview assessments.
- Start easy and ramp toward hard questions adaptively.
- Support MCQ, descriptive, and coding questions in a single assessment.
- Use LLMs for generation and evaluation while keeping reviewer control.
- Track detailed candidate telemetry and surface meaningful insights.

## Current Status (Implemented)

### Candidate Experience
- Adaptive assessment generation at runtime.
- Reading-time estimate shown before/at start.
- MCQ + descriptive + coding question support.
- Markdown + LaTeX rendering.
- Definitions tooltip for technical terms.
- Ambient top progress bar.
- Keyboard shortcuts for MCQ: `1-4` to select, `Enter` to confirm.
- Question flagging.
- Per-question time tracking.
- Autosave/partial save in browser storage.
- Dark mode.

### Coding Experience
- Monaco editor integration.
- Language switching within a coding question.
- Visible sample tests + hidden tests.
- Optional autocomplete toggle.
- Coding timeline capture for replay.

### Reviewer Experience
- Pre-test question preview.
- Per-question manual edit.
- Per-question regenerate.
- Lock/unlock flow before candidate takes test.

### Evaluation & Reporting
- Rubric-based per-question scoring.
- Per-question reasoning trace for reviewers.
- Borderline/uncertain answer surfacing.
- Candidate-level score and percentile.
- Topic radar chart.
- Accuracy progression chart.
- Candidate comparison view (baseline scaffold).
- Reviewer override with note.
- Override feedback loop (calibration factor scaffold).

## Tech Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Monaco Editor (`@monaco-editor/react`)
- Markdown + math: `react-markdown`, `remark-math`, `rehype-katex`
- Charts: `recharts`
- Theme system: `next-themes`

## LLM Configuration
Use environment variables. Do **not** hardcode keys.

Required values:
- `VOIDAI_BASE_URL=https://api.voidai.app/v1/chat/completions`
- `VOIDAI_MODEL=gpt-5.2`
- `VOIDAI_API_KEY=<secret>`

Optional runtime controls:
- `ENABLE_VERCEL_DB=1` (enable persistence calls)
- `NEXT_PUBLIC_ENABLE_LIVE_LLM=1` (force UI to prefer live API flows)

Example local setup:
```bash
cp .env.local.example .env.local
# fill in VOIDAI_API_KEY in .env.local
```

## Project Structure
```text
app/
  page.tsx                  # landing + phase overview
  candidate/page.tsx        # candidate assessment runtime
  reviewer/page.tsx         # interviewer preview/edit/regenerate/lock
  report/page.tsx           # analytics + override dashboard
  api/
    assessment/generate     # live question generation endpoint
    assessment/evaluate     # live evaluation endpoint
    assessment/regenerate   # live question regeneration endpoint

components/
  assessment/
    test-shell.tsx          # candidate orchestration shell
    question-renderer.tsx   # MCQ/descriptive/coding renderer
    code-editor-panel.tsx   # Monaco surface + language/theme/tests
    reviewer-preview.tsx    # reviewer authoring workflow
    report-dashboard.tsx    # charts, traces, overrides, replay
  markdown/
    math-markdown.tsx       # markdown + LaTeX render
  ui/
    definition-tooltip.tsx
    progress-bar.tsx
    theme-toggle.tsx
  providers/
    theme-provider.tsx

data/
  glossary.ts               # term definitions

lib/
  types.ts                  # domain models
  mock-llm.ts               # fallback/mock generation + scoring
  llm.ts                    # live VoidAI LLM client with retries
  assessment-service.ts     # server-side orchestration + fallback
  analytics.ts              # completion/time helpers
  storage.ts                # browser persistence helpers
  db.ts                     # Vercel DB integration scaffolding
```

## Architecture Notes
- The UI interacts with API routes for generation/evaluation/regeneration.
- Server routes call `assessment-service`, which uses:
  1. Live LLM path (`lib/llm.ts`) when configured.
  2. Mock fallback path (`lib/mock-llm.ts`) if live path fails.
- This ensures graceful degradation during outages/rate limits.
- Local storage protects candidate progress from refresh/crash.

## Vercel Deployment Notes
1. Import repo in Vercel.
2. Configure env vars:
   - `VOIDAI_BASE_URL`
   - `VOIDAI_MODEL`
   - `VOIDAI_API_KEY`
   - optional feature flags above
3. If using Vercel Postgres, add connection vars from Vercel dashboard.
4. Deploy.

## Roadmap (Planned)

### Near-Term
- Persist assessments, attempts, and reports in Vercel Postgres.
- Real historical cohort benchmarking from DB.
- Multi-attempt/session resume across devices.
- Reviewer queue with filters for borderline answers.
- Strong audit logs for overrides and rubric changes.

### Mid-Term
- Sandboxed code execution workers (language-specific) with reliable hidden tests.
- Pluggable proctoring signals (optional).
- Adaptive sequencing that changes next question using live performance.
- Anti-cheat heuristics and anomaly flags.

### Long-Term
- Organization-level skill taxonomy and competency maps.
- Interviewer calibration analytics across teams.
- Fine-grained LLM evaluator tuning per role/subject.

## Operational Stability Checklist
- [ ] All API routes return typed error envelopes.
- [ ] Retries + timeouts on LLM calls.
- [ ] Fallback scoring path always available.
- [ ] Autosave writes throttled to avoid performance hits.
- [ ] Build and lint clean before every push.

## Maintainer Playbook
- Keep domain types in `lib/types.ts` as single source of truth.
- Avoid adding UI-only fields to server models unless intentional.
- Preserve semantic color tokens and typographic hierarchy.
- Keep reviewer controls explicit and auditable.

## Agent Instructions (for future AI/code assistants)
- Commit frequently in small, reviewable slices.
- Never commit secrets or `.env*` files.
- Prefer API route + service-layer changes over direct UI-side logic coupling.
- Run `npm run lint` and `npm run build` before finalizing changes.
- If adding new question types, update:
  - `lib/types.ts`
  - `components/assessment/question-renderer.tsx`
  - generation + evaluation service logic
  - report visualizations

## Development
```bash
npm install
npm run dev
```

Quality checks:
```bash
npm run lint
npm run build
```
