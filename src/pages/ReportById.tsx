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

const impactColor: Record<string, string> = { High: "#E11D48", Medium: "#f59e0b", Low: "#A1A1AA" };
const impactBg: Record<string, string> = { High: "rgba(225,29,72,0.1)", Medium: "rgba(245,158,11,0.1)", Low: "rgba(161,161,170,0.1)" };

// --- PDF BUILDER (FULLY RESTORED & THEMED) ---
const buildPdf = ({ overallScore, auditData, topFixes, orderedScores, summary, purchaseUrl, hasMockupB, whiteLabel, isGeoMode }: any): jsPDF => {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, H = 297, ML = 16, MR = 16, CW = W - ML - MR, BOTTOM_MARGIN = 20;

  const BG: [number, number, number] = [10, 10, 10]; // Obsidian
  const CARD_BG: [number, number, number] = [15, 15, 15]; // Slightly lighter black
  const CARD_BORDER: [number, number, number] = [39, 39, 42]; // Surgical
  const ACCENT: [number, number, number] = isGeoMode ? [217, 70, 239] : [6, 182, 212]; // Neon or Pulse
  const ACCENT_MUTED: [number, number, number] = isGeoMode ? [40, 10, 45] : [2, 35, 40]; // For headers
  
  const WHITE: [number, number, number] = [255, 255, 255]; // Clinic
  const BODY_TEXT: [number, number, number] = [161, 161, 170]; // Data
  const EMERALD: [number, number, number] = [16, 185, 129];
  const AMBER: [number, number, number] = [245, 158, 11];
  const RED: [number, number, number] = [239, 68, 68];

  const scoreRgb = (s: number | null): [number, number, number] =>
    s === null ? BODY_TEXT : s >= 70 ? EMERALD : s >= 50 ? AMBER : RED;
  const pillarScoreRgb = (s: number | undefined): [number, number, number] =>
    typeof s !== "number" ? BODY_TEXT : s >= 8 ? EMERALD : s >= 5 ? AMBER : RED;
  const impactRgb = (impact: string): [number, number, number] =>
    impact === "High" ? RED : impact === "Medium" ? AMBER : BODY_TEXT;

  let y = 0;

  const checkPageBreak = (neededMm: number) => {
    if (y + neededMm > H - BOTTOM_MARGIN) {
      pdf.addPage();
      y = 16;
      pdf.setFillColor(...BG); pdf.rect(0, 0, W, H, "F");
    }
  };

  // Base background
  pdf.setFillColor(...BG); pdf.rect(0, 0, W, H, "F");

  const setFont = (style: "normal" | "bold" | "italic" = "normal", size = 10, color: [number, number, number] = BODY_TEXT) => {
    pdf.setFont("helvetica", style); pdf.setFontSize(size); pdf.setTextColor(...color);
  };

  const wrappedText = (text: string, x: number, maxWidth: number, lineHeight: number, style: "normal" | "bold" | "italic" = "normal", size = 10, color: [number, number, number] = BODY_TEXT): void => {
    setFont(style, size, color);
    const lines = pdf.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => { checkPageBreak(lineHeight); pdf.text(line, x, y); y += lineHeight; });
  };

  const sectionDivider = () => { checkPageBreak(8); pdf.setDrawColor(...CARD_BORDER); pdf.setLineWidth(0.3); pdf.line(ML, y, W - MR, y); y += 8; };
  const microLabel = (text: string, color: [number, number, number] = ACCENT) => { checkPageBreak(6); setFont("bold", 7, color); pdf.text(text.toUpperCase(), ML, y); y += 5; };
  const roundedRect = (x: number, rectY: number, w: number, h: number, fill: [number, number, number], stroke?: [number, number, number], radius = 3) => {
    pdf.setFillColor(...fill);
    if (stroke) { pdf.setDrawColor(...stroke); pdf.setLineWidth(0.3); pdf.roundedRect(x, rectY, w, h, radius, radius, "FD"); }
    else { pdf.roundedRect(x, rectY, w, h, radius, radius, "F"); }
  };

  // Header
  roundedRect(ML, 12, CW, 44, CARD_BG, CARD_BORDER, 2);
  pdf.setFillColor(...ACCENT); pdf.rect(ML, 12, CW, 1.2, "F");
  setFont("bold", 7, ACCENT); pdf.text("FULL DIAGNOSIS", ML + 6, 20);
  if (!whiteLabel?.is_subscriber) { setFont("bold", 8, ACCENT); pdf.text("ConversionDoc", W - MR - 6, 20, { align: "right" }); }
  setFont("bold", 18, WHITE); pdf.text(isGeoMode ? "GEO Strategy Report" : "Conversion Report", ML + 6, 30);
  if (auditData?.verdict) { setFont("italic", 8, BODY_TEXT); const vl = pdf.splitTextToSize(`"${auditData.verdict}"`, CW - 12); vl.slice(0, 2).forEach((line: string, i: number) => pdf.text(line, ML + 6, 38 + i * 5)); }
  if (purchaseUrl) { setFont("normal", 7, BODY_TEXT); pdf.text(purchaseUrl, ML + 6, 51); }
  y = 64;

  // Executive Summary
  microLabel("01_Executive_Summary", ACCENT);
  wrappedText("Your strongest opportunity", ML, CW, 7, "bold", 14, WHITE);
  y += 2;
  checkPageBreak(24);
  const cardW = (CW - 8) / 3;
  roundedRect(ML, y, cardW, 22, CARD_BG, CARD_BORDER);
  setFont("normal", 7, BODY_TEXT); pdf.text("Health Index", ML + 4, y + 6);
  setFont("bold", 16, scoreRgb(overallScore)); pdf.text(overallScore !== null ? `${overallScore}/100` : "N/A", ML + 4, y + 17);
  
  roundedRect(ML + cardW + 4, y, cardW, 22, CARD_BG, CARD_BORDER);
  setFont("normal", 7, BODY_TEXT); pdf.text("Strongest Pillar", ML + cardW + 8, y + 6);
  setFont("bold", 10, WHITE);
  const strongLines = pdf.splitTextToSize(summary?.strongest_pillar ? prettyLabel(summary.strongest_pillar) : "N/A", cardW - 8);
  strongLines.slice(0, 2).forEach((line: string, i: number) => pdf.text(line, ML + cardW + 8, y + 13 + i * 5));
  
  roundedRect(ML + (cardW + 4) * 2, y, cardW, 22, CARD_BG, CARD_BORDER);
  setFont("normal", 7, BODY_TEXT); pdf.text("Weakest Pillar", ML + (cardW + 4) * 2 + 4, y + 6);
  setFont("bold", 10, WHITE);
  const weakLines = pdf.splitTextToSize(summary?.weakest_pillar ? prettyLabel(summary.weakest_pillar) : "N/A", cardW - 8);
  weakLines.slice(0, 2).forEach((line: string, i: number) => pdf.text(line, ML + (cardW + 4) * 2 + 4, y + 13 + i * 5));
  y += 26;

  const oppText = summary?.biggest_opportunity || "N/A";
  const oppLines = pdf.splitTextToSize(oppText, CW - 10);
  const oppH = 10 + oppLines.length * 5.5;
  checkPageBreak(oppH + 4);
  roundedRect(ML, y, CW, oppH, ACCENT_MUTED, CARD_BORDER);
  setFont("bold", 7, ACCENT); pdf.text("BIGGEST OPPORTUNITY", ML + 5, y + 6);
  setFont("bold", 9.5, WHITE); oppLines.forEach((line: string, i: number) => pdf.text(line, ML + 5, y + 12 + i * 5.5));
  y += oppH + 4;

  const diagText = summary?.executive_summary || "N/A";
  const diagLines = pdf.splitTextToSize(diagText, CW - 10);
  const diagH = 10 + diagLines.length * 5;
  checkPageBreak(diagH + 4);
  roundedRect(ML, y, CW, diagH, CARD_BG, CARD_BORDER);
  setFont("bold", 7, BODY_TEXT); pdf.text("DIAGNOSIS", ML + 5, y + 6);
  setFont("normal", 9, BODY_TEXT); diagLines.forEach((line: string, i: number) => pdf.text(line, ML + 5, y + 12 + i * 5));
  y += diagH + 6;
  sectionDivider();

  // Top Fixes
  microLabel("02_Priority_Fixes", ACCENT);
  wrappedText("Action Plan", ML, CW, 7, "bold", 14, WHITE);
  y += 2;
  (topFixes || []).forEach((fix: any) => {
    const impact = fix.impact || "Medium";
    const iRgb = impactRgb(impact);
    const iRgbDark: [number, number, number] = [Math.min(40, iRgb[0] / 4), Math.min(40, iRgb[1] / 4), Math.min(40, iRgb[2] / 4)];
    const LEFT_BAR = 1.5, CIRCLE_RADIUS = 4, CIRCLE_CENTER_X = ML + LEFT_BAR + 2 + CIRCLE_RADIUS;
    const TEXT_X = CIRCLE_CENTER_X + CIRCLE_RADIUS + 4, TEXT_W = W - MR - TEXT_X - 4;
    const PILL_H = 5.5, ISSUE_LH = 5, FIX_LH = 4.5, V_PAD_TOP = 6, V_PAD_BOT = 6, PILL_GAP = 3, ISSUE_GAP = 3;
    
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(9);
    const issueLines: string[] = pdf.splitTextToSize(fix.issue || "", TEXT_W);
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(8.5);
    const fixLines: string[] = pdf.splitTextToSize(`-> ${fix.fix || ""}`, TEXT_W);
    const cardH = V_PAD_TOP + PILL_H + PILL_GAP + issueLines.length * ISSUE_LH + ISSUE_GAP + fixLines.length * FIX_LH + V_PAD_BOT;
    
    checkPageBreak(cardH + 4);
    roundedRect(ML, y, CW, cardH, iRgbDark, CARD_BORDER, 2);
    pdf.setFillColor(...iRgb); pdf.rect(ML, y, LEFT_BAR, cardH, "F");
    pdf.setFillColor(...iRgb); pdf.circle(CIRCLE_CENTER_X, y + V_PAD_TOP + CIRCLE_RADIUS, CIRCLE_RADIUS, "F");
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.setTextColor(...WHITE);
    pdf.text(String(fix.priority ?? ""), CIRCLE_CENTER_X, y + V_PAD_TOP + CIRCLE_RADIUS + 1, { align: "center" });
    
    const pillLabel = `${impact.toUpperCase()} IMPACT`;
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(7); pdf.setTextColor(...iRgb);
    const pillW = pdf.getTextWidth(pillLabel) + 6;
    pdf.setFillColor(...CARD_BG);
    pdf.roundedRect(TEXT_X, y + V_PAD_TOP, pillW, PILL_H, 1.5, 1.5, "F");
    pdf.text(pillLabel, TEXT_X + 3, y + V_PAD_TOP + 3.8);
    
    let innerY = y + V_PAD_TOP + PILL_H + PILL_GAP;
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(...WHITE);
    issueLines.forEach((line: string) => { innerY += ISSUE_LH; pdf.text(line, TEXT_X, innerY); });
    innerY += ISSUE_GAP;
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(8.5); pdf.setTextColor(...BODY_TEXT);
    fixLines.forEach((line: string) => { innerY += FIX_LH; pdf.text(line, TEXT_X, innerY); });
    y += cardH + 4;
  });
  sectionDivider();

  // Score Breakdown
  microLabel("03_Diagnostic_Breakdown", ACCENT);
  wrappedText("Full Analysis", ML, CW, 7, "bold", 14, WHITE);
  y += 2;
  orderedScores.forEach(([pillar, value]: any) => {
    const s = value?.score;
    const sRgb = pillarScoreRgb(s);
    const INNER_W = CW - 10;
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(8.5);
    const issueLines: string[] = value?.issue ? pdf.splitTextToSize(value.issue, INNER_W) : [];
    const fixLines: string[] = value?.fix ? pdf.splitTextToSize(value.fix, INNER_W) : [];
    const rewriteLines: string[] = value?.rewritten_copy ? pdf.splitTextToSize(value.rewritten_copy, INNER_W) : [];
    const labelRows = (issueLines.length > 0 ? 1 : 0) + (fixLines.length > 0 ? 1 : 0) + (rewriteLines.length > 0 ? 1 : 0);
    const contentH = 14 + issueLines.length * 4.5 + fixLines.length * 4.5 + rewriteLines.length * 4.5 + labelRows * 6;
    
    checkPageBreak(contentH + 4);
    roundedRect(ML, y, CW, contentH, CARD_BG, CARD_BORDER);
    setFont("bold", 11, WHITE); pdf.text(prettyLabel(pillar), ML + 5, y + 8);
    setFont("bold", 11, sRgb); pdf.text(typeof s === "number" ? `${s}/10` : "—", W - MR - 5, y + 8, { align: "right" });
    pdf.setDrawColor(...CARD_BORDER); pdf.setLineWidth(0.2); pdf.line(ML + 5, y + 10, W - MR - 5, y + 10);
    
    let innerY = y + 16;
    if (issueLines.length > 0) { setFont("bold", 7, BODY_TEXT); pdf.text("ISSUE", ML + 5, innerY); innerY += 5; setFont("normal", 8.5, BODY_TEXT); issueLines.forEach((line: string) => { pdf.text(line, ML + 5, innerY); innerY += 4.5; }); innerY += 2; }
    if (fixLines.length > 0) { setFont("bold", 7, BODY_TEXT); pdf.text("RECOMMENDED FIX", ML + 5, innerY); innerY += 5; setFont("normal", 8.5, BODY_TEXT); fixLines.forEach((line: string) => { pdf.text(line, ML + 5, innerY); innerY += 4.5; }); innerY += 2; }
    if (rewriteLines.length > 0) { setFont("bold", 7, ACCENT); pdf.text("OPTIMIZED CONTENT", ML + 5, innerY); innerY += 5; setFont("italic", 8.5, WHITE); rewriteLines.forEach((line: string) => { pdf.text(line, ML + 5, innerY); innerY += 4.5; }); }
    y += contentH + 4;
  });

  // Footer on all pages
  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFillColor(...BG); pdf.rect(0, H - 18, W, 18, "F");
    pdf.setDrawColor(...CARD_BORDER); pdf.setLineWidth(0.3); pdf.line(ML, H - 12, W - MR, H - 12);
    if (!whiteLabel?.is_subscriber) { setFont("bold", 7.5, ACCENT); pdf.text("ConversionDoc — conversiondoc.co.uk", ML, H - 7); }
    setFont("normal", 7, BODY_TEXT); pdf.text(`${p} / ${totalPages}`, W / 2, H - 7, { align: "center" });
    if (purchaseUrl) { setFont("normal", 7, BODY_TEXT); pdf.text(purchaseUrl, W - MR, H - 7, { align: "right" }); }
  }

  return pdf;
};

