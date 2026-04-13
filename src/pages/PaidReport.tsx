import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

type WhiteLabel = {
  logo: string | null;
  theme: "light" | "dark";
  is_subscriber: boolean;
};

type VerifyPurchaseResponse =
  | { valid: true; purchase: PurchaseRow; white_label?: WhiteLabel }
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

// ─── PDF BUILDER ───────────────────────────────────────────────────────────

const buildPdf = ({
  isGeoMode,
  overallScore,
  auditData,
  topFixes,
  orderedScores,
  summary,
  purchaseUrl,
  hasMockupB,
  whiteLabel,
}: {
  isGeoMode: boolean;
  overallScore: number | null;
  auditData: AuditData | null;
  topFixes: TopFix[] | null;
  orderedScores: [string, ScoreItem][];
  summary: SummaryData;
  purchaseUrl?: string | null;
  hasMockupB?: boolean;
  whiteLabel?: WhiteLabel;
}): jsPDF => {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const isDark = whiteLabel?.theme === "dark";

  const W = 210;
  const H = 297;
  const ML = 16;
  const MR = 16;
  const CW = W - ML - MR;
  const BOTTOM_MARGIN = 20;

  const NAVY: [number, number, number] = [2, 6, 23];
  const TEAL: [number, number, number] = [13, 148, 136];
  const TEAL_LIGHT: [number, number, number] = [240, 253, 250];
  const TEAL_BORDER: [number, number, number] = [153, 246, 228];
  const SLATE_900: [number, number, number] = [15, 23, 42];
  const SLATE_700: [number, number, number] = [51, 65, 85];
  const SLATE_500: [number, number, number] = [100, 116, 139];
  const SLATE_200: [number, number, number] = [226, 232, 240];
  const SLATE_50: [number, number, number] = [248, 250, 252];
  const WHITE: [number, number, number] = [255, 255, 255];
  const EMERALD: [number, number, number] = [16, 185, 129];
  const AMBER: [number, number, number] = [245, 158, 11];
  const RED: [number, number, number] = [239, 68, 68];

  const BG: [number, number, number] = isDark ? NAVY : WHITE;
  const BODY_TEXT: [number, number, number] = isDark ? [203, 213, 225] : SLATE_700;
  const CARD_BG: [number, number, number] = isDark ? [15, 23, 42] : SLATE_50;
  const CARD_BORDER: [number, number, number] = isDark ? [30, 41, 59] : SLATE_200;
  const HEADING_COLOR: [number, number, number] = isDark ? WHITE : SLATE_900;

  const scoreRgb = (s: number | null): [number, number, number] =>
    s === null ? SLATE_500 : s >= 70 ? EMERALD : s >= 50 ? AMBER : RED;

  const pillarScoreRgb = (s: number | undefined): [number, number, number] =>
    typeof s !== "number" ? SLATE_500 : s >= 8 ? EMERALD : s >= 5 ? AMBER : RED;

  const impactRgb = (impact: string): [number, number, number] =>
    impact === "High" ? RED : impact === "Medium" ? AMBER : [107, 114, 128];

  let y = 0;

  const checkPageBreak = (neededMm: number) => {
    if (y + neededMm > H - BOTTOM_MARGIN) {
      pdf.addPage();
      y = 16;
      if (isDark) {
        pdf.setFillColor(...BG);
        pdf.rect(0, 0, W, H, "F");
      }
    }
  };

  if (isDark) {
    pdf.setFillColor(...BG);
    pdf.rect(0, 0, W, H, "F");
  }

  const setFont = (
    style: "normal" | "bold" | "italic" = "normal",
    size = 10,
    color: [number, number, number] = BODY_TEXT
  ) => {
    pdf.setFont("helvetica", style);
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
  };

  const wrappedText = (
    text: string,
    x: number,
    maxWidth: number,
    lineHeight: number,
    style: "normal" | "bold" | "italic" = "normal",
    size = 10,
    color: [number, number, number] = BODY_TEXT
  ): void => {
    setFont(style, size, color);
    const lines = pdf.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      checkPageBreak(lineHeight);
      pdf.text(line, x, y);
      y += lineHeight;
    });
  };

  const sectionDivider = () => {
    checkPageBreak(8);
    pdf.setDrawColor(...CARD_BORDER);
    pdf.setLineWidth(0.3);
    pdf.line(ML, y, W - MR, y);
    y += 8;
  };

  const microLabel = (text: string, color: [number, number, number] = TEAL) => {
    checkPageBreak(6);
    setFont("bold", 7, color);
    pdf.text(text.toUpperCase(), ML, y);
    y += 5;
  };

  const roundedRect = (
    x: number,
    rectY: number,
    w: number,
    h: number,
    fill: [number, number, number],
    stroke?: [number, number, number],
    radius = 3
  ) => {
    pdf.setFillColor(...fill);
    if (stroke) {
      pdf.setDrawColor(...stroke);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(x, rectY, w, h, radius, radius, "FD");
    } else {
      pdf.roundedRect(x, rectY, w, h, radius, radius, "F");
    }
  };

  // ── HEADER ─────────────────────────────────────────────────────────────────
  roundedRect(ML, 12, CW, 44, NAVY, undefined, 4);
  pdf.setFillColor(...TEAL);
  pdf.rect(ML, 12, CW, 1.2, "F");

  setFont("bold", 7, TEAL);
  pdf.text(isGeoMode ? "FULL GEO AUDIT" : "FULL DIAGNOSIS", ML + 6, 20);

  const brandName = whiteLabel?.is_subscriber && whiteLabel.logo ? "" : "ConversionDoc";
  if (brandName) {
    setFont("bold", 8, TEAL);
    pdf.text(brandName, W - MR - 6, 20, { align: "right" });
  }

  setFont("bold", 18, WHITE);
  pdf.text(isGeoMode ? "AI Search Readiness Report" : "Conversion Report", ML + 6, 30);

  if (auditData?.verdict) {
    setFont("italic", 8, [148, 163, 184]);
    const verdictLines = pdf.splitTextToSize(`"${auditData.verdict}"`, CW - 12);
    verdictLines.slice(0, 2).forEach((line: string, i: number) => {
      pdf.text(line, ML + 6, 38 + i * 5);
    });
  }

  if (purchaseUrl) {
    setFont("normal", 7, TEAL);
    pdf.text(purchaseUrl, ML + 6, 51);
  }

  y = 64;

  // ── EXECUTIVE SUMMARY ──────────────────────────────────────────────────────
  microLabel("Executive Summary", TEAL);
  wrappedText(
    isGeoMode
      ? "Your biggest opportunity to improve AI search visibility"
      : "Your strongest opportunity to improve conversions",
    ML, CW, 7, "bold", 14, HEADING_COLOR
  );
  y += 2;

  checkPageBreak(24);
  const cardW = (CW - 8) / 3;

  roundedRect(ML, y, cardW, 22, CARD_BG, CARD_BORDER);
  setFont("normal", 7, SLATE_500);
  pdf.text(isGeoMode ? "GEO Readiness Score" : "Overall Score", ML + 4, y + 6);
  setFont("bold", 16, scoreRgb(overallScore));
  pdf.text(overallScore !== null ? `${overallScore}/100` : "N/A", ML + 4, y + 17);

  roundedRect(ML + cardW + 4, y, cardW, 22, CARD_BG, CARD_BORDER);
  setFont("normal", 7, SLATE_500);
  pdf.text(isGeoMode ? "Strongest Dimension" : "Strongest Pillar", ML + cardW + 8, y + 6);
  setFont("bold", 10, HEADING_COLOR);
  const strongLines = pdf.splitTextToSize(
    summary.strongest_pillar ? prettyLabel(summary.strongest_pillar) : "N/A", cardW - 8
  );
  strongLines.slice(0, 2).forEach((line: string, i: number) => {
    pdf.text(line, ML + cardW + 8, y + 13 + i * 5);
  });

  roundedRect(ML + (cardW + 4) * 2, y, cardW, 22, CARD_BG, CARD_BORDER);
  setFont("normal", 7, SLATE_500);
  pdf.text(isGeoMode ? "Weakest Dimension" : "Weakest Pillar", ML + (cardW + 4) * 2 + 4, y + 6);
  setFont("bold", 10, HEADING_COLOR);
  const weakLines = pdf.splitTextToSize(
    summary.weakest_pillar ? prettyLabel(summary.weakest_pillar) : "N/A", cardW - 8
  );
  weakLines.slice(0, 2).forEach((line: string, i: number) => {
    pdf.text(line, ML + (cardW + 4) * 2 + 4, y + 13 + i * 5);
  });

  y += 26;

  const oppText = summary.biggest_opportunity || "N/A";
  const oppLines = pdf.splitTextToSize(oppText, CW - 10);
  const oppH = 10 + oppLines.length * 5.5;
  checkPageBreak(oppH + 4);
  roundedRect(ML, y, CW, oppH, TEAL_LIGHT, TEAL_BORDER);
  setFont("bold", 7, [15, 118, 110]);
  pdf.text(isGeoMode ? "BIGGEST GEO OPPORTUNITY" : "BIGGEST OPPORTUNITY", ML + 5, y + 6);
  setFont("bold", 9.5, SLATE_900);
  oppLines.forEach((line: string, i: number) => {
    pdf.text(line, ML + 5, y + 12 + i * 5.5);
  });
  y += oppH + 4;

  const diagText = summary.executive_summary || "N/A";
  const diagLines = pdf.splitTextToSize(diagText, CW - 10);
  const diagH = 10 + diagLines.length * 5;
  checkPageBreak(diagH + 4);
  roundedRect(ML, y, CW, diagH, CARD_BG, CARD_BORDER);
  setFont("bold", 7, SLATE_500);
  pdf.text("DIAGNOSIS", ML + 5, y + 6);
  setFont("normal", 9, BODY_TEXT);
  diagLines.forEach((line: string, i: number) => {
    pdf.text(line, ML + 5, y + 12 + i * 5);
  });
  y += diagH + 6;

  sectionDivider();

  // ── TOP FIXES ──────────────────────────────────────────────────────────────
  microLabel("Action Plan", TEAL);
  wrappedText(
    isGeoMode ? "Top AI Visibility Fixes" : "Top Priority Fixes",
    ML, CW, 7, "bold", 14, HEADING_COLOR
  );
  y += 2;

  (topFixes || []).forEach((fix) => {
    const impact = fix.impact || "Medium";
    const iRgb = impactRgb(impact);
    const iRgbLight: [number, number, number] = isDark
      ? [Math.min(40, iRgb[0] / 4), Math.min(40, iRgb[1] / 4), Math.min(40, iRgb[2] / 4)]
      : [Math.min(255, iRgb[0] + 190), Math.min(255, iRgb[1] + 190), Math.min(255, iRgb[2] + 190)];

    const LEFT_BAR = 1.5;
    const CIRCLE_RADIUS = 4;
    const CIRCLE_CENTER_X = ML + LEFT_BAR + 2 + CIRCLE_RADIUS;
    const TEXT_X = CIRCLE_CENTER_X + CIRCLE_RADIUS + 4;
    const TEXT_W = W - MR - TEXT_X - 4;

    const PILL_H = 5.5;
    const ISSUE_LH = 5;
    const FIX_LH = 4.5;
    const V_PAD_TOP = 6;
    const V_PAD_BOT = 6;
    const PILL_GAP = 3;
    const ISSUE_GAP = 3;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    const issueLines: string[] = pdf.splitTextToSize(fix.issue || "", TEXT_W);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    const fixText = `-> ${fix.fix || ""}`;
    const fixLines: string[] = pdf.splitTextToSize(fixText, TEXT_W);

    const cardH =
      V_PAD_TOP + PILL_H + PILL_GAP +
      issueLines.length * ISSUE_LH + ISSUE_GAP +
      fixLines.length * FIX_LH + V_PAD_BOT;

    checkPageBreak(cardH + 4);

    roundedRect(ML, y, CW, cardH, iRgbLight, undefined, 3);
    pdf.setFillColor(...iRgb);
    pdf.rect(ML, y, LEFT_BAR, cardH, "F");

    pdf.setFillColor(...iRgb);
    pdf.circle(CIRCLE_CENTER_X, y + V_PAD_TOP + CIRCLE_RADIUS, CIRCLE_RADIUS, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...WHITE);
    pdf.text(String(fix.priority ?? ""), CIRCLE_CENTER_X, y + V_PAD_TOP + CIRCLE_RADIUS + 1, { align: "center" });

    const pillLabel = `${impact.toUpperCase()} IMPACT`;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...iRgb);
    const pillW = pdf.getTextWidth(pillLabel) + 6;
    pdf.setFillColor(...(isDark ? [15, 23, 42] as [number, number, number] : [255, 255, 255] as [number, number, number]));
    pdf.roundedRect(TEXT_X, y + V_PAD_TOP, pillW, PILL_H, 1.5, 1.5, "F");
    pdf.text(pillLabel, TEXT_X + 3, y + V_PAD_TOP + 3.8);

    let innerY = y + V_PAD_TOP + PILL_H + PILL_GAP;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...HEADING_COLOR);
    issueLines.forEach((line: string) => {
      innerY += ISSUE_LH;
      pdf.text(line, TEXT_X, innerY);
    });

    innerY += ISSUE_GAP;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...BODY_TEXT);
    fixLines.forEach((line: string) => {
      innerY += FIX_LH;
      pdf.text(line, TEXT_X, innerY);
    });

    y += cardH + 4;
  });

  sectionDivider();

  // ── SCORE BREAKDOWN ────────────────────────────────────────────────────────
  microLabel("Full Analysis", TEAL);
  wrappedText(
    isGeoMode ? "GEO Dimension Breakdown" : "Score Breakdown",
    ML, CW, 7, "bold", 14, HEADING_COLOR
  );
  y += 2;

  orderedScores.forEach(([pillar, value]) => {
    const s = value?.score;
    const sRgb = pillarScoreRgb(s);
    const INNER_W = CW - 10;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    const issueLines: string[] = value?.issue ? pdf.splitTextToSize(value.issue, INNER_W) : [];
    const fixLines: string[] = value?.fix ? pdf.splitTextToSize(value.fix, INNER_W) : [];
    const rewriteLines: string[] = value?.rewritten_copy
      ? pdf.splitTextToSize(value.rewritten_copy, INNER_W) : [];

    const labelRows =
      (issueLines.length > 0 ? 1 : 0) +
      (fixLines.length > 0 ? 1 : 0) +
      (rewriteLines.length > 0 ? 1 : 0);

    const contentH =
      14 +
      issueLines.length * 4.5 +
      fixLines.length * 4.5 +
      rewriteLines.length * 4.5 +
      labelRows * 6;

    checkPageBreak(contentH + 4);
    roundedRect(ML, y, CW, contentH, CARD_BG, CARD_BORDER);

    setFont("bold", 11, HEADING_COLOR);
    pdf.text(prettyLabel(pillar), ML + 5, y + 8);
    setFont("bold", 11, sRgb);
    pdf.text(typeof s === "number" ? `${s}/10` : "—", W - MR - 5, y + 8, { align: "right" });

    pdf.setDrawColor(...CARD_BORDER);
    pdf.setLineWidth(0.2);
    pdf.line(ML + 5, y + 10, W - MR - 5, y + 10);

    let innerY = y + 16;

    if (issueLines.length > 0) {
      setFont("bold", 7, SLATE_500);
      pdf.text("ISSUE", ML + 5, innerY);
      innerY += 5;
      setFont("normal", 8.5, BODY_TEXT);
      issueLines.forEach((line: string) => { pdf.text(line, ML + 5, innerY); innerY += 4.5; });
      innerY += 2;
    }

    if (fixLines.length > 0) {
      setFont("bold", 7, SLATE_500);
      pdf.text("RECOMMENDED FIX", ML + 5, innerY);
      innerY += 5;
      setFont("normal", 8.5, BODY_TEXT);
      fixLines.forEach((line: string) => { pdf.text(line, ML + 5, innerY); innerY += 4.5; });
      innerY += 2;
    }

    if (rewriteLines.length > 0) {
      setFont("bold", 7, TEAL);
      pdf.text(isGeoMode ? "REWRITTEN CONTENT" : "REWRITTEN COPY", ML + 5, innerY);
      innerY += 5;
      setFont("italic", 8.5, BODY_TEXT);
      rewriteLines.forEach((line: string) => { pdf.text(line, ML + 5, innerY); innerY += 4.5; });
    }

    y += contentH + 4;
  });

  // ── FOOTER on every page ───────────────────────────────────────────────────
  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    if (isDark) {
      pdf.setFillColor(...BG);
      pdf.rect(0, H - 18, W, 18, "F");
    }
    pdf.setDrawColor(...CARD_BORDER);
    pdf.setLineWidth(0.3);
    pdf.line(ML, H - 12, W - MR, H - 12);
    if (!whiteLabel?.is_subscriber) {
      setFont("bold", 7.5, TEAL);
      pdf.text("ConversionDoc — conversiondoc.co.uk", ML, H - 7);
    }
    setFont("normal", 7, SLATE_500);
    pdf.text(`${p} / ${totalPages}`, W / 2, H - 7, { align: "center" });
    if (purchaseUrl) {
      setFont("normal", 7, SLATE_500);
      pdf.text(purchaseUrl, W - MR, H - 7, { align: "right" });
    }
  }

  return pdf;
};

