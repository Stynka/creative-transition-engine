import React, { useState, useRef } from "react";

/* ============================================================
   CREATIVE TRANSITION ENGINE — v1.3
   Six agents: Scout · Archivist · Target Analyst · Bridge
   (human gate) · Storyteller · Critic. Deterministic
   orchestration in code; models do bounded tasks.
   UI: bold grotesk, white ground, coral accent, thick borders.
   ============================================================ */

const C = {
  bg: "#FFFFFF",
  wash: "#F6F5F1",
  ink: "#111111",
  sub: "#575757",
  line: "#E3E3E0",
  coral: "#FF4B21",
  lilac: "#C9BBFF",
  green: "#0B7A3E",
  amber: "#9A5B00",
  red: "#C81E1E",
};

const F = {
  display: "'Space Grotesk', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
};

const tag = {
  fontFamily: F.display,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: C.ink,
};

/* ---------------- Shared specs ---------------- */

const BANNED_SPEC = `BANNED PATTERNS — hard rules, zero tolerance:
1. FAKE PROFUNDITY: any "It's not X. It's Y." construction.
2. REVOLUTION CLAIMS: "game changer", "paradigm shift", "changes everything", "the future is here", "a new era".
3. LINKEDIN GURU: "Here's what nobody is talking about", "The real question is", "Read that again", "Let that sink in", "What most people miss".
4. STARTUP THEATRE WORDS: leverage, synergy, ecosystem, unlock, empower, innovative, disruptive, cutting-edge, next-generation, scalable, transformative, passionate, dynamic, spearheaded, journey.
5. ARTIST-BIO CLICHES: "passionate storyteller", "pushing boundaries", "exploring the intersection of", "immersive experiences", "the human condition".
6. FAKE CERTAINTY: confident predictions about impact. Prefer "I want to test whether..." for anything unproven.
7. ABSTRACTION WITHOUT EVENTS: statements with no concrete action, object, number or place attached.
8. AI CADENCE: three or more consecutive short punchy sentences; "Here's the thing", "The truth is".
9. LESSON-IFICATION & HUMBLEBRAG: mundane events as leadership lessons; "I wasn't going to post this...".
10. INVENTION: any claim, metric or outcome not traceable to the provided evidence quotes.`;

const VOICE_RULES = `VOICE RULES (operationalised, never name the sources):
- Name one genuine constraint, uncertainty or failure alongside capability claims.
- State the non-linear career path as fact. Never apologise for it.
- Describe process decisions: constraints chosen, structures set, what was deliberately left open.
- Frame unproven claims as experiments with observations ("I tested whether...", "What I noticed was...").
- Every claim carries one concrete detail: a number, a place, an object, an action.
- First person. Varied sentence length. British English. Plain verbs.`;

const VOICE_EXAMPLES = `VOICE EXAMPLES — the practitioner's own before/after edits. Learn the principle behind each change; do not copy the content.

PAIR 1
Bad: "Owned and contributed to 10+ user stories per feature, writing detailed acceptance criteria, problem briefs, and edge-case definitions engineers could act on."
Good: "I'd never written acceptance criteria in that format. There was no template and no onboarding, so I read the existing documentation, used AI to draft, and had no idea whether what came out was any good. My manager went through them with me line by line — this isn't right, this isn't right — for hours. She was patient. I learned the format by having it corrected."
What changed: the bullet claims competence; the truth is the acquisition of competence, including who taught it and how it felt. The words she actually said are worth more than the number 10+.

PAIR 2
Bad: "Used AI-assisted prototyping (Lovable) to accelerate UI exploration and validate requirements before development handoff, reducing prototype-to-feedback turnaround."
Good: "I pushed for Lovable and management pushed back — not because the tool was wrong, but because adopting it meant the team would slow down to learn it, and everything was already late. There was constant pressure about delivery dates. I didn't know for certain it would work. It was accepted in the end and became the prototyping engine for the HR flow."
What changed: "accelerate" and "reducing turnaround" claim a result. The real story is an organisational fear about time, an uncertain bet, and adoption that arrived quietly. Naming the resistance makes the outcome believable.

PAIR 3
Bad: "Led cross-disciplinary creative projects blending storytelling, spatial design, and technology — skills directly applied in UX and product problem-solving."
Good: "I learned lighting design because I wanted to talk to technicians in their own language. I'm not a lighting specialist. I learned enough to know what I was asking for. I've been doing that since I was six, on a violin — hours of boring repetition, nothing arriving easily. In a studio you stay with a phrase past the point it's comfortable. That's the same thing I do now with a codebase I don't understand yet."
What changed: no claim of transferability — the transfer is demonstrated, not asserted. "Boring repetition" and "since I was six" are unfakeable. Naming the limit ("not a specialist") is what makes the rest credible.`;

/* ---------------- Agent system prompts (hard output budgets) ---------------- */

const SCOUT_SYSTEM = `You are the Scout in a career-translation pipeline. Given a target text (job advert or fund brief), and optionally CV material, write 3 interview questions that would surface the candidate's most relevant hidden experience for THIS receiver.
Rules: each question points at a concrete situation ("Tell me about a time you had to create process where none existed"), tailored to the target's stated needs and unstated fears. Never generic. Maximum 22 words per question.
Return ONLY valid JSON, no fences, no preamble: {"prompts":["...","...","..."]}`;

