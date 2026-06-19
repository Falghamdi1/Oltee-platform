"use client";
import { useRouter } from "next/navigation";
import { APP } from "@/config/constants";

export function Hero() {
  const router = useRouter();
  return (
    <section style={{
      minHeight: "90vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "80px 24px 60px",
      textAlign: "center",
      // Subtle, barely-there gradient — not glowing
      background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,255,255,0.025) 0%, transparent 65%)",
    }}>

      {/* Eyebrow — plain text, no glowing pill */}
      <div style={{
        fontSize: 11, fontWeight: 600, letterSpacing: "0.14em",
        textTransform: "uppercase" as const,
        color: "rgba(245,248,255,0.38)",
        marginBottom: 28,
      }}>
        Financial Intelligence Platform
      </div>

      {/* Headline — white, not teal gradient */}
      <h1 style={{
        fontSize: "clamp(38px, 5vw, 64px)",
        fontWeight: 700,
        lineHeight: 1.08,
        letterSpacing: "-0.03em",
        color: "#F5F8FF",
        marginBottom: 24,
        maxWidth: 700,
      }}>
        Know exactly when<br/>debt works for you
      </h1>

      {/* Subheading */}
      <p style={{
        fontSize: "clamp(15px, 1.6vw, 17px)",
        color: "rgba(245,248,255,0.45)",
        maxWidth: 480,
        lineHeight: 1.75,
        marginBottom: 44,
      }}>
        {APP.description}
      </p>

      {/* CTAs */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, justifyContent: "center" }}>
        <button onClick={() => router.push("/analyze")} style={{
          height: 48, padding: "0 28px",
          background: "#00E5B4",
          border: "none", borderRadius: 9,
          fontSize: 14, fontWeight: 600,
          color: "#04120E", cursor: "pointer",
          letterSpacing: "-0.01em",
        }}>
          Analyse your leverage →
        </button>
        <button onClick={() => router.push("/analyze")} style={{
          height: 48, padding: "0 24px",
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 9, fontSize: 14,
          color: "rgba(245,248,255,0.50)", cursor: "pointer",
        }}>
          View demo
        </button>
      </div>

      {/* Stats row — muted, not glowing */}
      <div style={{
        marginTop: 80,
        display: "flex", gap: 0,
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingTop: 40,
        width: "100%", maxWidth: 680,
        justifyContent: "space-around",
        flexWrap: "wrap" as const,
      }}>
        {[
          ["L*",  "Optimal leverage\nthreshold"],
          ["4",   "Intelligence\nscores"],
          ["9",   "Transparent\nequation steps"],
          ["SAR", "Saudi Arabia\nand GCC"],
        ].map(([stat, label]) => (
          <div key={stat} style={{ textAlign: "center", padding: "0 16px 20px" }}>
            <div style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 28, fontWeight: 700,
              color: "#F5F8FF",
              marginBottom: 8, letterSpacing: "-0.02em",
            }}>{stat}</div>
            <div style={{
              fontSize: 11, color: "rgba(245,248,255,0.30)",
              lineHeight: 1.5, whiteSpace: "pre-line" as const,
            }}>{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}