import { useState, FormEvent } from "react";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useAudit } from "@/contexts/AuditContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EmailModal from "./EmailModal";

const loadingSteps = [
  { key: "capturing", label: "Capturing your page..." },
  { key: "analysing", label: "Analysing conversion elements..." },
  { key: "generating", label: "Generating your diagnosis..." },
];

const HeroSection = () => {
  const { stage, setStage, url, setUrl, result, setResult, setError } = useAudit();
  const isLoading = ["capturing", "analysing", "generating"].includes(stage);

  const runAudit = async (e: FormEvent) => {
    e.preventDefault();

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toast.error("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setError(null);
    setStage("capturing");

    // Animate through loading steps
    const timer1 = setTimeout(() => setStage("analysing"), 2000);
    const timer2 = setTimeout(() => setStage("generating"), 5000);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("run-audit", {
        body: { url },
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (fnError) {
        throw new Error(fnError.message || "Audit failed");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setResult(data);
      setStage("email_capture");
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      console.error("Audit error:", err);
      setError(err.message || "Something went wrong");
      toast.error(err.message || "Something went wrong. Please try again.");
      setStage("idle");
    }
  };

  return (
    <section id="hero-cta" className="relative pt-32 pb-20 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-8"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-primary">⚡ AI CONVERSION DIAGNOSTICS</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]"
        >
          Find out exactly why your <br />
          landing page isn't converting.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          ConversionDoc analyses your page across 6 conversion pillars and delivers a precise diagnosis — with every fix included.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-2xl mx-auto mb-16"
        >
          <form onSubmit={runAudit} className="flex flex-col md:flex-row items-stretch gap-4 mb-6">
            <div className="relative flex-grow group">
              <div className="absolute -inset-1 bg-primary/40 rounded-xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste your landing page URL..."
                required
                disabled={isLoading}
                className="relative w-full bg-navy-dark border border-white/10 rounded-xl px-6 py-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary text-lg px-8 py-4 flex items-center justify-center gap-3 shrink-0 disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analysing...
                </>
              ) : (
                <>
                  Run Free Audit
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Loading animation */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 mb-6"
            >
              <div className="space-y-3">
                {loadingSteps.map((step) => {
                  const stepIndex = loadingSteps.findIndex((s) => s.key === step.key);
                  const currentIndex = loadingSteps.findIndex((s) => s.key === stage);
                  const isDone = stepIndex < currentIndex;
                  const isCurrent = step.key === stage;

                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-white/20 shrink-0" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          isDone
                            ? "text-primary"
                            : isCurrent
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {!isLoading && stage === "idle" && (
            <div className="flex flex-col items-center gap-8">
              <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-muted-foreground">
                {["Free", "No credit card", "Results in 60 seconds"].map((text) => (
                  <div key={text} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    {text}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <img
                      key={i}
                      src={`https://i.pravatar.cc/100?u=${i}`}
                      alt="User"
                      className="w-10 h-10 rounded-full border-2 border-navy-dark"
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>
                <div className="text-sm font-bold text-foreground/80">⭐⭐⭐⭐⭐ Trusted by 300+ founders</div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <EmailModal />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
      </div>
    </section>
  );
};

export default HeroSection;
