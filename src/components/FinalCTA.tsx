import { motion } from "motion/react";
import { ArrowRight, Shield, Clock, Globe } from "lucide-react";

const FinalCTA = () => {
  const isGeoMode = window.location.pathname.includes("geo-audit");

  return (
    <section className="py-24 px-6 bg-obsidian border-t border-surgical">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-surgical rounded-md px-4 py-1.5 mb-8 bg-black/40">
            <span className={`text-xs tech-readout font-bold uppercase tracking-widest ${isGeoMode ? 'text-neon' : 'text-pulse'}`}>
              [STATUS: NO_CREDIT_CARD_REQUIRED]
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-4xl md:text-5xl font-black mb-6 text-clinic">
            {isGeoMode
              ? "[AI_SEARCH_LEAK_DETECTED] Is traffic going to competitors?"
              : "[CONVERSION_LEAK_DETECTED] Stop guessing. Start fixing."}
          </h2>

          {/* Subheadline */}
          <p className="text-xl text-data mb-6 max-w-2xl mx-auto">
            {isGeoMode
              ? "Every day without a GEO audit is another day ChatGPT, Perplexity, and Google AI Overviews recommend someone else. Find out where you stand in 60 seconds."
              : "Every day without an audit is another day of lost conversions. Get your free 7-pillar diagnosis in 60 seconds — with an AI search readiness check included."}
          </p>

          {/* Supporting line */}
          <p className="text-sm tech-readout text-surgical mb-12 uppercase tracking-widest opacity-60">
            Built_for_humans. Ready_for_AI.
          </p>

          {/* CTA */}
          <a
            href="#hero-cta"
            className={`${isGeoMode ? 'btn-neon' : 'btn-pulse'} text-lg px-10 py-5 inline-flex items-center gap-3`}
          >
            {isGeoMode
              ? "INITIATE_GEO_SCAN"
              : "INITIATE_CONVERSION_SCAN"}
            <ArrowRight className="w-5 h-5" />
          </a>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-sm text-data tech-readout">
            <div className="flex items-center gap-2">
              <Shield className={`w-4 h-4 ${isGeoMode ? 'text-neon' : 'text-pulse'}`} />
              GUARANTEED_ROI
            </div>
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${isGeoMode ? 'text-neon' : 'text-pulse'}`} />
              60_SECOND_EXECUTION
            </div>
            <div className="flex items-center gap-2">
              <Globe className={`w-4 h-4 ${isGeoMode ? 'text-neon' : 'text-pulse'}`} />
              {isGeoMode
                ? "FULL_SPECTRUM_CHECK"
                : "AI_READINESS_INCLUDED"}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
