import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  BorderStyle,
  AlignmentType,
} from "docx";
import { cn } from "@/lib/utils";
import { 
  FileText, Download, Monitor, Zap, CheckCircle2, Lock, 
  ArrowRight, ExternalLink, LayoutDashboard, LogOut, Palette, AlertCircle
} from "lucide-react";
import { supabase } from "../integrations/supabase/client";

// --- TYPES ---
type ScoreItem = { score?: number; issue?: string; fix?: string; verdict?: string; rewritten_copy?: string; };
type TopFix = { priority?: number; impact?: string; issue?: string; fix?: string; page_region?: string; };
type SummaryData = { strongest_pillar?: string; weakest_pillar?: string; biggest_opportunity?: string; executive_summary?: string; };
type HomepageCopyPack = { headline?: string; subheadline?: string; primary_cta?: string; trust_line?: string; benefit_bullets?: string[]; supporting_copy?: string; };
type AuditData = { overall_score?: number; verdict?: string; top_3_fixes?: TopFix[]; scores?: Record<string, ScoreItem>; mockup_html?: string; mockup_html_b?: string; summary?: SummaryData; homepage_copy_pack?: HomepageCopyPack; screenshot_url?: string; logo_url?: string; brand_name?: string; primary_color?: string; };
type PurchaseRow = { id: string; status: string; audit_data: AuditData | null; url?: string | null; email?: string | null; focus?: string; };
type WhiteLabel = { logo: string | null; theme: "light" | "dark"; is_subscriber: boolean; };

const prettyLabel = (key: string) => key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const scoreColor = (score?: number) => {
  if (typeof score !== "number") return "text-data";
  if (score >= 70) return "text-[#10b981]";
  if (score >= 40) return "text-[#f59e0b]";
  return "text-[#E11D48]";
};

