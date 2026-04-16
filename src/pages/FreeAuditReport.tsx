import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { cn } from "@/lib/utils";
import { AlertCircle, ArrowRight, CheckCircle2, Zap, LayoutDashboard } from "lucide-react";

type TopFix = {
  priority?: number;
  impact?: string;
  issue?: string;
  fix?: string;
  page_region?: string;
};

type ScoreItem = {
  score?: number;
  issue?: string;
  fix?: string;
  rewritten_copy?: string;
};

type AuditRow = {
  id: string;
  email: string;
  url: string;
  overall_score?: number | null;
  verdict?: string | null;
  top_3_fixes?: TopFix[] | null;
  full_results?: {
    top_3_fixes?: TopFix[];
    scores?: Record<string, ScoreItem>;
    summary?: {
      biggest_opportunity?: string;
      executive_summary?: string;
    };
  } | null;
  tier?: string | null;
};

const scoreColor = (score?: number | null) => {
  if (typeof score !== "number") return "text-data";
  if (score >= 70) return "text-[#10b981]";
  if (score >= 40) return "text-[#f59e0b]";
  return "text-[#E11D48]";
};

const prettyLabel = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function FreeAuditReport() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isGeoFocus = searchParams.get("focus") === "geo";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [audit, setAudit] = useState<AuditRow | null>(null);

  const activeColor = isGeoFocus ? "text-neon" : "text-pulse";
  const activeBorder = isGeoFocus ? "border-neon/30" : "border-pulse/30";
  const activeBg = isGeoFocus ? "bg-neon/10" : "bg-pulse/10";
  const activeBtn = isGeoFocus ? "btn-neon" : "btn-pulse";

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) throw new Error("Missing audit ID");
        const { data, error } = await supabase
          .from("audits")
          .select("id, email, url, overall_score, verdict, top_3_fixes, full_results, tier")
          .eq("id", id)
          .single();
        if (error || !data) throw new Error("Audit not found");
        setAudit(data as AuditRow);
      } catch (e: any) {
        setError(e?.message || "Could not load audit");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const topFixes = useMemo(() => {
    const direct = audit?.top_3_fixes;
    if (Array.isArray(direct) && direct.length) return [...direct].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
    const nested = audit?.full_results?.top_3_fixes;
    if (Array.isArray(nested) && nested.length) return [...nested].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
    return [];
  }, [audit]);

  const scores = audit?.full_results?.scores ?? {};
  const summary = audit?.full_results?.summary ?? {};

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className={cn("w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto", isGeoFocus ? "border-neon" : "border-pulse")} />
          <p className="text-data font-mono uppercase tracking-widest text-xs">Decrypting Lab Results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian text-clinic px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-12">
        
        <Link to={isGeoFocus ? "/geo-audit" : "/conversion-audit"} className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-data hover:text-clinic transition-colors">
          ← Return to Diagnostic Suite
        </Link>

        {/* Clinical Header */}
        <section className="rounded-lg overflow-hidden border border-surgical bg-[#0A0A0A] relative">
          <div className={cn("absolute top-0 left-0 w-full h-1", isGeoFocus ? "bg-neon" : "bg-pulse")} />
          <div className="px-8 py-10 md:px-12 md:py-14">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <p className={cn("font-mono text-xs font-bold uppercase tracking-[0.3em] mb-4", activeColor)}>
                  {isGeoFocus ? "Machine Layer Analysis" : "Human Layer Analysis"}
                </p>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                  {isGeoFocus ? "GEO_READINESS_REPORT" : "CONVERSION_DIAGNOSIS"}
                </h1>
                {audit.url && (
                  <p className="mt-6 font-mono text-sm text-data opacity-60 truncate max-w-xl">
                    TARGET_URL: <span className="text-clinic">{audit.url}</span>
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end">
                <div className={cn("text-5xl font-black font-mono tracking-tighter", scoreColor(audit.overall_score))}>
                  {audit.overall_score || "00"}<span className="text-xl text-data opacity-30">/100</span>
                </div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-data mt-2">Overall Score</p>
              </div>
            </div>
          </div>
        </section>

        {/* Executive Summary */}
        <div className="grid md:grid-cols-3 gap-6">
          <section className="md:col-span-2 rounded-lg border border-surgical bg-[#0A0A0A] p-8">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-data mb-6 opacity-60">Diagnostic Summary</p>
            <h2 className="text-2xl font-bold mb-4">Biggest Opportunity</h2>
            <p className="text-lg text-data leading-relaxed italic border-l-2 border-surgical pl-6 py-2">
              "{summary.biggest_opportunity || audit.verdict || "Your page has significant visibility gaps that need immediate addressing."}"
            </p>
          </section>

          <section className="rounded-lg border border-surgical bg-[#0A0A0A] p-8 flex flex-col justify-center text-center">
             <div className={cn("w-3 h-3 rounded-full animate-pulse mx-auto mb-4", 
               audit.overall_score && audit.overall_score >= 70 ? "bg-[#10b981]" : (audit.overall_score && audit.overall_score < 40 ? "bg-[#E11D48]" : "bg-[#f59e0b]")
             )} />
             <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-data mb-1">Status Verdict</p>
             <h3 className={cn("text-xl font-black uppercase tracking-tight", scoreColor(audit.overall_score))}>
               {audit.verdict?.replace(" ", "_") || "NEEDS_ATTENTION"}
             </h3>
          </section>
        </div>

        {/* Action Plan / Top 3 Fixes */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-black tracking-tight">Priority Fixes</h2>
            <div className="h-px flex-1 bg-surgical" />
          </div>
          
          <div className="grid gap-4">
            {topFixes.map((fix, idx) => (
              <div key={idx} className="group relative bg-[#0A0A0A] border border-surgical rounded-lg p-6 hover:bg-[#111111] transition-colors">
                <div className="flex items-start gap-6">
                  <div className={cn("w-10 h-10 rounded-md flex items-center justify-center font-mono font-bold text-black shrink-0", 
                    fix.impact === "High" ? "bg-[#E11D48]" : (fix.impact === "Medium" ? "bg-[#f59e0b]" : "bg-data")
                  )}>
                    0{fix.priority ?? idx + 1}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-data opacity-50 block mb-1">Detected Issue</span>
                      <h4 className="text-xl font-bold text-clinic leading-tight">{fix.issue}</h4>
                    </div>
                    <div>
                      <span className={cn("font-mono text-[10px] font-bold uppercase tracking-widest block mb-1", activeColor)}>Prescribed Fix</span>
                      <p className="text-data leading-relaxed">{fix.fix}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Upgrade CTA */}
        <section className="rounded-lg overflow-hidden border border-surgical bg-[#0A0A0A] relative p-10 text-center">
          <div className={cn("absolute inset-0 opacity-10", isGeoFocus ? "bg-neon" : "bg-pulse")} />
          <div className="relative z-10 max-w-2xl mx-auto">
            <Zap className={cn("w-10 h-10 mx-auto mb-6", activeColor)} />
            <h2 className="text-3xl md:text-4xl font-black mb-4">Unlock the Full Lab Report</h2>
            <p className="text-data text-lg mb-8 font-mono">
              {isGeoFocus 
                ? "Get the section-by-section content restructure, full entity markup code, and your ready-to-publish GEO prescription."
                : "Get every specific psychological fix, rewritten copy for every section, and your brand-matched homepage mockup."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/pricing" className={cn("px-10 py-4 font-black uppercase tracking-widest text-sm", activeBtn)}>
                Upgrade to Full Diagnosis — £149
              </Link>
              <Link to={isGeoFocus ? "/geo-audit" : "/conversion-audit"} className="px-10 py-4 font-bold uppercase tracking-widest text-sm border border-surgical hover:bg-white/5 transition-colors">
                Run Another Audit
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
