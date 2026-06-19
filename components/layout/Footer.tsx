"use client";
import { APP } from "@/config/constants";
export function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid rgba(255,255,255,0.06)",
      padding: "14px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap" as const, gap: 10,
      background: "var(--bg, #06080F)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 20, height: 20, borderRadius: 5,
          background: "linear-gradient(145deg, #00E5B4, #00B890)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 3L13.5 13H2.5L8 3Z" stroke="#04120E" strokeWidth="1.8" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(245,248,255,0.40)" }}>
          {APP.name}
        </span>
        <span style={{ color: "rgba(245,248,255,0.15)", fontSize: 12 }}>·</span>
        <span style={{ fontSize: 12, color: "rgba(245,248,255,0.22)" }}>{APP.engineer}</span>
      </div>
      <span style={{ fontSize: 11, color: "rgba(245,248,255,0.18)" }}>
        Not financial advice · For educational purposes only
      </span>
      <span style={{ fontSize: 11, color: "rgba(245,248,255,0.15)" }}>v{APP.version}</span>
    </footer>
  );
}
