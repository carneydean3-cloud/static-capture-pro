import { useState } from "react";
import { motion } from "motion/react";
import { Check, Star, ArrowRight, Lock } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

const Pricing = () => {
  const { formatPrice } = useCurrency();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const isGeoMode = window.location.pathname.includes("geo-audit");

  const activeColor = isGeoMode ? "text-neon" : "text-pulse";
  const activeBg = isGeoMode ? "bg-neon" : "bg-pulse";
  const activeBorder = isGeoMode ? "border-neon/50" : "border-pulse/50";
  const activeBtn = isGeoMode ? "btn-neon" : "btn-pulse";
  const activeOutline = isGeoMode ? "border border-neon text-neon hover:bg-neon/10" : "border border-pulse text-pulse hover:bg-pulse/10";

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

  const conversionPlans = [
    {
      name: "Free Audit",
      price: 0,
      description: "Perfect for identifying quick wins and testing the waters.",
      features: [
        "7-Pillar Conversion Analysis",
        "Overall Conversion Score",
        "Top 3 Critical Fixes",
        "Basic Layout Audit",
        "AI Search Readiness Signals",
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
        "Full 7-Pillar Breakdown",
        "Every Issue Identified",
        "Rewritten Copy (Every Section)",
        "Brand-Matched Mockup (PNG)",
        "Ready-to-Use Code (Paste Straight In)",
        "AI Search Readiness Assessment",
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
        "20 Full Audits Per Month",
        "Run Audits on Client Sites",
        "White Label Reports (Your Logo)",
        "AI Search Readiness Included",
        "Priority Support",
      ],
      cta: "Start Starter Pro",
      ctaAction: "starter_pro",
      popular: true,
      popularLabel: "Best Value",
      upsellCta: "Need unlimited audits? Upgrade to Agency Pro →",
      upsellTarget: "agency_pro",
      isLaunchPrice: true,
    },
    {
      name: "Agency Pro",
      price: 199,
      isMonthly: true,
      description: "Unlimited full audits. Built for agencies managing multiple clients.",
      features: [
        "Everything in Starter Pro",
        "Unlimited Full Audits",
        "Audit All Client Sites",
        "White Label Reports (Your Logo)",
        "AI Search Readiness Included",
        "Priority Support",
      ],
      cta: "Start Agency Pro",
      ctaAction: "agency_pro",
      popular: false,
      upsellCta: "Add GEO + AI Search Readiness — Upgrade to Agency Max →",
      upsellTarget: "agency_max",
      isLaunchPrice: true,
    },
    {
      name: "Agency Max",
      price: 279,
      isMonthly: true,
      description: "Unlimited conversion + GEO audits. The full stack for serious agencies.",
      features: [
        "Everything in Agency Pro",
        "Unlimited GEO + Conversion Audits",
        "Full GEO + AI Search Reports",
        "White Label Reports (Your Logo)",
        "Multi-Tool Dashboard",
        "Priority Support",
      ],
      cta: "Start Agency Max",
      ctaAction: "agency_max",
      popular: false,
      isLaunchPrice: true,
    },
  ];

  const geoPlans = [
    {
      name: "Free GEO Audit",
      price: 0,
      description: "Find out instantly how visible your page is to AI search engines.",
      features: [
        "AI Search Readiness Score",
        "7-Dimension GEO Analysis",
        "Top 3 AI Visibility Fixes",
        "Conversion Health Check",
        "Structured Content Assessment",
        "Results in 60 Seconds",
      ],
      cta: "Start Free GEO Audit",
      ctaAction: "free",
      popular: false,
    },
    {
      name: "Full GEO Audit",
      price: 149,
      description: "One-time. Full AI visibility and conversion diagnosis.",
      features: [
        "Full GEO + Conversion Audit",
        "AI Search Readiness Score (Detailed)",
        "Every Visibility Gap Identified",
        "Structured Content Fixes",
        "Conversion Alignment Assessment",
        "Brand-Matched Mockup (PNG)",
        "Ready-to-Use Code (Paste Straight In)",
      ],
      cta: "Get Full GEO Audit",
      ctaAction: "free",
      popular: false,
      refundText: "If we don't find at least 5 issues we'll refund you. No questions asked.",
    },
    {
      name: "GEO Starter Pro",
      price: 99,
      isMonthly: true,
      description: "20 full GEO audits per month. Built for freelancers managing client visibility.",
      features: [
        "AI Search Readiness on Every Audit",
        "Full GEO + Conversion Reports",
        "20 Full Audits Per Month",
        "Audit Client Sites",
        "White Label Reports (Your Logo)",
        "Priority Support",
      ],
      cta: "Start GEO Starter Pro",
      ctaAction: "geo_starter_pro",
      popular: true,
      popularLabel: "Best Value",
      upsellCta: "Need unlimited GEO audits? Upgrade to GEO Agency Pro →",
      upsellTarget: "geo_agency_pro",
      isLaunchPrice: true,
    },
    {
      name: "GEO Agency Pro",
      price: 199,
      isMonthly: true,
      description: "Unlimited GEO audits. Built for agencies managing AI visibility across multiple sites.",
      features: [
        "Unlimited GEO + Conversion Audits",
        "AI Search Readiness on Every Audit",
        "Full Reports on Every Client Site",
        "Audit All Client Sites",
        "White Label Reports (Your Logo)",
        "Priority Support",
      ],
      cta: "Start GEO Agency Pro",
      ctaAction: "geo_agency_pro",
      popular: false,
      upsellCta: "Add Conversion Audits — Upgrade to Agency Max →",
      upsellTarget: "agency_max",
      isLaunchPrice: true,
    },
    {
      name: "Agency Max",
      price: 279,
      isMonthly: true,
      description: "Unlimited conversion + GEO audits. The full stack for serious agencies.",
      features: [
        "Everything in GEO Agency Pro",
        "Unlimited Conversion + GEO Audits",
        "Full GEO + AI Search Reports",
        "White Label Reports (Your Logo)",
        "Multi-Tool Dashboard",
        "Priority Support",
      ],
      cta: "Start Agency Max",
      ctaAction: "agency_max",
      popular: false,
      isLaunchPrice: true,
    },
  ];

  const plans = isGeoMode ? geoPlans : conversionPlans;

  return (
    <section id="pricing" className="py-24 px-6 bg-obsidian border-t border-surgical">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <span className={`font-mono text-xs font-bold uppercase tracking-widest mb-4 block ${activeColor}`}>
            Transparent Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-black mb-6 text-clinic">
            Select your diagnostic depth.
          </h2>
          <p className="text-lg text-data max-w-2xl mx-auto">
            {isGeoMode
              ? "No hidden fees. Every plan includes deep GEO diagnosis and AI search readiness metrics."
              : "No hidden fees. Every plan includes psychological conversion analysis and AI search readiness."}
          </p>
        </div>

        {checkoutError && (
          <div className="text-center mb-8">
            <p className="text-sm text-warning font-mono">{checkoutError}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`bg-[#0A0A0A] p-8 rounded-lg relative flex flex-col transition-colors duration-300 ${plan.popular ? `border-2 ${activeBorder} shadow-[0_0_30px_rgba(0,0,0,0.5)] scale-105 z-10` : "border border-surgical hover:bg-[#111111]"}`}
            >
              {plan.popular && (
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 ${activeBg} text-black text-xs font-mono font-bold uppercase tracking-widest px-4 py-1.5 rounded-full flex items-center gap-1.5`}>
                  <Star className="w-3 h-3" /> {plan.popularLabel}
                </div>
              )}

              {/* Launch price badge */}
              {plan.isLaunchPrice && (
                <div className="flex items-center gap-1.5 mb-3 opacity-80">
                  <Lock className={`w-3 h-3 ${activeColor}`} />
                  <span className={`text-xs font-mono tracking-wider uppercase ${activeColor}`}>
                    Launch Pricing Active
                  </span>
                </div>
              )}

              <h3 className="text-xl font-bold mb-2 text-clinic">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-black text-clinic">
                  {plan.price === 0 ? "Free" : formatPrice(plan.price)}
                </span>
                {plan.isMonthly && (
                  <span className="text-sm text-data font-mono">/mo</span>
                )}
              </div>
              <p className="text-sm text-data mb-8 min-h-[40px]">
                {plan.description}
              </p>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-clinic">
                    <Check className={`w-4 h-4 ${activeColor} shrink-0 mt-0.5`} />
                    <span className="leading-snug opacity-90">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Main CTA */}
              {plan.ctaAction === "free" ? (
                <a
                  href="#hero-cta"
                  className={`w-full block text-center font-bold px-6 py-3 rounded-md transition-all duration-200 ${
                    plan.popular ? activeBtn : `${activeOutline} bg-transparent`
                  }`}
                >
                  {plan.cta}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubscriptionCheckout(plan.ctaAction)}
                  disabled={checkoutLoading === plan.ctaAction}
                  className={`w-full flex items-center justify-center gap-2 font-bold px-6 py-3 rounded-md transition-all duration-200 ${
                    plan.popular ? activeBtn : `${activeOutline} bg-transparent`
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {checkoutLoading === plan.ctaAction
                    ? "Processing..."
                    : plan.cta}
                  {checkoutLoading !== plan.ctaAction && (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Refund text */}
              {plan.refundText && (
                <p className="text-xs text-data font-mono uppercase tracking-widest mt-4 text-center opacity-60">
                  {plan.refundText}
                </p>
              )}

              {/* Upsell CTA */}
              {plan.upsellCta && plan.upsellTarget && (
                <button
                  type="button"
                  onClick={() => handleSubscriptionCheckout(plan.upsellTarget!)}
                  disabled={checkoutLoading === plan.upsellTarget}
                  className={`mt-4 text-xs ${activeColor} hover:underline text-center w-full disabled:opacity-60 font-mono tracking-wide`}
                >
                  {checkoutLoading === plan.upsellTarget
                    ? "Processing..."
                    : plan.upsellCta}
                </button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom callout strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`mt-16 bg-[#0A0A0A] border ${activeBorder} rounded-lg p-8 max-w-3xl mx-auto text-center`}
        >
          <p className={`text-xs font-mono font-bold uppercase tracking-widest mb-3 ${activeColor}`}>
            {isGeoMode ? "GEO + Conversion" : "AI Search Readiness Included"}
          </p>
          <h3 className="text-xl font-bold mb-3 text-clinic">
            {isGeoMode
              ? "AI visibility and human conversion. Both covered."
              : "Built for humans. Ready for AI."}
          </h3>
          <p className="text-sm text-data leading-relaxed">
            {isGeoMode
              ? "Every GEO audit includes a conversion alignment check — so you know your page can be found by AI search and converts when visitors arrive."
              : "Every audit now includes an AI Search Readiness check — so you know whether your page is structured to be found, understood, and cited by AI search engines."}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
