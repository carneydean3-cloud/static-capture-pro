import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Zap,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { useAudit } from "@/contexts/AuditContext";

const defaultPillars = [
  { name: "Clarity", score: 70, fullMark: 100 },
  { name: "Hook", score: 50, fullMark: 100 },
  { name: "Trust", score: 40, fullMark: 100 },
  { name: "Desire", score: 60, fullMark: 100 },
  { name: "Action", score: 80, fullMark: 100 },
  { name: "Objections", score: 30, fullMark: 100 },
  { name: "AI Readiness", score: 45, fullMark: 100 },
];

const verdictColor: Record<string, string> = {
  Healthy: "text-score-green",
  "Needs Attention": "text-score-amber",
  Critical: "text-score-red",
};

const verdictBg: Record<string, string> = {
  Healthy: "bg-score-green/10 border-score-green/20",
  "Needs Attention": "bg-score-amber/10 border-score-amber/20",
  Critical: "bg-score-red/10 border-score-red/20",
};

const scoreColor = (score: number) => {
  if (score >= 70) return "text-score-green";
  if (score >= 40) return "text-score-amber";
  return "text-score-red";
};

const getImpactStyles = (impact: string) => {
  if (impact === "High")
    return {
      borderLeft: "4px solid #ef4444",
      badgeBg: "#ef4444",
      textColor: "#ef4444",
    };
  if (impact === "Medium")
    return {
      borderLeft: "4px solid #f59e0b",
      badgeBg: "#f59e0b",
      textColor: "#f59e0b",
    };
  return {
    borderLeft: "4px solid #94a3b8",
    badgeBg: "#94a3b8",
    textColor: "#94a3b8",
  };
};

