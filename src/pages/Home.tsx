import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Star, Lock } from "lucide-react";

type PricingMode = "conversion" | "geo" | "both";

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div className="flex-1 px-5 py-4 text-center">
    <div className="text-2xl md:text-3xl font-bold tracking-tight text-clinic">{value}</div>
    <div className="mt-1 text-xs font-mono tracking-widest uppercase text-data/70">{label}</div>
  </div>
);

const SectionTitle = ({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: string;
  sub?: string;
}) => (
  <div className="max-w-3xl">
    <div className="text-data/70 font-mono text-xs tracking-widest uppercase">{kicker}</div>
    <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight text-clinic">{title}</h2>
    {sub ? <p className="mt-4 text-data text-base md:text-lg">{sub}</p> : null}
  </div>
);

const Logo = () => (
  <Link to="/" className="flex items-center gap-2 group" style={{ textDecoration: "none" }}>
    <span className="text-xl font-black tracking-tighter text-clinic group-hover:opacity-80 transition-opacity">
      ConversionDoc
    </span>
    <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
      <path
        d="M2 12H10L13 4L18 20L22 10L25 14H30"
        stroke="#06B6D4"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M30 14L34 8L38 4"
        stroke="#D946EF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M34 4H38V8"
        stroke="#D946EF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </Link>
);

type PricingPlan = {
  name: string;
  price: number;
  isMonthly?: boolean;
  description: string;
  features: string[];
  cta: string;
  ctaLink: string;
  popular?: boolean;
  popularLabel?: string;
  isLaunchPrice?: boolean;
  accent: "pulse" | "neon" | "both";
};

