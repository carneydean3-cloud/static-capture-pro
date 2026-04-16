import { motion } from "motion/react";
import {
  CheckCircle2,
  BarChart3,
  AlertCircle,
  Type,
  Layout,
  Code,
  Globe,
  Search,
  FileText,
  Zap,
} from "lucide-react";

const WhatYouGet = () => {
  const isGeoMode = window.location.pathname.includes("geo-audit");
  
  const activeColor = isGeoMode ? "text-neon" : "text-pulse";
  const activeBg = isGeoMode ? "bg-neon/10" : "bg-pulse/10";
  const activeBorder = isGeoMode ? "border-neon/20" : "border-pulse/20";
  const activeHover = isGeoMode ? "hover:border-neon/50" : "hover:border-pulse/50";

  const conversionFeatures = [
    {
      icon: BarChart3,
      title: "Full 7-pillar score breakdown",
      description:
        "Know exactly which areas are costing you conversions across all 7 dimensions including AI search readiness.",
      label: "Included in Full Diagnosis",
    },
    {
      icon: AlertCircle,
      title: "Every issue identified",
      description:
        "A complete list of what's broken, prioritised by impact. Nothing hidden behind a paywall.",
      label: "Included in Full Diagnosis",
    },
    {
      icon: Type,
      title: "Section-by-section rewritten copy",
      description:
        "Your exact headline, subheadline, CTA, and body copy rewritten to convert.",
      label: "Included in Full Diagnosis",
    },
    {
      icon: Layout,
      title: "Brand-matched visual mockup",
      description:
        "A PNG of your redesigned page built to match your colours and style.",
      label: "Included in Full Diagnosis",
    },
    {
      icon: Code,
      title: "Ready-to-use code bundle",
      description:
        "React and Tailwind. Just paste it in. No developer needed.",
      label: "Included in Full Diagnosis",
    },
    {
      icon: Globe,
      title: "AI Search Readiness Assessment",
      description:
        "Find out whether your page is structured to be found, understood, and cited by AI engines like ChatGPT and Perplexity.",
      label: "Included in Full Diagnosis",
    },
  ];

  const geoFeatures = [
    {
      icon: Search,
      title: "Full 7-dimension GEO score",
      description:
        "Know exactly where your page is invisible to AI search engines — scored across all 7 GEO dimensions.",
      label: "Included in Full GEO Audit",
    },
    {
      icon: AlertCircle,
      title: "Every visibility gap identified",
      description:
        "A complete list of what's blocking AI engines from finding, understanding, and citing your page — prioritised by impact.",
      label: "Included in Full GEO Audit",
    },
    {
      icon: FileText,
      title: "Structured content fixes",
      description:
        "Every section rewritten for AI extractability — headings, FAQs, definitions, and answer-first content that AI engines can summarise.",
      label: "Included in Full GEO Audit",
    },
    {
      icon: Zap,
      title: "Conversion alignment assessment",
      description:
        "If AI search sends traffic to your page, does it convert? We check both — so visibility and conversion work together.",
      label: "Included in Full GEO Audit",
    },
    {
      icon: Layout,
      title: "Brand-matched visual mockup",
      description:
        "A PNG of your restructured page built to match your colours and style — showing exactly how the fixes look in place.",
      label: "Included in Full GEO Audit",
    },
    {
      icon: Code,
      title: "Ready-to-use code bundle",
      description:
        "React and Tailwind. Just paste it in. No developer needed.",
      label: "Included in Full GEO Audit",
    },
  ];

  const features = isGeoMode ? geoFeatures : conversionFeatures;

  return (
    <section className="py-24 px-6 bg-obsidian border-t border-surgical">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <span className={`font-mono text-xs font-bold uppercase tracking-widest mb-4 block ${activeColor}`}>
            Deliverables
          </span>
          <h2 className="text-4xl md:text-5xl font-black mb-6 text-clinic">
            {isGeoMode
              ? "Everything you need to be found by AI."
              : "Everything you need to convert."}
          </h2>
          <p className="text-lg text-data max-w-2xl mx-auto">
            {isGeoMode
              ? "A comprehensive GEO audit across all 7 AI search dimensions — with structured fixes, rewritten content, and conversion alignment built in."
              : "A comprehensive audit across all 7 conversion pillars — with exact fixes, rewritten copy, visual assets, and AI search readiness built in."}
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
              className={`bg-[#0A0A0A] border ${activeBorder} rounded-lg p-8 group transition-all duration-300 ${activeHover}`}
            >
              <div className={`w-12 h-12 ${activeBg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-6 h-6 ${activeColor}`} />
              </div>
              <h3 className="text-xl font-bold mb-4 text-clinic">{feature.title}</h3>
              <p className="text-sm text-data leading-relaxed mb-6">{feature.description}</p>
              <div className={`flex items-center gap-2 text-xs font-mono font-bold tracking-wider uppercase opacity-50 group-hover:opacity-100 transition-opacity duration-300 ${activeColor}`}>
                <CheckCircle2 className="w-4 h-4" />
                {feature.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`mt-16 bg-[#0A0A0A] border ${activeBorder} rounded-lg p-8 max-w-3xl mx-auto`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className={`w-14 h-14 ${activeBg} rounded-2xl flex items-center justify-center shrink-0`}>
              <Globe className={`w-7 h-7 ${activeColor}`} />
            </div>
            <div>
              <p className={`text-xs font-mono font-bold uppercase tracking-widest mb-2 ${activeColor}`}>
                {isGeoMode ? "GEO + Conversion" : "AI Search Readiness Included"}
              </p>
              <h3 className="text-xl font-bold mb-2 text-clinic">
                {isGeoMode
                  ? "AI visibility and conversion. Both covered."
                  : "Built for humans. Ready for AI."}
              </h3>
              <p className="text-sm text-data leading-relaxed">
                {isGeoMode
                  ? "Getting found by AI search is only half the job. Every GEO audit includes a conversion alignment check — so when AI engines send traffic to your page, it actually converts."
                  : "AI search engines are changing how people find businesses online. Every ConversionDoc audit now checks whether your page is structured to be understood and cited by ChatGPT, Perplexity, and Google AI Overviews."}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WhatYouGet;