// ─── COPY PACK DOCX BUILDER ────────────────────────────────────────────────

const buildDocx = async ({
  isGeoMode,
  copyPack,
  overallScore,
  summary,
  topFixes,
  purchaseUrl,
  whiteLabel,
}: {
  isGeoMode: boolean;
  copyPack: HomepageCopyPack;
  overallScore: number | null;
  summary: SummaryData;
  topFixes: TopFix[] | null;
  purchaseUrl?: string | null;
  whiteLabel?: WhiteLabel;
}): Promise<Blob> => {
  const bullets = Array.isArray(copyPack.benefit_bullets)
    ? copyPack.benefit_bullets.filter(Boolean) : [];

  const tealColor = "0D9488";
  const navyColor = "1E3A5F";
  const slateColor = "475569";
  const darkColor = "1E293B";

  const sectionLabel = (text: string) =>
    new Paragraph({
      children: [new TextRun({ text: text.toUpperCase(), color: tealColor, size: 18, font: "Inter", bold: true, characterSpacing: 80 })],
      spacing: { before: 320, after: 80 },
    });

  const heading = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text, color: darkColor, size: 28, font: "Inter", bold: true })],
      spacing: { after: 160 },
    });

  const subLabel = (text: string) =>
    new Paragraph({
      children: [new TextRun({ text: text.toUpperCase(), color: "94A3B8", size: 16, font: "Inter", bold: true, characterSpacing: 60 })],
      spacing: { before: 160, after: 60 },
    });

  const bodyText = (text: string, italic = false) =>
    new Paragraph({
      children: [new TextRun({ text, color: slateColor, size: 22, font: "Inter", italics: italic })],
      spacing: { after: 100 },
    });

  const boldText = (text: string) =>
    new Paragraph({
      children: [new TextRun({ text, color: darkColor, size: 22, font: "Inter", bold: true })],
      spacing: { after: 100 },
    });

  const divider = () =>
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" } },
      spacing: { before: 200, after: 200 },
      children: [],
    });

  const brandLine = whiteLabel?.is_subscriber
    ? []
    : [new Paragraph({
        children: [new TextRun({ text: "ConversionDoc", color: tealColor, size: 20, font: "Inter", bold: true, characterSpacing: 60 })],
        spacing: { after: 80 },
      })];

  const children = [
    ...brandLine,
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: isGeoMode ? "AI Search Readiness Report" : "Conversion Report", color: navyColor, size: 48, font: "Inter", bold: true })],
      spacing: { after: 120 },
    }),
    ...(purchaseUrl ? [new Paragraph({
      children: [new TextRun({ text: purchaseUrl, color: tealColor, size: 20, font: "Inter" })],
      spacing: { after: 80 },
    })] : []),

    divider(),
    sectionLabel("Executive Summary"),
    heading(isGeoMode ? "AI Search Readiness Score" : "Overall Score"),
    new Paragraph({
      children: [new TextRun({
        text: overallScore !== null ? `${overallScore}/100` : "N/A",
        color: overallScore !== null && overallScore >= 70 ? "10B981"
          : overallScore !== null && overallScore >= 50 ? "F59E0B" : "EF4444",
        size: 48, font: "Inter", bold: true,
      })],
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
    sectionLabel("Deliverable"),
    heading(isGeoMode ? "Content Pack" : "Copy Pack"),

    subLabel("Headline"),
    new Paragraph({
      children: [new TextRun({ text: copyPack.headline || "N/A", color: darkColor, size: 32, font: "Inter", bold: true })],
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
          new TextRun({ text: "- ", color: tealColor, size: 22, font: "Inter", bold: true }),
          new TextRun({ text: b, color: slateColor, size: 22, font: "Inter" }),
        ],
        spacing: { after: 80 },
      })
    ),
    ...(copyPack.supporting_copy ? [subLabel("Supporting Copy"), bodyText(copyPack.supporting_copy)] : []),

    divider(),
    ...(!whiteLabel?.is_subscriber ? [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Generated by ConversionDoc — conversiondoc.co.uk", color: tealColor, size: 18, font: "Inter", bold: true })],
      spacing: { before: 200 },
    })] : []),
  ];

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } } },
      children,
    }],
  });

  return await Packer.toBlob(doc);
};

