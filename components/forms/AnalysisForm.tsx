"use client";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { OLTEEFormValues } from "@/types/oltee";
import { OLTEEFormSchema } from "@/lib/validation";
import { DEFAULTS } from "@/config/constants";
import { VolatilitySlider } from "./VolatilitySlider";
import { CFSubCalculator } from "./CFSubCalculator";

interface Props {
  onSubmit: (v: OLTEEFormValues) => Promise<void>;
  defaultValues?: Partial<OLTEEFormValues>;
  isLoading?: boolean;
}

export function AnalysisForm({ onSubmit, defaultValues, isLoading }: Props) {
  const [cfOpen, setCfOpen] = useState(false);

  const { register, control, handleSubmit, setValue, watch,
    formState: { errors } } = useForm<OLTEEFormValues>({
    resolver: zodResolver(OLTEEFormSchema),
    defaultValues: {
      ROI: defaultValues?.ROI ?? "", r: defaultValues?.r ?? "",
      T:   defaultValues?.T   ?? String(DEFAULTS.T * 100),
      sigma:    defaultValues?.sigma    ?? DEFAULTS.sigma,
      CF_ratio: defaultValues?.CF_ratio ?? "",
      D: defaultValues?.D ?? "", A: defaultValues?.A ?? "",
    },
  });

  const roi = watch("ROI"), r = watch("r");
  const delta = parseFloat(roi) && parseFloat(r)
    ? parseFloat(roi) - parseFloat(r) : null;

  function Field({ name, label, unit, hint, badge }: {
    name: keyof OLTEEFormValues; label: string;
    unit: string; hint?: string; badge?: React.ReactNode;
  }) {
    const hasErr = !!errors[name];
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 6 }}>
          <label htmlFor={name} style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
            textTransform: "uppercase" as const,
            color: "rgba(245,248,255,0.38)",
          }}>
            {label}
          </label>
          {badge}
        </div>
        <div style={{
          display: "flex",
          border: `1px solid ${hasErr ? "rgba(255,92,92,0.40)" : "rgba(255,255,255,0.09)"}`,
          borderRadius: 9,
          overflow: "hidden",
          transition: "border-color 120ms",
          background: "rgba(0,0,0,0.22)",
        }}>
          <input id={name} {...register(name as any)}
            placeholder={name === "T" ? "15" : ""}
            autoComplete="off"
            style={{
              flex: 1, height: 42,
              background: "transparent",
              border: "none",
              padding: "0 14px",
              fontSize: 14, fontWeight: 500,
              color: hasErr ? "#FF5C5C" : "#F5F8FF",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <div style={{
            height: 42, flexShrink: 0,
            borderLeft: "1px solid rgba(255,255,255,0.07)",
            padding: "0 12px",
            display: "flex", alignItems: "center",
            fontSize: 11, fontWeight: 600,
            letterSpacing: "0.04em",
            color: "rgba(245,248,255,0.28)",
            background: "rgba(255,255,255,0.02)",
          }}>
            {unit}
          </div>
        </div>
        {hasErr ? (
          <div style={{ fontSize: 11, color: "#FF5C5C", marginTop: 5,
            display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4M12 16h.01"/>
            </svg>
            {errors[name]?.message}
          </div>
        ) : hint ? (
          <div style={{ fontSize: 11, color: "rgba(245,248,255,0.25)", marginTop: 5 }}>{hint}</div>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}
      style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Live equation banner */}
      <div style={{
        background: "rgba(0,229,180,0.05)",
        border: "1px solid rgba(0,229,180,0.12)",
        borderRadius: 10,
        padding: "12px 14px",
        marginBottom: 22,
        fontFamily: "var(--font-mono, monospace)",
        fontSize: 12,
        lineHeight: 1.9,
        color: "rgba(245,248,255,0.28)",
      }}>
        <span style={{ color: "#00E5B4", fontWeight: 700, fontSize: 13 }}>L*</span>
        <span> = [&nbsp;</span>
        <span style={{ color: roi ? "#00E5B4" : "rgba(245,248,255,0.28)" }}>{roi || "ROI"}</span>
        <span> − </span>
        <span style={{ color: r ? "#00E5B4" : "rgba(245,248,255,0.28)" }}>{r || "r"}</span>
        <span> ] × (1−T) ÷ [ r × β × (1/CF) ]</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingRight: 2 }}>
        <Field name="ROI" label="Annual return" unit="%"
          hint="e.g. SAR 60K rent on SAR 500K property → enter 12"
          badge={delta !== null && (
            <span style={{
              fontFamily: "var(--font-mono, monospace)", fontSize: 11, fontWeight: 600,
              color: delta > 0 ? "#3DDE8E" : "#FF5C5C",
              background: delta > 0 ? "rgba(61,222,142,0.10)" : "rgba(255,92,92,0.10)",
              padding: "2px 8px", borderRadius: 99,
              border: `1px solid ${delta > 0 ? "rgba(61,222,142,0.22)" : "rgba(255,92,92,0.22)"}`,
            }}>
              Δ {delta > 0 ? "+" : ""}{delta.toFixed(2)}%
            </span>
          )}
        />

        <Field name="r" label="Interest / profit rate" unit="%" />
        <Field name="T" label="Tax rate" unit="%" hint="Default 15% — leave blank" />

        {/* Sigma slider */}
        <div style={{ marginBottom: 14 }}>
          <Controller name="sigma" control={control}
            render={({ field }) => (
              <VolatilitySlider value={field.value as number} onChange={field.onChange}/>
            )}/>
        </div>

        {/* CF ratio */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 6 }}>
            <label htmlFor="CF_ratio" style={{
              fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
              textTransform: "uppercase" as const, color: "rgba(245,248,255,0.38)",
            }}>Monthly income ÷ repayment</label>
          </div>
          <div style={{
            display: "flex",
            border: `1px solid ${errors.CF_ratio ? "rgba(255,92,92,0.40)" : "rgba(255,255,255,0.09)"}`,
            borderRadius: 9, overflow: "hidden", background: "rgba(0,0,0,0.22)",
          }}>
            <input id="CF_ratio" {...register("CF_ratio")}
              placeholder="e.g. 1.35"
              style={{ flex: 1, height: 42, background: "transparent", border: "none",
                padding: "0 14px", fontSize: 14, fontWeight: 500, color: "#F5F8FF", outline: "none" }}/>
            <div style={{ height: 42, borderLeft: "1px solid rgba(255,255,255,0.07)",
              padding: "0 12px", display: "flex", alignItems: "center",
              fontSize: 11, fontWeight: 600, color: "rgba(245,248,255,0.28)",
              background: "rgba(255,255,255,0.02)" }}>×</div>
          </div>
          {errors.CF_ratio && (
            <div style={{ fontSize: 11, color: "#FF5C5C", marginTop: 5 }}>
              {errors.CF_ratio.message}
            </div>
          )}
          <button type="button" onClick={() => setCfOpen(o => !o)}
            style={{ background: "none", border: "none", color: "#00E5B4",
              fontSize: 11, cursor: "pointer", marginTop: 6, padding: 0,
              display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"/>
            </svg>
            Calculate automatically
          </button>
          {cfOpen && (
            <div style={{ marginTop: 8 }}>
              <CFSubCalculator
                onResult={cf => { setValue("CF_ratio", cf.toFixed(2)); setCfOpen(false); }}/>
            </div>
          )}
        </div>

        <Field name="D" label="Total debt" unit="SAR"
          hint="All loans: mortgage + vehicle + personal"/>
        <Field name="A" label="Total assets" unit="SAR"
          hint="Property + savings + vehicles + investments"/>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "14px 0" }}/>

      {/* Submit */}
      <button type="submit" disabled={isLoading} style={{
        width: "100%", height: 46,
        background: isLoading
          ? "rgba(0,184,144,0.50)"
          : "linear-gradient(135deg, #00E5B4 0%, #00B890 100%)",
        color: "#04120E",
        border: "none",
        borderRadius: 10,
        fontSize: 14, fontWeight: 700,
        letterSpacing: "-0.01em",
        cursor: isLoading ? "default" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "opacity 150ms",
        boxShadow: isLoading ? "none" : "0 4px 24px rgba(0,229,180,0.18)",
      }}>
        {isLoading ? (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              style={{ animation: "spin 0.8s linear infinite" }} aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Calculating…
          </>
        ) : (
          <>
            Calculate L*
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </>
        )}
      </button>
    </form>
  );
}
