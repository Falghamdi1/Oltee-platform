// ═══════════════════════════════════════════════════════════════════════════
// OLTEE — PDF Report Builder UI Component
//
// Two-column layout:
//   Left  — section toggles, page estimate, copy-link, download button
//   Right — live PDF preview: animated cover mockup + table of contents
//
// State is local — no context or reducer needed.
// generatePDFReport is called only on Download click (jsPDF lazy-loaded).
//
// Author: Faisal Alghamdi
// ═══════════════════════════════════════════════════════════════════════════

"use client";
import React, { useState, useCallback } from "react";
import type { PDFReportData, LeverageStatus } from "@/types/oltee";
import {
  generatePDFReport,
  downloadReport,
  buildShareableURL,
  estimatePageCount,
  generateReportId,
  DEFAULT_SECTIONS,
  type ReportSections,
} from "@/lib/pdf";

// ─── Design tokens ─────────────────────────────────────────────────────────

const C = {
  bg:        "var(--bg,#06080F)",
  raised:    "var(--surface,#0E1525)",
  overlay:   "rgba(255,255,255,0.03)",
  sunken:    "rgba(0,0,0,0.28)",
  border:    "rgba(255,255,255,0.07)",
  borderMid: "rgba(255,255,255,0.09)",
  borderStr: "rgba(255,255,255,0.13)",
  ink:       "var(--text-1,#F5F8FF)",
  inkSec:    "rgba(245,248,255,0.55)",
  inkTer:    "rgba(245,248,255,0.28)",
  teal:      "#00E5B4",
  tealMid:   "#00B890",
  tealGhost: "rgba(0,229,180,0.07)",
  opt: { bg: "rgba(61,222,142,0.07)",  border: "rgba(61,222,142,0.22)",  mid: "#3DDE8E", bright: "#3DDE8E" },
  cau: { bg: "rgba(255,184,48,0.07)",  border: "rgba(255,184,48,0.22)",  mid: "#FFB830", bright: "#FFB830" },
  sub: { bg: "rgba(255,92,92,0.07)",   border: "rgba(255,92,92,0.22)",   mid: "#FF5C5C", bright: "#FF5C5C" },
  neg: { bg: "rgba(255,68,119,0.07)",  border: "rgba(255,68,119,0.22)",  mid: "#FF4477", bright: "#FF4477" },
};

const STATUS_SC: Record<LeverageStatus, typeof C.opt> = {
  OPTIMAL: C.opt, CAUTION: C.cau, SUBOPTIMAL: C.sub, NEG_SPREAD: C.neg,
};

const STATUS_LABELS: Record<LeverageStatus, string> = {
  OPTIMAL: "Optimal", CAUTION: "Caution",
  SUBOPTIMAL: "Suboptimal", NEG_SPREAD: "Negative Spread",
};

// ─── Section definitions ───────────────────────────────────────────────────

interface SectionDef {
  key: keyof ReportSections;
  label: string;
  description: string;
  alwaysOn?: boolean;             // Decision result — cannot be toggled
  requiresData?: "insights" | "scenarios" | "monteCarlo";
  pageEstimate: number;
}

const SECTION_DEFS: SectionDef[] = [
  { key: "executiveSummary",    label: "Executive summary",          description: "AI-generated plain-language overview", requiresData: "insights",   pageEstimate: 1 },
  { key: "inputSummary",        label: "Input summary",              description: "All 7 inputs in a formatted table",                                 pageEstimate: 1 },
  { key: "equationWalkthrough", label: "Equation walkthrough",       description: "All 9 calculation steps shown",                                     pageEstimate: 1 },
  { key: "financialScores",     label: "Financial intelligence scores", description: "Stability, health, efficiency, resilience",                      pageEstimate: 1 },
  { key: "aiRecommendations",   label: "AI recommendations",         description: "3 personalised action items",         requiresData: "insights",   pageEstimate: 1 },
  { key: "scenarioComparison",  label: "Scenario comparison",        description: "Scenario table and delta analysis",   requiresData: "scenarios",  pageEstimate: 1 },
  { key: "monteCarlo",          label: "Monte Carlo analysis",       description: "Probability distribution and percentile table", requiresData: "monteCarlo", pageEstimate: 1 },
];

// ─── Props ─────────────────────────────────────────────────────────────────

export interface PDFReportBuilderProps {
  data: PDFReportData | null;
}