const Home = () => {
  const [mode, setMode] = useState<PricingMode>("conversion");

  const tabClass = (active: boolean) =>
    [
      "px-4 py-2 rounded-md text-sm font-medium transition-colors",
      active ? "text-black" : "text-data",
      active ? "bg-[#06B6D4]" : "bg-transparent hover:bg-white/5",
    ].join(" ");

  const tabClassMagenta = (active: boolean) =>
    [
      "px-4 py-2 rounded-md text-sm font-medium transition-colors",
      active ? "text-white" : "text-data",
      active ? "bg-[#D946EF]" : "bg-transparent hover:bg-white/5",
    ].join(" ");

  const tabClassBoth = (active: boolean) =>
    [
      "px-4 py-2 rounded-md text-sm font-medium transition-colors",
      active ? "text-white" : "text-data",
      active ? "" : "bg-transparent hover:bg-white/5",
    ].join(" ");

  const bothActiveStyle = useMemo(
    () =>
      mode === "both"
        ? { background: "linear-gradient(90deg, #06B6D4, #D946EF)" }
        : undefined,
    [mode]
  );

  const conversionPlans: PricingPlan[] = [
    {
      name: "Free Audit",
      price: 0,
      description: "Perfect for identifying quick wins.",
      features: [
        "7-Pillar Conversion Analysis",
        "Overall Conversion Score",
        "Top 3 Critical Fixes",
        "Page-Type Detection",
        "Results in 60 Seconds",
      ],
      cta: "Start Free",
      ctaLink: "/conversion-audit",
      accent: "pulse",
    },
    {
      name: "Full Diagnosis",
      price: 149,
      description: "One-time. Comprehensive analysis.",
      features: [
        "Full 7-Pillar Breakdown",
        "Page-Type Intelligence (Home / Landing / Article)",
        "Rewritten Copy (Every Section)",
        "Article Rewrites with TL;DR + FAQ",
        "Brand-Matched Mockup (PNG + HTML)",
        "Ready-to-Use Code",
      ],
      cta: "Get Full Diagnosis",
      ctaLink: "/conversion-audit",
      accent: "pulse",
    },
    {
      name: "Starter Pro",
      price: 99,
      isMonthly: true,
      description: "20 audits/mo. For freelancers.",
      features: [
        "Everything in Full Diagnosis",
        "20 Full Audits Per Month",
        "Run Audits on Client Sites",
        "Page-Type Intelligent Mockups",
        "White Label Reports",
        "Priority Support",
      ],
      cta: "Start Starter Pro",
      ctaLink: "/conversion-audit",
      popular: true,
      popularLabel: "Best Value",
      isLaunchPrice: true,
      accent: "pulse",
    },
    {
      name: "Agency Pro",
      price: 199,
      isMonthly: true,
      description: "Unlimited. For agencies.",
      features: [
        "Everything in Starter Pro",
        "Unlimited Full Audits",
        "Audit All Client Sites",
        "Page-Type Intelligent Mockups",
        "White Label Reports",
        "Priority Support",
      ],
      cta: "Start Agency Pro",
      ctaLink: "/conversion-audit",
      isLaunchPrice: true,
      accent: "pulse",
    },
  ];

  const geoPlans: PricingPlan[] = [
    {
      name: "Free GEO Audit",
      price: 0,
      description: "See how visible your page is to AI.",
      features: [
        "AI Search Readiness Score",
        "7-Dimension GEO Analysis",
        "Top 3 AI Visibility Fixes",
        "Page-Type Detection",
        "Results in 60 Seconds",
      ],
      cta: "Start Free",
      ctaLink: "/geo-audit",
      accent: "neon",
    },
    {
      name: "Full GEO Audit",
      price: 149,
      description: "One-time. Full AI visibility diagnosis.",
      features: [
        "Full GEO + Conversion Audit",
        "JSON-LD Schema (Article / Product / Org)",
        "AI-Optimised Content Restructure",
        "TL;DR + FAQ Generation",
        "Brand-Matched Mockup (PNG + HTML)",
        "Ready-to-Use Code",
      ],
      cta: "Get Full GEO Audit",
      ctaLink: "/geo-audit",
      accent: "neon",
    },
    {
      name: "GEO Starter Pro",
      price: 99,
      isMonthly: true,
      description: "20 GEO audits/mo. For freelancers.",
      features: [
        "Everything in Full GEO Audit",
        "20 Full GEO Audits Per Month",
        "JSON-LD Schema on Every Audit",
        "Audit Client Sites",
        "White Label Reports",
        "Priority Support",
      ],
      cta: "Start GEO Starter Pro",
      ctaLink: "/geo-audit",
      popular: true,
      popularLabel: "Best Value",
      isLaunchPrice: true,
      accent: "neon",
    },
    {
      name: "GEO Agency Pro",
      price: 199,
      isMonthly: true,
      description: "Unlimited GEO. For agencies.",
      features: [
        "Everything in GEO Starter Pro",
        "Unlimited GEO Audits",
        "JSON-LD Schema on Every Audit",
        "Audit All Client Sites",
        "White Label Reports",
        "Priority Support",
      ],
      cta: "Start GEO Agency Pro",
      ctaLink: "/geo-audit",
      isLaunchPrice: true,
      accent: "neon",
    },
  ];

  const bothPlans: PricingPlan[] = [
    {
      name: "Both Free Scans",
      price: 0,
      description: "Run both diagnostics free.",
      features: [
        "Free Conversion Scan",
        "Free GEO AI Scan",
        "Page-Type Detection",
        "Top 3 Fixes from Each Tool",
        "Results in 60 Seconds",
      ],
      cta: "Start Free",
      ctaLink: "/conversion-audit",
      accent: "both",
    },
    {
      name: "Full Stack Audit",
      price: 199,
      description: "One-time. Both full diagnoses.",
      features: [
        "Full Conversion Diagnosis (£149 value)",
        "Full GEO Audit (£149 value)",
        "Page-Type Intelligence",
        "JSON-LD Schema + Mockups",
        "TL;DR + FAQ for Articles",
        "All Code Ready to Deploy",
      ],
      cta: "Get Full Stack",
      ctaLink: "/conversion-audit",
      accent: "both",
    },
    {
      name: "Both Starter",
      price: 149,
      isMonthly: true,
      description: "20 audits/mo each tool.",
      features: [
        "20 Conversion Audits/mo",
        "20 GEO Audits/mo",
        "Both Tools Combined",
        "JSON-LD Schema Included",
        "White Label Reports",
        "Priority Support",
      ],
      cta: "Start Both Starter",
      ctaLink: "/conversion-audit",
      isLaunchPrice: true,
      accent: "both",
    },
    {
      name: "Agency Max",
      price: 279,
      isMonthly: true,
      description: "Unlimited. Both tools. Full stack.",
      features: [
        "Unlimited Conversion Audits",
        "Unlimited GEO Audits",
        "Full GEO + AI Search Reports",
        "JSON-LD Schema Generation",
        "White Label Reports",
        "Multi-Tool Dashboard",
        "Priority Support",
      ],
      cta: "Start Agency Max",
      ctaLink: "/conversion-audit",
      popular: true,
      popularLabel: "Full Stack",
      isLaunchPrice: true,
      accent: "both",
    },
  ];

  const activePlans =
    mode === "conversion" ? conversionPlans : mode === "geo" ? geoPlans : bothPlans;

  const getAccentColor = (accent: "pulse" | "neon" | "both") => {
    if (accent === "pulse") return "#06B6D4";
    if (accent === "neon") return "#D946EF";
    return "#FFFFFF";
  };

  const getAccentBorder = (accent: "pulse" | "neon" | "both", popular: boolean) => {
    if (!popular) return "border-white/10";
    if (accent === "pulse") return "border-[#06B6D4]/50";
    if (accent === "neon") return "border-[#D946EF]/50";
    return "border-white/30";
  };

  const getAccentBadgeStyle = (accent: "pulse" | "neon" | "both") => {
    if (accent === "pulse") return { background: "#06B6D4", color: "#000" };
    if (accent === "neon") return { background: "#D946EF", color: "#fff" };
    return { background: "linear-gradient(90deg, #06B6D4, #D946EF)", color: "#fff" };
  };

  const getAccentBtnClass = (accent: "pulse" | "neon" | "both", popular: boolean) => {
    if (popular) {
      if (accent === "pulse") return "btn-pulse";
      if (accent === "neon") return "btn-neon";
      return "";
    }
    if (accent === "pulse") return "border border-[#06B6D4] text-[#06B6D4] hover:bg-[#06B6D4]/10";
    if (accent === "neon") return "border border-[#D946EF] text-[#D946EF] hover:bg-[#D946EF]/10";
    return "border border-white/30 text-white hover:bg-white/10";
  };

  const getBothGradientBtnStyle = (accent: "pulse" | "neon" | "both", popular: boolean) => {
    if (accent === "both" && popular) {
      return { background: "linear-gradient(90deg, #06B6D4, #D946EF)", color: "#fff" };
    }
    return undefined;
  };

  return (
    <div className="min-h-screen bg-obsidian text-clinic">
      {/* Top glow */}
      <div
        className="pointer-events-none fixed inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(800px 500px at 50% 10%, rgba(6,182,212,0.10), transparent 60%), radial-gradient(700px 450px at 70% 18%, rgba(217,70,239,0.09), transparent 60%)",
        }}
      />

      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-obsidian/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Logo />

          <nav className="hidden md:flex items-center gap-7 text-xs font-mono font-bold uppercase tracking-widest text-data">
            <a href="#tools" className="hover:text-clinic transition-colors">Tools</a>
            <a href="#output" className="hover:text-clinic transition-colors">Output</a>
            <a href="#pricing" className="hover:text-clinic transition-colors">Pricing</a>
            <a href="https://conversiondoc.co.uk/blog" className="hover:text-clinic transition-colors">Blog</a>
            <Link to="/newsletter" className="hover:text-clinic transition-colors">Newsletter</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/conversion-audit" className="btn-pulse hidden sm:inline-block">
              Run Conversion Scan
            </Link>
            <Link to="/geo-audit" className="btn-neon hidden sm:inline-block">
              Run GEO AI Scan
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-6 pt-16 md:pt-24 pb-12 md:pb-16">
          <div className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono tracking-widest uppercase text-data">
            Precision diagnostic platform
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#06B6D4" }} />
          </div>

          <h1 className="mt-6 text-4xl md:text-7xl font-bold tracking-tight leading-[1.0]">
            Your page is{" "}
            <span style={{ color: "#06B6D4" }}>leaking conversions</span>.
            <br />
            AI can't{" "}
            <span style={{ color: "#D946EF" }}>retrieve or cite it</span>.
          </h1>

          <p className="mt-5 max-w-2xl text-data text-base md:text-lg">
            Run a 60-second scan. Get a scored breakdown and a prioritised list of what's broken — with the exact changes to make.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Link to="/conversion-audit" className="btn-pulse text-center">
              Run Conversion Scan — Free
            </Link>
            <Link to="/geo-audit" className="btn-neon text-center">
              Run GEO AI Scan — Free
            </Link>
            <a
              href="#output"
              className="inline-flex items-center justify-center rounded-md border border-white/15 px-5 py-3 text-sm font-medium text-data hover:text-clinic hover:border-white/25 transition-colors"
            >
              See real output
            </a>
          </div>

          <div className="mt-10 border border-white/10 rounded-lg bg-[#0A0A0A] overflow-hidden">
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10">
              <Stat value="60s" label="to results" />
              <Stat value="14" label="checks across both tools" />
              <Stat value="3" label="critical fixes surfaced" />
              <Stat value="£0" label="to start" />
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM STRIP */}
      <section className="border-y border-white/10 bg-[#070707]">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-16 grid md:grid-cols-2 gap-10 items-start">
          <div>
            <div className="text-data/70 font-mono text-xs tracking-widest uppercase">The problem</div>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">Two failures. One page.</h2>
            <p className="mt-4 text-data">
              People don't click when the offer is unclear or untrusted.
              <br />
              AI doesn't cite you when it can't extract answers and entities.
              <br />
              Most tools only see one layer. ConversionDoc scans both.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-lg border border-white/10 bg-[#0A0A0A] p-5">
              <div className="text-xs font-mono tracking-widest uppercase text-data/70">Finding</div>
              <p className="mt-2 text-data">
                Your headline explains what you do. Not what they get. That's why they bounce.{" "}
                <span className="text-clinic">Rewrite it to lead with the outcome.</span>
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0A0A0A] p-5">
              <div className="text-xs font-mono tracking-widest uppercase text-data/70">Finding</div>
              <p className="mt-2 text-data">
                AI engines retrieve pages that answer questions directly.{" "}
                <span className="text-clinic">No Q&A structure means no citations.</span>
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0A0A0A] p-5">
              <div className="text-xs font-mono tracking-widest uppercase text-data/70">Finding</div>
              <p className="mt-2 text-data">
                Your CTA exists. It isn't earning the click.{" "}
                <span className="text-clinic">The page doesn't build enough proof.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TOOLS */}
      <section id="tools" className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <SectionTitle
          kicker="Diagnostic tools"
          title="Two tools. One platform."
          sub="Pick the problem you have. Run both when you want the full picture."
        />

        <div className="mt-10 grid md:grid-cols-2 gap-5">
          <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-7 hover:border-white/20 transition-colors">
            <div className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: "#06B6D4" }}>
              Human layer — conversion
            </div>
            <h3 className="text-2xl font-bold tracking-tight">Conversion Scan</h3>
            <p className="mt-3 text-data">
              Finds exactly what stops real people from taking action. Scores the 7 conversion pillars and tells you what to change, where, and why.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-data">
              <li>→ Overall conversion score</li>
              <li>→ Top 3 critical fixes</li>
              <li>→ Clarity, trust, objections, action, and AI alignment</li>
            </ul>
            <div className="mt-6">
              <Link to="/conversion-audit" className="btn-pulse inline-block w-full text-center">
                Run Conversion Scan — Free →
              </Link>
              <div className="mt-2 text-xs text-data/70">Free scan · £149 full diagnosis · £99/mo Pro</div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-7 hover:border-white/20 transition-colors">
            <div className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: "#D946EF" }}>
              Machine layer — GEO AI search
            </div>
            <h3 className="text-2xl font-bold tracking-tight">GEO AI Scan</h3>
            <p className="mt-3 text-data">
              Finds why AI search engines aren't retrieving or citing your page. Scores 7 GEO dimensions and gives structural fixes AI can extract.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-data">
              <li>→ AI search readiness score</li>
              <li>→ Top 3 visibility fixes</li>
              <li>→ Topic clarity, answerability, structure, authority, entities</li>
            </ul>
            <div className="mt-6">
              <Link to="/geo-audit" className="btn-neon inline-block w-full text-center">
                Run GEO AI Scan — Free →
              </Link>
              <div className="mt-2 text-xs text-data/70">Free scan · £149 full audit · £99/mo Pro</div>
            </div>
          </div>
        </div>
      </section>

      {/* OUTPUT */}
      <section id="output" className="mx-auto max-w-6xl px-6 pb-16 md:pb-20">
        <SectionTitle
          kicker="What you get"
          title="Real output. Real specificity."
          sub="Scored, prioritised, and written so you can implement it."
        />

        <div className="mt-10 grid md:grid-cols-2 gap-5">
          <div className="rounded-xl border border-white/10 bg-[#0A0A0A] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="text-xs font-mono tracking-widest uppercase" style={{ color: "#06B6D4" }}>
                Conversion scan — example.com
              </div>
              <div className="rounded-md px-3 py-1 text-sm font-bold" style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>
                62/100
              </div>
            </div>
            <div className="px-6 py-4 space-y-2 text-sm text-data border-b border-white/10">
              <div className="flex items-center justify-between">
                <span>Trust architecture</span>
                <span className="font-mono" style={{ color: "#E11D48" }}>3/10</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Hook strength</span>
                <span className="font-mono" style={{ color: "#E11D48" }}>4/10</span>
              </div>
              <div className="flex items-center justify-between">
                <span>AI alignment</span>
                <span className="font-mono" style={{ color: "#E11D48" }}>4/10</span>
              </div>
            </div>
            <div className="px-6 py-5 bg-white/5">
              <div className="text-xs font-mono tracking-widest uppercase" style={{ color: "#06B6D4" }}>
                Top finding
              </div>
              <p className="mt-2 text-sm text-data leading-relaxed">
                <span className="text-clinic font-semibold">No proof above the fold.</span>{" "}
                Visitors don't believe the claim because nothing confirms it.{" "}
                <span className="text-clinic">Add 3 customer outcomes above the fold.</span>
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0A0A0A] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="text-xs font-mono tracking-widest uppercase" style={{ color: "#D946EF" }}>
                GEO AI scan — example.com
              </div>
              <div className="rounded-md px-3 py-1 text-sm font-bold" style={{ background: "rgba(225,29,72,0.15)", color: "#E11D48" }}>
                34/100
              </div>
            </div>
            <div className="px-6 py-4 space-y-2 text-sm text-data border-b border-white/10">
              <div className="flex items-center justify-between">
                <span>Answerability</span>
                <span className="font-mono" style={{ color: "#E11D48" }}>2/10</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Structure &amp; hierarchy</span>
                <span className="font-mono" style={{ color: "#E11D48" }}>3/10</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Content completeness</span>
                <span className="font-mono" style={{ color: "#E11D48" }}>3/10</span>
              </div>
            </div>
            <div className="px-6 py-5 bg-white/5">
              <div className="text-xs font-mono tracking-widest uppercase" style={{ color: "#D946EF" }}>
                Top finding
              </div>
              <p className="mt-2 text-sm text-data leading-relaxed">
                <span className="text-clinic font-semibold">The page answers no questions.</span>{" "}
                AI engines can't extract a quotable answer.{" "}
                <span className="text-clinic">Add a 5-question FAQ.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="border-t border-white/10 bg-[#070707]">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <SectionTitle
            kicker="Pricing"
            title="Start free. Go deeper when you need to."
            sub="Both free scans are useful. Paid is for full breakdowns, rewritten sections, mockups, and code."
          />

          <div className="mt-8 inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#0A0A0A] p-1">
            <button
              className={tabClass(mode === "conversion")}
              onClick={() => setMode("conversion")}
              style={mode === "conversion" ? { background: "#06B6D4" } : undefined}
            >
              Conversion
            </button>
            <button className={tabClassMagenta(mode === "geo")} onClick={() => setMode("geo")}>
              GEO AI
            </button>
            <button className={tabClassBoth(mode === "both")} onClick={() => setMode("both")} style={bothActiveStyle}>
              Both tools
            </button>
          </div>

          {/* PRICING CARDS */}
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {activePlans.map((plan, idx) => {
              const accentColor = getAccentColor(plan.accent);
              const borderClass = getAccentBorder(plan.accent, !!plan.popular);
              const badgeStyle = getAccentBadgeStyle(plan.accent);
              const btnClass = getAccentBtnClass(plan.accent, !!plan.popular);
              const btnStyle = getBothGradientBtnStyle(plan.accent, !!plan.popular);

              return (
                <div
                  key={idx}
                  className={`relative rounded-xl border ${borderClass} bg-[#0A0A0A] p-6 flex flex-col ${plan.popular ? "scale-[1.02] z-10" : ""}`}
                >
                  {plan.popular && plan.popularLabel && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5"
                      style={badgeStyle}
                    >
                      <Star className="w-3 h-3" /> {plan.popularLabel}
                    </div>
                  )}

                  {plan.isLaunchPrice && (
                    <div className="flex items-center gap-1.5 mb-3 opacity-80">
                      <Lock className="w-3 h-3" style={{ color: accentColor }} />
                      <span className="text-[10px] font-mono tracking-wider uppercase" style={{ color: accentColor }}>
                        Launch Pricing
                      </span>
                    </div>
                  )}

                  <h3 className="text-lg font-bold mb-2 text-clinic">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-3xl font-black text-clinic">
                      {plan.price === 0 ? "Free" : `£${plan.price}`}
                    </span>
                    {plan.isMonthly && (
                      <span className="text-xs text-data font-mono">/mo</span>
                    )}
                  </div>
                  <p className="text-xs text-data mb-5 min-h-[32px]">
                    {plan.description}
                  </p>

                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-clinic">
                        <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: accentColor }} />
                        <span className="leading-snug opacity-90">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={plan.ctaLink}
                    className={`w-full block text-center text-sm font-bold px-4 py-2.5 rounded-md transition-all duration-200 ${btnClass}`}
                    style={btnStyle}
                  >
                    {plan.cta}
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center text-xs text-data/70 font-mono tracking-wider">
            All paid plans include refund guarantee — if we find fewer than 5 issues, you get your money back.
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <SectionTitle
          kicker="Guarantee + fit"
          title="Specific output, or you don't pay."
          sub="Paid scans are covered. If the scan finds fewer than 5 issues, you get a full refund."
        />

        <div className="mt-10 grid md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
            <div className="text-sm font-semibold text-clinic">60-second results</div>
            <p className="mt-2 text-sm text-data">Paste a URL. Get the score and the fixes.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
            <div className="text-sm font-semibold text-clinic">No generic advice</div>
            <p className="mt-2 text-sm text-data">Findings name the problem and the exact change.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
            <div className="text-sm font-semibold text-clinic">Agency-ready</div>
            <p className="mt-2 text-sm text-data">White label data maps and client scanning.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
            <div className="text-sm font-semibold text-clinic">Built for AI retrieval</div>
            <p className="mt-2 text-sm text-data">Structure that gets extracted, summarised, and cited.</p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-white/10 bg-[#070707]">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20 text-center">
          <h2 className="text-3xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            See what's wrong.
            <br />
            <span style={{ color: "#06B6D4" }}>Fix it.</span>{" "}
            <span style={{ color: "#D946EF" }}>Convert.</span>
          </h2>
          <p className="mt-4 text-data">Both free scans take 60 seconds. No account needed.</p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/conversion-audit" className="btn-pulse text-center">
              Run Conversion Scan — Free
            </Link>
            <Link to="/geo-audit" className="btn-neon text-center">
              Run GEO AI Scan — Free
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 mx-auto max-w-6xl px-6 py-10 text-sm text-data flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <Logo />
        <div className="flex flex-wrap gap-4">
          <Link to="/conversion-audit" className="hover:text-clinic">Conversion</Link>
          <Link to="/geo-audit" className="hover:text-clinic">GEO AI</Link>
          <a href="https://conversiondoc.co.uk/blog" className="hover:text-clinic">Blog</a>
          <Link to="/newsletter" className="hover:text-clinic">Newsletter</Link>
          <Link to="/privacy" className="hover:text-clinic">Privacy</Link>
          <Link to="/terms" className="hover:text-clinic">Terms</Link>
          <Link to="/refund" className="hover:text-clinic">Refund</Link>
          <Link to="/contact" className="hover:text-clinic">Contact</Link>
        </div>
        <div>© {new Date().getFullYear()} ConversionDoc</div>
      </footer>
    </div>
  );
};

export default Home;
