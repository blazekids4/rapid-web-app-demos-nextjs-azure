"use client";

import { useState, useRef, useCallback } from "react";

/* ── Types ─────────────────────────────────────────────────────────────── */
type ProfileId =
  | "unicorn"
  | "cash-cow"
  | "moonshot"
  | "niche-dominator"
  | "growth-rocket"
  | "pivot-candidate";

interface AnalysisResult {
  profile: ProfileId;
  confidence: number;
  rationale: string;
  signals: { label: string; value: string }[];
  playbook: string[];
  risk: string;
}

type Provider = "azure" | "openai";

interface LLMConfig {
  provider: Provider;
  endpoint: string;
  apiKey: string;
  deployment: string;
}

/* ── Profile Data ───────────────────────────────────────────────────────── */
const PROFILES: Record<
  ProfileId,
  {
    name: string;
    tagline: string;
    badge: string;
    badgeColor: string;
    desc: string;
    metrics: { label: string; value: string; color: string }[];
    bars: { name: string; pct: number; color: string }[];
    playbook: string[];
    color: string;
    accentLight: string;
    accentBorder: string;
  }
> = {
  unicorn: {
    name: "Unicorn",
    tagline: "Massive TAM · Strong moat",
    badge: "High Potential",
    badgeColor: "#34d399",
    desc: "Addresses a massive total addressable market with a defensible competitive moat. Strong product-market fit signals, scalable unit economics, and potential to define or dominate a category.",
    metrics: [
      { label: "TAM Score", value: "9.2/10", color: "#34d399" },
      { label: "Moat Strength", value: "Strong", color: "#34d399" },
      { label: "Scalability", value: "High", color: "#a78bfa" },
      { label: "Execution Risk", value: "Medium", color: "#fbbf24" },
    ],
    bars: [
      { name: "Market Size", pct: 95, color: "#7c6ddc" },
      { name: "Defensibility", pct: 82, color: "#7c6ddc" },
      { name: "Revenue Potential", pct: 90, color: "#7c6ddc" },
      { name: "Team Readiness", pct: 75, color: "#7c6ddc" },
    ],
    playbook: [
      "Raise aggressive seed round",
      "Hire senior technical talent early",
      "Pursue category-defining positioning",
      "Build network effects into core product",
    ],
    color: "#8b7bd4",
    accentLight: "rgba(139, 123, 212, 0.12)",
    accentBorder: "rgba(139, 123, 212, 0.3)",
  },
  "cash-cow": {
    name: "Cash Cow",
    tagline: "Proven model · Reliable returns",
    badge: "Steady",
    badgeColor: "#60a5fa",
    desc: "Low-risk business model with proven demand and clear unit economics. May lack explosive growth potential but offers steady, predictable revenue and strong path to profitability.",
    metrics: [
      { label: "Revenue Clarity", value: "High", color: "#34d399" },
      { label: "Unit Economics", value: "Proven", color: "#34d399" },
      { label: "Growth Ceiling", value: "Medium", color: "#fbbf24" },
      { label: "Risk Level", value: "Low", color: "#34d399" },
    ],
    bars: [
      { name: "Profitability", pct: 88, color: "#7c6ddc" },
      { name: "Market Validation", pct: 91, color: "#7c6ddc" },
      { name: "Scalability", pct: 52, color: "#7c6ddc" },
      { name: "Defensibility", pct: 65, color: "#7c6ddc" },
    ],
    playbook: [
      "Bootstrap or take minimal funding",
      "Focus on operational efficiency",
      "Build recurring revenue early",
      "Expand via adjacent markets over time",
    ],
    color: "#6ba3d6",
    accentLight: "rgba(107, 163, 214, 0.12)",
    accentBorder: "rgba(107, 163, 214, 0.3)",
  },
  moonshot: {
    name: "Moonshot",
    tagline: "High risk · Paradigm shift",
    badge: "Ambitious",
    badgeColor: "#fbbf24",
    desc: "Highly innovative concept with potential to create entirely new markets or disrupt entrenched incumbents. Requires significant R&D investment, patience, and tolerance for uncertainty.",
    metrics: [
      { label: "Innovation", value: "9.5/10", color: "#a78bfa" },
      { label: "Time to Market", value: "Long", color: "#fbbf24" },
      { label: "Disruption", value: "High", color: "#34d399" },
      { label: "Capital Needs", value: "High", color: "#fbbf24" },
    ],
    bars: [
      { name: "Novelty", pct: 95, color: "#f5a623" },
      { name: "Technical Risk", pct: 78, color: "#f5a623" },
      { name: "Market Readiness", pct: 35, color: "#f5a623" },
      { name: "Upside Potential", pct: 92, color: "#f5a623" },
    ],
    playbook: [
      "Secure patient capital (deep-tech VCs)",
      "Build a strong technical advisory board",
      "De-risk with phased milestones",
      "File provisional patents early",
    ],
    color: "#f5a623",
    accentLight: "rgba(245, 166, 35, 0.12)",
    accentBorder: "rgba(245, 166, 35, 0.3)",
  },
  "niche-dominator": {
    name: "Niche Dominator",
    tagline: "Deep expertise · Premium margins",
    badge: "Niche",
    badgeColor: "#f472b6",
    desc: "Targets a well-defined market segment with specialized needs. Limited mass-market appeal but commands premium pricing, deep customer loyalty, and strong word-of-mouth within the niche.",
    metrics: [
      { label: "Segment Fit", value: "96%", color: "#f472b6" },
      { label: "Pricing Power", value: "+30%", color: "#34d399" },
      { label: "TAM Size", value: "Small", color: "#fbbf24" },
      { label: "Loyalty Signal", value: "High", color: "#34d399" },
    ],
    bars: [
      { name: "Segment Depth", pct: 94, color: "#e84f8c" },
      { name: "Premium WTP", pct: 82, color: "#e84f8c" },
      { name: "Community Strength", pct: 78, color: "#e84f8c" },
      { name: "Mass Scalability", pct: 25, color: "#e84f8c" },
    ],
    playbook: [
      "Own the community and discourse",
      "Build in specialty/vertical channels",
      "Price on value, not competition",
      "Create thought leadership content",
    ],
    color: "#e84f8c",
    accentLight: "rgba(232, 79, 140, 0.12)",
    accentBorder: "rgba(232, 79, 140, 0.3)",
  },
  "growth-rocket": {
    name: "Growth Rocket",
    tagline: "Strong traction · Viral potential",
    badge: "Hot",
    badgeColor: "#34d399",
    desc: "Strong early traction indicators — high engagement, organic growth loops, and evidence of product-market fit. The core challenge shifts from validation to scaling execution.",
    metrics: [
      { label: "Traction Score", value: "8.7/10", color: "#34d399" },
      { label: "Viral Coeff.", value: "1.4x", color: "#a78bfa" },
      { label: "Retention", value: "72%", color: "#34d399" },
      { label: "Burn Multiple", value: "1.2x", color: "#34d399" },
    ],
    bars: [
      { name: "User Growth", pct: 88, color: "#8b7bd4" },
      { name: "Engagement", pct: 82, color: "#8b7bd4" },
      { name: "Organic Share", pct: 76, color: "#8b7bd4" },
      { name: "Revenue Growth", pct: 70, color: "#8b7bd4" },
    ],
    playbook: [
      "Double down on growth loops",
      "Raise Series A to fuel scaling",
      "Hire growth and data team",
      "Optimize onboarding and activation",
    ],
    color: "#9584d4",
    accentLight: "rgba(149, 132, 212, 0.12)",
    accentBorder: "rgba(149, 132, 212, 0.3)",
  },
  "pivot-candidate": {
    name: "Pivot Candidate",
    tagline: "Interesting insight · Needs rethinking",
    badge: "Watch",
    badgeColor: "#a78bfa",
    desc: "Contains a valuable core insight or technology, but the current go-to-market approach, business model, or target audience needs significant rethinking to unlock real traction.",
    metrics: [
      { label: "Core Insight", value: "Strong", color: "#a78bfa" },
      { label: "Current PMF", value: "Weak", color: "#fbbf24" },
      { label: "Pivot Potential", value: "High", color: "#34d399" },
      { label: "Runway Need", value: "Medium", color: "#fbbf24" },
    ],
    bars: [
      { name: "Insight Quality", pct: 78, color: "#8b7bd4" },
      { name: "Market Fit (now)", pct: 28, color: "#8b7bd4" },
      { name: "Pivot Optionality", pct: 85, color: "#8b7bd4" },
      { name: "Team Adaptability", pct: 62, color: "#8b7bd4" },
    ],
    playbook: [
      "Run rapid customer discovery sprints",
      "Test 2-3 alternative positioning angles",
      "Reduce burn rate to extend runway",
      "Seek mentors from adjacent spaces",
    ],
    color: "#9584d4",
    accentLight: "rgba(149, 132, 212, 0.12)",
    accentBorder: "rgba(149, 132, 212, 0.3)",
  },
};

