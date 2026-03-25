import { useState } from "react";
import { X, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAudit } from "@/contexts/AuditContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const EmailModal = () => {
  const { stage, setStage, url, result } = useAudit();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isOpen = stage === "email_capture";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    if (!email.trim()) {
      setEmailError("Please enter your email address");
      return;
    }

    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (!result) return;

    setSubmitting(true);
    try {
      // Save subscriber
      await supabase.from("subscribers").insert({
        email: email.trim(),
        source: "free_audit",
      });

      // Save audit
      await supabase.from("audits").insert({
        email: email.trim(),
        url,
        overall_score: result.overall_score,
        verdict: result.verdict,
        clarity_score: result.scores.clarity.score,
        hook_score: result.scores.hook.score,
        trust_score: result.scores.trust.score,
        desire_score: result.scores.desire.score,
        action_score: result.scores.action.score,
        objections_score: result.scores.objections.score,
        top_3_fixes: result.top_3_fixes as any,
        full_results: result as any,
        tier: "free",
      });

      // Save to Leads table
      await supabase.from("Leads").insert({
        email: email.trim(),
        url,
        score: result.overall_score,
        status: "free",
      });

      setStage("done");
      toast.success("Your audit results are ready!");

      // Scroll to results after a brief delay
      setTimeout(() => {
        const resultsEl = document.getElementById("results");
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-8 max-w-md w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setStage("idle")}
              className="absolute top-4 right-4 text-caption hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Your audit is ready.</h3>
              <p className="text-sm text-body mb-6">
                Enter your email to unlock your results.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  placeholder="you@company.com"
                  className={`w-full bg-navy-dark border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-caption focus:outline-none focus:border-primary ${
                    emailError ? "border-destructive" : "border-white/10"
                  }`}
                />
                {emailError && (
                  <p className="text-xs text-destructive mt-1.5">{emailError}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    See My Results
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-xs text-center text-caption">
                No spam. Unsubscribe anytime.
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmailModal;
