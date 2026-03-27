import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

type AuditData = {
  overall_score?: number;
  verdict?: string;
  top_3_fixes?: TopFix[];
  top_fixes?: string[];
  fixes?: string[];
  scores?: Record<string, ScoreItem>;
  mockup_html?: string;
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
  if (typeof score !== "number") return "text-gray-400";
  if (score >= 8) return "text-emerald-600";
  if (score >= 5) return "text-amber-500";
  return "text-red-500";
};

export default function PaidReport() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchase, setPurchase] = useState<PurchaseRow | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const mockupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (!sessionId) throw new Error("Missing session_id in URL");

        const { data, error } = await supabase.functions.invoke<VerifyPurchaseResponse>(
          "verify-purchase",
          {
            method: "POST",
            body: { session_id: sessionId },
          }
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

  const auditData = purchase?.audit_data ?? null;
  const scores = auditData?.scores ?? {};
  const scoreEntries = useMemo(() => Object.entries(scores), [scores]);

  const topFixes = useMemo(() => {
    const t3 = auditData?.top_3_fixes;
    if (Array.isArray(t3) && t3.length) {
      return [...t3].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
    }
    return null;
  }, [auditData]);

  const topFixStrings = useMemo(() => {
    if (topFixes) return null;
    if (Array.isArray(auditData?.top_fixes) && auditData.top_fixes.length) return auditData.top_fixes;
    if (Array.isArray(auditData?.fixes) && auditData.fixes.length) return auditData.fixes;
    return scoreEntries
      .map(([pillar, value]) => ({ pillar, fix: value?.fix || "" }))
      .filter((item) => item.fix)
      .slice(0, 3)
      .map((item) => `${prettyLabel(item.pillar)}: ${item.fix}`);
  }, [auditData, scoreEntries, topFixes]);

  const overallScore = useMemo(() => {
    if (typeof auditData?.overall_score === "number") return auditData.overall_score;
    const nums = scoreEntries
      .map(([, v]) => v?.score)
      .filter((x): x is number => typeof x === "number");
    if (!nums.length) return null;
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    return avg <= 10 ? Math.round(avg * 10) : Math.round(avg);
  }, [auditData, scoreEntries]);

  const rewrittenCopyEntries = useMemo(() => {
    return scoreEntries.filter(([, v]) => v?.rewritten_copy);
  }, [scoreEntries]);

  const mockupHtml = auditData?.mockup_html ?? null;

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

  const handleDownloadPng = async () => {
    if (!mockupRef.current) return;
    try {
      setDownloading(true);
      const { toPng } = await import("https://esm.sh/html-to-image@1.11.11");
      const dataUrl = await toPng(mockupRef.current, { cacheBust: true });
      const link = document.createElement("a");
      link.download = "conversion-mockup.png";
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("PNG download failed:", e);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-100 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-4 bg-gray-100 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div className="min-h-screen bg-white px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Report unavailable</h1>
          <p className="text-gray-600">{error || "Something went wrong."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* Header */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-600">
            Full Diagnosis
          </p>
          <h1 className="mt-2 text-4xl font-bold text-gray-900">Conversion Report</h1>
          {auditData?.verdict && (
            <p className="mt-3 text-lg text-gray-600 italic">"{auditData.verdict}"</p>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Payment Status</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900 capitalize">
              {purchase.status}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Overall Score</p>
            <p className={`mt-2 text-2xl font-semibold ${overallScore !== null && overallScore >= 70 ? "text-emerald-600" : overallScore !== null && overallScore >= 50 ? "text-amber-500" : "text-red-500"}`}>
              {overallScore !== null ? `${overallScore}/100` : "N/A"}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">URL Audited</p>
            <p className="mt-2 text-sm font-medium text-gray-900 break-all">
              {purchase.url || "Not available"}
            </p>
          </div>
        </div>

        {/* Top Fixes */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900 mb-5">
            🔥 Top Priority Fixes
          </h2>

          {topFixes ? (
            <div className="space-y-4">
              {topFixes.map((x, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white text-sm font-bold">
                    {x.priority ?? idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Impact:
                      </span>
                      <span className={`text-xs font-bold uppercase ${x.impact === "High" ? "text-red-500" : x.impact === "Medium" ? "text-amber-500" : "text-gray-400"}`}>
                        {x.impact ?? "—"}
                      </span>
                    </div>
                    {x.issue && (
                      <p className="font-semibold text-gray-900 mb-1">{x.issue}</p>
                    )}
                    <p className="text-gray-700">{x.fix}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : topFixStrings && topFixStrings.length ? (
            <ul className="space-y-3">
              {topFixStrings.map((fix, index) => (
                <li key={index} className="rounded-xl bg-gray-50 p-4 text-gray-800">
                  {fix}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No fixes available.</p>
          )}
        </div>

        {/* Score Breakdown */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            📊 Score Breakdown
          </h2>

          {scoreEntries.length === 0 ? (
            <p className="text-gray-600">No score data available.</p>
          ) : (
            <div className="space-y-5">
              {scoreEntries.map(([pillar, value]) => (
                <div
                  key={pillar}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {prettyLabel(pillar)}
                    </h3>
                    <span className={`text-lg font-bold ${scoreColor(value?.score)}`}>
                      {typeof value?.score === "number" ? `${value.score}/10` : "—"}
                    </span>
                  </div>

                  {value?.issue && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Issue</p>
                      <p className="text-gray-800">{value.issue}</p>
                    </div>
                  )}

                  {value?.fix && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Recommended Fix</p>
                      <p className="text-gray-800">{value.fix}</p>
                    </div>
                  )}

                  {value?.verdict && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Verdict</p>
                      <p className="text-gray-800">{value.verdict}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rewritten Copy */}
        {rewrittenCopyEntries.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              ✍️ Rewritten Copy
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Ready-to-use copy for each section of your page — written by AI using proven conversion principles.
            </p>

            <div className="space-y-4">
              {rewrittenCopyEntries.map(([pillar, value]) => (
                <div
                  key={pillar}
                  className="rounded-xl border border-teal-100 bg-teal-50 p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-600 mb-2">
                    {prettyLabel(pillar)}
                  </p>
                  <p className="text-gray-900 font-medium text-lg leading-snug">
                    "{value.rewritten_copy}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Before vs After Mockup */}
        {mockupHtml && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              🎨 Your "After" Mockup
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              This is what your hero section could look like with the recommended fixes applied. Copy the code and paste it into your site.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Before */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-500 mb-3">
                  ❌ Before (Current)
                </p>
                <div className="rounded-xl border-2 border-red-100 bg-red-50 p-6 text-center text-gray-400 text-sm min-h-[200px] flex items-center justify-center">
                  {purchase.url ? (
                    <img
                      src={`https://image.thum.io/get/width/600/crop/400/${purchase.url}`}
                      alt="Current page screenshot"
                      className="rounded-lg w-full object-cover opacity-80"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <p>Screenshot not available</p>
                  )}
                </div>
              </div>

              {/* After */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-600 mb-3">
                  ✅ After (ConversionDoc Fix)
                </p>
                <div
                  ref={mockupRef}
                  className="rounded-xl border-2 border-teal-100 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: mockupHtml }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold px-5 py-3 transition-colors"
              >
                {copySuccess ? "✓ Copied!" : "Copy HTML Code"}
              </button>

              <button
                onClick={handleDownloadPng}
                disabled={downloading}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-5 py-3 transition-colors disabled:opacity-50"
              >
                {downloading ? "Generating..." : "Download as PNG"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
