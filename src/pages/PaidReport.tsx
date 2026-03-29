import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { supabase } from "../integrations/supabase/client";

type ScoreItem = {
  score?: number;
  issue?: string;
  fix?: string;
  verdict?: string;
  rewritten_copy?: string;
};

type TopFix = {
  priority?: number;
  impact?: string;
  issue?: string;
  fix?: string;
  page_region?: string;
};

type SummaryData = {
  strongest_pillar?: string;
  weakest_pillar?: string;
  biggest_opportunity?: string;
  executive_summary?: string;
};

type HomepageCopyPack = {
  headline?: string;
  subheadline?: string;
  primary_cta?: string;
  trust_line?: string;
  benefit_bullets?: string[];
  supporting_copy?: string;
};

type AuditData = {
  overall_score?: number;
  verdict?: string;
  top_3_fixes?: TopFix[];
  scores?: Record<string, ScoreItem>;
  mockup_html?: string;
  summary?: SummaryData;
  homepage_copy_pack?: HomepageCopyPack;
  pexels_hero_image?: string;
  screenshot_url?: string;
  logo_url?: string;
  brand_name?: string;
  primary_color?: string;
};

type PurchaseRow = {
  id: string;
  status: string;
  paid_at?: string | null;
  audit_data: AuditData | null;
  url?: string | null;
};

type VerifyPurchaseResponse =
  | { valid: true; purchase: PurchaseRow }
  | { valid: false; error?: string };

const prettyLabel = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const scoreColor = (score?: number) => {
  if (typeof score !== "number") return "text-slate-400";
  if (score >= 8) return "text-emerald-600";
  if (score >= 5) return "text-amber-500";
  return "text-red-500";
};

const regionToPosition: Record<string, { top: string; side: "left" | "right" }> = {
  hero: { top: "15%", side: "left" },
  nav: { top: "3%", side: "right" },
  cta: { top: "45%", side: "left" },
  trust: { top: "62%", side: "right" },
  below_fold: { top: "75%", side: "left" },
};

const impactColor: Record<string, string> = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#6b7280",
};

