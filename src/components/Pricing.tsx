import { useState } from "react";
import { motion } from "motion/react";
import { Check, Star, Zap, ArrowRight } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

const Pricing = () => {
  const { formatPrice } = useCurrency();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleSubscriptionCheckout = async (plan: string) => {
    setCheckoutLoading(plan);
    setCheckoutError(null);

    try {
      const email = localStorage.getItem("conversiondoc_user_email") || "";
      if (!email) {
        setCheckoutError("Please run a free audit first so we have your email.");
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-subscription-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ userEmail: email, plan }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Checkout failed (" + res.status + ")");
      }

      const data = await res.json();
      if (!data.url) throw new Error("No checkout URL returned");
      window.location.href = data.url;
    } catch (err: any) {
      console.error("Subscription checkout error:", err);
      setCheckoutError(err.message || "Something went wrong. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const plans = [
    {
      name: "Free Audit",
      price: 0,
      description: "Perfect for testing the waters and identifying quick wins.",
      features: [
        "6-Pillar Analysis",
        "Overall Conversion Score",
        "Top 3 Critical Fixes",
        "Basic Layout Audit",
        "Results in 60 Seconds",
      ],
      cta: "Start Free Audit",
      ctaAction: "free",
      popular: false,
    },
    {
      name: "Full Diagnosis",
      price: 149,
      description: "One-time, no subscription. Comprehensive analysis for serious growth.",
      features: [
        "Full 6-pillar breakdown",
        "Every issue identified",
        "Rewritten copy (every section)",
        "Brand-matched mockup (PNG)",
        "Ready-to-use code (paste straight in)",
      ],
      cta: "Get Full Diagnosis",
      ctaAction: "free",
      popular: false,
      refundText: "If we don't find at least 5 issues we'll refund you. No questions asked.",
    },
    {
      name: "Starter Pro",
      price: 99,
      isMonthly: true,
      description: "20 full audits per month. Perfect for freelancers and consultants.",
      features: [
        "Everything in Full Diagnosis",
        "20 Full Audits per month",
        "Run audits on client sites",
        "Full reports on every audit",
        "Priority Support",
      ],
      cta: "Start Starter Pro",
      ctaAction: "starter_pro",
      popular: true,
      popularLabel: "Best Value",
    },
    {
      name: "Agency Pro",
      price: 199,
      isMonthly: true,
      description: "Unlimited full audits. Built for agencies managing multiple clients.",
      features: [
        "Everything in Starter Pro",
        "Unlimited Full Audits",
        "Audit all your client sites",
        "Full reports on every audit",
        "Priority Support",
      ],
      cta: "Start Agency Pro",
      ctaAction: "agency_pro",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <span className="section-label mb-4 block">Pricing</span>
          <h2 className="section-heading mb-6">Simple, transparent pricing.</h2>
          <p className="body-text max-w-2xl mx-auto">
            No hidden fees. Choose the plan that fits your needs.
          </p>
        </div>

        {checkoutError && (
          <div className="text-center mb-8">
            <p className="text-sm text-red-400">{checkoutError}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
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
                <span className="text-4xl font-bold">
                  {plan.price === 0 ? "Free" : formatPrice(plan.price)}
                </span>
                {plan.isMonthly && (
                  <span className="text-sm text-muted-foreground">/mo</span>
                )}
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

              {plan.ctaAction === "free" ? (
                <a
                  href="#hero-cta"
                  className={
                    plan.popular
                      ? "btn-primary w-full block text-center"
                      : "btn-outline-primary w-full block text-center"
                  }
                >
                  {plan.cta}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubscriptionCheckout(plan.ctaAction)}
                  disabled={checkoutLoading === plan.ctaAction}
                  className={`w-full flex items-center justify-center gap-2 ${
                    plan.popular
                      ? "btn-primary"
                      : "btn-outline-primary"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {checkoutLoading === plan.ctaAction ? "Processing..." : plan.cta}
                  {checkoutLoading !== plan.ctaAction && (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </button>
              )}

              {plan.refundText && (
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  {plan.refundText}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
