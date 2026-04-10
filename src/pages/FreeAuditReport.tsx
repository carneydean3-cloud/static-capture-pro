import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";

type TopFix = {
  priority?: number;
  impact?: string;
  issue?: string;
  fix?: string;
  page_region?: string;
};

type ScoreItem = {
  score?: number;
  issue?: string;
  fix?: string;
  rewritten_copy?: string;
};

type AuditRow = {
  id: string;
  email: string;
  url: string;
  overall_score?: number | null;
  verdict?: string | null;
  top_3_fixes?: TopFix[] | null;
  full_results?: {
    top_3_fixes?: TopFix[];
    scores?: Record<string, ScoreItem>;
    summary?: {
      biggest_opportunity?: string;
      executive_summary?: string;
    };
  } | null;
  tier?: string | null;
};

const impactColor: Record<string, string> = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#6b7280",
};

const impactBg: Record<string, string> = {
  High: "rgba(239,68,68,0.08)",
  Medium: "rgba(245,158,11,0.08)",
  Low: "rgba(107,114,128,0.08)",
};

const scoreColor = (score?: number | null) => {
  if (typeof score !== "number") return "text-slate-400";
  if (score >= 70) return "text-emerald-600";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
};

const prettyLabel = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// GEO-related pillar key fragments to match against
const GEO_PILLAR_KEYS = [
  "ai_search",
  "ai_readiness",
  "geo",
  "search_readiness",
  "ai_search_readiness",
];

const isGeoPillar = (key: string) =>
  GEO_PILLAR_KEYS.some((fragment) => key.toLowerCase().includes(fragment));