// ─── INSTRUCTIONS DOCX BUILDER ─────────────────────────────────────────────

const buildInstructionsDocx = async ({
  isGeoMode,
  hasMockupB,
  purchaseUrl,
  whiteLabel,
}: {
  isGeoMode: boolean;
  hasMockupB: boolean;
  purchaseUrl?: string | null;
  whiteLabel?: WhiteLabel;
}): Promise<Blob> => {
  const tealColor = "0D9488";
  const navyColor = "1E3A5F";
  const slateColor = "475569";
  const darkColor = "1E293B";
  const mutedColor = "94A3B8";

  const prefix = isGeoMode ? "geo" : "homepage";
  const docxName = isGeoMode ? "geo-content-pack.docx" : "copy-pack.docx";

  const heading1 = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text, color: navyColor, size: 48, font: "Inter", bold: true })],
      spacing: { after: 120 },
    });

  const heading2 = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text, color: darkColor, size: 28, font: "Inter", bold: true })],
      spacing: { before: 320, after: 100 },
    });

  const sectionLabel = (text: string) =>
    new Paragraph({
      children: [new TextRun({ text: text.toUpperCase(), color: tealColor, size: 18, font: "Inter", bold: true, characterSpacing: 80 })],
      spacing: { before: 400, after: 80 },
    });

  const bodyText = (text: string) =>
    new Paragraph({
      children: [new TextRun({ text, color: slateColor, size: 22, font: "Inter" })],
      spacing: { after: 100 },
    });

  const mutedText = (text: string) =>
    new Paragraph({
      children: [new TextRun({ text, color: mutedColor, size: 20, font: "Inter", italics: true })],
      spacing: { after: 80 },
    });

  const fileRow = (filename: string, description: string) =>
    new Paragraph({
      children: [
        new TextRun({ text: `${filename}`, color: tealColor, size: 22, font: "Inter", bold: true }),
        new TextRun({ text: `  —  ${description}`, color: slateColor, size: 22, font: "Inter" }),
      ],
      spacing: { after: 100 },
    });

  const divider = () =>
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" } },
      spacing: { before: 200, after: 200 },
      children: [],
    });

  const stepNumber = (n: string, title: string) =>
    new Paragraph({
      children: [
        new TextRun({ text: `${n}.  `, color: tealColor, size: 24, font: "Inter", bold: true }),
        new TextRun({ text: title, color: darkColor, size: 24, font: "Inter", bold: true }),
      ],
      spacing: { before: 280, after: 80 },
    });

  const isSubscriber = whiteLabel?.is_subscriber ?? false;

  const brandLine = isSubscriber
    ? []
    : [new Paragraph({
        children: [new TextRun({ text: "ConversionDoc", color: tealColor, size: 20, font: "Inter", bold: true, characterSpacing: 60 })],
        spacing: { after: 60 },
      })];

  const footerLine = isSubscriber
    ? []
    : [
        divider(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Generated by ConversionDoc — conversiondoc.co.uk", color: tealColor, size: 18, font: "Inter", bold: true })],
          spacing: { before: 200 },
        }),
      ];

  const children = [
    ...brandLine,

    heading1(isGeoMode ? "How to use your GEO Audit Kit" : "How to use your Conversion Kit"),

    ...(purchaseUrl ? [new Paragraph({
      children: [new TextRun({ text: `Audited: ${purchaseUrl}`, color: tealColor, size: 20, font: "Inter" })],
      spacing: { after: 80 },
    })] : []),

    divider(),

    sectionLabel("What's in this kit"),

    fileRow(
      `${prefix}-audit-report.pdf`,
      isGeoMode ? "Full GEO audit report — scores, diagnosis, and all recommended fixes" : "Full conversion audit report — scores, diagnosis, and all recommended fixes"
    ),
    fileRow(
      docxName,
      isGeoMode ? "Page-ready content rewritten for AI extractability and conversion" : "Homepage-ready copy rewritten to improve clarity, trust, and action"
    ),
    fileRow(
      `${prefix}-mockup-a.html / .png`,
      "Improved page direction (Version A) — open the HTML in any browser or share the PNG"
    ),
    ...(hasMockupB ? [fileRow(
      `${prefix}-mockup-b.html / .png`,
      "Alternative page direction (Version B)"
    )] : []),
    fileRow(
      "INSTRUCTIONS.docx",
      "This document"
    ),

    divider(),

    sectionLabel("Step-by-step"),

    stepNumber("1", "Read the full report"),
    bodyText(
      `Open ${prefix}-audit-report.pdf. It contains the overall score, diagnosis, and every recommended fix in priority order. Start here before making any changes.`
    ),

    stepNumber("2", isGeoMode ? "Use the content pack" : "Use the copy pack"),
    bodyText(
      `Open ${docxName} in Word or Google Docs. It contains rewritten ${isGeoMode ? "content structured for AI search engines" : "headline, subheadline, CTA, trust line, and benefit bullets"} — ready to paste directly into the page.`
    ),

    stepNumber("3", "Preview the mockup"),
    bodyText(
      `Open ${prefix}-mockup-a.html in any browser to see a visual direction for the improved page.${hasMockupB ? ` A second direction is available in ${prefix}-mockup-b.html.` : ""} Share the PNG with a developer or designer if needed.`
    ),

    stepNumber("4", "Apply highest-impact changes first"),
    bodyText(
      "Focus on Priority 1 and 2 fixes before anything else. Small, targeted changes to the headline and CTA typically deliver the fastest results."
    ),

    ...(isSubscriber ? [] : [
      stepNumber("5", "Need help implementing?"),
      bodyText(
        "Get in touch at hello@conversiondoc.co.uk — we offer implementation support, copy rewrites, and full page redesigns."
      ),
    ]),

    divider(),

    sectionLabel("Tips"),

    bodyText("✓  Make one change at a time so you can measure the impact of each fix."),
    bodyText("✓  Prioritise mobile — check every change on a phone before publishing."),
    bodyText(
      isGeoMode
        ? "✓  AI search engines update their indexes regularly — re-run your GEO audit in 30 days to track progress."
        : "✓  Re-run your audit in 30 days to track your score improvement."
    ),
    bodyText("✓  If in doubt, follow the Priority order in the report — it's ranked by impact."),

    ...(purchaseUrl ? [
      divider(),
      mutedText(`Audited: ${purchaseUrl}`),
    ] : []),

    ...footerLine,
  ];

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } } },
      children,
    }],
  });

  return await Packer.toBlob(doc);
};

