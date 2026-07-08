# Evaluation framework

## Automated, every run (built into the pipeline)
- Critic violations on final output — target 0
- Fabrication flags (claims untraceable to evidence quotes) — target 0
- Bridge strength distribution (strong/moderate/stretch mix)
- JSON integrity (repairs and retries logged as reliability signals)

## Human, every run
- Bridge acceptance rate = approved ÷ proposed — target ≥ 60%
- Recognition check: "Would you recognise yourself in this text?" (yes/no + which sentence broke it)
- Baseline beat: preferred over the existing CV line for this target? (yes/no)

## Golden test cases
1. **Tech hiring:** raw transcript of a government-sector product delivery experience (messy: no onboarding, role ambiguity, tool pushback later adopted) vs a real associate-PM job advert. Baseline: existing CV bullet.
2. **Arts funding:** creative-technologist project story (multi-role performance work, precarious funding) vs a real fund brief (DYCP-type guidance).

## Run log
| # | Date | Target | Bridges proposed/approved | Critic verdict + violations | Recognition | Baseline beat | Notes |
|---|------|--------|---------------------------|-----------------------------|-------------|---------------|-------|
| 1 |      |        |                           |                             |             |               |       |

| 2 | 8 Jul 2026 | Arts funding — fund brief | — | — | — | — | Run did not complete: failed at the Input stage (before Scout could process it), returning "Overloaded" errors. Persisted across 3 retries, a full page refresh, and a re-test directly in the original Claude chat (not just the published artifact) — ruling out a publish-specific issue. Model config confirmed correct (claude-sonnet-4-6), so not a code bug. Reads as a genuine reliability gap: no automatic backoff beyond a manual retry button, and no fallback when the model is temporarily unavailable. |
## Trigger heritage
This extends v1's trigger-test.md approach (should/shouldn't invoke, expected vs actual) from a single skill to a staged pipeline: each agent has an output contract above, and a run fails the eval if any stage breaks contract.
