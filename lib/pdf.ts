// ═══════════════════════════════════════════════════════════════════════════
// OLTEE — PDF Report Builder
//
// Generates professional downloadable PDF reports using jsPDF.
// All rendering runs client-side in the browser — no server required.
//
// Document structure (pages):
//   1.  Cover          — OLTEE brand, status, date, report ID, attribution
//   2.  Decision       — Banner equivalent: status, L*, debt ratio, headroom
//   3.  Inputs         — All 7 user inputs in a formatted table
//   4.  Equation       — 9-step calculation walkthrough table
//   5.  Scores         — 4 financial intelligence scores
//   6.  Executive summary (if AI insights available)
//   7.  Risk + Analysis (if AI insights available)
//   8.  Strengths/Weaknesses + Recommendations (if AI insights available)
//   9.  Scenarios      (if scenarios available and opted in)
//   10. Monte Carlo    (if MC results available and opted in)
//   11. Disclaimer     — "Not financial advice" footer page
//
// Design principles:
//   - Dark colors stripped to accessible black/gray on white paper
//   - Status colors preserved as accent bars and section headers
//   - Monospace font (Courier) for all equation and numeric values
//   - Every page has a consistent header band and footer with page number
//
// Author: Faisal Alghamdi
// ═══════════════════════════════════════════════════════════════════════════

import type {
  PDFReportData,
  LeverageStatus,
  OLTEEInputs,
  OLTEEOutputs,
  EquationStep,
  FinancialScores,
  AIInsights,
  ScenarioResult,
  MonteCarloResult,
} from "@/types/oltee";
import { APP } from "@/config/constants";

// ─── Section toggle interface ─────────────────────────────────────────────────

export interface ReportSections {
  executiveSummary:    boolean;
  inputSummary:        boolean;
  equationWalkthrough: boolean;
  financialScores:     boolean;
  aiRecommendations:   boolean;
  scenarioComparison:  boolean;
  monteCarlo:          boolean;
}

export const DEFAULT_SECTIONS: ReportSections = {
  executiveSummary:    true,
  inputSummary:        true,
  equationWalkthrough: true,
  financialScores:     true,
  aiRecommendations:   true,
  scenarioComparison:  false,
  monteCarlo:          false,
};

export function estimatePageCount(data: PDFReportData, sections: ReportSections): number {
  let pages = 2; // Cover + Decision always included
  if (sections.inputSummary)        pages += 1;
  if (sections.equationWalkthrough) pages += 1;
  if (sections.financialScores)     pages += 1;
  if (sections.executiveSummary && data.insights)    pages += 1;
  if (data.insights?.riskAssessment)                 pages += 1;
  if (sections.aiRecommendations && data.insights)   pages += 1;
  if (sections.scenarioComparison && data.scenarios) pages += 1;
  if (sections.monteCarlo && data.monteCarlo)        pages += 1;
  pages += 1; // Disclaimer always last
  return pages;
}

// ─── Color palette (print-friendly) ──────────────────────────────────────────

type RGB = [number, number, number];

const COLORS = {
  // Surfaces — dark scheme translated to print
  white:      [255, 255, 255] as RGB,
  pageGray:   [252, 252, 254] as RGB,
  lightGray:  [245, 246, 250] as RGB,
  midGray:    [160, 170, 188] as RGB,
  border:     [220, 224, 235] as RGB,
  text:       [15,  22,  48 ] as RGB,
  textSec:    [90,  100, 130] as RGB,
  textTer:    [150, 160, 180] as RGB,

  // Brand
  teal:       [0,   155, 130] as RGB,  // print-safe teal (darker than screen)
  tealLight:  [220, 247, 240] as RGB,

  // Status (print-safe, legible on white)
  optimal:    [21,  128, 61 ] as RGB,
  optLight:   [220, 252, 231] as RGB,
  caution:    [161, 98,  7  ] as RGB,
  cauLight:   [254, 243, 199] as RGB,
  suboptimal: [185, 28,  28 ] as RGB,
  subLight:   [254, 226, 226] as RGB,
  negspread:  [190, 18,  60 ] as RGB,
  negLight:   [255, 228, 230] as RGB,
};

const STATUS_COLOR: Record<LeverageStatus, { text: RGB; light: RGB; label: string }> = {
  OPTIMAL:    { text: COLORS.optimal,    light: COLORS.optLight,  label: "OPTIMAL"         },
  CAUTION:    { text: COLORS.caution,    light: COLORS.cauLight,  label: "CAUTION"         },
  SUBOPTIMAL: { text: COLORS.suboptimal, light: COLORS.subLight,  label: "SUBOPTIMAL"      },
  NEG_SPREAD: { text: COLORS.negspread,  light: COLORS.negLight,  label: "NEGATIVE SPREAD" },
};

