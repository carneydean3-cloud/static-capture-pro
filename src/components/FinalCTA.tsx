import { motion } from "motion/react";
import { ArrowRight, Shield, Clock, Globe } from "lucide-react";

const FinalCTA = () => (
  <section
    className="py-24 px-6"
    style={{
      background:
        "linear-gradient(180deg, hsl(215 40% 20%) 0%, hsl(217 33% 17%) 100%)",
    }}
  >
    <div className="max-w-4xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Free — No Credit Card Required
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Stop guessing. Start converting.
        </h2>

        {/* Subheadline */}
        <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
          Every day without an audit is another day of lost conversions.
          Get your free 7-pillar diagnosis in 60 seconds — with an AI
          search readiness check included.
        </p>

        {/* Supporting line */}
        <p className="text-sm text-caption mb-12">
          Built for humans. Ready for AI.
        </p>

        {/* CTA */}
        <a
          href="#hero-cta"
          className="btn-primary text-lg px-10 py-5 inline-flex items-center gap-3"
        >
          Run Your Free Audit Now
          <ArrowRight className="w-5 h-5" />
        </a>

        {/* Trust signals */}
        <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Money-back guarantee
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Results in 60 seconds
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            AI search readiness included
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default FinalCTA;
