import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { AlertCircle, CheckCircle2, Lock, ArrowRight } from "lucide-react";
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

const impactConfig: Record<string, { color: string; bg: string; label: string }> = {
  High: {
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    label: "High Impact",
  },
  Medium: {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    label: "Medium Impact",
  },
  Low: {
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.12)",
    label: "Low Impact",
  },
};

const ResultsPreview = () => {
  const { stage, result, url, userEmail } = useAudit() as any;
  const hasRealResults = stage === "done" && result;
  const [highlight, setHighlight] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (stage === "done") {
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  const pillars = hasRealResults
    ? [
        { name: "Clarity", score: (result?.scores?.clarity?.score || 0) * 10, fullMark: 100 },
        { name: "Hook", score: (result?.scores?.hook?.score || 0) * 10, fullMark: 100 },
        { name: "Trust", score: (result?.scores?.trust?.score || 0) * 10, fullMark: 100 },
        { name: "Desire", score: (result?.scores?.desire?.score || 0) * 10, fullMark: 100 },
        { name: "Action", score: (result?.scores?.action?.score || 0) * 10, fullMark: 100 },
        { name: "Objections", score: (result?.scores?.objections?.score || 0) * 10, fullMark: 100 },
      ]
    : defaultPillars;

  const overallScore = hasRealResults ? (result?.overall_score || 0) : 67;
  const verdict = hasRealResults ? (result?.verdict || "Needs Attention") : "Needs Attention";

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const savedEmail = localStorage.getItem("conversiondoc_user_email") || "";
      const checkoutEmail = userEmail || savedEmail || "";
      if (!checkoutEmail) throw new Error("No email provided for checkout");

      const screenshotUrl = localStorage.getItem("conversiondoc_screenshot_url") ||
        result?.screenshot_url || "";

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
            {hasRealResults ? "Your Conversion Diagnosis" : "Conversion Diagnosis"}
          </h2>
          <p className="text-lg text-subheading">
            {hasRealResults
              ? "Here's exactly what's holding your page back."
              : "See exactly what's holding your page back."}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={`glass-card p-10 relative overflow-hidden flex flex-col items-center transition-shadow duration-1000 ${
            highlight ? "ring-2 ring-primary shadow-[0_0_40px_rgba(20,184,166,0.3)]" : ""
          }`}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-score-amber to-score-red" />

          <div className="w-full flex items-center justify-between mb-10">
            <h3 className="text-xl font-bold">Conversion Radar</h3>
            <div className="text-xs font-bold uppercase tracking-widest text-caption">
              {hasRealResults ? "Your Audit" : "Example Audit"}
            </div>
          </div>

          <div className="w-full h-[340px] md:h-[420px] mb-6 px-4 md:px-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={pillars}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis
                  dataKey="name"
                  tick={{ fill: "hsl(203 41% 79%)", fontSize: 13, fontWeight: 600 }}
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

          <div className="w-full grid md:grid-cols-2 gap-6 mb-8">
            <div className={`rounded-xl p-8 border text-center ${
              hasRealResults
                ? verdictBg[verdict] || verdictBg["Needs Attention"]
                : "bg-score-amber/10 border-score-amber/20"
            }`}>
              <div className={`text-4xl font-bold mb-2 ${scoreColor(overallScore)}`}>
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
                  <AlertCircle className={`w-5 h-5 ${verdictColor[verdict] || "text-score-amber"}`} />
                )}
                <span className={`font-bold ${verdictColor[verdict] || "text-score-amber"}`}>
                  {verdict}
                </span>
              </div>
              <p className="text-sm text-body leading-relaxed">
                {hasRealResults
                  ? "Your detailed diagnosis is below. Review the top fixes to boost conversions."
                  : "Significant improvements identified across your trust architecture and objection handling."}
              </p>
            </div>
          </div>

          {/* TOP 3 FIXES — fully inline styles to bypass glass-card overrides */}
          {hasRealResults && result?.top_3_fixes && (
            <div className="w-full mb-8">
              <h4 className="text-lg font-bold text-foreground mb-4">Top 3 Priority Fixes</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {result.top_3_fixes.map((fix: any, i: number) => {
                  const impact = fix.impact || "Medium";
                  const cfg = impactConfig[impact] || impactConfig["Medium"];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15 }}
                      style={{
                        background: cfg.bg,
                        border: `1px solid ${cfg.color}40`,
                        borderLeft: `4px solid ${cfg.color}`,
                        borderRadius: 16,
                        padding: "16px 20px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 14,
                      }}
                    >
                      {/* Priority circle */}
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: cfg.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontWeight: 700,
                        fontSize: 14,
                        color: "#fff",
                      }}>
                        {fix.priority ?? i + 1}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Impact pill */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <span style={{
                            display: "inline-block",
                            background: cfg.color,
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            padding: "2px 8px",
                            borderRadius: 999,
                          }}>
                            {cfg.label}
                          </span>
                          {fix.page_region && (
                            <span style={{ color: "#94a3b8", fontSize: 10 }}>
                              · {fix.page_region.replace("_", " ")}
                            </span>
                          )}
                        </div>

                        {/* Issue */}
                        <p style={{
                          color: "#f1f5f9",
                          fontSize: 14,
                          fontWeight: 600,
                          lineHeight: 1.4,
                          margin: "0 0 8px 0",
                        }}>
                          {fix.issue}
                        </p>

                        {/* Fix */}
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                          <span style={{ color: "#2dd4bf", fontWeight: 700, fontSize: 12, flexShrink: 0, marginTop: 1 }}>→</span>
                          <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                            {fix.fix}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {hasRealResults && result?.scores && (
            <div className="w-full relative">
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 rounded-xl flex flex-col items-center justify-center px-4 text-center">
                <Lock className="w-8 h-8 text-primary mb-3" />
                <h4 className="font-bold text-lg mb-2">Unlock Full Diagnosis</h4>
                <p className="text-sm text-body mb-4 text-center max-w-xs">
                  Get detailed issue + fix for every pillar, rewritten copy, and your improved homepage mockup.
                </p>
                {checkoutError && (
                  <p className="text-xs text-score-red mb-3">{checkoutError}</p>
                )}
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="btn-primary flex items-center gap-2 whitespace-nowrap text-sm md:text-base disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {checkoutLoading ? "Processing..." : "Get Full Diagnosis £149"}
                  {!checkoutLoading && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 p-4">
                {Object.entries(result.scores).map(([key, pillar]: any) => (
                  <div key={key} className="glass-card p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold capitalize text-foreground">{key}</span>
                      <span className={`font-bold ${scoreColor((pillar?.score || 0) * 10)}`}>
                        {pillar?.score || 0}/10
                      </span>
                    </div>
                    <p className="text-xs text-body">{pillar?.issue || ""}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default ResultsPreview;