const ARCHIVIST_SYSTEM = `You are the Archivist, first agent in a career-translation pipeline for creatives changing fields. You receive raw, messy first-person material.
Extract discrete experience episodes and the capabilities inside them, WITHOUT sanitising or inventing.
Rules:
- Every episode includes "evidence_quote": a VERBATIM substring copied exactly from the input, maximum 25 words. No paraphrase. This is the anti-fabrication mechanism.
- Capabilities are specific and behavioural ("introduced a prototyping tool against pushback and got it adopted"), never generic ("teamwork").
- Messy, negative material is valuable. Extract what the person DID inside the mess. Do not launder it.
- confidence: "high" = quote directly shows it; "medium" = reasonable inference; "low" = speculative.
- HARD BUDGET: maximum 5 episodes; what_happened maximum 20 words; 2-3 capabilities each, maximum 8 words per capability. British English.
Return ONLY valid JSON, no fences, no preamble:
{"episodes":[{"id":"e1","what_happened":"...","evidence_quote":"...","capabilities":["..."],"confidence":"high|medium|low"}]}`;

const ANALYST_SYSTEM = `You are the Target Analyst in a career-translation pipeline. You receive the pasted text of a target: a job advert or funding brief.
Build a receiver profile: what this reader explicitly asks for, implicitly values, the vocabulary they use, and what they are AFRAID of (a funder fears money with no legacy; a hiring panel fears claims that collapse in interview).
Rules:
- Ground everything in the pasted text; research adds brief context only, pasted text wins.
- HARD BUDGET: maximum 5 items per list; each item maximum 8 words. British English.
Your FINAL output must be ONLY valid JSON, no fences, no preamble:
{"organisation":"...","receiver_type":"...","explicit_requirements":["..."],"implicit_values":["..."],"vocabulary":["..."],"fears":["..."],"evaluation_criteria":["..."],"red_flags":["..."]}`;

const BRIDGE_SYSTEM = `You are the Bridge agent in a career-translation pipeline. You receive an Experience Graph (episodes with evidence) and a Receiver Profile.
Propose explicit mappings between capabilities and receiver needs — each with a rationale a human can audit and approve or reject. You do NOT write prose.
Rules:
- Each bridge pairs ONE capability with ONE receiver need (requirement, value, or fear it answers).
- strength: "strong" = evidence directly demonstrates it; "moderate" = solid inference; "stretch" = thin. Be honest.
- HARD BUDGET: maximum 6 bridges; capability maximum 8 words; maps_to maximum 8 words; rationale maximum 12 words.
- "rejection_note": in maximum 45 words, name the SPECIFIC evidence this untranslated CV line fails to show this receiver. This is a diagnosis of what's missing, NOT a prediction of rejection and NOT a verdict on the candidate — the person may well have this evidence, it just isn't visible in the line as written. Plain, concrete, no drama.
Return ONLY valid JSON, no fences, no preamble:
{"bridges":[{"id":"b1","episode_id":"e1","capability":"...","maps_to":"...","need_type":"requirement|value|fear","rationale":"...","strength":"strong|moderate|stretch"}],"rejection_note":"..."}`;

const storytellerSystem = (format, voiceSample) => `You are the Storyteller in a career-translation pipeline. You receive approved bridges (capability -> receiver need, each backed by a verbatim evidence quote), the receiver's vocabulary, and an output format.
Write the translation. The receiver's needs and vocabulary guide WHAT you select and the ORDER; they must NEVER infect the VOICE. The voice belongs to the practitioner.
Output format requested: ${format}.

${VOICE_RULES}

${VOICE_EXAMPLES}
${voiceSample ? `
VOICE SAMPLE — the practitioner's own writing. Match its cadence, sentence rhythm and characteristic word choices. Do NOT copy its content or claims:
"""${voiceSample.slice(0, 1200)}"""` : ""}

${BANNED_SPEC}

Rules:
- Use ONLY the approved bridges and their evidence. Nothing else exists.
- narrative: 120-180 words in the requested register.
- bullets: exactly 3 CV-ready lines, each under 25 words, each anchored to evidence.
Return ONLY valid JSON, no fences, no preamble:
{"narrative":"...","bullets":["...","...","..."]}`;

const CRITIC_SYSTEM = `You are the Critic, final agent in a career-translation pipeline — the humanizer. You receive a draft (narrative + bullets) plus the evidence it must trace to.
Hunt violations of the spec below and any invented claims; rewrite if needed.

${BANNED_SPEC}

Rules:
- Name one thing that works before listing what doesn't. Be specific — quote the line. This is not softening; the violations stay exactly as sharp. A good editor tells you what to keep.
- "what_works": one sentence, quoting a specific line from the draft that genuinely lands, and saying plainly why. Must be honest — if nothing works, say so rather than inventing praise.
- Quote each violating phrase exactly in "text", name the pattern number, explain in maximum 10 words.
- INVENTION check: flag any claim not traceable to the evidence quotes.
- If ANY violation: verdict "fail" plus a full corrected rewrite (same shape) fixing every violation, no new claims.
- If clean: verdict "pass", rewrite null.
- HARD BUDGET: maximum 6 violations listed.
Return ONLY valid JSON, no fences, no preamble:
{"verdict":"pass|fail","what_works":"...","violations":[{"text":"...","pattern":"...","why":"..."}],"rewrite":{"narrative":"...","bullets":["...","...","..."]}}`;