const STATUS_MESSAGES: Record<LeverageStatus, string> = {
  OPTIMAL:    "Your leverage is in the productive zone. Debt is working for you.",
  CAUTION:    "You are approaching the limit. Avoid additional borrowing.",
  SUBOPTIMAL: "Debt has exceeded the safe threshold. Consult a financial advisor.",
  NEG_SPREAD: "Your investment return is below your loan cost. Borrowing destroys value.",
};

// ─── Formatting helpers ───────────────────────────────────────────────────────

const pct = (v: number, d = 1) => (v * 100).toFixed(d) + "%";
const sar = (v: number) => "SAR " + Math.round(v).toLocaleString("en");
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

// ─── jsPDF page layout constants ──────────────────────────────────────────────

const PAGE_W   = 210;  // mm, A4 width
const PAGE_H   = 297;  // mm, A4 height
const MARGIN_X = 20;   // mm left/right margin
const MARGIN_Y = 24;   // mm top margin (below header band)
const CONTENT_W = PAGE_W - MARGIN_X * 2;  // 170mm
const HEADER_H  = 14;  // mm header band height
const FOOTER_H  = 12;  // mm footer band height
const CONTENT_H = PAGE_H - MARGIN_Y - FOOTER_H - 8; // usable height

// ─── Core PDF builder ─────────────────────────────────────────────────────────