const PROFILE_ORDER: ProfileId[] = [
  "unicorn",
  "cash-cow",
  "moonshot",
  "niche-dominator",
  "growth-rocket",
  "pivot-candidate",
];

/* ── SVG Icons ──────────────────────────────────────────────────────────── */
function ProfileIcon({
  id,
  size = 40,
  color,
}: {
  id: ProfileId;
  size?: number;
  color: string;
}) {
  const icons: Record<ProfileId, React.ReactNode> = {
    unicorn: (
      <polygon
        points="20,4 23.5,13 33,13 25.5,18.5 28,28 20,22.5 12,28 14.5,18.5 7,13 16.5,13"
        fill={color}
      />
    ),
    "cash-cow": (
      <>
        <rect x="8" y="14" width="24" height="16" rx="3" stroke={color} strokeWidth="2" fill="none" />
        <line x1="8" y1="20" x2="32" y2="20" stroke={color} strokeWidth="2" />
        <circle cx="20" cy="26" r="2" fill={color} />
      </>
    ),
    moonshot: (
      <>
        <circle cx="20" cy="18" r="10" stroke={color} strokeWidth="2" fill="none" />
        <line x1="20" y1="28" x2="16" y2="36" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="20" y1="28" x2="24" y2="36" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="20" y1="28" x2="20" y2="36" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    "niche-dominator": (
      <>
        <circle cx="20" cy="20" r="13" stroke={color} strokeWidth="1.5" fill="none" />
        <circle cx="20" cy="20" r="7" stroke={color} strokeWidth="1.5" fill="none" />
        <circle cx="20" cy="20" r="2.5" fill={color} />
        <line x1="28" y1="28" x2="34" y2="34" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      </>
    ),
    "growth-rocket": (
      <>
        <polyline
          points="4,28 10,20 17,24 24,12 32,16"
          stroke={color}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polygon points="28,6 36,14 28,14" fill={color} />
      </>
    ),
    "pivot-candidate": (
      <>
        <path
          d="M10,28 L20,8 L30,28"
          stroke={color}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="20" y1="18" x2="20" y2="24" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="20" cy="28" r="1.5" fill={color} />
      </>
    ),
  };

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {icons[id]}
    </svg>
  );
}