function AnnotatedBefore({
  screenshotUrl,
  siteUrl,
  topFixes,
}: {
  screenshotUrl: string | null;
  siteUrl: string | null;
  topFixes: TopFix[] | null;
}) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [showAnnotations, setShowAnnotations] = useState(true);

  const annotations = useMemo(() => {
    if (!topFixes) return [];
    return topFixes.slice(0, 3).map((fix, i) => {
      const region = fix.page_region || ["hero", "cta", "trust"][i];
      const pos = regionToPosition[region] || regionToPosition.hero;
      return { ...fix, ...pos };
    });
  }, [topFixes]);

  // No screenshot available at all
  if (!screenshotUrl) {
    return (
      <div className="bg-slate-50 p-6 min-h-[400px]">
        <FallbackAnnotations annotations={annotations} siteUrl={siteUrl} />
      </div>
    );
  }

  // Screenshot errored
  if (status === "error") {
    return (
      <div className="bg-slate-50 p-6 min-h-[400px]">
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 mb-6 flex items-start gap-3">
          <span className="text-amber-500 text-lg shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-1">Screenshot unavailable</p>
            <p className="text-xs text-amber-700">
              This site's security settings prevented a screenshot. The issues below are still accurate.
            </p>
          </div>
        </div>
        <FallbackAnnotations annotations={annotations} siteUrl={siteUrl} />
      </div>
    );
  }

  return (
    <div className="bg-slate-900">

      {/* Loading spinner — shown until image loads */}
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <div className="w-8 h-8 border-4 border-teal-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading screenshot…</p>
        </div>
      )}

      {/* Wrapper — always in DOM once we have a URL, opacity controlled */}
      <div
        style={{
          position: "relative",
          width: "100%",
          opacity: status === "loaded" ? 1 : 0,
          transition: "opacity 0.4s ease",
          minHeight: status === "loaded" ? undefined : 0,
          overflow: "hidden",
        }}
      >
        {/* Screenshot */}
        <img
          src={screenshotUrl}
          alt="Current page screenshot"
          style={{
            width: "100%",
            display: "block",
            maxHeight: "680px",
            objectFit: "cover",
            objectPosition: "top",
          }}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />

        {/* Dark overlay */}
        {status === "loaded" && showAnnotations && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.3)",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Toggle button */}
        {status === "loaded" && (
          <button
            onClick={() => setShowAnnotations((v) => !v)}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 30,
              background: "rgba(15,23,42,0.85)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 12px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
            }}
          >
            {showAnnotations ? "Hide Annotations" : "Show Annotations"}
          </button>
        )}

        {/* Annotation callouts */}
        {status === "loaded" && showAnnotations && annotations.map((ann, i) => {
          const color = impactColor[ann.impact || "Medium"] || "#f59e0b";
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: ann.top,
                [ann.side]: 16,
                zIndex: 20,
                maxWidth: 240,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              {/* Pulsing dot */}
              <div style={{ position: "relative", flexShrink: 0, marginTop: 4 }}>
                <div
                  style={{
                    position: "absolute",
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: color,
                    opacity: 0.5,
                    animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite",
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: color,
                  }}
                />
              </div>

              {/* Callout */}
              <div
                style={{
                  background: "rgba(2,6,23,0.93)",
                  border: `1.5px solid ${color}`,
                  borderRadius: 12,
                  padding: "10px 12px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  backdropFilter: "blur(10px)",
                  minWidth: 170,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>
                      {ann.priority ?? i + 1}
                    </span>
                  </div>
                  <span
                    style={{
                      color,
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {ann.impact} Impact
                  </span>
                </div>
                <p
                  style={{
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 600,
                    lineHeight: 1.4,
                    margin: "0 0 6px 0",
                  }}
                >
                  {ann.issue}
                </p>
                <p style={{ color: "#94a3b8", fontSize: 11, lineHeight: 1.4, margin: 0 }}>
                  <span style={{ color: "#2dd4bf", fontWeight: 600 }}>Fix: </span>
                  {ann.fix}
                </p>
              </div>
            </div>
          );
        })}

        {/* View live site */}
        {status === "loaded" && siteUrl && (
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              zIndex: 20,
              background: "rgba(0,0,0,0.65)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 600,
              padding: "6px 12px",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            View Live Site →
          </a>
        )}
      </div>

      {/* Ping animation keyframes */}
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function FallbackAnnotations({
  annotations,
  siteUrl,
}: {
  annotations: Array<TopFix & { top: string; side: "left" | "right" }>;
  siteUrl: string | null;
}) {
  return (
    <div>
      {siteUrl && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
              <span className="text-slate-400 text-lg">🌐</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Current Website</p>
              <p className="text-xs text-slate-400 truncate max-w-[240px]">{siteUrl}</p>
            </div>
          </div>
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 transition-colors"
          >
            View Current Site →
          </a>
        </div>
      )}
      {annotations.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
            Issues Identified on Current Site
          </p>
          {annotations.map((ann, i) => (
            <div
              key={i}
              className="rounded-2xl border bg-white p-5 flex gap-4"
              style={{ borderColor: `${impactColor[ann.impact || "Medium"]}30` }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ background: impactColor[ann.impact || "Medium"] }}
              >
                {ann.priority ?? i + 1}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: impactColor[ann.impact || "Medium"] }}
                  >
                    {ann.impact} Impact
                  </span>
                  {ann.page_region && (
                    <span className="text-xs text-slate-400 capitalize">
                      · {ann.page_region.replace("_", " ")} area
                    </span>
                  )}
                </div>
                <p className="font-semibold text-slate-900 mb-1">{ann.issue}</p>
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-teal-600">Fix: </span>
                  {ann.fix}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PaidReport() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchase, setPurchase] = useState<PurchaseRow | null>(null);
  const [activeTab, setActiveTab] = useState<"before" | "after">("before");
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingKit, setDownloadingKit] = useState(false);
  const mockupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!sessionId) throw new Error("Missing session_id in URL");
        const { data, error } = await supabase.functions.invoke<VerifyPurchaseResponse>(
          "verify-purchase",
          { method: "POST", body: { session_id: sessionId } }
        );
        if (error) throw new Error(error.message);
        if (!data) throw new Error("No response from verify-purchase");
        if (!data.valid) throw new Error(data.error || "Purchase not valid / not paid");
        if (cancelled) return;
        setPurchase(data.purchase);
        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        setError(String(e?.message || e));
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [sessionId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const auditData = purchase?.audit_data ?? null;
  const scores = auditData?.scores ?? {};
  const summary = auditData?.summary ?? {};
  const copyPack = auditData?.homepage_copy_pack ?? {};
  const mockupHtml = auditData?.mockup_html ?? null;

  const topFixes = useMemo(() => {
    const t3 = auditData?.top_3_fixes;
    if (Array.isArray(t3) && t3.length) {
      return [...t3].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
    }
    return null;
  }, [auditData]);

  const overallScore = useMemo(() => {
    if (typeof auditData?.overall_score === "number") return auditData.overall_score;
    const nums = Object.entries(scores)
      .map(([, v]) => v?.score)
      .filter((x): x is number => typeof x === "number");
    if (!nums.length) return null;
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    return avg <= 10 ? Math.round(avg * 10) : Math.round(avg);
  }, [auditData, scores]);

  const screenshotUrl = auditData?.screenshot_url ||
    (purchase?.url
      ? `https://image.thum.io/get/width/1400/crop/900/noanimate/${purchase.url}`
      : null);

  const handleCopyCode = async () => {
    if (!mockupHtml) return;
    try {
      await navigator.clipboard.writeText(mockupHtml);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch {
      setCopySuccess(false);
    }
  };

  const generateMockupPng = async () => {
    if (!mockupRef.current) throw new Error("Mockup not available");
    return await toPng(mockupRef.current, { cacheBust: true, skipFonts: true });
  };

  const handleDownloadPng = async () => {
    try {
      setDownloading(true);
      const dataUrl = await generateMockupPng();
      saveAs(dataUrl, "homepage-mockup.png");
    } catch (e) {
      console.error("PNG download failed:", e);
    } finally {
      setDownloading(false);
    }
  };

  const buildReadme = () => `# ConversionDoc Homepage Kit

This kit contains your improved homepage assets generated by ConversionDoc.

## Files included
- copy-pack.md
- implementation-notes.md
- homepage-mockup.html
- homepage-mockup.png

## How to use
1. Review the copy pack for your updated homepage messaging.
2. Open homepage-mockup.html in your browser to preview the improved direction.
3. Share with your developer or designer.
4. Apply the highest-impact changes first.

## Website audited
${purchase?.url || "N/A"}

## Generated by ConversionDoc
`;

  const buildCopyPack = () => {
    const bullets = Array.isArray(copyPack.benefit_bullets)
      ? copyPack.benefit_bullets.filter(Boolean)
      : [];
    return `# Homepage Copy Pack

## Hero Headline
${copyPack.headline || ""}

## Hero Subheadline
${copyPack.subheadline || ""}

## Primary CTA
${copyPack.primary_cta || ""}

## Trust Line
${copyPack.trust_line || ""}

## Benefit Bullets
${bullets.map((b) => `- ${b}`).join("\n")}

## Supporting Copy
${copyPack.supporting_copy || ""}
`;
  };

  const buildImplementationNotes = () => {
    const strongest = summary.strongest_pillar ? prettyLabel(summary.strongest_pillar) : "N/A";
    const weakest = summary.weakest_pillar ? prettyLabel(summary.weakest_pillar) : "N/A";
    return `# Implementation Notes

## Overall Score
${overallScore !== null ? `${overallScore}/100` : "N/A"}

## Verdict
${auditData?.verdict || "N/A"}

## Strongest Pillar
${strongest}

## Weakest Pillar
${weakest}

## Biggest Opportunity
${summary.biggest_opportunity || "N/A"}

## Executive Summary
${summary.executive_summary || "N/A"}

## Top 3 Priority Fixes
${(topFixes || [])
  .map((fix) => `### Priority ${fix.priority || "-"}
Issue: ${fix.issue || "N/A"}
Impact: ${fix.impact || "N/A"}
Fix: ${fix.fix || "N/A"}`)
  .join("\n\n")}
`;
  };

  const buildMockupHtmlFile = () => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Homepage Mockup — ConversionDoc</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;">
${mockupHtml || ""}
</body>
</html>`;

  const handleDownloadCopyPack = () => {
    const blob = new Blob([buildCopyPack()], { type: "text/markdown;charset=utf-8" });
    saveAs(blob, "copy-pack.md");
  };

  const handleDownloadKit = async () => {
    try {
      setDownloadingKit(true);
      const zip = new JSZip();
      zip.file("README.md", buildReadme());
      zip.file("copy-pack.md", buildCopyPack());
      zip.file("implementation-notes.md", buildImplementationNotes());
      zip.file("homepage-mockup.html", buildMockupHtmlFile());
      try {
        const pngDataUrl = await generateMockupPng();
        zip.file("homepage-mockup.png", pngDataUrl.split(",")[1], { base64: true });
      } catch (e) {
        console.error("Could not generate PNG for ZIP:", e);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, "conversiondoc-homepage-kit.zip");
    } catch (e) {
      console.error("Homepage kit download failed:", e);
    } finally {
      setDownloadingKit(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 font-medium">Loading your report…</p>
        </div>
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-[24px] border border-red-100 shadow-sm p-8 text-center space-y-4">
          <p className="text-4xl">⚠️</p>
          <h1 className="text-xl font-bold text-slate-900">Report unavailable</h1>
          <p className="text-slate-600 text-sm">{error || "Could not load your purchase."}</p>
          <a href="/" className="inline-block mt-4 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold px-5 py-3 transition-colors text-sm">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f8fc] px-6 py-16">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Header */}
        <section className="rounded-[32px] overflow-hidden border border-slate-900/10 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),_transparent_30%),linear-gradient(135deg,#020617,#0f172a_50%,#111827)] px-8 py-10 md:px-10 md:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-400">Full Diagnosis</p>
            <h1 className="mt-3 text-4xl md:text-5xl font-bold text-white tracking-tight">Conversion Report</h1>
            {auditData?.verdict && (
              <p className="mt-4 text-lg text-slate-300 italic max-w-3xl">"{auditData.verdict}"</p>
            )}
            {purchase.url && (
              <a href={purchase.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-teal-400 text-sm hover:underline">
                {purchase.url} →
              </a>
            )}
          </div>
        </section>

        {/* Executive Summary */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">Executive Summary</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Your strongest opportunity to improve conversions</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3 mb-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Overall Score</p>
              <p className={`mt-2 text-3xl font-bold ${
                overallScore !== null && overallScore >= 70 ? "text-emerald-600"
                : overallScore !== null && overallScore >= 50 ? "text-amber-500"
                : "text-red-500"
              }`}>
                {overallScore !== null ? `${overallScore}/100` : "N/A"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Strongest Pillar</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {summary.strongest_pillar ? prettyLabel(summary.strongest_pillar) : "N/A"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Weakest Pillar</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {summary.weakest_pillar ? prettyLabel(summary.weakest_pillar) : "N/A"}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-teal-100 bg-teal-50 p-5 mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 mb-2">Biggest Opportunity</p>
            <p className="text-slate-900 font-medium text-lg">{summary.biggest_opportunity || "No summary available."}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Diagnosis</p>
            <p className="text-slate-700 leading-8">{summary.executive_summary || "No executive summary available."}</p>
          </div>
        </section>

        {/* Top Fixes */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">Action Plan</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">🔥 Top Priority Fixes</h2>
          </div>
          {topFixes ? (
            <div className="space-y-4">
              {topFixes.map((x, idx) => (
                <div key={idx} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white text-sm font-bold shadow-sm">
                    {x.priority ?? idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Impact</span>
                      <span className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
                        x.impact === "High" ? "text-red-500"
                        : x.impact === "Medium" ? "text-amber-500"
                        : "text-slate-400"
                      }`}>
                        {x.impact ?? "—"}
                      </span>
                    </div>
                    {x.issue && <p className="font-semibold text-slate-900 text-lg mb-1">{x.issue}</p>}
                    <p className="text-slate-700">{x.fix}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600">No fixes available.</p>
          )}
        </section>

        {/* Score Breakdown */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">Full Analysis</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">📊 Score Breakdown</h2>
          </div>
          {Object.entries(scores).length === 0 ? (
            <p className="text-slate-600">No score data available.</p>
          ) : (
            <div className="space-y-5">
              {Object.entries(scores).map(([pillar, value]) => (
                <div key={pillar} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-slate-900">{prettyLabel(pillar)}</h3>
                    <span className={`text-xl font-bold ${scoreColor(value?.score)}`}>
                      {typeof value?.score === "number" ? `${value.score}/10` : "—"}
                    </span>
                  </div>
                  {value?.issue && (
                    <div className="mb-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-1">Issue</p>
                      <p className="text-slate-800">{value.issue}</p>
                    </div>
                  )}
                  {value?.fix && (
                    <div className="mb-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-1">Recommended Fix</p>
                      <p className="text-slate-800">{value.fix}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Copy Pack */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">Deliverable</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">✍️ Copy Pack</h2>
              <p className="text-slate-500 text-sm mt-2">Homepage-ready copy written to improve clarity, trust, and action.</p>
            </div>
            <button
              onClick={handleDownloadCopyPack}
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-5 py-3 transition-colors text-sm shadow-sm"
            >
              Download Copy Pack
            </button>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-teal-100 bg-teal-50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 mb-2">Headline</p>
              <p className="text-2xl font-semibold text-slate-900">{copyPack.headline || "N/A"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Subheadline</p>
              <p className="text-slate-800">{copyPack.subheadline || "N/A"}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Primary CTA</p>
                <p className="text-slate-900 font-medium">{copyPack.primary_cta || "N/A"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Trust Line</p>
                <p className="text-slate-900 font-medium">{copyPack.trust_line || "N/A"}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-3">Benefit Bullets</p>
              <ul className="space-y-3 text-slate-800">
                {(copyPack.benefit_bullets || []).map((bullet, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-teal-500 font-bold">✓</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
            {copyPack.supporting_copy && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Supporting Copy</p>
                <p className="text-slate-800">{copyPack.supporting_copy}</p>
              </div>
            )}
          </div>
        </section>

        {/* Visual Deliverable */}
        <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-[linear-gradient(135deg,#020617,#0f172a)] px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-400">Visual Deliverable</p>
            <h2 className="mt-2 text-2xl font-bold text-white">🎨 Your Homepage Mockup</h2>
            <p className="text-slate-400 text-sm mt-2">
              See exactly what's wrong with your current site — and what it could look like improved.
            </p>
          </div>

          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab("before")}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                activeTab === "before"
                  ? "bg-white text-red-500 border-b-2 border-red-500"
                  : "bg-slate-50 text-slate-500 hover:text-slate-700"
              }`}
            >
              ❌ Before — Annotated Issues
            </button>
            <button
              onClick={() => setActiveTab("after")}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                activeTab === "after"
                  ? "bg-white text-teal-600 border-b-2 border-teal-500"
                  : "bg-slate-50 text-slate-500 hover:text-slate-700"
              }`}
            >
              ✅ After — Improved Direction
            </button>
          </div>

          {activeTab === "before" && (
            <AnnotatedBefore
              screenshotUrl={screenshotUrl}
              siteUrl={purchase.url || null}
              topFixes={topFixes}
            />
          )}

          {activeTab === "after" && mockupHtml && (
            <div className="relative bg-white">
              <div
                ref={mockupRef}
                className="w-full overflow-hidden"
                dangerouslySetInnerHTML={{ __html: mockupHtml }}
              />
              <button
                onClick={() => setFullscreen(true)}
                className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              >
                ⛶ Fullscreen
              </button>
            </div>
          )}

          {activeTab === "after" && !mockupHtml && (
            <div className="flex items-center justify-center min-h-[400px] bg-slate-50">
              <p className="text-slate-400">Mockup not available</p>
            </div>
          )}

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-3">
            {mockupHtml && (
              <>
                <button
                  onClick={handleCopyCode}
                  className="rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold px-5 py-3 transition-colors text-sm shadow-sm"
                >
                  {copySuccess ? "✓ Copied!" : "Copy HTML"}
                </button>
                <button
                  onClick={handleDownloadPng}
                  disabled={downloading}
                  className="rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold px-5 py-3 transition-colors text-sm shadow-sm disabled:opacity-50"
                >
                  {downloading ? "Generating…" : "Download PNG"}
                </button>
                <button
                  onClick={handleDownloadKit}
                  disabled={downloadingKit}
                  className="rounded-xl bg-slate-900 hover:bg-black text-white font-semibold px-5 py-3 transition-colors text-sm shadow-sm disabled:opacity-50"
                >
                  {downloadingKit ? "Building Kit…" : "Download Homepage Kit (.zip)"}
                </button>
              </>
            )}
            {purchase.url && (
              <a
                href={purchase.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold px-5 py-3 transition-colors text-sm shadow-sm"
              >
                View Current Site →
              </a>
            )}
          </div>
        </section>

        {/* Next Step */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600 mb-2">Next Step</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Keep improving your conversions over time</h2>
          <p className="text-slate-600 mb-6 max-w-3xl leading-7">
            Join the Conversion Dashboard to rescan pages, track changes, and monitor improvements over time.
            If you'd rather have help implementing these recommendations, get in touch.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="/dashboard" className="rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold px-5 py-3 transition-colors text-sm shadow-sm">
              Join the Dashboard
            </a>
            <a
              href="mailto:hello@conversiondoc.co.uk?subject=Implementation Support Request"
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-5 py-3 transition-colors text-sm shadow-sm"
            >
              Contact for Implementation Help
            </a>
          </div>
        </section>

      </div>

      {/* Fullscreen overlay */}
      {fullscreen && mockupHtml && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          onClick={() => setFullscreen(false)}
        >
          <div
            className="flex items-center justify-between px-6 py-4 bg-slate-950 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-white font-semibold">✅ Improved Direction</p>
            <button
              onClick={() => setFullscreen(false)}
              className="text-slate-400 hover:text-white text-2xl leading-none"
            >
              ✕
            </button>
          </div>
          <div
            className="flex-1 overflow-auto bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div dangerouslySetInnerHTML={{ __html: mockupHtml }} />
          </div>
        </div>
      )}
    </div>
  );
}
