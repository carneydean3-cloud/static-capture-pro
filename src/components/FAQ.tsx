import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "How does the free audit work?",
    a: "Paste your landing page URL and we'll analyse it across 7 conversion pillars using AI. You'll get an overall conversion score, an AI search readiness signal, and the top 3 critical fixes — all within 60 seconds. No credit card required.",
  },
  {
    q: "What are the 7 conversion pillars?",
    a: "We assess your page across Clarity, Hook Strength, Trust Architecture, Desire Building, Action Clarity, Objection Handling, and AI Search Readiness. Each dimension is scored and contributes to your overall conversion health score.",
  },
  {
    q: "What is AI Search Readiness?",
    a: "AI search engines like ChatGPT, Perplexity, and Google AI Overviews are increasingly answering questions before users click. AI Search Readiness checks whether your page is structured clearly enough to be understood, summarised, and cited by these systems — so you don't lose visibility as search behaviour changes.",
  },
  {
    q: "What do I get in the Full Diagnosis?",
    a: "A complete 7-pillar breakdown of every conversion issue, section-by-section rewritten copy, a brand-matched visual mockup (PNG), ready-to-use code you can paste straight into your project, and a full AI Search Readiness assessment.",
  },
  {
    q: "Do I need technical skills?",
    a: "Not at all. The rewritten copy can be used by anyone. The code bundle is simple copy-paste — no developer needed. The AI Search Readiness fixes are practical and clearly explained.",
  },
  {
    q: "What's your refund policy?",
    a: "If we don't find at least 5 issues in your Full Diagnosis, we'll refund you completely. No questions asked.",
  },
  {
    q: "How is this different from a CRO agency?",
    a: "Agencies take weeks and charge thousands. ConversionDoc delivers the same quality analysis in minutes at a fraction of the cost — with actionable fixes, rewritten copy, and visual assets included. And unlike agencies, we also check your AI search readiness.",
  },
  {
    q: "Who is ConversionDoc for?",
    a: "Founders, freelancers, consultants, SaaS teams, course creators, coaches, and small agencies — anyone with a landing page, offer page, or content page that isn't performing as well as it should.",
  },
  {
    q: "Can agencies use this for client pages?",
    a: "Yes. Starter Pro gives you 20 full audits per month across client sites. Agency Pro gives you unlimited audits. Both include full reports and priority support.",
  },
  {
    q: "Is this useful if I already have traffic?",
    a: "Especially useful. If you have traffic but poor conversion, the problem is almost always on the page — not the audience. ConversionDoc diagnoses exactly what's blocking action and prescribes the fixes.",
  },
];

const FAQ = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-20">
          <span className="section-label mb-4 block">FAQ</span>
          <h2 className="section-heading mb-4">Got questions?</h2>
          <p className="body-text">
            Everything you need to know about ConversionDoc and how it works.
          </p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="glass-card overflow-hidden">
              <button
                onClick={() => setOpen(open === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-bold text-sm pr-4">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform duration-200 shrink-0 ${
                    open === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {open === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
