import { useState, FormEvent, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useAudit } from "@/contexts/AuditContext";
import { supabase } from "@/integrations/supabase/client";
import EmailModal from "./EmailModal";

const loadingSteps = [
  { key: "capturing", label: "Capturing your page..." },
  { key: "analysing", label: "Analysing conversion elements..." },
  { key: "generating", label: "Generating your diagnosis..." },
];

const normalizeUrl = (input: string): string => {
  const trimmed = input.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const isValidUrl = (input: string): boolean => {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length < 4) return false;
  if (!trimmed.includes(".")) return false;
  try {
    const normalized = normalizeUrl(trimmed);
    new URL(normalized);
    return true;
  } catch {
    return false;
  }
};

const getFriendlyErrorMessage = (err: unknown): string => {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  
  if (msg.includes("429")) {
    return "We're busy right now. Please wait a moment.";
  }
  if (msg.includes("timeout") || msg.includes("abort")) {
    return "The audit took too long. Please try again with a different URL.";
  }
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed to fetch")) {
    return "Network error. Please check your internet connection.";
  }
  if (msg.includes("invalid url") || msg.includes("malformed")) {
    return "The URL provided seems invalid. Please check and try again.";
  }
  if (msg.includes("not found") || msg.includes("404")) {
    return "We couldn't find that page. Please check the URL.";
  }
  
  return "We couldn't audit this page. Please make sure the URL is public and try again.";
};

const HeroSection = () => {
  const { stage, setStage, url, setUrl, result, setResult, setError } = useAudit();
  const isLoading = ["capturing", "analysing", "generating"].includes(stage);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const runAudit = async (e: FormEvent) => {
    e.preventDefault();
    setUrlError(null);
    setError(null);

    if (!url.trim()) {
      setUrlError("Please enter your landing page URL");
      return;
    }

    if (!isValidUrl(url)) {
      setUrlError("Please enter a valid URL (e.g. stripe.com)");
      return;
    }

    const normalizedUrl = normalizeUrl(url);
    setUrl(normalizedUrl);
    setStage("capturing");

    const timer1 = setTimeout(() => setStage("analysing"), 2000);
    const timer2 = setTimeout(() => setStage("generating"), 5000);

    try {
      // Use fetch to be able to read headers for 429 Retry-After as requested
      // We get the URL and Key from the supabase client instance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabaseUrl = (supabase as any).supabaseUrl as string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabaseKey = (supabase as any).supabaseKey as string;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/run-audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const seconds = retryAfter ? parseInt(retryAfter, 10) : 30;
        setCountdown(seconds);
        setUrlError(`We’re busy right now. Try again in ${seconds} seconds.`);
        setStage("idle");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const data = await response.json();

      if (data?.error) {
        throw new Error(data.error);
      }

      setResult(data);
      setStage("email_capture");
    } catch (err: unknown) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      console.error("Audit error:", err);
      
      const friendlyMsg = getFriendlyErrorMessage(err);
      setUrlError(friendlyMsg);
      setError(friendlyMsg);
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
          className="text-xl text-body max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          ConversionDoc analyses your page across 6 conversion pillars and delivers a precise diagnosis — with every fix included.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-2xl mx-auto mb-16"
        >
          <form onSubmit={runAudit} className="flex flex-col md:flex-row items-stretch gap-4 mb-2">
            <div className="relative flex-grow group">
              <div className="absolute -inset-1 bg-primary/40 rounded-xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (urlError) setUrlError(null);
                }}
                placeholder="Enter your landing page URL (e.g. stripe.com)"
                disabled={isLoading || countdown !== null}
                className={`relative w-full bg-navy-dark border rounded-xl px-6 py-4 text-sm text-foreground placeholder:text-caption focus:outline-none focus:border-primary transition-colors disabled:opacity-50 ${
                  urlError ? "border-destructive" : "border-white/10"
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || countdown !== null}
              className="btn-primary text-lg px-8 py-4 flex items-center justify-center gap-3 shrink-0 disabled:opacity-70 min-w-[200px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analysing...
                </>
              ) : countdown !== null ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Wait {countdown}s
                </>
              ) : (
                <>
                  Run Free Audit
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {urlError && (
            <div className="flex items-center gap-2 mt-2 px-2">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive text-left">
                {countdown !== null 
                  ? `We’re busy right now. Try again in ${countdown} seconds.` 
                  : urlError}
              </p>
            </div>
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 mb-6 mt-4"
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
                            : "text-caption"
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
            <div className="flex flex-col items-center gap-8 mt-4">
              <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-body">
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
