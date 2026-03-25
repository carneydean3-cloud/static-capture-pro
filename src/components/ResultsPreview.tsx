import { motion } from "motion/react";
import { AlertCircle } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

const pillars = [
  { name: "Clarity", score: 70, fullMark: 100 },
  { name: "Hook", score: 50, fullMark: 100 },
  { name: "Trust", score: 40, fullMark: 100 },
  { name: "Desire", score: 60, fullMark: 100 },
  { name: "Action", score: 80, fullMark: 100 },
  { name: "Objections", score: 30, fullMark: 100 },
];

const ResultsPreview = () => (
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
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Example Audit</div>
        </div>

        <div className="w-full h-[400px] mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={pillars}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600 }} />
              <Radar name="Score" dataKey="score" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.5} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-muted-foreground font-medium mb-12">Example audit — your results will vary</p>

        <div className="w-full grid md:grid-cols-2 gap-6">
          <div className="bg-score-amber/10 rounded-xl p-8 border border-score-amber/20 text-center">
            <div className="text-4xl font-bold text-score-amber mb-2">67/100</div>
            <div className="text-sm font-bold uppercase tracking-widest text-score-amber/80">Conversion Score</div>
          </div>
          <div className="bg-white/5 rounded-xl p-8 border border-white/10 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-score-amber" />
              <span className="font-bold text-score-amber">Needs Attention</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Significant improvements identified across your trust architecture and objection handling.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default ResultsPreview;
