import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import SocialProof from "@/components/SocialProof";
import { useAudit } from "@/contexts/AuditContext";

export default function GeoAudit() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { runAudit } = useAudit();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("Please enter a URL to audit.");
      return;
    }

    setLoading(true);

    try {
      const auditId = await runAudit(url.trim());
      navigate(`/free-audit/${auditId}?focus=geo`);
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-24 pb-20 md:pt-32 md:pb-28">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(13,148,136,0.15),_transparent_60%)]" />

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-teal-400 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
            AI Search Readiness
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.1] mb-6">
            Is your page invisible
            <br />
            <span className="text-teal-400">to AI search?</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-8 mb-4">
            ChatGPT, Perplexity, and Google AI Overviews are changing how people find businesses.
            Most pages are structured for Google — not for AI.
          </p>

          <p className="text-base text-slate-400 max-w-xl mx-auto leading-7 mb-12">
            Run a free GEO audit and find out exactly where your page is losing AI visibility —
            and what to fix first.
          </p>

          {/* URL input */}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter your page URL (e.g. yourbusiness.com)"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-semibold px-8 py-4 transition-colors text-sm whitespace-nowrap shadow-lg shadow-teal-500/20"
            >
              {loading ? "Analysing…" : "Run Free GEO Audit →"}
            </button>
          </form>

          {error && (
            <p className="mt-4 text-red-400 text-sm">{error}</p>
          )}

          {/* Trust signals */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="text-teal-400">✓</span> Free
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-teal-400">✓</span> No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-teal-400">✓</span> Results in 60 seconds
            </span>
          </div>
        </div>
      </section>

      {/* What is GEO */}
      <section className="px-6 py-20 bg-[#0a0f1e]">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-400 mb-4">
            The Problem
          </p>
          <h2 className="text-4xl font-bold text-white mb-6">
            AI search works differently.
            <br />
            Most pages are not ready for it.
          </h2>
          <p className="text-slate-300 text-lg leading-8 max-w-2xl mx-auto mb-16">
            Traditional SEO optimises for Google's crawlers. GEO — Generative Engine Optimisation —
            optimises for how AI systems read, understand, and cite your content.
            They are not the same thing.
          </p>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              {
                label: "Unclear topic focus",
                description:
                  "AI systems need to instantly understand what your page is about. Vague positioning makes pages easy to ignore.",
              },
              {
                label: "Poor answer structure",
                description:
                  "AI engines extract and summarise answers. If your content is not structured to answer questions directly, it gets skipped.",
              },
              {
                label: "Weak entity signals",
                description:
                  "If it is not obvious who you are, what you do, and who you serve, AI systems cannot confidently cite you.",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
              >
                <div className="h-2 w-2 rounded-full bg-red-400 mb-4" />
                <h3 className="text-white font-semibold mb-2">{item.label}</h3>
                <p className="text-slate-400 text-sm leading-6">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 bg-[#0f172a]">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-400 mb-4">
            Process
          </p>
          <h2 className="text-4xl font-bold text-white mb-4">
            Three steps to AI search visibility.
          </h2>
          <p className="text-slate-400 mb-16 text-lg">
            Most tools stop at the diagnosis. ConversionDoc prescribes the fix.
          </p>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              {
                step: "1",
                title: "Analyse",
                description:
                  "Paste your URL. Our AI reads your page like an AI search expert — topic clarity, entity signals, answer structure, heading hierarchy, and authority.",
              },
              {
                step: "2",
                title: "Diagnose",
                description:
                  "You get a GEO score across 7 dimensions with specific issues identified. No vague advice. Exact problems, exact causes.",
              },
              {
                step: "3",
                title: "Fix",
                description:
                  "Get section-by-section rewritten content, improved structure, and ready-to-use code that makes your page AI-search ready.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 text-sm font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-white font-bold text-lg">{item.title}</h3>
                </div>
                <p className="text-slate-400 text-sm leading-6">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GEO pillars */}
      <section className="px-6 py-20 bg-[#0a0f1e]">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-400 mb-4">
            The 7 GEO Dimensions
          </p>
          <h2 className="text-4xl font-bold text-white mb-4">
            Everything AI search looks for.
          </h2>
          <p className="text-slate-400 mb-16 text-lg max-w-2xl mx-auto">
            Your free GEO audit scores your page across all 7 dimensions that determine
            whether AI systems can find, understand, and cite your content.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            {[
              { label: "AI Search Readiness", question: "Can AI engines find and cite your page?" },
              { label: "Topic Clarity", question: "Is your page focused on one clear subject?" },
              { label: "Answerability", question: "Does your content directly answer questions?" },
              { label: "Structure & Hierarchy", question: "Are headings clear and descriptive?" },
              { label: "Authority Signals", question: "Is your expertise visible and credible?" },
              { label: "Entity Clarity", question: "Is it obvious who you are and what you do?" },
              { label: "Content Completeness", question: "Is your topic covered thoroughly?" },
              { label: "Conversion Alignment", question: "Does the page convert AI-referred traffic?" },
            ].map((pillar) => (
              <div
                key={pillar.label}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
              >
                <p className="text-teal-400 text-xs font-semibold mb-1">{pillar.label}</p>
                <p className="text-slate-400 text-xs leading-5">{pillar.question}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="px-6 py-20 bg-[#0f172a]">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-400 mb-4">
            What You Get
          </p>
          <h2 className="text-4xl font-bold text-white mb-4">
            Everything you need to convert.
          </h2>
          <p className="text-slate-400 mb-16 text-lg max-w-2xl mx-auto">
            A complete audit across all 7 GEO dimensions — with fixes, rewritten content,
            and AI search readiness built in.
          </p>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              {
                title: "Full GEO score breakdown",
                description:
                  "Know exactly which dimensions are costing you AI visibility across all 7 GEO dimensions.",
              },
              {
                title: "Every issue identified",
                description:
                  "A complete list of what is blocking your AI search readiness, prioritised by impact.",
              },
              {
                title: "Section-by-section rewritten content",
                description:
                  "Your exact headings, copy, and structure rewritten to improve AI retrievability.",
              },
              {
                title: "Improved heading hierarchy",
                description:
                  "Clear H1, H2, and H3 structure that makes your content easy for AI systems to parse.",
              },
              {
                title: "FAQ and answer sections",
                description:
                  "Ready-to-use FAQ content structured for direct extraction by AI search engines.",
              },
              {
                title: "AI Search Readiness Assessment",
                description:
                  "Find out whether your page is structured to be found, understood, and cited by ChatGPT, Perplexity, and Google AI Overviews.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
              >
                <div className="h-8 w-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4">
                  <span className="text-teal-400 text-sm font-bold">✓</span>
                </div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-6">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <SocialProof />

      {/* Pricing */}
      <Pricing />

      {/* FAQ */}
      <FAQ />

      {/* Final CTA */}
      <section className="px-6 py-24 bg-[#0a0f1e]">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-400 mb-4">
            Get Started
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Find out if AI search
            <br />
            can find you.
          </h2>
          <p className="text-slate-300 text-lg leading-8 mb-10 max-w-xl mx-auto">
            Free. No credit card. Results in 60 seconds.
            Find out exactly where your page is losing AI visibility and what to fix first.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter your page URL"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-semibold px-8 py-4 transition-colors text-sm whitespace-nowrap shadow-lg shadow-teal-500/20"
            >
              {loading ? "Analysing…" : "Run Free GEO Audit →"}
            </button>
          </form>

          {error && (
            <p className="mt-4 text-red-400 text-sm">{error}</p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
