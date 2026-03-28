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

function buildHeroVisualHtml(screenshotUrl?: string | null) {
  return `
    <div style="position:relative;width:100%;height:100%;min-height:320px;border-radius:20px;overflow:hidden;background:#0f172a;border:1px solid rgba(255,255,255,0.10);box-shadow:0 24px 48px rgba(0,0,0,0.22);">
      ${
        screenshotUrl
          ? `<img src="${screenshotUrl}" alt="Site visual" style="width:100%;height:100%;object-fit:cover;object-position:center top;display:block;transform:scale(1.04);filter:brightness(0.72) saturate(1.05);" />`
          : ""
      }
      <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(2,6,23,0.10), rgba(2,6,23,0.42));"></div>
      <div style="position:absolute;left:18px;top:18px;background:rgba(15,23,42,0.72);backdrop-filter:blur(8px);color:white;padding:8px 12px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;border:1px solid rgba(255,255,255,0.10);">
        Improved visual direction
      </div>
      <div style="position:absolute;left:18px;bottom:18px;background:rgba(255,255,255,0.08);backdrop-filter:blur(12px);color:white;padding:12px 14px;border-radius:14px;font-size:12px;line-height:1.45;max-width:240px;border:1px solid rgba(255,255,255,0.10);">
        More focused layout, clearer hierarchy, and stronger visual framing.
      </div>
    </div>
  `;
}

function injectHeroVisualSlot(mockupHtml: string, screenshotUrl?: string | null) {
  if (!mockupHtml) return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(mockupHtml, "text/html");
  const visualHtml = buildHeroVisualHtml(screenshotUrl);

  // 1) Replace explicit placeholder text nodes anywhere
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const textNodesToReplace: Text[] = [];

  let currentNode = walker.nextNode();
  while (currentNode) {
    const textNode = currentNode as Text;
    if (textNode.textContent?.includes("HERO_VISUAL_SLOT")) {
      textNodesToReplace.push(textNode);
    }
    currentNode = walker.nextNode();
  }

  textNodesToReplace.forEach((textNode) => {
    const wrapper = doc.createElement("div");
    wrapper.innerHTML = visualHtml;
    textNode.parentNode?.replaceChild(wrapper.firstElementChild!, textNode);
  });

  // 2) Replace any elements whose innerHTML/text still contains the token
  const allElements = Array.from(doc.body.querySelectorAll("*"));
  allElements.forEach((el) => {
    const html = el.innerHTML || "";
    const text = el.textContent || "";

    if (html.includes("HERO_VISUAL_SLOT") || text.includes("HERO_VISUAL_SLOT")) {
      const wrapper = doc.createElement("div");
      wrapper.innerHTML = visualHtml;
      el.replaceWith(wrapper.firstElementChild!);
    }
  });

  // 3) Fallback: if nothing was replaced, inject into any dedicated slot container if present
  const explicitSlot = doc.body.querySelector("#conversiondoc-hero-visual");
  if (explicitSlot) {
    explicitSlot.outerHTML = visualHtml;
  }

  return doc.body.innerHTML;
}

export default function PaidReport() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchase, setPurchase] = useState<PurchaseRow | null>(null);
  const [activeTab, setActiveTab] = useState<"before" | "after">("before");
  const [fullscreen, setFullscreen] = useState<"before" | "after" | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingKit, setDownloadingKit] = useState(false);
  const [screenshotError, setScreenshotError] = useState(false);
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
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const auditData = purchase?.audit_data ?? null;
  const scores = auditData?.scores ?? {};
  const summary = auditData?.summary ?? {};
  const copyPack = auditData?.homepage_copy_pack ?? {};
  const rawMockupHtml = auditData?.mockup_html ?? null;

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
    ? `https://image.thum.io/get/width/1400/crop/1200/${purchase.url}`
    : null;

  const mockupHtml = useMemo(() => {
    if (!rawMockupHtml) return null;
    return injectHeroVisualSlot(rawMockupHtml, screenshotUrl);
  }, [rawMockupHtml, screenshotUrl]);

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
    return await toPng(mockupRef.current, {
      cacheBust: true,
      skipFonts: true,
    });
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

  const buildReadme = () => {
    return `# ConversionDoc Homepage Kit

This kit contains your improved homepage assets generated by ConversionDoc.

## Files included
- copy-pack.md
- implementation-notes.md
- homepage-mockup.html
- homepage-mockup.png

## How to use this
1. Review the copy pack for your updated homepage messaging.
2. Open homepage-mockup.html in your browser to preview the improved homepage.
3. Share the HTML, PNG, and implementation notes with your developer, freelancer, or web designer.
4. Use the implementation notes to apply the highest-impact changes first.

## Website audited
${purchase?.url || "N/A"}

## Generated by
ConversionDoc
`;
  };

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
    const strongest = summary.strongest_pillar
      ? prettyLabel(summary.strongest_pillar)
      : "N/A";
    const weakest = summary.weakest_pillar
      ? prettyLabel(summary.weakest_pillar)
      : "N/A";

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
  .map(
    (fix) =>
      `### Priority ${fix.priority || "-"}
Issue: ${fix.issue || "N/A"}
Impact: ${fix.impact || "N/A"}
Fix: ${fix.fix || "N/A"}`
  )
  .join("\n\n")}
