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

const ResultsPreview = () => {
  const { stage, result } = useAudit();
  const hasRealResults = stage === "done" && result;

  const pillars = hasRealResults
    ? [
        { name: "Clarity", score: result.scores.clarity.score * 10, fullMark: 100 },
        { name: "Hook", score: result.scores.hook.score * 10, fullMark: 100 },
        { name: "Trust", score: result.scores.trust.score * 10, fullMark: 100 },
        { name: "Desire", score: result.scores.desire.score * 10, fullMark: 100 },
        { name: "Action", score: result.scores.action.score * 10, fullMark: 100 },
        { name: "Objections", score: result.scores.objections.score * 10, fullMark: 100 },
      ]
    : defaultPillars;

  const overallScore = hasRealResults ? result.overall_score : 67;
  const verdict = hasRealResults ? result.verdict : "Needs Attention";

  return (
    <section id="results" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card p-10 relative overflow-hidden flex flex-col items-center"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-score-amber to-score-red"></div>
          <div className="w-full flex items-center justify-between mb-10">
            <h3 className="text-xl font-bold">Conversion Radar</h3>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {hasRealResults ? "Your Audit" : "Example Audit"}
            </div>
          </div>

          <div className="w-full h-[400px] mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={pillars}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis
                  dataKey="name"
                  tick={{
                    fill: "rgba(255,255,255,0.6)",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
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
            <p className="text-xs text-muted-foreground font-medium mb-12">
              Example audit — your results will vary
            </p>
          )}

          <div className="w-full grid md:grid-cols-2 gap-6 mb-8">
            <div
              className={`rounded-xl p-8 border text-center ${
                hasRealResults ? verdictBg[verdict] || verdictBg["Needs Attention"] : "bg-score-amber/10 border-score-amber/20"
              }`}
            >
              <div className={`text-4xl font-bold mb-2 ${scoreColor(overallScore)}`}>
                {overallScore}/100
              </div>
              <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
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
              <p className="text-sm text-muted-foreground leading-relaxed">
                {hasRealResults
                  ? "Your detailed diagnosis is below. Review the top fixes to boost conversions."
                  : "Significant improvements identified across your trust architecture and objection handling."}
              </p>
            </div>
          </div>

          {/* Top 3 Fixes - shown when real results */}
          {hasRealResults && (
            <div className="w-full space-y-4 mb-8">
              <h4 className="text-lg font-bold">Top 3 Priority Fixes</h4>
              {result.top_3_fixes.map((fix, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                      {fix.priority}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold mb-1">{fix.issue}</h5>
                      <p className="text-sm text-score-amber font-medium mb-2">
                        Impact: {fix.impact}
                      </p>
                      <p className="text-sm text-muted-foreground">{fix.fix}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Remaining pillars - blurred/locked when real results */}
          {hasRealResults && (
            <div className="w-full relative">
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 rounded-xl flex flex-col items-center justify-center">
                <Lock className="w-8 h-8 text-primary mb-3" />
                <h4 className="font-bold text-lg mb-2">Unlock Full Diagnosis</h4>
                <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
                  Get detailed issue + fix for every pillar, rewritten copy, and visual mockups.
                </p>
                <a href="#pricing" className="btn-primary flex items-center gap-2">
                  Get Full Diagnosis £149
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              <div className="grid md:grid-cols-2 gap-4 p-4">
                {Object.entries(result.scores).map(([key, pillar]) => (
                  <div key={key} className="glass-card p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold capitalize">{key}</span>
                      <span className={`font-bold ${scoreColor(pillar.score * 10)}`}>
                        {pillar.score}/10
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{pillar.issue}</p>
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
