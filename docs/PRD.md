# Creative Transition Engine — Product Requirements Document

**Version:** 1.0 · July 2026 · Author: Justyna Janiszewska
**Status:** MVP built and deployed (published Claude artifact)

## 1. Problem statement

Creatives leaving performing careers do not struggle with portfolio layouts; they struggle with extracting meaning from their past and translating it for a new audience. When a dancer writes "I choreographed a 10-person piece," a generic AI resume tool makes it sound more professional. It does not surface what the experience actually demonstrates (spatial systems thinking, negotiating creative egos, delivering under fixed constraints), and it does not know what a specific receiver — a product hiring panel, an arts funder — needs to see. The result is either untranslated experience that receivers can't read, or AI-polished sludge that collapses in interview.

Existing tools (Teal, Rezi, Kickresume, LinkedIn AI) compete on polish. Polish is a commodity. Translation is not.

## 2. Target users and personas

**Persona 1 — The career-transitioning performer.** 13+ years in dance/theatre, retraining into UX or product. Rich experience that reads as irrelevant on paper. Fears sounding fake; has been burned by AI tools that make her CV sound like everyone else's. Needs claims she can defend in an interview.

**Persona 2 — The applying artist.** Mid-career practitioner applying to Arts Council–type funds. Fluent in her practice, not in funder dialect. Needs to answer what the funder is implicitly afraid of (money with no legacy, vague outcomes) without flattening her work into grant-speak.

Both personas are served by one product because the Target Analyst is input-driven: it builds a receiver profile from whatever target text is pasted, rather than from a hardcoded receiver type.

## 3. Success metrics

