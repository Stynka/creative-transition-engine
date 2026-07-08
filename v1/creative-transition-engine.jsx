import React, { useState } from "react";

/* ============================================================
   CREATIVE TRANSITION ENGINE
   Five-agent pipeline: Archivist → Target Analyst → Bridge
   (human approval) → Storyteller → Critic (humanizer loop)
   ============================================================ */

const C = {
  paper: "#ECEAE6",
  card: "#F7F6F3",
  ink: "#22242A",
  muted: "#6B6E76",
  line: "#D8D5CE",
  tapeBlue: "#2B59D9",
  tapePink: "#D94A7A",
  tapeYellow: "#E3B72F",
  good: "#2E7D4F",
  bad: "#B3403A",
};

const FONTS = {
  display: "'Archivo', system-ui, sans-serif",
  body: "'Public Sans', system-ui, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, monospace",
};

/* ---------------- Banned-pattern spec (shared) ---------------- */

const BANNED_SPEC = `BANNED PATTERNS — hard rules, zero tolerance:
1. FAKE PROFUNDITY: any "It's not X. It's Y." construction ("It's not about AI, it's about being human").
2. REVOLUTION CLAIMS: "game changer", "paradigm shift", "changes everything", "the future is here", "a new era".
3. LINKEDIN GURU: "Here's what nobody is talking about", "The real question is", "Read that again", "Let that sink in", "What most people miss".
4. STARTUP THEATRE WORDS: leverage, synergy, ecosystem, unlock, empower, innovative, disruptive, cutting-edge, next-generation, scalable, transformative, passionate, dynamic, spearheaded, journey.
5. ARTIST-BIO CLICHÉS: "passionate storyteller", "pushing boundaries", "exploring the intersection of", "immersive experiences", "the human condition".
6. FAKE CERTAINTY: confident predictions about impact. Prefer "I want to test whether..." framing for anything unproven.
7. ABSTRACTION WITHOUT EVENTS: philosophical statements with no concrete action, object, number or place attached.
8. AI CADENCE: three or more consecutive short punchy sentences; "Here's the thing", "This is where it gets interesting", "The truth is".
9. LESSON-IFICATION & HUMBLEBRAG: turning mundane events into leadership lessons; "I wasn't going to post this...", "I don't usually share personal things...".
10. INVENTION: any claim, metric, outcome or testimonial not traceable to the provided evidence quotes.`;

const VOICE_RULES = `VOICE RULES (operationalised, do not name the sources):
- Name one genuine constraint, uncertainty or failure alongside capability claims — credibility is earned, not performed.
- State the non-linear career path as fact. Never apologise for it or frame it as a weakness overcome.
- Describe process decisions: constraints chosen, structures set, what was deliberately left open. How work was structured reveals more than outcomes.
- Frame unproven claims as experiments with observations ("I tested whether...", "What I noticed was...").
- Every claim carries one concrete detail: a number, a place, an object, an action.
- First person. Varied sentence length. British English. Plain verbs.`;

/* ---------------- Agent system prompts ---------------- */

const ARCHIVIST_SYSTEM = `You are the Archivist, the first agent in a career-translation pipeline for creatives and dancers changing fields. You receive raw, messy first-person material (voice-note transcripts, loose reflections, CV fragments).

Your job: extract discrete experience episodes and the capabilities hidden inside them, WITHOUT sanitising or inventing.

Rules:
- Every episode must include "evidence_quote": a VERBATIM substring copied exactly from the input. No paraphrase. This is the anti-fabrication mechanism.
- Capabilities must be specific and behavioural ("introduced a prototyping tool against team pushback and got it adopted"), never generic ("teamwork", "communication").
- Messy, negative material is valuable. Extract what the person actually did inside the mess. Do not launder it into positivity.
- Confidence: "high" = the quote directly shows the capability; "medium" = reasonable inference; "low" = speculative. Be honest.
- Maximum 6 episodes. British English.

Return ONLY valid JSON, no markdown fences, no preamble:
{"episodes":[{"id":"e1","what_happened":"1-2 plain sentences","evidence_quote":"verbatim substring","capabilities":["...","..."],"confidence":"high|medium|low"}]}`;

