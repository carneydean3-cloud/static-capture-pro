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
    if (!sessionId) {
      setStatus("error");
      setMessage("Missing session_id from Stripe.");
      return;
    }
    const t = setTimeout(() => {
      setStatus("active");
      setMessage("Subscription activated. You can now generate full reports from your dashboard.");
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
              We're confirming your payment with Stripe.
            </p>
          </>
        )}

        {status === "active" && (
          <>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-score-green" />
            </div>
            <h1 className="text-2xl font-bold mb-2">You're subscribed!</h1>
            <p className="text-sm text-muted-foreground mb-6">{message}</p>

            {email && (
              <p className="text-xs text-muted-foreground mb-6">
                Subscription email:{" "}
                <span className="font-semibold">{email}</span>
              </p>
            )}

            <Link
              to="/dashboard"
              className="btn-primary inline-flex items-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="mt-4">
              <Link to="/login" className="text-xs text-muted-foreground underline">
                Sign in to your account
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-2xl font-bold mb-2">We couldn't verify that</h1>
            <p className="text-sm text-muted-foreground mb-6">
              {message || "Please contact support if your payment went through."}
            </p>
            <Link
              to="/login"
              className="btn-outline-primary inline-flex items-center gap-2"
            >
              Sign in to your account
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
