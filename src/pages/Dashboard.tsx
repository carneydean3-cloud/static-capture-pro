import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";

type SubscriptionData = {
  plan: string;
  audits_remaining: number;
  limit_reached: boolean;
};

type AuditHistoryItem = {
  id: string;
  url: string;
  overall_score: number;
  verdict: string;
  stripe_session_id: string | null;
  status: string;
  created_at: string;
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [userEmail, setUserEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [subError, setSubError] = useState("");

  const [url, setUrl] = useState("");
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");
  const [auditStep, setAuditStep] = useState("");

  const [history, setHistory] = useState<AuditHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        navigate("/login");
        return;
      }
      const email = session.user.email;
      setUserEmail(email);
      setAuthLoading(false);
      checkSubscription(email);
      loadHistory(email);
    };
    checkAuth();
  }, [navigate]);

  const checkSubscription = async (email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-subscription", {
        method: "POST",
        body: { email },
      });
      if (error || !data?.subscribed) {
        setSubError("No active subscription found for this email.");
        return;
      }
      setSubscription({
        plan: data.plan,
        audits_remaining: data.audits_remaining,
        limit_reached: data.limit_reached,
      });
    } catch (e: any) {
      setSubError("Could not verify subscription.");
    }
  };

  const loadHistory = async (email: string) => {
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from("purchases")
        .select("id, url, audit_data, stripe_session_id, status, created_at")
        .eq("email", email)
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        url: row.url,
        overall_score: row.audit_data?.overall_score ?? null,
        verdict: row.audit_data?.verdict ?? "",
        stripe_session_id: row.stripe_session_id,
        status: row.status,
        created_at: row.created_at,
      }));
      setHistory(mapped);
    } catch (e) {
      console.error("History load error:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || auditLoading) return;

    const cleanUrl = url.startsWith("http") ? url : `https://${url}`;

    setAuditLoading(true);
    setAuditError("");
    setAuditStep("Fetching page…");

    try {
      // Step 1: Run the audit
      setAuditStep("Analysing your page with AI…");
      const { data: auditResult, error: auditErr } = await supabase.functions.invoke("run-audit", {
        method: "POST",
        body: { url: cleanUrl },
      });

      if (auditErr || !auditResult) {
        throw new Error(auditErr?.message || "Audit failed");
      }

      setAuditStep("Generating full diagnosis…");

      // Step 2: Generate full diagnosis
      const { data: fullData, error: fullErr } = await supabase.functions.invoke("generate-full-diagnosis", {
        method: "POST",
        body: { auditData: auditResult, url: cleanUrl },
      });

      const finalAuditData = fullErr ? auditResult : { ...auditResult, ...fullData };

      setAuditStep("Saving report…");

      // Step 3: Save to purchases table
      const { data: purchase, error: saveErr } = await supabase
        .from("purchases")
        .insert({
          url: cleanUrl,
          email: userEmail,
          audit_data: finalAuditData,
          status: "paid",
          stripe_session_id: null,
        })
        .select("id")
        .single();

      if (saveErr || !purchase) {
        throw new Error("Could not save report");
      }

      // Step 4: Navigate to the report
      navigate(`/report/${purchase.id}`);

    } catch (err: any) {
      console.error("Audit error:", err);
      setAuditError(err?.message || "Something went wrong. Please try again.");
      setAuditLoading(false);
      setAuditStep("");
    }
  };

  const planLabel: Record<string, string> = {
    starter_pro: "Starter Pro",
    agency_pro: "Agency Pro",
  };

  const scoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-600";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 font-medium">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f8fc]">

      {/* Nav */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-900">ConversionDoc</span>
            <span className="text-teal-500 text-xl">⚡</span>
          </a>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:block">{userEmail}</span>
            {subscription && (
              <span className="text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1 rounded-full">
                {planLabel[subscription.plan] || subscription.plan}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* Subscription error */}
        {subError && (
          <div className="rounded-[20px] bg-red-50 border border-red-200 p-6 text-center">
            <p className="text-red-600 font-medium mb-2">{subError}</p>
            <a href="/#pricing" className="text-sm text-teal-600 hover:underline font-medium">
              View subscription plans →
            </a>
          </div>
        )}

        {/* Subscription status bar */}
        {subscription && (
          <div className="rounded-[20px] bg-white border border-slate-200 shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
                Your Plan
              </p>
              <p className="text-lg font-bold text-slate-900">
                {planLabel[subscription.plan] || subscription.plan}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
                Audits Remaining
              </p>
              <p className={`text-2xl font-bold ${subscription.limit_reached ? "text-red-500" : "text-teal-600"}`}>
                {subscription.audits_remaining >= 999999 ? "Unlimited" : subscription.audits_remaining}
              </p>
            </div>
            {subscription.limit_reached && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2">
                <p className="text-amber-700 text-sm font-medium">Monthly limit reached</p>
              </div>
            )}
          </div>
        )}

        {/* Run audit */}
        {subscription && !subscription.limit_reached && (
          <div className="rounded-[28px] bg-white border border-slate-200 shadow-sm p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600 mb-2">
              New Audit
            </p>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Run a full audit
            </h2>

            <form onSubmit={handleRunAudit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Website URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  disabled={auditLoading}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              {auditError && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                  <p className="text-red-600 text-sm">{auditError}</p>
                </div>
              )}

              {auditLoading && (
                <div className="rounded-xl bg-teal-50 border border-teal-100 px-4 py-3 flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <p className="text-teal-700 text-sm font-medium">{auditStep}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={auditLoading || !url}
                className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm shadow-sm"
              >
                {auditLoading ? "Running audit…" : "Run Full Audit →"}
              </button>
            </form>
          </div>
        )}

        {/* Audit history */}
        <div className="rounded-[28px] bg-white border border-slate-200 shadow-sm p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600 mb-2">
            History
          </p>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Previous Audits
          </h2>

          {historyLoading ? (
            <div className="flex items-center gap-3 text-slate-400">
              <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading history…</span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-slate-500 text-sm">No audits yet. Run your first one above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 hover:bg-slate-100 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 text-sm truncate mb-1">
                      {item.url}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(item.created_at)}</p>
                    {item.verdict && (
                      <p className="text-xs text-slate-500 mt-1 truncate">"{item.verdict}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {item.overall_score && (
                      <div className="text-center">
                        <p className={`text-xl font-bold ${scoreColor(item.overall_score)}`}>
                          {item.overall_score}
                        </p>
                        <p className="text-xs text-slate-400">/100</p>
                      </div>
                    )}
                    <a
                      href={`/report/${item.id}`}
                      className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      View →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
