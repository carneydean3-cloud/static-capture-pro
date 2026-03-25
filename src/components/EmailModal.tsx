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

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError("Please enter your email address");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    // We still unlock results even if result is missing,
    // but most of the time result should be there.
    const currentResult = result;

    setSubmitting(true);
    try {
      // 1) SUBSCRIBER UPSERT
      try {
        const { error: subError } = await supabase
          .from("subscribers")
          .upsert({
            email: trimmedEmail,
            source: "free_audit",
          });

        if (subError) {
          console.error("Subscriber save error:", subError.message);
          toast.error(
            `Couldn't save subscriber record this time. (${subError.message})`
          );
        }
      } catch (err) {
        console.error("Subscriber save exception:", err);
        // Don't block anything on this failure
      }

      // 2) LEAD INSERT
      try {
        const { error: leadsError } = await supabase.from("Leads").insert({
          email: trimmedEmail,
          url,
          score: currentResult?.overall_score || 0,
        });

        if (leadsError) {
          console.error("Leads save error:", leadsError.message);
          toast.error(
            `Results unlocked — saving lead failed this time. (${leadsError.message})`
          );
        } else {
          toast.success("Results unlocked — lead saved.");
        }
      } catch (err) {
        console.error("Leads save exception:", err);
        toast.error("Results unlocked — saving lead failed this time.");
      }

      // 3) AUDIT INSERT (full analysis JSON)
      try {
        if (currentResult) {
          const { error: auditError } = await supabase.from("audits").insert({
            email: trimmedEmail,
            url,
            overall_score: currentResult.overall_score ?? null,
            verdict: currentResult.verdict ?? null,
            analysis: currentResult, // JSONB column recommended
          });

          if (auditError) {
            console.error("Audits save error:", auditError.message);
            toast.error(
              `Couldn't save detailed audit this time. (${auditError.message})`
            );
          }
        } else {
          console.warn("No result present when trying to save audit record.");
        }
      } catch (err) {
        console.error("Audits save exception:", err);
        // Don't block results
      }

      // ALWAYS unlock results if we reached here
      setStage("done");

      setTimeout(() => {
        const resultsEl = document.getElementById("results");
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
    } catch (err: unknown) {
      console.error("Save error:", err);
      setStage("done");

      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      toast.error(`Results unlocked — saving failed this time. (${errorMessage})`);

      setTimeout(() => {
        const resultsEl = document.getElementById("results");
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
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
                  <p className="text-xs text-destructive mt-1.5">
                    {emailError}
                  </p>
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