// --- DOCX BUILDER (FULLY RESTORED) ---
const buildDocx = async ({ copyPack, overallScore, summary, topFixes, purchaseUrl, whiteLabel }: any): Promise<Blob> => {
  const bullets = Array.isArray(copyPack.benefit_bullets) ? copyPack.benefit_bullets.filter(Boolean) : [];
  const tealColor = "0D9488", navyColor = "1E3A5F", slateColor = "475569", darkColor = "1E293B";

  const sectionLabel = (text: string) => new Paragraph({ children: [new TextRun({ text: text.toUpperCase(), color: tealColor, size: 18, font: "Inter", bold: true, characterSpacing: 80 })], spacing: { before: 320, after: 80 } });
  const heading = (text: string) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, color: darkColor, size: 28, font: "Inter", bold: true })], spacing: { after: 160 } });
  const subLabel = (text: string) => new Paragraph({ children: [new TextRun({ text: text.toUpperCase(), color: "94A3B8", size: 16, font: "Inter", bold: true, characterSpacing: 60 })], spacing: { before: 160, after: 60 } });
  const bodyText = (text: string, italic = false) => new Paragraph({ children: [new TextRun({ text, color: slateColor, size: 22, font: "Inter", italics: italic })], spacing: { after: 100 } });
  const boldText = (text: string) => new Paragraph({ children: [new TextRun({ text, color: darkColor, size: 22, font: "Inter", bold: true })], spacing: { after: 100 } });
  const divider = () => new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" } }, spacing: { before: 200, after: 200 }, children: [] });

  const brandLine = whiteLabel?.is_subscriber ? [] : [new Paragraph({ children: [new TextRun({ text: "ConversionDoc", color: tealColor, size: 20, font: "Inter", bold: true, characterSpacing: 60 })], spacing: { after: 80 } })];

  const children = [
    ...brandLine,
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Conversion Report", color: navyColor, size: 48, font: "Inter", bold: true })], spacing: { after: 120 } }),
    ...(purchaseUrl ? [new Paragraph({ children: [new TextRun({ text: purchaseUrl, color: tealColor, size: 20, font: "Inter" })], spacing: { after: 80 } })] : []),
    divider(),
    sectionLabel("Executive Summary"),
    heading("Health Index"),
    new Paragraph({ children: [new TextRun({ text: overallScore !== null ? `${overallScore}/100` : "N/A", color: overallScore !== null && overallScore >= 70 ? "10B981" : overallScore !== null && overallScore >= 50 ? "F59E0B" : "EF4444", size: 48, font: "Inter", bold: true })], spacing: { after: 160 } }),
    subLabel("Strongest Pillar"), boldText(summary.strongest_pillar ? prettyLabel(summary.strongest_pillar) : "N/A"),
    subLabel("Weakest Pillar"), boldText(summary.weakest_pillar ? prettyLabel(summary.weakest_pillar) : "N/A"),
    subLabel("Biggest Opportunity"), bodyText(summary.biggest_opportunity || "N/A"),
    subLabel("Diagnosis"), bodyText(summary.executive_summary || "N/A"),
    divider(),
    sectionLabel("Deliverable"),
    heading("Copy Pack"),
    subLabel("Headline"),
    new Paragraph({ children: [new TextRun({ text: copyPack.headline || "N/A", color: darkColor, size: 32, font: "Inter", bold: true })], spacing: { after: 160 } }),
    subLabel("Subheadline"), bodyText(copyPack.subheadline || "N/A"),
    subLabel("Primary CTA"), boldText(copyPack.primary_cta || "N/A"),
    subLabel("Trust Line"), boldText(copyPack.trust_line || "N/A"),
    subLabel("Benefit Bullets"),
    ...bullets.map((b) => new Paragraph({ children: [new TextRun({ text: "- ", color: tealColor, size: 22, font: "Inter", bold: true }), new TextRun({ text: b, color: slateColor, size: 22, font: "Inter" })], spacing: { after: 80 } })),
    ...(copyPack.supporting_copy ? [subLabel("Supporting Copy"), bodyText(copyPack.supporting_copy)] : []),
    divider(),
    ...(!whiteLabel?.is_subscriber ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Generated by ConversionDoc — conversiondoc.co.uk", color: tealColor, size: 18, font: "Inter", bold: true })], spacing: { before: 200 } })] : []),
  ];

  const doc = new Document({ sections: [{ properties: { page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } } }, children }] });
  return await Packer.toBlob(doc);
};