const ANALYST_SYSTEM = `You are the Target Analyst in a career-translation pipeline. You receive the pasted text of a target: a job advert, a funding-body brief, or similar.

Your job: build a receiver profile — what this reader explicitly asks for, what they implicitly value, the vocabulary they use, and crucially what they are AFRAID of (a funder fears money with no legacy; a startup fears people who freeze in ambiguity; a hiring panel fears claims that collapse in interview).

Rules:
- Ground everything in the pasted text. If you research the organisation, use at most brief context; the pasted text wins on conflict.
- "vocabulary" = 5-8 words/phrases the receiver themselves uses or would recognise as their own dialect.
- "fears" must be inferred honestly and stated plainly.
- British English.

Your FINAL output must be ONLY valid JSON, no markdown fences, no preamble:
{"organisation":"name or 'unknown'","receiver_type":"e.g. tech hiring panel / arts funder","explicit_requirements":["..."],"implicit_values":["..."],"vocabulary":["..."],"fears":["..."],"evaluation_criteria":["..."],"red_flags":["..."]}`;

const BRIDGE_SYSTEM = `You are the Bridge agent in a career-translation pipeline. You receive an Experience Graph (episodes with evidence) and a Receiver Profile.

Your job: propose explicit mappings between capabilities and what the receiver needs — each with a stated rationale a human can audit and approve or reject. You do NOT write prose. You build the mapping matrix.

Rules:
- Each bridge pairs ONE capability (from one episode) with ONE receiver need (a requirement, value, or fear it answers).
- rationale = one sentence explaining why this mapping is honest and relevant.
- strength: "strong" = evidence directly demonstrates the need; "moderate" = solid inference; "stretch" = plausible but thin. Be honest — stretches get rejected by the human.
- Maximum 8 bridges. Prefer fewer strong bridges over many weak ones.
- Also write "blindspot": 2-3 sentences describing what this specific receiver would FAIL to see if they read only the person's untranslated CV line — the capabilities that stay invisible without translation. Plain, concrete, no drama.

Return ONLY valid JSON, no markdown fences, no preamble:
{"bridges":[{"id":"b1","episode_id":"e1","capability":"...","maps_to":"the receiver need, in the receiver's terms","need_type":"requirement|value|fear","rationale":"one sentence","strength":"strong|moderate|stretch"}],"blindspot":"..."}`;

const storytellerSystem = (format) => `You are the Storyteller in a career-translation pipeline. You receive: approved bridges (capability → receiver need, each backed by a verbatim evidence quote), the receiver's vocabulary, and an output format.

Your job: write the translation. The receiver's needs and vocabulary guide WHAT you select and the ORDER you present it. They must NEVER infect the VOICE — the voice belongs to the practitioner.

Output format requested: ${format}.

${VOICE_RULES}

${BANNED_SPEC}

Additional rules:
- Use ONLY the approved bridges and their evidence. Nothing else exists.
- Do not use the receiver's buzzwords as decoration; use their concepts as selection criteria.
- narrative: 120-200 words in the requested format's register.
- bullets: exactly 3 CV-ready lines, each anchored to evidence, each under 30 words.

Return ONLY valid JSON, no markdown fences, no preamble:
{"narrative":"...","bullets":["...","...","..."]}`;

const CRITIC_SYSTEM = `You are the Critic, the final agent in a career-translation pipeline — the humanizer. You receive a draft (narrative + bullets) plus the evidence it must be traceable to.

Your job: hunt violations of the banned-pattern spec below and any invented claims, then rewrite if needed.

${BANNED_SPEC}

Rules:
- Quote each violating phrase exactly in "text", name the pattern number, explain in one clause.
- INVENTION check: flag any claim not traceable to the provided evidence quotes.
- If ANY violation: verdict "fail" and produce a full corrected rewrite (same JSON shape: narrative + 3 bullets) that fixes every violation while keeping everything that already works. Do not introduce new claims.
- If clean: verdict "pass", rewrite null.

Return ONLY valid JSON, no markdown fences, no preamble:
{"verdict":"pass|fail","violations":[{"text":"exact phrase","pattern":"e.g. 4. STARTUP THEATRE","why":"..."}],"rewrite":{"narrative":"...","bullets":["...","...","..."]} or null}`;

