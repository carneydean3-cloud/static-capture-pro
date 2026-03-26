// src/components/ResultsPreview.tsx

import React, { useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useAudit } from "@/contexts/AuditContext";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PillarScore {
  pillar: string;
  score: number;
  issue: string;
  fix: string;
}

interface AuditResult {
  overallScore: number;
  pillars: PillarScore[];
  topFixes: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PILLAR_ORDER = ["Clarity", "Hook", "Trust", "Desire", "Action", "Objections"];

const pillarEmojis: Record<string, string> = {
  Clarity: "🔍",
  Hook: "🪝",
  Trust: "🛡️",
  Desire: "🔥",
  Action: "🎯",
  Objections: "🧱",
};

function getScoreColor(score: number): string {
  if (score >= 80) return "#22c55e"; // green
  if (score >= 60) return "#eab308"; // yellow
  if (score >= 40) return "#f97316"; // orange
  return "#ef4444"; // red
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Decent";
  if (score >= 40) return "Needs Work";
  return "Weak";
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div style={{ position: "relative", width: 140, height: 140 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        {/* Background ring */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth="10"
        />
        {/* Score ring */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 36, fontWeight: 800, color }}>{score}</span>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>/100</span>
      </div>
    </div>
  );
};

const PillarCard: React.FC<{ pillar: PillarScore }> = ({ pillar }) => {
  const color = getScoreColor(pillar.score);
  const label = getScoreLabel(pillar.score);
  const emoji = pillarEmojis[pillar.pillar] || "📊";

  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: 12,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        transition: "border-color 0.2s, transform 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#22c55e";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#1e293b";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{emoji}</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
            {pillar.pillar}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color }}>
            {pillar.score}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color,
              background: `${color}15`,
              padding: "2px 8px",
              borderRadius: 9999,
            }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div
        style={{
          width: "100%",
          height: 6,
          background: "#1e293b",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pillar.score}%`,
            height: "100%",
            background: color,
            borderRadius: 3,
            transition: "width 1s ease-out",
          }}
        />
      </div>

      {/* Issue */}
      <div
        style={{
          background: "#1e293b",
          borderRadius: 8,
          padding: 12,
          borderLeft: "3px solid #ef4444",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#ef4444",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 4,
          }}
        >
          ⚠️ Issue
        </div>
        <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.5 }}>
          {pillar.issue}
        </div>
      </div>

      {/* Fix */}
      <div
        style={{
          background: "#1e293b",
          borderRadius: 8,
          padding: 12,
          borderLeft: "3px solid #22c55e",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#22c55e",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 4,
          }}
        >
          ✅ Fix
        </div>
        <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.5 }}>
          {pillar.fix}
        </div>
      </div>
    </div>
  );
};

// ─── Custom Radar Tooltip ────────────────────────────────────────────────────

const CustomRadarTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const color = getScoreColor(data.score);

  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: 8,
        padding: "8px 12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ fontWeight: 700, color: "#f1f5f9", marginBottom: 2 }}>
        {data.pillar}
      </div>
      <div style={{ color, fontWeight: 800, fontSize: 18 }}>
        {data.score}/100
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const ResultsPreview: React.FC = () => {
  const { result, url, userEmail } = useAudit();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!result) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          color: "#94a3b8",
          fontSize: 16,
        }}
      >
        No audit results to display.
      </div>
    );
  }

  // ── Normalize the result into a consistent shape ──

  const audit: AuditResult = (() => {
    // Handle various shapes your Edge Function might return
    const pillars: PillarScore[] = (
      result.pillars ||
      result.scores ||
      result.pillarScores ||
      []
    ).map((p: any) => ({
      pillar: p.pillar || p.name || p.label || "Unknown",
      score: typeof p.score === "number" ? p.score : parseInt(p.score) || 0,
      issue: p.issue || p.problem || p.weakness || "No issue identified.",
      fix: p.fix || p.recommendation || p.suggestion || "No fix provided.",
    }));

    // Sort pillars into canonical order
    const sorted = PILLAR_ORDER.map(
      (name) =>
        pillars.find(
          (p) => p.pillar.toLowerCase() === name.toLowerCase()
        ) || {
          pillar: name,
          score: 0,
          issue: "Not analyzed.",
          fix: "Not available.",
        }
    );

    const overallScore =
      result.overallScore ||
      result.overall_score ||
      result.totalScore ||
      Math.round(sorted.reduce((sum, p) => sum + p.score, 0) / sorted.length);

    const topFixes: string[] =
      result.topFixes ||
      result.top_fixes ||
      result.topRecommendations ||
      sorted
        .slice()
        .sort((a, b) => a.score - b.score)
        .slice(0, 3)
        .map((p) => p.fix);

    return { overallScore, pillars: sorted, topFixes };
  })();

  // ── Radar chart data ──

  const radarData = audit.pillars.map((p) => ({
    pillar: p.pillar,
    score: p.score,
    fullMark: 100,
  }));

  // ── Stripe checkout handler ──

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            userEmail,
            url,
            auditResult: result,
          }),
        }
      );

      if (!response.ok) {
        const errBody = await response.json().catch(() => null);
        throw new Error(
          errBody?.error || `Checkout failed (${response.status})`
        );
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned.");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──

  const overallColor = getScoreColor(audit.overallScore);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 900,
        margin: "0 auto",
        padding: "32px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 32,
      }}
    >
      {/* ── Header: Overall Score + Radar ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          border: "1px solid #1e293b",
          borderRadius: 16,
          padding: 32,
        }}
      >
        {/* URL badge */}
        {url && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#1e293b",
              borderRadius: 9999,
              padding: "6px 14px",
              marginBottom: 20,
            }}
          >
            <span style={{ fontSize: 13, color: "#22c55e" }}>🔗</span>
            <span
              style={{
                fontSize: 13,
                color: "#94a3b8",
                maxWidth: 300,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {url}
            </span>
          </div>
        )}

        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "#f1f5f9",
            margin: "0 0 8px",
          }}
        >
          Your Landing Page Audit
        </h2>
        <p style={{ fontSize: 14, color: "#94a3b8", margin: "0 0 28px" }}>
          Here's how your page scores across the 6 conversion pillars.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 32,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Overall score ring */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <ScoreRing score={audit.overallScore} />
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: overallColor,
              }}
            >
              {getScoreLabel(audit.overallScore)}
            </span>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              Overall Score
            </span>
          </div>

          {/* Radar chart */}
          <div style={{ flex: 1, minWidth: 280, height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis
                  dataKey="pillar"
                  tick={{
                    fill: "#94a3b8",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: "#475569", fontSize: 10 }}
                  axisLine={false}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  dot={{
                    r: 4,
                    fill: "#22c55e",
                    stroke: "#0f172a",
                    strokeWidth: 2,
                  }}
                />
                <Tooltip content={<CustomRadarTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Pillar Score Cards ── */}
      <div>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#f1f5f9",
            margin: "0 0 16px",
          }}
        >
          Pillar Breakdown
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(380, 1fr))",
            gap: 16,
          }}
        >
          {audit.pillars.map((pillar) => (
            <PillarCard key={pillar.pillar} pillar={pillar} />
          ))}
        </div>
      </div>

      {/* ── Top 3 Fixes ── */}
      {audit.topFixes.length > 0 && (
        <div
          style={{
            background: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: 16,
            padding: 28,
          }}
        >
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#f1f5f9",
              margin: "0 0 4px",
            }}
          >
            🚀 Top 3 Fixes to Boost Conversions
          </h3>
          <p
            style={{
              fontSize: 13,
              color: "#64748b",
              margin: "0 0 20px",
            }}
          >
            Start with these high-impact changes for the biggest lift.
          </p>

          <div
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            {audit.topFixes.slice(0, 3).map((fix, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                  background: "#1e293b",
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 14,
                    color: "#0f172a",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: "#cbd5e1",
                    lineHeight: 1.6,
                  }}
                >
                  {fix}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CTA: Stripe Checkout ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1a2332 100%)",
          border: "1px solid #22c55e33",
          borderRadius: 16,
          padding: 32,
          textAlign: "center",
        }}
      >
        <h3
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#f1f5f9",
            margin: "0 0 8px",
          }}
        >
          Want the Full Playbook?
        </h3>
        <p
          style={{
            fontSize: 14,
            color: "#94a3b8",
            margin: "0 0 24px",
            maxWidth: 480,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.6,
          }}
        >
          Get a detailed conversion report with prioritized action items,
          copy rewrites, and a step-by-step improvement plan for your page.
        </p>

        {error && (
          <div
            style={{
              background: "#ef444420",
              border: "1px solid #ef4444",
              borderRadius: 8,
              padding: "10px 16px",
              marginBottom: 16,
              color: "#fca5a5",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading}
          style={{
            background: loading
              ? "#1e293b"
              : "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
            color: loading ? "#64748b" : "#0f172a",
            border: "none",
            borderRadius: 10,
            padding: "14px 40px",
            fontSize: 16,
            fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "transform 0.15s, box-shadow 0.15s",
            boxShadow: loading ? "none" : "0 4px 20px rgba(34,197,94,0.3)",
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow =
                "0 6px 24px rgba(34,197,94,0.45)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 4px 20px rgba(34,197,94,0.3)";
          }}
        >
          {loading ? (
            <span
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                style={{
                  animation: "spin 1s linear infinite",
                }}
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="3"
                  strokeDasharray="31.4 31.4"
                  strokeLinecap="round"
                />
              </svg>
              Processing…
            </span>
          ) : (
            "🔓 Unlock Full Report"
          )}
        </button>

        <p style={{ fontSize: 12, color: "#475569", marginTop: 12 }}>
          One-time payment · Instant delivery · Secure checkout via Stripe
        </p>
      </div>

      {/* Spinner keyframes — inject once */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ResultsPreview;
