import { useState } from "react";
import { X, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAudit } from "@/contexts/AuditContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const EmailModal = () => {
  const { stage, setStage, url, result, setUserEmail } = useAudit() as any;
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

    const currentResult = result;

    setSubmitting(true);
    try {
      // Save email in context
      setUserEmail(trimmedEmail);

      // Save email in localStorage as backup for checkout
      localStorage.setItem("conversiondoc_user_email", trimmedEmail);

      // 1) SUBSCRIBER INSERT (ignore duplicates)
      try {
        const { error: subError } = await supabase.from("subscribers").insert({
          email: trimmedEmail,
          source: "free_audit",
        });

        if (subError && subError.code !== "23505") {
          console.error("Subscriber save error:", subError);
          toast.error(`Couldn't save subscriber. (${subError.message})`);
        }
      } catch (err) {
        console.error("Subscriber save exception:", err);
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
          toast.error(`Results unlocked — lead save failed. (${leadsError.message})`);
        }
      } catch (err) {
        console.error("Leads save exception:", err);
      }

      // 3) AUDIT INSERT
      try {
        if (currentResult) {
          const { data: auditData, error: auditError } = await supabase
            .from("audits")
            .insert({
              email: trimmedEmail,
              url,
              overall_score: currentResult.overall_score ?? null,
              verdict: currentResult.verdict ?? null,
              tier: "free",
              full_results: currentResult,
              top_3_fixes: currentResult.top_3_fixes ?? null,
              clarity_score: currentResult.scores?.clarity?.score ?? null,
              hook_score: currentResult.scores?.hook?.score ?? null,
              trust_score: currentResult.scores?.trust?.score ?? null,
              desire_score: currentResult.scores?.desire?.score ?? null,
              action_score: currentResult.scores?.action?.score ?? null,
              objections_score: currentResult.scores?.objections?.score ?? null,
            })
            .select("id")
            .single();

          if (auditError) {
            console.error("Audits save error:", auditError.message);
          } else if (auditData?.id) {
            supabase.functions.invoke("send-audit-email", {
              body: { audit_id: auditData.id }
            }).catch(console.error);
          }
        }
      } catch (err) {
        console.error("Audits save exception:", err);
      }

      setStage("done");

      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
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
              <p className="text-sm text-body mb-6">Enter your email to unlock your results.</p>
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