/* ---------------- Robust JSON + API layer ---------------- */

function tryParse(s) {
  try { return JSON.parse(s); } catch (e) { return null; }
}

function extractJson(raw) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  if (start === -1) throw new Error("No JSON found in the response");
  const naive = cleaned.slice(start, cleaned.lastIndexOf("}") + 1);
  let parsed = tryParse(naive);
  if (parsed) return parsed;
  const s = cleaned.slice(start);
  for (let i = s.length; i > 1; i--) {
    if (s[i - 1] !== "}") continue;
    const candidate = s.slice(0, i);
    const stack = [];
    let inStr = false, esc = false, broken = false;
    for (const ch of candidate) {
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === "{" || ch === "[") stack.push(ch);
      else if (ch === "}" || ch === "]") { if (!stack.length) { broken = true; break; } stack.pop(); }
    }
    if (broken || inStr) continue;
    let closers = "";
    while (stack.length) closers += stack.pop() === "{" ? "}" : "]";
    parsed = tryParse(candidate + closers);
    if (parsed) return parsed;
  }
  throw new Error("Response arrived cut off mid-JSON");
}

async function callAgent(system, userContent, withSearch = false, attempt = 0) {
  const body = {
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system,
    messages: [{ role: "user", content: userContent }],
  };
  if (withSearch) body.tools = [{ type: "web_search_20250305", name: "web_search" }];
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
  try {
    return extractJson(text);
  } catch (e) {
    if (attempt === 0) {
      return callAgent(
        system,
        userContent +
          "\n\nIMPORTANT: your previous answer exceeded the length limit and was truncated. Return the SAME JSON far more concisely: shortest possible strings, fewest items, nothing optional.",
        withSearch,
        1
      );
    }
    throw e;
  }
}

/* ---------------- UI atoms ---------------- */

const Num = ({ n }) => (
  <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14, color: C.coral, marginRight: 10 }}>
    {String(n).padStart(2, "0")}
  </span>
);

const Btn = ({ children, onClick, disabled, primary, small }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={primary ? "cte-btn-p" : "cte-btn-s"}
    style={{
      fontFamily: F.display,
      fontWeight: 700,
      fontSize: small ? 12.5 : 14.5,
      padding: small ? "10px 16px" : "14px 28px",
      background: disabled ? C.wash : primary ? C.ink : C.bg,
      color: disabled ? C.sub : primary ? "#fff" : C.ink,
      border: `2px solid ${disabled ? C.line : C.ink}`,
      borderRadius: 0,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "background 130ms, color 130ms, border-color 130ms",
    }}
  >
    {children}
  </button>
);

const Loading = ({ label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "36px 0" }}>
    <span className="cte-pulse" aria-hidden="true" />
    <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14 }}>{label}…</span>
  </div>
);

const Strength = ({ s }) => {
  const col = { strong: C.green, moderate: C.amber, stretch: C.red, high: C.green, medium: C.amber, low: C.red }[s] || C.sub;
  return <span style={{ ...tag, color: col }}>{s}</span>;
};

/* ---------------- Main ---------------- */

const STEPS = ["Inputs", "Experience graph", "Receiver profile", "Bridges", "Translation"];