/* ── Azure OpenAI Call ──────────────────────────────────────────────────── */
async function analyzeStartup(
  ideaText: string,
  config: LLMConfig
): Promise<AnalysisResult> {
  const systemPrompt = `You are a startup evaluation specialist and venture strategist. 
You classify startup ideas into one of six archetypes based on their market potential, defensibility, traction signals, innovation level, and risk profile.

The six archetypes are:
1. unicorn - Massive TAM, strong moat, category-defining potential, scalable unit economics
2. cash-cow - Proven demand, clear unit economics, steady revenue, low risk, limited explosive growth
3. moonshot - Highly innovative, paradigm-shifting, long time horizon, high capital needs, high upside
4. niche-dominator - Deep segment focus, premium pricing power, strong loyalty, limited mass scale
5. growth-rocket - Strong early traction, viral loops, product-market fit evidence, scaling challenge
6. pivot-candidate - Valuable core insight but current approach needs rethinking, weak current PMF

Respond ONLY with a valid JSON object in this exact shape:
{
  "profile": "<one of the six archetype ids above>",
  "confidence": <integer 60-98>,
  "rationale": "<2-3 sentence explanation of why this archetype fits>",
  "signals": [
    {"label": "<signal name>", "value": "<observed value or strength>"},
    {"label": "<signal name>", "value": "<observed value or strength>"},
    {"label": "<signal name>", "value": "<observed value or strength>"}
  ],
  "playbook": ["<tactic 1>", "<tactic 2>", "<tactic 3>", "<tactic 4>"],
  "risk": "<one sentence on the primary strategic risk>"
}`;

  const userPrompt = `Analyze this startup idea and classify it into the correct archetype:\n\n"${ideaText}"`;

  let url: string;
  let headers: Record<string, string>;

  if (config.provider === "azure") {
    const base = config.endpoint.replace(/\/$/, "");
    url = `${base}/chat/completions?api-version=2025-01-01-preview`;
    headers = {
      "Content-Type": "application/json",
      "api-key": config.apiKey,
    };
  } else {
    url = "https://api.openai.com/v1/chat/completions";
    headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.deployment,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 800,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    const label = config.provider === "azure" ? "Azure OpenAI" : "OpenAI";
    throw new Error(`${label} error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  if (!cleaned) {
    throw new Error(
      "The model returned an empty response. Check your API key and model/deployment name."
    );
  }
  try {
    return JSON.parse(cleaned) as AnalysisResult;
  } catch {
    throw new Error(`Failed to parse model response: ${cleaned.slice(0, 200)}`);
  }
}

/* ── Config Modal ───────────────────────────────────────────────────────── */
function ConfigModal({
  config,
  onSave,
  onClose,
}: {
  config: LLMConfig;
  onSave: (c: LLMConfig) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<LLMConfig>({ ...config });
  const isAzure = local.provider === "azure";

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <span style={styles.modalTitle}>LLM Configuration</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Provider toggle */}
        <div style={styles.configField}>
          <label style={styles.configLabel}>Provider</label>
          <div style={styles.providerToggle}>
            <button
              style={{
                ...styles.providerBtn,
                ...(isAzure ? styles.providerBtnActive : {}),
              }}
              onClick={() =>
                setLocal({ ...local, provider: "azure", deployment: isAzure ? local.deployment : "gpt-5-3-chat-gs" })
              }
            >
              Azure OpenAI
            </button>
            <button
              style={{
                ...styles.providerBtn,
                ...(!isAzure ? styles.providerBtnActive : {}),
              }}
              onClick={() =>
                setLocal({ ...local, provider: "openai", endpoint: "", deployment: isAzure ? "gpt-4o" : local.deployment })
              }
            >
              OpenAI
            </button>
          </div>
        </div>

        {isAzure && (
          <div style={styles.configField}>
            <label style={styles.configLabel}>Endpoint</label>
            <input
              style={styles.configInput}
              placeholder="https://<resource>.openai.azure.com/openai/v1"
              value={local.endpoint}
              onChange={(e) => setLocal({ ...local, endpoint: e.target.value })}
            />
          </div>
        )}
        <div style={styles.configField}>
          <label style={styles.configLabel}>API Key</label>
          <input
            style={styles.configInput}
            type="password"
            placeholder="••••••••••••••••"
            value={local.apiKey}
            onChange={(e) => setLocal({ ...local, apiKey: e.target.value })}
          />
        </div>
        <div style={styles.configField}>
          <label style={styles.configLabel}>{isAzure ? "Deployment Name" : "Model"}</label>
          <input
            style={styles.configInput}
            placeholder={isAzure ? "gpt-5-3-chat-gs" : "gpt-4o"}
            value={local.deployment}
            onChange={(e) => setLocal({ ...local, deployment: e.target.value })}
          />
        </div>
        <button
          style={styles.saveBtn}
          onClick={() => { onSave(local); onClose(); }}
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────── */
export default function StartupEvaluator() {
  const [activeProfile, setActiveProfile] = useState<ProfileId | null>(null);
  const [ideaText, setIdeaText] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<LLMConfig>({
    provider: "openai",
    endpoint: "",
    apiKey: "",
    deployment: "gpt-4o",
  });
  const analyzerRef = useRef<HTMLDivElement>(null);

  const configReady =
    config.apiKey &&
    config.deployment &&
    (config.provider === "openai" || config.endpoint);

  const handleAnalyze = useCallback(async () => {
    if (!ideaText.trim() || !configReady) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    setAnalysis(null);
    try {
      const result = await analyzeStartup(ideaText, config);
      setAnalysis(result);
      setActiveProfile(result.profile as ProfileId);
      analyzerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (e: unknown) {
      setAnalyzeError(e instanceof Error ? e.message : "Analysis failed. Check your configuration.");
    } finally {
      setAnalyzing(false);
    }
  }, [ideaText, config, configReady]);

  const selectedProfile = activeProfile ? PROFILES[activeProfile] : null;

  return (
    <div style={styles.root}>
      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.eyebrow}>Startup · Evaluator</div>
          <h1 style={styles.h1}>Idea Archetypes</h1>
          <p style={styles.subtitle}>
            Six startup archetypes. Each with its own strategy, risk profile, and growth levers.
          </p>
        </div>
        <button style={styles.configTrigger} onClick={() => setShowConfig(true)}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: configReady ? "#22c55e" : "#f59e0b", flexShrink: 0 }} />
          {configReady
            ? `${config.provider === "azure" ? "Azure OpenAI" : "OpenAI"} Connected`
            : "Configure LLM"}
        </button>
      </div>

      {/* ── Hex Grid ── */}
      <div style={styles.hexGrid}>
        {PROFILE_ORDER.map((id) => {
          const p = PROFILES[id];
          const isActive = activeProfile === id;
          return (
            <button
              key={id}
              style={{
                ...styles.hexCard,
                ...(isActive
                  ? { ...styles.hexCardActive, borderColor: p.accentBorder, background: p.accentLight }
                  : {}),
              }}
              onClick={() => setActiveProfile(isActive ? null : id)}
            >
              <div style={styles.hexCardIcon}>
                <ProfileIcon id={id} size={38} color={isActive ? p.color : "#94a3b8"} />
              </div>
              <span
                style={{
                  ...styles.hexBadge,
                  background: isActive ? p.accentLight : "var(--color-background-secondary)",
                  color: isActive ? p.badgeColor : "var(--color-text-tertiary)",
                  border: `0.5px solid ${isActive ? p.accentBorder : "var(--color-border-secondary)"}`,
                }}
              >
                {p.badge}
              </span>
              <div style={{ ...styles.hexCardName, color: isActive ? p.color : "var(--color-text-primary)" }}>
                {p.name}
              </div>
              <div style={styles.hexCardTagline}>{p.tagline}</div>
            </button>
          );
        })}
      </div>

      {/* ── Detail Panel ── */}
      {selectedProfile && activeProfile && (
        <div
          style={{
            ...styles.detailPanel,
            borderColor: selectedProfile.accentBorder,
          }}
        >
          <div style={styles.detailTop}>
            <div style={{ ...styles.detailIconWrap, background: selectedProfile.accentLight }}>
              <ProfileIcon id={activeProfile} size={48} color={selectedProfile.color} />
            </div>
            <div style={styles.detailTopText}>
              <div style={{ ...styles.detailTitle, color: selectedProfile.color }}>
                {selectedProfile.name}
              </div>
              <div style={styles.detailDesc}>{selectedProfile.desc}</div>
            </div>
          </div>

          {/* Metrics */}
          <div style={styles.metricsRow}>
            {selectedProfile.metrics.map((m) => (
              <div key={m.label} style={styles.metricCard}>
                <div style={styles.metricLabel}>{m.label}</div>
                <div style={{ ...styles.metricValue, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Bars */}
          <div style={styles.barsSection}>
            <div style={styles.sectionLabel}>Evaluation signals</div>
            {selectedProfile.bars.map((b) => (
              <div key={b.name} style={styles.barRow}>
                <div style={styles.barName}>{b.name}</div>
                <div style={styles.barTrack}>
                  <div style={{ ...styles.barFill, width: `${b.pct}%`, background: b.color }} />
                </div>
                <div style={styles.barPct}>{b.pct}%</div>
              </div>
            ))}
          </div>

          {/* Playbook */}
          <div style={styles.sectionLabel}>Strategy playbook</div>
          <div style={styles.playbookRow}>
            {selectedProfile.playbook.map((t) => (
              <div
                key={t}
                style={{
                  ...styles.playbookTag,
                  background: selectedProfile.accentLight,
                  color: selectedProfile.color,
                  borderColor: selectedProfile.accentBorder,
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AI Analyzer ── */}
      <div ref={analyzerRef} style={styles.analyzerPanel}>
        <div style={styles.analyzerHeader}>
          <div>
            <div style={styles.analyzerTitle}>AI Idea Analyzer</div>
            <div style={styles.analyzerSubtitle}>
              Describe a startup idea and let Azure OpenAI / OpenAI classify its archetype.
            </div>
          </div>
          <div
            style={{
              ...styles.aiStatusBadge,
              background: configReady ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
              color: configReady ? "#34d399" : "#fbbf24",
              borderColor: configReady ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)",
            }}
          >
            {configReady
              ? `● ${config.provider === "azure" ? "Azure OpenAI" : "OpenAI"} Ready`
              : "⚠ Not configured"}
          </div>
        </div>

        <textarea
          style={styles.textarea}
          rows={5}
          placeholder={`Describe a startup idea, e.g.:\n"An AI-powered platform that matches freelance developers with short-term enterprise projects. Uses skill assessments and project complexity scoring to ensure fit. Currently has 2,000 active freelancers, 85% client satisfaction, and 40% month-over-month growth in project volume..."`}
          value={ideaText}
          onChange={(e) => setIdeaText(e.target.value)}
        />

        <div style={styles.analyzerActions}>
          {!configReady && (
            <span style={styles.configHint}>
              Configure your LLM provider first →
            </span>
          )}
          <button
            style={{
              ...styles.analyzeBtn,
              opacity: !ideaText.trim() || !configReady || analyzing ? 0.5 : 1,
              cursor: !ideaText.trim() || !configReady || analyzing ? "not-allowed" : "pointer",
            }}
            onClick={handleAnalyze}
            disabled={!ideaText.trim() || !configReady || analyzing}
          >
            {analyzing ? "Analyzing..." : "Evaluate Idea →"}
          </button>
        </div>

        {analyzeError && (
          <div style={styles.errorBox}>{analyzeError}</div>
        )}

        {/* Analysis Result */}
        {analysis && (() => {
          const p = PROFILES[analysis.profile as ProfileId];
          if (!p) return null;
          return (
            <div style={{ ...styles.resultPanel, borderColor: p.accentBorder, background: p.accentLight }}>
              <div style={styles.resultHeader}>
                <div style={styles.resultIconWrap}>
                  <ProfileIcon id={analysis.profile as ProfileId} size={44} color={p.color} />
                </div>
                <div style={styles.resultHeaderText}>
                  <div style={styles.resultLabel}>Classified as</div>
                  <div style={{ ...styles.resultProfileName, color: p.color }}>{p.name}</div>
                  <div style={styles.resultTagline}>{p.tagline}</div>
                </div>
                <div style={{ ...styles.confidenceBadge, background: p.color }}>
                  {analysis.confidence}% confidence
                </div>
              </div>

              <div style={styles.resultRationale}>{analysis.rationale}</div>

              <div style={styles.resultTwoCol}>
                <div>
                  <div style={styles.sectionLabel}>Detected signals</div>
                  {analysis.signals.map((s) => (
                    <div key={s.label} style={styles.signalRow}>
                      <span style={styles.signalLabel}>{s.label}</span>
                      <span style={{ ...styles.signalValue, color: p.color }}>{s.value}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={styles.sectionLabel}>Recommended playbook</div>
                  {analysis.playbook.map((t, i) => (
                    <div key={i} style={styles.playbookItem}>
                      <span style={{ ...styles.playbookNum, color: p.color }}>{i + 1}</span>
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...styles.riskBox, borderColor: p.accentBorder }}>
                <span style={styles.riskLabel}>Primary risk</span>
                {analysis.risk}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Config Modal ── */}
      {showConfig && (
        <ConfigModal
          config={config}
          onSave={setConfig}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  root: {
    fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    maxWidth: 900,
    margin: "0 auto",
    padding: "2rem 1.25rem 3rem",
    color: "var(--color-text-primary)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "2rem",
    flexWrap: "wrap" as const,
    gap: "1rem",
  },
  headerLeft: { flex: 1 },
  eyebrow: {
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "var(--color-text-tertiary)",
    marginBottom: 6,
  },
  h1: {
    fontSize: 28,
    fontWeight: 600,
    margin: "0 0 6px",
    letterSpacing: "-0.02em",
    color: "var(--color-text-primary)",
  },
  subtitle: {
    fontSize: 14,
    color: "var(--color-text-secondary)",
    margin: 0,
    lineHeight: 1.5,
  },
  configTrigger: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    padding: "8px 16px",
    border: "0.5px solid var(--color-border-secondary)",
    borderRadius: 8,
    background: "transparent",
    color: "var(--color-text-secondary)",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  },
  hexGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginBottom: "1.5rem",
  },
  hexCard: {
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: 12,
    padding: "1.25rem 1rem",
    cursor: "pointer",
    background: "var(--color-background-primary)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-start",
    gap: 6,
    textAlign: "left" as const,
    transition: "border-color 0.15s, background 0.15s, transform 0.1s",
  },
  hexCardActive: {
    border: "1.5px solid",
  },
  hexCardIcon: { marginBottom: 2 },
  hexBadge: {
    fontSize: 11,
    padding: "2px 10px",
    borderRadius: 100,
    fontWeight: 500,
    letterSpacing: "0.02em",
  },
  hexCardName: {
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },
  hexCardTagline: {
    fontSize: 12,
    color: "var(--color-text-tertiary)",
    lineHeight: 1.4,
  },
  detailPanel: {
    border: "1px solid",
    borderRadius: 12,
    background: "var(--color-background-primary)",
    padding: "1.5rem",
    marginBottom: "1.5rem",
  },
  detailTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: "1.25rem",
  },
  detailIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  detailTopText: { flex: 1 },
  detailTitle: {
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    marginBottom: 6,
  },
  detailDesc: {
    fontSize: 14,
    color: "var(--color-text-secondary)",
    lineHeight: 1.6,
    margin: 0,
  },
  metricsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10,
    marginBottom: "1.25rem",
  },
  metricCard: {
    background: "var(--color-background-secondary)",
    borderRadius: 8,
    padding: "0.85rem 0.75rem",
    textAlign: "center" as const,
  },
  metricLabel: {
    fontSize: 11,
    color: "var(--color-text-tertiary)",
    marginBottom: 4,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 600,
  },
  barsSection: { marginBottom: "1.25rem" },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "var(--color-text-tertiary)",
    marginBottom: 10,
  },
  barRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  barName: {
    fontSize: 12,
    color: "var(--color-text-secondary)",
    width: 110,
    flexShrink: 0,
  },
  barTrack: {
    flex: 1,
    height: 6,
    background: "var(--color-background-secondary)",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 3 },
  barPct: {
    fontSize: 12,
    color: "var(--color-text-secondary)",
    width: 34,
    textAlign: "right" as const,
  },
  playbookRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
    marginTop: 8,
  },
  playbookTag: {
    fontSize: 12,
    padding: "5px 14px",
    borderRadius: 100,
    border: "0.5px solid",
    fontWeight: 500,
  },
  analyzerPanel: {
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: 12,
    background: "var(--color-background-primary)",
    padding: "1.5rem",
  },
  analyzerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1rem",
    gap: "1rem",
    flexWrap: "wrap" as const,
  },
  analyzerTitle: {
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    marginBottom: 4,
  },
  analyzerSubtitle: {
    fontSize: 13,
    color: "var(--color-text-secondary)",
  },
  aiStatusBadge: {
    fontSize: 12,
    fontWeight: 500,
    padding: "5px 12px",
    borderRadius: 100,
    border: "0.5px solid",
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  },
  textarea: {
    width: "100%",
    fontSize: 13,
    lineHeight: 1.6,
    padding: "12px 14px",
    border: "0.5px solid var(--color-border-secondary)",
    borderRadius: 8,
    background: "var(--color-background-secondary)",
    color: "var(--color-text-primary)",
    resize: "vertical" as const,
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
  },
  analyzerActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 10,
    flexWrap: "wrap" as const,
  },
  configHint: {
    fontSize: 12,
    color: "var(--color-text-tertiary)",
  },
  analyzeBtn: {
    fontSize: 13,
    fontWeight: 600,
    padding: "9px 20px",
    borderRadius: 8,
    border: "none",
    background: "#7c6ddc",
    color: "#fff",
    cursor: "pointer",
    letterSpacing: "-0.01em",
  },
  errorBox: {
    marginTop: 12,
    padding: "10px 14px",
    borderRadius: 8,
    background: "rgba(239, 68, 68, 0.15)",
    color: "#fca5a5",
    fontSize: 13,
    border: "0.5px solid rgba(239, 68, 68, 0.3)",
  },
  resultPanel: {
    marginTop: "1.25rem",
    border: "1px solid",
    borderRadius: 10,
    padding: "1.25rem",
  },
  resultHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: "1rem",
    flexWrap: "wrap" as const,
  },
  resultIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 10,
    background: "rgba(255,255,255,0.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  resultHeaderText: { flex: 1 },
  resultLabel: {
    fontSize: 11,
    color: "var(--color-text-tertiary)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: 2,
  },
  resultProfileName: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  resultTagline: {
    fontSize: 13,
    color: "var(--color-text-secondary)",
  },
  confidenceBadge: {
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    padding: "6px 14px",
    borderRadius: 100,
    alignSelf: "flex-start",
    flexShrink: 0,
  },
  resultRationale: {
    fontSize: 14,
    lineHeight: 1.65,
    color: "var(--color-text-secondary)",
    marginBottom: "1.25rem",
    padding: "12px 14px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 8,
  },
  resultTwoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1.5rem",
    marginBottom: "1rem",
  },
  signalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
    borderBottom: "0.5px solid rgba(255,255,255,0.08)",
    fontSize: 13,
  },
  signalLabel: { color: "var(--color-text-secondary)" },
  signalValue: { fontWeight: 600, fontSize: 13 },
  playbookItem: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    fontSize: 13,
    color: "var(--color-text-secondary)",
    padding: "5px 0",
    borderBottom: "0.5px solid rgba(255,255,255,0.08)",
  },
  playbookNum: {
    fontWeight: 700,
    fontSize: 12,
    flexShrink: 0,
  },
  riskBox: {
    fontSize: 13,
    color: "var(--color-text-secondary)",
    padding: "10px 14px",
    borderRadius: 8,
    border: "0.5px solid",
    background: "rgba(255,255,255,0.04)",
    display: "flex",
    gap: 8,
    alignItems: "baseline",
  },
  riskLabel: {
    fontWeight: 700,
    fontSize: 11,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    flexShrink: 0,
    color: "var(--color-text-tertiary)",
  },

  /* Config Modal */
  modalOverlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "1rem",
  },
  modalCard: {
    background: "var(--color-background-primary)",
    borderRadius: 14,
    padding: "1.5rem",
    width: "100%",
    maxWidth: 480,
    border: "0.5px solid var(--color-border-secondary)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.25rem",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "var(--color-text-primary)",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: 16,
    cursor: "pointer",
    color: "var(--color-text-secondary)",
    padding: "4px 8px",
  },
  configField: { marginBottom: "1rem" },
  configLabel: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--color-text-secondary)",
    marginBottom: 6,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  },
  configInput: {
    width: "100%",
    fontSize: 13,
    padding: "9px 12px",
    border: "0.5px solid var(--color-border-secondary)",
    borderRadius: 8,
    background: "var(--color-background-secondary)",
    color: "var(--color-text-primary)",
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
  },
  saveBtn: {
    width: "100%",
    marginTop: 8,
    padding: "10px",
    fontSize: 14,
    fontWeight: 600,
    background: "#7c6ddc",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  providerToggle: {
    display: "flex",
    gap: 0,
    borderRadius: 8,
    overflow: "hidden" as const,
    border: "0.5px solid var(--color-border-secondary)",
  },
  providerBtn: {
    flex: 1,
    padding: "9px 0",
    fontSize: 13,
    fontWeight: 500,
    border: "none",
    background: "var(--color-background-secondary)",
    color: "var(--color-text-secondary)",
    cursor: "pointer",
  },
  providerBtnActive: {
    background: "#7c6ddc",
    color: "#fff",
    fontWeight: 600,
  },
};
