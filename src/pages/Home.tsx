import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

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

      {/* NAV (simple, homepage-specific) */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-obsidian/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="text-clinic">ConversionDoc</span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm text-data">
            <a href="#tools" className="hover:text-clinic">Tools</a>
            <a href="#output" className="hover:text-clinic">Output</a>
            <a href="#pricing" className="hover:text-clinic">Pricing</a>
            <Link to="/tools" className="hover:text-clinic">Tool selector</Link>
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
            AI can’t{" "}
            <span style={{ color: "#D946EF" }}>retrieve or cite it</span>.
          </h1>

          <p className="mt-5 max-w-2xl text-data text-base md:text-lg">
            Run a 60-second scan. Get a scored breakdown and a prioritised list of what’s
            broken — with the exact changes to make.
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
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
              Two failures. One page.
            </h2>
            <p className="mt-4 text-data">
              People don’t click when the offer is unclear or untrusted.
              <br />
              AI doesn’t cite you when it can’t extract answers and entities.
              <br />
              Most tools only see one layer. ConversionDoc scans both.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-lg border border-white/10 bg-[#0A0A0A] p-5">
              <div className="text-xs font-mono tracking-widest uppercase text-data/70">Finding</div>
              <p className="mt-2 text-data">
                Your headline explains what you do. Not what they get. That’s why they bounce.
                <span className="text-clinic"> Rewrite it to lead with the outcome.</span>
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#0A0A0A] p-5">
              <div className="text-xs font-mono tracking-widest uppercase text-data/70">Finding</div>
              <p className="mt-2 text-data">
                AI engines retrieve pages that answer questions directly.
                <span className="text-clinic"> No Q&A structure means no citations.</span>
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#0A0A0A] p-5">
              <div className="text-xs font-mono tracking-widest uppercase text-data/70">Finding</div>
              <p className="mt-2 text-data">
                Your CTA exists. It isn’t earning the click.
                <span className="text-clinic"> The page doesn’t build enough proof.</span>
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
          {/* Conversion */}
          <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-7 hover:border-white/20 transition-colors">
            <div className="text-pulse font-mono text-xs tracking-widest uppercase mb-3">
              Human layer — conversion
            </div>
            <h3 className="text-2xl font-bold tracking-tight">Conversion Scan</h3>
            <p className="mt-3 text-data">
              Finds exactly what stops real people from taking action. Scores the 7 conversion
              pillars and tells you what to change, where, and why.
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
              <div className="mt-2 text-xs text-data/70">
                Free scan · £149 full diagnosis · £99/mo Pro
              </div>
            </div>
          </div>

          {/* GEO */}
          <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-7 hover:border-white/20 transition-colors">
            <div className="text-neon font-mono text-xs tracking-widest uppercase mb-3">
              Machine layer — GEO AI search
            </div>
            <h3 className="text-2xl font-bold tracking-tight">GEO AI Scan</h3>
            <p className="mt-3 text-data">
              Finds why AI search engines aren’t retrieving or citing your page. Scores 7 GEO
              dimensions and gives structural fixes AI can extract.
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
              <div className="mt-2 text-xs text-data/70">
                Free scan · £149 full audit · £99/mo Pro
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OUTPUT DEMO */}
      <section id="output" className="mx-auto max-w-6xl px-6 pb-16 md:pb-20">
        <SectionTitle
          kicker="What you get"
          title="Real output. Real specificity."
          sub="Scored, prioritised, and written so you can implement it."
        />

        <div className="mt-10 grid md:grid-cols-2 gap-5">
          {/* Conversion card */}
          <div className="rounded-xl border border-white/10 bg-[#0A0A0A] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="text-xs font-mono tracking-widest uppercase" style={{ color: "#06B6D4" }}>
                Conversion scan — example.com
              </div>
              <div className="rounded-md px-3 py-1 text-sm font-bold"
                   style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>
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
                <span className="text-clinic font-semibold">No proof above the fold.</span> Visitors
                don’t believe the claim because nothing confirms it.
                <span className="text-clinic"> Add 3 customer outcomes above the fold.</span>
              </p>
            </div>
          </div>

          {/* GEO card */}
          <div className="rounded-xl border border-white/10 bg-[#0A0A0A] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="text-xs font-mono tracking-widest uppercase" style={{ color: "#D946EF" }}>
                GEO AI scan — example.com
              </div>
              <div className="rounded-md px-3 py-1 text-sm font-bold"
                   style={{ background: "rgba(225,29,72,0.15)", color: "#E11D48" }}>
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
                <span className="text-clinic font-semibold">The page answers no questions.</span> AI
                engines can’t extract a quotable answer.
                <span className="text-clinic"> Add a 5-question FAQ.</span>
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
            <button
              className={tabClassMagenta(mode === "geo")}
              onClick={() => setMode("geo")}
            >
              GEO AI
            </button>
            <button
              className={tabClassBoth(mode === "both")}
              onClick={() => setMode("both")}
              style={bothActiveStyle}
            >
              Both tools
            </button>
          </div>

          {/* Cards */}
          {mode === "conversion" && (
            <div className="mt-10 grid md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
                <div className="text-xs font-mono tracking-widest uppercase" style={{ color: "#06B6D4" }}>
                  Free
                </div>
                <div className="mt-2 text-xl font-bold">Free scan</div>
                <div className="mt-3 text-3xl font-bold">£0</div>
                <ul className="mt-4 space-y-2 text-sm text-data">
                  <li>→ 7-pillar scan</li>
                  <li>→ Overall score</li>
                  <li>→ Top 3 fixes</li>
                  <li>→ AI readiness signals</li>
                </ul>
                <Link to="/conversion-audit" className="mt-5 inline-block w-full text-center rounded-md border border-white/15 px-4 py-2 text-sm text-data hover:text-clinic hover:border-white/25 transition-colors">
                  Start free
                </Link>
              </div>

              <div
                className="rounded-xl border border-white/10 p-6"
                style={{ borderColor: "rgba(6,182,212,0.35)", background: "rgba(6,182,212,0.05)" }}
              >
                <div className="text-xs font-mono tracking-widest uppercase" style={{ color: "#06B6D4" }}>
                  One-time
                </div>
                <div className="mt-2 text-xl font-bold">Full diagnosis</div>
                <div className="mt-3 text-3xl font-bold">£149</div>
                <ul className="mt-4 space-y-2 text-sm text-data">
                  <li>→ Every issue identified</li>
                  <li>→ Rewritten copy (every section)</li>
                  <li>→ Brand-matched mockup (PNG)</li>
                  <li>→ Ready-to-use code</li>
                  <li>→ Money-back if fewer than 5 issues found</li>
                </ul>
                <Link to="/conversion-audit" className="btn-pulse mt-5 inline-block w-full text-center">
                  Get full diagnosis
                </Link>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
                <div className="text-xs font-mono tracking-widest uppercase" style={{ color: "#06B6D4" }}>
                  Monthly
                </div>
                <div className="mt-2 text-xl font-bold">Starter Pro</div>
                <div className="mt-3 text-3xl font-bold">£99<span className="text-base text-data">/mo</span></div>
                <ul className="mt-4 space-y-2 text-sm text-data">
                  <li>→ 20 full scans/month</li>
                  <li>→ Run scans on client sites</li>
                  <li>→ White label data maps</li>
                  <li>→ Priority support</li>
                </ul>
                <Link to="/conversion-audit" className="mt-5 inline-block w-full text-center rounded-md border border-white/15 px-4 py-2 text-sm text-data hover:text-clinic hover:border-white/25 transition-colors">
                  Start Starter Pro
                </Link>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
                <div className="text-xs font-mono tracking-widest uppercase" style={{ color: "#06B6D4" }}>
                  Agency
                </div>
                <div className="mt-2 text-xl font-bold">Agency Pro</div>
                <div className="mt-3 text-3xl font-bold">£199<span className="text-base text-data">/mo</span></div>
                <ul className="mt-4 space-y-2 text-sm text-data">
                  <li>→ Unlimited scans</li>
                  <li>→ Scan all client sites</li>
                  <li>→ White label data maps</li>
                  <li>→ Priority support</li>
                </ul>
                <Link to="/conversion-audit" className="mt-5 inline-block w-full text-center rounded-md border border-white/15 px-4 py-2 text-sm text-data hover:text-clinic hover:border-white/25 transition-colors">
                  Start Agency Pro
                </Link>
              </div>
            </div>
          )}

          {mode === "geo" && (
            <div className="mt-10 grid md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
                <div className="text-xs font-mono tracking-widest uppercase" style={{ color: "#D946EF" }}>
                  Free
                </div>
                <div className="mt-2 text-xl font-bold">Free GEO scan</div>
                <div className="mt-3 text-3xl font-bold">£0</div>
                <ul className="mt-4 space-y-2 text-sm text-data">
                  <li>→ AI readiness score</li>
                  <li>→ 7-dimension GEO scan</li>
                  <li>→ Top 3 visibility fixes</li>
                  <li>→ Conversion health check</li>
                </ul>
                <Link to="/geo-audit" className="mt-5 inline-block w-full text-center rounded-md border border-white/15 px-4 py-2 text-sm text-data hover:text-clinic hover:border-white/25 transition-colors">
                  Start free
                </Link>
              </div>

              <div
                className="rounded-xl border border-white/10 p-6"
                style={{ borderColor: "rgba(217,70,239,0.40)", background: "rgba(217,70,239,0.05)" }}
              >
                <div className="text-xs font-mono tracking-widest uppercase" style={{ color: "#D946EF" }}>
                  One-time
                </div>
                <div className="mt-2 text-xl font-bold">Full GEO audit</div>
                <div className="mt-3 text-3xl font-bold">£149</div>
                <ul className="mt-4 space-y-2 text-sm text-data">
                  <li>→ Every visibility gap identified</li>
                  <li>→ Structured content fixes</li>
                  <li>→ Brand-matched mockup (PNG)</li>
                  <li>→ Ready-to-use code</li>
                  <li>→ Money-back if fewer than 5 issues found</li>
                </ul>
                <Link to="/geo-audit" className="btn-neon mt-5 inline-block w-full text-center">
                  Get full GEO audit
                </Link>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
                <div className="text-xs font-mono tracking-widest uppercase" style={{ color: "#D946EF" }}>
                  Monthly
                </div>
                <div className="mt-2 text-xl font-bold">GEO Starter Pro</div>
                <div className="mt-3 text-3xl font-bold">£99<span className="text-base text-data">/mo</span></div>
                <ul className="mt-4 space-y-2 text-sm text-data">
                  <li>→ 20 full scans/month</li>
                  <li>→ Scan client sites</li>
                  <li>→ White label data maps</li>
                  <li>→ Priority support</li>
                </ul>
                <Link to="/geo-audit" className="mt-5 inline-block w-full text-center rounded-md border border-white/15 px-4 py-2 text-sm text-data hover:text-clinic hover:border-white/25 transition-colors">
                  Start GEO Starter Pro
                </Link>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
                <div className="text-xs font-mono tracking-widest uppercase" style={{ color: "#D946EF" }}>
                  Agency
                </div>
                <div className="mt-2 text-xl font-bold">GEO Agency Pro</div>
                <div className="mt-3 text-3xl font-bold">£199<span className="text-base text-data">/mo</span></div>
                <ul className="mt-4 space-y-2 text-sm text-data">
                  <li>→ Unlimited scans</li>
                  <li>→ Full maps on every client</li>
                  <li>→ White label data maps</li>
                  <li>→ Priority support</li>
                </ul>
                <Link to="/geo-audit" className="mt-5 inline-block w-full text-center rounded-md border border-white/15 px-4 py-2 text-sm text-data hover:text-clinic hover:border-white/25 transition-colors">
                  Start GEO Agency Pro
                </Link>
              </div>
            </div>
          )}

          {mode === "both" && (
            <div className="mt-10 grid md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
                <div className="text-xs font-mono tracking-widest uppercase text-data/70">Starter</div>
                <div className="mt-2 text-xl font-bold">Starter Pro</div>
                <div className="mt-3 text-3xl font-bold">£99<span className="text-base text-data">/mo</span></div>
                <ul className="mt-4 space-y-2 text-sm text-data">
                  <li>→ 20 scans per tool / month (40 total)</li>
                  <li>→ Full conversion + GEO scans</li>
                  <li>→ White label data maps</li>
                  <li>→ Priority support</li>
                </ul>
                <Link to="/conversion-audit" className="mt-5 inline-block w-full text-center rounded-md border border-white/15 px-4 py-2 text-sm text-data hover:text-clinic hover:border-white/25 transition-colors">
                  Get started
                </Link>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
                <div className="text-xs font-mono tracking-widest uppercase text-data/70">Agency</div>
                <div className="mt-2 text-xl font-bold">Agency Pro</div>
                <div className="mt-3 text-3xl font-bold">£199<span className="text-base text-data">/mo</span></div>
                <ul className="mt-4 space-y-2 text-sm text-data">
                  <li>→ Unlimited scans per tool</li>
                  <li>→ Scan all client sites</li>
                  <li>→ White label data maps</li>
                  <li>→ Priority support</li>
                </ul>
                <Link to="/conversion-audit" className="mt-5 inline-block w-full text-center rounded-md border border-white/15 px-4 py-2 text-sm text-data hover:text-clinic hover:border-white/25 transition-colors">
                  Start Agency Pro
                </Link>
              </div>

              <div
                className="rounded-xl border border-white/10 p-6"
                style={{
                  borderColor: "rgba(255,255,255,0.16)",
                  background: "linear-gradient(135deg, rgba(6,182,212,0.06), rgba(217,70,239,0.06))",
                }}
              >
                <div className="text-xs font-mono tracking-widest uppercase">Full stack</div>
                <div className="mt-2 text-xl font-bold">Agency Max</div>
                <div className="mt-3 text-3xl font-bold">£279<span className="text-base text-data">/mo</span></div>
                <ul className="mt-4 space-y-2 text-sm text-data">
                  <li>→ Both tools. No limits.</li>
                  <li>→ Unlimited GEO + conversion scans</li>
                  <li>→ Multi-tool workflow</li>
                  <li>→ White label data maps</li>
                  <li>→ Priority support</li>
                </ul>
                <Link to="/conversion-audit" className="mt-5 inline-block w-full text-center rounded-md px-4 py-2 text-sm font-semibold text-white"
                      style={{ background: "linear-gradient(90deg, #06B6D4, #D946EF)" }}>
                  Get Agency Max
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* TRUST (no generic fluff) */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <SectionTitle
          kicker="Guarantee + fit"
          title="Specific output, or you don’t pay."
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
            See what’s wrong.
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

          <div className="mt-8 text-xs text-data/70">
            Or use the <Link className="underline hover:text-clinic" to="/tools">tool selector</Link>.
          </div>
        </div>
      </section>

      {/* Footer (simple) */}
      <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-data flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div>© {new Date().getFullYear()} ConversionDoc</div>
        <div className="flex flex-wrap gap-4">
          <Link to="/conversion-audit" className="hover:text-clinic">Conversion</Link>
          <Link to="/geo-audit" className="hover:text-clinic">GEO AI</Link>
          <Link to="/privacy" className="hover:text-clinic">Privacy</Link>
          <Link to="/terms" className="hover:text-clinic">Terms</Link>
          <Link to="/refund" className="hover:text-clinic">Refund</Link>
          <Link to="/contact" className="hover:text-clinic">Contact</Link>
        </div>
      </footer>
    </div>
  );
};

export default Home;
