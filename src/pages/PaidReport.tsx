import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toPng } from "html-to-image";
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
  ShadingType,
} from "docx";
import { supabase } from "../integrations/supabase/client";

type ScoreItem = {
  score?: number;
  issue?: string;
  fix?: string;
  verdict?: string;
  rewritten_copy?: string;
};

type TopFix = {
  priority?: number;
  impact?: string;
  issue?: string;
  fix?: string;
  page_region?: string;
};

type SummaryData = {
  strongest_pillar?: string;
  weakest_pillar?: string;
  biggest_opportunity?: string;
  executive_summary?: string;
};

type HomepageCopyPack = {
  headline?: string;
  subheadline?: string;
  primary_cta?: string;
  trust_line?: string;
  benefit_bullets?: string[];
  supporting_copy?: string;
};

type AuditData = {
  overall_score?: number;
  verdict?: string;
  top_3_fixes?: TopFix[];
  scores?: Record<string, ScoreItem>;
  mockup_html?: string;
  mockup_html_b?: string;
  summary?: SummaryData;
  homepage_copy_pack?: HomepageCopyPack;
  pexels_hero_image?: string;
  screenshot_url?: string;
  logo_url?: string;
  brand_name?: string;
  primary_color?: string;
};

type PurchaseRow = {
  id: string;
  status: string;
  paid_at?: string | null;
  audit_data: AuditData | null;
  url?: string | null;
  focus?: string | null;
};

type VerifyPurchaseResponse =
  | { valid: true; purchase: PurchaseRow }
  | { valid: false; error?: string };

const prettyLabel = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const scoreColor = (score?: number) => {
  if (typeof score !== "number") return "text-slate-400";
  if (score >= 8) return "text-emerald-600";
  if (score >= 5) return "text-amber-500";
  return "text-red-500";
};

const impactColor: Record<string, string> = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#6b7280",
};

const impactBg: Record<string, string> = {
  High: "rgba(239,68,68,0.08)",
  Medium: "rgba(245,158,11,0.08)",
  Low: "rgba(107,114,128,0.08)",
};

const GEO_PILLAR_KEYS = ["ai_search", "ai_readiness", "geo", "search_readiness"];
const isGeoPillar = (key: string) =>
  GEO_PILLAR_KEYS.some((fragment) => key.toLowerCase().includes(fragment));

