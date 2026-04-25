import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const LOOPS_FORM_ACTION_URL =
  "https://app.loops.so/api/newsletter-form/cmnoc234z00pa0iy16uhi6akt";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

const Logo = () => (
  <Link to="/" className="flex items-center gap-2 group" style={{ textDecoration: "none" }}>
    <span className="text-xl font-black tracking-tighter text-clinic group-hover:opacity-80 transition-opacity">
      ConversionDoc
    </span>
    <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
      <path
        d="M2 12H10L13 4L18 20L22 10L25 14H30"
        stroke="#06B6D4"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M30 14L34 8L38 4"
        stroke="#D946EF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M34 4H38V8"
        stroke="#D946EF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </Link>
);

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const canSubmit = useMemo(() => isValidEmail(email) && status !== "loading", [email, status]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const cleaned = email.trim();

    if (!isValidEmail(cleaned)) {
      setStatus("error");
      setMessage("Enter a real email address.");
      return;
    }

    // Basic client-side rate limit (matches the intent of the Loops embed)
    const now = Date.now();
    const prev = Number(localStorage.getItem("loops-form-timestamp") || "0");
    if (prev && prev + 60_000 > now) {
      setStatus("error");
      setMessage("Too many signups. Try again in a minute.");
      return;
    }
    localStorage.setItem("loops-form-timestamp", String(now));

    setStatus("loading");
    setMessage("");

    try {
      const body = new URLSearchParams();
      body.set("userGroup", "");
      body.set("mailingLists", "");
      body.set("email", cleaned);

      const res = await fetch(LOOPS_FORM_ACTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (!res.ok) {
        // Loops usually returns JSON with a message on error
        try {
          const data = await res.json();
          setStatus("error");
          setMessage(data?.message || res.statusText || "Signup failed.");
        } catch {
          setStatus("error");
          setMessage(res.statusText || "Signup failed.");
        }
        return;
      }

      setStatus("success");
      setMessage("You're on the list. Check your inbox.");
      setEmail("");
    } catch (err: any) {
      // Cloudflare/Fetch failures often show as "Failed to fetch"
      if (err?.message === "Failed to fetch") {
        setStatus("error");
        setMessage("Signup blocked. Try again in a minute.");
        return;
      }

      setStatus("error");
      setMessage("Network error. Try again.");
      localStorage.setItem("loops-form-timestamp", "");
    }
  }

  return (
    <div className="min-h-screen bg-obsidian text-clinic">
      {/* Background glow */}
      <div
        className="pointer-events-none fixed inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(800px 500px at 50% 10%, rgba(6,182,212,0.10), transparent 60%), radial-gradient(700px 450px at 70% 18%, rgba(217,70,239,0.09), transparent 60%)",
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-obsidian/80 backdrop-blur">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <Logo />
          <a
            href="https://conversiondoc.co.uk/blog"
            className="text-xs font-mono font-bold uppercase tracking-widest text-data hover:text-clinic transition-colors"
          >
            Blog
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-14 md:pt-20 pb-16">
        <div className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono tracking-widest uppercase text-data">
          Newsletter
        </div>

        <h1 className="mt-6 text-3xl md:text-5xl font-bold tracking-tight leading-[1.05]">
          Conversion fixes.
          <br />
          <span style={{ color: "#06B6D4" }}>Human clarity</span> +{" "}
          <span style={{ color: "#D946EF" }}>AI retrieval</span>.
        </h1>

        <p className="mt-4 text-data text-base md:text-lg">
          One email at a time. One clear change. Built from real scans.
        </p>

        <div className="mt-10 rounded-xl border border-white/10 bg-[#0A0A0A] p-6 md:p-8">
          {status !== "success" ? (
            <form onSubmit={onSubmit} className="space-y-4">
              <label className="block">
                <div className="text-xs font-mono font-bold uppercase tracking-widest text-data">
                  Email address
                </div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@company.com"
                  className="mt-2 w-full rounded-md border border-white/10 bg-black/40 px-4 py-3 text-clinic placeholder:text-data/60 outline-none focus:border-white/20"
                />
              </label>

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded-md py-3 text-[11px] font-mono font-bold uppercase tracking-widest transition-all"
                style={{
                  background: canSubmit
                    ? "linear-gradient(90deg, #06B6D4, #D946EF)"
                    : "rgba(255,255,255,0.08)",
                  color: canSubmit ? "#fff" : "rgba(255,255,255,0.55)",
                }}
              >
                {status === "loading" ? "Subscribing…" : "Subscribe"}
              </button>

              {message ? (
                <div
                  className="text-sm"
                  style={{ color: status === "error" ? "#E11D48" : "rgba(255,255,255,0.85)" }}
                >
                  {message}
                </div>
              ) : null}

              <div className="text-xs text-data/70">Unsubscribe anytime.</div>
            </form>
          ) : (
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-data">
                Subscribed
              </div>
              <div className="mt-2 text-xl font-bold">You’re on the list.</div>
              <p className="mt-2 text-data">
                Check your inbox. If you don’t see it, check spam/promotions.
              </p>

              <div className="mt-6 grid sm:grid-cols-2 gap-3">
                <Link to="/conversion-audit" className="btn-pulse text-center">
                  Run Conversion Scan — Free
                </Link>
                <Link to="/geo-audit" className="btn-neon text-center">
                  Run GEO AI Scan — Free
                </Link>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setStatus("idle");
                    setMessage("");
                  }}
                  className="text-xs font-mono font-bold uppercase tracking-widest text-data hover:text-clinic transition-colors"
                >
                  ← Back
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-5">
            <div className="text-sm font-semibold text-clinic">One fix per email</div>
            <p className="mt-2 text-sm text-data">The problem. The change. Where it goes.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-5">
            <div className="text-sm font-semibold text-clinic">Real examples</div>
            <p className="mt-2 text-sm text-data">Breakdowns pulled from real pages and scans.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-5">
            <div className="text-sm font-semibold text-clinic">AI retrieval updates</div>
            <p className="mt-2 text-sm text-data">
              What changes in ChatGPT and AI Overviews actually mean.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-3xl px-6 py-10 text-sm text-data flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} ConversionDoc</div>
          <div className="flex gap-4 flex-wrap">
            <Link to="/privacy" className="hover:text-clinic">Privacy</Link>
            <Link to="/terms" className="hover:text-clinic">Terms</Link>
            <Link to="/contact" className="hover:text-clinic">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
