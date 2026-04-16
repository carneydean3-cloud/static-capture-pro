import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
import { cn } from "@/lib/utils";

const defaultPillars = [
  { name: "CLARITY", score: 70, fullMark: 100 },
  { name: "HOOK", score: 50, fullMark: 100 },
  { name: "TRUST", score: 40, fullMark: 100 },
  { name: "DESIRE", score: 60, fullMark: 100 },
  { name: "ACTION", score: 80, fullMark: 100 },
  { name: "OBJECTIONS", score: 30, fullMark: 100 },
  { name: "AI_READINESS", score: 45, fullMark: 100 },
];

const verdictColor: Record<string, string> = {
  Healthy: "text-[#10b981]",
  "Needs Attention": "text-[#f59e0b]",
  Critical: "text-[#E11D48]",
};

const verdictBg: Record<string, string> = {
  Healthy: "bg-[#10b981]/10 border-[#10b981]/20",
  "Needs Attention": "bg-[#f59e0b]/10 border-[#f59e0b]/20",
  Critical: "bg-[#E11D48]/10 border-[#E11D48]/20",
};

const scoreColor = (score: number) => {
  if (score >= 70) return "text-[#10b981]";
  if (score >= 40) return "text-[#f59e0b]";
  return "text-[#E11D48]";
};