export default function FreeAuditReport() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isGeoFocus = searchParams.get("focus") === "geo";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [audit, setAudit] = useState<AuditRow | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) throw new Error("Missing audit ID");

        const { data, error } = await supabase
          .from("audits")
          .select("id, email, url, overall_score, verdict, top_3_fixes, full_results, tier")
          .eq("id", id)
          .single();

        if (error || !data) throw new Error("Audit not found");

        setAudit(data as AuditRow);
      } catch (e: any) {
        setError(e?.message || "Could not load audit");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const topFixes = useMemo(() => {
    const direct = audit?.top_3_fixes;
    if (Array.isArray(direct) && direct.length) {
      return [...direct].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
    }

    const nested = audit?.full_results?.top_3_fixes;
    if (Array.isArray(nested) && nested.length) {
      return [...nested].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
    }

    return [];
  }, [audit]);

  const scores = audit?.full_results?.scores ?? {};
  const summary = audit?.full_results?.summary ?? {};

  // Reorder scores based on focus
  const orderedScores = useMemo(() => {
    const entries = Object.entries(scores);
    if (!isGeoFocus) return entries.slice(0, 3);

    const geoEntries = entries.filter(([key]) => isGeoPillar(key));
    const otherEntries = entries.filter(([key]) => !isGeoPillar(key));
    return [...geoEntries, ...otherEntries].slice(0, 3);
  }, [scores, isGeoFocus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 font-medium">Loading your audit…</p>
        </div>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-[24px] border border-red-100 shadow-sm p-8 text-center space-y-4">
          <p className="text-4xl">⚠️</p>
          <h1 className="text-xl font-bold text-slate-900">Audit unavailable</h1>
          <p className="text-slate-600 text-sm">{error || "Could not load this audit."}</p>
          <a
            href="/"
            className="inline-block mt-4 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold px-5 py-3 transition-colors text-sm"
          >
            Back to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f8fc] px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-8">
        <a
          href={isGeoFocus ? "/geo-audit" : "/"}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
        >
          ← Back to {isGeoFocus ? "GEO Audit" : "home"}
        </a>

        {/* Header */}
        <section className="rounded-[32px] overflow-hidden border border-slate-900/10 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),_transparent_30%),linear-gradient(135deg,#020617,#0f172a_50%,#111827)] px-8 py-10 md:px-10 md:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-400">
              {isGeoFocus ? "GEO Audit" : "Free Audit"}
            </p>
            <h1 className="mt-3 text-4xl md:text-5xl font-bold text-white tracking-tight">
              {isGeoFocus ? "Your AI Search Readiness Audit" : "Your Conversion Audit"}
            </h1>
            {audit.verdict && (
              <p className="mt-4 text-lg text-slate-300 italic max-w-3xl">
                "{audit.verdict}"
              </p>
            )}
            {audit.url && (
              <a
                href={audit.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-teal-400 text-sm hover:underline"
              >
                {audit.url} →
              </a>
            )}
          </div>
        </section>

        {/* Score + summary */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-500">
                {isGeoFocus ? "GEO Readiness Score" : "Overall Score"}
              </p>
              <p className={`mt-3 text-5xl font-bold ${scoreColor(audit.overall_score)}`}>
                {typeof audit.overall_score === "number" ? `${audit.overall_score}/100` : "N/A"}
              </p>
            </div>

            <div className="rounded-2xl border border-teal-100 bg-teal-50 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 mb-2">
                {isGeoFocus ? "Biggest GEO Opportunity" : "Biggest Opportunity"}
              </p>
              <p className="text-slate-900 font-medium text-lg">
                {summary.biggest_opportunity || audit.verdict || "Your page has clear opportunities to improve."}
              </p>
            </div>
          </div>

          {summary.executive_summary && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">
                Diagnosis
              </p>
              <p className="text-slate-700 leading-8">{summary.executive_summary}</p>
            </div>
          )}
        </section>

        {/* Top 3 fixes */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
              Action Plan
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              {isGeoFocus
                ? "Your 3 biggest AI visibility gaps"
                : "Your 3 biggest conversion leaks"}
            </h2>
          </div>

          <div className="space-y-4">
            {topFixes.length > 0 ? (
              topFixes.map((fix, idx) => {
                const color = impactColor[fix.impact || "Medium"] || "#f59e0b";
                const bg = impactBg[fix.impact || "Medium"] || impactBg["Medium"];

                return (
                  <div
                    key={idx}
                    className="flex gap-4 rounded-2xl border p-5"
                    style={{
                      borderColor: `${color}25`,
                      borderLeftWidth: 4,
                      borderLeftColor: color,
                      background: bg,
                    }}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold shadow-sm"
                      style={{ background: color }}
                    >
                      {fix.priority ?? idx + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                          style={{ color, background: `${color}15`, borderColor: `${color}30` }}
                        >
                          {fix.impact ?? "Medium"} Impact
                        </span>
                      </div>

                      {fix.issue && (
                        <p className="font-semibold text-slate-900 mb-1">{fix.issue}</p>
                      )}

                      {fix.fix && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-teal-500 font-bold text-sm shrink-0">→</span>
                          <p className="text-sm text-slate-700">{fix.fix}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-600">
                No priority fixes available for this audit.
              </div>
            )}
          </div>
        </section>

        {/* Score preview */}
        {orderedScores.length > 0 && (
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
                Preview
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {isGeoFocus ? "AI Search Readiness Snapshot" : "Breakdown Snapshot"}
              </h2>
              <p className="mt-2 text-slate-600">
                {isGeoFocus
                  ? "Here's a preview of your AI search readiness across key GEO dimensions."
                  : "Here's a preview of your performance across a few key conversion pillars."}
              </p>
            </div>

            <div className="space-y-5">
              {orderedScores.map(([pillar, value]) => (
                <div key={pillar} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold text-slate-900">{prettyLabel(pillar)}</h3>
                    <span className={scoreColor(value?.score)}>
                      {typeof value?.score === "number" ? `${value.score}/10` : "—"}
                    </span>
                  </div>
                  {value?.issue && <p className="text-slate-700 text-sm">{value.issue}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Upgrade CTA */}
        <section className="rounded-[28px] overflow-hidden border border-slate-900/10 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
          <div className="bg-[linear-gradient(135deg,#020617,#0f172a_50%,#111827)] px-8 py-10 md:px-10 md:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-400">
              {isGeoFocus ? "Want the full GEO diagnosis?" : "Want the full diagnosis?"}
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold text-white tracking-tight max-w-3xl">
              {isGeoFocus
                ? "Unlock every AI visibility issue, rewritten content, and your full GEO prescription."
                : "Unlock every issue, rewritten copy, and your improved homepage mockup."}
            </h2>
            <p className="mt-4 text-slate-300 max-w-2xl leading-7">
              {isGeoFocus
                ? "The free GEO audit shows where AI search cannot find you. The Full Diagnosis shows exactly how to fix it."
                : "The free audit shows where you're leaking conversions. The Full Diagnosis shows exactly how to fix it."}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/pricing"
                className="inline-flex items-center rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold px-6 py-3 transition-colors text-sm shadow-sm"
              >
                Get Full Diagnosis — £149
              </a>
              <a
                href={isGeoFocus ? "/geo-audit" : "/"}
                className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold px-6 py-3 transition-colors text-sm shadow-sm"
              >
                {isGeoFocus ? "Run another GEO audit" : "Run another audit"}
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
