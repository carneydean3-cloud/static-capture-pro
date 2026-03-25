import { motion } from "motion/react";
import { CheckCircle2, BarChart3, AlertCircle, Type, Layout, Code, Zap } from "lucide-react";

const features = [
  { icon: BarChart3, title: "Full 6-pillar score breakdown", description: "Know exactly which areas are costing you conversions." },
  { icon: AlertCircle, title: "Every issue identified", description: "A complete list of what's broken, nothing hidden behind an upgrade." },
  { icon: Type, title: "Section-by-section rewritten copy", description: "Your exact headline, subheadline, CTA and body rewritten to convert." },
  { icon: Layout, title: "Brand-matched visual mockup", description: "A PNG of your redesigned page built to match your colours and style." },
  { icon: Code, title: "Ready-to-use code bundle", description: "React and Tailwind, just paste it in. No developer needed." },
  { icon: Zap, title: "Conversion Dashboard", description: "Track your conversion score over time, monitor real visitor behaviour, and get weekly automated rescans." },
];

const WhatYouGet = () => (
  <section className="py-24 px-6 bg-navy-dark/30">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <span className="section-label mb-4 block">Features</span>
        <h2 className="section-heading mb-6">Everything you need to convert.</h2>
        <p className="body-text max-w-2xl mx-auto">Our comprehensive audit covers every aspect of your landing page to ensure no lead is left behind.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="glass-card p-8 group hover:bg-white/15 transition-all duration-300"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <feature.icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
            <p className="body-text text-sm mb-6">{feature.description}</p>
            <div className="flex items-center gap-2 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <CheckCircle2 className="w-4 h-4" />
              Included in Audit
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default WhatYouGet;
