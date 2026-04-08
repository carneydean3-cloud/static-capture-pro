import { motion } from "motion/react";
import {
  CheckCircle2,
  BarChart3,
  AlertCircle,
  Type,
  Layout,
  Code,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Full 7-pillar score breakdown",
    description:
      "Know exactly which areas are costing you conversions across all 7 dimensions including AI search readiness.",
  },
  {
    icon: AlertCircle,
    title: "Every issue identified",
    description:
      "A complete list of what's broken, prioritised by impact. Nothing hidden behind a paywall.",
  },
  {
    icon: Type,
    title: "Section-by-section rewritten copy",
    description:
      "Your exact headline, subheadline, CTA, and body copy rewritten to convert.",
  },
  {
    icon: Layout,
    title: "Brand-matched visual mockup",
    description:
      "A PNG of your redesigned page built to match your colours and style.",
  },
  {
    icon: Code,
    title: "Ready-to-use code bundle",
    description:
      "React and Tailwind. Just paste it in. No developer needed.",
  },
  {
    icon: Globe,
    title: "AI Search Readiness Assessment",
    description:
      "Find out whether your page is structured to be found, understood, and cited by AI engines like ChatGPT, Perplexity, and Google AI Overviews.",
  },
];

const WhatYouGet = () => (
  <section className="py-24 px-6 bg-navy-dark/30">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <span className="section-label mb-4 block">Features</span>
        <h2 className="section-heading mb-6">
          Everything you need to convert.
        </h2>
        <p className="body-text max-w-2xl mx-auto">
          A comprehensive audit across all 7 conversion pillars — with fixes,
          rewritten copy, visual assets, and AI search readiness built in.
        </p>
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
              Included in Full Diagnosis
            </div>
          </motion.div>
        ))}
      </div>

      {/* GEO callout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-16 glass-card p-8 max-w-3xl mx-auto"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
            <Globe className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
              New — AI Search Readiness
            </p>
            <h3 className="text-lg font-bold mb-2">
              Built for humans. Ready for AI.
            </h3>
            <p className="text-sm text-body leading-relaxed">
              AI search engines are changing how people find businesses online.
              Every ConversionDoc audit now checks whether your page is structured
              to be understood and cited by ChatGPT, Perplexity, and Google AI
              Overviews — so you're not invisible to a growing share of your market.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default WhatYouGet;
