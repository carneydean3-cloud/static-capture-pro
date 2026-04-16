import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { cn } from "@/lib/utils";
import { LayoutDashboard, LogOut, Zap, Clock, Globe, Palette, AlertCircle } from "lucide-react";

type SubscriptionData = {
  plan: string;
  audits_remaining: number;
  limit_reached: boolean;
  allowed: boolean;
  upgrade?: {
    target_plan: string;
    cta: string;
  };
};

type AuditHistoryItem = {
  id: string;
  url: string;
  overall_score: number;
  verdict: string;
  stripe_session_id: string | null;
  status: string;
  created_at: string;
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [userEmail, setUserEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [subError, setSubError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [url, setUrl] = useState("");
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");
  const [auditStep, setAuditStep] = useState("");

  const [history, setHistory] = useState<AuditHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        navigate("/login");
        return;
      }
      const email = session.user.email;
      setUserEmail(email);
      setAuthLoading(false);
      checkSubscription(email);
      loadHistory(email);
    };
    checkAuth();
  }, [navigate]);

  const checkSubscription = async (email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-subscription", {
        method: "POST",
        body: { email, product: "conversion" },
      });
      if (error || !data?.subscribed) {
        setSubError("No active subscription found.");
        return;
      }
      setSubscription({
        plan: data.plan,
        audits_remaining: data.audits_remaining,
        limit_reached: data.limit_reached,
        allowed: data.allowed !== false,
        upgrade: data.upgrade,
      });
    } catch (e: any) {
      setSubError("Subscription verification offline.");
    }
  };

  const loadHistory = async (email: string) => {
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from("purchases")
        .select("id, url, audit_data, stripe_session_id, status, created_at")
        .eq("email", email)
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        url: row.url,
        overall_score: row.audit_data?.overall_score ?? null,
        verdict: row.audit_data?.verdict ?? "",
        stripe_session_id: row.stripe_session_id,
        status: row.status,
        created_at: row.created_at,
      }));
      setHistory(mapped);
    } catch (e) {
      console.error("History load error:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleUpgradeCheckout = async (plan: string) => {
    setCheckoutLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-subscription-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ userEmail, plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error(err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || auditLoading) return;
    const cleanUrl = url.startsWith("http") ? url : `https://${url}`;
    setAuditLoading(true);
    setAuditError("");
    setAuditStep("Initializing AI Diagnostics...");

    try {
      const { data: auditResult, error: auditErr } = await supabase.functions.invoke("run-audit", {
        method: "POST",
        body: { url: cleanUrl },
      });
      if (auditErr || !auditResult) throw new Error("Audit failed");

      setAuditStep("Generating Full Diagnosis...");
      const { data: fullData, error: fullErr } = await supabase.functions.invoke("generate-full-diagnosis", {
        method: "POST",
        body: { auditData: auditResult, url: cleanUrl },
      });
      const finalAuditData = fullErr ? auditResult : { ...auditResult, ...fullData };

      const { data: purchase, error: saveErr } = await supabase.from("purchases").insert({
          url: cleanUrl,
          email: userEmail,
          audit_data: finalAuditData,
          status: "paid",
          stripe_session_id: null,
      }).select("id").single();

      if (saveErr || !purchase) throw new Error("Database sync failed");
      navigate(`/report/${purchase.id}`);
    } catch (err: any) {
      setAuditError(err?.message || "Audit failed.");
      setAuditLoading(false);
    }
  };

  const planLabel: Record<string, string> = {
    starter_pro: "Starter Pro",
    agency_pro: "Agency Pro",
    geo_starter_pro: "GEO Starter Pro",
    geo_agency_pro: "GEO Agency Pro",
    agency_max: "Agency Max",
  };

  const upsellByPlan: Record<string, { cta: string; target: string } | null> = {
    starter_pro: { cta: "Unlock unlimited audits", target: "agency_pro" },
    agency_pro: { cta: "Add Machine Layer (GEO) Access", target: "agency_max" },
    geo_starter_pro: { cta: "Unlock unlimited GEO audits", target: "geo_agency_pro" },
    geo_agency_pro: { cta: "Add Human Layer (Conversion) Access", target: "agency_max" },
    agency_max: null,
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  if (authLoading) {
    return <div className="min-h-screen bg-obsidian flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.3em] text-data animate-pulse">Establishing Secure Session...</div>;
  }

  return (
    <div className="min-h-screen bg-obsidian text-clinic">
      
      {/* Nav */}
      <div className="bg-[#0A0A0A] border-b border-surgical px-6 py-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-xl font-black tracking-tighter text-clinic">ConversionDoc</span>
            <div className="w-2 h-2 rounded-full bg-pulse animate-pulse" />
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-mono text-data opacity-40 hidden md:block">USER_ID: {userEmail}</span>
            <button onClick={handleSignOut} className="text-xs font-mono font-bold uppercase tracking-widest text-data hover:text-warning transition-colors flex items-center gap-2">
              <LogOut className="w-3 h-3" /> Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-surgical">
           <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-pulse mb-2">Workspace Dashboard</p>
              <h1 className="text-4xl font-black tracking-tight">Active_Environment</h1>
           </div>
           {subscription && (
              <div className="bg-pulse/10 border border-pulse/30 px-4 py-2 rounded flex items-center gap-3">
                 <Zap className="w-4 h-4 text-pulse" />
                 <span className="text-xs font-mono font-bold uppercase tracking-widest text-pulse">{planLabel[subscription.plan] || "Active Plan"}</span>
              </div>
           )}
        </div>

        {/* Action Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column: Sub & New Audit */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* New Audit Card */}
            <div className="bg-[#0A0A0A] border border-surgical p-8 rounded-lg">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-data mb-6 opacity-40">New Diagnostic</p>
              <form onSubmit={handleRunAudit} className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-clinic">Target URL</label>
                   <input 
                    type="text" 
                    value={url} 
                    onChange={(e) => setUrl(e.target.value)} 
                    placeholder="domain.com"
                    className="w-full bg-black border border-surgical rounded px-4 py-3 text-sm font-mono focus:border-pulse outline-none transition-colors"
                   />
                </div>
                <button 
                  disabled={auditLoading || !url || subscription?.limit_reached} 
                  className={cn("w-full py-4 font-black uppercase tracking-widest text-xs transition-all", subscription?.limit_reached ? "bg-surgical text-data cursor-not-allowed" : "btn-pulse")}
                >
                  {auditLoading ? auditStep : "Initiate Audit"}
                </button>
                {auditError && <p className="text-[10px] font-mono text-warning uppercase mt-2">{auditError}</p>}
                {subscription?.limit_reached && <p className="text-[10px] font-mono text-warning uppercase mt-2">Monthly Audit Limit Reached</p>}
              </form>
            </div>

            {/* Quota Card */}
            <div className="bg-[#0A0A0A] border border-surgical p-8 rounded-lg">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-data mb-6 opacity-40">System Resources</p>
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between items-end mb-2">
                       <span className="text-xs font-mono text-clinic">Audit Credits</span>
                       <span className={cn("text-xl font-black font-mono", subscription?.limit_reached ? "text-warning" : "text-pulse")}>
                        {subscription?.audits_remaining >= 99999 ? "∞" : subscription?.audits_remaining}
                       </span>
                    </div>
                    <div className="h-1 w-full bg-surgical rounded-full overflow-hidden">
                       <div className="h-full bg-pulse" style={{ width: subscription?.limit_reached ? '100%' : '20%' }} />
                    </div>
                 </div>

                 <Link to="/account" className="flex items-center justify-between p-4 bg-black border border-surgical rounded hover:bg-surgical/20 transition-colors group">
                    <div className="flex items-center gap-3">
                       <Palette className="w-4 h-4 text-data" />
                       <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-clinic">White Label Prefs</span>
                    </div>
                    <span className="text-data opacity-40 group-hover:translate-x-1 transition-transform">→</span>
                 </Link>
              </div>
            </div>

            {/* Upsell if needed */}
            {subscription && subscription.plan !== "agency_max" && upsellByPlan[subscription.plan] && (
               <button 
                onClick={() => handleUpgradeCheckout(upsellByPlan[subscription.plan]!.target)}
                className="w-full p-4 border border-pulse/20 bg-pulse/5 rounded-lg text-left group hover:border-pulse/40 transition-colors"
               >
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-pulse mb-1">Upgrade Available</p>
                  <p className="text-xs text-data leading-relaxed">{upsellByPlan[subscription.plan]?.cta}</p>
               </button>
            )}
          </div>

          {/* Right Column: History */}
          <div className="lg:col-span-2">
            <div className="bg-[#0A0A0A] border border-surgical rounded-lg overflow-hidden">
              <div className="px-8 py-6 border-b border-surgical flex justify-between items-center bg-black/40">
                 <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-data opacity-40">Diagnostic History</p>
                 <Clock className="w-4 h-4 text-data opacity-20" />
              </div>

              {historyLoading ? (
                <div className="p-12 text-center text-xs font-mono uppercase tracking-[0.2em] text-data animate-pulse">Reading Database...</div>
              ) : history.length === 0 ? (
                <div className="p-20 text-center space-y-4">
                  <Globe className="w-8 h-8 text-surgical mx-auto opacity-20" />
                  <p className="text-xs font-mono text-data opacity-40 uppercase tracking-widest">No case files recorded.</p>
                </div>
              ) : (
                <div className="divide-y divide-surgical">
                  {history.map((item) => (
                    <Link 
                      key={item.id} 
                      to={`/report/${item.id}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-white/[0.02] transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-1">
                           <span className="text-sm font-bold text-clinic truncate">{item.url}</span>
                           <span className="text-[9px] font-mono text-data opacity-30">{formatDate(item.created_at)}</span>
                        </div>
                        <p className="text-[10px] font-mono text-data opacity-50 uppercase tracking-tighter truncate italic">"{item.verdict}"</p>
                      </div>
                      
                      <div className="flex items-center gap-8 mt-4 sm:mt-0">
                        <div className="text-right">
                           <div className={cn("text-xl font-black font-mono", item.overall_score >= 70 ? "text-[#10b981]" : "text-[#f59e0b]")}>
                            {item.overall_score || "—"}
                           </div>
                           <p className="text-[8px] font-mono text-data opacity-30 uppercase tracking-widest">Score</p>
                        </div>
                        <span className="w-8 h-8 rounded-full border border-surgical flex items-center justify-center text-data group-hover:text-pulse group-hover:border-pulse transition-colors">→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