`;
  };

  const buildMockupHtmlFile = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Homepage Mockup</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;">
${mockupHtml || ""}
</body>
</html>`;
  };

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
        const base64 = pngDataUrl.split(",")[1];
        zip.file("homepage-mockup.png", base64, { base64: true });
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

  return (
    <div className="min-h-screen bg-[#f5f8fc] px-6 py-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[32px] overflow-hidden border border-slate-900/10 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),_transparent_30%),linear-gradient(135deg,#020617,#0f172a_50%,#111827)] px-8 py-10 md:px-10 md:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-400">
              Full Diagnosis
            </p>
            <h1 className="mt-3 text-4xl md:text-5xl font-bold text-white tracking-tight">
              Conversion Report
            </h1>
            {auditData?.verdict && (
              <p className="mt-4 text-lg text-slate-300 italic max-w-3xl">
                "{auditData.verdict}"
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
              Executive Summary
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Your strongest opportunity to improve conversions
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3 mb-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Overall Score</p>
              <p className={`mt-2 text-3xl font-bold ${
                overallScore !== null && overallScore >= 70
                  ? "text-emerald-600"
                  : overallScore !== null && overallScore >= 50
                    ? "text-amber-500"
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 mb-2">
              Biggest Opportunity
            </p>
            <p className="text-slate-900 font-medium text-lg">
              {summary.biggest_opportunity || "No summary available."}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">
              Diagnosis
            </p>
            <p className="text-slate-700 leading-8">
              {summary.executive_summary || "No executive summary available."}
            </p>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
              Action Plan
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              🔥 Top Priority Fixes
            </h2>
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
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Impact
                      </span>
                      <span className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
                        x.impact === "High"
                          ? "text-red-500"
                          : x.impact === "Medium"
                            ? "text-amber-500"
                            : "text-slate-400"
                      }`}>
                        {x.impact ?? "—"}
                      </span>
                    </div>
                    {x.issue && (
                      <p className="font-semibold text-slate-900 text-lg mb-1">{x.issue}</p>
                    )}
                    <p className="text-slate-700">{x.fix}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600">No fixes available.</p>
          )}
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
              Full Analysis
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              📊 Score Breakdown
            </h2>
          </div>

          {Object.entries(scores).length === 0 ? (
            <p className="text-slate-600">No score data available.</p>
          ) : (
            <div className="space-y-5">
              {Object.entries(scores).map(([pillar, value]) => (
                <div
                  key={pillar}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-slate-900">
                      {prettyLabel(pillar)}
                    </h3>
                    <span className={`text-xl font-bold ${scoreColor(value?.score)}`}>
                      {typeof value?.score === "number" ? `${value.score}/10` : "—"}
                    </span>
                  </div>

                  {value?.issue && (
                    <div className="mb-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-1">
                        Issue
                      </p>
                      <p className="text-slate-800">{value.issue}</p>
                    </div>
                  )}

                  {value?.fix && (
                    <div className="mb-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-1">
                        Recommended Fix
                      </p>
                      <p className="text-slate-800">{value.fix}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
                Deliverable
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">✍️ Copy Pack</h2>
              <p className="text-slate-500 text-sm mt-2">
                Homepage-ready copy written to improve clarity, trust, and action.
              </p>
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 mb-2">
                Headline
              </p>
              <p className="text-2xl font-semibold text-slate-900">
                {copyPack.headline || "N/A"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">
                Subheadline
              </p>
              <p className="text-slate-800">{copyPack.subheadline || "N/A"}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">
                  Primary CTA
                </p>
                <p className="text-slate-900 font-medium">{copyPack.primary_cta || "N/A"}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">
                  Trust Line
                </p>
                <p className="text-slate-900 font-medium">{copyPack.trust_line || "N/A"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-3">
                Benefit Bullets
              </p>
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
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">
                  Supporting Copy
                </p>
                <p className="text-slate-800">{copyPack.supporting_copy}</p>
              </div>
            )}
          </div>
        </section>

        {mockupHtml && (
          <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-[linear-gradient(135deg,#020617,#0f172a)] px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-400">
                Visual Deliverable
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">🎨 Your Homepage Mockup</h2>
              <p className="text-slate-400 text-sm mt-2">
                Compare your current homepage with a more conversion-focused direction.
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
                ❌ Before (Current Site)
              </button>
              <button
                onClick={() => setActiveTab("after")}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                  activeTab === "after"
                    ? "bg-white text-teal-600 border-b-2 border-teal-500"
                    : "bg-slate-50 text-slate-500 hover:text-slate-700"
                }`}
              >
                ✅ After (ConversionDoc Fix)
              </button>
            </div>

            <div className="relative">
              {activeTab === "before" && (
                <div className="relative bg-slate-100">
                  {screenshotUrl && !screenshotError ? (
                    <img
                      src={screenshotUrl}
                      alt="Current page screenshot"
                      className="w-full object-cover object-top"
                      style={{ minHeight: "460px" }}
                      onError={() => setScreenshotError(true)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-[460px] text-center p-8">
                      <p className="text-slate-400 font-medium text-lg mb-2">Screenshot unavailable</p>
                      <a
                        href={purchase.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-600 text-sm underline"
                      >
                        View current site →
                      </a>
                    </div>
                  )}
                  <button
                    onClick={() => setFullscreen("before")}
                    className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                  >
                    ⛶ Fullscreen
                  </button>
                </div>
              )}

              {activeTab === "after" && (
                <div className="relative bg-white">
                  <div
                    ref={mockupRef}
                    className="w-full overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: mockupHtml }}
                  />
                  <button
                    onClick={() => setFullscreen("after")}
                    className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                  >
                    ⛶ Fullscreen
                  </button>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-3">
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
                {downloading ? "Generating..." : "Download PNG"}
              </button>

              <button
                onClick={handleDownloadKit}
                disabled={downloadingKit}
                className="rounded-xl bg-slate-900 hover:bg-black text-white font-semibold px-5 py-3 transition-colors text-sm shadow-sm disabled:opacity-50"
              >
                {downloadingKit ? "Building Kit..." : "Download Homepage Kit (.zip)"}
              </button>

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
        )}

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600 mb-2">
            Next Step
          </p>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Keep improving your conversions over time
          </h2>
          <p className="text-slate-600 mb-6 max-w-3xl leading-7">
            Join the Conversion Dashboard to rescan pages, track changes, and monitor improvements over time.
            If you'd rather have help implementing these recommendations, get in touch about implementation support.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="/dashboard"
              className="rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold px-5 py-3 transition-colors text-sm shadow-sm"
            >
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

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          onClick={() => setFullscreen(null)}
        >
          <div
            className="flex items-center justify-between px-6 py-4 bg-slate-950 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-white font-semibold">
              {fullscreen === "before" ? "❌ Current Site" : "✅ ConversionDoc Fix"}
            </p>
            <button
              onClick={() => setFullscreen(null)}
              className="text-slate-400 hover:text-white text-2xl leading-none"
            >
              ✕
            </button>
          </div>

          <div
            className="flex-1 overflow-auto bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {fullscreen === "before" ? (
              screenshotUrl && !screenshotError ? (
                <img
                  src={screenshotUrl}
                  alt="Current page"
                  className="w-full"
                  onError={() => setScreenshotError(true)}
                />
              ) : (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  <p className="text-slate-400">Screenshot unavailable</p>
                </div>
              )
            ) : (
              <div dangerouslySetInnerHTML={{ __html: mockupHtml || "" }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
