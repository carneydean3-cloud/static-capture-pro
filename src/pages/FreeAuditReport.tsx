import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { cn } from "@/lib/utils";
import { AlertCircle, ArrowRight, Zap } from "lucide-react";

// Types preserved
type TopFix = { priority?: number; impact?: string; issue?: string; fix?: string; page_region?: string; };
type ScoreItem = { score?: number; issue?: string; fix?: string; rewritten_copy?: string; };
type AuditRow = { id: string; email: string; url: string; overall_score?: number | null; verdict?: string | null; top_3_fixes?: TopFix[] | null; full_results?: { top_3_fixes?: TopFix[]; scores?: Record<string, ScoreItem>; summary?: { biggest_opportunity?: string; executive_summary?: string; }; } | null; };

const scoreColor = (score?: number | null) => {
  if (typeof score !== "number") return "text-data";
  if (score >= 70) return "text-[#10b981]";
  if (score >= 40) return "text-[#f59e0b]";
  return "text-[#E11D48]";
};

const prettyLabel = (key: string) => key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const GEO_PILLAR_KEYS = ["ai_search", "ai_readiness", "geo", "search_readiness"];
const isGeoPillar = (key: string) => GEO_PILLAR_KEYS.some((f) => key.toLowerCase().includes(f));

export default function FreeAuditReport() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isGeoFocus = searchParams.get("focus") === "geo";

  const [loading, setLoading] = useState(true);
  const [audit, setAudit] = useState<AuditRow | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data } = await supabase.from("audits").select("*").eq("id", id).single();
      if (data) setAudit(data as AuditRow);
      setLoading(false);
    };
    load();
  }, [id]);

  const topFixes = useMemo(() => {
    const direct = audit?.top_3_fixes || audit?.full_results?.top_3_fixes || [];
    return [...direct].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
  }, [audit]);

  const orderedScores = useMemo(() => {
    const entries = Object.entries(audit?.full_results?.scores || {});
    if (!isGeoFocus) return entries.slice(0, 3);
    const geo = entries.filter(([k]) => isGeoPillar(k));
    const rest = entries.filter(([k]) => !isGeoPillar(k));
    return [...geo, ...rest].slice(0, 3);
  }, [audit, isGeoFocus]);

  if (loading) return <div className="min-h-screen bg-obsidian" />;

  return (
    <div className="min-h-screen bg-obsidian text-clinic px-6 py-16 font-sans">
      <div className="mx-auto max-w-5xl space-y-12">
        <Link to={isGeoFocus ? "/geo-audit" : "/conversion-audit"} className="text-[10px] font-mono uppercase tracking-[0.2em] text-data hover:text-clinic transition-colors">← Back_to_lab</Link>

        {/* Header */}
        <section className="rounded-lg border border-surgical bg-[#0A0A0A] overflow-hidden relative">
          <div className={cn("absolute top-0 left-0 w-full h-1", isGeoFocus ? "bg-neon" : "bg-pulse")} />
          <div className="p-10">
            <p className={cn("font-mono text-[10px] uppercase font-bold tracking-widest", isGeoFocus ? "text-neon" : "text-pulse")}>{isGeoFocus ? "Machine_Layer_Audit" : "Human_Layer_Audit"}</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-2">{isGeoFocus ? "AI_READINESS_REPORT" : "CONVERSION_DIAGNOSIS"}</h1>
            <p className="mt-4 font-mono text-[10px] text-data opacity-50">TARGET: {audit?.url}</p>
          </div>
        </section>

        {/* Priority Readouts */}
        <div className="grid md:grid-cols-2 gap-6">
           <div className="bg-[#0A0A0A] border border-surgical p-8 rounded-lg">
              <p className="text-[10px] font-mono uppercase text-data mb-2">Overall Score</p>
              <div className={cn("text-6xl font-black font-mono", scoreColor(audit?.overall_score))}>{audit?.overall_score || "00"}<span className="text-xl text-data opacity-20">/100</span></div>
           </div>
           <div className="bg-[#0A0A0A] border border-surgical p-8 rounded-lg">
              <p className="text-[10px] font-mono uppercase text-data mb-2">Primary Diagnosis</p>
              <p className="text-lg font-bold leading-relaxed">"{audit?.full_results?.summary?.biggest_opportunity || audit?.verdict}"</p>
           </div>
        </div>

        {/* Top Fixes Action Plan */}
        <section className="space-y-6">
           <h2 className="text-2xl font-black uppercase tracking-widest">Action_Plan</h2>
           <div className="grid gap-4">
              {topFixes.map((f, i) => (
                <div key={i} className="bg-[#0A0A0A] border border-surgical p-6 rounded-lg flex gap-6 items-start">
                   <div className="w-10 h-10 rounded bg-surgical flex items-center justify-center font-mono font-bold text-clinic shrink-0">0{i+1}</div>
                   <div>
                      <span className="text-[9px] font-mono uppercase text-data block mb-1">Observation</span>
                      <p className="text-clinic font-bold mb-4">{f.issue}</p>
                      <span className={cn("text-[9px] font-mono uppercase block mb-1", isGeoFocus ? "text-neon" : "text-pulse")}>Prescription</span>
                      <p className="text-data text-sm leading-relaxed">{f.fix}</p>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* Upgrade Gate (Surgical Style) */}
        <section className="bg-pulse/5 border border-pulse/20 p-10 rounded-lg text-center">
           <Zap className={cn("w-10 h-10 mx-auto mb-6", isGeoFocus ? "text-neon" : "text-pulse")} />
           <h2 className="text-3xl font-black mb-4">Unlock Complete Lab Report</h2>
           <p className="text-data mb-8 font-mono text-sm max-w-xl mx-auto">Get section-by-section copy, technical entity code, and the full visual mockup suite.</p>
           <Link to="/pricing" className={cn("inline-block px-10 py-4 font-black uppercase tracking-widest text-xs", isGeoFocus ? "btn-neon" : "btn-pulse")}>Get Full Diagnosis £149</Link>
        </section>
      </div>
    </div>
  );
}
