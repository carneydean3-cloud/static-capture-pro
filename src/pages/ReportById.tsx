import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { cn } from "@/lib/utils";
import { FileText, Download, Monitor, Zap, CheckCircle2, Lock, ArrowRight, ExternalLink } from "lucide-react";
import { supabase } from "../integrations/supabase/client";

// Types preserved as per your original file...
type ScoreItem = { score?: number; issue?: string; fix?: string; verdict?: string; rewritten_copy?: string; };
type TopFix = { priority?: number; impact?: string; issue?: string; fix?: string; page_region?: string; };
type SummaryData = { strongest_pillar?: string; weakest_pillar?: string; biggest_opportunity?: string; executive_summary?: string; };
type HomepageCopyPack = { headline?: string; subheadline?: string; primary_cta?: string; trust_line?: string; benefit_bullets?: string[]; supporting_copy?: string; };
type AuditData = { overall_score?: number; verdict?: string; top_3_fixes?: TopFix[]; scores?: Record<string, ScoreItem>; mockup_html?: string; mockup_html_b?: string; summary?: SummaryData; homepage_copy_pack?: HomepageCopyPack; screenshot_url?: string; logo_url?: string; brand_name?: string; primary_color?: string; };
type PurchaseRow = { id: string; status: string; audit_data: AuditData | null; url?: string | null; email?: string | null; focus?: string; };

