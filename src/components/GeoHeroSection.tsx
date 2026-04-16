import { useState, FormEvent, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useAudit } from "@/contexts/AuditContext";
import { supabase } from "@/integrations/supabase/client";
import EmailModal from "./EmailModal";

const loadingSteps = [
  { key: "capturing", label: "Capturing your page..." },
  { key: "analysing", label: "Analysing AI search readiness..." },
  { key: "generating", label: "Generating your GEO diagnosis..." },
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
    return publicUrl;
  } catch (e) {
    console.warn("Screenshot capture failed:", e);
    return "";
  }
};

const GeoHeroSection = () => {
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

    if (!url.trim()) { setUrlError("Please enter your page URL"); return; }
    if (!isValidUrl(url)) { setUrlError("Please enter a valid URL (e.g. yourbusiness.com)"); return; }

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
        body: JSON.stringify({ url: normalizedUrl, focus: "geo" }),
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
        }
      });

    } catch (err: unknown) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      const friendlyMsg = getFriendlyErrorMessage(err);
      setUrlError(friendlyMsg);
      setError(friendlyMsg);
      setStage("idle");
    }
  };

  return (
    <section id="hero-cta" className="relative pt-32 pb-20 px-6 overflow-hidden bg-obsidian">
      <div className="max-w-7xl mx-auto text-center relative z-10">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 border border-neon/30 rounded-md px-4 py-1.5 mb-8 bg-black/40"
        >
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-neon">
            AI Search Readiness Audit
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.1] text-clinic"
        >
          Is your page <span className="text-neon">invisible</span><br />
          to AI search?
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-data max-w-3xl mx-auto mb-6 leading-relaxed"
        >
          ChatGPT, Perplexity, and Google AI Overviews are changing how people
          find businesses. Most pages are structured for Google — not for AI.
          Find out where yours stands in 60 seconds.
        </motion.p>

        {/* Supporting line */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-sm font-mono text-surgical uppercase tracking-widest max-w-2xl mx-auto mb-12 opacity-60"
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
              <div className="absolute -inset-1 bg-neon/20 rounded-xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
              <input
                type="text"
                value={url}
                onChange={(e) => { setUrl(e.target.value); if (urlError) setUrlError(null); }}
                placeholder="Enter your page URL (e.g. yourbusiness.com)"
                disabled={isLoading || countdown !== null}
                className={`relative w-full bg-black/50 border rounded-xl px-6 py-4 text-sm text-clinic placeholder:text-data focus:outline-none focus:border-neon transition-colors disabled:opacity-50 ${
                  urlError ? "border-warning" : "border-surgical"
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || countdown !== null}
              className="btn-neon text-lg px-8 py-4 flex items-center justify-center gap-3 shrink-0 disabled:opacity-70 min-w-[200px]"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Analysing...</>
              ) : countdown !== null ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Wait {countdown}s</>
              ) : (
                <>Analyze Visibility<ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          {urlError && (
            <div className="flex items-center gap-2 mt-2 px-2">
              <AlertCircle className="w-4 h-4 text-warning shrink-0" />
              <p className="text-sm text-warning text-left">
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
              className="border border-surgical bg-black/40 p-6 mb-6 mt-4 rounded-lg text-left"
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
                        <CheckCircle2 className="w-5 h-5 text-neon shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 text-neon animate-spin shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-surgical shrink-0" />
                      )}
                      <span className={`text-sm font-mono uppercase tracking-widest ${
                        isDone ? "text-neon" : isCurrent ? "text-clinic" : "text-data"
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
              <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-mono uppercase tracking-widest text-data">
                {["Free", "No credit card", "Results in 60 seconds"].map((text) => (
                  <div key={text} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-neon" />
                    {text}
                  </div>
                ))}
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
              label: "7-Dimension GEO Audit",
              description: "Topic clarity, answerability, structure, authority, entity signals, completeness, and conversion alignment.",
            },
            {
              label: "Exact Fixes Included",
              description: "Not vague advice. Rewritten content, improved structure, and ready-to-use code.",
            },
            {
              label: "Built for Humans. Ready for AI.",
              description: "We check how your page performs for visitors and AI search engines like ChatGPT and Perplexity.",
            },
          ].map((item) => (
            <div key={item.label} className="border border-surgical bg-[#0A0A0A] p-6 rounded-lg text-left hover:border-neon/40 transition-colors duration-300">
              <p className="text-sm font-mono font-bold text-neon mb-2 uppercase tracking-widest">{item.label}</p>
              <p className="text-sm text-data leading-relaxed">{item.description}</p>
            </div>
          ))}
        </motion.div>
      </div>

      <EmailModal />

      {/* Background glows - Shifted to Neon Magenta */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-neon/5 blur-[120px] rounded-full"></div>
      </div>
    </section>
  );
};

export default GeoHeroSection;