// --- INSTRUCTIONS DOCX (FULLY RESTORED) ---
const buildInstructionsDocx = async ({ hasMockupB, purchaseUrl, whiteLabel }: any): Promise<Blob> => {
  const tealColor = "0D9488", navyColor = "1E3A5F", slateColor = "475569", darkColor = "1E293B", mutedColor = "94A3B8";

  const heading1 = (text: string) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, color: navyColor, size: 48, font: "Inter", bold: true })], spacing: { after: 120 } });
  const sectionLabel = (text: string) => new Paragraph({ children: [new TextRun({ text: text.toUpperCase(), color: tealColor, size: 18, font: "Inter", bold: true, characterSpacing: 80 })], spacing: { before: 400, after: 80 } });
  const bodyText = (text: string) => new Paragraph({ children: [new TextRun({ text, color: slateColor, size: 22, font: "Inter" })], spacing: { after: 100 } });
  const mutedText = (text: string) => new Paragraph({ children: [new TextRun({ text, color: mutedColor, size: 20, font: "Inter", italics: true })], spacing: { after: 80 } });
  const fileRow = (filename: string, description: string) => new Paragraph({ children: [new TextRun({ text: filename, color: tealColor, size: 22, font: "Inter", bold: true }), new TextRun({ text: `  —  ${description}`, color: slateColor, size: 22, font: "Inter" })], spacing: { after: 100 } });
  const divider = () => new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" } }, spacing: { before: 200, after: 200 }, children: [] });
  const stepNumber = (n: string, title: string) => new Paragraph({ children: [new TextRun({ text: `${n}.  `, color: tealColor, size: 24, font: "Inter", bold: true }), new TextRun({ text: title, color: darkColor, size: 24, font: "Inter", bold: true })], spacing: { before: 280, after: 80 } });

  const isSubscriber = whiteLabel?.is_subscriber ?? false;
  const brandLine = isSubscriber ? [] : [new Paragraph({ children: [new TextRun({ text: "ConversionDoc", color: tealColor, size: 20, font: "Inter", bold: true, characterSpacing: 60 })], spacing: { after: 60 } })];
  const footerLine = isSubscriber ? [] : [divider(), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Generated by ConversionDoc — conversiondoc.co.uk", color: tealColor, size: 18, font: "Inter", bold: true })], spacing: { before: 200 } })];

  const children = [
    ...brandLine,
    heading1("How to use your Kit"),
    ...(purchaseUrl ? [new Paragraph({ children: [new TextRun({ text: `Audited: ${purchaseUrl}`, color: tealColor, size: 20, font: "Inter" })], spacing: { after: 80 } })] : []),
    divider(),
    sectionLabel("What's in this kit"),
    fileRow("audit-report.pdf", "Full audit report — scores, diagnosis, and all recommended fixes"),
    fileRow("copy-pack.docx", "Ready to deploy text copy"),
    fileRow("mockup-a.html", "Improved page direction (Version A)"),
    ...(hasMockupB ? [fileRow("mockup-b.html", "Alternative page direction (Version B)")] : []),
    fileRow("INSTRUCTIONS.docx", "This document"),
    divider(),
    sectionLabel("Step-by-step"),
    stepNumber("1", "Read the full report"), bodyText("Open audit-report.pdf. It contains the overall score, diagnosis, and every recommended fix in priority order."),
    stepNumber("2", "Use the copy pack"), bodyText("Open copy-pack.docx in Word or Google Docs. It contains rewritten elements ready to paste directly into the page."),
    stepNumber("3", "Preview the mockup"), bodyText(`Open mockup-a.html in any browser to see a visual direction.`),
    stepNumber("4", "Apply highest-impact changes first"), bodyText("Focus on Priority 1 and 2 fixes before anything else."),
    ...(isSubscriber ? [] : [stepNumber("5", "Need help implementing?"), bodyText("Get in touch at hello@conversiondoc.co.uk.")]),
    divider(),
    sectionLabel("Tips"),
    bodyText("✓  Make one change at a time so you can measure impact."),
    bodyText("✓  Prioritise mobile check for every change."),
    ...(purchaseUrl ? [divider(), mutedText(`Audited: ${purchaseUrl}`)] : []),
    ...footerLine,
  ];

  const doc = new Document({ sections: [{ properties: { page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } } }, children }] });
  return await Packer.toBlob(doc);
};