/* ---------------- API helpers ---------------- */

function extractJson(raw) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in response");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function callAgent(system, userContent, withSearch = false) {
  const body = {
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system,
    messages: [{ role: "user", content: userContent }],
  };
  if (withSearch) {
    body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "API error");
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  return extractJson(text);
}

/* ---------------- Small UI pieces ---------------- */

const Tape = ({ color, rotate = -4, w = 34 }) => (
  <span
    aria-hidden="true"
    style={{
      display: "inline-block",
      width: w,
      height: 11,
      background: color,
      transform: `rotate(${rotate}deg)`,
      opacity: 0.9,
      borderRadius: 1,
      boxShadow: "0 1px 1px rgba(0,0,0,0.12)",
    }}
  />
);

const Eyebrow = ({ children }) => (
  <div
    style={{
      fontFamily: FONTS.mono,
      fontSize: 11,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: C.muted,
      marginBottom: 6,
    }}
  >
    {children}
  </div>
);

const Card = ({ children, style }) => (
  <div
    style={{
      background: C.card,
      border: `1px solid ${C.line}`,
      borderRadius: 6,
      padding: "16px 18px",
      ...style,
    }}
  >
    {children}
  </div>
);

const Btn = ({ children, onClick, disabled, tone = "ink" }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="cte-btn"
    style={{
      fontFamily: FONTS.display,
      fontWeight: 600,
      fontSize: 14,
      padding: "10px 20px",
      borderRadius: 4,
      border: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      background: disabled ? C.line : tone === "ink" ? C.ink : C.tapeBlue,
      color: disabled ? C.muted : "#fff",
      transition: "opacity 120ms",
    }}
  >
    {children}
  </button>
);

