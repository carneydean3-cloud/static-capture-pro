import { motion } from "motion/react";
import { Check, Star, Zap } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

const Pricing = () => {
  const { formatPrice } = useCurrency();

  const plans = [
    {
      name: "Free Audit",
      price: 0,
      description: "Perfect for testing the waters and identifying quick wins.",
      features: ["6-Pillar Analysis", "Overall Conversion Score", "Top 3 Critical Fixes", "Basic Layout Audit", "Results in 60 Seconds"],
      cta: "Start Free Audit",
      popular: false,
    },
    {
      name: "Full Diagnosis",
      price: 149,
      description: "One-time, no subscription. Comprehensive analysis for serious growth.",
      features: ["Full 6-pillar breakdown", "Every issue identified", "Rewritten copy (every section)", "Brand-matched mockup (PNG)", "Ready-to-use code (paste straight in)"],
      cta: "Get Full Diagnosis",
      popular: true,
      popularLabel: "Most Chosen",
      refundText: "If we don't find at least 5 issues we'll refund you. No questions asked.",
    },
    {
      name: "Conversion Dashboard",
      price: 29,
      isMonthly: true,
      description: "Everything in Full Diagnosis, plus ongoing tracking and weekly rescans.",
      features: ["Everything in Full Diagnosis", "Weekly Automated Rescans", "Conversion Score Tracking", "Visitor Behaviour Analytics", "Priority Support"],
      cta: "Start Dashboard",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <span className="section-label mb-4 block">Pricing</span>
          <h2 className="section-heading mb-6">Simple, transparent pricing.</h2>
          <p className="body-text max-w-2xl mx-auto">No hidden fees. No subscriptions required. Pay once, get results.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`glass-card p-8 relative ${plan.popular ? "border-primary/50 scale-105" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full flex items-center gap-1.5">
                  <Star className="w-3 h-3" /> {plan.popularLabel}
                </div>
              )}
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold">{plan.price === 0 ? "Free" : formatPrice(plan.price)}</span>
                {plan.isMonthly && <span className="text-sm text-muted-foreground">/mo</span>}
              </div>
              <p className="text-sm text-muted-foreground mb-8">{plan.description}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <a href="#hero-cta" className={plan.popular ? "btn-primary w-full block text-center" : "btn-outline-primary w-full block text-center"}>
                {plan.cta}
              </a>
              {plan.refundText && (
                <p className="text-xs text-muted-foreground mt-4 text-center">{plan.refundText}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