// ─── CONSTANTS ─────────────────────────────────────────────────────────────
const PLATFORMS = ["Webflow", "WordPress", "Framer", "Shopify", "Squarespace", "Wix", "Custom code", "Other"];
const HELP_OPTIONS = ["Copy rewrite", "Page redesign", "Full page rebuild", "GEO content restructure", "Developer handoff", "Something else"];

// ─── ENQUIRY MODAL ─────────────────────────────────────────────────────────
function EnquiryModal({
  open, onClose, isGeoMode, prefillUrl, prefillEmail, purchaseId,
}: {
  open: boolean; onClose: () => void; isGeoMode: boolean;
  prefillUrl?: string | null; prefillEmail?: string | null; purchaseId?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(prefillEmail || "");
  const [url, setUrl] = useState(prefillUrl || "");
  const [platform, setPlatform] = useState("");
  const [helpNeeded, setHelpNeeded] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (open) {
      setSubmitted(false); setSubmitError("");
      setEmail(prefillEmail || ""); setUrl(prefillUrl || "");
    }
  }, [open, prefillEmail, prefillUrl]);

  const toggleHelp = (option: string) => {
    setHelpNeeded((prev) => prev.includes(option) ? prev.filter((h) => h !== option) : [...prev, option]);
  };

  const handleSubmit = async () => {
    if (!name || !email) { setSubmitError("Please fill in your name and email."); return; }
    setSubmitting(true); setSubmitError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-enquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ name, email, url, platform, help_needed: helpNeeded, notes, focus: isGeoMode ? "geo" : "conversion", purchase_id: purchaseId }),
      });
      if (!res.ok) { const body = await res.json().catch(() => null); throw new Error(body?.error || "Submission failed"); }
      setSubmitted(true);
    } catch (err: any) { setSubmitError(err.message || "Something went wrong. Please try again."); }
    finally { setSubmitting(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(15,23,42,0.7)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-[28px] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-[linear-gradient(135deg,#020617,#0f172a)] px-7 py-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-400 mb-1">Implementation Help</p>
            <h2 className="text-xl font-bold text-white">{isGeoMode ? "Get help implementing your GEO fixes" : "Get help implementing your recommendations"}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none ml-4 mt-0.5 shrink-0">✕</button>
        </div>
        <div className="px-7 py-6 max-h-[70vh] overflow-y-auto">
          {submitted ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">We'll be in touch shortly</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Thanks for reaching out. We've received your enquiry and will come back to you within 1–2 business days.</p>
              <button onClick={onClose} className="mt-6 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold px-6 py-3 text-sm transition-colors">Close</button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 mb-1.5">Your Name <span className="text-red-400">*</span></label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 mb-1.5">Email Address <span className="text-red-400">*</span></label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 mb-1.5">Website URL</label>
                <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yoursite.com" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 mb-1.5">Platform / Tech Stack</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <button key={p} type="button" onClick={() => setPlatform(p)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${platform === p ? "bg-teal-500 border-teal-500 text-white" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-teal-300"}`}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 mb-1.5">What do you need help with?</label>
                <div className="flex flex-wrap gap-2">
                  {HELP_OPTIONS.map((h) => (
                    <button key={h} type="button" onClick={() => toggleHelp(h)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${helpNeeded.includes(h) ? "bg-teal-500 border-teal-500 text-white" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-teal-300"}`}>{h}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 mb-1.5">Anything else we should know?</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Budget, timeline, specific pages, anything relevant…" rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition resize-none" />
              </div>
              {submitError && <p className="text-xs text-red-500 font-medium">{submitError}</p>}
              <button type="button" onClick={handleSubmit} disabled={submitting} className="w-full rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold px-6 py-3.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? "Sending…" : "Send Enquiry"}
              </button>
              <p className="text-center text-xs text-slate-400">We'll come back to you within 1–2 business days.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────

export default function PaidReport() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchase, setPurchase] = useState<PurchaseRow | null>(null);
  const [whiteLabel, setWhiteLabel] = useState<WhiteLabel | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"before" | "after">("before");
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
        if (data.white_label) setWhiteLabel(data.white_label);
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
      if (e.key === "Escape") { setFullscreen(false); setEnquiryOpen(false); }
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

  const isGeoMode = searchParams.get("focus") === "geo" || purchase?.focus === "geo";

  const isWhiteLabel = whiteLabel?.is_subscriber;
  const isDarkTheme = whiteLabel?.theme === "dark";
  const pageBg = isDarkTheme ? "bg-[#020617]" : "bg-[#f5f8fc]";
  const cardBg = isDarkTheme ? "bg-[#0f172a] border-slate-800" : "bg-white border-slate-200";
  const headingColor = isDarkTheme ? "text-white" : "text-slate-900";
  const bodyColor = isDarkTheme ? "text-slate-300" : "text-slate-700";
  const labelColor = isDarkTheme ? "text-teal-400" : "text-teal-600";

  const orderedScores = useMemo(() => {
    const entries = Object.entries(scores);
    if (!isGeoMode) return entries;
    const geoEntries = entries.filter(([key]) => isGeoPillar(key));
    const otherEntries = entries.filter(([key]) => !isGeoPillar(key));
    return [...geoEntries, ...otherEntries];
  }, [scores, isGeoMode]);

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

  const screenshotUrl =
    (auditData?.screenshot_url || "").length > 0
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
          if (!doc) throw new Error("iframe document not accessible");
          doc.open();
          doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body style="margin:0;padding:0;background:#f8fafc;">${html}</body></html>`);
          doc.close();
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
    try { setDownloading(true); const dataUrl = await generateMockupPng(activeMockupHtml); saveAs(dataUrl, isGeoMode ? "geo-mockup.png" : "homepage-mockup.png"); }
    catch (e) { console.error("PNG download failed:", e); }
    finally { setDownloading(false); }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const pdf = buildPdf({ isGeoMode, overallScore, auditData, topFixes, orderedScores, summary, purchaseUrl: purchase?.url, hasMockupB: !!mockupHtmlB, whiteLabel });
      pdf.save(isGeoMode ? "geo-audit-report.pdf" : "conversion-report.pdf");
    } catch (e) { console.error("PDF download failed:", e); }
    finally { setDownloadingPdf(false); }
  };

  const handleDownloadDocx = async () => {
    try {
      setDownloadingDocx(true);
      const blob = await buildDocx({ isGeoMode, copyPack, overallScore, summary, topFixes, purchaseUrl: purchase?.url, whiteLabel });
      saveAs(blob, isGeoMode ? "geo-content-pack.docx" : "copy-pack.docx");
    } catch (e) { console.error("DOCX download failed:", e); }
    finally { setDownloadingDocx(false); }
  };

  const buildMockupHtmlFile = (html: string | null) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${isGeoMode ? "GEO Mockup" : "Homepage Mockup"}${isWhiteLabel ? "" : " — ConversionDoc"}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;">
${html || ""}
</body>
</html>`;

  const handleDownloadKit = async () => {
    try {
      setDownloadingKit(true);
      const zip = new JSZip();
      const prefix = isGeoMode ? "geo" : "homepage";

      // PDF report (no "How to use this kit" page)
      try {
        const pdf = buildPdf({ isGeoMode, overallScore, auditData, topFixes, orderedScores, summary, purchaseUrl: purchase?.url, hasMockupB: !!mockupHtmlB, whiteLabel });
        zip.file(`${prefix}-audit-report.pdf`, await pdf.output("blob").arrayBuffer());
      } catch (e) { console.error("PDF for ZIP failed:", e); }

      // Copy pack / content pack docx
      const docxBlob = await buildDocx({ isGeoMode, copyPack, overallScore, summary, topFixes, purchaseUrl: purchase?.url, whiteLabel });
      zip.file(isGeoMode ? "geo-content-pack.docx" : "copy-pack.docx", await docxBlob.arrayBuffer());

      // Instructions docx (replaces the old "How to use this kit" PDF page)
      const instructionsBlob = await buildInstructionsDocx({
        isGeoMode,
        hasMockupB: !!mockupHtmlB,
        purchaseUrl: purchase?.url,
        whiteLabel,
      });
      zip.file("INSTRUCTIONS.docx", await instructionsBlob.arrayBuffer());

      // Mockup files
      if (mockupHtml) {
        zip.file(`${prefix}-mockup-a.html`, buildMockupHtmlFile(mockupHtml));
        try { const pngA = await generateMockupPng(mockupHtml); zip.file(`${prefix}-mockup-a.png`, pngA.split(",")[1], { base64: true }); } catch (e) { console.error("PNG A failed:", e); }
      }
      if (mockupHtmlB) {
        zip.file(`${prefix}-mockup-b.html`, buildMockupHtmlFile(mockupHtmlB));
        try { const pngB = await generateMockupPng(mockupHtmlB); zip.file(`${prefix}-mockup-b.png`, pngB.split(",")[1], { base64: true }); } catch (e) { console.error("PNG B failed:", e); }
      }

      saveAs(await zip.generateAsync({ type: "blob" }), `${isWhiteLabel ? "" : "conversiondoc-"}${prefix}-kit.zip`);
    } catch (e) { console.error("Kit download failed:", e); }
    finally { setDownloadingKit(false); }
  };

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
          <a href="/" className="inline-block mt-4 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold px-5 py-3 transition-colors text-sm">Back to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${pageBg} px-6 py-16`}>

      <EnquiryModal open={enquiryOpen} onClose={() => setEnquiryOpen(false)} isGeoMode={isGeoMode} prefillUrl={purchase.url} prefillEmail={undefined} purchaseId={purchase.id} />

      {screenshotUrl && !screenshotLoaded && !screenshotErrored && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 50, background: "rgba(15,23,42,0.85)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "8px 16px", borderRadius: 999, display: "flex", alignItems: "center", gap: 8, backdropFilter: "blur(8px)" }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #2dd4bf", borderTopColor: "transparent", animation: "cdSpin 0.8s linear infinite", flexShrink: 0 }} />
          Preparing screenshot…
          <style>{`@keyframes cdSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      <div className="mx-auto max-w-6xl space-y-8">

        {/* Header */}
        <section className="rounded-[32px] overflow-hidden border border-slate-900/10 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),_transparent_30%),linear-gradient(135deg,#020617,#0f172a_50%,#111827)] px-8 py-10 md:px-10 md:py-12">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-400">
                  {isGeoMode ? "Full GEO Audit" : "Full Diagnosis"}
                </p>
                <h1 className="mt-3 text-4xl md:text-5xl font-bold text-white tracking-tight">
                  {isGeoMode ? "AI Search Readiness Report" : "Conversion Report"}
                </h1>
                {auditData?.verdict && <p className="mt-4 text-lg text-slate-300 italic max-w-3xl">"{auditData.verdict}"</p>}
                {purchase.url && <a href={purchase.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-teal-400 text-sm hover:underline">{purchase.url} →</a>}
              </div>
              <div className="shrink-0 ml-6">
                {isWhiteLabel && whiteLabel?.logo ? (
                  <img src={whiteLabel.logo} alt="Logo" className="h-10 max-w-[160px] object-contain brightness-0 invert" />
                ) : (
                  <span className="text-sm font-bold text-teal-400 tracking-wide">ConversionDoc</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Executive Summary */}
        <section className={`rounded-[28px] border ${cardBg} p-6 md:p-8 shadow-sm`}>
          <div className="mb-6">
            <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${labelColor}`}>Executive Summary</p>
            <h2 className={`mt-2 text-3xl font-bold ${headingColor}`}>
              {isGeoMode ? "Your biggest opportunity to improve AI search visibility" : "Your strongest opportunity to improve conversions"}
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3 mb-6">
            {[
              { label: isGeoMode ? "GEO Readiness Score" : "Overall Score", value: overallScore !== null ? `${overallScore}/100` : "N/A", color: overallScore !== null && overallScore >= 70 ? "text-emerald-500" : overallScore !== null && overallScore >= 50 ? "text-amber-500" : "text-red-500" },
              { label: isGeoMode ? "Strongest Dimension" : "Strongest Pillar", value: summary.strongest_pillar ? prettyLabel(summary.strongest_pillar) : "N/A", color: headingColor },
              { label: isGeoMode ? "Weakest Dimension" : "Weakest Pillar", value: summary.weakest_pillar ? prettyLabel(summary.weakest_pillar) : "N/A", color: headingColor },
            ].map((card) => (
              <div key={card.label} className={`rounded-2xl border ${isDarkTheme ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"} p-5`}>
                <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>{card.label}</p>
                <p className={`mt-2 text-3xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>
          <div className={`rounded-2xl border ${isDarkTheme ? "border-teal-900 bg-teal-950/30" : "border-teal-100 bg-teal-50"} p-5 mb-4`}>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDarkTheme ? "text-teal-400" : "text-teal-700"} mb-2`}>{isGeoMode ? "Biggest GEO Opportunity" : "Biggest Opportunity"}</p>
            <p className={`font-medium text-lg ${headingColor}`}>{summary.biggest_opportunity || "No summary available."}</p>
          </div>
          <div className={`rounded-2xl border ${isDarkTheme ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"} p-5`}>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDarkTheme ? "text-slate-500" : "text-slate-500"} mb-2`}>Diagnosis</p>
            <p className={`leading-8 ${bodyColor}`}>{summary.executive_summary || "No executive summary available."}</p>
          </div>
        </section>

        {/* Top Fixes */}
        <section className={`rounded-[28px] border ${cardBg} p-6 md:p-8 shadow-sm`}>
          <div className="mb-6">
            <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${labelColor}`}>Action Plan</p>
            <h2 className={`mt-2 text-3xl font-bold ${headingColor}`}>{isGeoMode ? "🔍 Top AI Visibility Fixes" : "🔥 Top Priority Fixes"}</h2>
          </div>
          {topFixes ? (
            <div className="space-y-4">
              {topFixes.map((x, idx) => {
                const color = impactColor[x.impact || "Medium"] || "#f59e0b";
                const bg = impactBg[x.impact || "Medium"] || impactBg["Medium"];
                return (
                  <div key={idx} className="flex gap-4 rounded-2xl border p-5" style={{ borderColor: `${color}25`, borderLeftWidth: 4, borderLeftColor: color, background: bg }}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold shadow-sm" style={{ background: color }}>{x.priority ?? idx + 1}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border" style={{ color, background: `${color}15`, borderColor: `${color}30` }}>{x.impact ?? "—"} Impact</span>
                      </div>
                      {x.issue && <p className={`font-semibold mb-1 ${headingColor}`}>{x.issue}</p>}
                      <div className="flex items-start gap-1.5">
                        <span className="text-teal-500 font-bold text-sm shrink-0">→</span>
                        <p className={`text-sm ${bodyColor}`}>{x.fix}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className={bodyColor}>No fixes available.</p>}
        </section>

        {/* Score Breakdown */}
        <section className={`rounded-[28px] border ${cardBg} p-6 md:p-8 shadow-sm`}>
          <div className="mb-6">
            <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${labelColor}`}>Full Analysis</p>
            <h2 className={`mt-2 text-3xl font-bold ${headingColor}`}>{isGeoMode ? "📊 GEO Dimension Breakdown" : "📊 Score Breakdown"}</h2>
          </div>
          {orderedScores.length === 0 ? <p className={bodyColor}>No score data available.</p> : (
            <div className="space-y-5">
              {orderedScores.map(([pillar, value]) => (
                <div key={pillar} className={`rounded-2xl border ${isDarkTheme ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"} p-5`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-xl font-semibold ${headingColor}`}>{prettyLabel(pillar)}</h3>
                    <span className={`text-xl font-bold ${scoreColor(value?.score)}`}>{typeof value?.score === "number" ? `${value.score}/10` : "—"}</span>
                  </div>
                  {value?.issue && <div className="mb-3"><p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDarkTheme ? "text-slate-500" : "text-slate-400"} mb-1`}>Issue</p><p className={isDarkTheme ? "text-slate-300" : "text-slate-800"}>{value.issue}</p></div>}
                  {value?.fix && <div className="mb-3"><p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDarkTheme ? "text-slate-500" : "text-slate-400"} mb-1`}>Recommended Fix</p><p className={isDarkTheme ? "text-slate-300" : "text-slate-800"}>{value.fix}</p></div>}
                  {value?.rewritten_copy && <div><p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${labelColor} mb-1`}>{isGeoMode ? "Rewritten Content" : "Rewritten Copy"}</p><p className={`italic ${isDarkTheme ? "text-slate-300" : "text-slate-800"}`}>{value.rewritten_copy}</p></div>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Copy Pack */}
        <section className={`rounded-[28px] border ${cardBg} p-6 md:p-8 shadow-sm`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${labelColor}`}>Deliverable</p>
              <h2 className={`mt-2 text-3xl font-bold ${headingColor}`}>{isGeoMode ? "✍️ Content Pack" : "✍️ Copy Pack"}</h2>
              <p className={`text-sm mt-2 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>{isGeoMode ? "Page-ready content written for AI extractability, clarity, and conversion." : "Homepage-ready copy written to improve clarity, trust, and action."}</p>
            </div>
            <button onClick={handleDownloadDocx} disabled={downloadingDocx} className={`rounded-xl border font-semibold px-5 py-3 transition-colors text-sm shadow-sm disabled:opacity-50 ${isDarkTheme ? "border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"}`}>
              {downloadingDocx ? "Generating…" : isGeoMode ? "Download Content Pack (.docx)" : "Download Copy Pack (.docx)"}
            </button>
          </div>
          <div className="space-y-4">
            <div className={`rounded-2xl border p-5 ${isDarkTheme ? "border-teal-900 bg-teal-950/30" : "border-teal-100 bg-teal-50"}`}>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDarkTheme ? "text-teal-400" : "text-teal-700"} mb-2`}>Headline</p>
              <p className={`text-2xl font-semibold ${headingColor}`}>{copyPack.headline || "N/A"}</p>
            </div>
            <div className={`rounded-2xl border p-5 ${isDarkTheme ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDarkTheme ? "text-slate-500" : "text-slate-500"} mb-2`}>Subheadline</p>
              <p className={isDarkTheme ? "text-slate-300" : "text-slate-800"}>{copyPack.subheadline || "N/A"}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {["primary_cta", "trust_line"].map((field) => (
                <div key={field} className={`rounded-2xl border p-5 ${isDarkTheme ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDarkTheme ? "text-slate-500" : "text-slate-500"} mb-2`}>{field === "primary_cta" ? "Primary CTA" : "Trust Line"}</p>
                  <p className={`font-medium ${headingColor}`}>{(copyPack as any)[field] || "N/A"}</p>
                </div>
              ))}
            </div>
            <div className={`rounded-2xl border p-5 ${isDarkTheme ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDarkTheme ? "text-slate-500" : "text-slate-500"} mb-3`}>{isGeoMode ? "Key Points" : "Benefit Bullets"}</p>
              <ul className="space-y-3">
                {(copyPack.benefit_bullets || []).map((bullet, i) => (
                  <li key={i} className="flex gap-3"><span className="text-teal-500 font-bold">✓</span><span className={isDarkTheme ? "text-slate-300" : "text-slate-800"}>{bullet}</span></li>
                ))}
              </ul>
            </div>
            {copyPack.supporting_copy && (
              <div className={`rounded-2xl border p-5 ${isDarkTheme ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDarkTheme ? "text-slate-500" : "text-slate-500"} mb-2`}>Supporting Copy</p>
                <p className={isDarkTheme ? "text-slate-300" : "text-slate-800"}>{copyPack.supporting_copy}</p>
              </div>
            )}
          </div>
        </section>

        {/* Visual Deliverable */}
        <section className={`rounded-[28px] border ${isDarkTheme ? "border-slate-800" : "border-slate-200"} shadow-sm overflow-hidden`}>
          <div className="bg-[linear-gradient(135deg,#020617,#0f172a)] px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-400">Visual Deliverable</p>
            <h2 className="mt-2 text-2xl font-bold text-white">{isGeoMode ? "🎨 Your Restructured Page Mockup" : "🎨 Your Homepage Mockup"}</h2>
            <p className="text-slate-400 text-sm mt-2">{isGeoMode ? "Compare your current page with a GEO-optimised direction." : "Compare your current site with a more conversion-focused direction."}</p>
          </div>

          <div className={`flex border-b ${isDarkTheme ? "border-slate-800" : "border-slate-200"}`}>
            <button onClick={() => setActiveTab("before")} className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === "before" ? `${isDarkTheme ? "bg-slate-900" : "bg-white"} text-red-500 border-b-2 border-red-500` : `${isDarkTheme ? "bg-slate-950 text-slate-500" : "bg-slate-50 text-slate-500"} hover:text-slate-400`}`}>❌ Before (Current Page)</button>
            <button onClick={() => setActiveTab("after")} className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === "after" ? `${isDarkTheme ? "bg-slate-900" : "bg-white"} text-teal-500 border-b-2 border-teal-500` : `${isDarkTheme ? "bg-slate-950 text-slate-500" : "bg-slate-50 text-slate-500"} hover:text-slate-400`}`}>{isGeoMode ? "✅ After (GEO Fix)" : "✅ After (ConversionDoc Fix)"}</button>
          </div>

          <div style={{ display: activeTab === "before" ? "block" : "none" }}>
            {displayScreenshotUrl && (
              <div style={{ background: "#0f172a", position: "relative" }}>
                {!screenshotLoaded && !screenshotErrored && (
                  <div style={{ minHeight: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", border: "4px solid #2dd4bf", borderTopColor: "transparent", animation: "cdSpin 0.8s linear infinite" }} />
                    <p style={{ color: "#94a3b8", fontSize: 14, fontWeight: 500, margin: 0 }}>Loading screenshot…</p>
                  </div>
                )}
                {screenshotLoaded && (
                  <div style={{ position: "relative", width: "100%" }}>
                    <img src={displayScreenshotUrl} alt="Current page screenshot" style={{ width: "100%", display: "block", maxHeight: 600, objectFit: "cover", objectPosition: "top" }} />
                    {purchase.url && <a href={purchase.url} target="_blank" rel="noopener noreferrer" style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "6px 12px", borderRadius: 8, textDecoration: "none", border: "1px solid rgba(255,255,255,0.15)" }}>View Live Page →</a>}
                  </div>
                )}
                <style>{`@keyframes cdSpin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
            {topFixes && topFixes.length > 0 && (
              <div className={`p-6 space-y-3 ${isDarkTheme ? "bg-slate-900" : "bg-slate-50"}`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${isDarkTheme ? "text-slate-500" : "text-slate-500"}`}>{isGeoMode ? "AI Visibility Issues on Current Page" : "Issues Identified on Current Site"}</p>
                {topFixes.map((fix, i) => {
                  const color = impactColor[fix.impact || "Medium"] || "#f59e0b";
                  const bg = impactBg[fix.impact || "Medium"] || impactBg["Medium"];
                  return (
                    <div key={i} className={`rounded-2xl border p-5 flex gap-4 ${isDarkTheme ? "bg-slate-800" : "bg-white"}`} style={{ borderColor: `${color}30`, borderLeftWidth: 4, borderLeftColor: color }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: color }}>{fix.priority ?? i + 1}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-2"><span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border" style={{ color, background: bg, borderColor: `${color}30` }}>{fix.impact} Impact</span></div>
                        <p className={`font-semibold text-sm mb-1 leading-snug ${headingColor}`}>{fix.issue}</p>
                        <div className="flex items-start gap-1.5"><span className="text-teal-500 text-xs font-bold shrink-0 mt-0.5">→</span><p className={`text-xs leading-relaxed ${bodyColor}`}>{fix.fix}</p></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: activeTab === "after" ? "block" : "none" }}>
            {mockupHtml ? (
              <div className={isDarkTheme ? "bg-slate-900" : "bg-white"}>
                <div className={`flex items-center gap-2 px-6 pt-4 pb-0 border-b ${isDarkTheme ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                  <button onClick={() => setMockupVersion("a")} className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors border-b-2 -mb-px ${mockupVersion === "a" ? `${isDarkTheme ? "bg-slate-900" : "bg-white"} text-teal-500 border-teal-500 shadow-sm` : "bg-transparent text-slate-500 border-transparent hover:text-slate-400"}`}>★ Version A</button>
                  {mockupHtmlB && <button onClick={() => setMockupVersion("b")} className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors border-b-2 -mb-px ${mockupVersion === "b" ? `${isDarkTheme ? "bg-slate-900" : "bg-white"} text-teal-500 border-teal-500 shadow-sm` : "bg-transparent text-slate-500 border-transparent hover:text-slate-400"}`}>Version B</button>}
                  <span className={`ml-auto text-xs pb-2 ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>{mockupVersion === "a" ? "Recommended layout" : "Alternative layout"}</span>
                </div>
                <div className="relative">
                  <div ref={mockupRef} className="w-full overflow-hidden" dangerouslySetInnerHTML={{ __html: activeMockupHtml || "" }} />
                  <button onClick={() => setFullscreen(true)} className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">⛶ Fullscreen</button>
                </div>
              </div>
            ) : (
              <div className={`flex items-center justify-center min-h-[400px] ${isDarkTheme ? "bg-slate-900" : "bg-slate-50"}`}><p className="text-slate-400">Mockup not available</p></div>
            )}
          </div>

          <div className={`px-6 py-4 border-t flex flex-wrap gap-3 ${isDarkTheme ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
            {mockupHtml && (
              <>
                <button onClick={handleCopyCode} className="rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold px-5 py-3 transition-colors text-sm shadow-sm">{copySuccess ? "✓ Copied!" : "Copy HTML"}</button>
                <button onClick={handleDownloadPng} disabled={downloading} className={`rounded-xl border font-semibold px-5 py-3 transition-colors text-sm shadow-sm disabled:opacity-50 ${isDarkTheme ? "border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200" : "border-slate-200 bg-white hover:bg-slate-100 text-slate-700"}`}>{downloading ? "Generating…" : "Download PNG"}</button>
                <button onClick={handleDownloadPdf} disabled={downloadingPdf} className={`rounded-xl border font-semibold px-5 py-3 transition-colors text-sm shadow-sm disabled:opacity-50 ${isDarkTheme ? "border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200" : "border-slate-200 bg-white hover:bg-slate-100 text-slate-700"}`}>{downloadingPdf ? "Generating PDF…" : "Download Report PDF"}</button>
                <button onClick={handleDownloadKit} disabled={downloadingKit} className={`rounded-xl font-semibold px-5 py-3 transition-colors text-sm shadow-sm disabled:opacity-50 ${isDarkTheme ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-900 hover:bg-black text-white"}`}>{downloadingKit ? "Building Kit…" : isGeoMode ? "Download GEO Kit (.zip)" : "Download Homepage Kit (.zip)"}</button>
              </>
            )}
            {purchase.url && <a href={purchase.url} target="_blank" rel="noopener noreferrer" className={`rounded-xl border font-semibold px-5 py-3 transition-colors text-sm shadow-sm ${isDarkTheme ? "border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200" : "border-slate-200 bg-white hover:bg-slate-100 text-slate-700"}`}>{isGeoMode ? "View Current Page →" : "View Current Site →"}</a>}
          </div>
        </section>

        {/* Next Step — only show for one-off purchases, not white label subscribers */}
        {!isWhiteLabel && (
          <section className={`rounded-[28px] border ${cardBg} p-6 md:p-8 shadow-sm`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${labelColor} mb-2`}>Next Step</p>
            <h2 className={`text-3xl font-bold ${headingColor} mb-3`}>
              {isGeoMode ? "Need help implementing your GEO fixes?" : "Need help implementing these recommendations?"}
            </h2>
            <p className={`mb-6 max-w-3xl leading-7 ${bodyColor}`}>
              {isGeoMode
                ? "If you'd like expert help applying your GEO fixes — from content restructuring to full page implementation — tell us what you need and we'll come back to you within 1–2 business days."
                : "If you'd like expert help putting these fixes into action — from copy rewrites to full page redesigns — tell us what you need and we'll come back to you within 1–2 business days."}
            </p>
            <button onClick={() => setEnquiryOpen(true)} className="rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold px-6 py-3 transition-colors text-sm shadow-sm">
              Get Implementation Help →
            </button>
          </section>
        )}

      </div>

      {fullscreen && activeMockupHtml && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={() => setFullscreen(false)}>
          <div className="flex items-center justify-between px-6 py-4 bg-slate-950 shrink-0" onClick={(e) => e.stopPropagation()}>
            <p className="text-white font-semibold">{isGeoMode ? "✅ GEO-Optimised Direction" : "✅ Improved Direction"} — {mockupVersion === "a" ? "Version A (Recommended)" : "Version B (Alternative)"}</p>
            <button onClick={() => setFullscreen(false)} className="text-slate-400 hover:text-white text-2xl leading-none">✕</button>
          </div>
          <div className="flex-1 overflow-auto bg-white" onClick={(e) => e.stopPropagation()}>
            <div dangerouslySetInnerHTML={{ __html: activeMockupHtml }} />
          </div>
        </div>
      )}
    </div>
  );
}