const Spinner = ({ label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 0" }}>
    <span className="cte-spin" aria-hidden="true" />
    <span style={{ fontFamily: FONTS.mono, fontSize: 13, color: C.muted }}>{label}</span>
  </div>
);

const ErrorBox = ({ msg, onRetry }) => (
  <Card style={{ borderColor: C.bad, marginTop: 12 }}>
    <div style={{ color: C.bad, fontSize: 14, marginBottom: 8 }}>
      Something failed at this stage: {msg}
    </div>
    <Btn onClick={onRetry}>Retry this stage</Btn>
  </Card>
);

const StrengthChip = ({ s }) => {
  const map = { strong: C.good, moderate: C.tapeYellow, stretch: C.bad };
  return (
    <span
      style={{
        fontFamily: FONTS.mono,
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: map[s] || C.muted,
        border: `1px solid ${map[s] || C.muted}`,
        borderRadius: 3,
        padding: "1px 7px",
      }}
    >
      {s}
    </span>
  );
};

/* ---------------- Main app ---------------- */

const STEPS = ["Inputs", "Experience graph", "Receiver profile", "Bridges", "Translation"];
const TAPE_COLORS = [C.tapeBlue, C.tapePink, C.tapeYellow, C.tapeBlue, C.tapePink];

export default function CreativeTransitionEngine() {
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);

  // inputs
  const [rawStory, setRawStory] = useState("");
  const [baseline, setBaseline] = useState("");
  const [targetText, setTargetText] = useState("");
  const [format, setFormat] = useState("Cover letter paragraph");
  const [useSearch, setUseSearch] = useState(false);

  // pipeline artefacts
  const [graph, setGraph] = useState(null);
  const [profile, setProfile] = useState(null);
  const [bridges, setBridges] = useState(null);
  const [blindspot, setBlindspot] = useState("");
  const [draft, setDraft] = useState(null);
  const [critique, setCritique] = useState(null);

  const [loading, setLoading] = useState("");
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const go = (n) => {
    setStep(n);
    setMaxStep((m) => Math.max(m, n));
    setError(null);
  };

  /* ---- stage runners ---- */

  const runArchivist = async () => {
    setError(null);
    setLoading("The Archivist is reading your raw material…");
    try {
      const input =
        "RAW MATERIAL (first person, verbatim):\n" +
        rawStory +
        (baseline ? "\n\nEXISTING CV LINE (baseline, for context only):\n" + baseline : "");
      const out = await callAgent(ARCHIVIST_SYSTEM, input);
      setGraph(out.episodes || []);
      go(1);
    } catch (e) {
      setError({ msg: e.message, retry: runArchivist });
    }
    setLoading("");
  };

  const runAnalyst = async () => {
    setError(null);
    setLoading(
      useSearch
        ? "The Target Analyst is reading the brief and researching the organisation…"
        : "The Target Analyst is reading the brief…"
    );
    try {
      const out = await callAgent(
        ANALYST_SYSTEM,
        "TARGET TEXT (pasted by user):\n" + targetText,
        useSearch
      );
      setProfile(out);
      go(2);
    } catch (e) {
      setError({ msg: e.message, retry: runAnalyst });
    }
    setLoading("");
  };

  const runBridge = async () => {
    setError(null);
    setLoading("The Bridge agent is mapping capabilities to what the receiver needs…");
    try {
      const out = await callAgent(
        BRIDGE_SYSTEM,
        "EXPERIENCE GRAPH:\n" +
          JSON.stringify(graph) +
          "\n\nRECEIVER PROFILE:\n" +
          JSON.stringify(profile) +
          (baseline ? "\n\nUNTRANSLATED CV LINE:\n" + baseline : "")
      );
      setBridges(
        (out.bridges || []).map((b) => ({ ...b, approved: b.strength !== "stretch" }))
      );
      setBlindspot(out.blindspot || "");
      go(3);
    } catch (e) {
      setError({ msg: e.message, retry: runBridge });
    }
    setLoading("");
  };

  const runStoryteller = async () => {
    setError(null);
    const approved = bridges.filter((b) => b.approved);
    const evidence = graph.filter((e) => approved.some((b) => b.episode_id === e.id));
    setLoading("The Storyteller is writing the translation…");
    try {
      const d = await callAgent(
        storytellerSystem(format),
        "APPROVED BRIDGES:\n" +
          JSON.stringify(approved) +
          "\n\nEVIDENCE (verbatim quotes — the only source of truth):\n" +
          JSON.stringify(evidence.map((e) => ({ id: e.id, quote: e.evidence_quote }))) +
          "\n\nRECEIVER VOCABULARY (selection guide, not voice):\n" +
          JSON.stringify(profile.vocabulary)
      );
      setDraft(d);
      setLoading("The Critic is checking the draft against your banned-pattern list…");
      const c = await callAgent(
        CRITIC_SYSTEM,
        "DRAFT:\n" +
          JSON.stringify(d) +
          "\n\nEVIDENCE the draft must be traceable to:\n" +
          JSON.stringify(evidence.map((e) => e.evidence_quote))
      );
      setCritique(c);
      go(4);
    } catch (e) {
      setError({ msg: e.message, retry: runStoryteller });
    }
    setLoading("");
  };

  const finalText = () => {
    const f = critique && critique.verdict === "fail" && critique.rewrite ? critique.rewrite : draft;
    if (!f) return "";
    return f.narrative + "\n\n" + (f.bullets || []).map((b) => "• " + b).join("\n");
  };

  const copyFinal = async () => {
    try {
      await navigator.clipboard.writeText(finalText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      /* clipboard unavailable — text is selectable */
    }
  };

  const reset = () => {
    setStep(0);
    setMaxStep(0);
    setGraph(null);
    setProfile(null);
    setBridges(null);
    setBlindspot("");
    setDraft(null);
    setCritique(null);
    setError(null);
  };

  const inputsReady = rawStory.trim().length > 40 && targetText.trim().length > 40;
  const finalPiece =
    critique && critique.verdict === "fail" && critique.rewrite ? critique.rewrite : draft;

  /* ---- render ---- */

  return (
    <div style={{ minHeight: "100vh", background: C.paper, color: C.ink, fontFamily: FONTS.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=IBM+Plex+Mono:ital,wght@0,400;1,400&family=Public+Sans:wght@400;600&display=swap');
        .cte-btn:focus-visible, .cte-tab:focus-visible, textarea:focus-visible, select:focus-visible, input:focus-visible {
          outline: 2px solid ${C.tapeBlue}; outline-offset: 2px;
        }
        .cte-btn:hover:not(:disabled) { opacity: 0.85; }
        .cte-spin {
          width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid ${C.line}; border-top-color: ${C.tapeBlue};
          animation: cte-rot 0.9s linear infinite; display: inline-block;
        }
        @keyframes cte-rot { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .cte-spin { animation: none; } }
        textarea, select { font-family: ${FONTS.body}; font-size: 14px; color: ${C.ink};
          background: #fff; border: 1px solid ${C.line}; border-radius: 5px; padding: 10px 12px; width: 100%; box-sizing: border-box; }
        textarea { resize: vertical; }
        .cte-quote { font-family: ${FONTS.mono}; font-size: 12.5px; font-style: italic;
          color: ${C.muted}; border-left: 3px solid ${C.tapeYellow}; padding: 4px 0 4px 12px; margin-top: 8px; }
      `}</style>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "36px 20px 80px" }}>
        {/* Header */}
        <header style={{ marginBottom: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Tape color={C.tapePink} rotate={-8} w={42} />
            <h1
              style={{
                fontFamily: FONTS.display,
                fontWeight: 700,
                fontSize: 30,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Creative Transition Engine
            </h1>
          </div>
          <p style={{ color: C.muted, fontSize: 14.5, marginTop: 8, maxWidth: 620 }}>
            Not a resume polisher. A translator: it extracts what your creative work actually
            demonstrates, reads what a specific receiver needs to see, and writes the bridge —
            with every claim traceable to your own words.
          </p>
        </header>

        {/* Step rail */}
        <nav
          aria-label="Pipeline stages"
          style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 26 }}
        >
          {STEPS.map((s, i) => {
            const reachable = i <= maxStep;
            const active = i === step;
            return (
              <button
                key={s}
                className="cte-tab"
                onClick={() => reachable && setStep(i)}
                disabled={!reachable}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: "none",
                  background: active ? C.ink : "transparent",
                  color: active ? "#fff" : reachable ? C.ink : C.muted,
                  fontFamily: FONTS.mono,
                  fontSize: 12,
                  padding: "7px 12px",
                  borderRadius: 4,
                  cursor: reachable ? "pointer" : "default",
                }}
              >
                <Tape color={TAPE_COLORS[i]} rotate={i % 2 ? 5 : -5} w={18} />
                {i + 1}. {s}
              </button>
            );
          })}
        </nav>

        {loading && <Spinner label={loading} />}
        {error && <ErrorBox msg={error.msg} onRetry={error.retry} />}

        {/* ---------- STEP 0: INPUTS ---------- */}
        {step === 0 && !loading && (
          <div style={{ display: "grid", gap: 18 }}>
            <Card>
              <Eyebrow>01 · Raw material</Eyebrow>
              <label style={{ fontWeight: 600, fontSize: 14 }}>
                Tell one story, messily
                <textarea
                  value={rawStory}
                  onChange={(e) => setRawStory(e.target.value)}
                  rows={8}
                  style={{ marginTop: 8 }}
                  placeholder="Speak or type about one specific project. Leave the frustrations and dead ends in — that's where the material is. Voice-note transcripts are perfect."
                />
              </label>
            </Card>

            <Card>
              <Eyebrow>02 · Baseline (optional)</Eyebrow>
              <label style={{ fontWeight: 600, fontSize: 14 }}>
                Your current CV line for this experience
                <textarea
                  value={baseline}
                  onChange={(e) => setBaseline(e.target.value)}
                  rows={3}
                  style={{ marginTop: 8 }}
                  placeholder="Paste how your CV describes this now — the version to beat."
                />
              </label>
            </Card>

            <Card>
              <Eyebrow>03 · The receiver</Eyebrow>
              <label style={{ fontWeight: 600, fontSize: 14 }}>
                Paste the target: job advert, fund brief, call-out
                <textarea
                  value={targetText}
                  onChange={(e) => setTargetText(e.target.value)}
                  rows={8}
                  style={{ marginTop: 8 }}
                  placeholder="The full text of the job ad or funding brief you're aiming at."
                />
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: 14, alignItems: "center" }}>
                <label style={{ fontSize: 13.5, display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={useSearch}
                    onChange={(e) => setUseSearch(e.target.checked)}
                  />
                  Research the organisation (web search)
                </label>
                <label style={{ fontSize: 13.5, display: "flex", alignItems: "center", gap: 8 }}>
                  Output format
                  <select value={format} onChange={(e) => setFormat(e.target.value)} style={{ width: "auto" }}>
                    <option>Cover letter paragraph</option>
                    <option>CV profile statement</option>
                    <option>Funding application statement</option>
                  </select>
                </label>
              </div>
            </Card>

            <div>
              <Btn onClick={runArchivist} disabled={!inputsReady}>
                Run the Archivist →
              </Btn>
              {!inputsReady && (
                <span style={{ marginLeft: 12, fontSize: 13, color: C.muted }}>
                  Needs a story and a target to begin.
                </span>
              )}
            </div>
          </div>
        )}

        {/* ---------- STEP 1: EXPERIENCE GRAPH ---------- */}
        {step === 1 && graph && !loading && (
          <div style={{ display: "grid", gap: 14 }}>
            <Eyebrow>What the Archivist found — check it recognises you</Eyebrow>
            {graph.map((e) => (
              <Card key={e.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 14.5 }}>{e.what_happened}</strong>
                  <StrengthChip s={e.confidence} />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {(e.capabilities || []).map((c, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 12.5,
                        background: C.paper,
                        border: `1px solid ${C.line}`,
                        borderRadius: 12,
                        padding: "3px 10px",
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
                <div className="cte-quote">“{e.evidence_quote}”</div>
              </Card>
            ))}
            <div>
              <Btn onClick={runAnalyst}>Analyse the receiver →</Btn>
            </div>
          </div>
        )}

        {/* ---------- STEP 2: RECEIVER PROFILE ---------- */}
        {step === 2 && profile && !loading && (
          <div style={{ display: "grid", gap: 14 }}>
            <Eyebrow>
              Receiver profile · {profile.organisation} ({profile.receiver_type})
            </Eyebrow>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
              {[
                ["Explicit requirements", profile.explicit_requirements],
                ["Implicit values", profile.implicit_values],
                ["Their vocabulary", profile.vocabulary],
                ["What they're afraid of", profile.fears],
                ["How they'll evaluate", profile.evaluation_criteria],
                ["Red flags for them", profile.red_flags],
              ].map(([title, items]) => (
                <Card key={title}>
                  <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 13.5, marginBottom: 8 }}>
                    {title}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: C.ink }}>
                    {(items || []).map((x, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>{x}</li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
            <div>
              <Btn onClick={runBridge}>Build the bridges →</Btn>
            </div>
          </div>
        )}

        {/* ---------- STEP 3: BRIDGES ---------- */}
        {step === 3 && bridges && !loading && (
          <div style={{ display: "grid", gap: 14 }}>
            <Eyebrow>The Bridge — approve only what you can defend in the room</Eyebrow>
            {blindspot && (
              <Card style={{ borderLeft: `4px solid ${C.tapePink}` }}>
                <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 13.5, marginBottom: 6 }}>
                  What this receiver can't see in your untranslated version
                </div>
                <div style={{ fontSize: 14, color: C.ink }}>{blindspot}</div>
              </Card>
            )}
            {bridges.map((b, idx) => (
              <Card key={b.id} style={{ opacity: b.approved ? 1 : 0.55 }}>
                <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={b.approved}
                    onChange={() =>
                      setBridges(bridges.map((x, i) => (i === idx ? { ...x, approved: !x.approved } : x)))
                    }
                    style={{ marginTop: 4 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14.5 }}>
                        <strong>{b.capability}</strong>
                        <span style={{ color: C.muted }}> → </span>
                        {b.maps_to}
                        <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: C.muted }}>
                          {" "}({b.need_type})
                        </span>
                      </span>
                      <StrengthChip s={b.strength} />
                    </div>
                    <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{b.rationale}</div>
                  </div>
                  {b.approved && <Tape color={C.tapeBlue} rotate={6} w={26} />}
                </label>
              </Card>
            ))}
            <div>
              <Btn onClick={runStoryteller} disabled={!bridges.some((b) => b.approved)}>
                Write the translation ({bridges.filter((b) => b.approved).length} approved) →
              </Btn>
            </div>
          </div>
        )}

        {/* ---------- STEP 4: OUTPUT ---------- */}
        {step === 4 && finalPiece && !loading && (
          <div style={{ display: "grid", gap: 16 }}>
            <Eyebrow>Translation · {format}</Eyebrow>

            {baseline && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                <Card style={{ borderLeft: `4px solid ${C.line}` }}>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted, marginBottom: 8 }}>
                    Before — your current version
                  </div>
                  <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{baseline}</div>
                </Card>
                <Card style={{ borderLeft: `4px solid ${C.tapeBlue}` }}>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: C.tapeBlue, marginBottom: 8 }}>
                    After — translated for this receiver
                  </div>
                  <div style={{ fontSize: 14.5, whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{finalPiece.narrative}</div>
                </Card>
              </div>
            )}
            {!baseline && (
              <Card style={{ borderLeft: `4px solid ${C.tapeBlue}` }}>
                <div style={{ fontSize: 15, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{finalPiece.narrative}</div>
              </Card>
            )}

            <Card>
              <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 13.5, marginBottom: 8 }}>
                CV-ready lines
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
                {(finalPiece.bullets || []).map((b, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>{b}</li>
                ))}
              </ul>
            </Card>

            {critique && (
              <Card style={{ borderLeft: `4px solid ${critique.verdict === "pass" ? C.good : C.tapeYellow}` }}>
                <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 13.5, marginBottom: 6 }}>
                  Critic report — {critique.verdict === "pass" ? "clean on first pass" : `${critique.violations.length} violation(s) caught and rewritten`}
                </div>
                {critique.verdict === "fail" &&
                  critique.violations.map((v, i) => (
                    <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>
                      <span style={{ fontFamily: FONTS.mono, color: C.bad }}>“{v.text}”</span>
                      <span style={{ color: C.muted }}> — {v.pattern}: {v.why}</span>
                    </div>
                  ))}
                {critique.verdict === "pass" && (
                  <div style={{ fontSize: 13, color: C.muted }}>
                    No banned patterns, no invented claims. Every line traces back to your own words.
                  </div>
                )}
              </Card>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={copyFinal} tone="blue">{copied ? "Copied" : "Copy final text"}</Btn>
              <Btn onClick={reset}>Start a new translation</Btn>
            </div>
          </div>
        )}

        <footer style={{ marginTop: 48, fontSize: 12, color: C.muted, fontFamily: FONTS.mono }}>
          Five agents: Archivist · Target Analyst · Bridge · Storyteller · Critic. Human approval
          gate before anything is written. Nothing enters the output without a verbatim evidence
          quote behind it.
        </footer>
      </div>
    </div>
  );
}
