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

// FIXED SCORE COLOR LOGIC
const scoreColor = (score?: number, isOutOf100 = false) => {
  if (typeof score !== "number") return "text-data";
  
  if (isOutOf100) {
    if (score >= 70) return "text-[#10b981]";
    if (score >= 40) return "text-[#f59e0b]";
    return "text-[#E11D48]";
  }
  
  if (score >= 7) return "text-[#10b981]";
  if (score >= 4) return "text-[#f59e0b]";
  return "text-[#E11D48]";
};

const impactColor: Record<string, string> = { High: "#E11D48", Medium: "#f59e0b", Low: "#A1A1AA" };
const impactBg: Record<string, string> = { High: "rgba(225,29,72,0.1)", Medium: "rgba(245,158,11,0.1)", Low: "rgba(161,161,170,0.1)" };

// --- PDF BUILDER ---
const buildPdf = ({ overallScore, auditData, topFixes, orderedScores, summary, purchaseUrl, hasMockupB, whiteLabel, isGeoMode }: any): jsPDF => {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, H = 297, ML = 16, MR = 16, CW = W - ML - MR, BOTTOM_MARGIN = 20;

  const BG: [number, number, number] = [10, 10, 10]; 
  const CARD_BG: [number, number, number] = [15, 15, 15]; 
  const CARD_BORDER: [number, number, number] = [39, 39, 42]; 
  const ACCENT: [number, number, number] = isGeoMode ? [217, 70, 239] : [6, 182, 212]; 
  const ACCENT_MUTED: [number, number, number] = isGeoMode ? [40, 10, 45] : [2, 35, 40]; 
  
  const WHITE: [number, number, number] = [255, 255, 255]; 
  const BODY_TEXT: [number, number, number] = [161, 161, 170]; 
  const SLATE_500: [number, number, number] = [113, 113, 122]; 
  const EMERALD: [number, number, number] = [16, 185, 129];
  const AMBER: [number, number, number] = [245, 158, 11];
  const RED: [number, number, number] = [225, 29, 72];

  const scoreRgb = (s: number | null): [number, number, number] => s === null ? BODY_TEXT : s >= 70 ? EMERALD : s >= 50 ? AMBER : RED;
  const pillarScoreRgb = (s: number | undefined): [number, number, number] => typeof s !== "number" ? BODY_TEXT : s >= 8 ? EMERALD : s >= 5 ? AMBER : RED;
  const impactRgb = (impact: string): [number, number, number] => impact === "High" ? RED : impact === "Medium" ? AMBER : BODY_TEXT;

  let y = 0;
  const checkPageBreak = (neededMm: number) => {
    if (y + neededMm > H - BOTTOM_MARGIN) {
      pdf.addPage();
      y = 16;
      pdf.setFillColor(...BG); pdf.rect(0, 0, W, H, "F");
    }
  };

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

  roundedRect(ML, 12, CW, 44, CARD_BG, CARD_BORDER, 2);
  pdf.setFillColor(...ACCENT); pdf.rect(ML, 12, CW, 1.2, "F");
  setFont("bold", 7, ACCENT); pdf.text("FULL DIAGNOSIS", ML + 6, 20);
  if (!whiteLabel?.is_subscriber) { setFont("bold", 8, ACCENT); pdf.text("ConversionDoc", W - MR - 6, 20, { align: "right" }); }
  setFont("bold", 18, WHITE); pdf.text(isGeoMode ? "GEO Strategy Report" : "Conversion Report", ML + 6, 30);
  if (auditData?.verdict) { setFont("italic", 8, BODY_TEXT); const vl = pdf.splitTextToSize(`"${auditData.verdict}"`, CW - 12); vl.slice(0, 2).forEach((line: string, i: number) => pdf.text(line, ML + 6, 38 + i * 5)); }
  if (purchaseUrl) { setFont("normal", 7, BODY_TEXT); pdf.text(purchaseUrl, ML + 6, 51); }
  y = 64;

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

// --- DOCX BUILDER ---
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
    heading("Overall Score"),
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

// --- INSTRUCTIONS DOCX ---
const buildInstructionsDocx = async ({ hasMockupB, purchaseUrl, whiteLabel }: any): Promise<Blob> => {
  const tealColor = "0D9488", navyColor = "1E3A5F", slateColor = "475569", darkColor = "1E293B", mutedColor = "94A3B8";

  const heading1 = (text: string) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, color: navyColor, size: 48, font: "Inter", bold: true })], spacing: { after: 120 } });
  const sectionLabel = (text: string) => new Paragraph({ children: [new TextRun({ text: text.toUpperCase(), color: tealColor, size: 18, font: "Inter", bold: true, characterSpacing: 80 })], spacing: { before: 400, after: 80 } });
  const bodyText = (text: string) => new Paragraph({ children: [new TextRun({ text, color: slateColor, size: 22, font: "Inter" })], spacing: { after: 100 } });
  const mutedText = (text: string) => new Paragraph({ children: [new TextRun({ text, color: mutedColor, size: 20, font: "Inter", italics: true })], spacing: { after: 80 } });
  const fileRow = (filename: string, description: string) => new Paragraph({ children: [ new TextRun({ text: filename, color: tealColor, size: 22, font: "Inter", bold: true }), new TextRun({ text: `  —  ${description}`, color: slateColor, size: 22, font: "Inter" }) ], spacing: { after: 100 } });
  const divider = () => new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" } }, spacing: { before: 200, after: 200 }, children: [] });
  const stepNumber = (n: string, title: string) => new Paragraph({ children: [ new TextRun({ text: `${n}.  `, color: tealColor, size: 24, font: "Inter", bold: true }), new TextRun({ text: title, color: darkColor, size: 24, font: "Inter", bold: true }) ], spacing: { before: 280, after: 80 } });

  const isSubscriber = whiteLabel?.is_subscriber ?? false;
  const brandLine = isSubscriber ? [] : [new Paragraph({ children: [new TextRun({ text: "ConversionDoc", color: tealColor, size: 20, font: "Inter", bold: true, characterSpacing: 60 })], spacing: { after: 60 } })];
  const footerLine = isSubscriber ? [] : [ divider(), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Generated by ConversionDoc — conversiondoc.co.uk", color: tealColor, size: 18, font: "Inter", bold: true })], spacing: { before: 200 } }) ];

  const children = [
    ...brandLine,
    heading1("How to use your Conversion Kit"),
    ...(purchaseUrl ? [new Paragraph({ children: [new TextRun({ text: `Audited: ${purchaseUrl}`, color: tealColor, size: 20, font: "Inter" })], spacing: { after: 80 } })] : []),
    divider(),
    sectionLabel("What's in this kit"),
    fileRow("homepage-audit-report.pdf", "Full conversion audit report — scores, diagnosis, and all recommended fixes"),
    fileRow("copy-pack.docx", "Homepage-ready copy rewritten to improve clarity, trust, and action"),
    fileRow("homepage-mockup-a.html / .png", "Improved page direction (Version A) — open the HTML in any browser or share the PNG"),
    ...(hasMockupB ? [fileRow("homepage-mockup-b.html / .png", "Alternative page direction (Version B)")] : []),
    fileRow("INSTRUCTIONS.docx", "This document"),
    divider(),
    sectionLabel("Step-by-step"),
    stepNumber("1", "Read the full report"),
    bodyText("Open homepage-audit-report.pdf. It contains the overall score, diagnosis, and every recommended fix in priority order. Start here before making any changes."),
    stepNumber("2", "Use the copy pack"),
    bodyText("Open copy-pack.docx in Word or Google Docs. It contains rewritten headline, subheadline, CTA, trust line, and benefit bullets — ready to paste directly into the page."),
    stepNumber("3", "Preview the mockup"),
    bodyText(`Open homepage-mockup-a.html in any browser to see a visual direction for the improved page.${hasMockupB ? " A second direction is available in homepage-mockup-b.html." : ""} Share the PNG with a developer or designer if needed.`),
    stepNumber("4", "Apply highest-impact changes first"),
    bodyText("Focus on Priority 1 and 2 fixes before anything else. Small, targeted changes to the headline and CTA typically deliver the fastest results."),
    ...(isSubscriber ? [] : [
      stepNumber("5", "Need help implementing?"),
      bodyText("Get in touch at hello@conversiondoc.co.uk — we offer implementation support, copy rewrites, and full page redesigns."),
    ]),
    divider(),
    sectionLabel("Tips"),
    bodyText("✓  Make one change at a time so you can measure the impact of each fix."),
    bodyText("✓  Prioritise mobile — check every change on a phone before publishing."),
    bodyText("✓  Re-run your audit in 30 days to track your score improvement."),
    bodyText("✓  If in doubt, follow the Priority order in the report — it's ranked by impact."),
    ...(purchaseUrl ? [divider(), mutedText(`Audited: ${purchaseUrl}`)] : []),
    ...footerLine,
  ];

  const doc = new Document({
    sections: [{ properties: { page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } } }, children }],
  });

  return await Packer.toBlob(doc);
};

