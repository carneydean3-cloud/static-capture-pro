import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "How does the free audit work?", a: "Paste your landing page URL and we'll analyse it across 6 conversion pillars using AI. You'll get an overall score and the top 3 critical issues — all within 60 seconds." },
  { q: "What do I get in the Full Diagnosis?", a: "A complete breakdown of every issue, section-by-section rewritten copy, a brand-matched visual mockup (PNG), and ready-to-use code you can paste straight into your project." },
  { q: "Do I need technical skills?", a: "Not at all. The rewritten copy can be used by anyone. If you want to use the code bundle, it's simple copy-paste — no developer needed." },
  { q: "What's your refund policy?", a: "If we don't find at least 5 issues in your Full Diagnosis, we'll refund you completely. No questions asked." },
  { q: "How is this different from a CRO agency?", a: "Agencies take weeks and charge thousands. ConversionDoc delivers the same quality analysis in minutes at a fraction of the cost, with actionable fixes included." },
];

const FAQ = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-20">
          <span className="section-label mb-4 block">FAQ</span>
          <h2 className="section-heading mb-6">Got questions?</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="glass-card overflow-hidden">
              <button
                onClick={() => setOpen(open === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-bold text-sm">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${open === index ? "rotate-180" : ""}`} />
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
                    <p className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
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