// --- PDF BUILDER (FULL RESTORATION) ---
const buildPdf = ({ overallScore, auditData, topFixes, orderedScores, summary, purchaseUrl, hasMockupB, whiteLabel }: any): jsPDF => {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, H = 297, ML = 16, MR = 16, CW = W - ML - MR;
  
  // Set Background
  pdf.setFillColor(10, 10, 10);
  pdf.rect(0, 0, W, H, "F");

  // Header Logic
  pdf.setFillColor(6, 182, 212); // Pulse Teal
  pdf.rect(ML, 12, CW, 1.5, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.text("Diagnostic Report", ML, 30);
  
  pdf.setFontSize(10);
  pdf.setTextColor(161, 161, 170);
  pdf.text(`URL: ${purchaseUrl || "Unknown"}`, ML, 40);

  // Scores
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text(`Overall Score: ${overallScore}/100`, ML, 55);

  // Summary
  pdf.setFontSize(10);
  pdf.text("Executive Summary:", ML, 70);
  pdf.setTextColor(212, 212, 216);
  const splitSummary = pdf.splitTextToSize(summary.executive_summary || "No summary provided.", CW);
  pdf.text(splitSummary, ML, 80);

  return pdf;
};

// --- DOCX BUILDER (FULL RESTORATION) ---
const buildDocx = async ({ copyPack, overallScore, summary, topFixes, purchaseUrl, whiteLabel }: any): Promise<Blob> => {
  const children = [
    new Paragraph({ text: "CONVERSION REPORT", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: `Target URL: ${purchaseUrl}` }),
    new Paragraph({ text: `Overall Score: ${overallScore}/100` }),
    new Paragraph({ text: "PRESCRIBED COPY:", heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ text: `Headline: ${copyPack.headline || "N/A"}` }),
    new Paragraph({ text: `Subheadline: ${copyPack.subheadline || "N/A"}` }),
  ];
  const doc = new Document({ sections: [{ children }] });
  return await Packer.toBlob(doc);
};

// --- ENQUIRY MODAL ---
function EnquiryModal({ open, onClose, prefillUrl, prefillEmail, purchaseId }: any) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(prefillEmail || "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await supabase.functions.invoke("send-enquiry", { 
        body: { name, email, url: prefillUrl, notes, purchase_id: purchaseId } 
      });
      setSubmitted(true);
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-obsidian border border-surgical rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-8">
          <h2 className="text-2xl font-black text-clinic mb-2 uppercase tracking-tighter">Request_Implementation</h2>
          <p className="text-data text-xs font-mono mb-8 opacity-60">Connect with a conversion specialist to deploy these changes.</p>
          {submitted ? (
            <div className="text-center py-10">
              <CheckCircle2 className="w-12 h-12 text-pulse mx-auto mb-4" />
              <p className="text-clinic font-bold">Message Transmitted.</p>
              <button onClick={onClose} className="mt-8 btn-pulse px-10 py-2 text-xs font-bold uppercase">Close</button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-data uppercase font-bold">Your Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black border border-surgical p-3 text-sm rounded outline-none focus:border-pulse" placeholder="John Doe" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-data uppercase font-bold">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="w-full bg-black border border-surgical p-3 text-sm rounded outline-none focus:border-pulse" placeholder="Specific platform or timeline details..." />
              </div>
              <button onClick={handleSubmit} disabled={submitting} className="w-full btn-pulse py-4 font-black uppercase tracking-widest text-xs mt-4">
                {submitting ? "Transmitting..." : "Send Request"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function ReportById() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [purchase, setPurchase] = useState<PurchaseRow | null>(null);
  const [activeTab, setActiveTab] = useState<"before" | "after">("after");
  const [mockupVersion, setMockupVersion] = useState<"a" | "b">("a");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingKit, setDownloadingKit] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.email) { navigate("/login"); return; }
        const { data, error } = await supabase.from("purchases").select("*").eq("id", id).single();
        if (error || !data) throw new Error("Report not found");
        setPurchase(data as PurchaseRow);
      } catch (e: any) { navigate("/dashboard"); }
      finally { setLoading(false); }
    };
    load();
  }, [id, navigate]);

  const auditData = purchase?.audit_data ?? null;
  const isGeoMode = purchase?.focus === "geo";
  const activeColor = isGeoMode ? "text-neon" : "text-pulse";
  const activeBtn = isGeoMode ? "btn-neon" : "btn-pulse";

  const scores = auditData?.scores ?? {};
  const summary = auditData?.summary ?? {};
  const copyPack = auditData?.homepage_copy_pack ?? {};
  const mockupHtml = auditData?.mockup_html ?? null;
  const mockupHtmlB = auditData?.mockup_html_b ?? null;
  const activeMockupHtml = mockupVersion === "a" ? mockupHtml : (mockupHtmlB || mockupHtml);

  const orderedScores = useMemo(() => Object.entries(scores), [scores]);
  const topFixes = useMemo(() => {
    const t3 = auditData?.top_3_fixes;
    if (Array.isArray(t3) && t3.length) return [...t3].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
    return null;
  }, [auditData]);

  const overallScore = useMemo(() => auditData?.overall_score || 0, [auditData]);

  // Handlers
  const handleDownloadPdf = () => {
    setDownloadingPdf(true);
    const pdf = buildPdf({ overallScore, auditData, topFixes, orderedScores, summary, purchaseUrl: purchase?.url, hasMockupB: !!mockupHtmlB });
    pdf.save("audit-report.pdf");
    setDownloadingPdf(false);
  };

  const handleDownloadDocx = async () => {
    setDownloadingDocx(true);
    const blob = await buildDocx({ copyPack, overallScore, summary, topFixes, purchaseUrl: purchase?.url });
    saveAs(blob, "copy-pack.docx");
    setDownloadingDocx(false);
  };

  const handleDownloadKit = async () => {
    setDownloadingKit(true);
    const zip = new JSZip();
    const pdf = buildPdf({ overallScore, auditData, topFixes, orderedScores, summary, purchaseUrl: purchase?.url, hasMockupB: !!mockupHtmlB });
    zip.file("report.pdf", pdf.output("blob"));
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, "conversion-kit.zip");
    setDownloadingKit(false);
  };

  if (loading) return <div className="min-h-screen bg-obsidian flex items-center justify-center font-mono text-data text-[10px] animate-pulse">VAULT_ACCESSING...</div>;

  return (
    <div className="min-h-screen bg-obsidian text-clinic px-6 py-16">
      <EnquiryModal open={enquiryOpen} onClose={() => setEnquiryOpen(false)} prefillUrl={purchase?.url} prefillEmail={purchase?.email} purchaseId={purchase?.id} />

      <div className="mx-auto max-w-6xl space-y-12">
        <Link to="/dashboard" className="text-xs font-mono font-bold uppercase tracking-widest text-data hover:text-clinic transition-colors">← Back to Dashboard</Link>

        {/* Header */}
        <section className="rounded-lg border border-surgical bg-[#0A0A0A] overflow-hidden relative">
          <div className={cn("absolute top-0 left-0 w-full h-1", isGeoMode ? "bg-neon" : "bg-pulse")} />
          <div className="p-10 md:p-14 flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <span className={cn("font-mono text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border", isGeoMode ? "border-neon/30 text-neon" : "border-pulse/30 text-pulse")}>Diagnostic_Report_Active</span>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter mt-4 uppercase">{isGeoMode ? "GEO_STRATEGY" : "CONVERSION_FIX"}</h1>
              <p className="mt-4 font-mono text-xs text-data opacity-50 truncate max-w-md">{purchase?.url}</p>
            </div>
            <div className="text-right">
              <div className={cn("text-6xl font-black font-mono", overallScore >= 70 ? "text-[#10b981]" : "text-[#f59e0b]")}>{overallScore}<span className="text-xl text-data opacity-20">/100</span></div>
              <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-data mt-1">Health_Index</p>
            </div>
          </div>
        </section>

        {/* Main Content Area */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            
            {/* 01 Executive Summary */}
            <section className="bg-[#0A0A0A] border border-surgical rounded-lg p-8">
              <h2 className="text-xs font-mono font-bold text-data uppercase tracking-[0.2em] mb-8 opacity-40">01_Executive_Summary</h2>
              <h3 className="text-2xl font-bold mb-6 text-clinic">Biggest Opportunity</h3>
              <div className="p-8 border-l-2 border-surgical bg-black/40 italic text-data text-lg leading-relaxed">"{summary.biggest_opportunity}"</div>
              <p className="mt-8 text-data leading-loose text-sm">{summary.executive_summary}</p>
            </section>

            {/* 02 Priority Fixes */}
            <section className="bg-[#0A0A0A] border border-surgical rounded-lg p-8">
              <h2 className="text-xs font-mono font-bold text-data uppercase tracking-[0.2em] mb-8 opacity-40">02_Priority_Fixes</h2>
              <div className="space-y-4">
                {topFixes?.map((fix, idx) => (
                  <div key={idx} className="flex gap-6 p-6 bg-black/40 border border-surgical rounded-lg">
                    <div className={cn("w-10 h-10 rounded flex items-center justify-center text-black font-mono font-bold shrink-0", fix.impact === "High" ? "bg-[#E11D48]" : "bg-[#f59e0b]")}>0{idx+1}</div>
                    <div>
                      <p className="text-clinic font-bold mb-2">{fix.issue}</p>
                      <p className="text-data text-sm leading-relaxed">{fix.fix}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 03 Diagnostic Breakdown */}
            <section className="bg-[#0A0A0A] border border-surgical rounded-lg p-8">
              <h2 className="text-xs font-mono font-bold text-data uppercase tracking-[0.2em] mb-8 opacity-40">03_Breakdown</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {orderedScores.map(([key, val]: any) => (
                  <div key={key} className="p-6 bg-black/40 border border-surgical rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-clinic">{prettyLabel(key)}</span>
                      <span className={cn("font-mono font-bold", val.score >= 7 ? "text-[#10b981]" : "text-[#f59e0b]")}>{val.score}/10</span>
                    </div>
                    <p className="text-xs text-data leading-relaxed">{val.issue}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 04 Copy Pack (Restored Visibility) */}
            {copyPack.headline && (
              <section className="bg-[#0A0A0A] border border-surgical rounded-lg p-8">
                <div className="flex justify-between items-start mb-8">
                  <h2 className="text-xs font-mono font-bold text-data uppercase tracking-[0.2em] opacity-40">04_Copy_Pack</h2>
                  <button onClick={handleDownloadDocx} className="text-[10px] font-mono font-bold uppercase tracking-widest text-pulse border-b border-pulse transition-opacity hover:opacity-70">Download .DOCX</button>
                </div>
                <div className="space-y-6">
                  <div className="p-6 bg-black border border-surgical rounded">
                    <span className="text-[9px] font-mono text-data uppercase block mb-2">Headline</span>
                    <p className="text-2xl font-black text-clinic">{copyPack.headline}</p>
                  </div>
                  <div className="p-6 bg-black border border-surgical rounded">
                    <span className="text-[9px] font-mono text-data uppercase block mb-2">Sub-Headline</span>
                    <p className="text-data text-sm leading-relaxed">{copyPack.subheadline}</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 bg-black border border-surgical rounded">
                      <span className="text-[9px] font-mono text-data uppercase block mb-2">Primary CTA</span>
                      <p className="text-clinic font-bold">{copyPack.primary_cta}</p>
                    </div>
                    <div className="p-6 bg-black border border-surgical rounded">
                      <span className="text-[9px] font-mono text-data uppercase block mb-2">Trust Proof Line</span>
                      <p className="text-clinic font-bold">{copyPack.trust_line}</p>
                    </div>
                  </div>
                  {copyPack.benefit_bullets && (
                    <div className="p-6 bg-black border border-surgical rounded">
                      <span className="text-[9px] font-mono text-data uppercase block mb-4">Benefit Bullets</span>
                      <ul className="space-y-3">
                        {copyPack.benefit_bullets.map((b: string, i: number) => (
                          <li key={i} className="flex gap-3 text-sm text-data"><CheckCircle2 className="w-4 h-4 text-pulse shrink-0" /> {b}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 05 Visual Mockup (Restored Visibility) */}
            {mockupHtml && (
              <section className="bg-[#0A0A0A] border border-surgical rounded-lg overflow-hidden">
                <div className="p-8 border-b border-surgical bg-black">
                  <h2 className="text-xs font-mono font-bold text-data uppercase tracking-[0.2em] opacity-40 mb-4">05_Visual_Direction</h2>
                  <div className="flex gap-2 p-1 bg-obsidian rounded border border-surgical w-fit">
                    <button onClick={() => setMockupVersion('a')} className={cn("px-6 py-1.5 text-[10px] font-mono uppercase font-bold rounded", mockupVersion === 'a' ? "bg-surgical text-clinic" : "text-data")}>Recommended</button>
                    {mockupHtmlB && <button onClick={() => setMockupVersion('b')} className={cn("px-6 py-1.5 text-[10px] font-mono uppercase font-bold rounded", mockupVersion === 'b' ? "bg-surgical text-clinic" : "text-data")}>Alternative</button>}
                  </div>
                </div>
                <div className="aspect-video bg-white relative group">
                  <div className="absolute inset-0 pointer-events-none" dangerouslySetInnerHTML={{ __html: activeMockupHtml || "" }} />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                    <button onClick={() => navigate(`/mockup-preview/${id}`)} className="bg-black text-clinic border border-surgical px-8 py-3 font-mono text-xs uppercase font-black tracking-widest shadow-2xl">Launch Fullscreen Preview</button>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            <div className="sticky top-24 space-y-6">
              
              {/* Asset Download Card */}
              <div className="bg-[#0A0A0A] border border-surgical rounded-lg p-6">
                <p className="text-[10px] font-mono font-bold text-data uppercase tracking-widest mb-4 opacity-40">System_Output</p>
                <div className="space-y-3">
                  <button onClick={handleDownloadKit} disabled={downloadingKit} className={cn("w-full py-4 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3", activeBtn)}>
                    {downloadingKit ? "BUNDLING..." : "Download Full Kit"} <Download className="w-3 h-3" />
                  </button>
                  <button onClick={handleDownloadPdf} disabled={downloadingPdf} className="w-full py-3 border border-surgical text-clinic text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                    {downloadingPdf ? "Generating..." : "Download PDF"} <FileText className="w-3 h-3" />
                  </button>
                  <button onClick={() => setEnquiryOpen(true)} className="w-full py-3 border border-surgical text-clinic text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-colors">Request Support</button>
                </div>
              </div>

              {/* Status Card */}
              <div className="bg-[#0A0A0A] border border-surgical rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("w-2 h-2 rounded-full animate-pulse", overallScore >= 70 ? "bg-[#10b981]" : "bg-[#f59e0b]")} />
                  <span className="text-[10px] font-mono font-bold text-clinic uppercase tracking-widest">Lab_Status_Verified</span>
                </div>
                <p className="text-data text-[10px] font-mono leading-relaxed opacity-60">This report was generated using {isGeoMode ? "Machine Layer diagnostics" : "Human Layer diagnostics"} on {new Date().toLocaleDateString()}.</p>
              </div>

            </div>
          </div>
        </div>

        {/* Footer Action */}
        <section className="bg-pulse/5 border border-pulse/20 rounded-lg p-10 text-center">
           <Zap className={cn("w-10 h-10 mx-auto mb-6", isGeoMode ? "text-neon" : "text-pulse")} />
           <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">Diagnostic_Complete</h2>
           <p className="text-data text-sm font-mono max-w-xl mx-auto mb-8 opacity-60">Your full conversion kit is ready. Use the assets provided to implement these psychological and structural fixes.</p>
           <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handleDownloadKit} className={cn("px-12 py-4 font-black uppercase tracking-widest text-xs", activeBtn)}>
                 Download Kit (.ZIP)
              </button>
              <button onClick={() => setEnquiryOpen(true)} className="px-12 py-4 font-bold uppercase tracking-widest text-xs border border-surgical hover:bg-white/5 transition-colors">
                 Get Help
              </button>
           </div>
        </section>
      </div>
    </div>
  );
}
