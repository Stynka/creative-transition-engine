# Creative Transition Engine — project conventions

## What this project is
A six-agent career-translation pipeline (Scout, Archivist, Target Analyst, Bridge, Storyteller, Critic) deployed as a published Claude artifact. The orchestrator is deterministic app code in `app/creative-transition-engine.jsx`; agents are bounded LLM calls whose system prompts live in code and are mirrored as documentation in `agents/`.

## Philosophy (carried over from v1, extended)
- Translation, not polish. Receiver needs guide WHAT is selected, never the VOICE.
- Nothing enters an output without a verbatim evidence quote from the user's own words.
- A human approves every capability→need bridge before prose is written.
- Tone is testable: a banned-pattern spec (from real user cringe data) is enforced by the Critic with a violations report — never "write like a human" vibes.
- Honest claims only: no overclaiming transformation, no invented outcomes, no fake certainty. Prefer "I want to test whether…".

## Conventions
- British English everywhere.
- If a prompt changes in the app, update the matching file in `agents/` in the same commit.
- Every agent output is JSON with hard budgets (item counts, word caps) — token truncation is a product bug here, not a nuisance.
- Record every meaningful test run in `docs/evals.md` using the run-log template.
- Never add features that promise to evade AI detection; the product's integrity position is evidence traceability and the user's own voice.

## Working with Claude Code here
Typical asks: "update agents/bridge.md to match the prompt in the app", "add a run log to docs/evals.md from this screenshot", "draft the README quickstart". Claude Code should treat the practitioner as final authority on whether any translation is faithful.