const prettyLabel = (key: string) => key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function ReportById() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [purchase, setPurchase] = useState<PurchaseRow | null>(null);
  const [activeTab, setActiveTab] = useState<"before" | "after">("after");
  const [mockupVersion, setMockupVersion] = useState<"a" | "b">("a");

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.email) { navigate("/login"); return; }
        const { data, error } = await supabase.from("purchases").select("*").eq("id", id).single();
        if (error || !data) throw new Error("Report not found");
        setPurchase(data as PurchaseRow);
      } catch (e: any) {
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const auditData = purchase?.audit_data ?? null;
  const isGeoMode = purchase?.focus === "geo";
  const activeColor = isGeoMode ? "text-neon" : "text-pulse";
  const activeBtn = isGeoMode ? "btn-neon" : "btn-pulse";

  if (loading) {
    return <div className="min-h-screen bg-obsidian flex items-center justify-center text-data font-mono uppercase text-xs tracking-widest animate-pulse">Accessing Laboratory Records...</div>;
  }

  return (
    <div className="min-h-screen bg-obsidian text-clinic px-6 py-16">
      <div className="mx-auto max-w-6xl space-y-12">
        
        <Link to="/dashboard" className="text-xs font-mono font-bold uppercase tracking-widest text-data hover:text-clinic transition-colors">
          ← Back to Dashboard
        </Link>

        {/* Paid Header */}
        <section className="rounded-lg border border-surgical bg-[#0A0A0A] overflow-hidden relative">
          <div className={cn("absolute top-0 left-0 w-full h-1", isGeoMode ? "bg-neon" : "bg-pulse")} />
          <div className="p-10 md:p-14 flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className={cn("font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-md border", isGeoMode ? "border-neon text-neon bg-neon/10" : "border-pulse text-pulse bg-pulse/10")}>
                  Full Diagnostic Report
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-data opacity-40">Ref: {id?.slice(0,8)}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                {isGeoMode ? "GEO_STRATEGY" : "CONVERSION_KIT"}
              </h1>
              <p className="mt-6 text-data font-mono text-xs opacity-60">TARGET_DOMAIN: <span className="text-clinic">{purchase?.url}</span></p>
            </div>
            <div className="flex flex-col items-end">
                <div className={cn("text-6xl font-black font-mono tracking-tighter", (auditData?.overall_score || 0) >= 70 ? "text-[#10b981]" : "text-[#f59e0b]")}>
                  {auditData?.overall_score || "00"}<span className="text-2xl text-data opacity-20">/100</span>
                </div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-data mt-2">Health Index</p>
            </div>
          </div>
        </section>

        {/* Results Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Executive Summary */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-[#0A0A0A] border border-surgical rounded-lg p-8">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-data mb-6 opacity-40">Executive Summary</p>
              <h2 className="text-2xl font-bold mb-6">Biggest Opportunity</h2>
              <div className="p-6 border-l-2 border-surgical bg-black/40 italic text-data text-lg leading-relaxed">
                "{auditData?.summary?.biggest_opportunity}"
              </div>
              <div className="mt-8">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-data mb-4 opacity-40">Clinical Diagnosis</p>
                <p className="text-data leading-loose text-sm">{auditData?.summary?.executive_summary}</p>
              </div>
            </section>

            {/* Pillar Breakdown */}
            <section className="bg-[#0A0A0A] border border-surgical rounded-lg p-8">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-data mb-8 opacity-40">Full Analysis Breakdown</p>
              <div className="grid gap-4">
                {Object.entries(auditData?.scores || {}).map(([key, val]) => (
                  <div key={key} className="p-6 bg-black/40 border border-surgical rounded-lg hover:border-surgical/80 transition-colors">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-mono font-bold text-sm uppercase tracking-wider text-clinic">{prettyLabel(key)}</h3>
                      <span className={cn("font-mono font-bold", (val.score || 0) >= 7 ? "text-[#10b981]" : "text-[#f59e0b]")}>{val.score}/10</span>
                    </div>
                    <p className="text-xs text-data leading-relaxed">{val.issue}</p>
                    {val.rewritten_copy && (
                      <div className="mt-4 pt-4 border-t border-surgical">
                         <span className={cn("font-mono text-[9px] uppercase tracking-widest block mb-2", activeColor)}>Optimized Content</span>
                         <p className="text-xs text-clinic italic leading-relaxed">"{val.rewritten_copy}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar Deliverables */}
          <div className="space-y-6">
            <div className="sticky top-24 space-y-6">
              
              {/* Copy Pack Card */}
              <div className="bg-[#0A0A0A] border border-surgical rounded-lg p-6">
                <FileText className={cn("w-6 h-6 mb-4", activeColor)} />
                <h3 className="text-lg font-bold mb-2">Prescribed Copy Pack</h3>
                <p className="text-xs text-data mb-6 font-mono leading-relaxed">Optimized headline, subheadline, and CTAs ready for deployment.</p>
                <div className="space-y-4">
                  <div className="p-4 bg-black border border-surgical rounded">
                    <span className="text-[9px] font-mono text-data uppercase block mb-1">Headline</span>
                    <p className="text-sm font-bold text-clinic">{auditData?.homepage_copy_pack?.headline}</p>
                  </div>
                  <button className={cn("w-full py-3 font-mono text-[10px] font-bold uppercase tracking-widest", activeBtn)}>
                    Download Copy Pack
                  </button>
                </div>
              </div>

              {/* Visual Mockup Toggle */}
              <div className="bg-[#0A0A0A] border border-surgical rounded-lg p-6">
                <Monitor className="w-6 h-6 text-data mb-4" />
                <h3 className="text-lg font-bold mb-2">Visual Mockup</h3>
                <div className="flex gap-2 p-1 bg-black rounded-lg border border-surgical mb-4">
                   <button onClick={() => setActiveTab('before')} className={cn("flex-1 py-2 text-[10px] font-mono uppercase font-bold rounded", activeTab === 'before' ? "bg-surgical text-clinic" : "text-data")}>Before</button>
                   <button onClick={() => setActiveTab('after')} className={cn("flex-1 py-2 text-[10px] font-mono uppercase font-bold rounded", activeTab === 'after' ? "bg-surgical text-clinic" : "text-data")}>After</button>
                </div>
                <button className="w-full py-3 font-mono text-[10px] font-bold uppercase tracking-widest border border-surgical hover:bg-white/5 transition-colors">
                  View Full Mockup
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
