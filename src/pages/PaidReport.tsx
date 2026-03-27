import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";

type ScoreItem = {
  score?: number;
  issue?: string;
  fix?: string;
  verdict?: string;
};

type AuditData = {
  overall_score?: number;
  verdict?: string;
  top_fixes?: string[];
  fixes?: string[];
  scores?: Record<string, ScoreItem>;
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

export default function PaidReport() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchase, setPurchase] = useState<PurchaseRow | null>(null);

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

        if (!data.valid) {
          throw new Error(data.error || "Purchase not valid / not paid");
        }

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

  const auditData = purchase?.audit_data || null;
  const scores = auditData?.scores || {};
  const scoreEntries = useMemo(() => Object.entries(scores), [scores]);

  const derivedTopFixes = useMemo(() => {
    if (Array.isArray(auditData?.top_fixes) && auditData.top_fixes.length) return auditData.top_fixes;
    if (Array.isArray(auditData?.fixes) && auditData.fixes.length) return auditData.fixes;

    return scoreEntries
      .map(([pillar, value]) => ({ pillar, fix: value?.fix || "" }))
      .filter((item) => item.fix)
      .slice(0, 3)
      .map((item) => `${prettyLabel(item.pillar)}: ${item.fix}`);
  }, [auditData, scoreEntries]);

  const derivedOverallScore = useMemo(() => {
    if (typeof auditData?.overall_score === "number") return auditData.overall_score;

    const numericScores = scoreEntries
      .map(([, value]) => value?.score)
      .filter((score): score is number => typeof score === "number");

    if (!numericScores.length) return null;

    return Math.round(
      numericScores.reduce((sum, score) => sum + score, 0) / numericScores.length
    );
  }, [auditData, scoreEntries]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-gray-900">Loading report...</h1>
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
    <div className="min-h-screen bg-white px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">
            Full Diagnosis
          </p>
          <h1 className="mt-2 text-4xl font-bold text-gray-900">Conversion Report</h1>
          <p className="mt-3 text-gray-600">
            Review the full breakdown of your landing page audit.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-10">
          <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-500">Payment Status</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900 capitalize">
              {purchase.status}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-500">Overall Score</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {derivedOverallScore !== null ? `${derivedOverallScore}/100` : "N/A"}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-500">URL</p>
            <p className="mt-2 text-sm font-medium text-gray-900 break-all">
              {purchase.url || "Not available"}
            </p>
          </div>
        </div>

        {derivedTopFixes.length > 0 && (
          <div className="mb-10 rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Top Fixes</h2>
            <ul className="space-y-3">
              {derivedTopFixes.map((fix, index) => (
                <li key={index} className="rounded-xl bg-gray-50 p-4 text-gray-800">
                  {fix}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Score Breakdown</h2>

          {scoreEntries.length === 0 ? (
            <p className="text-gray-600">No score data available.</p>
          ) : (
            <div className="space-y-6">
              {scoreEntries.map(([pillar, value]) => (
                <div
                  key={pillar}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {prettyLabel(pillar)}
                    </h3>
                    <span className="text-sm font-medium text-gray-700">
                      {typeof value?.score === "number" ? `${value.score}/100` : "No score"}
                    </span>
                  </div>

                  {value?.issue && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-500 mb-1">Issue</p>
                      <p className="text-gray-800">{value.issue}</p>
                    </div>
                  )}

                  {value?.fix && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Recommended Fix
                      </p>
                      <p className="text-gray-800">{value.fix}</p>
                    </div>
                  )}

                  {value?.verdict && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Verdict</p>
                      <p className="text-gray-800">{value.verdict}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
