import { motion } from "motion/react";
import { Search, BarChart3, Rocket } from "lucide-react";

const HowItWorks = () => {
  const isGeoMode = window.location.pathname.includes("geo-audit");

  const activeColor = isGeoMode ? "text-neon" : "text-pulse";
  const activeBg = isGeoMode ? "bg-neon/10" : "bg-pulse/10";
  const activeBorder = isGeoMode ? "border-neon/20" : "border-pulse/20";

  const conversionSteps = [
    {
      icon: Search,
      title: "Analyse",
      description: "Our AI reads your page like a conversion expert — headline, trust signals, CTA, structure, and AI search readiness.",
      color: `text-pulse bg-pulse/20`,
    },
    {
      icon: BarChart3,
      title: "Diagnose",
      description: "You get a score across 7 pillars with specific leaks identified. No vague advice. Exact problems, exact causes.",
      color: "text-clinic bg-white/10",
    },
    {
      icon: Rocket,
      title: "Prescribe",
      description: "Get section-by-section rewritten copy, a brand-matched mockup, and code you can paste straight in.",
      color: `text-pulse bg-pulse/20`,
    },
  ];

  const geoSteps = [
    {
      icon: Search,
      title: "Analyse",
      description: "Our AI reads your page the way ChatGPT, Perplexity, and Google AI Overviews do — structure, clarity, and entity signals.",
      color: `text-neon bg-neon/20`,
    },
    {
      icon: BarChart3,
      title: "Diagnose",
      description: "You get an AI Search Readiness score across 7 GEO dimensions. Exact visibility gaps identified. No guesswork.",
      color: "text-clinic bg-white/10",
    },
    {
      icon: Rocket,
      title: "Prescribe",
      description: "Get structured content fixes, rewritten sections, and ready-to-use code that makes your page findable and citable by AI.",
      color: `text-neon bg-neon/20`,
    },
  ];

  const conversionPillars = [
    { label: "Clarity", description: "Can visitors understand your offer in 5 seconds?" },
    { label: "Hook Strength", description: "Does your headline stop the scroll?" },
    { label: "Trust Architecture", description: "Do visitors trust what they see?" },
    { label: "Desire Building", description: "Are benefits clear and compelling?" },
    { label: "Action Clarity", description: "Is the next step obvious?" },
    { label: "Objection Handling", description: "Are concerns proactively addressed?" },
    { label: "AI Search Readiness", description: "Can AI engines find and cite your page?" },
  ];

  const geoPillars = [
    { label: "AI Search Readiness", description: "Can AI engines find, understand, and cite your page?" },
    { label: "Topic Clarity", description: "Is your page clearly focused on one primary topic?" },
    { label: "Answerability", description: "Does your content directly answer likely user questions?" },
    { label: "Structure", description: "Are headings, lists, and FAQs easy for AI to extract?" },
    { label: "Authority Signals", description: "Is expertise and credibility clearly demonstrated?" },
    { label: "Entity Clarity", description: "Is it obvious who you are, what you do, and who you serve?" },
    { label: "Conversion Alignment", description: "If AI sends traffic here, does the page convert?" },
  ];

  const steps = isGeoMode ? geoSteps : conversionSteps;
  const pillars = isGeoMode ? geoPillars : conversionPillars;

  return (
    <section id="how-it-works" className="py-24 px-6 bg-obsidian border-t border-surgical">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <span className={`font-mono text-xs font-bold uppercase tracking-widest mb-4 block ${activeColor}`}>
            Diagnostic Process
          </span>
          <h2 className="text-4xl md:text-5xl font-black mb-6 text-clinic">
            {isGeoMode
              ? "Three steps from invisible to cited."
              : "Three steps from broken to converting."}
          </h2>
          <p className="text-lg text-data max-w-2xl mx-auto">
            {isGeoMode
              ? "Most tools don't check AI search readiness at all. ConversionDoc diagnoses every visibility gap and prescribes the fix."
              : "Most tools stop at the diagnosis. ConversionDoc prescribes the exact code and copy to fix it."}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 relative">
          <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-px bg-surgical -translate-y-1/2 -z-10"></div>
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`bg-[#0A0A0A] border ${activeBorder} rounded-lg p-10 text-center group hover:bg-[#111111] transition-colors duration-300`}
            >
              <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-8`}>
                <step.icon className="w-8 h-8" />
              </div>
              <div className="w-8 h-8 rounded-full bg-surgical border border-white/10 flex items-center justify-center mx-auto mb-4 text-xs font-mono font-bold text-data">
                0{index + 1}
              </div>
              <h3 className="text-2xl font-bold mb-4 text-clinic">{step.title}</h3>
              <p className="text-data leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Pillars strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={`mt-20 border ${activeBorder} bg-[#0A0A0A] rounded-lg p-8`}
        >
          <p className={`text-xs font-mono font-bold uppercase tracking-widest text-center mb-6 ${activeColor}`}>
            {isGeoMode ? "The 7 AI Dimensions" : "The 7 Conversion Pillars"}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {pillars.map((pillar) => (
              <div
                key={pillar.label}
                className="text-center p-4 rounded-xl bg-black/40 border border-surgical"
              >
                <p className={`text-xs font-bold mb-2 ${activeColor}`}>{pillar.label}</p>
                <p className="text-xs text-data leading-relaxed opacity-80">{pillar.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
