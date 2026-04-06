import { useState } from "react";
import { supabase } from "../integrations/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center px-6">
      <div className="max-w-md w-full">

        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl font-bold text-slate-900">ConversionDoc</span>
            <span className="text-teal-500 text-2xl">⚡</span>
          </a>
        </div>

        <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-8">
          {!sent ? (
            <>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Sign in to your account
              </h1>
              <p className="text-slate-500 text-sm mb-6">
                Enter your subscription email and we'll send you a magic link to sign in instantly. No password needed.
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  {loading ? "Sending…" : "Send magic link →"}
                </button>
              </form>

              <p className="text-center text-xs text-slate-400 mt-6">
                Only works with your subscription email address.{" "}
                <a href="/#pricing" className="text-teal-500 hover:underline">
                  Get a subscription →
                </a>
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📬</div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Check your inbox
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                We've sent a magic link to{" "}
                <span className="font-semibold text-slate-700">{email}</span>.
                Click the link in the email to sign in.
              </p>
              <p className="text-xs text-slate-400">
                Didn't get it?{" "}
                <button
                  onClick={() => setSent(false)}
                  className="text-teal-500 hover:underline"
                >
                  Try again
                </button>
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          <a href="/" className="hover:text-slate-600">← Back to home</a>
        </p>
      </div>
    </div>
  );
}
