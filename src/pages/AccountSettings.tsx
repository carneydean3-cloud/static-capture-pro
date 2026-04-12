import { useEffect, useRef, useState } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

type WhiteLabelSettings = {
  logo: string | null;
  theme: "light" | "dark";
};

export default function AccountSettings() {
  const [email, setEmail] = useState<string | null>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<WhiteLabelSettings>({ logo: null, theme: "light" });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load email from localStorage and check subscription
  useEffect(() => {
    const storedEmail = localStorage.getItem("conversiondoc_user_email");
    if (!storedEmail) {
      setLoading(false);
      return;
    }
    setEmail(storedEmail);

    const checkSub = async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-subscription`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email: storedEmail }),
        });
        const data = await res.json();
        if (data.subscribed) {
          setIsSubscriber(true);
          setPlan(data.plan || null);
          setSettings({
            logo: data.white_label?.logo || null,
            theme: (data.white_label?.theme as "light" | "dark") || "light",
          });
        }
      } catch (e) {
        console.error("Subscription check failed:", e);
      } finally {
        setLoading(false);
      }
    };

    checkSub();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !email) return;

    setUploadError("");

    const allowedTypes = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Please upload a PNG, JPG, SVG, or WebP file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError("File must be under 2MB.");
      return;
    }

    try {
      setUploading(true);

      const safeEmail = email.replace(/[^a-zA-Z0-9]/g, "_");
      const ext = file.name.split(".").pop();
      const filename = `${safeEmail}_logo.${ext}`;

      // Upload to Supabase Storage via REST API
      const uploadRes = await fetch(
        `${SUPABASE_URL}/storage/v1/object/white-label-logos/${filename}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": file.type,
            "x-upsert": "true",
          },
          body: file,
        }
      );

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/white-label-logos/${filename}`;
      setSettings((prev) => ({ ...prev, logo: publicUrl }));
    } catch (e) {
      setUploadError("Upload failed. Please try again.");
      console.error("Logo upload error:", e);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setSettings((prev) => ({ ...prev, logo: null }));
  };

  const handleSave = async () => {
    if (!email) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/update-white-label`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email,
          white_label_logo: settings.logo,
          white_label_theme: settings.theme,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error("Save error:", e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!email || !isSubscriber) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-[24px] border border-slate-200 shadow-sm p-8 text-center space-y-4">
          <p className="text-4xl">🔒</p>
          <h1 className="text-xl font-bold text-slate-900">Subscribers only</h1>
          <p className="text-slate-600 text-sm">
            White label settings are available on Starter Pro and Agency Pro plans.
          </p>
          <a
            href="/#pricing"
            className="inline-block mt-4 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold px-5 py-3 transition-colors text-sm"
          >
            View Plans
          </a>
        </div>
      </div>
    );
  }

  const planLabel = plan === "agency_pro" ? "Agency Pro" : "Starter Pro";

  return (
    <div className="min-h-screen bg-[#f5f8fc] px-6 py-16">
      <div className="mx-auto max-w-2xl space-y-8">

        {/* Header */}
        <section className="rounded-[32px] overflow-hidden border border-slate-900/10 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),_transparent_30%),linear-gradient(135deg,#020617,#0f172a_50%,#111827)] px-8 py-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-400">
              Account Settings
            </p>
            <h1 className="mt-3 text-3xl font-bold text-white tracking-tight">
              White Label Reports
            </h1>
            <p className="mt-2 text-slate-400 text-sm">
              {email} — {planLabel}
            </p>
          </div>
        </section>

        {/* Logo Upload */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
              Your Logo
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Upload your logo
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              Your logo will appear in place of the ConversionDoc branding on paid reports. PNG, JPG, SVG or WebP. Max 2MB.
            </p>
          </div>

          {settings.logo ? (
            <div className="mb-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={settings.logo}
                    alt="Your logo"
                    className="h-12 max-w-[180px] object-contain"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Logo uploaded</p>
                    <p className="text-xs text-slate-500">This will appear on your reports</p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveLogo}
                  className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-teal-300 hover:bg-teal-50 transition-colors cursor-pointer p-10 text-center"
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-500">Uploading…</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-2xl">
                      🖼️
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Click to upload your logo</p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG, SVG or WebP — max 2MB</p>
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
              />
              {uploadError && (
                <p className="mt-2 text-xs text-red-500 font-medium">{uploadError}</p>
              )}
            </div>
          )}
        </section>

        {/* Theme Toggle */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
              Report Theme
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Choose your report style
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              Select the theme that works best with your logo and brand.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Light theme */}
            <button
              type="button"
              onClick={() => setSettings((prev) => ({ ...prev, theme: "light" }))}
              className={`rounded-2xl border-2 p-5 text-left transition-all ${
                settings.theme === "light"
                  ? "border-teal-500 bg-teal-50"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300"
              }`}
            >
              {/* Light preview */}
              <div className="rounded-xl overflow-hidden border border-slate-200 mb-4">
                <div className="bg-white p-3 border-b border-slate-100">
                  <div className="h-2 w-16 bg-slate-200 rounded" />
                </div>
                <div className="bg-white p-3 space-y-2">
                  <div className="h-2 w-full bg-slate-100 rounded" />
                  <div className="h-2 w-3/4 bg-slate-100 rounded" />
                  <div className="h-2 w-1/2 bg-teal-100 rounded" />
                </div>
              </div>
              <p className="font-semibold text-slate-900 text-sm">Light</p>
              <p className="text-xs text-slate-500 mt-1">White background, dark text. Clean and professional.</p>
              {settings.theme === "light" && (
                <p className="text-xs font-bold text-teal-600 mt-2">✓ Selected</p>
              )}
            </button>

            {/* Dark theme */}
            <button
              type="button"
              onClick={() => setSettings((prev) => ({ ...prev, theme: "dark" }))}
              className={`rounded-2xl border-2 p-5 text-left transition-all ${
                settings.theme === "dark"
                  ? "border-teal-500 bg-teal-50"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300"
              }`}
            >
              {/* Dark preview */}
              <div className="rounded-xl overflow-hidden border border-slate-700 mb-4">
                <div className="bg-slate-900 p-3 border-b border-slate-700">
                  <div className="h-2 w-16 bg-teal-500/40 rounded" />
                </div>
                <div className="bg-slate-900 p-3 space-y-2">
                  <div className="h-2 w-full bg-slate-700 rounded" />
                  <div className="h-2 w-3/4 bg-slate-700 rounded" />
                  <div className="h-2 w-1/2 bg-teal-500/30 rounded" />
                </div>
              </div>
              <p className="font-semibold text-slate-900 text-sm">Dark</p>
              <p className="text-xs text-slate-500 mt-1">Navy background, light text. Bold and distinctive.</p>
              {settings.theme === "dark" && (
                <p className="text-xs font-bold text-teal-600 mt-2">✓ Selected</p>
              )}
            </button>
          </div>
        </section>

        {/* Preview */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">Preview</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Report header preview</h2>
          </div>

          <div className={`rounded-2xl overflow-hidden border ${settings.theme === "dark" ? "border-slate-700" : "border-slate-200"}`}>
            <div className={`px-6 py-8 ${
              settings.theme === "dark"
                ? "bg-[linear-gradient(135deg,#020617,#0f172a)]"
                : "bg-white border-b border-slate-100"
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.22em] mb-2 ${settings.theme === "dark" ? "text-teal-400" : "text-teal-600"}`}>
                    Full Diagnosis
                  </p>
                  <h3 className={`text-2xl font-bold ${settings.theme === "dark" ? "text-white" : "text-slate-900"}`}>
                    Conversion Report
                  </h3>
                  <p className={`text-sm mt-1 ${settings.theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                    yoursite.com
                  </p>
                </div>
                <div className="shrink-0">
                  {settings.logo ? (
                    <img
                      src={settings.logo}
                      alt="Your logo"
                      className={`h-10 max-w-[140px] object-contain ${settings.theme === "dark" ? "brightness-0 invert" : ""}`}
                    />
                  ) : (
                    <div className={`text-sm font-bold tracking-wide ${settings.theme === "dark" ? "text-teal-400" : "text-teal-600"}`}>
                      Your Logo
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold px-8 py-3.5 transition-colors text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>
          {saved && (
            <p className="text-sm font-semibold text-emerald-600">✓ Settings saved</p>
          )}
        </div>

      </div>
    </div>
  );
}