export default function CreativeTransitionEngine() {
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);

  const [rawStory, setRawStory] = useState("");
  const [baseline, setBaseline] = useState("");
  const [voiceSample, setVoiceSample] = useState("");
  const [targetText, setTargetText] = useState("");
  const [format, setFormat] = useState("Cover letter paragraph");
  const [useSearch, setUseSearch] = useState(false);

  const [graph, setGraph] = useState(null);
  const [profile, setProfile] = useState(null);
  const [bridges, setBridges] = useState(null);
  const [rejection, setRejection] = useState("");
  const [gapState, setGapState] = useState({});
  const [draft, setDraft] = useState(null);
  const [critique, setCritique] = useState(null);

  const [loading, setLoading] = useState("");
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [voiceMsg, setVoiceMsg] = useState("");

  const [ideas, setIdeas] = useState(null);
  const [ideasLoading, setIdeasLoading] = useState(false);

  const [recognition, setRecognition] = useState(null); // "yes" | "not_quite" | null
  const [brokenLine, setBrokenLine] = useState("");
  const [brokenLineSubmitted, setBrokenLineSubmitted] = useState(false);

  const go = (n) => { setStep(n); setMaxStep((m) => Math.max(m, n)); setError(null); };

  const DICTATION_HINT =
    "This embedded app can't reach your microphone (the page sandbox blocks it). Quickest route: your computer's built-in dictation types straight into the box — Mac: press the mic key or Fn twice · Windows: Win + H. Or record a voice note on your phone and paste the transcript.";

  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVoiceMsg(DICTATION_HINT); return; }
    if (listening) { recRef.current && recRef.current.stop(); return; }
    const rec = new SR();
    rec.lang = "en-GB";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (ev) => {
      let chunk = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) chunk += ev.results[i][0].transcript + " ";
      if (chunk.trim()) setRawStory((prev) => (prev ? prev.trimEnd() + " " : "") + chunk.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => { setListening(false); setVoiceMsg(DICTATION_HINT); };
    recRef.current = rec;
    setVoiceMsg("");
    setListening(true);
    try { rec.start(); } catch (e) { setListening(false); setVoiceMsg(DICTATION_HINT); }
  };

  const runScout = async () => {
    setIdeasLoading(true);
    try {
      const out = await callAgent(
        SCOUT_SYSTEM,
        "TARGET TEXT:\n" + targetText + (baseline ? "\n\nCV MATERIAL:\n" + baseline : "")
      );
      setIdeas(out.prompts || []);
    } catch (e) { setIdeas(null); setVoiceMsg("Couldn't fetch prompts — try again."); }
    setIdeasLoading(false);
  };

  const runArchivist = async () => {
    setError(null);
    setLoading("The Archivist is reading your raw material");
    try {
      const input =
        "RAW MATERIAL (first person, verbatim):\n" + rawStory +
        (baseline ? "\n\nEXISTING CV LINE (baseline, context only):\n" + baseline : "");
      const out = await callAgent(ARCHIVIST_SYSTEM, input);
      setGraph(out.episodes || []);
      go(1);
    } catch (e) { setError({ msg: e.message, retry: runArchivist }); }
    setLoading("");
  };

  const runAnalyst = async () => {
    setError(null);
    setLoading(useSearch ? "The Target Analyst is reading the brief and researching the organisation" : "The Target Analyst is reading the brief");
    try {
      const out = await callAgent(ANALYST_SYSTEM, "TARGET TEXT (pasted by user):\n" + targetText, useSearch);
      setProfile(out);
      go(2);
    } catch (e) { setError({ msg: e.message, retry: runAnalyst }); }
    setLoading("");
  };

  const runBridge = async (graphOverride) => {
    const g = Array.isArray(graphOverride) ? graphOverride : graph;
    setError(null);
    setLoading("The Bridge agent is mapping capabilities to receiver needs");
    try {
      const out = await callAgent(
        BRIDGE_SYSTEM,
        "EXPERIENCE GRAPH:\n" + JSON.stringify(g) +
        "\n\nRECEIVER PROFILE:\n" + JSON.stringify(profile) +
        (baseline ? "\n\nUNTRANSLATED CV LINE:\n" + baseline : "")
      );
      setBridges((out.bridges || []).map((b) => ({ ...b, approved: b.strength !== "stretch" })));
      setRejection(out.rejection_note || out.blindspot || "");
      go(3);
    } catch (e) { setError({ msg: e.message, retry: () => runBridge(graphOverride) }); }
    setLoading("");
  };

  const updateGap = (item, patch) =>
    setGapState((prev) => ({ ...prev, [item]: { ...prev[item], ...patch } }));

  const askScout = async (item) => {
    updateGap(item, { status: "unsure-loading" });
    try {
      const out = await callAgent(SCOUT_SYSTEM, "TARGET TEXT:\n" + item);
      updateGap(item, { status: "unsure", question: (out.prompts || [])[0] || "", text: "" });
    } catch (e) {
      updateGap(item, { status: undefined });
    }
  };

  const submitGap = async (item) => {
    const g = gapState[item];
    if (!g || !g.text || g.text.trim().length < 10) return;
    updateGap(item, { status: "submitting" });
    try {
      const out = await callAgent(
        ARCHIVIST_SYSTEM,
        "RAW MATERIAL (first person, verbatim):\n" + g.text +
        "\n\nRECEIVER REQUIREMENT THIS MATERIAL IS OFFERED AGAINST (context only — extract only what the material above actually shows):\n" + item
      );
      const stamp = Date.now();
      const newEpisodes = (out.episodes || []).map((e, i) => ({ ...e, id: `g${stamp}_${i}` }));
      const newGraph = [...graph, ...newEpisodes];
      setGraph(newGraph);
      updateGap(item, { status: "added" });
      await runBridge(newGraph);
    } catch (e) {
      updateGap(item, { status: "have", error: e.message });
    }
  };

  const runStoryteller = async () => {
    setError(null);
    const approved = bridges.filter((b) => b.approved);
    const evidence = graph.filter((e) => approved.some((b) => b.episode_id === e.id));
    setLoading("The Storyteller is writing the translation");
    try {
      const d = await callAgent(
        storytellerSystem(format, voiceSample.trim()),
        "APPROVED BRIDGES:\n" + JSON.stringify(approved) +
        "\n\nEVIDENCE (verbatim quotes — the only source of truth):\n" +
        JSON.stringify(evidence.map((e) => ({ id: e.id, quote: e.evidence_quote }))) +
        "\n\nRECEIVER VOCABULARY (selection guide, not voice):\n" + JSON.stringify(profile.vocabulary)
      );
      setDraft(d);
      setLoading("The Critic is checking the draft against the banned-pattern list");
      const c = await callAgent(
        CRITIC_SYSTEM,
        "DRAFT:\n" + JSON.stringify(d) +
        "\n\nEVIDENCE the draft must trace to:\n" + JSON.stringify(evidence.map((e) => e.evidence_quote))
      );
      setCritique(c);
      go(4);
    } catch (e) { setError({ msg: e.message, retry: runStoryteller }); }
    setLoading("");
  };

  const finalPiece = critique && critique.verdict === "fail" && critique.rewrite ? critique.rewrite : draft;

  const copyFinal = async () => {
    if (!finalPiece) return;
    const t = finalPiece.narrative + "\n\n" + (finalPiece.bullets || []).map((b) => "— " + b).join("\n");
    try { await navigator.clipboard.writeText(t); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch (e) {}
  };

  const reset = () => {
    setStep(0); setMaxStep(0);
    setGraph(null); setProfile(null); setBridges(null); setRejection(""); setGapState({});
    setDraft(null); setCritique(null); setError(null); setIdeas(null);
    setRecognition(null); setBrokenLine(""); setBrokenLineSubmitted(false);
  };

  const inputsReady = rawStory.trim().length > 40 && targetText.trim().length > 40;
  const approvedBridges = bridges ? bridges.filter((b) => b.approved) : [];

  const gapWords = (s) => new Set((s || "").toLowerCase().match(/[a-z]{4,}/g) || []);
  const gapOverlaps = (a, b) => {
    const wa = gapWords(a);
    for (const w of gapWords(b)) if (wa.has(w)) return true;
    return false;
  };
  const gapItems = profile
    ? [...new Set([...(profile.explicit_requirements || []), ...(profile.implicit_values || [])])].filter(
        (item) => !(bridges || []).some((b) => gapOverlaps(b.maps_to, item))
      )
    : [];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: F.body, fontSize: 15, lineHeight: 1.65 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;600&display=swap');
        .cte-btn-p:hover:not(:disabled) { background: ${C.coral} !important; border-color: ${C.coral} !important; }
        .cte-btn-s:hover:not(:disabled) { background: ${C.ink} !important; color: #fff !important; }
        .cte-btn-p:focus-visible, .cte-btn-s:focus-visible, textarea:focus-visible, select:focus-visible, input:focus-visible, .cte-idea:focus-visible {
          outline: 3px solid ${C.coral}; outline-offset: 2px;
        }
        .cte-pulse { width: 12px; height: 12px; background: ${C.coral};
          animation: ctep 1s ease-in-out infinite; display: inline-block; }
        @keyframes ctep { 0%,100% { transform: scale(0.6); } 50% { transform: scale(1); } }
        @media (prefers-reduced-motion: reduce) { .cte-pulse { animation: none; } }
        textarea, select {
          font-family: ${F.body}; font-size: 15px; color: ${C.ink}; line-height: 1.6;
          background: ${C.bg}; border: 2px solid ${C.ink}; border-radius: 0;
          padding: 14px 16px; width: 100%; box-sizing: border-box;
        }
        textarea::placeholder { color: ${C.sub}; }
        textarea:focus, select:focus { border-color: ${C.coral}; }
        textarea { resize: vertical; }
        .cte-quote { background: ${C.wash}; border-left: 4px solid ${C.coral};
          padding: 12px 16px; margin-top: 14px; font-style: italic; color: ${C.ink}; font-size: 14px; }
        .cte-idea { text-align: left; font-family: ${F.body}; font-size: 14px; font-weight: 600; color: ${C.ink};
          background: ${C.wash}; border: 2px solid ${C.ink}; padding: 12px 14px; cursor: pointer;
          width: 100%; margin-top: 8px; border-radius: 0; }
        .cte-idea:hover { background: ${C.lilac}; }
        mark { background: ${C.lilac}; padding: 0 6px; }
      `}</style>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "56px 24px 110px" }}>
        {/* Masthead */}
        <header style={{ marginBottom: 48 }}>
          <div style={{ ...tag, color: C.coral, marginBottom: 16 }}>A translation engine for creative careers</div>
          <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 44, lineHeight: 1.08, margin: 0, letterSpacing: "-0.01em" }}>
            Creative <mark>Transition</mark> Engine
          </h1>
          <p style={{ color: C.sub, fontSize: 16, maxWidth: 600, marginTop: 18 }}>
            Not a resume polisher. It extracts what your work actually demonstrates, reads what a specific
            receiver needs to see, and writes the bridge — every claim traceable to your own words.
          </p>
        </header>

        {/* Step index */}
        <nav aria-label="Pipeline stages" style={{ display: "flex", flexWrap: "wrap", gap: "8px 22px", borderTop: `2px solid ${C.ink}`, borderBottom: `2px solid ${C.ink}`, padding: "14px 0", marginBottom: 44 }}>
          {STEPS.map((s, i) => {
            const reachable = i <= maxStep;
            const active = i === step;
            return (
              <button
                key={s}
                onClick={() => reachable && setStep(i)}
                disabled={!reachable}
                style={{
                  fontFamily: F.display, fontWeight: 700, fontSize: 13.5,
                  color: active ? C.coral : reachable ? C.ink : C.sub,
                  background: "none", border: "none", padding: 0,
                  cursor: reachable ? "pointer" : "default",
                }}
              >
                {String(i + 1).padStart(2, "0")} {s}
              </button>
            );
          })}
        </nav>

        {loading && <Loading label={loading} />}
        {error && (
          <div style={{ border: `2px solid ${C.red}`, padding: "22px 24px", marginBottom: 28 }}>
            <div style={{ color: C.red, fontWeight: 600, fontSize: 14.5, marginBottom: 14 }}>
              This stage failed: {error.msg}. One retry usually resolves it.
            </div>
            <Btn onClick={error.retry}>Retry this stage</Btn>
          </div>
        )}

        {/* ---------- STEP 0 ---------- */}
        {step === 0 && !loading && (
          <div style={{ display: "grid", gap: 40 }}>
            <section>
              <h2 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, margin: "0 0 12px" }}>
                <Num n={1} />Raw material — one project, in your own words
              </h2>
              <div style={{ color: C.sub, fontSize: 13.5, marginBottom: 10 }}>
                Not sure which experience to use? Paste the job advert or fund brief below first, then let the Scout suggest what to write about.
              </div>
              <textarea value={rawStory} onChange={(e) => setRawStory(e.target.value)} rows={8}
                aria-label="Your raw story"
                placeholder="One specific thing you worked on — a project, a job, a production, a residency. Tell it the way you'd tell a friend, with the frustrations and dead ends left in. That's usually where the interesting parts are." />
              <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
                <Btn small onClick={toggleVoice}>{listening ? "■ Stop" : "Try browser dictation"}</Btn>
                <Btn small onClick={runScout} disabled={targetText.trim().length < 40 || ideasLoading}>
                  {ideasLoading ? "Finding prompts…" : "Not sure which story? Ask the Scout"}
                </Btn>
                {targetText.trim().length < 40 && !ideas && (
                  <span style={{ fontSize: 13, color: C.sub }}>The Scout needs the target pasted below first.</span>
                )}
              </div>
              {listening && <div style={{ ...tag, color: C.coral, marginTop: 12 }}>● Listening — it appends as you speak</div>}
              {voiceMsg && <div style={{ fontSize: 13.5, color: C.ink, background: C.wash, border: `2px solid ${C.ink}`, padding: "10px 14px", marginTop: 12 }}>{voiceMsg}</div>}
              {ideas && (
                <div style={{ marginTop: 18 }}>
                  <div style={{ ...tag, marginBottom: 4 }}>The Scout suggests — click one to answer it</div>
                  {ideas.map((q, i) => (
                    <button key={i} className="cte-idea"
                      onClick={() => setRawStory((p) => (p ? p + "\n\n" : "") + "Q: " + q + "\nA: ")}>
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, margin: "0 0 12px" }}>
                <Num n={2} />Baseline (optional) — your current CV line
              </h2>
              <textarea value={baseline} onChange={(e) => setBaseline(e.target.value)} rows={3}
                aria-label="Current CV line" placeholder="Paste how your CV describes this now — the version to beat." />
            </section>

            <section>
              <h2 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, margin: "0 0 12px" }}>
                <Num n={3} />Your voice (optional) — writing that sounds like you
              </h2>
              <textarea value={voiceSample} onChange={(e) => setVoiceSample(e.target.value)} rows={4}
                aria-label="Voice sample"
                placeholder="Paste a few paragraphs you've actually written — an email, a post, a reflection. The Storyteller matches your cadence and word choices, not the content." />
            </section>

            <section>
              <h2 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, margin: "0 0 12px" }}>
                <Num n={4} />The receiver — paste the job advert or fund brief
              </h2>
              <textarea value={targetText} onChange={(e) => setTargetText(e.target.value)} rows={8}
                aria-label="Target text" placeholder="The full text of the job advert or funding brief you're aiming at." />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 22, marginTop: 14, alignItems: "center" }}>
                <label style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={useSearch} onChange={(e) => setUseSearch(e.target.checked)} />
                  Research the organisation (web search)
                </label>
                <label style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 10 }}>
                  Output
                  <select value={format} onChange={(e) => setFormat(e.target.value)} style={{ width: "auto", padding: "8px 12px" }}>
                    <option>Cover letter paragraph</option>
                    <option>CV profile statement</option>
                    <option>Funding application statement</option>
                  </select>
                </label>
              </div>
            </section>

            <div>
              <Btn primary onClick={runArchivist} disabled={!inputsReady}>Run the Archivist →</Btn>
              {!inputsReady && <div style={{ fontSize: 13, color: C.sub, marginTop: 10 }}>Needs a story and a target to begin.</div>}
            </div>
          </div>
        )}

        {/* ---------- STEP 1 ---------- */}
        {step === 1 && graph && !loading && (
          <div>
            <div style={{ ...tag, marginBottom: 22 }}>What the Archivist found — check it recognises you</div>
            {graph.map((e) => (
              <section key={e.id} style={{ borderTop: `2px solid ${C.ink}`, padding: "22px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "baseline" }}>
                  <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, maxWidth: 600 }}>{e.what_happened}</div>
                  <Strength s={e.confidence} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 8 }}>
                  {(e.capabilities || []).join("  ·  ")}
                </div>
                <div className="cte-quote">“{e.evidence_quote}”</div>
              </section>
            ))}
            <div style={{ paddingTop: 30 }}>
              <Btn primary onClick={runAnalyst}>Analyse the receiver →</Btn>
            </div>
          </div>
        )}

        {/* ---------- STEP 2 ---------- */}
        {step === 2 && profile && !loading && (
          <div>
            <div style={{ ...tag, marginBottom: 8 }}>Receiver profile</div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 26, marginBottom: 30 }}>
              {profile.organisation} <span style={{ color: C.sub, fontWeight: 500 }}>— {profile.receiver_type}</span>
            </div>
            {[
              ["Explicit requirements", profile.explicit_requirements],
              ["Implicit values", profile.implicit_values],
              ["Their vocabulary", profile.vocabulary],
              ["What they're afraid of", profile.fears],
              ["How they'll evaluate", profile.evaluation_criteria],
              ["Red flags for them", profile.red_flags],
            ].map(([title, items]) => (
              <section key={title} style={{ borderTop: `1px solid ${C.line}`, padding: "18px 0", display: "flex", gap: 20, flexWrap: "wrap" }}>
                <div style={{ ...tag, width: 200, flexShrink: 0, paddingTop: 4 }}>{title}</div>
                <div style={{ flex: 1, minWidth: 240, fontSize: 15 }}>{(items || []).join("  ·  ")}</div>
              </section>
            ))}
            <div style={{ paddingTop: 30 }}>
              <Btn primary onClick={runBridge}>Build the bridges →</Btn>
            </div>
          </div>
        )}

        {/* ---------- STEP 3 ---------- */}
        {step === 3 && bridges && !loading && (
          <div>
            <div style={{ ...tag, marginBottom: 22 }}>The Bridge — approve only what you can defend in the room</div>
            {rejection && (
              <section style={{ background: C.wash, border: `2px solid ${C.ink}`, padding: "22px 24px", marginBottom: 28 }}>
                <div style={{ ...tag, color: C.red, marginBottom: 10 }}>A rejection you might receive — and why</div>
                <div style={{ fontFamily: F.display, fontWeight: 500, fontSize: 18, lineHeight: 1.5, fontStyle: "italic" }}>
                  “{rejection}”
                </div>
                <div style={{ fontSize: 13, color: C.sub, marginTop: 12 }}>
                  This is what's missing, not a verdict. You may well have this — see below.
                </div>
              </section>
            )}
            {bridges.map((b, idx) => (
              <section key={b.id} style={{ borderTop: `1px solid ${C.line}`, padding: "18px 0", opacity: b.approved ? 1 : 0.45 }}>
                <label style={{ display: "flex", gap: 14, alignItems: "flex-start", cursor: "pointer" }}>
                  <input type="checkbox" checked={b.approved} style={{ marginTop: 5, width: 16, height: 16 }}
                    onChange={() => setBridges(bridges.map((x, i) => (i === idx ? { ...x, approved: !x.approved } : x)))} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
                      <span style={{ fontSize: 15 }}>
                        <strong>{b.capability}</strong>
                        <span style={{ color: C.coral, fontWeight: 700 }}>  →  </span>{b.maps_to}
                        <span style={{ ...tag, color: C.sub, marginLeft: 10 }}>{b.need_type}</span>
                      </span>
                      <Strength s={b.strength} />
                    </div>
                    <div style={{ fontSize: 13.5, color: C.sub, marginTop: 4 }}>{b.rationale}</div>
                  </div>
                </label>
              </section>
            ))}

            {gapItems.length > 0 && (
              <section style={{ marginTop: 36 }}>
                <div style={{ ...tag, marginBottom: 6 }}>What this receiver asked for that we couldn't evidence yet</div>
                <div style={{ fontSize: 13.5, color: C.sub, marginBottom: 18, maxWidth: 560 }}>
                  No pressure — this is just noticing what's not covered yet. You may well have it; we just haven't found the story.
                </div>
                {gapItems.map((item) => {
                  const g = gapState[item] || {};
                  return (
                    <div key={item} style={{ borderTop: `1px solid ${C.line}`, padding: "16px 0" }}>
                      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>{item}</div>

                      {!g.status && (
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <Btn small onClick={() => updateGap(item, { status: "have", text: "" })}>I have this</Btn>
                          <Btn small onClick={() => askScout(item)}>Not sure</Btn>
                          <Btn small onClick={() => updateGap(item, { status: "no" })}>I don't have this</Btn>
                        </div>
                      )}

                      {g.status === "unsure-loading" && (
                        <div style={{ fontSize: 13.5, color: C.sub }}>Finding a plain way to ask about this…</div>
                      )}

                      {g.status === "unsure" && g.question && (
                        <div className="cte-quote" style={{ marginTop: 0, marginBottom: 14 }}>{g.question}</div>
                      )}

                      {(g.status === "have" || g.status === "unsure") && (
                        <div style={{ marginTop: 10 }}>
                          <textarea
                            rows={3}
                            value={g.text || ""}
                            onChange={(e) => updateGap(item, { text: e.target.value })}
                            aria-label={"Your story for: " + item}
                            placeholder="Tell it in your own words — the messier the better, we'll find what's usable."
                          />
                          {g.error && <div style={{ fontSize: 13, color: C.red, marginTop: 8 }}>{g.error}</div>}
                          <div style={{ marginTop: 10 }}>
                            <Btn small onClick={() => submitGap(item)} disabled={!g.text || g.text.trim().length < 10}>
                              Add this evidence
                            </Btn>
                          </div>
                        </div>
                      )}

                      {g.status === "submitting" && (
                        <div style={{ fontSize: 13.5, color: C.sub, marginTop: 8 }}>Reading what you added and re-checking the bridges…</div>
                      )}

                      {g.status === "no" && (
                        <div style={{ fontSize: 13.5, color: C.sub, marginTop: 4 }}>
                          Noted. This stays out of the translation — nothing will claim it.
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            <div style={{ paddingTop: 30 }}>
              <Btn primary onClick={runStoryteller} disabled={!bridges.some((b) => b.approved)}>
                Write the translation ({bridges.filter((b) => b.approved).length} approved) →
              </Btn>
            </div>
          </div>
        )}

        {/* ---------- STEP 4 ---------- */}
        {step === 4 && finalPiece && !loading && (
          <div style={{ display: "grid", gap: 32 }}>
            <div style={{ ...tag }}>Translation · {format}</div>

            {baseline && (
              <section>
                <div style={{ ...tag, color: C.sub, marginBottom: 10 }}>Before — your current version</div>
                <div style={{ fontSize: 14.5, color: C.sub, whiteSpace: "pre-wrap", borderLeft: `4px solid ${C.line}`, paddingLeft: 16 }}>{baseline}</div>
              </section>
            )}

            <section style={{ background: C.wash, border: `2px solid ${C.ink}`, padding: "26px 28px" }}>
              <div style={{ ...tag, color: C.coral, marginBottom: 14 }}>After — translated for this receiver</div>
              <div style={{ fontFamily: F.display, fontWeight: 500, fontSize: 19, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {finalPiece.narrative}
              </div>
            </section>

            <section>
              <div style={{ ...tag, marginBottom: 12 }}>CV-ready lines</div>
              {(finalPiece.bullets || []).map((b, i) => (
                <div key={i} style={{ fontSize: 15, marginBottom: 8 }}>— {b}</div>
              ))}
            </section>

            <section>
              <div style={{ ...tag, marginBottom: 4 }}>Interview armour — defend every line</div>
              <div style={{ fontSize: 13.5, color: C.sub, marginBottom: 12 }}>
                Each approved claim, with the words of yours that back it. Rehearse these before the room.
              </div>
              {approvedBridges.map((b) => {
                const ep = graph.find((e) => e.id === b.episode_id);
                return (
                  <div key={b.id} style={{ borderTop: `1px solid ${C.line}`, padding: "14px 0" }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600 }}>{b.capability} <span style={{ color: C.coral }}>→</span> {b.maps_to}</div>
                    {ep && <div className="cte-quote">“{ep.evidence_quote}”</div>}
                  </div>
                );
              })}
            </section>

            {critique && (
              <section>
                <div style={{ ...tag, color: critique.verdict === "pass" ? C.green : C.amber, marginBottom: 10 }}>
                  Critic report — {critique.verdict === "pass" ? "clean on first pass" : `${(critique.violations || []).length} violation(s) caught and rewritten`}
                </div>
                {critique.what_works && (
                  <div style={{ fontSize: 14, color: C.green, marginBottom: 14 }}>
                    <span style={{ fontWeight: 600 }}>What works: </span>{critique.what_works}
                  </div>
                )}
                {critique.verdict === "fail" && (critique.violations || []).map((v, i) => (
                  <div key={i} style={{ fontSize: 14, marginBottom: 6 }}>
                    <span style={{ fontStyle: "italic", color: C.red }}>“{v.text}”</span>
                    <span style={{ color: C.sub }}> — {v.pattern}: {v.why}</span>
                  </div>
                ))}
                {critique.verdict === "pass" && (
                  <div style={{ fontSize: 14, color: C.sub }}>No banned patterns, no invented claims. Every line traces back to your own words.</div>
                )}
                <div style={{ fontSize: 13, color: C.sub, marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
                  This is a strong draft, not a submission. Read it aloud, change what isn't you, and send it in your own hand.
                </div>
              </section>
            )}

            <section>
              <div style={{ ...tag, marginBottom: 12 }}>Does this sound like you?</div>
              {!recognition && (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <Btn onClick={() => setRecognition("yes")}>Yes, that's me</Btn>
                  <Btn onClick={() => setRecognition("not_quite")}>Not quite</Btn>
                </div>
              )}
              {recognition === "yes" && (
                <div style={{ fontSize: 14, color: C.sub }}>Good — that's the whole point of the exercise.</div>
              )}
              {recognition === "not_quite" && !brokenLineSubmitted && (
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 8 }}>Which sentence broke it?</div>
                  <textarea
                    value={brokenLine}
                    onChange={(e) => setBrokenLine(e.target.value)}
                    rows={3}
                    style={{ width: "100%", fontFamily: F.body, fontSize: 14, padding: 12, border: `2px solid ${C.ink}`, background: C.bg, color: C.ink, resize: "vertical" }}
                  />
                  <div style={{ fontSize: 13, color: C.sub, marginTop: 8, marginBottom: 12 }}>
                    This is the most useful thing you can tell the system. Nothing else measures whether the translation worked.
                  </div>
                  <Btn primary onClick={() => setBrokenLineSubmitted(true)} disabled={!brokenLine.trim()}>Submit</Btn>
                </div>
              )}
              {recognition === "not_quite" && brokenLineSubmitted && (
                <div style={{ fontSize: 14, color: C.sub }}>
                  Noted for this session: <span style={{ fontStyle: "italic", color: C.ink }}>“{brokenLine}”</span>
                </div>
              )}
            </section>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Btn primary onClick={copyFinal}>{copied ? "Copied" : "Copy final text"}</Btn>
              <Btn onClick={reset}>Start a new translation</Btn>
            </div>
          </div>
        )}

        <footer style={{ marginTop: 80, borderTop: `2px solid ${C.ink}`, paddingTop: 20 }}>
          <div style={{ ...tag, color: C.sub, lineHeight: 2 }}>
            Scout · Archivist · Target Analyst · Bridge · Storyteller · Critic<br />
            Human approval gate before anything is written. Nothing enters the output without a verbatim evidence quote behind it.
          </div>
        </footer>
      </div>
    </div>
  );
}
