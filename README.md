# Creative Transition Engine

A six-agent AI pipeline that translates creative and embodied experience for a specific receiver — a hiring panel, an arts funder — with every claim traceable to the practitioner's own words.

**Live app:** https://claude.ai/public/artifacts/e29b1d55-9ff4-4efe-a0ab-c4451225b246

## Status: first-pass build, honestly scoped

It works end to end, and here's what it doesn't do yet:

- **No unit tests.** Evaluation is per-run (Critic violations, fabrication flags, bridge acceptance rate) plus two golden test cases with run logs. Nothing automated on the JSON parsing, repair, or retry logic.
- **N=1 validation.** I'm the first user. Next step is five concierge users from the dance community.
- **Visitors need a free Claude account to run it.** The published artifact bills API calls to whoever is using it, so there's a login wall before the first agent runs. It also has no rate limiting. A self-hosted build with a server-side key would fix both.
- **Microphone doesn't work in the live app.** The artifact sandbox blocks it. The UI directs users to OS-level dictation instead.
- **Terminal subagents chain manually.** The six specs in `.claude/agents/` invoke correctly, but sequencing them still needs a prompted instruction — the app holds the hardcoded orchestration.
- **No Visual Agent, no Application Filler.** Both specced in the PRD roadmap, both deliberately out of MVP scope.

## Why this isn't a resume builder

Resume tools polish wording. This system does three things they don't: it _extracts_ capabilities from raw, messy first-person stories (with verbatim evidence quotes as an anti-fabrication gate); it _profiles the receiver_ — including what they're implicitly afraid of; and it makes the mapping between the two _auditable_: a human approves or rejects every bridge before a word of prose is written.

## Architecture

```
raw story + CV line + voice sample + target text
   [0] SCOUT ── suggests interview questions from the target
   [1] ARCHIVIST ──────► Experience Graph (verbatim evidence quotes)
   [2] TARGET ANALYST ─► Receiver Profile (+ optional web search)
   [3] BRIDGE ─────────► mapping matrix + a rejection you might receive, and why
   ── GAP DISCOVERY: what the receiver asked for that isn't evidenced yet ──
        ── HUMAN APPROVAL GATE ──
   [4] STORYTELLER ────► draft (voice rules + user's voice sample)
   [5] CRITIC ─────────► banned-pattern violations + fabrication check + rewrite
   Output: before/after, CV lines, Interview Armour (claim + its evidence)
```

Orchestration is deterministic application code (a state machine in `app/`); models perform bounded tasks with hard output budgets, JSON repair, and one automatic compress-and-retry. See `.claude/agents/` for each agent's system prompt and I/O contract, `docs/PRD.md` for product thinking, `docs/evals.md` for the evaluation framework.

## Iteration history

`v1/` contains the original single-skill "practice-translator" (CLAUDE.md, SKILL.md, trigger tests). Testing v1 exposed the gap this system fills: translation quality depends on receiver understanding, and outputs need measurable success criteria.