const getImpactStyles = (impact: string) => {
  if (impact === "High") return { borderLeft: "4px solid #E11D48", badgeBg: "#E11D48", textColor: "#E11D48" };
  if (impact === "Medium") return { borderLeft: "4px solid #f59e0b", badgeBg: "#f59e0b", textColor: "#f59e0b" };
  return { borderLeft: "4px solid #1A1A1A", badgeBg: "#1A1A1A", textColor: "#A1A1AA" };
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

  const isGeoMode = window.location.pathname.includes("geo-audit");
  const activeColor = isGeoMode ? "text-neon" : "text-pulse";
  const activeStroke = isGeoMode ? "#D946EF" : "#06B6D4";
  const activeBtn = isGeoMode ? "btn-neon" : "btn-pulse";
  const activeBorder = isGeoMode ? "border-neon/30" : "border-pulse/30";

  useEffect(() => {
    if (stage === "done") {
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  useEffect(() => {
    if (!hasRealResults || subscriptionChecked) return;
    const email = userEmail || localStorage.getItem("conversiondoc_user_email") || "";
    if (!email) { setSubscriptionChecked(true); return; }

    const checkSubscription = async () => {
      setSubscriptionLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-subscription`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        setIsSubscribed(data.subscribed === true);
        setSubscriptionPlan(data.plan || null);
        setAuditsRemaining(data.audits_remaining ?? null);
        setLimitReached(data.limit_reached === true);
      } catch (err) {
        setIsSubscribed(false);
      } finally {
        setSubscriptionChecked(true);
        setSubscriptionLoading(false);
      }
    };
    checkSubscription();
  }, [hasRealResults, userEmail, subscriptionChecked]);

  const rawPillars = hasRealResults
    ? [
        { name: "CLARITY", score: (result?.scores?.clarity?.score || 0) * 10 },
        { name: "HOOK", score: (result?.scores?.hook?.score || 0) * 10 },
        { name: "TRUST", score: (result?.scores?.trust?.score || 0) * 10 },
        { name: "DESIRE", score: (result?.scores?.desire?.score || 0) * 10 },
        { name: "ACTION", score: (result?.scores?.action?.score || 0) * 10 },
        { name: "OBJECTIONS", score: (result?.scores?.objections?.score || 0) * 10 },
        { name: "AI_READINESS", score: (result?.scores?.ai_readiness?.score || 0) * 10 },
      ]
    : defaultPillars;

  const pillars = isGeoMode 
    ? [rawPillars[6], ...rawPillars.slice(0, 6)] 
    : rawPillars;

  const overallScore = hasRealResults ? result?.overall_score || 0 : 67;
  const verdict = hasRealResults ? result?.verdict || "Needs Attention" : "Needs Attention";

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const savedEmail = localStorage.getItem("conversiondoc_user_email") || "";
      const checkoutEmail = userEmail || savedEmail || "";
      const screenshotUrl = localStorage.getItem("conversiondoc_screenshot_url") || result?.screenshot_url || "";
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          userEmail: checkoutEmail,
          url: url || "",
          auditResult: { ...result, screenshot_url: screenshotUrl },
          focus: isGeoMode ? "geo" : "conversion",
        }),
      });
      const data = await res.json();
      if (!data.url) throw new Error("No checkout URL returned");
      window.location.href = data.url;
    } catch (err: any) {
      setCheckoutError(err.message || "Checkout failed.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleViewFullReport = () => {
    const email = userEmail || localStorage.getItem("conversiondoc_user_email") || "";
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        userEmail: email,
        url: url || "",
        auditResult: result,
        isSubscription: true,
        focus: isGeoMode ? "geo" : "conversion",
      }),
    })
    .then(r => r.json())
    .then(data => {
      if (data.session_id) window.location.href = `/paid-report?session_id=${data.session_id}${isGeoMode ? "&focus=geo" : ""}`;
    });
  };

  return (
    <section id="results" className="py-24 px-6 bg-obsidian border-t border-surgical">
      <div className="max-w-3xl mx-auto">
        
        <div className="text-center mb-12">
          <span className={cn("font-mono text-xs font-bold uppercase tracking-[0.2em] mb-4 block", activeColor)}>
            Diagnostic Output
          </span>
          <h2 className="text-4xl font-black text-clinic mb-4 tracking-tight">
            {hasRealResults ? (isGeoMode ? "AI Search Analysis" : "Conversion Analysis") : "Analysis Preview"}
          </h2>
        </div>

        <motion.div
          className={cn(
            "bg-[#0A0A0A] border border-surgical rounded-lg p-10 relative overflow-hidden transition-all duration-1000",
            highlight && `border-pulse ring-1 ring-pulse/20 shadow-[0_0_50px_rgba(6,182,212,0.1)]`
          )}
        >
          <div className="w-full flex items-center justify-between mb-10 font-mono text-[10px] uppercase tracking-widest font-bold text-data">
            <span className={activeColor}>{isGeoMode ? "Machine Layer Radar" : "Human Layer Radar"}</span>
            <span>{hasRealResults ? "LIVE_AUDIT" : "SAMPLE_READOUT"}</span>
          </div>

          <div className="w-full h-[340px] md:h-[420px] mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={pillars}>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis
                  dataKey="name"
                  tick={{ fill: "#A1A1AA", fontSize: 10, fontWeight: 700, fontFamily: "JetBrains Mono" }}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke={activeStroke}
                  fill={activeStroke}
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full grid md:grid-cols-2 gap-6 mb-8">
            <div className={cn("rounded-lg p-8 border text-center transition-colors", hasRealResults ? verdictBg[verdict] : "bg-surgical/50 border-surgical")}>
              <div className={cn("text-4xl font-black mb-1 font-mono", scoreColor(overallScore))}>
                {overallScore}/100
              </div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-data opacity-60">
                {isGeoMode ? "GEO READINESS" : "CONVERSION SCORE"}
              </div>
            </div>

            <div className="bg-black/40 rounded-lg p-8 border border-surgical flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <div className={cn("w-2 h-2 rounded-full animate-pulse", verdict === "Healthy" ? "bg-[#10b981]" : (verdict === "Critical" ? "bg-[#E11D48]" : "bg-[#f59e0b]"))} />
                <span className={cn("font-bold font-mono text-sm uppercase tracking-wider", verdictColor[verdict] || "text-[#f59e0b]")}>
                  {verdict.replace(" ", "_")}
                </span>
              </div>
              <p className="text-xs text-data leading-relaxed font-mono">
                {hasRealResults 
                  ? (isGeoMode ? "Analysis complete. Review machine-readable gaps below." : "Analysis complete. Review psychological leaks below.")
                  : "Scanning... identifying structural and visual bottlenecks in page flow."}
              </p>
            </div>
          </div>

          <div className="w-full relative min-h-[400px]">
            {/* Pay Gate */}
            {subscriptionChecked && !isSubscribed && (
              <div className="absolute inset-0 bg-obsidian/80 backdrop-blur-md z-20 rounded-lg flex flex-col items-center justify-center p-8 text-center border border-surgical">
                <Lock className={cn("w-8 h-8 mb-4", activeColor)} />
                <h4 className="text-xl font-bold text-clinic mb-2">
                  {isGeoMode ? "Unlock Full GEO Diagnosis" : "Unlock Full Diagnosis"}
                </h4>
                <p className="text-sm text-data mb-8 max-w-xs font-mono">
                  Get every specific fix, rewritten content, and your improved layout mockup.
                </p>
                <button onClick={handleCheckout} disabled={checkoutLoading} className={cn("w-full py-4 px-8 font-bold flex items-center justify-center gap-3", activeBtn)}>
                  {checkoutLoading ? "Processing..." : `Get Full Audit £149`} <ArrowRight className="w-4 h-4" />
                </button>
                {checkoutError && <p className="text-[10px] text-warning font-mono mt-4 uppercase">{checkoutError}</p>}
              </div>
            )}

            {/* Subscriber Control */}
            {subscriptionChecked && isSubscribed && !limitReached && (
              <div className={cn("mb-8 rounded-lg p-6 text-center border", activeBorder, "bg-black/40")}>
                <p className="text-xs font-mono font-bold uppercase tracking-widest text-clinic mb-4">Subscriber Session Active</p>
                <button onClick={handleViewFullReport} className={cn("mx-auto py-3 px-8 flex items-center gap-2", activeBtn)}>
                  View Full Report <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Data Grid */}
            <div className="grid md:grid-cols-2 gap-4 opacity-40 select-none grayscale">
              {pillars.map((p: any) => (
                <div key={p.name} className="bg-black/50 border border-surgical p-5 rounded-lg">
                  <div className="flex justify-between items-center mb-2 font-mono text-[10px]">
                    <span className="text-clinic font-bold uppercase tracking-widest">{p.name}</span>
                    <span className={scoreColor(p.score)}>{p.score}/100</span>
                  </div>
                  <div className="h-1 w-full bg-surgical rounded-full overflow-hidden">
                    <div className={cn("h-full transition-all duration-1000", isGeoMode ? "bg-neon" : "bg-pulse")} style={{ width: `${p.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ResultsPreview;
