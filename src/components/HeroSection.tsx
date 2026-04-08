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
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
};

const isValidUrl = (input: string): boolean => {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length < 4) return false;
  if (!trimmed.includes(".")) return false;
  try {
    new URL(normalizeUrl(trimmed));
    return true;
  } catch {
    return false;
  }
};

const getFriendlyErrorMessage = (err: unknown): string => {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (msg.includes("429")) return "We're busy right now. Please wait a moment.";
  if (msg.includes("timeout") || msg.includes("abort")) return "The audit took too long. Please try again.";
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed to fetch")) return "Network error. Please check your connection.";
  if (msg.includes("invalid url") || msg.includes("malformed")) return "The URL seems invalid. Please check and try again.";
  if (msg.includes("not found") || msg.includes("404")) return "We couldn't find that page. Please check the URL.";
  return "We couldn't audit this page. Please make sure the URL is public and try again.";
};

const captureScreenshotToStorage = async (pageUrl: string): Promise<string> => {
  try {
    const supabaseUrl = (supabase as any).supabaseUrl as string;
    const supabaseKey = (supabase as any).supabaseKey as string;

    if (!supabaseUrl || !supabaseKey) return "";

    const thumbUrl = `https://image.thum.io/get/width/1400/crop/900/noanimate/${pageUrl}`;
    const imgRes = await fetch(thumbUrl);
    if (!imgRes.ok) return "";

    const blob = await imgRes.blob();
    if (blob.size < 5000) return "";

    const fileName = `screenshot-${Date.now()}.jpg`;

    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/screenshots/${fileName}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "image/jpeg",
          "x-upsert": "true",
        },
        body: blob,
      }
    );

    if (!uploadRes.ok) {
      console.warn("Screenshot upload failed:", uploadRes.status);
      return "";
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/screenshots/${fileName}`;
    console.log("Screenshot stored:", publicUrl);
    return publicUrl;
  } catch (e) {
    console.warn("Screenshot capture failed:", e);
    return "";
  }
};

const HeroSection = () => {
  const { stage, setStage, url, setUrl, result, setResult, setError } = useAudit();
  const isLoading = ["capturing", "analysing", "generating"].includes(stage);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) { setCountdown(null); return; }
    const timer = setInterval(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const runAudit = async (e: FormEvent) => {
    e.preventDefault();
    setUrlError(null);
    setError(null);

    if (!url.trim()) { setUrlError("Please enter your landing page URL"); return; }
    if (!isValidUrl(url)) { setUrlError("Please enter a valid URL (e.g. stripe.com)"); return; }

    const normalizedUrl = normalizeUrl(url);
    setUrl(normalizedUrl);
    setStage("capturing");

    localStorage.removeItem("conversiondoc_screenshot_url");

    const timer1 = setTimeout(() => setStage("analysing"), 2000);
    const timer2 = setTimeout(() => setStage("generating"), 5000);

    try {
      const supabaseUrl = (supabase as any).supabaseUrl as string;
      const supabaseKey = (supabase as any).supabaseKey as string;

      const response = await fetch(`${supabaseUrl}/functions/v1/run-audit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const seconds = retryAfter ? parseInt(retryAfter, 10) : 30;
        setCountdown(seconds);
        setUrlError(`We're busy right now. Try again in ${seconds} seconds.`);
        setStage("idle");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const data = await response.json();
      if (data?.error) throw new Error(data.error);

      setResult(data);
      setStage("email_capture");

      captureScreenshotToStorage(normalizedUrl).then((screenshotUrl) => {
        if (screenshotUrl) {
          localStorage.setItem("conversiondoc_screenshot_url", screenshotUrl);
          setResult({ ...data, screenshot_url: screenshotUrl });
          console.log("Screenshot ready:", screenshotUrl);
        }
      });

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

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-8"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            ⚡ AI Conversion Diagnostics
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]"
        >
          Other tools diagnose.<br />
          We fix.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-body max-w-3xl mx-auto mb-6 leading-relaxed"
        >
          ConversionDoc audits your landing page across 7 conversion pillars, identifies
          exactly what's blocking action, and prescribes the fixes — including a check
          for AI search readiness.
        </motion.p>

        {/* Supporting proof line */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-sm text-caption max-w-2xl mx-auto mb-12"
        >
          Built for humans. Ready for AI.
        </motion.p>

        {/* Audit form */}
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
                onChange={(e) => { setUrl(e.target.value); if (urlError) setUrlError(null); }}
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
                <><Loader2 className="w-5 h-5 animate-spin" />Analysing...</>
              ) : countdown !== null ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Wait {countdown}s</>
              ) : (
                <>Run Free Audit<ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          {urlError && (
            <div className="flex items-center gap-2 mt-2 px-2">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive text-left">
                {countdown !== null
                  ? `We're busy right now. Try again in ${countdown} seconds.`
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
                      <span className={`text-sm font-medium ${
                        isDone ? "text-primary" : isCurrent ? "text-foreground" : "text-caption"
                      }`}>
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
                <div className="text-sm font-bold text-foreground/80">
                  ⭐⭐⭐⭐⭐ Trusted by 300+ founders
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Three-pillar trust strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          {[
            {
              label: "7-Pillar Diagnosis",
              description: "Clarity, trust, desire, action, objections, hooks, and AI search readiness.",
            },
            {
              label: "Exact Fixes Included",
              description: "Not vague advice. Rewritten copy, mockups, and ready-to-use code.",
            },
            {
              label: "Built for Humans. Ready for AI.",
              description: "We check how your page performs for visitors and AI search engines.",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="glass-card p-6 text-left"
            >
              <p className="text-sm font-bold text-primary mb-1">{item.label}</p>
              <p className="text-xs text-body leading-relaxed">{item.description}</p>
            </div>
          ))}
        </motion.div>
      </div>

      <EmailModal />

      {/* Background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
      </div>
    </section>
  );
};

export default HeroSection;