1. **Critic violations on final output = 0** (banned-pattern list derived from real user cringe data; measured automatically by the Critic agent every run).
2. **Bridge acceptance rate ≥ 60%** — the share of proposed capability→need mappings the human approves. Below this, the Bridge agent is confabulating or stretching.
3. **Recognition check** — the practitioner answers "would you recognise yourself in this text?" after each run (qualitative; the skill's core quality bar).
4. **Baseline beat** — in side-by-side comparison, user prefers the translated version over their existing CV line for the specific target.
5. **Fabrication rate = 0** — every claim in the output traces to a verbatim evidence quote extracted from the user's own words.

**Business impact:** for individuals, more interviews/funding conversations per application. For institutions (roadmap buyers: dancer transition charities, conservatoires), a scalable version of the 1:1 career-coaching conversation they cannot staff.

## 4. Use cases

- Translate one messy voice-note story into a cover-letter paragraph for a pasted job advert.
- Translate the same story into a funding statement for a pasted fund brief (same pipeline, different receiver — demonstrated in demo).
- Audit an existing CV line: see what a specific receiver _cannot see_ in it (the "blindspot" output).
- Generate CV-ready bullets with evidence traceability for interview preparation.

## 5. Architecture

Five sequential agents, each a separate LLM call with its own system prompt, passing structured JSON artefacts. A human approval gate sits before any prose is written.

```
Raw story + CV line + target text
        │
   [1] ARCHIVIST ──────────► Experience Graph
        │                    {episode, verbatim evidence_quote,
        │                     capabilities[], confidence}
        ▼
   [2] TARGET ANALYST ─────► Receiver Profile
        │  (+ web search)    {requirements, implicit values,
        │                     vocabulary, fears, red flags}
        ▼
   [3] BRIDGE ─────────────► Mapping matrix + blindspot
        │                    {capability → receiver need,
        │                     rationale, strength}
        ▼
   ── HUMAN APPROVAL GATE (approve/reject each bridge) ──
        │
   [4] STORYTELLER ────────► Draft {narrative, bullets}
        │                    (voice rules + banned patterns)
        ▼
   [5] CRITIC (humanizer) ─► Violations report + rewrite
        │                    (banned-pattern spec + fabrication check)
        ▼
   Final output: before/after view, evidence-traceable
```

**Key design decisions:**

- **Evidence quotes are the anti-fabrication mechanism.** The Archivist must copy verbatim substrings from user input; the Critic checks the final draft is traceable to them. Nothing invented survives.
- **Receiver vocabulary guides selection, never voice.** The Storyteller uses the receiver profile to choose and order material; the voice rules (uncertainty named, non-linearity stated as fact, process decisions described, experiments over certainties) belong to the practitioner.
- **Voice examples embedded in the prompt.** Three before/after pairs written by the practitioner sit inside the Storyteller's system prompt. Rules describe voice shape; examples demonstrate it working. Each good half names a limit — "I didn't know the format", "I didn't know it would work", "I'm not a specialist" — because constraints are what make the rest credible.
- **The Critic is a testable humanizer.** Instead of "write like a human," a banned-pattern spec built from real user feedback is enforced with a violations report — making tone an evaluated property, not a vibe.
  It names one thing that works first, quoting the line, before listing violations. This is not softening — the violations stay exactly as sharp. A good editor tells you what to keep.
- **External tool integration:** the Target Analyst optionally calls web search to research the target organisation.

**Model routing (production plan):**

| Task                 | Model                    | Rationale                                  |
| -------------------- | ------------------------ | ------------------------------------------ |
| Archivist extraction | Haiku-class              | Structured extraction; cheap, fast         |
| Target Analyst       | Haiku-class + web search | Parsing + retrieval; low creativity needed |
| Bridge mapping       | Sonnet-class             | Judgement about mapping honesty            |
| Storyteller          | Sonnet-class             | Voice quality is the product               |
| Critic               | Haiku-class              | Rule-checking against explicit spec        |

The MVP runs Sonnet throughout (platform constraint of the artifact runtime); the routing table is the cost-optimisation path at scale, replacing a "router agent" with a config decision.

## 6. Evaluation and testing approach

- **Trigger/behaviour tests** (extends the v1 practice-translator trigger-test format): documented runs with expected vs actual agent behaviour.
- **Golden test case 1 (tech hiring):** real messy transcript of a government-sector product role experience vs a real PM job advert; baseline = existing CV bullet.
- **Golden test case 2 (arts funding):** same/adjacent material vs a real fund brief (DYCP-type guidance).
- **Automated per-run eval:** Critic violations count, fabrication flags, bridge strength distribution.
- **Human eval:** recognition check + baseline-beat preference.

## 7. Implementation plan and deployment

- **Runtime:** single-page React app; each agent is a separate call to the Anthropic Messages API with its own system prompt; JSON artefacts passed between stages; human gate in UI.
- **Deployment:** published Claude artifact → live public URL. Zero infra, appropriate for MVP validation.
- **Deployment consideration (known limitation):** published artifacts expose agent runs to anyone with the link; there is no per-user auth or rate limiting. Acceptable for validation; a production build moves API calls behind a serverless function with auth (Vercel + key vault) — deliberately deferred.
- **Repo:** GitHub contains artifact source, agent system prompts, this PRD, eval cases, and the v1 practice-translator skill files showing the iteration history (single skill → multi-agent product).

## 8. Iteration history (v1 → v2)

v1 was a single Claude Code skill ("practice-translation") that translated creative work for audiences. Testing showed the missing half: translation quality depends on _receiver_ understanding, and outputs had no measurable success criteria. v2 adds the Target Analyst (receiver mapping), the Bridge with human approval (auditability + metrics), and the Critic (testable tone enforcement).
Then, watching myself use it: the rejection reframed from verdict to diagnosis, because a machine telling you you've failed lands differently than a machine naming what a reader couldn't see. Gap discovery, because the Bridge named a gap and then went silent — so users had no way to address it. The Critic saying what works first, because honest feedback requires acknowledging what landed before naming what didn't. Every fix came from a run that failed first.

## 9. Roadmap (out of MVP scope, deliberate)

1. **Visual Agent** — formatted portfolio/document output; MVP outputs clean editable text.
2. **Field Notes agent** — reuses the Critic to draft weekly learning-in-public posts from build logs.
3. **Model router** — implement the routing table above behind a serverless proxy.
4. **Institutional pilot** — dancer transition charities / conservatoires as B2B buyers.

## 10. Risks

- **Confabulation** — mitigated by evidence-quote traceability + human gate + Critic fabrication check.
- **Over-translation into receiver-speak** — mitigated by the selection-not-voice rule and banned-pattern enforcement.
- **N=1 validation** — founder is also the first user; next step is 5 concierge users from the dance community.
- **Login wall** — visitors need a Claude account to run the published artifact. Acceptable for concierge validation; a barrier for scale. Self-hosting resolves this.

---

## Addendum — v1.3 (shipped)

**Scout agent (discovery):** users who don't know which experience matters get three interview questions generated FROM the target's needs and fears. Answers a core differentiation question: a chat LLM waits for you to know what to say.

**Voice sample input:** user pastes paragraphs of their own writing; the Storyteller matches cadence and word choice (never content). Product position on AI detectors: we do not promise evasion — detectors are unreliable in both directions. The integrity position is stronger: every claim is the user's, human-approved, in their voice, and the UI instructs users to finish the draft by hand.

**Rejection note:** the Bridge writes it as a diagnosis, not a verdict — what this receiver could not see in the untranslated CV line. Two sentences, plain language, no drama. The UI makes clear: this is what's missing, not a prediction. The person may well have the evidence; it's just not visible yet.

**Gap discovery:** when the receiver asked for something and no bridge answers it, the system surfaces it plainly with three options: _I have this_ (opens a box; new material goes through the Archivist with a verbatim quote), _Not sure_ (the Scout asks a question in plain language — never the industry's word for the thing, because people often have the experience and lack only the vocabulary), _I don't have this_ (acknowledged; the Storyteller never claims it).

**Interview Armour:** the final screen pairs every approved claim with the verbatim quote backing it, for interview preparation. Unique to this architecture: only possible because of evidence traceability.

**Reliability layer:** hard output budgets per agent, bracket-balancing JSON repair for truncated responses, one automatic compress-and-retry. Truncation-related stage failures: resolved.

**Known platform limits (documented honestly):** microphone access is blocked inside the published-artifact sandbox — UI directs users to OS-level dictation; browser SpeechRecognition works when the app runs outside the sandbox.

**Roadmap addition — Application Filler mode:** upload a funder's application form (PDF input is API-supported); the pipeline answers each question within word limits, reusing the same bridges. The B2B feature for institutions; deliberately out of MVP scope.