const ResultsPreview = () => {
  const { stage, result, url, userEmail } = useAudit() as any;
  const hasRealResults = stage === "done" && result;
  const [highlight, setHighlight] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [auditsRemaining, setAuditsRemaining] = useState<number | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  useEffect(() => {
    if (stage === "done") {
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  useEffect(() => {
    if (!hasRealResults || subscriptionChecked) return;

    const email =
      userEmail || localStorage.getItem("conversiondoc_user_email") || "";
    if (!email) {
      setSubscriptionChecked(true);
      return;
    }

    const checkSubscription = async () => {
      setSubscriptionLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-subscription`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ email }),
          }
        );
        const data = await res.json();
        setIsSubscribed(data.subscribed === true);
        setSubscriptionPlan(data.plan || null);
        setAuditsRemaining(data.audits_remaining ?? null);
        setLimitReached(data.limit_reached === true);
      } catch (err) {
        console.error("Subscription check failed:", err);
        setIsSubscribed(false);
      } finally {
        setSubscriptionChecked(true);
        setSubscriptionLoading(false);
      }
    };

    checkSubscription();
  }, [hasRealResults, userEmail, subscriptionChecked]);

  // Build pillars from result — now includes ai_readiness as 7th pillar
  const pillars = hasRealResults
    ? [
        {
          name: "Clarity",
          score: (result?.scores?.clarity?.score || 0) * 10,
          fullMark: 100,
        },
        {
          name: "Hook",
          score: (result?.scores?.hook?.score || 0) * 10,
          fullMark: 100,
        },
        {
          name: "Trust",
          score: (result?.scores?.trust?.score || 0) * 10,
          fullMark: 100,
        },
        {
          name: "Desire",
          score: (result?.scores?.desire?.score || 0) * 10,
          fullMark: 100,
        },
        {
          name: "Action",
          score: (result?.scores?.action?.score || 0) * 10,
          fullMark: 100,
        },
        {
          name: "Objections",
          score: (result?.scores?.objections?.score || 0) * 10,
          fullMark: 100,
        },
        {
          name: "AI Readiness",
          score: (result?.scores?.ai_readiness?.score || 0) * 10,
          fullMark: 100,
        },
      ]
    : defaultPillars;

  const overallScore = hasRealResults ? result?.overall_score || 0 : 67;
  const verdict = hasRealResults
    ? result?.verdict || "Needs Attention"
    : "Needs Attention";

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const savedEmail = localStorage.getItem("conversiondoc_user_email") || "";
      const checkoutEmail = userEmail || savedEmail || "";
      if (!checkoutEmail) throw new Error("No email provided for checkout");

      const screenshotUrl =
        localStorage.getItem("conversiondoc_screenshot_url") ||
        result?.screenshot_url ||
        "";

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            userEmail: checkoutEmail,
            url: url || "",
            auditResult: { ...result, screenshot_url: screenshotUrl },
          }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Checkout failed (" + res.status + ")");
      }

      const data = await res.json();
      if (!data.url) throw new Error("No checkout URL returned");
      localStorage.removeItem("conversiondoc_screenshot_url");
      window.location.href = data.url;
    } catch (err: any) {
      console.error("Checkout error:", err);
      setCheckoutError(err.message || "Something went wrong. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleViewFullReport = async () => {
    try {
      const email =
        userEmail || localStorage.getItem("conversiondoc_user_email") || "";
      const screenshotUrl =
        localStorage.getItem("conversiondoc_screenshot_url") ||
        result?.screenshot_url ||
        "";

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            userEmail: email,
            url: url || "",
            auditResult: { ...result, screenshot_url: screenshotUrl },
            isSubscription: true,
          }),
        }
      );

      const data = await res.json();
      if (data.session_id) {
        window.location.href = `/paid-report?session_id=${data.session_id}`;
      }
    } catch (err) {
      console.error("Error saving audit for subscriber:", err);
    }
  };

  return (
    <section id="results" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {hasRealResults
              ? "Your Conversion Diagnosis"
              : "Conversion Diagnosis"}
          </h2>
          <p className="text-lg text-subheading">
            {hasRealResults
              ? "Here's exactly what's holding your page back."
              : "See exactly what's holding your page back — across all 7 pillars."}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={`glass-card p-10 relative overflow-hidden flex flex-col items-center transition-shadow duration-1000 ${
            highlight
              ? "ring-2 ring-primary shadow-[0_0_40px_rgba(20,184,166,0.3)]"
              : ""
          }`}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-score-amber to-score-red" />

          <div className="w-full flex items-center justify-between mb-10">
            <h3 className="text-xl font-bold">Conversion Radar</h3>
            <div className="text-xs font-bold uppercase tracking-widest text-caption">
              {hasRealResults ? "Your Audit" : "Example Audit"}
            </div>
          </div>

          {/* Radar chart — now shows 7 pillars */}
          <div className="w-full h-[340px] md:h-[420px] mb-6 px-4 md:px-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="65%"
                data={pillars}
              >
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis
                  dataKey="name"
                  tick={{
                    fill: "hsl(203 41% 79%)",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                  tickLine={false}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#14b8a6"
                  fill="#14b8a6"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {!hasRealResults && (
            <p className="text-xs text-caption font-medium mb-12">
              Example audit — your results will vary
            </p>
          )}

          {/* Score + verdict */}
          <div className="w-full grid md:grid-cols-2 gap-6 mb-8">
            <div
              className={`rounded-xl p-8 border text-center ${
                hasRealResults
                  ? verdictBg[verdict] || verdictBg["Needs Attention"]
                  : "bg-score-amber/10 border-score-amber/20"
              }`}
            >
              <div
                className={`text-4xl font-bold mb-2 ${scoreColor(overallScore)}`}
              >
                {overallScore}/100
              </div>
              <div className="text-sm font-bold uppercase tracking-widest text-caption">
                Conversion Score
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-8 border border-white/10 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                {verdict === "Healthy" ? (
                  <CheckCircle2 className="w-5 h-5 text-score-green" />
                ) : (
                  <AlertCircle
                    className={`w-5 h-5 ${
                      verdictColor[verdict] || "text-score-amber"
                    }`}
                  />
                )}
                <span
                  className={`font-bold ${
                    verdictColor[verdict] || "text-score-amber"
                  }`}
                >
                  {verdict}
                </span>
              </div>
              <p className="text-sm text-body leading-relaxed">
                {hasRealResults
                  ? "Your detailed diagnosis is below. Review the top fixes to boost conversions."
                  : "Significant improvements identified across trust architecture, objection handling, and AI search readiness."}
              </p>
            </div>
          </div>

          {/* AI Search Readiness callout — shown when we have real results */}
          {hasRealResults && result?.scores?.ai_readiness && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full mb-8 rounded-xl p-6"
              style={{
                background: "rgba(20,184,166,0.08)",
                border: "1px solid rgba(20,184,166,0.2)",
              }}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
                    AI Search Readiness
                  </p>
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`text-2xl font-bold ${scoreColor(
                        (result.scores.ai_readiness.score || 0) * 10
                      )}`}
                    >
                      {result.scores.ai_readiness.score || 0}/10
                    </span>
                    <span className="text-sm text-body">
                      — how well your page is structured for AI search engines
                    </span>
                  </div>
                  <p className="text-xs text-body leading-relaxed">
                    {result.scores.ai_readiness.issue ||
                      "AI search readiness assessment included in your full diagnosis."}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Top 3 fixes */}
          {hasRealResults && result?.top_3_fixes && (
            <div className="w-full mb-8">
              <h4 className="text-lg font-bold text-foreground mb-4">
                Top 3 Priority Fixes
              </h4>
              <div className="space-y-3">
                {result.top_3_fixes.map((fix: any, i: number) => {
                  const impact = fix.impact || "Medium";
                  const styles = getImpactStyles(impact);
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15 }}
                      className="glass-card p-5"
                      style={{ borderLeft: styles.borderLeft }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
                          style={{ backgroundColor: styles.badgeBg }}
                        >
                          {fix.priority ?? i + 1}
                        </div>
                        <div className="flex-1 min-w-0 space-y-3">
                          <div>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                color: "#94a3b8",
                              }}
                            >
                              Issue
                            </span>
                            <p
                              style={{
                                fontWeight: 600,
                                color: "#ffffff",
                                fontSize: "14px",
                                lineHeight: "1.4",
                                marginTop: "2px",
                              }}
                            >
                              {fix.issue}
                            </p>
                          </div>
                          <div>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                color: "#94a3b8",
                              }}
                            >
                              Impact
                            </span>
                            <p
                              style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: styles.textColor,
                                marginTop: "2px",
                              }}
                            >
                              {impact}
                            </p>
                          </div>
                          <div>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                color: "#14b8a6",
                              }}
                            >
                              Fix
                            </span>
                            <p
                              style={{
                                fontSize: "14px",
                                color: "#e2e8f0",
                                lineHeight: "1.6",
                                marginTop: "2px",
                              }}
                            >
                              {fix.fix}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full report section */}
          {hasRealResults && result?.scores && (
            <div className="w-full relative">

              {/* Subscriber — show full report button */}
              {subscriptionChecked && isSubscribed && !limitReached && (
                <div
                  className="mb-6 rounded-xl p-6 text-center"
                  style={{
                    background: "rgba(20,184,166,0.1)",
                    border: "1px solid rgba(20,184,166,0.3)",
                  }}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <span className="font-bold text-primary">
                      {subscriptionPlan === "agency_pro"
                        ? "Agency Pro"
                        : "Starter Pro"}{" "}
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-body mb-4">
                    {auditsRemaining === 999999
                      ? "Unlimited audits — view your full report below."
                      : `${auditsRemaining} full audit${
                          auditsRemaining === 1 ? "" : "s"
                        } remaining this month.`}
                  </p>
                  <button
                    type="button"
                    onClick={handleViewFullReport}
                    className="btn-primary flex items-center gap-2 mx-auto"
                  >
                    View Full Report <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Limit reached */}
              {subscriptionChecked && isSubscribed && limitReached && (
                <div
                  className="mb-6 rounded-xl p-6 text-center"
                  style={{
                    background: "rgba(245,158,11,0.1)",
                    border: "1px solid rgba(245,158,11,0.3)",
                  }}
                >
                  <p className="font-bold text-score-amber mb-2">
                    Monthly audit limit reached
                  </p>
                  <p className="text-sm text-body">
                    You've used all your audits for this month. Upgrade to
                    Agency Pro for unlimited audits, or wait until your plan
                    renews.
                  </p>
                </div>
              )}

              {/* Not subscribed — pay gate */}
              {subscriptionChecked && !isSubscribed && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 rounded-xl flex flex-col items-center justify-center px-4 text-center">
                  <Lock className="w-8 h-8 text-primary mb-3" />
                  <h4 className="font-bold text-lg mb-2">
                    Unlock Full Diagnosis
                  </h4>
                  <p className="text-sm text-body mb-4 text-center max-w-xs">
                    Get a detailed issue and fix for every pillar, including AI
                    search readiness — plus rewritten copy and your improved
                    homepage mockup.
                  </p>
                  {checkoutError && (
                    <p className="text-xs text-score-red mb-3">
                      {checkoutError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="btn-primary flex items-center gap-2 whitespace-nowrap text-sm md:text-base disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {checkoutLoading
                      ? "Processing..."
                      : "Get Full Diagnosis £149"}
                    {!checkoutLoading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {/* Subscription loading */}
              {!subscriptionChecked && subscriptionLoading && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 rounded-xl flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm text-body">Checking your account…</p>
                </div>
              )}

              {/* Pillar breakdown grid — now shows all 7 */}
              <div className="grid md:grid-cols-2 gap-4 p-4">
                {Object.entries(result.scores).map(
                  ([key, pillar]: any) => (
                    <div key={key} className="glass-card p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold capitalize text-foreground">
                          {key === "ai_readiness"
                            ? "AI Search Readiness"
                            : key}
                        </span>
                        <span
                          className={`font-bold ${scoreColor(
                            (pillar?.score || 0) * 10
                          )}`}
                        >
                          {pillar?.score || 0}/10
                        </span>
                      </div>
                      <p className="text-xs text-body">
                        {pillar?.issue || ""}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default ResultsPreview;
