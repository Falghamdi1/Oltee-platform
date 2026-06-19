"use client";
import { usePathname, useRouter } from "next/navigation";
import { useOLTEEContext } from "@/lib/context";
import { NAV_LINKS } from "@/config/constants";

export function Navigation() {
  const pathname = usePathname();
  const router   = useRouter();
  const { hasBaseline } = useOLTEEContext();

  return (
    <nav style={{
      height: 56,
      background: "rgba(6,8,15,0.92)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      position: "sticky",
      top: 0,
      zIndex: 300,
    }}>
      {/* Logo */}
      <button onClick={() => router.push("/")}
        aria-label="OLTEE home"
        style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10, padding: 0,
          marginRight: 32, flexShrink: 0,
        }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: "linear-gradient(145deg, #00E5B4, #00B890)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 3L13.5 13H2.5L8 3Z"
              stroke="#05120E" strokeWidth="1.8" strokeLinejoin="round"/>
            <circle cx="8" cy="9.5" r="1.8" fill="#05120E"/>
          </svg>
        </div>
        <span style={{
          fontSize: 15, fontWeight: 700, color: "#F5F8FF",
          letterSpacing: "-0.03em",
        }}>OLTEE</span>
      </button>

      {/* Links */}
      <div style={{ display: "flex", gap: 2, flex: 1 }}>
        {NAV_LINKS.map(({ href, label }) => {
          const disabled = href !== "/analyze" && !hasBaseline;
          const active   = pathname === href ||
            (href === "/analyze" && pathname.startsWith("/analyze"));
          return (
            <button key={href}
              onClick={() => !disabled && router.push(href)}
              disabled={disabled}
              aria-current={active ? "page" : undefined}
              style={{
                background: active ? "rgba(0,229,180,0.10)" : "none",
                border: "none",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? "#00E5B4"
                      : disabled ? "rgba(245,248,255,0.18)"
                      : "rgba(245,248,255,0.50)",
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "background 120ms, color 120ms",
                letterSpacing: active ? "-0.01em" : "normal",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Ready indicator */}
      <div style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "5px 13px",
        background: hasBaseline ? "rgba(61,222,142,0.08)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${hasBaseline ? "rgba(61,222,142,0.22)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 99,
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: hasBaseline ? "#3DDE8E" : "#2D3748",
          animation: hasBaseline ? "dotpulse 2s ease-in-out infinite" : "none",
        }}/>
        <span style={{
          fontSize: 11, fontWeight: 500,
          color: hasBaseline ? "#3DDE8E" : "rgba(245,248,255,0.25)",
          letterSpacing: "0.02em",
        }}>
          {hasBaseline ? "Analysis ready" : "No analysis"}
        </span>
      </div>
    </nav>
  );
}
