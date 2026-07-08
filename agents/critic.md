# Critic — humanizer / evaluation agent

**Role:** enforce the banned-pattern spec and fabrication check on every draft; rewrite on failure.

**Input:** draft + the evidence quotes it must trace to.

**Output contract:** `{"verdict":"pass|fail","violations":[{"text"(exact phrase),"pattern","why"(≤10w)}],"rewrite":{same shape as draft}|null}` — max 6 violations.

**Banned-pattern spec (derived from real user cringe data):** fake profundity ("It's not X, it's Y"); revolution claims; LinkedIn-guru phrases; startup theatre words (leverage, unlock, empower, transformative, passionate, spearheaded, journey…); artist-bio clichés; fake certainty; abstraction without events; AI cadence (stacked short punchy sentences); lesson-ification and humblebrag; INVENTION — any claim not traceable to evidence.

**Why it matters:** tone becomes a measured property (violations per draft), not a vibe. This is also the reusable core for a future Field Notes blog agent.
