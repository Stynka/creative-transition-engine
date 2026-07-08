# Creative Transition Engine

A six-agent AI pipeline that translates creative and embodied experience for a specific receiver — a hiring panel, an arts funder — with every claim traceable to the practitioner's own words.

**Live app:**  https://claude.ai/public/artifacts/58ab431a-cbfb-46c3-ae17-41703590e239


## Why this isn't a resume builder
Resume tools polish wording. This system does three things they don't: it *extracts* capabilities from raw, messy first-person stories (with verbatim evidence quotes as an anti-fabrication gate); it *profiles the receiver* — including what they're implicitly afraid of; and it makes the mapping between the two *auditable*: a human approves or rejects every bridge before a word of prose is written.

## Architecture
```
raw story + CV line + voice sample + target text
   [0] SCOUT ── suggests interview questions from the target
   [1] ARCHIVIST ──────► Experience Graph (verbatim evidence quotes)
   [2] TARGET ANALYST ─► Receiver Profile (+ optional web search)
   [3] BRIDGE ─────────► mapping matrix + "rejection you'd get untranslated"
        ── HUMAN APPROVAL GATE ──
   [4] STORYTELLER ────► draft (voice rules + user's voice sample)
   [5] CRITIC ─────────► banned-pattern violations + fabrication check + rewrite
   Output: before/after, CV lines, Interview Armour (claim + its evidence)
```
Orchestration is deterministic application code (a state machine in `app/`); models perform bounded tasks with hard output budgets, JSON repair, and one automatic compress-and-retry. See `agents/` for each agent's system prompt and I/O contract, `docs/PRD.md` for product thinking, `docs/evals.md` for the evaluation framework.

## Iteration history
`v1/` contains the original single-skill "practice-translator" (CLAUDE.md, SKILL.md, trigger tests). Testing v1 exposed the gap this system fills: translation quality depends on receiver understanding, and outputs need measurable success criteria.