// --- CONSTANTS ---
const PLATFORMS = ["Webflow", "WordPress", "Framer", "Shopify", "Squarespace", "Wix", "Custom code", "Other"];
const HELP_OPTIONS = ["Copy rewrite", "Page redesign", "Full page rebuild", "GEO content restructure", "Developer handoff", "Something else"];

// --- ENQUIRY MODAL ---
function EnquiryModal({ open, onClose, prefillUrl, prefillEmail, purchaseId }: any) {
  const [name, setName] = useState(""); const [email, setEmail] = useState(prefillEmail || ""); const [url, setUrl] = useState(prefillUrl || ""); const [platform, setPlatform] = useState(""); const [helpNeeded, setHelpNeeded] = useState<string[]>([]); const [notes, setNotes] = useState(""); const [submitting, setSubmitting] = useState(false); const [submitted, setSubmitted] = useState(false); const [submitError, setSubmitError] = useState("");
  useEffect(() => { if (open) { setSubmitted(false); setSubmitError(""); setEmail(prefillEmail || ""); setUrl(prefillUrl || ""); } }, [open, prefillEmail, prefillUrl]);
  const toggleHelp = (option: string) => setHelpNeeded((prev) => prev.includes(option) ? prev.filter((h) => h !== option) : [...prev, option]);
  const handleSubmit = async () => {
    if (!name || !email) { setSubmitError("Please fill in your name and email."); return; }
    setSubmitting(true); setSubmitError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-enquiry`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` }, body: JSON.stringify({ name, email, url, platform, help_needed: helpNeeded, notes, focus: "conversion", purchase_id: purchaseId }) });
      if (!res.ok) { const body = await res.json().catch(() => null); throw new Error(body?.error || "Submission failed"); }
      setSubmitted(true);
    } catch (err: any) { setSubmitError(err.message || "Something went wrong."); }
    finally { setSubmitting(false); }
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#0A0A0A] border border-[#27272a] rounded-[16px] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-[#000000] border-b border-[#27272a] px-7 py-6 flex items-start justify-between">
          <div><p className="text-[10px] font-mono uppercase tracking-widest text-[#06B6D4] mb-1">Implementation Help</p><h2 className="text-xl font-bold text-white">Get help implementing fixes</h2></div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none ml-4 mt-0.5 shrink-0">✕</button>
        </div>
        <div className="px-7 py-6 max-h-[70vh] overflow-y-auto">
          {submitted ? (
            <div className="text-center py-8"><div className="text-4xl mb-4">✅</div><h3 className="text-xl font-bold text-white mb-2">We'll be in touch shortly</h3><p className="text-zinc-400 text-sm leading-relaxed">Thanks for reaching out. We've received your enquiry and will come back to you within 1–2 business days.</p><button onClick={onClose} className="mt-6 rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-6 py-3 text-sm transition-colors">Close</button></div>
          ) : (
            <div className="space-y-5">
              <div><label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1.5">Your Name <span className="text-red-400">*</span></label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" className="w-full rounded border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#06B6D4] transition" /></div>
              <div><label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1.5">Email Address <span className="text-red-400">*</span></label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" className="w-full rounded border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#06B6D4] transition" /></div>
              <div><label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1.5">Website URL</label><input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yoursite.com" className="w-full rounded border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#06B6D4] transition" /></div>
              <div><label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1.5">Platform / Tech Stack</label><div className="flex flex-wrap gap-2">{PLATFORMS.map((p) => (<button key={p} type="button" onClick={() => setPlatform(p)} className={`rounded px-3 py-1.5 text-xs font-semibold border transition-colors ${platform === p ? "bg-[#06B6D4] border-[#06B6D4] text-black" : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-600"}`}>{p}</button>))}</div></div>
              <div><label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1.5">What do you need help with?</label><div className="flex flex-wrap gap-2">{HELP_OPTIONS.map((h) => (<button key={h} type="button" onClick={() => toggleHelp(h)} className={`rounded px-3 py-1.5 text-xs font-semibold border transition-colors ${helpNeeded.includes(h) ? "bg-[#06B6D4] border-[#06B6D4] text-black" : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-600"}`}>{h}</button>))}</div></div>
              <div><label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1.5">Anything else we should know?</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Budget, timeline, specific pages, anything relevant…" rows={3} className="w-full rounded border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#06B6D4] transition resize-none" /></div>
              {submitError && <p className="text-xs text-red-500 font-medium">{submitError}</p>}
              <button type="button" onClick={handleSubmit} disabled={submitting} className="w-full rounded bg-[#06B6D4] hover:bg-cyan-400 text-black font-bold px-6 py-3.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? "Sending…" : "Send Enquiry"}</button>
              <p className="text-center text-xs text-zinc-500">We'll come back to you within 1–2 business days.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// --- MAIN COMPONENT ---
export default function ReportById() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchase, setPurchase] = useState<PurchaseRow | null>(null);
  const [whiteLabel, setWhiteLabel] = useState<WhiteLabel | undefined>(undefined);
  
  const [activeTab, setActiveTab] = useState<"before" | "after">("after");
  const [mockupVersion, setMockupVersion] = useState<"a" | "b">("a");
  const [fullscreen, setFullscreen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingKit, setDownloadingKit] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [screenshotLoaded, setScreenshotLoaded] = useState(false);
  const [screenshotErrored, setScreenshotErrored] = useState(false);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);

  const mockupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.email) { navigate("/login"); return; }
        if (!id) throw new Error("Missing report ID");

        const { data, error } = await supabase
          .from("purchases")
          .select("id, status, audit_data, url, email, focus")
          .eq("id", id)
          .eq("email", session.user.email)
          .single();

        if (error || !data) throw new Error("Report not found");
        setPurchase(data as PurchaseRow);

        const { data: subData } = await supabase
          .from("subscriptions")
          .select("white_label_logo, white_label_theme, status")
          .eq("email", session.user.email.toLowerCase().trim())
          .eq("status", "active")
          .single();

        if (subData) {
          setWhiteLabel({
            logo: subData.white_label_logo || null,
            theme: (subData.white_label_theme as "light" | "dark") || "dark",
            is_subscriber: true,
          });
        }
        setLoading(false);
      } catch (e: any) {
        setError(e?.message || "Could not load report");
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") { setFullscreen(false); setEnquiryOpen(false); } };
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

  // Dynamic colors for UI
  const isGeoMode = purchase?.focus === "geo";
  const isWhiteLabel = whiteLabel?.is_subscriber;
  const isDarkTheme = whiteLabel?.theme === "dark" || !isWhiteLabel;
  
  const activeColor = isGeoMode ? "text-[#D946EF]" : "text-[#06B6D4]";
  const activeBorder = isGeoMode ? "border-[#D946EF]/30" : "border-[#06B6D4]/30";
  const activeBg = isGeoMode ? "bg-[#D946EF]/10" : "bg-[#06B6D4]/10";
  const activeBtn = isGeoMode ? "bg-[#D946EF] hover:bg-[#c026d3] text-black" : "bg-[#06B6D4] hover:bg-cyan-400 text-black";
  
  const pageBg = isDarkTheme ? "bg-[#0A0A0A]" : "bg-[#f5f8fc]";
  const cardBg = isDarkTheme ? "bg-[#111] border-[#27272a]" : "bg-white border-slate-200";
  const headingColor = isDarkTheme ? "text-white" : "text-slate-900";
  const bodyColor = isDarkTheme ? "text-zinc-400" : "text-slate-700";

  const orderedScores = useMemo(() => Object.entries(scores), [scores]);

  const topFixes = useMemo(() => {
    const t3 = auditData?.top_3_fixes;
    if (Array.isArray(t3) && t3.length) return [...t3].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
    return null;
  }, [auditData]);

  const overallScore = useMemo(() => {
    if (typeof auditData?.overall_score === "number") return auditData.overall_score;
    const nums = Object.entries(scores).map(([, v]) => v?.score).filter((x): x is number => typeof x === "number");
    if (!nums.length) return null;
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    return avg <= 10 ? Math.round(avg * 10) : Math.round(avg);
  }, [auditData, scores]);

  const screenshotUrl = (auditData?.screenshot_url || "").length > 0
    ? auditData!.screenshot_url!
    : purchase?.url ? `https://image.thum.io/get/width/1400/crop/900/noanimate/${purchase.url}` : null;

  useEffect(() => {
    if (!screenshotUrl || screenshotLoaded || screenshotErrored) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) { ctx.drawImage(img, 0, 0); setScreenshotDataUrl(canvas.toDataURL("image/jpeg", 0.85)); }
      } catch { setScreenshotDataUrl(screenshotUrl); }
      setScreenshotLoaded(true);
    };
    img.onerror = () => setScreenshotErrored(true);
    img.src = screenshotUrl;
  }, [screenshotUrl]);

  const displayScreenshotUrl = screenshotDataUrl || screenshotUrl;

  const handleCopyCode = async () => {
    if (!activeMockupHtml) return;
    try { await navigator.clipboard.writeText(activeMockupHtml); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2500); }
    catch { setCopySuccess(false); }
  };

  const generateMockupPng = async (html: string | null): Promise<string> => {
    if (!html) throw new Error("Mockup HTML not available");
    return new Promise((resolve, reject) => {
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1200px;height:800px;border:none;visibility:hidden;";
      document.body.appendChild(iframe);
      iframe.onload = async () => {
        try {
          const doc = iframe.contentDocument;
          if (!doc) throw new Error("iframe not accessible");
          doc.open(); doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body style="margin:0;padding:0;background:#f8fafc;">${html}</body></html>`); doc.close();
          await new Promise((r) => setTimeout(r, 800));
          const canvas = await html2canvas(doc.body, { scale: 2, useCORS: true, allowTaint: false, backgroundColor: "#f8fafc", width: 1200, height: Math.max(doc.body.scrollHeight, 800) });
          resolve(canvas.toDataURL("image/png"));
        } catch (err) { reject(err); }
        finally { document.body.removeChild(iframe); }
      };
      iframe.src = "about:blank";
    });
  };

  const handleDownloadPng = async () => {
    try { setDownloading(true); const dataUrl = await generateMockupPng(activeMockupHtml); saveAs(dataUrl, "homepage-mockup.png"); }
    catch (e) { console.error(e); } finally { setDownloading(false); }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const pdf = buildPdf({ overallScore, auditData, topFixes, orderedScores, summary, purchaseUrl: purchase?.url, hasMockupB: !!mockupHtmlB, whiteLabel, isGeoMode });
      pdf.save("conversion-report.pdf");
    } catch (e) { console.error(e); } finally { setDownloadingPdf(false); }
  };

  const handleDownloadDocx = async () => {
    try {
      setDownloadingDocx(true);
      const blob = await buildDocx({ copyPack, overallScore, summary, topFixes, purchaseUrl: purchase?.url, whiteLabel });
      saveAs(blob, "copy-pack.docx");
    } catch (e) { console.error(e); } finally { setDownloadingDocx(false); }
  };

  const buildMockupHtmlFile = (html: string | null) => `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Homepage Mockup${isWhiteLabel ? "" : " — ConversionDoc"}</title></head><body style="margin:0;padding:0;background:#f8fafc;">${html || ""}</body></html>`;

  const handleDownloadKit = async () => {
    try {
      setDownloadingKit(true);
      const zip = new JSZip();

      try {
        const pdf = buildPdf({ overallScore, auditData, topFixes, orderedScores, summary, purchaseUrl: purchase?.url, hasMockupB: !!mockupHtmlB, whiteLabel, isGeoMode });
        zip.file("homepage-audit-report.pdf", await pdf.output("blob").arrayBuffer());
      } catch (e) { console.error("PDF for ZIP failed:", e); }

      const docxBlob = await buildDocx({ copyPack, overallScore, summary, topFixes, purchaseUrl: purchase?.url, whiteLabel });
      zip.file("copy-pack.docx", await docxBlob.arrayBuffer());

      const instructionsBlob = await buildInstructionsDocx({
        hasMockupB: !!mockupHtmlB,
        purchaseUrl: purchase?.url,
        whiteLabel,
      });
      zip.file("INSTRUCTIONS.docx", await instructionsBlob.arrayBuffer());

      if (mockupHtml) {
        zip.file("homepage-mockup-a.html", buildMockupHtmlFile(mockupHtml));
        try { const png = await generateMockupPng(mockupHtml); zip.file("homepage-mockup-a.png", png.split(",")[1], { base64: true }); } catch (e) { console.error(e); }
      }
      if (mockupHtmlB) {
        zip.file("homepage-mockup-b.html", buildMockupHtmlFile(mockupHtmlB));
        try { const png = await generateMockupPng(mockupHtmlB); zip.file("homepage-mockup-b.png", png.split(",")[1], { base64: true }); } catch (e) { console.error(e); }
      }

      saveAs(await zip.generateAsync({ type: "blob" }), `${isWhiteLabel ? "" : "conversiondoc-"}homepage-kit.zip`);
    } catch (e) { console.error(e); } finally { setDownloadingKit(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#06B6D4] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">Loading your report…</p>
        </div>
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-[#111] rounded border border-zinc-800 p-8 text-center space-y-4">
          <p className="text-4xl">⚠️</p>
          <h1 className="text-xl font-bold text-white">Report unavailable</h1>
          <p className="text-zinc-500 text-sm">{error || "Could not load this report."}</p>
          <a href="/dashboard" className="inline-block mt-4 rounded bg-[#06B6D4] hover:bg-cyan-400 text-black font-semibold px-5 py-3 transition-colors text-sm">Back to Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${pageBg} px-6 py-16 transition-colors duration-500`}>

      <EnquiryModal open={enquiryOpen} onClose={() => setEnquiryOpen(false)} prefillUrl={purchase.url} prefillEmail={purchase.email} purchaseId={purchase.id} />

      {screenshotUrl && !screenshotLoaded && !screenshotErrored && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 50, background: "rgba(15,23,42,0.85)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "8px 16px", borderRadius: 999, display: "flex", alignItems: "center", gap: 8, backdropFilter: "blur(8px)" }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #06B6D4", borderTopColor: "transparent", animation: "cdSpin 0.8s linear infinite", flexShrink: 0 }} />
          Preparing screenshot…
          <style>{`@keyframes cdSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      <div className="mx-auto max-w-6xl space-y-8">

        <a href="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-300 font-bold transition-colors">← Back to Dashboard</a>

        {/* Header */}
        <section className={cn("rounded-lg overflow-hidden border shadow-2xl relative", cardBg)}>
          <div className={cn("absolute top-0 left-0 w-full h-1", isGeoMode ? "bg-[#D946EF]" : "bg-[#06B6D4]")} />
          <div className="px-8 py-10 md:px-10 md:py-12">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  {isWhiteLabel && whiteLabel?.logo ? (
                    <img src={whiteLabel.logo} alt="Logo" className="h-10 max-w-[160px] object-contain" />
                  ) : (
                    <span className="text-xl font-black tracking-tighter text-white">ConversionDoc</span>
                  )}
                  <span className={cn("text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded border", activeColor, activeBorder, activeBg)}>
                    Full Diagnosis
                  </span>
                </div>
                <h1 className={cn("mt-3 text-4xl md:text-5xl font-black tracking-tighter", headingColor)}>Conversion Report</h1>
                {auditData?.verdict && <p className={cn("mt-4 text-lg italic max-w-3xl", bodyColor)}>"{auditData.verdict}"</p>}
                {purchase.url && <a href={purchase.url} target="_blank" rel="noopener noreferrer" className={cn("mt-3 inline-block text-sm hover:underline", activeColor)}>{purchase.url} →</a>}
              </div>
            </div>
          </div>
        </section>

        {/* Executive Summary */}
        <section className={`rounded-lg border ${cardBg} p-6 md:p-8 shadow-sm`}>
          <div className="mb-6">
            <p className={cn("text-[10px] font-mono font-bold uppercase tracking-widest", activeColor)}>Executive Summary</p>
            <h2 className={`mt-2 text-3xl font-bold ${headingColor}`}>Your strongest opportunity to improve conversions</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3 mb-6">
            {[
              { label: "Overall Score", value: overallScore !== null ? `${overallScore}/100` : "N/A", color: overallScore !== null && overallScore >= 70 ? "text-[#10b981]" : overallScore !== null && overallScore >= 50 ? "text-[#f59e0b]" : "text-[#E11D48]" },
              { label: "Strongest Pillar", value: summary.strongest_pillar ? prettyLabel(summary.strongest_pillar) : "N/A", color: headingColor },
              { label: "Weakest Pillar", value: summary.weakest_pillar ? prettyLabel(summary.weakest_pillar) : "N/A", color: headingColor },
            ].map((card) => (
              <div key={card.label} className={`rounded border ${isDarkTheme ? "border-[#27272a] bg-black" : "border-slate-200 bg-slate-50"} p-5`}>
                <p className={`text-[10px] font-mono uppercase tracking-widest ${isDarkTheme ? "text-zinc-500" : "text-slate-500"}`}>{card.label}</p>
                <p className={`mt-2 text-3xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>
          {summary.biggest_opportunity && (
            <div className={`rounded border ${isDarkTheme ? "border-[#06B6D4]/30 bg-[#06B6D4]/10" : "border-teal-100 bg-teal-50"} p-5 mb-4`}>
              <p className={`text-[10px] font-mono font-bold uppercase tracking-widest ${isDarkTheme ? "text-[#06B6D4]" : "text-teal-700"} mb-2`}>Biggest Opportunity</p>
              <p className={`font-medium text-lg ${headingColor}`}>{summary.biggest_opportunity}</p>
            </div>
          )}
          {summary.executive_summary && (
            <div className={`rounded border ${isDarkTheme ? "border-[#27272a] bg-black" : "border-slate-200 bg-slate-50"} p-5`}>
              <p className={`text-[10px] font-mono font-bold uppercase tracking-widest ${isDarkTheme ? "text-zinc-500" : "text-slate-500"} mb-2`}>Diagnosis</p>
              <p className={`leading-8 ${bodyColor}`}>{summary.executive_summary}</p>
            </div>
          )}
        </section>

        {/* Top Fixes */}
        {topFixes && (
          <section className={`rounded-lg border ${cardBg} p-6 md:p-8 shadow-sm`}>
            <div className="mb-6">
              <p className={cn("text-[10px] font-mono font-bold uppercase tracking-widest", activeColor)}>Action Plan</p>
              <h2 className={`mt-2 text-3xl font-bold ${headingColor}`}>🔥 Top Priority Fixes</h2>
            </div>
            <div className="space-y-4">
              {topFixes.map((x, idx) => {
                const color = impactColor[x.impact || "Medium"] || "#f59e0b";
                const bg = impactBg[x.impact || "Medium"] || impactBg["Medium"];
                return (
                  <div key={idx} className="flex gap-4 rounded border p-5" style={{ borderColor: `${color}25`, borderLeftWidth: 4, borderLeftColor: color, background: isDarkTheme ? 'black' : bg }}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-white text-sm font-bold shadow-sm font-mono" style={{ background: color }}>0{x.priority ?? idx + 1}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2"><span className="text-[9px] font-bold font-mono uppercase tracking-widest px-2 py-0.5 rounded border" style={{ color, background: `${color}15`, borderColor: `${color}30` }}>{x.impact ?? "—"} Impact</span></div>
                      {x.issue && <p className={`font-semibold mb-1 ${headingColor}`}>{x.issue}</p>}
                      <div className="flex items-start gap-1.5"><span className={cn("font-bold text-sm shrink-0", activeColor)}>→</span><p className={`text-sm ${bodyColor}`}>{x.fix}</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Score Breakdown */}
        {orderedScores.length > 0 && (
          <section className={`rounded-lg border ${cardBg} p-6 md:p-8 shadow-sm`}>
            <div className="mb-6">
              <p className={cn("text-[10px] font-mono font-bold uppercase tracking-widest", activeColor)}>Full Analysis</p>
              <h2 className={`mt-2 text-3xl font-bold ${headingColor}`}>📊 Score Breakdown</h2>
            </div>
            <div className="space-y-5">
              {orderedScores.map(([pillar, value]) => (
                <div key={pillar} className={`rounded border ${isDarkTheme ? "border-[#27272a] bg-black" : "border-slate-200 bg-slate-50"} p-5`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold font-mono uppercase tracking-widest ${headingColor}`}>{prettyLabel(pillar)}</h3>
                    <span className={`text-xl font-bold font-mono ${scoreColor(value?.score)}`}>{typeof value?.score === "number" ? `${value.score}/10` : "—"}</span>
                  </div>
                  {value?.issue && <div className="mb-3"><p className={`text-[9px] font-semibold font-mono uppercase tracking-widest ${isDarkTheme ? "text-zinc-500" : "text-slate-400"} mb-1`}>Issue</p><p className={isDarkTheme ? "text-zinc-300" : "text-slate-800"}>{value.issue}</p></div>}
                  {value?.fix && <div className="mb-3"><p className={`text-[9px] font-semibold font-mono uppercase tracking-widest ${isDarkTheme ? "text-zinc-500" : "text-slate-400"} mb-1`}>Recommended Fix</p><p className={isDarkTheme ? "text-zinc-300" : "text-slate-800"}>{value.fix}</p></div>}
                  {value?.rewritten_copy && <div><p className={`text-[9px] font-semibold font-mono uppercase tracking-widest ${activeColor} mb-1`}>Rewritten Copy</p><p className={`italic border-l-2 pl-3 py-1 ${isDarkTheme ? "border-[#27272a] text-zinc-300" : "border-slate-200 text-slate-800"}`}>{value.rewritten_copy}</p></div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Copy Pack */}
        {copyPack.headline && (
          <section className={`rounded-lg border ${cardBg} p-6 md:p-8 shadow-sm`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <p className={cn("text-[10px] font-mono font-bold uppercase tracking-widest", activeColor)}>Deliverable</p>
                <h2 className={`mt-2 text-3xl font-bold ${headingColor}`}>✍️ Copy Pack</h2>
                <p className={`text-sm mt-2 ${isDarkTheme ? "text-zinc-400" : "text-slate-500"}`}>Homepage-ready copy written to improve clarity, trust, and action.</p>
              </div>
              <button onClick={handleDownloadDocx} disabled={downloadingDocx} className={`rounded border font-bold uppercase tracking-widest font-mono text-[10px] px-5 py-3 transition-colors shadow-sm disabled:opacity-50 ${isDarkTheme ? "border-[#27272a] bg-black hover:bg-zinc-900 text-white" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"}`}>
                {downloadingDocx ? "Generating…" : "Download Copy Pack (.docx)"}
              </button>
            </div>
            <div className="space-y-4">
              <div className={`rounded border p-5 ${isDarkTheme ? "border-[#06B6D4]/30 bg-[#06B6D4]/10" : "border-teal-100 bg-teal-50"}`}>
                <p className={`text-[9px] font-semibold font-mono uppercase tracking-widest ${isDarkTheme ? "text-[#06B6D4]" : "text-teal-700"} mb-2`}>Headline</p>
                <p className={`text-2xl font-bold ${headingColor}`}>{copyPack.headline}</p>
              </div>
              {copyPack.subheadline && <div className={`rounded border p-5 ${isDarkTheme ? "border-[#27272a] bg-black" : "border-slate-200 bg-slate-50"}`}><p className={`text-[9px] font-semibold font-mono uppercase tracking-widest ${isDarkTheme ? "text-zinc-500" : "text-slate-500"} mb-2`}>Subheadline</p><p className={isDarkTheme ? "text-zinc-300" : "text-slate-800"}>{copyPack.subheadline}</p></div>}
              <div className="grid gap-4 md:grid-cols-2">
                {copyPack.primary_cta && <div className={`rounded border p-5 ${isDarkTheme ? "border-[#27272a] bg-black" : "border-slate-200 bg-slate-50"}`}><p className={`text-[9px] font-semibold font-mono uppercase tracking-widest ${isDarkTheme ? "text-zinc-500" : "text-slate-500"} mb-2`}>Primary CTA</p><p className={`font-bold ${headingColor}`}>{copyPack.primary_cta}</p></div>}
                {copyPack.trust_line && <div className={`rounded border p-5 ${isDarkTheme ? "border-[#27272a] bg-black" : "border-slate-200 bg-slate-50"}`}><p className={`text-[9px] font-semibold font-mono uppercase tracking-widest ${isDarkTheme ? "text-zinc-500" : "text-slate-500"} mb-2`}>Trust Line</p><p className={`font-bold ${headingColor}`}>{copyPack.trust_line}</p></div>}
              </div>
              {copyPack.benefit_bullets && copyPack.benefit_bullets.length > 0 && (
                <div className={`rounded border p-5 ${isDarkTheme ? "border-[#27272a] bg-black" : "border-slate-200 bg-slate-50"}`}>
                  <p className={`text-[9px] font-semibold font-mono uppercase tracking-widest ${isDarkTheme ? "text-zinc-500" : "text-slate-500"} mb-3`}>Benefit Bullets</p>
                  <ul className="space-y-3">{copyPack.benefit_bullets.map((bullet, i) => (<li key={i} className="flex gap-3"><span className={cn("font-bold", activeColor)}>✓</span><span className={isDarkTheme ? "text-zinc-300" : "text-slate-800"}>{bullet}</span></li>))}</ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Visual Deliverable */}
        {mockupHtml && (
          <section className={`rounded-lg border ${isDarkTheme ? "border-[#27272a]" : "border-slate-200"} shadow-sm overflow-hidden`}>
            <div className={cn("px-6 py-5", isDarkTheme ? "bg-black" : "bg-[linear-gradient(135deg,#020617,#0f172a)]")}>
              <p className={cn("text-[10px] font-mono font-bold uppercase tracking-widest", activeColor)}>Visual Deliverable</p>
              <h2 className="mt-2 text-2xl font-bold text-white">🎨 Your Homepage Mockup</h2>
              <p className="text-zinc-400 text-sm mt-2 font-mono">Compare your current site with a more conversion-focused direction.</p>
            </div>

            <div className={`flex border-b ${isDarkTheme ? "border-[#27272a] bg-black" : "border-slate-200"}`}>
              <button onClick={() => setActiveTab("before")} className={`flex-1 py-4 text-[10px] font-mono uppercase tracking-widest font-bold transition-colors ${activeTab === "before" ? `${isDarkTheme ? "bg-[#111]" : "bg-white"} text-red-500 border-b-2 border-red-500` : `${isDarkTheme ? "bg-black text-zinc-500" : "bg-slate-50 text-slate-500"} hover:text-zinc-400`}`}>❌ Before (Current Site)</button>
              <button onClick={() => setActiveTab("after")} className={`flex-1 py-4 text-[10px] font-mono uppercase tracking-widest font-bold transition-colors ${activeTab === "after" ? `${isDarkTheme ? "bg-[#111]" : "bg-white"} ${activeColor} border-b-2 ${isGeoMode ? "border-[#D946EF]" : "border-[#06B6D4]"}` : `${isDarkTheme ? "bg-black text-zinc-500" : "bg-slate-50 text-slate-500"} hover:text-zinc-400`}`}>✅ After (ConversionDoc Fix)</button>
            </div>

            <div style={{ display: activeTab === "before" ? "block" : "none" }}>
              {displayScreenshotUrl && (
                <div style={{ background: isDarkTheme ? "#000" : "#0f172a", position: "relative" }}>
                  {!screenshotLoaded && !screenshotErrored && (<div style={{ minHeight: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}><div className={cn("w-9 h-9 rounded-full border-4 border-t-transparent animate-spin", isGeoMode ? "border-[#D946EF]" : "border-[#06B6D4]")} /><p style={{ color: "#94a3b8", fontSize: 14, fontWeight: 500, margin: 0 }}>Loading screenshot…</p></div>)}
                  {screenshotLoaded && (<div style={{ position: "relative", width: "100%" }}><img src={displayScreenshotUrl} alt="Current site" style={{ width: "100%", display: "block", maxHeight: 600, objectFit: "cover", objectPosition: "top" }} />{purchase.url && <a href={purchase.url} target="_blank" rel="noopener noreferrer" style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "6px 12px", borderRadius: 8, textDecoration: "none", border: "1px solid rgba(255,255,255,0.15)" }}>View Live Site →</a>}</div>)}
                </div>
              )}
              {topFixes && topFixes.length > 0 && (
                <div className={`p-6 space-y-3 ${isDarkTheme ? "bg-[#111]" : "bg-slate-50"}`}>
                  <p className={`text-[10px] font-mono font-bold uppercase tracking-widest mb-4 ${isDarkTheme ? "text-zinc-500" : "text-slate-500"}`}>Issues Identified on Current Site</p>
                  {topFixes.map((fix, i) => {
                    const color = impactColor[fix.impact || "Medium"] || "#f59e0b";
                    const bg = impactBg[fix.impact || "Medium"] || impactBg["Medium"];
                    return (<div key={i} className={`rounded border p-5 flex gap-4 ${isDarkTheme ? "bg-black" : "bg-white"}`} style={{ borderColor: `${color}30`, borderLeftWidth: 4, borderLeftColor: color }}><div className="w-9 h-9 rounded flex items-center justify-center text-white font-mono text-sm font-bold shrink-0" style={{ background: color }}>0{fix.priority ?? i + 1}</div><div className="min-w-0"><div className="flex items-center gap-2 mb-2"><span className="text-[9px] font-bold font-mono uppercase tracking-widest px-2 py-0.5 rounded border" style={{ color, background: isDarkTheme ? 'transparent' : bg, borderColor: `${color}30` }}>{fix.impact} Impact</span></div><p className={`font-semibold text-sm mb-1 leading-snug ${headingColor}`}>{fix.issue}</p><div className="flex items-start gap-1.5"><span className={cn("text-xs font-bold shrink-0 mt-0.5", activeColor)}>→</span><p className={`text-xs leading-relaxed ${bodyColor}`}>{fix.fix}</p></div></div></div>);
                  })}
                </div>
              )}
            </div>

            <div style={{ display: activeTab === "after" ? "block" : "none" }}>
              <div className={isDarkTheme ? "bg-[#111]" : "bg-white"}>
                <div className={`flex items-center gap-2 px-6 pt-4 pb-0 border-b ${isDarkTheme ? "bg-black border-[#27272a]" : "bg-slate-50 border-slate-100"}`}>
                  <button onClick={() => setMockupVersion("a")} className={`px-4 py-2 rounded-t text-[10px] font-mono uppercase tracking-widest font-bold transition-colors border-b-2 -mb-px ${mockupVersion === "a" ? `${isDarkTheme ? "bg-[#111]" : "bg-white"} ${activeColor} ${isGeoMode ? "border-[#D946EF]" : "border-[#06B6D4]"} shadow-sm` : "bg-transparent text-zinc-500 border-transparent hover:text-zinc-400"}`}>Version A</button>
                  {mockupHtmlB && <button onClick={() => setMockupVersion("b")} className={`px-4 py-2 rounded-t text-[10px] font-mono uppercase tracking-widest font-bold transition-colors border-b-2 -mb-px ${mockupVersion === "b" ? `${isDarkTheme ? "bg-[#111]" : "bg-white"} ${activeColor} ${isGeoMode ? "border-[#D946EF]" : "border-[#06B6D4]"} shadow-sm` : "bg-transparent text-zinc-500 border-transparent hover:text-zinc-400"}`}>Version B</button>}
                  <span className={`ml-auto text-[9px] font-mono uppercase tracking-widest pb-2 ${isDarkTheme ? "text-zinc-600" : "text-slate-400"}`}>{mockupVersion === "a" ? "Recommended layout" : "Alternative layout"}</span>
                </div>
                <div className="relative">
                  <div ref={mockupRef} className="w-full overflow-hidden" dangerouslySetInnerHTML={{ __html: activeMockupHtml || "" }} />
                  <button onClick={() => setFullscreen(true)} className="absolute bottom-4 right-4 bg-black/80 border border-[#27272a] hover:bg-black text-white font-mono uppercase tracking-widest text-[10px] font-bold px-4 py-3 rounded transition-colors">⛶ Fullscreen</button>
                </div>
              </div>

              <div className={`px-6 py-4 border-t flex flex-wrap gap-3 ${isDarkTheme ? "bg-black border-[#27272a]" : "bg-slate-50 border-slate-200"}`}>
                <button onClick={handleCopyCode} className={cn("rounded font-mono text-[10px] uppercase tracking-widest font-bold px-5 py-3 transition-colors shadow-sm", activeBtn)}>{copySuccess ? "✓ Copied!" : "Copy HTML"}</button>
                <button onClick={handleDownloadPng} disabled={downloading} className={`rounded border font-mono text-[10px] uppercase tracking-widest font-bold px-5 py-3 transition-colors shadow-sm disabled:opacity-50 ${isDarkTheme ? "border-[#27272a] bg-[#111] hover:bg-zinc-900 text-zinc-200" : "border-slate-200 bg-white hover:bg-slate-100 text-slate-700"}`}>{downloading ? "Generating…" : "Download PNG"}</button>
                <button onClick={handleDownloadPdf} disabled={downloadingPdf} className={`rounded border font-mono text-[10px] uppercase tracking-widest font-bold px-5 py-3 transition-colors shadow-sm disabled:opacity-50 ${isDarkTheme ? "border-[#27272a] bg-[#111] hover:bg-zinc-900 text-zinc-200" : "border-slate-200 bg-white hover:bg-slate-100 text-slate-700"}`}>{downloadingPdf ? "Generating PDF…" : "Download Report PDF"}</button>
                <button onClick={handleDownloadKit} disabled={downloadingKit} className={`rounded border font-mono text-[10px] uppercase tracking-widest font-bold px-5 py-3 transition-colors shadow-sm disabled:opacity-50 ${isDarkTheme ? "border-[#27272a] bg-[#111] hover:bg-zinc-900 text-zinc-200" : "bg-slate-900 hover:bg-black text-white"}`}>{downloadingKit ? "Building Kit…" : "Download Homepage Kit (.zip)"}</button>
                {purchase.url && <a href={purchase.url} target="_blank" rel="noopener noreferrer" className={`rounded border font-mono text-[10px] uppercase tracking-widest font-bold px-5 py-3 transition-colors shadow-sm ${isDarkTheme ? "border-[#27272a] bg-[#111] hover:bg-zinc-900 text-zinc-200" : "border-slate-200 bg-white hover:bg-slate-100 text-slate-700"}`}>View Current Site →</a>}
              </div>
            </div>
          </section>
        )}

        {/* Next Step (Hidden for White Label Subs) */}
        {!isWhiteLabel && (
          <section className={`rounded-lg border ${cardBg} p-6 md:p-8 shadow-sm`}>
            <p className={cn("text-[10px] font-mono font-bold uppercase tracking-widest mb-2", activeColor)}>Next Step</p>
            <h2 className={`text-3xl font-bold ${headingColor} mb-3`}>Need help implementing these recommendations?</h2>
            <p className={`mb-6 max-w-3xl leading-7 ${bodyColor}`}>If you'd like expert help putting these fixes into action — from copy rewrites to full page redesigns — tell us what you need and we'll come back to you within 1–2 business days.</p>
            <button onClick={() => setEnquiryOpen(true)} className={cn("rounded font-mono text-[10px] font-bold uppercase tracking-widest px-6 py-4 transition-colors shadow-sm", activeBtn)}>Get Implementation Help →</button>
          </section>
        )}

      </div>

      {fullscreen && activeMockupHtml && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 bg-[#0A0A0A] border-b border-surgical shrink-0">
            <p className={cn("font-mono text-xs font-bold uppercase tracking-widest", activeColor)}>
               Mockup_View: {mockupVersion === "a" ? "Recommended" : "Alternative"}
            </p>
            <button onClick={() => setFullscreen(false)} className="text-data hover:text-white font-mono text-xs uppercase tracking-widest flex items-center gap-2">Close <LogOut className="w-3 h-3"/></button>
          </div>
          <div className="flex-1 overflow-auto bg-white relative">
             <div dangerouslySetInnerHTML={{ __html: activeMockupHtml }} />
          </div>
        </div>
      )}
    </div>
  );
}