export async function generatePDFReport(
  data: PDFReportData,
  sections: ReportSections = DEFAULT_SECTIONS
): Promise<Blob> {
  // Dynamic import — jsPDF is a large library, only load when needed
  // jsPDF v4 changed its export shape. This handles both v3 (named) and v4 (default).
  const jspdfMod = await import("jspdf");
  const jsPDF = (jspdfMod as any).jsPDF ?? (jspdfMod as any).default?.jsPDF ?? (jspdfMod as any).default;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  let pageNumber = 0;
  const totalPages = estimatePageCount(data, sections);

  // ── Helper: start a new page with standard header + footer ──────────────────
  const newPage = (title: string) => {
    if (pageNumber > 0) doc.addPage();
    pageNumber++;

    // Header band
    doc.setFillColor(...COLORS.teal);
    doc.rect(0, 0, PAGE_W, HEADER_H, "F");
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("OLTEE — Optimal Leverage Threshold Engine", MARGIN_X, 9);
    doc.setFont("helvetica", "normal");
    doc.text(title.toUpperCase(), PAGE_W - MARGIN_X, 9, { align: "right" });

    // Footer band
    doc.setFillColor(...COLORS.lightGray);
    doc.rect(0, PAGE_H - FOOTER_H, PAGE_W, FOOTER_H, "F");
    doc.setTextColor(...COLORS.textTer);
    doc.setFontSize(7);
    doc.text(`Prepared by ${APP.engineer} · ${APP.name} v${APP.version}`, MARGIN_X, PAGE_H - 4);
    doc.text(`Page ${pageNumber} of ${totalPages}`, PAGE_W - MARGIN_X, PAGE_H - 4, { align: "right" });

    return MARGIN_Y; // return starting Y for content
  };

  // ── Helper: section heading ─────────────────────────────────────────────────
  const sectionHeading = (doc: InstanceType<typeof jsPDF>, y: number, text: string): number => {
    doc.setFillColor(...COLORS.lightGray);
    doc.rect(MARGIN_X, y, CONTENT_W, 7, "F");
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(text.toUpperCase(), MARGIN_X + 3, y + 5);
    doc.setFont("helvetica", "normal");
    return y + 10;
  };

  // ── Helper: text block with auto-wrap ──────────────────────────────────────
  const textBlock = (
    doc: InstanceType<typeof jsPDF>,
    y: number,
    text: string,
    options: { fontSize?: number; color?: RGB; maxWidth?: number; bold?: boolean } = {}
  ): number => {
    const { fontSize = 10, color = COLORS.textSec, maxWidth = CONTENT_W, bold = false } = options;
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, MARGIN_X, y);
    return y + lines.length * (fontSize * 0.45) + 2;
  };

  // ── Helper: table ─────────────────────────────────────────────────────────
  const drawTable = (
    doc: InstanceType<typeof jsPDF>,
    y: number,
    headers: string[],
    rows: string[][],
    colWidths: number[],
    options: { headerBg?: RGB; altRow?: boolean } = {}
  ): number => {
    const { headerBg = COLORS.teal, altRow = true } = options;
    const rowH  = 7.5;
    const PAD   = 2;   // left padding inside each cell
    const FONT  = 7.5; // smaller font prevents overflow on narrow columns

    // Compute x offsets for each column
    const colX: number[] = [];
    let xOff = MARGIN_X;
    for (const w of colWidths) { colX.push(xOff); xOff += w; }

    // Helper: truncate text to fit column width
    const clipText = (text: string, maxW: number): string => {
      if (!text) return "";
      const w = doc.getStringUnitWidth(text) * FONT * 0.352; // approx mm
      if (w <= maxW - PAD * 2) return text;
      // Trim one char at a time until it fits + "…"
      let t = text;
      while (t.length > 1) {
        t = t.slice(0, -1);
        const tw = doc.getStringUnitWidth(t + "…") * FONT * 0.352;
        if (tw <= maxW - PAD * 2) return t + "…";
      }
      return text[0] ?? "";
    };

    // Header row
    doc.setFillColor(...headerBg);
    doc.rect(MARGIN_X, y, CONTENT_W, rowH, "F");
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(FONT);
    doc.setFont("helvetica", "bold");
    headers.forEach((h, i) => {
      doc.text(clipText(h, colWidths[i] ?? 20), colX[i]! + PAD, y + 5.2);
    });
    y += rowH;

    // Data rows
    rows.forEach((row, ri) => {
      if (altRow && ri % 2 === 1) {
        doc.setFillColor(...COLORS.lightGray);
        doc.rect(MARGIN_X, y, CONTENT_W, rowH, "F");
      }
      doc.setDrawColor(...COLORS.border);
      doc.line(MARGIN_X, y + rowH, MARGIN_X + CONTENT_W, y + rowH);

      doc.setFontSize(FONT);
      row.forEach((cell, ci) => {
        const isLast = ci === row.length - 1;
        const cw     = colWidths[ci] ?? 20;
        const cx_    = colX[ci] ?? MARGIN_X;
        if (isLast) {
          // Last column: right-aligned, teal monospace
          doc.setFont("courier", "bold");
          doc.setTextColor(...COLORS.teal);
          doc.text(
            clipText(cell, cw),
            cx_ + cw - PAD,
            y + 5.2,
            { align: "right" }
          );
        } else {
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...COLORS.text);
          doc.text(clipText(cell, cw), cx_ + PAD, y + 5.2);
        }
      });
      y += rowH;
    });

    return y + 3;
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER
  // ══════════════════════════════════════════════════════════════════════════

  {
    let y = newPage("Cover");
    const sc = STATUS_COLOR[data.outputs.status];

    // Large OLTEE logotype
    doc.setFontSize(48);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.teal);
    doc.text("OLTEE", PAGE_W / 2, 70, { align: "center" });

    doc.setFontSize(13);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.textSec);
    doc.text("Optimal Leverage Threshold Engine", PAGE_W / 2, 82, { align: "center" });

    // Horizontal rule
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.5);
    doc.line(MARGIN_X + 30, 90, PAGE_W - MARGIN_X - 30, 90);

    // Status badge block
    const badgeY = 100;
    doc.setFillColor(...sc.light);
    doc.roundedRect(PAGE_W / 2 - 35, badgeY, 70, 16, 3, 3, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...sc.text);
    doc.text(sc.label, PAGE_W / 2, badgeY + 11, { align: "center" });

    // Status message
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.textSec);
    const msgLines = doc.splitTextToSize(STATUS_MESSAGES[data.outputs.status], CONTENT_W - 40);
    doc.text(msgLines, PAGE_W / 2, 125, { align: "center" });

    // Key metrics block
    const metricsY = 148;
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(MARGIN_X + 10, metricsY, CONTENT_W - 20, 38, 3, 3, "F");
    const metrics = [
      { label: "Current debt ratio", value: pct(data.outputs.debt_ratio) },
      { label: "Safe ceiling L*",    value: pct(data.outputs.L_star) },
      { label: "Headroom remaining", value: sar(data.outputs.headroom_SAR) },
    ];
    metrics.forEach(({ label, value }, i) => {
      const colX = MARGIN_X + 10 + (i * (CONTENT_W - 20) / 3) + 8;
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.textTer);
      doc.setFont("helvetica", "normal");
      doc.text(label.toUpperCase(), colX, metricsY + 10);
      doc.setFontSize(14);
      doc.setFont("courier", "bold");
      doc.setTextColor(i === 1 ? COLORS.teal[0] : sc.text[0], i === 1 ? COLORS.teal[1] : sc.text[1], i === 1 ? COLORS.teal[2] : sc.text[2]);
      doc.text(value, colX, metricsY + 22);
    });

    // Metadata
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.textTer);
    doc.text(`Report ID: OLTEE-${data.metadata.reportId.slice(0, 8).toUpperCase()}`, PAGE_W / 2, 210, { align: "center" });
    doc.text(`Generated: ${fmtDate(data.metadata.generatedAt)}`, PAGE_W / 2, 218, { align: "center" });
    doc.text(`Prepared by ${APP.engineer}`, PAGE_W / 2, 226, { align: "center" });

    // Table of contents
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.text);
    doc.text("Report Contents", MARGIN_X + 20, 244);
    const tocItems = [
      ["Decision result", true],
      ["Input summary", sections.inputSummary],
      ["Equation walkthrough", sections.equationWalkthrough],
      ["Financial scores", sections.financialScores],
      ["AI executive summary", sections.executiveSummary && !!data.insights],
      ["AI risk analysis", !!data.insights],
      ["AI recommendations", sections.aiRecommendations && !!data.insights],
      ["Scenario comparison", sections.scenarioComparison && !!data.scenarios],
      ["Monte Carlo analysis", sections.monteCarlo && !!data.monteCarlo],
      ["Disclaimer", true],
    ] as [string, boolean][];

    let tocN = 1;
    tocItems.forEach(([item, included]) => {
      const tocY = 250 + (tocItems.indexOf([item, included] as [string, boolean])) * 4;
      doc.setFontSize(8.5);
      doc.setFont("helvetica", included ? "normal" : "normal");
      doc.setTextColor(...(included ? COLORS.textSec : COLORS.textTer));
      doc.text(`${included ? tocN.toString().padStart(2, "0") : "—"}  ${item}`, MARGIN_X + 20, tocY);
      if (included) tocN++;
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 2 — DECISION RESULT
  // ══════════════════════════════════════════════════════════════════════════

  {
    let y = newPage("Decision Result");
    const sc = STATUS_COLOR[data.outputs.status];

    // Status banner
    doc.setFillColor(...sc.light);
    doc.rect(MARGIN_X, y, CONTENT_W, 18, "F");
    doc.setDrawColor(...sc.text);
    doc.setLineWidth(2);
    doc.line(MARGIN_X, y, MARGIN_X, y + 18);
    doc.setLineWidth(0.3);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...sc.text);
    doc.text(sc.label, MARGIN_X + 6, y + 8);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(STATUS_MESSAGES[data.outputs.status], MARGIN_X + 6, y + 15);
    y += 24;

    // Three KPI boxes
    const boxW = (CONTENT_W - 8) / 3;
    const boxes = [
      { label: "CURRENT DEBT RATIO",   value: pct(data.outputs.debt_ratio),      color: sc.text },
      { label: "SAFE CEILING (L*)",     value: pct(data.outputs.L_star),          color: COLORS.teal },
      { label: "REMAINING HEADROOM",   value: sar(data.outputs.headroom_SAR),     color: data.outputs.headroom_SAR > 0 ? COLORS.optimal : COLORS.suboptimal },
    ];
    boxes.forEach(({ label, value, color }, i) => {
      const bx = MARGIN_X + i * (boxW + 4);
      doc.setFillColor(...COLORS.lightGray);
      doc.roundedRect(bx, y, boxW, 24, 2, 2, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.textTer);
      doc.text(label, bx + 4, y + 7);
      doc.setFontSize(14);
      doc.setFont("courier", "bold");
      doc.setTextColor(...color);
      doc.text(value, bx + 4, y + 19);
    });
    y += 32;

    // Formula context
    y = sectionHeading(doc, y, "OLTEE Formula Result");
    doc.setFontSize(8.5);
    doc.setFont("courier", "normal");
    doc.setTextColor(...COLORS.textSec);
    const formulaLines = [
      `Return Spread (Δ = ROI − r):  ${(data.outputs.intermediates.delta > 0 ? "+" : "") + pct(data.outputs.intermediates.delta, 2)}   ${data.outputs.intermediates.delta > 0 ? "Borrowing is profitable" : "NEGATIVE — borrowing destroys value"}`,
      `Tax Efficiency (α = 1 − T):   ${data.outputs.intermediates.alpha.toFixed(3)}`,
      `Risk Coefficient (β = 1+σ×0.5): ${data.outputs.intermediates.beta.toFixed(3)}`,
      `L* (raw, before cap):         ${data.outputs.intermediates.L_raw.toFixed(4)}`,
      `L* (final, after 70% cap):    ${pct(data.outputs.L_star, 1)}   ${data.outputs.cap_applied ? "← regulatory cap applied" : "← below cap"}`,
    ];
    formulaLines.forEach((line) => {
      doc.text(line, MARGIN_X + 2, y);
      y += 5.5;
    });
    y += 4;

    // Cap note if applicable
    if (data.outputs.cap_applied) {
      doc.setFillColor(...COLORS.tealLight);
      doc.rect(MARGIN_X, y, CONTENT_W, 10, "F");
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.teal);
      doc.setFont("helvetica", "italic");
      doc.text(
        "The regulatory 70% hard cap was applied. The formula's raw result exceeded international banking norms.",
        MARGIN_X + 3, y + 6.5
      );
      y += 15;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 3 — INPUT SUMMARY (optional)
  // ══════════════════════════════════════════════════════════════════════════

  if (sections.inputSummary) {
    let y = newPage("Input Summary");
    y = sectionHeading(doc, y, "Your Input Values");

    const inp = data.inputs;
    const inputRows: string[][] = [
      ["Annual return on investment (ROI)",    pct(inp.ROI, 2)],
      ["Annual interest / profit rate (r)",   pct(inp.r, 2)],
      ["Effective tax rate (T)",              pct(inp.T, 1)],
      ["Income volatility (σ)",               inp.sigma.toFixed(2)],
      ["Cash flow coverage ratio",            inp.CF_ratio.toFixed(2) + "×"],
      ["Total debt (D)",                      sar(inp.D)],
      ["Total assets (A)",                    sar(inp.A)],
    ];
    y = drawTable(doc, y, ["Input", "Value"], inputRows, [125, 45]);
    y += 8;

    // Computed ratios
    y = sectionHeading(doc, y, "Computed Intermediate Values");
    const compRows: string[][] = [
      ["Debt-to-asset ratio",       pct(data.outputs.debt_ratio)],
      ["Return spread Δ (ROI − r)", (data.outputs.intermediates.delta > 0 ? "+" : "") + pct(data.outputs.intermediates.delta, 2)],
      ["Tax efficiency α (1 − T)",  data.outputs.intermediates.alpha.toFixed(3)],
      ["Risk coefficient β",        data.outputs.intermediates.beta.toFixed(3)],
      ["Numerator (Δ × α)",         data.outputs.intermediates.numerator.toFixed(5)],
      ["Denominator (r × β × 1/CF)",data.outputs.intermediates.denominator.toFixed(5)],
    ];
    y = drawTable(doc, y, ["Metric", "Value"], compRows, [125, 45]);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 4 — EQUATION WALKTHROUGH (optional)
  // ══════════════════════════════════════════════════════════════════════════

  if (sections.equationWalkthrough) {
    let y = newPage("Equation Walkthrough");
    y = sectionHeading(doc, y, "9-Step OLTEE Calculation");

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.textTer);
    doc.text("L* = [ (ROI − r) × (1 − T) ] ÷ [ r × (1 + σ × 0.5) × (1 / CF) ]", MARGIN_X, y);
    doc.text("subject to: L* = min(L*_computed, 0.70)", MARGIN_X, y + 5);
    y += 14;

    const stepRows = data.equationSteps.map((s) => [
      String(s.step),
      s.label,
      s.formula,
      s.calculation,
      s.resultFormatted,
    ]);
    y = drawTable(
      doc, y,
      ["#", "Step", "Formula", "Calculation", "Result"],
      stepRows,
      [8, 36, 30, 66, 30],  // widths sum to 170 = CONTENT_W
      { headerBg: COLORS.teal, altRow: true }
    );
    y += 4;

    // Highlight the final answer
    const sc = STATUS_COLOR[data.outputs.status];
    doc.setFillColor(...sc.light);
    doc.rect(MARGIN_X, y, CONTENT_W, 14, "F");
    doc.setDrawColor(...sc.text);
    doc.setLineWidth(1.5);
    doc.line(MARGIN_X, y, MARGIN_X, y + 14);
    doc.setLineWidth(0.3);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...sc.text);
    doc.text(`Result: ${sc.label} — Debt ratio ${pct(data.outputs.debt_ratio)} vs L* ${pct(data.outputs.L_star)}`, MARGIN_X + 5, y + 9);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 5 — FINANCIAL INTELLIGENCE SCORES (optional)
  // ══════════════════════════════════════════════════════════════════════════

  if (sections.financialScores) {
    let y = newPage("Financial Intelligence Scores");
    y = sectionHeading(doc, y, "Four Intelligence Scores (0–100)");

    const scoreColor = (s: number): RGB =>
      s >= 70 ? COLORS.optimal : s >= 40 ? COLORS.caution : COLORS.suboptimal;
    const scoreLabel = (key: keyof typeof data.scores, s: number): string => {
      const map: Record<string, [number, string][]> = {
        stability:  [[80,"STABLE"],[50,"MODERATE"],[0,"AT RISK"]],
        debtHealth: [[80,"HEALTHY"],[50,"FAIR"],[0,"POOR"]],
        efficiency: [[75,"OPTIMAL"],[45,"PARTIAL"],[0,"LOW"]],
        resilience: [[75,"RESILIENT"],[45,"MODERATE"],[0,"FRAGILE"]],
      };
      return map[key]?.find(([t]) => s >= t)?.[1] ?? "—";
    };
    const scoreDescriptions: Record<keyof typeof data.scores, string> = {
      stability:  "How reliably your cash flow covers your debt obligations",
      debtHealth: "How productive your current debt position is relative to its cost",
      efficiency: "How optimally you are using your available borrowing capacity",
      resilience: "Your ability to absorb adverse market shocks without crossing the threshold",
    };

    const scoreEntries = Object.entries(data.scores) as [keyof FinancialScores, number][];
    const boxW2 = (CONTENT_W - 6) / 2;
    scoreEntries.forEach(([key, score], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = MARGIN_X + col * (boxW2 + 6);
      const by = y + row * 38;

      doc.setFillColor(...COLORS.lightGray);
      doc.roundedRect(bx, by, boxW2, 32, 2, 2, "F");

      // Score bar
      doc.setFillColor(...COLORS.border);
      doc.roundedRect(bx + 4, by + 18, boxW2 - 8, 5, 1, 1, "F");
      doc.setFillColor(...scoreColor(score));
      doc.roundedRect(bx + 4, by + 18, (boxW2 - 8) * (score / 100), 5, 1, 1, "F");

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.textTer);
      doc.text(key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()), bx + 4, by + 7);
      doc.setFontSize(16);
      doc.setFont("courier", "bold");
      doc.setTextColor(...scoreColor(score));
      doc.text(String(score), bx + 4, by + 16);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...scoreColor(score));
      doc.text(scoreLabel(key, score), bx + 22, by + 16);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.textTer);
      const descLines = doc.splitTextToSize(scoreDescriptions[key], boxW2 - 8);
      doc.text(descLines[0] ?? "", bx + 4, by + 29);
    });
    y += 82;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 6 — EXECUTIVE SUMMARY (if AI insights available)
  // ══════════════════════════════════════════════════════════════════════════

  if (sections.executiveSummary && data.insights) {
    let y = newPage("AI Executive Summary");
    y = sectionHeading(doc, y, "Executive Summary");

    doc.setFillColor(...COLORS.tealLight);
    doc.rect(MARGIN_X, y, 2, 0, "F"); // left accent (drawn dynamically)
    const summaryLines = doc.splitTextToSize(data.insights.executiveSummary, CONTENT_W - 4);
    const summaryH = summaryLines.length * 5 + 8;
    doc.setFillColor(...COLORS.tealLight);
    doc.rect(MARGIN_X, y, CONTENT_W, summaryH, "F");
    doc.setFillColor(...COLORS.teal);
    doc.rect(MARGIN_X, y, 2, summaryH, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.text);
    doc.text(summaryLines, MARGIN_X + 6, y + 7);
    y += summaryH + 8;

    // Risk Assessment
    y = sectionHeading(doc, y, "Risk Assessment");
    y = textBlock(doc, y, data.insights.riskAssessment, { fontSize: 9.5, color: COLORS.textSec });
    y += 4;

    // Leverage Analysis
    y = sectionHeading(doc, y, "Leverage Analysis");
    y = textBlock(doc, y, data.insights.leverageAnalysis, { fontSize: 9.5, color: COLORS.textSec });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 7 — STRENGTHS / WEAKNESSES / CONSIDERATIONS
  // ══════════════════════════════════════════════════════════════════════════

  if (data.insights) {
    let y = newPage("Analysis");

    // Strengths
    y = sectionHeading(doc, y, "Strengths");
    data.insights.strengths.forEach((item) => {
      doc.setFillColor(...COLORS.optLight);
      doc.rect(MARGIN_X, y, CONTENT_W, 9, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.optimal);
      doc.text("✓", MARGIN_X + 2, y + 6);
      doc.setTextColor(...COLORS.text);
      const wrapped = doc.splitTextToSize(item, CONTENT_W - 10);
      doc.text(wrapped[0] ?? "", MARGIN_X + 7, y + 6);
      y += 11;
    });
    y += 4;

    // Weaknesses
    y = sectionHeading(doc, y, "Risks and Weaknesses");
    data.insights.weaknesses.forEach((item) => {
      doc.setFillColor(...COLORS.cauLight);
      doc.rect(MARGIN_X, y, CONTENT_W, 9, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.caution);
      doc.text("⚠", MARGIN_X + 2, y + 6);
      doc.setTextColor(...COLORS.text);
      const wrapped = doc.splitTextToSize(item, CONTENT_W - 10);
      doc.text(wrapped[0] ?? "", MARGIN_X + 7, y + 6);
      y += 11;
    });
    y += 4;

    // Future Considerations
    y = sectionHeading(doc, y, "Future Considerations");
    y = textBlock(doc, y, data.insights.futureConsiderations, { fontSize: 9.5, color: COLORS.textSec });
    y += 4;

    // Personalized Guidance
    doc.setFillColor(...COLORS.tealLight);
    doc.rect(MARGIN_X, y, CONTENT_W, 16, "F");
    doc.setFillColor(...COLORS.teal);
    doc.rect(MARGIN_X, y, 3, 16, "F");
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.text);
    const guidanceLines = doc.splitTextToSize(data.insights.personalizedGuidance, CONTENT_W - 8);
    doc.text(guidanceLines, MARGIN_X + 6, y + 5.5);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 8 — AI RECOMMENDATIONS (optional)
  // ══════════════════════════════════════════════════════════════════════════

  if (sections.aiRecommendations && data.insights) {
    let y = newPage("Recommendations");
    y = sectionHeading(doc, y, "AI Recommendations");

    data.insights.recommendations.forEach((rec, i) => {
      const recH = 20;
      doc.setFillColor(...COLORS.lightGray);
      doc.roundedRect(MARGIN_X, y, CONTENT_W, recH, 2, 2, "F");
      doc.setFontSize(9);
      doc.setFont("courier", "bold");
      doc.setTextColor(...COLORS.teal);
      doc.text(String(i + 1).padStart(2, "0"), MARGIN_X + 4, y + 8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.text);
      const recLines = doc.splitTextToSize(rec, CONTENT_W - 20);
      recLines.slice(0, 2).forEach((line: string, li: number) => {
        doc.text(line, MARGIN_X + 14, y + 8 + li * 5.5);
      });
      y += recH + 4;
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 9 — SCENARIO COMPARISON (optional)
  // ══════════════════════════════════════════════════════════════════════════

  if (sections.scenarioComparison && data.scenarios && data.scenarios.length > 0) {
    let y = newPage("Scenario Comparison");
    y = sectionHeading(doc, y, "Scenario Simulation Results");

    const scenarioRows = data.scenarios.map((s) => {
      const label = (s.scenario as { name?: string } | null)?.name ?? s.label;
      const sc = STATUS_COLOR[s.outputs.status];
      return [
        label,
        pct(s.outputs.L_star),
        pct(s.outputs.debt_ratio),
        sar(s.outputs.headroom_SAR),
        sc.label,
      ];
    });

    y = drawTable(
      doc, y,
      ["Scenario", "L*", "Debt Ratio", "Headroom", "Status"],
      scenarioRows,
      [50, 22, 25, 43, 30],
      { headerBg: COLORS.teal, altRow: true }
    );
    y += 6;

    // Delta table
    y = sectionHeading(doc, y, "Change vs Baseline");
    const baseline = data.outputs;
    const deltaRows = data.scenarios.map((s) => {
      const label = (s.scenario as { name?: string } | null)?.name ?? s.label;
      const lDelta = (s.outputs.L_star - baseline.L_star) * 100;
      const hDelta = s.outputs.headroom_SAR - baseline.headroom_SAR;
      return [
        label,
        (lDelta > 0 ? "+" : "") + lDelta.toFixed(1) + "pp",
        (hDelta > 0 ? "+" : "") + sar(Math.abs(hDelta)),
        s.delta.status_changed ? "Changed" : "No change",
      ];
    });
    y = drawTable(
      doc, y,
      ["Scenario", "L* change", "Headroom change", "Status"],
      deltaRows,
      [50, 35, 55, 30],
      { headerBg: COLORS.midGray as RGB }
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 10 — MONTE CARLO (optional)
  // ══════════════════════════════════════════════════════════════════════════

  if (sections.monteCarlo && data.monteCarlo) {
    let y = newPage("Monte Carlo Analysis");
    const mc = data.monteCarlo;

    y = sectionHeading(doc, y, `Monte Carlo Results — ${mc.iterations_run.toLocaleString()} Simulated Futures`);

    // Probability boxes
    const probBoxes = [
      { label: "P(OPTIMAL)",    value: (mc.p_optimal * 100).toFixed(1) + "%",    color: COLORS.optimal,    light: COLORS.optLight  },
      { label: "P(CAUTION)",    value: (mc.p_caution * 100).toFixed(1) + "%",    color: COLORS.caution,    light: COLORS.cauLight  },
      { label: "P(SUBOPTIMAL)", value: (mc.p_suboptimal * 100).toFixed(1) + "%", color: COLORS.suboptimal, light: COLORS.subLight  },
    ];
    const probBoxW = (CONTENT_W - 8) / 3;
    probBoxes.forEach(({ label, value, color, light }, i) => {
      const bx = MARGIN_X + i * (probBoxW + 4);
      doc.setFillColor(...light);
      doc.roundedRect(bx, y, probBoxW, 22, 2, 2, "F");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.textTer);
      doc.text(label, bx + 4, y + 7);
      doc.setFontSize(16);
      doc.setFont("courier", "bold");
      doc.setTextColor(...color);
      doc.text(value, bx + 4, y + 19);
    });
    y += 30;

    // Confidence table
    y = sectionHeading(doc, y, "L* Safe Threshold — Confidence Intervals");
    const confRows = [
      ["P5 (5th percentile)",  pct(mc.p5_L_star)],
      ["P25 (25th percentile)", pct(mc.p25_L_star)],
      ["P50 (Median)",         pct(mc.p50_L_star)],
      ["P75 (75th percentile)", pct(mc.p75_L_star)],
      ["P95 (95th percentile)", pct(mc.p95_L_star)],
      ["Mean",                 pct(mc.mean_L_star)],
    ];
    y = drawTable(doc, y, ["Percentile", "L* value"], confRows, [125, 45]);
    y += 4;

    // Interpretation note
    doc.setFillColor(...COLORS.lightGray);
    doc.rect(MARGIN_X, y, CONTENT_W, 12, "F");
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...COLORS.textSec);
    doc.text(
      `Your debt ratio (${pct(data.outputs.debt_ratio)}) was held constant. The safe ceiling L* varied stochastically based on market uncertainty.`,
      MARGIN_X + 3, y + 8
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LAST PAGE — DISCLAIMER
  // ══════════════════════════════════════════════════════════════════════════

  {
    let y = newPage("Disclaimer");

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.text);
    doc.text("Important Disclaimer", MARGIN_X, y);
    y += 10;

    const disclaimer = `This report was generated by OLTEE (Optimal Leverage Threshold Engine), an analytical platform developed by ${APP.engineer}. The analysis and results contained herein are for educational and informational purposes only.

THIS IS NOT FINANCIAL ADVICE. The OLTEE equation and all outputs in this report do not constitute financial, investment, legal, or tax advice. No guarantee is made as to the accuracy, completeness, or timeliness of any information contained herein.

Past performance is not indicative of future results. Financial markets are unpredictable, and the assumptions underlying this analysis may not hold in all circumstances. The optimal leverage threshold (L*) is a mathematical output based on inputs you provided and the OLTEE equation — it should not be treated as a recommendation to borrow or a guarantee of financial stability.

Always consult a licensed financial advisor, certified planner, or qualified professional before making any financial decisions, including decisions about debt, leverage, or investment. The creators and operators of OLTEE accept no liability for any decisions made on the basis of this report.

Islamic Finance Note: For users in Saudi Arabia and the GCC, this analysis applies equally to conventional interest rates and Islamic profit rates. The mathematical treatment is identical; the terminology differs only in compliance with Sharia principles.

By using this report, you acknowledge that you have read and understood this disclaimer.`;

    const dLines = doc.splitTextToSize(disclaimer, CONTENT_W);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.textSec);
    doc.text(dLines, MARGIN_X, y);
    y += dLines.length * 4.5 + 8;

    // Signature
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.teal);
    doc.text(`OLTEE — ${APP.fullName}`, MARGIN_X, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.textTer);
    doc.text(`Developed by ${APP.engineer}`, MARGIN_X, y + 5);
    doc.text(`Report generated: ${fmtDate(data.metadata.generatedAt)}`, MARGIN_X, y + 10);
  }

  // Return as Blob
  return doc.output("blob");
}

// ─── Download trigger ─────────────────────────────────────────────────────────

export async function downloadReport(
  data: PDFReportData,
  sections: ReportSections = DEFAULT_SECTIONS
): Promise<void> {
  const blob = await generatePDFReport(data, sections);
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = buildReportFilename(data);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Filename + shareable URL ─────────────────────────────────────────────────

export function buildReportFilename(data: PDFReportData): string {
  const date   = new Date(data.metadata.generatedAt).toISOString().split("T")[0];
  const status = data.outputs.status.toLowerCase().replace("_", "-");
  return `oltee-report-${date}-${status}.pdf`;
}

export function buildShareableURL(data: PDFReportData): string {
  const params = new URLSearchParams({
    roi:   (data.inputs.ROI   * 100).toFixed(2),
    r:     (data.inputs.r     * 100).toFixed(2),
    t:     (data.inputs.T     * 100).toFixed(1),
    sigma: data.inputs.sigma.toFixed(2),
    cf:    data.inputs.CF_ratio.toFixed(2),
    d:     data.inputs.D.toString(),
    a:     data.inputs.A.toString(),
  });
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/analyze?${params.toString()}`;
}

// ─── Report ID generator ──────────────────────────────────────────────────────

export function generateReportId(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase() +
         Math.random().toString(36).substring(2, 6).toUpperCase();
}

export function buildReportData(
  inputs: import("@/types/oltee").OLTEEInputs,
  outputs: import("@/types/oltee").OLTEEOutputs,
  equationSteps: import("@/types/oltee").EquationStep[],
  scores: import("@/types/oltee").FinancialScores,
  insights: import("@/types/oltee").AIInsights | null,
  scenarios: import("@/types/oltee").ScenarioResult[] | null,
  monteCarlo: import("@/types/oltee").MonteCarloResult | null
): PDFReportData {
  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      reportId:    generateReportId(),
      platform:    `${APP.name} v${APP.version}`,
      engineer:    APP.engineer,
    },
    inputs, outputs, equationSteps, scores, insights, scenarios, monteCarlo,
  };
}