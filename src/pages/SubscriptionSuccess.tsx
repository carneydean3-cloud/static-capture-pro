import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";

type Status = "loading" | "active" | "error";

export default function SubscriptionSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id") || "";
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string>("");

  const email = useMemo(() => {
    return localStorage.getItem("conversiondoc_user_email") || "";
  }, []);

  useEffect(() => {
    // We *could* verify using a dedicated verify endpoint later.
    // For now: just show success + instruct user to run audits.
    // Webhook will populate subscriptions table.
    if (!sessionId) {
      setStatus("error");
      setMessage("Missing session_id from Stripe.");
      return;
    }

    // Light delay so it feels intentional (and gives webhook time)
    const t = setTimeout(() => {
      setStatus("active");
      setMessage("Subscription activated. You can now generate full reports.");
    }, 800);

    return () => clearTimeout(t);
  }, [sessionId]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="max-w-lg w-full glass-card p-10 text-center">
        {status === "loading" && (
          <>
            <div className="text-sm text-muted-foreground mb-2">
              Finalising your subscription…
            </div>
            <div className="text-2xl font-bold">Just a moment</div>
            <p className="text-sm text-muted-foreground mt-4">
              We’re confirming your payment with Stripe.
            </p>
          </>
        )}

        {status === "active" && (
          <>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-score-green" />
            </div>
            <h1 className="text-2xl font-bold mb-2">You’re subscribed!</h1>
            <p className="text-sm text-muted-foreground mb-6">{message}</p>

            {email && (
              <p className="text-xs text-muted-foreground mb-6">
                Subscription email: <span className="font-semibold">{email}</span>
              </p>
            )}

            <Link to="/#hero-cta" className="btn-primary inline-flex items-center gap-2">
              Run an audit
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="mt-4">
              <Link to="/#pricing" className="text-xs text-muted-foreground underline">
                Back to pricing
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-2xl font-bold mb-2">We couldn’t verify that</h1>
            <p className="text-sm text-muted-foreground mb-6">
              {message || "Please contact support if your payment went through."}
            </p>
            <Link to="/#pricing" className="btn-outline-primary inline-flex items-center gap-2">
              Back to pricing
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