// --- ENQUIRY MODAL (FULLY RESTORED) ---
function EnquiryModal({ open, onClose, prefillUrl, prefillEmail, purchaseId }: any) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(prefillEmail || "");
  const [url, setUrl] = useState(prefillUrl || "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => { if (open) { setSubmitted(false); setSubmitError(""); setEmail(prefillEmail || ""); setUrl(prefillUrl || ""); } }, [open, prefillEmail, prefillUrl]);

  const handleSubmit = async () => {
    if (!name || !email) { setSubmitError("Please fill in your name and email."); return; }
    setSubmitting(true); setSubmitError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-enquiry`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` }, 
        body: JSON.stringify({ name, email, url, notes, focus: "conversion", purchase_id: purchaseId }) 
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch (err: any) { setSubmitError(err.message || "Something went wrong."); }
    finally { setSubmitting(false); }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-obsidian border border-surgical rounded-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="bg-black border-b border-surgical px-8 py-6 flex justify-between items-center">
           <h2 className="text-lg font-black text-clinic uppercase tracking-tighter">Implementation_Support</h2>
           <button onClick={onClose} className="text-data hover:text-white text-xl leading-none">✕</button>
        </div>
        <div className="p-8 max-h-[80vh] overflow-y-auto">
          {submitted ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-pulse mx-auto mb-4" />
              <h3 className="text-xl font-bold text-clinic mb-2">Request Transmitted</h3>
              <p className="text-data text-sm font-mono mb-6 opacity-60">A specialist will contact you within 1–2 business days.</p>
              <button onClick={onClose} className="btn-pulse w-full py-3 text-xs font-bold uppercase tracking-widest">Close</button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-data text-xs font-mono mb-6 opacity-60">Need expert help deploying these fixes? Let us know what you need.</p>
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-data uppercase font-bold">Your Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black border border-surgical p-3 text-sm text-clinic rounded outline-none focus:border-pulse transition-colors" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-data uppercase font-bold">Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black border border-surgical p-3 text-sm text-clinic rounded outline-none focus:border-pulse transition-colors" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-data uppercase font-bold">Requirements</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="w-full bg-black border border-surgical p-3 text-sm text-clinic rounded outline-none focus:border-pulse transition-colors" placeholder="Specific platform, timeline, etc..." />
              </div>
              {submitError && <p className="text-xs text-warning font-mono mt-2">{submitError}</p>}
              <button onClick={handleSubmit} disabled={submitting} className="w-full btn-pulse py-4 font-black uppercase tracking-widest text-xs mt-4 disabled:opacity-50">
                {submitting ? "TRANSMITTING..." : "SEND REQUEST"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT (FULLY RESTORED) ---
export default function ReportById() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [purchase, setPurchase] = useState<PurchaseRow | null>(null);
  const [whiteLabel, setWhiteLabel] = useState<WhiteLabel | undefined>(undefined);
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
        
        // Fetch white label
        const { data: subData } = await supabase.from("subscriptions").select("white_label_logo, white_label_theme, status").eq("email", session.user.email.toLowerCase().trim()).eq("status", "active").single();
        if (subData) {
          setWhiteLabel({ logo: subData.white_label_logo || null, theme: (subData.white_label_theme as "light" | "dark") || "light", is_subscriber: true });
        }
      } catch (e: any) { navigate("/dashboard"); }
      finally { setLoading(false); }
    };
    load();
  }, [id, navigate]);

  const auditData = purchase?.audit_data ?? null;
  const scores = auditData?.scores ?? {};
  const summary = auditData?.summary ?? {};
  const copyPack = auditData?.homepage_copy_pack ?? {};
  const mockupHtml = auditData?.mockup_html ?? null;
  const mockupHtmlB = auditData?.mockup_html_b ?? null;
  const activeMockupHtml = mockupVersion === "a" ? mockupHtml : (mockupHtmlB || mockupHtml);

  const isGeoMode = purchase?.focus === "geo";
  const activeColor = isGeoMode ? "text-neon" : "text-pulse";
  const activeBtn = isGeoMode ? "btn-neon" : "btn-pulse";

  const orderedScores = useMemo(() => Object.entries(scores), [scores]);
  const topFixes = useMemo(() => {
    const t3 = auditData?.top_3_fixes;
    if (Array.isArray(t3) && t3.length) return [...t3].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
    return null;
  }, [auditData]);

  const overallScore = useMemo(() => {
    if (typeof auditData?.overall_score === "number") return auditData.overall_score;
    const nums = Object.entries(scores).map(([, v]) => v?.score).filter((x): x is number => typeof x === "number");
    if (!nums.length) return 0;
    return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) <= 10 ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) : Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
  }, [auditData, scores]);

  // --- RESTORED HANDLERS ---
  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const pdf = buildPdf({ overallScore, auditData, topFixes, orderedScores, summary, purchaseUrl: purchase?.url, hasMockupB: !!mockupHtmlB, whiteLabel, isGeoMode });
      pdf.save("audit-report.pdf");
    } catch(e) { console.error(e) } finally { setDownloadingPdf(false); }
  };

  const handleDownloadDocx = async () => {
    try {
      setDownloadingDocx(true);
      const blob = await buildDocx({ copyPack, overallScore, summary, topFixes, purchaseUrl: purchase?.url, whiteLabel });
      saveAs(blob, "copy-pack.docx");
    } catch(e) { console.error(e) } finally { setDownloadingDocx(false); }
  };

  const buildMockupHtmlFile = (html: string | null) => `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Homepage Mockup</title></head><body style="margin:0;padding:0;background:#f8fafc;">${html || ""}</body></html>`;

  const handleDownloadKit = async () => {
    try {
      setDownloadingKit(true);
      const zip = new JSZip();

      // PDF
      const pdf = buildPdf({ overallScore, auditData, topFixes, orderedScores, summary, purchaseUrl: purchase?.url, hasMockupB: !!mockupHtmlB, whiteLabel, isGeoMode });
      zip.file("audit-report.pdf", await pdf.output("blob").arrayBuffer());

      // Docx
      const docxBlob = await buildDocx({ copyPack, overallScore, summary, topFixes, purchaseUrl: purchase?.url, whiteLabel });
      zip.file("copy-pack.docx", await docxBlob.arrayBuffer());

      // Instructions
      const instBlob = await buildInstructionsDocx({ hasMockupB: !!mockupHtmlB, purchaseUrl: purchase?.url, whiteLabel });
      zip.file("INSTRUCTIONS.docx", await instBlob.arrayBuffer());

      // Mockups
      if (mockupHtml) zip.file("mockup-a.html", buildMockupHtmlFile(mockupHtml));
      if (mockupHtmlB) zip.file("mockup-b.html", buildMockupHtmlFile(mockupHtmlB));

      saveAs(await zip.generateAsync({ type: "blob" }), "diagnostic-kit.zip");
    } catch (e) { console.error(e); } finally { setDownloadingKit(false); }
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
              <span className={cn("font-mono text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded border", isGeoMode ? "border-neon/30 text-neon bg-neon/10" : "border-pulse/30 text-pulse bg-pulse/10")}>FULL_DIAGNOSTIC_DATA</span>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter mt-4 uppercase">{isGeoMode ? "GEO_STRATEGY" : "CONVERSION_FIX"}</h1>
              <p className="mt-4 font-mono text-xs text-data opacity-50 truncate max-w-md">{purchase?.url}</p>
            </div>
            <div className="text-right">
              <div className={cn("text-6xl font-black font-mono", overallScore >= 70 ? "text-[#10b981]" : "text-[#f59e0b]")}>{overallScore}<span className="text-xl text-data opacity-20">/100</span></div>
              <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-data mt-1">Health Index</p>
            </div>
          </div>
        </section>

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
            {topFixes && topFixes.length > 0 && (
              <section className="bg-[#0A0A0A] border border-surgical rounded-lg p-8">
                <h2 className="text-xs font-mono font-bold text-data uppercase tracking-[0.2em] mb-8 opacity-40">02_Priority_Fixes</h2>
                <div className="space-y-4">
                  {topFixes.map((fix, idx) => (
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
            )}

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

            {/* 04 Copy Pack */}
            {copyPack.headline && (
              <section className="bg-[#0A0A0A] border border-surgical rounded-lg p-8">
                <div className="flex justify-between items-start mb-8">
                  <h2 className="text-xs font-mono font-bold text-data uppercase tracking-[0.2em] opacity-40">04_Copy_Pack</h2>
                  <button onClick={handleDownloadDocx} disabled={downloadingDocx} className={cn("text-[10px] font-mono font-bold uppercase tracking-widest border-b transition-opacity hover:opacity-70", activeColor, isGeoMode ? "border-neon" : "border-pulse")}>
                    {downloadingDocx ? "Generating..." : "Download .DOCX"}
                  </button>
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
                  {copyPack.benefit_bullets && copyPack.benefit_bullets.length > 0 && (
                    <div className="p-6 bg-black border border-surgical rounded">
                      <span className="text-[9px] font-mono text-data uppercase block mb-4">Benefit Bullets</span>
                      <ul className="space-y-3">
                        {copyPack.benefit_bullets.map((b: string, i: number) => (
                          <li key={i} className="flex gap-3 text-sm text-data"><CheckCircle2 className={cn("w-4 h-4 shrink-0", activeColor)} /> {b}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 05 Visual Mockup */}
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

            </div>
          </div>
        </div>

        {/* Footer Action */}
        <section className={cn("bg-black border rounded-lg p-10 text-center", isGeoMode ? "border-neon/20" : "border-pulse/20")}>
           <Zap className={cn("w-10 h-10 mx-auto mb-6", activeColor)} />
           <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">Diagnostic_Complete</h2>
           <p className="text-data text-sm font-mono max-w-xl mx-auto mb-8 opacity-60">Your full conversion kit is ready. Use the assets provided to implement these psychological and structural fixes.</p>
           <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handleDownloadKit} disabled={downloadingKit} className={cn("px-12 py-4 font-black uppercase tracking-widest text-xs disabled:opacity-50", activeBtn)}>
                 {downloadingKit ? "BUNDLING..." : "Download Kit (.ZIP)"}
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
