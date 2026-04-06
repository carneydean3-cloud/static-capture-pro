import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { supabase } from "../integrations/supabase/client";

type ScoreItem = {
  score?: number;
  issue?: string;
  fix?: string;
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
  mockup_html_b?: string;
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
  audit_data: AuditData | null;
  url?: string | null;
  email?: string | null;
};

const prettyLabel = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const scoreColor = (score?: number) => {
  if (typeof score !== "number") return "text-slate-400";
  if (score >= 8) return "text-emerald-600";
  if (score >= 5) return "text-amber-500";
  return "text-red-500";
};

const impactColor: Record<string, string> = {
  High: "#ef4444", Medium: "#f59e0b", Low: "#6b7280",
};

const impactBg: Record<string, string> = {
  High: "rgba(239,68,68,0.08)", Medium: "rgba(245,158,11,0.08)", Low: "rgba(107,114,128,0.08)",
};

export default function ReportById() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchase, setPurchase] = useState<PurchaseRow | null>(null);
  const [activeTab, setActiveTab] = useState<"before" | "after">("before");
  const [mockupVersion, setMockupVersion] = useState<"a" | "b">("a");
  const [fullscreen, setFullscreen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingKit, setDownloadingKit] = useState(false);
  const [screenshotLoaded, setScreenshotLoaded] = useState(false);
  const [screenshotErrored, setScreenshotErrored] = useState(false);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);

  const mockupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Check auth
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.email) {
          navigate("/login");
          return;
        }

        if (!id) throw new Error("Missing report ID");

        const { data, error } = await supabase
          .from("purchases")
          .select("id, status, audit_data, url, email")
          .eq("id", id)
          .eq("email", session.user.email)
          .single();

        if (error || !data) throw new Error("Report not found");
        setPurchase(data as PurchaseRow);
        setLoading(false);
      } catch (e: any) {
        setError(e?.message || "Could not load report");
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const auditData = purchase?.audit_data ?? null;
  const scores = auditData?.scores ?? {};
  const summary = auditData?.summary ?? {};
  const copyPack = auditData?.homepage_copy_pack ?? {};
  const mockupHtml = auditData?.mockup_html ?? null;
  const mockupHtmlB = auditData?.mockup_html_b ?? null;
  const activeMockupHtml = mockupVersion === "a" ? mockupHtml : (mockupHtmlB || mockupHtml);

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

  const screenshotUrl = purchase?.url
    ? `https://image.thum.io/get/width/1400/crop/900/noanimate/${purchase.url}`
    : null;

  useEffect(() => {
    if (!screenshotUrl || screenshotLoaded || screenshotErrored) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          setScreenshotDataUrl(canvas.toDataURL("image/jpeg", 0.85));
        }
      } catch { setScreenshotDataUrl(screenshotUrl); }
      setScreenshotLoaded(true);
    };
    img.onerror = () => setScreenshotErrored(true);
    img.src = screenshotUrl;
  }, [screenshotUrl]);

  const displayScreenshotUrl = screenshotDataUrl || screenshotUrl;

  const handleCopyCode = async () => {
    if (!activeMockupHtml) return;
    try {
      await navigator.clipboard.writeText(activeMockupHtml);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch { setCopySuccess(false); }
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
    } catch (e) { console.error(e); }
    finally { setDownloading(false); }
  };

  const buildCopyPack = () => {
    const bullets = Array.isArray(copyPack.benefit_bullets) ? copyPack.benefit_bullets.filter(Boolean) : [];
    return `# Homepage Copy Pack\n\n## Headline\n${copyPack.headline || ""}\n\n## Subheadline\n${copyPack.subheadline || ""}\n\n## Primary CTA\n${copyPack.primary_cta || ""}\n\n## Trust Line\n${copyPack.trust_line || ""}\n\n## Benefit Bullets\n${bullets.map(b => `- ${b}`).join("\n")}\n\n## Supporting Copy\n${copyPack.supporting_copy || ""}`;
  };

  const buildMockupHtmlFile = () => `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Homepage Mockup — ConversionDoc</title></head><body style="margin:0;padding:0;background:#f8fafc;">${activeMockupHtml || ""}</body></html>`;

  const handleDownloadKit = async () => {
    try {
      setDownloadingKit(true);
      const zip = new JSZip();
      zip.file("copy-pack.md", buildCopyPack());
      zip.file("homepage-mockup.html", buildMockupHtmlFile());
      try {
        const png = await generateMockupPng();
        zip.file("homepage-mockup.png", png.split(",")[1], { base64: true });
      } catch (e) { console.error(e); }
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, "conversiondoc-homepage-kit.zip");
    } catch (e) { console.error(e); }
    finally { setDownloadingKit(false); }
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
          <p className="text-slate-600 text-sm">{error || "Could not load this report."}</p>
          <a href="/dashboard" className="inline-block mt-4 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold px-5 py-3 transition-colors text-sm">
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f8fc] px-6 py-16">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Back link */}
        <a href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">
          ← Back to Dashboard
        </a>

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
              <p className={`mt-2 text-3xl font-bold ${overallScore !== null && overallScore >= 70 ? "text-emerald-600" : overallScore !== null && overallScore >= 50 ? "text-amber-500" : "text-red-500"}`}>
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
          {summary.biggest_opportunity && (
            <div className="rounded-2xl border border-teal-100 bg-teal-50 p-5 mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 mb-2">Biggest Opportunity</p>
              <p className="text-slate-900 font-medium text-lg">{summary.biggest_opportunity}</p>
            </div>
          )}
          {summary.executive_summary && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Diagnosis</p>
              <p className="text-slate-700 leading-8">{summary.executive_summary}</p>
            </div>
          )}
        </section>

        {/* Top Fixes */}
        {topFixes && (
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">Action Plan</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">🔥 Top Priority Fixes</h2>
            </div>
            <div className="space-y-4">
              {topFixes.map((x, idx) => {
                const color = impactColor[x.impact || "Medium"] || "#f59e0b";
                const bg = impactBg[x.impact || "Medium"] || impactBg["Medium"];
                return (
                  <div key={idx} className="flex gap-4 rounded-2xl border p-5"
                    style={{ borderColor: `${color}25`, borderLeftWidth: 4, borderLeftColor: color, background: bg }}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold shadow-sm"
                      style={{ background: color }}>
                      {x.priority ?? idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                          style={{ color, background: `${color}15`, borderColor: `${color}30` }}>
                          {x.impact ?? "—"} Impact
                        </span>
                      </div>
                      {x.issue && <p className="font-semibold text-slate-900 mb-1">{x.issue}</p>}
                      <div className="flex items-start gap-1.5">
                        <span className="text-teal-500 font-bold text-sm shrink-0">→</span>
                        <p className="text-sm text-slate-700">{x.fix}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Score Breakdown */}
        {Object.entries(scores).length > 0 && (
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">Full Analysis</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">📊 Score Breakdown</h2>
            </div>
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
          </section>
        )}

        {/* Copy Pack */}
        {copyPack.headline && (
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">Deliverable</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">✍️ Copy Pack</h2>
              </div>
              <button onClick={() => saveAs(new Blob([buildCopyPack()], { type: "text/markdown" }), "copy-pack.md")}
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-5 py-3 transition-colors text-sm shadow-sm">
                Download Copy Pack
              </button>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-teal-100 bg-teal-50 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 mb-2">Headline</p>
                <p className="text-2xl font-semibold text-slate-900">{copyPack.headline}</p>
              </div>
              {copyPack.subheadline && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Subheadline</p>
                  <p className="text-slate-800">{copyPack.subheadline}</p>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {copyPack.primary_cta && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Primary CTA</p>
                    <p className="text-slate-900 font-medium">{copyPack.primary_cta}</p>
                  </div>
                )}
                {copyPack.trust_line && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Trust Line</p>
                    <p className="text-slate-900 font-medium">{copyPack.trust_line}</p>
                  </div>
                )}
              </div>
              {copyPack.benefit_bullets && copyPack.benefit_bullets.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-3">Benefit Bullets</p>
                  <ul className="space-y-3 text-slate-800">
                    {copyPack.benefit_bullets.map((bullet, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-teal-500 font-bold">✓</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Visual Deliverable */}
        {mockupHtml && (
          <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-[linear-gradient(135deg,#020617,#0f172a)] px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-400">Visual Deliverable</p>
              <h2 className="mt-2 text-2xl font-bold text-white">🎨 Your Homepage Mockup</h2>
              <p className="text-slate-400 text-sm mt-2">Compare your current site with a more conversion-focused direction.</p>
            </div>

            <div className="flex border-b border-slate-200">
              <button onClick={() => setActiveTab("before")}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === "before" ? "bg-white text-red-500 border-b-2 border-red-500" : "bg-slate-50 text-slate-500 hover:text-slate-700"}`}>
                ❌ Before (Current Site)
              </button>
              <button onClick={() => setActiveTab("after")}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === "after" ? "bg-white text-teal-600 border-b-2 border-teal-500" : "bg-slate-50 text-slate-500 hover:text-slate-700"}`}>
                ✅ After (ConversionDoc Fix)
              </button>
            </div>

            {/* BEFORE */}
            <div style={{ display: activeTab === "before" ? "block" : "none" }}>
              {displayScreenshotUrl && (
                <div style={{ background: "#0f172a", position: "relative" }}>
                  {!screenshotLoaded && !screenshotErrored && (
                    <div style={{ minHeight: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "4px solid #2dd4bf", borderTopColor: "transparent", animation: "cdSpin 0.8s linear infinite" }} />
                      <p style={{ color: "#94a3b8", fontSize: 14, fontWeight: 500, margin: 0 }}>Loading screenshot…</p>
                    </div>
                  )}
                  {screenshotLoaded && (
                    <div style={{ position: "relative", width: "100%" }}>
                      <img src={displayScreenshotUrl} alt="Current site" style={{ width: "100%", display: "block", maxHeight: 600, objectFit: "cover", objectPosition: "top" }} />
                      {purchase.url && (
                        <a href={purchase.url} target="_blank" rel="noopener noreferrer"
                          style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "6px 12px", borderRadius: 8, textDecoration: "none", border: "1px solid rgba(255,255,255,0.15)" }}>
                          View Live Site →
                        </a>
                      )}
                    </div>
                  )}
                  <style>{`@keyframes cdSpin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}
              {topFixes && topFixes.length > 0 && (
                <div className="p-6 bg-slate-50 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Issues Identified on Current Site</p>
                  {topFixes.map((fix, i) => {
                    const color = impactColor[fix.impact || "Medium"] || "#f59e0b";
                    const bg = impactBg[fix.impact || "Medium"] || impactBg["Medium"];
                    return (
                      <div key={i} className="rounded-2xl border bg-white p-5 flex gap-4"
                        style={{ borderColor: `${color}30`, borderLeftWidth: 4, borderLeftColor: color }}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: color }}>
                          {fix.priority ?? i + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                              style={{ color, background: bg, borderColor: `${color}30` }}>
                              {fix.impact} Impact
                            </span>
                          </div>
                          <p className="font-semibold text-slate-900 text-sm mb-1">{fix.issue}</p>
                          <div className="flex items-start gap-1.5">
                            <span className="text-teal-500 text-xs font-bold shrink-0 mt-0.5">→</span>
                            <p className="text-xs text-slate-600">{fix.fix}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AFTER */}
            <div style={{ display: activeTab === "after" ? "block" : "none" }}>
              <div className="bg-white">
                <div className="flex items-center gap-2 px-6 pt-4 pb-0 bg-slate-50 border-b border-slate-100">
                  <button onClick={() => setMockupVersion("a")}
                    className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors border-b-2 -mb-px ${mockupVersion === "a" ? "bg-white text-teal-600 border-teal-500 shadow-sm" : "bg-transparent text-slate-500 border-transparent hover:text-slate-700"}`}>
                    ★ Version A
                  </button>
                  {mockupHtmlB && (
                    <button onClick={() => setMockupVersion("b")}
                      className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors border-b-2 -mb-px ${mockupVersion === "b" ? "bg-white text-teal-600 border-teal-500 shadow-sm" : "bg-transparent text-slate-500 border-transparent hover:text-slate-700"}`}>
                      Version B
                    </button>
                  )}
                  <span className="ml-auto text-xs text-slate-400 pb-2">
                    {mockupVersion === "a" ? "Recommended layout" : "Alternative layout"}
                  </span>
                </div>
                <div className="relative">
                  <div ref={mockupRef} className="w-full overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: activeMockupHtml || "" }} />
                  <button onClick={() => setFullscreen(true)}
                    className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
                    ⛶ Fullscreen
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-3">
              <button onClick={handleCopyCode}
                className="rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold px-5 py-3 transition-colors text-sm shadow-sm">
                {copySuccess ? "✓ Copied!" : "Copy HTML"}
              </button>
              <button onClick={handleDownloadPng} disabled={downloading}
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold px-5 py-3 transition-colors text-sm shadow-sm disabled:opacity-50">
                {downloading ? "Generating…" : "Download PNG"}
              </button>
              <button onClick={handleDownloadKit} disabled={downloadingKit}
                className="rounded-xl bg-slate-900 hover:bg-black text-white font-semibold px-5 py-3 transition-colors text-sm shadow-sm disabled:opacity-50">
                {downloadingKit ? "Building Kit…" : "Download Homepage Kit (.zip)"}
              </button>
              {purchase.url && (
                <a href={purchase.url} target="_blank" rel="noopener noreferrer"
                  className="rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold px-5 py-3 transition-colors text-sm shadow-sm">
                  View Current Site →
                </a>
              )}
            </div>
          </section>
        )}

        {/* Next Step */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600 mb-2">Next Step</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Need help implementing these recommendations?</h2>
          <p className="text-slate-600 mb-6 max-w-3xl leading-7">
            If you'd like expert help putting these fixes into action — from copy rewrites to full page redesigns — we're here to help.
          </p>
          <a href="mailto:hello@conversiondoc.co.uk?subject=Implementation Help Request"
            className="rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold px-5 py-3 transition-colors text-sm shadow-sm">
            Get in Touch
          </a>
        </section>

      </div>

      {/* Fullscreen */}
      {fullscreen && activeMockupHtml && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={() => setFullscreen(false)}>
          <div className="flex items-center justify-between px-6 py-4 bg-slate-950 shrink-0" onClick={(e) => e.stopPropagation()}>
            <p className="text-white font-semibold">✅ Improved Direction — {mockupVersion === "a" ? "Version A" : "Version B"}</p>
            <button onClick={() => setFullscreen(false)} className="text-slate-400 hover:text-white text-2xl leading-none">✕</button>
          </div>
          <div className="flex-1 overflow-auto bg-white" onClick={(e) => e.stopPropagation()}>
            <div dangerouslySetInnerHTML={{ __html: activeMockupHtml }} />
          </div>
        </div>
      )}
    </div>
  );
}
