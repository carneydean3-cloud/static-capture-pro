import { motion } from "motion/react";
import { Search, BarChart3, Rocket } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Analyse",
    description:
      "Paste your URL. Our AI reads your page like a conversion expert — headline, trust signals, CTA, structure, and AI search readiness.",
    color: "bg-primary/20 text-primary",
  },
  {
    icon: BarChart3,
    title: "Diagnose",
    description:
      "You get a score across 7 pillars with specific issues identified. No vague advice. Exact problems, exact causes.",
    color: "bg-score-amber/20 text-score-amber",
  },
  {
    icon: Rocket,
    title: "Fix",
    description:
      "Get section-by-section rewritten copy, a brand-matched mockup, and code you can paste straight in.",
    color: "bg-score-green/20 text-score-green",
  },
];

const HowItWorks = () => (
  <section id="how-it-works" className="py-24 px-6 bg-navy-dark/50">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <span className="section-label mb-4 block">Process</span>
        <h2 className="section-heading mb-6">
          Three steps from broken to converting.
        </h2>
        <p className="body-text max-w-2xl mx-auto">
          Most tools stop at the diagnosis. ConversionDoc prescribes the fix.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-12 relative">
        <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 -z-10"></div>
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="glass-card p-10 text-center group hover:scale-105 transition-transform duration-300"
          >
            <div
              className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300`}
            >
              <step.icon className="w-8 h-8" />
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-xs font-bold text-caption">
              {index + 1}
            </div>
            <h3 className="text-xl font-bold mb-4">{step.title}</h3>
            <p className="body-text">{step.description}</p>
          </motion.div>
        ))}
      </div>

      {/* 7 pillars strip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-20 glass-card p-8"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-primary text-center mb-6">
          The 7 Conversion Pillars
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { label: "Clarity", description: "Can visitors understand your offer in 5 seconds?" },
            { label: "Hook Strength", description: "Does your headline stop the scroll?" },
            { label: "Trust Architecture", description: "Do visitors trust what they see?" },
            { label: "Desire Building", description: "Are benefits clear and compelling?" },
            { label: "Action Clarity", description: "Is the next step obvious?" },
            { label: "Objection Handling", description: "Are concerns addressed?" },
            { label: "AI Search Readiness", description: "Can AI engines find and cite your page?" },
          ].map((pillar) => (
            <div
              key={pillar.label}
              className="text-center p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <p className="text-xs font-bold text-primary mb-2">{pillar.label}</p>
              <p className="text-xs text-caption leading-relaxed">{pillar.description}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

export default HowItWorks;