// ─── Toggle switch ─────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled = false,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  id: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-labelledby={id}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 38,
        height: 22,
        borderRadius: 11,
        background: disabled ? C.borderStr : checked ? C.teal : C.overlay,
        border: `1px solid ${disabled ? C.borderStr : checked ? C.tealMid : C.borderMid}`,
        position: "relative",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 150ms, border-color 150ms",
        flexShrink: 0,
        outline: "none",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked && !disabled ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: disabled ? C.borderMid : checked ? "#04120E" : C.inkTer,
          transition: "left 150ms",
        }}
      />
    </button>
  );
}

// ─── Cover page preview (SVG mockup) ──────────────────────────────────────

function CoverPreview({
  data,
  sections,
  pageCount,
}: {
  data: PDFReportData;
  sections: ReportSections;
  pageCount: number;
}) {
  const sc = STATUS_SC[data.outputs.status];
  const statusLabel = STATUS_LABELS[data.outputs.status];
  const date = new Date(data.metadata.generatedAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const reportId = `OLTEE-${data.metadata.reportId.slice(0, 8).toUpperCase()}`;
  const pct = (v: number, d = 1) => (v * 100).toFixed(d) + "%";
  const sarShort = (v: number) =>
    v >= 1_000_000 ? `SAR ${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000 ? `SAR ${(v / 1_000).toFixed(0)}K`
    : `SAR ${Math.round(v).toLocaleString()}`;

  // A4 aspect ratio at preview scale
  const previewW = 280;
  const previewH = Math.round(previewW * (297 / 210));

  // TOC items for this configuration
  const tocItems: { label: string; included: boolean }[] = [
    { label: "Decision result",           included: true },
    { label: "Input summary",             included: sections.inputSummary },
    { label: "Equation walkthrough",      included: sections.equationWalkthrough },
    { label: "Financial scores",          included: sections.financialScores },
    { label: "AI executive summary",      included: sections.executiveSummary && !!data.insights },
    { label: "AI risk analysis",          included: !!data.insights },
    { label: "AI recommendations",        included: sections.aiRecommendations && !!data.insights },
    { label: "Scenario comparison",       included: sections.scenarioComparison && !!data.scenarios },
    { label: "Monte Carlo analysis",      included: sections.monteCarlo && !!data.monteCarlo },
    { label: "Disclaimer",                included: true },
  ];

  return (
    <div>
      {/* Page mockup */}
      <div
        style={{
          width: previewW,
          height: previewH,
          background: "#FAFBFF",
          border: `1px solid ${C.borderMid}`,
          borderRadius: 4,
          overflow: "hidden",
          margin: "0 auto",
          position: "relative",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Header band */}
        <div style={{ height: 18, background: "#009B82", display: "flex", alignItems: "center", padding: "0 12px", justifyContent: "space-between" }}>
          <span style={{ fontSize: 7, color: "#fff", fontWeight: 600 }}>OLTEE — Optimal Leverage Threshold Engine</span>
          <span style={{ fontSize: 7, color: "rgba(255,255,255,0.7)" }}>COVER</span>
        </div>

        {/* Logotype */}
        <div style={{ textAlign: "center", padding: "22px 0 6px" }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: "#009B82", letterSpacing: "-0.02em", lineHeight: 1 }}>OLTEE</div>
          <div style={{ fontSize: 8, color: "#6B7A99", marginTop: 4 }}>Optimal Leverage Threshold Engine</div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#E2E6F0", margin: "6px 24px" }} />

        {/* Status badge */}
        <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
          <div style={{ background: sc.bg.replace("0x", "#"), border: `1px solid ${sc.border}`, color: sc.bright, fontSize: 9, fontWeight: 600, padding: "3px 14px", borderRadius: 4 }}>
            {statusLabel.toUpperCase()}
          </div>
        </div>

        {/* Key metrics */}
        <div style={{ display: "flex", justifyContent: "center", gap: 16, margin: "10px 16px", background: "#F2F4F9", borderRadius: 3, padding: "8px 0" }}>
          {[
            { l: "Debt Ratio", v: pct(data.outputs.debt_ratio), c: "#333" },
            { l: "L* Ceiling", v: pct(data.outputs.L_star),    c: "#009B82" },
            { l: "Headroom",   v: sarShort(data.outputs.headroom_SAR), c: sc.mid },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 6, color: "#9AA3B2", textTransform: "uppercase", marginBottom: 2 }}>{l}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: c, fontFamily: "monospace" }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Metadata */}
        <div style={{ textAlign: "center", margin: "8px 0" }}>
          <div style={{ fontSize: 6.5, color: "#9AA3B2" }}>Report ID: {reportId}</div>
          <div style={{ fontSize: 6.5, color: "#9AA3B2", marginTop: 2 }}>Generated: {date}</div>
          <div style={{ fontSize: 6.5, color: "#9AA3B2", marginTop: 2 }}>Prepared by Faisal Alghamdi</div>
        </div>

        {/* TOC */}
        <div style={{ margin: "8px 16px 0" }}>
          <div style={{ fontSize: 7, fontWeight: 600, color: "#333", marginBottom: 4 }}>Contents</div>
          {tocItems.map(({ label, included }, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2.5 }}>
              <span style={{ fontSize: 6.5, color: included ? "#333" : "#BCC3D0", fontFamily: "monospace", minWidth: 14 }}>
                {included ? String(tocItems.slice(0, i + 1).filter(x => x.included).length).padStart(2, "0") : "—"}
              </span>
              <span style={{ fontSize: 6.5, color: included ? "#666" : "#BCC3D0" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Footer band */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 14, background: "#F2F4F9", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px" }}>
          <span style={{ fontSize: 6, color: "#9AA3B2" }}>Prepared by Faisal Alghamdi · OLTEE v1.0</span>
          <span style={{ fontSize: 6, color: "#9AA3B2" }}>Page 1 of {pageCount}</span>
        </div>
      </div>

      {/* Page count badge */}
      <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: C.inkTer }}>
        Cover page preview · {pageCount} pages estimated
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export function PDFReportBuilder({ data }: PDFReportBuilderProps) {
  const [sections, setSections] = useState<ReportSections>(() => ({
    ...DEFAULT_SECTIONS,
    // Auto-enable if data already exists when component first mounts
    scenarioComparison: !!data?.scenarios,
    monteCarlo: !!data?.monteCarlo,
  }));

  // When the user runs scenarios/MC after opening the report page, re-enable toggles
  const prevScenarios = React.useRef(!!data?.scenarios);
  const prevMC        = React.useRef(!!data?.monteCarlo);
  React.useEffect(() => {
    if (!!data?.scenarios && !prevScenarios.current) {
      setSections(s => ({ ...s, scenarioComparison: true }));
      prevScenarios.current = true;
    }
    if (!!data?.monteCarlo && !prevMC.current) {
      setSections(s => ({ ...s, monteCarlo: true }));
      prevMC.current = true;
    }
  }, [data?.scenarios, data?.monteCarlo]);

  const [generating, setGenerating] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure a stable report ID for the preview
  const [previewData] = useState<PDFReportData | null>(() =>
    data
      ? { ...data, metadata: { ...data.metadata, reportId: generateReportId() } }
      : null
  );

  const pageCount = previewData ? estimatePageCount(previewData, sections) : 0;

  // Toggle a section on/off
  const toggle = useCallback((key: keyof ReportSections, value: boolean) => {
    setSections((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Download the PDF
  const handleDownload = useCallback(async () => {
    if (!previewData || generating) return;
    setGenerating(true);
    setError(null);
    try {
      await downloadReport(previewData, sections);
    } catch (e) {
      console.error("[OLTEE PDF] Generation failed:", e);
      setError("Unable to generate report. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [previewData, sections, generating]);

  // Copy shareable URL
  const handleCopyLink = useCallback(async () => {
    if (!previewData) return;
    const url = buildShareableURL(previewData);
    try {
      await navigator.clipboard.writeText(url);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    } catch {
      // Fallback — select text
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    }
  }, [previewData]);

  // ── No data guard ─────────────────────────────────────────────────────────
  if (!data || !previewData) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center", color: C.inkTer, fontSize: 14 }}>
        Run an analysis on the Analyze page first.
      </div>
    );
  }

  const sc = STATUS_SC[data.outputs.status];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>

      {/* ── Left column: section toggles ─────────────────────────────────── */}
      <div>
        {/* Toggle panel */}
        <div style={{
          background: C.raised,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: C.ink, marginBottom: 18 }}>
            Include in report
          </div>

          {/* Always-included header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 0", borderBottom: `1px solid ${C.border}`,
          }}>
            <div>
              <div style={{ fontSize: 14, color: C.ink }}>Decision result</div>
              <div style={{ fontSize: 12, color: C.inkTer, marginTop: 2 }}>Status, L*, debt ratio, headroom — always included</div>
            </div>
            <div style={{
              fontSize: 11, color: C.inkTer, fontWeight: 500,
              background: C.overlay, border: `1px solid ${C.borderMid}`,
              borderRadius: 4, padding: "2px 8px",
            }}>
              Always
            </div>
          </div>

          {/* Toggleable sections */}
          {SECTION_DEFS.map((def, i) => {
            const isLast = i === SECTION_DEFS.length - 1;
            const dataAvailable =
              !def.requiresData ||
              (def.requiresData === "insights"   && !!data.insights) ||
              (def.requiresData === "scenarios"  && !!data.scenarios) ||
              (def.requiresData === "monteCarlo" && !!data.monteCarlo);
            const disabled = !dataAvailable;
            const checked  = !disabled && sections[def.key];

            return (
              <div
                key={def.key}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom: isLast ? "none" : `1px solid ${C.border}`,
                  opacity: disabled ? 0.45 : 1,
                }}
              >
                <div style={{ flex: 1, paddingRight: 16 }}>
                  <div id={`section-${def.key}`} style={{ fontSize: 13, color: disabled ? C.inkTer : C.ink }}>
                    {def.label}
                  </div>
                  <div style={{ fontSize: 11, color: C.inkTer, marginTop: 2 }}>
                    {disabled && def.requiresData === "insights"
                      ? "Run the Analyze page to generate AI insights first"
                      : disabled && def.requiresData === "scenarios"
                      ? "Run scenarios in the Scenario Lab first"
                      : disabled && def.requiresData === "monteCarlo"
                      ? "Run the Monte Carlo simulation first"
                      : def.description}
                  </div>
                </div>
                <Toggle
                  id={`section-${def.key}`}
                  checked={checked}
                  onChange={(v) => !disabled && toggle(def.key, v)}
                  disabled={disabled}
                />
              </div>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            background: C.sub.bg, border: `1px solid ${C.sub.border}`,
            borderRadius: 8, padding: "10px 14px",
            fontSize: 13, color: C.sub.bright, marginBottom: 12,
          }}>
            {error}
          </div>
        )}

        {/* Actions footer */}
        <div style={{
          background: C.raised, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: "16px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ fontSize: 13, color: C.inkTer }}>
            Estimated {pageCount} pages
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {/* Copy link */}
            <button
              onClick={handleCopyLink}
              style={{
                height: 40, padding: "0 16px",
                background: "transparent",
                border: `1px solid ${C.borderStr}`,
                borderRadius: 8, fontSize: 13,
                color: copyDone ? C.teal : C.inkSec,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                transition: "color 150ms, border-color 150ms",
              }}
              aria-label="Copy shareable analysis link"
            >
              {/* Link icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              {copyDone ? "Copied!" : "Copy link"}
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownload}
              disabled={generating}
              style={{
                height: 40, padding: "0 20px",
                background: generating ? C.tealMid : C.teal,
                border: "none", borderRadius: 8,
                fontSize: 13, fontWeight: 600,
                color: "#04120E",
                cursor: generating ? "default" : "pointer",
                opacity: generating ? 0.8 : 1,
                display: "flex", alignItems: "center", gap: 7,
                transition: "background 150ms, opacity 150ms",
              }}
              aria-label="Download PDF report"
            >
              {generating ? (
                <>
                  {/* Spinner */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" style={{ animation: "spin 0.8s linear infinite" }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  {/* Download icon */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Right column: live preview ────────────────────────────────────── */}
      <div style={{ position: "sticky", top: 80 }}>
        <div style={{
          background: C.raised, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: "20px 24px",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 16,
          }}>
            <span style={{ fontSize: 13, color: C.inkSec }}>Preview</span>
            <span style={{ fontSize: 12, color: C.inkTer }}>{pageCount} pages</span>
          </div>

          <CoverPreview
            data={previewData}
            sections={sections}
            pageCount={pageCount}
          />

          {/* Status ribbon below cover */}
          <div style={{
            marginTop: 16, padding: "12px 14px",
            background: sc.bg, border: `1px solid ${sc.border}`,
            borderRadius: 8, display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: sc.bright, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {STATUS_LABELS[data.outputs.status]}
              </div>
              <div style={{ fontSize: 11, color: sc.mid, marginTop: 2 }}>
                L* = {(data.outputs.L_star * 100).toFixed(1)}%
                · DR = {(data.outputs.debt_ratio * 100).toFixed(1)}%
              </div>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: C.inkTer, textAlign: "right" }}>
              {data.metadata.reportId.slice(0, 8).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Spinner keyframe — injected once */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
