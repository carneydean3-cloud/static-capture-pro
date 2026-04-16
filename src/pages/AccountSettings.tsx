import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Lock, Image as ImageIcon, CheckCircle2, ArrowLeft } from "lucide-react";

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
  const [settings, setSettings] = useState<WhiteLabelSettings>({ logo: null, theme: "dark" });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            theme: (data.white_label?.theme as "light" | "dark") || "dark",
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

      const formData = new FormData();
      formData.append("email", email);
      formData.append("file", file);

      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/update-white-label`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Upload failed");
      }

      const v = Date.now();
      const busted = data.url.includes("?") ? `${data.url}&v=${v}` : `${data.url}?v=${v}`;

      setSettings((prev) => ({ ...prev, logo: busted }));
    } catch (e: any) {
      setUploadError("Upload failed. Please try again.");
      console.error("Logo upload error:", e);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setSettings((prev) => ({ ...prev, logo: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      <div className="min-h-screen bg-obsidian flex items-center justify-center font-mono text-[10px] uppercase tracking-widest text-data animate-pulse">
        ACCESSING_SETTINGS...
      </div>
    );
  }

  if (!email || !isSubscriber) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-[#111] border border-surgical rounded-lg shadow-sm p-8 text-center space-y-4">
          <Lock className="w-10 h-10 text-pulse mx-auto mb-4" />
          <h1 className="text-xl font-bold text-clinic">Restricted Zone</h1>
          <p className="text-data text-sm font-mono">
            White label configurations are restricted to Agency Pro tier and above.
          </p>
          <a
            href="/#pricing"
            className="inline-block mt-4 rounded btn-pulse font-bold uppercase tracking-widest text-xs px-6 py-3 transition-colors shadow-sm"
          >
            Upgrade Plan
          </a>
        </div>
      </div>
    );
  }

  const planLabel = plan === "agency_pro" ? "Agency Pro" : "Starter Pro";

  return (
    <div className="min-h-screen bg-obsidian px-6 py-16 text-clinic">
      <div className="mx-auto max-w-3xl space-y-10">

        <Link to="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-data hover:text-clinic transition-colors font-bold">
          <ArrowLeft className="w-3 h-3" /> Back to Workspace
        </Link>

        {/* Header */}
        <section className="rounded-lg overflow-hidden border border-surgical shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-pulse" />
          <div className="bg-[#0A0A0A] px-8 py-10 md:px-12 md:py-14">
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-pulse mb-2">
              System Configurations
            </p>
            <h1 className="text-3xl md:text-5xl font-black text-clinic tracking-tighter">
              White_Label_Prefs
            </h1>
            <p className="mt-4 font-mono text-data text-xs">
              <span className="opacity-50">USER:</span> {email} <br />
              <span className="opacity-50">PLAN:</span> <span className="text-clinic">{planLabel}</span>
            </p>
          </div>
        </section>

        {/* Logo Upload */}
        <section className="rounded-lg border border-surgical bg-[#0A0A0A] p-6 md:p-8 shadow-sm">
          <div className="mb-6">
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-pulse mb-2">
              Brand Identity
            </p>
            <h2 className="text-2xl font-bold text-clinic">
              Agency Logo
            </h2>
            <p className="text-data text-sm mt-2 font-mono">
              Replaces the ConversionDoc branding on your generated PDF and HTML reports. <br/>PNG, JPG, SVG, WebP (Max 2MB).
            </p>
          </div>

          {settings.logo ? (
            <div className="mb-6">
              <div className="rounded-lg border border-surgical bg-black p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-32 h-16 bg-white/5 rounded border border-surgical flex items-center justify-center p-2">
                    <img
                      src={settings.logo}
                      alt="Your logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-clinic font-mono uppercase tracking-widest">Asset_Loaded</p>
                    <p className="text-xs text-data">This asset will be appended to your exports.</p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveLogo}
                  className="text-[10px] font-mono font-bold uppercase tracking-widest text-warning hover:text-red-400 transition-colors border border-warning/20 px-4 py-2 rounded"
                >
                  Delete Asset
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-dashed border-surgical bg-black hover:border-pulse/50 transition-colors cursor-pointer p-10 text-center flex flex-col items-center justify-center group"
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-pulse border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-mono font-bold uppercase tracking-widest text-data">Transmitting...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded bg-surgical flex items-center justify-center text-clinic group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-clinic font-mono uppercase tracking-widest mb-1">Click to browse files</p>
                      <p className="text-[10px] text-data font-mono uppercase tracking-widest">or drag and drop here</p>
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
                <p className="mt-4 text-[10px] text-warning font-mono font-bold uppercase tracking-widest">{uploadError}</p>
              )}
            </div>
          )}
        </section>

        {/* Theme Toggle */}
        <section className="rounded-lg border border-surgical bg-[#0A0A0A] p-6 md:p-8 shadow-sm">
          <div className="mb-8">
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-pulse mb-2">
              Report Theme
            </p>
            <h2 className="text-2xl font-bold text-clinic">
              Visual Protocol
            </h2>
            <p className="text-data text-sm mt-2 font-mono">
              Select the color palette used for your generated HTML reports and dashboards.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* LIGHT THEME OPTION */}
            <button
              type="button"
              onClick={() => setSettings((prev) => ({ ...prev, theme: "light" }))}
              className={cn(
                "rounded-lg border p-6 text-left transition-all relative overflow-hidden",
                settings.theme === "light"
                  ? "border-pulse bg-pulse/5"
                  : "border-surgical bg-black hover:border-surgical/80"
              )}
            >
              <div className="rounded overflow-hidden border border-slate-200 mb-6 bg-slate-50">
                <div className="bg-white p-3 border-b border-slate-200 flex justify-between">
                  <div className="h-2 w-16 bg-slate-300 rounded" />
                  <div className="h-2 w-8 bg-slate-200 rounded" />
                </div>
                <div className="p-4 space-y-3">
                  <div className="h-4 w-3/4 bg-slate-300 rounded" />
                  <div className="h-2 w-full bg-slate-200 rounded" />
                  <div className="h-2 w-5/6 bg-slate-200 rounded" />
                  <div className="h-8 w-1/3 bg-slate-800 rounded mt-4" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                 <div>
                    <p className="font-bold text-clinic font-mono uppercase tracking-widest mb-1">Standard / Light</p>
                    <p className="text-[10px] text-data font-mono uppercase tracking-widest">White BG • Dark Text</p>
                 </div>
                 {settings.theme === "light" && <CheckCircle2 className="w-5 h-5 text-pulse" />}
              </div>
            </button>

            {/* DARK THEME OPTION */}
            <button
              type="button"
              onClick={() => setSettings((prev) => ({ ...prev, theme: "dark" }))}
              className={cn(
                "rounded-lg border p-6 text-left transition-all relative overflow-hidden",
                settings.theme === "dark"
                  ? "border-pulse bg-pulse/5"
                  : "border-surgical bg-black hover:border-surgical/80"
              )}
            >
              <div className="rounded overflow-hidden border border-[#27272a] mb-6 bg-[#0A0A0A]">
                <div className="bg-black p-3 border-b border-[#27272a] flex justify-between">
                  <div className="h-2 w-16 bg-[#06B6D4]/50 rounded" />
                  <div className="h-2 w-8 bg-zinc-800 rounded" />
                </div>
                <div className="p-4 space-y-3">
                  <div className="h-4 w-3/4 bg-zinc-200 rounded" />
                  <div className="h-2 w-full bg-zinc-700 rounded" />
                  <div className="h-2 w-5/6 bg-zinc-700 rounded" />
                  <div className="h-8 w-1/3 bg-[#06B6D4] rounded mt-4" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                 <div>
                    <p className="font-bold text-clinic font-mono uppercase tracking-widest mb-1">Obsidian / Dark</p>
                    <p className="text-[10px] text-data font-mono uppercase tracking-widest">Black BG • Cyan Accents</p>
                 </div>
                 {settings.theme === "dark" && <CheckCircle2 className="w-5 h-5 text-pulse" />}
              </div>
            </button>

          </div>
        </section>

        {/* Save & Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-surgical">
          <Link to="/dashboard" className="text-[10px] font-mono uppercase tracking-widest text-data hover:text-clinic transition-colors font-bold order-2 sm:order-1">
            Cancel & Return
          </Link>
          
          <div className="flex items-center gap-4 w-full sm:w-auto order-1 sm:order-2">
            {saved && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#10b981] flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3" /> Saved
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto rounded btn-pulse font-bold uppercase tracking-widest text-[10px] px-10 py-4 transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? "SAVING..." : "COMMIT SETTINGS"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
