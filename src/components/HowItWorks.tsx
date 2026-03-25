import { motion } from "motion/react";
import { Search, BarChart3, Rocket } from "lucide-react";

const steps = [
  { icon: Search, title: "Analyse", description: "Paste your URL. Our AI reads your page like a conversion expert — headline, trust signals, CTA, and more.", color: "bg-primary/20 text-primary" },
  { icon: BarChart3, title: "Diagnose", description: "You get a score across 6 pillars with specific issues identified. No vague advice. Exact problems.", color: "bg-score-amber/20 text-score-amber" },
  { icon: Rocket, title: "Fix", description: "Get section-by-section rewritten copy, a brand-matched mockup, and code you can paste straight in.", color: "bg-score-green/20 text-score-green" },
];

const HowItWorks = () => (
  <section id="how-it-works" className="py-24 px-6 bg-navy-dark/50">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <span className="section-label mb-4 block">Process</span>
        <h2 className="section-heading mb-6">Three steps from broken to converting.</h2>
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
            <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300`}>
              <step.icon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-4">{step.title}</h3>
            <p className="body-text">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
