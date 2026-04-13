// src/pages/Contact.tsx
import { useEffect, useRef, useState } from "react";
import { supabase } from "../integrations/supabase/client";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [company, setCompany] = useState(""); // honeypot
  const formTsRef = useRef<number>(Date.now());

  useEffect(() => {
    formTsRef.current = Date.now();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!name || !email || !message) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("submit-contact", {
        method: "POST",
        body: { name, email, message, hp: company, ts: formTsRef.current },
      });
      if (error) throw error;

      setSuccess(true);
      setName(""); setEmail(""); setMessage(""); setCompany("");
      formTsRef.current = Date.now();
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f8fc]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm p-8 md:p-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Contact Us</h1>
          <p className="text-slate-500 mb-8">Questions, support, or partnership ideas — we’d love to hear from you.</p>

          {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          {success && <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Thanks — your message has been sent. We’ll get back to you shortly.</div>}

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="absolute -z-10 opacity-0 pointer-events-none" aria-hidden="true">
              <label>
                Company
                <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={6} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical" />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm shadow-sm">
              {loading ? "Sending…" : "Send Message →"}
            </button>

            <p className="text-xs text-slate-400">
              We’ll use your details only to reply to your message. See our{" "}
              <a className="text-teal-600 hover:text-teal-700 underline" href="/privacy">Privacy Policy</a>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