// ─── PDF PRINT TEMPLATE ────────────────────────────────────────────────────
const buildPdfHtml = ({
  isGeoMode,
  overallScore,
  auditData,
  topFixes,
  orderedScores,
  copyPack,
  summary,
  purchaseUrl,
}: {
  isGeoMode: boolean;
  overallScore: number | null;
  auditData: AuditData | null;
  topFixes: TopFix[] | null;
  orderedScores: [string, ScoreItem][];
  copyPack: HomepageCopyPack;
  summary: SummaryData;
  purchaseUrl?: string | null;
}) => {
  const bullets = Array.isArray(copyPack.benefit_bullets)
    ? copyPack.benefit_bullets.filter(Boolean)
    : [];

  const scoreLabel =
    overallScore !== null && overallScore >= 70
      ? "Healthy"
      : overallScore !== null && overallScore >= 50
      ? "Needs Attention"
      : "Critical";

  const scoreHex =
    overallScore !== null && overallScore >= 70
      ? "#10b981"
      : overallScore !== null && overallScore >= 50
      ? "#f59e0b"
      : "#ef4444";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #fff; color: #1e293b; font-size: 13px; line-height: 1.6; }
  .page { max-width: 800px; margin: 0 auto; padding: 48px 40px; }

  /* Header */
  .header { background: linear-gradient(135deg, #020617, #0f172a); border-radius: 16px; padding: 32px 36px; margin-bottom: 32px; }
  .header-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.25em; color: #2dd4bf; margin-bottom: 8px; }
  .header-title { font-size: 28px; font-weight: 700; color: #fff; margin-bottom: 8px; }
  .header-verdict { font-size: 14px; color: #94a3b8; font-style: italic; margin-bottom: 8px; }
  .header-url { font-size: 12px; color: #2dd4bf; }
  .header-brand { display: flex; justify-content: space-between; align-items: flex-start; }
  .cd-logo { font-size: 13px; font-weight: 700; color: #2dd4bf; letter-spacing: 0.05em; }

  /* Section */
  .section { margin-bottom: 28px; }
  .section-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.22em; color: #0d9488; margin-bottom: 4px; }
  .section-title { font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 16px; }

  /* Score cards */
  .score-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
  .score-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
  .score-card-label { font-size: 11px; color: #64748b; margin-bottom: 4px; }
  .score-card-value { font-size: 24px; font-weight: 700; }

  /* Teal box */
  .teal-box { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
  .teal-box-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em; color: #0f766e; margin-bottom: 6px; }
  .teal-box-text { font-size: 15px; font-weight: 600; color: #1e293b; }

  /* Grey box */
  .grey-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
  .grey-box-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em; color: #94a3b8; margin-bottom: 6px; }
  .grey-box-text { color: #475569; line-height: 1.7; }

  /* Fix cards */
  .fix-card { border-radius: 12px; padding: 16px; margin-bottom: 10px; display: flex; gap: 14px; border: 1px solid transparent; }
  .fix-number { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: 700; flex-shrink: 0; }
  .fix-impact-badge { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 2px 8px; border-radius: 999px; border: 1px solid transparent; margin-bottom: 6px; display: inline-block; }
  .fix-issue { font-weight: 600; color: #1e293b; margin-bottom: 4px; font-size: 13px; }
  .fix-fix { color: #475569; font-size: 12px; }
  .fix-arrow { color: #0d9488; font-weight: 700; margin-right: 4px; }

  /* Pillar cards */
  .pillar-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 10px; }
  .pillar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .pillar-name { font-size: 15px; font-weight: 600; color: #1e293b; }
  .pillar-score { font-size: 15px; font-weight: 700; }
  .pillar-sub-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em; color: #94a3b8; margin-bottom: 4px; margin-top: 8px; }
  .pillar-sub-text { color: #1e293b; font-size: 12px; }
  .pillar-rewrite-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em; color: #0d9488; margin-bottom: 4px; margin-top: 8px; }
  .pillar-rewrite-text { color: #1e293b; font-size: 12px; font-style: italic; }

  /* Copy pack */
  .copy-headline { font-size: 22px; font-weight: 600; color: #1e293b; }
  .bullet-item { display: flex; gap: 10px; margin-bottom: 6px; }
  .bullet-check { color: #0d9488; font-weight: 700; }

  /* Footer */
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
  .footer-brand { font-size: 12px; font-weight: 700; color: #0d9488; }
  .footer-url { font-size: 11px; color: #94a3b8; }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="header-brand">
      <div>
        <div class="header-label">${isGeoMode ? "Full GEO Audit" : "Full Diagnosis"}</div>
        <div class="header-title">${isGeoMode ? "AI Search Readiness Report" : "Conversion Report"}</div>
        ${auditData?.verdict ? `<div class="header-verdict">"${auditData.verdict}"</div>` : ""}
        ${purchaseUrl ? `<div class="header-url">${purchaseUrl}</div>` : ""}
      </div>
      <div class="cd-logo">ConversionDoc</div>
    </div>
  </div>

  <!-- Executive Summary -->
  <div class="section">
    <div class="section-label">Executive Summary</div>
    <div class="section-title">${isGeoMode ? "Your biggest opportunity to improve AI search visibility" : "Your strongest opportunity to improve conversions"}</div>

    <div class="score-grid">
      <div class="score-card">
        <div class="score-card-label">${isGeoMode ? "GEO Readiness Score" : "Overall Score"}</div>
        <div class="score-card-value" style="color:${scoreHex}">${overallScore !== null ? `${overallScore}/100` : "N/A"}</div>
      </div>
      <div class="score-card">
        <div class="score-card-label">${isGeoMode ? "Strongest Dimension" : "Strongest Pillar"}</div>
        <div style="font-size:16px;font-weight:600;color:#1e293b;margin-top:4px">${summary.strongest_pillar ? prettyLabel(summary.strongest_pillar) : "N/A"}</div>
      </div>
      <div class="score-card">
        <div class="score-card-label">${isGeoMode ? "Weakest Dimension" : "Weakest Pillar"}</div>
        <div style="font-size:16px;font-weight:600;color:#1e293b;margin-top:4px">${summary.weakest_pillar ? prettyLabel(summary.weakest_pillar) : "N/A"}</div>
      </div>
    </div>

    <div class="teal-box">
      <div class="teal-box-label">${isGeoMode ? "Biggest GEO Opportunity" : "Biggest Opportunity"}</div>
      <div class="teal-box-text">${summary.biggest_opportunity || "N/A"}</div>
    </div>

    <div class="grey-box">
      <div class="grey-box-label">Diagnosis</div>
      <div class="grey-box-text">${summary.executive_summary || "N/A"}</div>
    </div>
  </div>

  <!-- Top Fixes -->
  <div class="section">
    <div class="section-label">Action Plan</div>
    <div class="section-title">${isGeoMode ? "Top AI Visibility Fixes" : "Top Priority Fixes"}</div>
    ${(topFixes || []).map((fix) => {
      const impact = fix.impact || "Medium";
      const hex = impact === "High" ? "#ef4444" : impact === "Medium" ? "#f59e0b" : "#6b7280";
      const bg = impact === "High" ? "rgba(239,68,68,0.06)" : impact === "Medium" ? "rgba(245,158,11,0.06)" : "rgba(107,114,128,0.06)";
      return `
      <div class="fix-card" style="background:${bg};border-left:4px solid ${hex}">
        <div class="fix-number" style="background:${hex}">${fix.priority ?? ""}</div>
        <div>
          <div class="fix-impact-badge" style="color:${hex};border-color:${hex}40;background:${hex}15">${impact} Impact</div>
          <div class="fix-issue">${fix.issue || ""}</div>
          <div class="fix-fix"><span class="fix-arrow">→</span>${fix.fix || ""}</div>
        </div>
      </div>`;
    }).join("")}
  </div>

  <!-- Score Breakdown -->
  <div class="section">
    <div class="section-label">Full Analysis</div>
    <div class="section-title">${isGeoMode ? "GEO Dimension Breakdown" : "Score Breakdown"}</div>
    ${orderedScores.map(([pillar, value]) => {
      const s = value?.score;
      const hex = typeof s === "number" ? (s >= 8 ? "#10b981" : s >= 5 ? "#f59e0b" : "#ef4444") : "#94a3b8";
      return `
      <div class="pillar-card">
        <div class="pillar-header">
          <div class="pillar-name">${prettyLabel(pillar)}</div>
          <div class="pillar-score" style="color:${hex}">${typeof s === "number" ? `${s}/10` : "—"}</div>
        </div>
        ${value?.issue ? `<div class="pillar-sub-label">Issue</div><div class="pillar-sub-text">${value.issue}</div>` : ""}
        ${value?.fix ? `<div class="pillar-sub-label">Recommended Fix</div><div class="pillar-sub-text">${value.fix}</div>` : ""}
        ${value?.rewritten_copy ? `<div class="pillar-rewrite-label">${isGeoMode ? "Rewritten Content" : "Rewritten Copy"}</div><div class="pillar-rewrite-text">${value.rewritten_copy}</div>` : ""}
      </div>`;
    }).join("")}
  </div>

  <!-- Copy Pack -->
  <div class="section">
    <div class="section-label">Deliverable</div>
    <div class="section-title">${isGeoMode ? "Content Pack" : "Copy Pack"}</div>

    <div class="teal-box">
      <div class="teal-box-label">Headline</div>
      <div class="copy-headline">${copyPack.headline || "N/A"}</div>
    </div>

    <div class="grey-box">
      <div class="grey-box-label">Subheadline</div>
      <div class="grey-box-text">${copyPack.subheadline || "N/A"}</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div class="grey-box" style="margin-bottom:0">
        <div class="grey-box-label">Primary CTA</div>
        <div style="font-weight:600;color:#1e293b">${copyPack.primary_cta || "N/A"}</div>
      </div>
      <div class="grey-box" style="margin-bottom:0">
        <div class="grey-box-label">Trust Line</div>
        <div style="font-weight:600;color:#1e293b">${copyPack.trust_line || "N/A"}</div>
      </div>
    </div>

    <div class="grey-box">
      <div class="grey-box-label">${isGeoMode ? "Key Points" : "Benefit Bullets"}</div>
      ${bullets.map((b) => `<div class="bullet-item"><span class="bullet-check">✓</span><span>${b}</span></div>`).join("")}
    </div>

    ${copyPack.supporting_copy ? `
    <div class="grey-box">
      <div class="grey-box-label">Supporting Copy</div>
      <div class="grey-box-text">${copyPack.supporting_copy}</div>
    </div>` : ""}
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-brand">ConversionDoc — conversiondoc.co.uk</div>
    <div class="footer-url">${purchaseUrl || ""}</div>
  </div>

</div>
</body>
</html>`;
};

// ─── DOCX COPY PACK BUILDER ────────────────────────────────────────────────
const buildDocx = async ({
  isGeoMode,
  copyPack,
  overallScore,
  summary,
  topFixes,
  purchaseUrl,
}: {
  isGeoMode: boolean;
  copyPack: HomepageCopyPack;
  overallScore: number | null;
  summary: SummaryData;
  topFixes: TopFix[] | null;
  purchaseUrl?: string | null;
}): Promise<Blob> => {
  const bullets = Array.isArray(copyPack.benefit_bullets)
    ? copyPack.benefit_bullets.filter(Boolean)
    : [];

  const tealColor = "0D9488";
  const navyColor = "1E3A5F";
  const slateColor = "475569";
  const darkColor = "1E293B";

  const sectionLabel = (text: string) =>
    new Paragraph({
      children: [
        new TextRun({
          text: text.toUpperCase(),
          color: tealColor,
          size: 18,
          font: "Inter",
          bold: true,
          characterSpacing: 80,
        }),
      ],
      spacing: { before: 320, after: 80 },
    });

  const heading = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text,
          color: darkColor,
          size: 28,
          font: "Inter",
          bold: true,
        }),
      ],
      spacing: { after: 160 },
    });

  const subLabel = (text: string) =>
    new Paragraph({
      children: [
        new TextRun({
          text: text.toUpperCase(),
          color: "94A3B8",
          size: 16,
          font: "Inter",
          bold: true,
          characterSpacing: 60,
        }),
      ],
      spacing: { before: 160, after: 60 },
    });

  const bodyText = (text: string, italic = false) =>
    new Paragraph({
      children: [
        new TextRun({
          text,
          color: slateColor,
          size: 22,
          font: "Inter",
          italics: italic,
        }),
      ],
      spacing: { after: 100 },
    });

  const boldText = (text: string) =>
    new Paragraph({
      children: [
        new TextRun({
          text,
          color: darkColor,
          size: 22,
          font: "Inter",
          bold: true,
        }),
      ],
      spacing: { after: 100 },
    });

  const divider = () =>
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
      },
      spacing: { before: 200, after: 200 },
      children: [],
    });

  const children = [
    // Title block
    new Paragraph({
      children: [
        new TextRun({
          text: "ConversionDoc",
          color: tealColor,
          size: 20,
          font: "Inter",
          bold: true,
          characterSpacing: 60,
        }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: isGeoMode ? "AI Search Readiness Report" : "Conversion Report",
          color: navyColor,
          size: 48,
          font: "Inter",
          bold: true,
        }),
      ],
      spacing: { after: 120 },
    }),
    ...(purchaseUrl
      ? [
          new Paragraph({
            children: [
              new TextRun({
                text: purchaseUrl,
                color: tealColor,
                size: 20,
                font: "Inter",
              }),
            ],
            spacing: { after: 80 },
          }),
        ]
      : []),

    divider(),

    // Executive Summary
    sectionLabel("Executive Summary"),
    heading(isGeoMode ? "AI Search Readiness Score" : "Overall Score"),
    new Paragraph({
      children: [
        new TextRun({
          text: overallScore !== null ? `${overallScore}/100` : "N/A",
          color:
            overallScore !== null && overallScore >= 70
              ? "10B981"
              : overallScore !== null && overallScore >= 50
              ? "F59E0B"
              : "EF4444",
          size: 48,
          font: "Inter",
          bold: true,
        }),
      ],
      spacing: { after: 160 },
    }),

    subLabel(isGeoMode ? "Strongest Dimension" : "Strongest Pillar"),
    boldText(summary.strongest_pillar ? prettyLabel(summary.strongest_pillar) : "N/A"),

    subLabel(isGeoMode ? "Weakest Dimension" : "Weakest Pillar"),
    boldText(summary.weakest_pillar ? prettyLabel(summary.weakest_pillar) : "N/A"),

    subLabel(isGeoMode ? "Biggest GEO Opportunity" : "Biggest Opportunity"),
    bodyText(summary.biggest_opportunity || "N/A"),

    subLabel("Diagnosis"),
    bodyText(summary.executive_summary || "N/A"),

    divider(),

    // Top Fixes
    sectionLabel("Action Plan"),
    heading(isGeoMode ? "Top AI Visibility Fixes" : "Top Priority Fixes"),
    ...(topFixes || []).flatMap((fix, i) => [
      new Paragraph({
        children: [
          new TextRun({
            text: `${fix.priority ?? i + 1}. ${fix.impact?.toUpperCase() ?? "MEDIUM"} IMPACT`,
            color:
              fix.impact === "High"
                ? "EF4444"
                : fix.impact === "Medium"
                ? "F59E0B"
                : "6B7280",
            size: 18,
            font: "Inter",
            bold: true,
            characterSpacing: 60,
          }),
        ],
        spacing: { before: 200, after: 60 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: fix.issue || "",
            color: darkColor,
            size: 22,
            font: "Inter",
            bold: true,
          }),
        ],
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `→ ${fix.fix || ""}`,
            color: slateColor,
            size: 22,
            font: "Inter",
          }),
        ],
        spacing: { after: 120 },
      }),
    ]),

    divider(),

    // Copy Pack
    sectionLabel("Deliverable"),
    heading(isGeoMode ? "Content Pack" : "Copy Pack"),

    subLabel("Headline"),
    new Paragraph({
      children: [
        new TextRun({
          text: copyPack.headline || "N/A",
          color: darkColor,
          size: 32,
          font: "Inter",
          bold: true,
        }),
      ],
      spacing: { after: 160 },
    }),

    subLabel("Subheadline"),
    bodyText(copyPack.subheadline || "N/A"),

    subLabel("Primary CTA"),
    boldText(copyPack.primary_cta || "N/A"),

    subLabel("Trust Line"),
    boldText(copyPack.trust_line || "N/A"),

    subLabel(isGeoMode ? "Key Points" : "Benefit Bullets"),
    ...bullets.map((b) =>
      new Paragraph({
        children: [
          new TextRun({ text: "✓  ", color: tealColor, size: 22, font: "Inter", bold: true }),
          new TextRun({ text: b, color: slateColor, size: 22, font: "Inter" }),
        ],
        spacing: { after: 80 },
      })
    ),

    ...(copyPack.supporting_copy
      ? [subLabel("Supporting Copy"), bodyText(copyPack.supporting_copy)]
      : []),

    divider(),

    // Footer
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "Generated by ConversionDoc — conversiondoc.co.uk",
          color: tealColor,
          size: 18,
          font: "Inter",
          bold: true,
        }),
      ],
      spacing: { before: 200 },
    }),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
};

// ───────────────────────────────────────────────────────────────────────────

export default function PaidReport() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchase, setPurchase] = useState<PurchaseRow | null>(null);
  const [activeTab, setActiveTab] = useState<"before" | "after">("before");
  const [mockupVersion, setMockupVersion] = useState<"a" | "b">("a");
  const [fullscreen, setFullscreen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingKit, setDownloadingKit] = useState(false);

  const [screenshotLoaded, setScreenshotLoaded] = useState(false);
  const [screenshotErrored, setScreenshotErrored] = useState(false);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);

  const mockupRef = useRef<HTMLDivElement>(null);
  const mockupRefB = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!sessionId) throw new Error("Missing session_id in URL");
        const { data, error } = await supabase.functions.invoke<VerifyPurchaseResponse>(
          "verify-purchase",
          { method: "POST", body: { session_id: sessionId } }
        );
        if (error) throw new Error(error.message);
        if (!data) throw new Error("No response from verify-purchase");
        if (!data.valid) throw new Error(data.error || "Purchase not valid / not paid");
        if (cancelled) return;
        setPurchase(data.purchase);
        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        setError(String(e?.message || e));
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [sessionId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const auditData = purchase?.audit_data ?? null;
  const scores = auditData?.scores ?? {};
  const summary = auditData?.summary ?? {};
  const copyPack = auditData?.homepage_copy_pack ?? {};
  const mockupHtml = auditData?.mockup_html ?? null;
  const mockupHtmlB = auditData?.mockup_html_b ?? null;
  const activeMockupHtml = mockupVersion === "a" ? mockupHtml : (mockupHtmlB || mockupHtml);

  const isGeoMode =
    searchParams.get("focus") === "geo" ||
    purchase?.focus === "geo";

  const orderedScores = useMemo(() => {
    const entries = Object.entries(scores);
    if (!isGeoMode) return entries;
    const geoEntries = entries.filter(([key]) => isGeoPillar(key));
    const otherEntries = entries.filter(([key]) => !isGeoPillar(key));
    return [...geoEntries, ...otherEntries];
  }, [scores, isGeoMode]);

  const topFixes = useMemo(() => {
    const t3 = auditData?.top_3_fixes;
    if (Array.isArray(t3) && t3.length) {
      return [...t3].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
    }
    return null;
  }, [auditData]);

  const overallScore = useMemo(() => {
    if (typeof auditData?.overall_score === "number") return auditData.overall_score;
    const nums = Object.entries(scores)
      .map(([, v]) => v?.score)
      .filter((x): x is number => typeof x === "number");
    if (!nums.length) return null;
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    return avg <= 10 ? Math.round(avg * 10) : Math.round(avg);
  }, [auditData, scores]);

  const screenshotUrl = (auditData?.screenshot_url || "").length > 0
    ? auditData!.screenshot_url!
    : purchase?.url
      ? `https://image.thum.io/get/width/1400/crop/900/noanimate/${purchase.url}`
      : null;

  useEffect(() => {
    if (!screenshotUrl || screenshotLoaded || screenshotErrored) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setScreenshotDataUrl(dataUrl);
        }
      } catch {
        setScreenshotDataUrl(screenshotUrl);
      }
      setScreenshotLoaded(true);
    };
    img.onerror = () => { setScreenshotErrored(true); };
    img.src = screenshotUrl;
  }, [screenshotUrl]);

  const displayScreenshotUrl = screenshotDataUrl || screenshotUrl;

  const handleCopyCode = async () => {
    if (!activeMockupHtml) return;
    try {
      await navigator.clipboard.writeText(activeMockupHtml);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch {
      setCopySuccess(false);
    }
  };

  // ── PNG: render into a hidden off-screen iframe to avoid GEO mode issues ──
  const generateMockupPng = async (html: string | null): Promise<string> => {
    if (!html) throw new Error("Mockup HTML not available");

    return new Promise((resolve, reject) => {
      const iframe = document.createElement("iframe");
      iframe.style.cssText =
        "position:fixed;left:-9999px;top:-9999px;width:1200px;height:800px;border:none;visibility:hidden;";
      document.body.appendChild(iframe);

      iframe.onload = async () => {
        try {
          const doc = iframe.contentDocument;
          if (!doc) throw new Error("iframe document not accessible");
          doc.open();
          doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body style="margin:0;padding:0;background:#f8fafc;">${html}</body></html>`);
          doc.close();

          await new Promise((r) => setTimeout(r, 800));

          const canvas = await html2canvas(doc.body, {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            backgroundColor: "#f8fafc",
            width: 1200,
            height: Math.max(doc.body.scrollHeight, 800),
          });

          resolve(canvas.toDataURL("image/png"));
        } catch (err) {
          reject(err);
        } finally {
          document.body.removeChild(iframe);
        }
      };

      iframe.src = "about:blank";
    });
  };

  const handleDownloadPng = async () => {
    try {
      setDownloading(true);
      const dataUrl = await generateMockupPng(activeMockupHtml);
      saveAs(dataUrl, isGeoMode ? "geo-mockup.png" : "homepage-mockup.png");
    } catch (e) {
      console.error("PNG download failed:", e);
    } finally {
      setDownloading(false);
    }
  };

  // ── PDF ────────────────────────────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);

      const html = buildPdfHtml({
        isGeoMode,
        overallScore,
        auditData,
        topFixes,
        orderedScores,
        copyPack,
        summary,
        purchaseUrl: purchase?.url,
      });

      const iframe = document.createElement("iframe");
      iframe.style.cssText =
        "position:fixed;left:-9999px;top:-9999px;width:900px;height:1200px;border:none;visibility:hidden;";
      document.body.appendChild(iframe);

      await new Promise<void>((resolve) => {
        iframe.onload = () => resolve();
        iframe.src = "about:blank";
      });

      const doc = iframe.contentDocument!;
      doc.open();
      doc.write(html);
      doc.close();

      await new Promise((r) => setTimeout(r, 1500));

      const canvas = await html2canvas(doc.body, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        width: 900,
        height: doc.body.scrollHeight,
      });

      document.body.removeChild(iframe);

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const filename = isGeoMode ? "geo-audit-report.pdf" : "conversion-report.pdf";
      pdf.save(filename);
    } catch (e) {
      console.error("PDF download failed:", e);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // ── DOCX ───────────────────────────────────────────────────────────────────
  const handleDownloadDocx = async () => {
    try {
      setDownloadingDocx(true);
      const blob = await buildDocx({
        isGeoMode,
        copyPack,
        overallScore,
        summary,
        topFixes,
        purchaseUrl: purchase?.url,
      });
      saveAs(blob, isGeoMode ? "geo-content-pack.docx" : "copy-pack.docx");
    } catch (e) {
      console.error("DOCX download failed:", e);
    } finally {
      setDownloadingDocx(false);
    }
  };

  // ── README ─────────────────────────────────────────────────────────────────
  const buildReadme = () => {
    const prefix = isGeoMode ? "geo" : "homepage";
    return `# ConversionDoc ${isGeoMode ? "GEO Audit" : "Homepage"} Kit

This kit contains your improved ${isGeoMode ? "page" : "homepage"} assets generated by ConversionDoc.

## Files included
- ${prefix}-audit-report.pdf       (Full audit report — clean PDF)
- ${isGeoMode ? "geo-content-pack" : "copy-pack"}.docx              (Formatted copy/content pack)
- implementation-notes.txt
- ${prefix}-mockup-a.html          (Version A mockup)
- ${prefix}-mockup-a.png           (Version A mockup screenshot)
${mockupHtmlB ? `- ${prefix}-mockup-b.html          (Version B mockup)
- ${prefix}-mockup-b.png           (Version B mockup screenshot)` : ""}

## How to use
1. Open the PDF report for the full diagnosis.
2. Use the copy/content pack DOCX for your updated messaging.
3. Open the mockup HTML files in your browser to preview the improved direction.
4. Share with your developer or designer.
5. Apply the highest-impact changes first.

## Website audited
${purchase?.url || "N/A"}

## Generated by ConversionDoc
conversiondoc.co.uk
`;
  };

  const buildImplementationNotes = () => {
    const strongest = summary.strongest_pillar ? prettyLabel(summary.strongest_pillar) : "N/A";
    const weakest = summary.weakest_pillar ? prettyLabel(summary.weakest_pillar) : "N/A";
    return `IMPLEMENTATION NOTES
Generated by ConversionDoc — conversiondoc.co.uk
${"=".repeat(50)}

Overall Score: ${overallScore !== null ? `${overallScore}/100` : "N/A"}
Verdict: ${auditData?.verdict || "N/A"}

Strongest ${isGeoMode ? "Dimension" : "Pillar"}: ${strongest}
Weakest ${isGeoMode ? "Dimension" : "Pillar"}: ${weakest}

Biggest Opportunity:
${summary.biggest_opportunity || "N/A"}

Executive Summary:
${summary.executive_summary || "N/A"}

${"=".repeat(50)}
TOP 3 PRIORITY FIXES
${"=".repeat(50)}
${(topFixes || [])
  .map(
    (fix) => `
Priority ${fix.priority || "-"} — ${fix.impact || "Medium"} Impact
Issue: ${fix.issue || "N/A"}
Fix: ${fix.fix || "N/A"}`
  )
  .join("\n")}
`;
  };

  const buildMockupHtmlFile = (html: string | null) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${isGeoMode ? "GEO Mockup" : "Homepage Mockup"} — ConversionDoc</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;">
${html || ""}
</body>
</html>`;

  // ── ZIP ────────────────────────────────────────────────────────────────────
  const handleDownloadKit = async () => {
    try {
      setDownloadingKit(true);
      const zip = new JSZip();
      const prefix = isGeoMode ? "geo" : "homepage";

      zip.file("README.md", buildReadme());
      zip.file("implementation-notes.txt", buildImplementationNotes());

      // DOCX copy pack
      const docxBlob = await buildDocx({
        isGeoMode,
        copyPack,
        overallScore,
        summary,
        topFixes,
        purchaseUrl: purchase?.url,
      });
      const docxArrayBuffer = await docxBlob.arrayBuffer();
      zip.file(
        isGeoMode ? "geo-content-pack.docx" : "copy-pack.docx",
        docxArrayBuffer
      );

      // PDF report
      try {
        const pdfHtml = buildPdfHtml({
          isGeoMode,
          overallScore,
          auditData,
          topFixes,
          orderedScores,
          copyPack,
          summary,
          purchaseUrl: purchase?.url,
        });

        const iframe = document.createElement("iframe");
        iframe.style.cssText =
          "position:fixed;left:-9999px;top:-9999px;width:900px;height:1200px;border:none;visibility:hidden;";
        document.body.appendChild(iframe);

        await new Promise<void>((resolve) => {
          iframe.onload = () => resolve();
          iframe.src = "about:blank";
        });

        const doc = iframe.contentDocument!;
        doc.open();
        doc.write(pdfHtml);
        doc.close();
        await new Promise((r) => setTimeout(r, 1500));

        const canvas = await html2canvas(doc.body, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          width: 900,
          height: doc.body.scrollHeight,
        });
        document.body.removeChild(iframe);

        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * pageWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        while (heightLeft > 0) {
          position -= pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        const pdfBlob = pdf.output("blob");
        const pdfBuffer = await pdfBlob.arrayBuffer();
        zip.file(`${prefix}-audit-report.pdf`, pdfBuffer);
      } catch (e) {
        console.error("Could not generate PDF for ZIP:", e);
      }

      // Version A mockup HTML + PNG
      if (mockupHtml) {
        zip.file(`${prefix}-mockup-a.html`, buildMockupHtmlFile(mockupHtml));
        try {
          const pngA = await generateMockupPng(mockupHtml);
          zip.file(`${prefix}-mockup-a.png`, pngA.split(",")[1], { base64: true });
        } catch (e) {
          console.error("Could not generate Version A PNG for ZIP:", e);
        }
      }

      // Version B mockup HTML + PNG
      if (mockupHtmlB) {
        zip.file(`${prefix}-mockup-b.html`, buildMockupHtmlFile(mockupHtmlB));
        try {
          const pngB = await generateMockupPng(mockupHtmlB);
          zip.file(`${prefix}-mockup-b.png`, pngB.split(",")[1], { base64: true });
        } catch (e) {
          console.error("Could not generate Version B PNG for ZIP:", e);
        }
      }

      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `conversiondoc-${prefix}-kit.zip`);
    } catch (e) {
      console.error("Kit download failed:", e);
    } finally {
      setDownloadingKit(false);
    }
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 font-medium">Loading your report…</p>
        </div>
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-[24px] border border-red-100 shadow-sm p-8 text-center space-y-4">
          <p className="text-4xl">⚠️</p>
          <h1 className="text-xl font-bold text-slate-900">Report unavailable</h1>
          <p className="text-slate-600 text-sm">{error || "Could not load your purchase."}</p>
          <a href="/" className="inline-block mt-4 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold px-5 py-3 transition-colors text-sm">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f8fc] px-6 py-16">

      {screenshotUrl && !screenshotLoaded && !screenshotErrored && (
        <div style={{
          position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
          zIndex: 50, background: "rgba(15,23,42,0.85)", color: "#fff",
          fontSize: 12, fontWeight: 600, padding: "8px 16px", borderRadius: 999,
          display: "flex", alignItems: "center", gap: 8, backdropFilter: "blur(8px)",
        }}>
          <div style={{
            width: 12, height: 12, borderRadius: "50%",
            border: "2px solid #2dd4bf", borderTopColor: "transparent",
            animation: "cdSpin 0.8s linear infinite", flexShrink: 0,
          }} />
          Preparing screenshot…
          <style>{`@keyframes cdSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      <div className="mx-auto max-w-6xl space-y-8">

        {/* Header */}
        <section className="rounded-[32px] overflow-hidden border border-slate-900/10 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),_transparent_30%),linear-gradient(135deg,#020617,#0f172a_50%,#111827)] px-8 py-10 md:px-10 md:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-400">
              {isGeoMode ? "Full GEO Audit" : "Full Diagnosis"}
            </p>
            <h1 className="mt-3 text-4xl md:text-5xl font-bold text-white tracking-tight">
              {isGeoMode ? "AI Search Readiness Report" : "Conversion Report"}
            </h1>
            {auditData?.verdict && (
              <p className="mt-4 text-lg text-slate-300 italic max-w-3xl">
                "{auditData.verdict}"
              </p>
            )}
            {purchase.url && (
              <a href={purchase.url} target="_blank" rel="noopener noreferrer"
                className="mt-3 inline-block text-teal-400 text-sm hover:underline">
                {purchase.url} →
              </a>
            )}
          </div>
        </section>

        {/* Executive Summary */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
              Executive Summary
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              {isGeoMode
                ? "Your biggest opportunity to improve AI search visibility"
                : "Your strongest opportunity to improve conversions"}
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3 mb-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                {isGeoMode ? "GEO Readiness Score" : "Overall Score"}
              </p>
              <p className={`mt-2 text-3xl font-bold ${
                overallScore !== null && overallScore >= 70 ? "text-emerald-600"
                : overallScore !== null && overallScore >= 50 ? "text-amber-500"
                : "text-red-500"
              }`}>
                {overallScore !== null ? `${overallScore}/100` : "N/A"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                {isGeoMode ? "Strongest Dimension" : "Strongest Pillar"}
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {summary.strongest_pillar ? prettyLabel(summary.strongest_pillar) : "N/A"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                {isGeoMode ? "Weakest Dimension" : "Weakest Pillar"}
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {summary.weakest_pillar ? prettyLabel(summary.weakest_pillar) : "N/A"}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-teal-100 bg-teal-50 p-5 mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 mb-2">
              {isGeoMode ? "Biggest GEO Opportunity" : "Biggest Opportunity"}
            </p>
            <p className="text-slate-900 font-medium text-lg">
              {summary.biggest_opportunity || "No summary available."}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">
              Diagnosis
            </p>
            <p className="text-slate-700 leading-8">
              {summary.executive_summary || "No executive summary available."}
            </p>
          </div>
        </section>

        {/* Top Fixes */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
              Action Plan
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              {isGeoMode ? "🔍 Top AI Visibility Fixes" : "🔥 Top Priority Fixes"}
            </h2>
          </div>
          {topFixes ? (
            <div className="space-y-4">
              {topFixes.map((x, idx) => {
                const color = impactColor[x.impact || "Medium"] || "#f59e0b";
                const bg = impactBg[x.impact || "Medium"] || impactBg["Medium"];
                return (
                  <div key={idx} className="flex gap-4 rounded-2xl border p-5"
                    style={{ borderColor: `${color}25`, borderLeftWidth: 4, borderLeftColor: color, background: bg }}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold shadow-sm"
                      style={{ background: color }}>
                      {x.priority ?? idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                          style={{ color, background: `${color}15`, borderColor: `${color}30` }}>
                          {x.impact ?? "—"} Impact
                        </span>
                      </div>
                      {x.issue && (
                        <p className="font-semibold text-slate-900 mb-1">{x.issue}</p>
                      )}
                      <div className="flex items-start gap-1.5">
                        <span className="text-teal-500 font-bold text-sm shrink-0">→</span>
                        <p className="text-sm text-slate-700">{x.fix}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-600">No fixes available.</p>
          )}
        </section>

        {/* Score Breakdown */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
              Full Analysis
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              {isGeoMode ? "📊 GEO Dimension Breakdown" : "📊 Score Breakdown"}
            </h2>
          </div>
          {orderedScores.length === 0 ? (
            <p className="text-slate-600">No score data available.</p>
          ) : (
            <div className="space-y-5">
              {orderedScores.map(([pillar, value]) => (
                <div key={pillar} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-slate-900">
                      {prettyLabel(pillar)}
                    </h3>
                    <span className={`text-xl font-bold ${scoreColor(value?.score)}`}>
                      {typeof value?.score === "number" ? `${value.score}/10` : "—"}
                    </span>
                  </div>
                  {value?.issue && (
                    <div className="mb-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-1">Issue</p>
                      <p className="text-slate-800">{value.issue}</p>
                    </div>
                  )}
                  {value?.fix && (
                    <div className="mb-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-1">Recommended Fix</p>
                      <p className="text-slate-800">{value.fix}</p>
                    </div>
                  )}
                  {value?.rewritten_copy && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-600 mb-1">
                        {isGeoMode ? "Rewritten Content" : "Rewritten Copy"}
                      </p>
                      <p className="text-slate-800 italic">{value.rewritten_copy}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Copy Pack */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
                Deliverable
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {isGeoMode ? "✍️ Content Pack" : "✍️ Copy Pack"}
              </h2>
              <p className="text-slate-500 text-sm mt-2">
                {isGeoMode
                  ? "Page-ready content written for AI extractability, clarity, and conversion."
                  : "Homepage-ready copy written to improve clarity, trust, and action."}
              </p>
            </div>
            <button
              onClick={handleDownloadDocx}
              disabled={downloadingDocx}
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-5 py-3 transition-colors text-sm shadow-sm disabled:opacity-50"
            >
              {downloadingDocx
                ? "Generating…"
                : isGeoMode
                ? "Download Content Pack (.docx)"
                : "Download Copy Pack (.docx)"}
            </button>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-teal-100 bg-teal-50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 mb-2">Headline</p>
              <p className="text-2xl font-semibold text-slate-900">{copyPack.headline || "N/A"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Subheadline</p>
              <p className="text-slate-800">{copyPack.subheadline || "N/A"}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Primary CTA</p>
                <p className="text-slate-900 font-medium">{copyPack.primary_cta || "N/A"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Trust Line</p>
                <p className="text-slate-900 font-medium">{copyPack.trust_line || "N/A"}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-3">
                {isGeoMode ? "Key Points" : "Benefit Bullets"}
              </p>
              <ul className="space-y-3 text-slate-800">
                {(copyPack.benefit_bullets || []).map((bullet, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-teal-500 font-bold">✓</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
            {copyPack.supporting_copy && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Supporting Copy</p>
                <p className="text-slate-800">{copyPack.supporting_copy}</p>
              </div>
            )}
          </div>
        </section>

        {/* Visual Deliverable */}
        <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-[linear-gradient(135deg,#020617,#0f172a)] px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-400">
              Visual Deliverable
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              {isGeoMode ? "🎨 Your Restructured Page Mockup" : "🎨 Your Homepage Mockup"}
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              {isGeoMode
                ? "Compare your current page with a GEO-optimised direction."
                : "Compare your current site with a more conversion-focused direction."}
            </p>
          </div>

          {/* Before / After tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab("before")}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                activeTab === "before"
                  ? "bg-white text-red-500 border-b-2 border-red-500"
                  : "bg-slate-50 text-slate-500 hover:text-slate-700"
              }`}
            >
              ❌ Before (Current Page)
            </button>
            <button
              onClick={() => setActiveTab("after")}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                activeTab === "after"
                  ? "bg-white text-teal-600 border-b-2 border-teal-500"
                  : "bg-slate-50 text-slate-500 hover:text-slate-700"
              }`}
            >
              {isGeoMode ? "✅ After (GEO Fix)" : "✅ After (ConversionDoc Fix)"}
            </button>
          </div>

          {/* BEFORE TAB */}
          <div style={{ display: activeTab === "before" ? "block" : "none" }}>
            <div>
              {displayScreenshotUrl && (
                <div style={{ background: "#0f172a", position: "relative" }}>
                  {!screenshotLoaded && !screenshotErrored && (
                    <div style={{
                      minHeight: 400, display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 12,
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        border: "4px solid #2dd4bf", borderTopColor: "transparent",
                        animation: "cdSpin 0.8s linear infinite",
                      }} />
                      <p style={{ color: "#94a3b8", fontSize: 14, fontWeight: 500, margin: 0 }}>
                        Loading screenshot…
                      </p>
                    </div>
                  )}
                  {screenshotLoaded && (
                    <div style={{ position: "relative", width: "100%" }}>
                      <img
                        src={displayScreenshotUrl}
                        alt="Current page screenshot"
                        style={{
                          width: "100%", display: "block",
                          maxHeight: 600, objectFit: "cover", objectPosition: "top",
                        }}
                      />
                      {purchase.url && (
                        <a href={purchase.url} target="_blank" rel="noopener noreferrer"
                          style={{
                            position: "absolute", bottom: 12, right: 12,
                            background: "rgba(0,0,0,0.7)", color: "#fff",
                            fontSize: 11, fontWeight: 600, padding: "6px 12px",
                            borderRadius: 8, textDecoration: "none",
                            border: "1px solid rgba(255,255,255,0.15)",
                          }}>
                          View Live Page →
                        </a>
                      )}
                    </div>
                  )}
                  <style>{`@keyframes cdSpin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}
              {topFixes && topFixes.length > 0 && (
                <div className="p-6 bg-slate-50 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
                    {isGeoMode ? "AI Visibility Issues on Current Page" : "Issues Identified on Current Site"}
                  </p>
                  {topFixes.map((fix, i) => {
                    const color = impactColor[fix.impact || "Medium"] || "#f59e0b";
                    const bg = impactBg[fix.impact || "Medium"] || impactBg["Medium"];
                    return (
                      <div key={i} className="rounded-2xl border bg-white p-5 flex gap-4"
                        style={{ borderColor: `${color}30`, borderLeftWidth: 4, borderLeftColor: color }}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{ background: color }}>
                          {fix.priority ?? i + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                              style={{ color, background: bg, borderColor: `${color}30` }}>
                              {fix.impact} Impact
                            </span>
                          </div>
                          <p className="font-semibold text-slate-900 text-sm mb-1 leading-snug">{fix.issue}</p>
                          <div className="flex items-start gap-1.5">
                            <span className="text-teal-500 text-xs font-bold shrink-0 mt-0.5">→</span>
                            <p className="text-xs text-slate-600 leading-relaxed">{fix.fix}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* AFTER TAB */}
          <div style={{ display: activeTab === "after" ? "block" : "none" }}>
            {mockupHtml ? (
              <div className="bg-white">
                <div className="flex items-center gap-2 px-6 pt-4 pb-0 bg-slate-50 border-b border-slate-100">
                  <button
                    onClick={() => setMockupVersion("a")}
                    className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors border-b-2 -mb-px ${
                      mockupVersion === "a"
                        ? "bg-white text-teal-600 border-teal-500 shadow-sm"
                        : "bg-transparent text-slate-500 border-transparent hover:text-slate-700"
                    }`}
                  >
                    ★ Version A
                  </button>
                  {mockupHtmlB && (
                    <button
                      onClick={() => setMockupVersion("b")}
                      className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors border-b-2 -mb-px ${
                        mockupVersion === "b"
                          ? "bg-white text-teal-600 border-teal-500 shadow-sm"
                          : "bg-transparent text-slate-500 border-transparent hover:text-slate-700"
                      }`}
                    >
                      Version B
                    </button>
                  )}
                  <span className="ml-auto text-xs text-slate-400 pb-2">
                    {mockupVersion === "a" ? "Recommended layout" : "Alternative layout"}
                  </span>
                </div>
                <div className="relative">
                  <div
                    ref={mockupRef}
                    className="w-full overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: activeMockupHtml || "" }}
                  />
                  <button
                    onClick={() => setFullscreen(true)}
                    className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                  >
                    ⛶ Fullscreen
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-[400px] bg-slate-50">
                <p className="text-slate-400">Mockup not available</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-3">
            {mockupHtml && (
              <>
                <button
                  onClick={handleCopyCode}
                  className="rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold px-5 py-3 transition-colors text-sm shadow-sm"
                >
                  {copySuccess ? "✓ Copied!" : "Copy HTML"}
                </button>
                <button
                  onClick={handleDownloadPng}
                  disabled={downloading}
                  className="rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold px-5 py-3 transition-colors text-sm shadow-sm disabled:opacity-50"
                >
                  {downloading ? "Generating…" : "Download PNG"}
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold px-5 py-3 transition-colors text-sm shadow-sm disabled:opacity-50"
                >
                  {downloadingPdf ? "Generating PDF…" : "Download Report PDF"}
                </button>
                <button
                  onClick={handleDownloadKit}
                  disabled={downloadingKit}
                  className="rounded-xl bg-slate-900 hover:bg-black text-white font-semibold px-5 py-3 transition-colors text-sm shadow-sm disabled:opacity-50"
                >
                  {downloadingKit
                    ? "Building Kit…"
                    : isGeoMode
                    ? "Download GEO Kit (.zip)"
                    : "Download Homepage Kit (.zip)"}
                </button>
              </>
            )}
            {purchase.url && (
              <a
                href={purchase.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold px-5 py-3 transition-colors text-sm shadow-sm"
              >
                {isGeoMode ? "View Current Page →" : "View Current Site →"}
              </a>
            )}
          </div>
        </section>

        {/* Next Step */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600 mb-2">
            Next Step
          </p>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            {isGeoMode
              ? "Need help implementing your GEO fixes?"
              : "Need help implementing these recommendations?"}
          </h2>
          <p className="text-slate-600 mb-6 max-w-3xl leading-7">
            {isGeoMode
              ? "If you'd like expert help applying your GEO fixes — from content restructuring to full page implementation — we're here to help. Get in touch and we'll talk through your options."
              : "If you'd like expert help putting these fixes into action — from copy rewrites to full page redesigns — we're here to help. Get in touch and we'll talk through your options."}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={`mailto:hello@conversiondoc.co.uk?subject=${isGeoMode ? "GEO Implementation Help Request" : "Implementation Help Request"}`}
              className="rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold px-5 py-3 transition-colors text-sm shadow-sm"
            >
              Get in Touch
            </a>
          </div>
        </section>

      </div>

      {/* Fullscreen */}
      {fullscreen && activeMockupHtml && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          onClick={() => setFullscreen(false)}
        >
          <div
            className="flex items-center justify-between px-6 py-4 bg-slate-950 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-white font-semibold">
              {isGeoMode ? "✅ GEO-Optimised Direction" : "✅ Improved Direction"} —{" "}
              {mockupVersion === "a" ? "Version A (Recommended)" : "Version B (Alternative)"}
            </p>
            <button
              onClick={() => setFullscreen(false)}
              className="text-slate-400 hover:text-white text-2xl leading-none"
            >
              ✕
            </button>
          </div>
          <div
            className="flex-1 overflow-auto bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div dangerouslySetInnerHTML={{ __html: activeMockupHtml }} />
          </div>
        </div>
      )}
    </div>
  );
}
