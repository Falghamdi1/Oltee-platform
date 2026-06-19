"use client";

const FEATURES = [
  { title: "Specification-exact math",
    desc: "The OLTEE equation is implemented verbatim with 35 verified test cases — every step is shown transparently." },
  { title: "AI-powered analysis",
    desc: "Every result generates a structured AI analysis: executive summary, risk assessment, and personalised recommendations." },
  { title: "Scenario simulation",
    desc: "8 preset scenarios plus live sliders — test rate hikes, income cuts, and asset declines in real time." },
  { title: "Monte Carlo analysis",
    desc: "Simulate 10,000+ possible futures to understand the probability your position stays productive." },
  { title: "Professional PDF reports",
    desc: "Download print-quality reports suitable for sharing with financial advisors, investors, or bankers." },
  { title: "Shareable analysis links",
    desc: "Every analysis encodes to a URL that auto-populates the form — share with colleagues or save for later." },
];

export function Features() {
  return (
    <section style={{ padding: "80px 24px 100px", maxWidth: 1160, margin: "0 auto" }}>
      {/* Section heading */}
      <div style={{ marginBottom: 52 }}>
        <h2 style={{
          fontSize: "clamp(26px, 3.5vw, 36px)",
          fontWeight: 700, letterSpacing: "-0.025em",
          color: "#F5F8FF", marginBottom: 12,
        }}>
          Everything in one platform
        </h2>
        <p style={{ fontSize: 15, color: "rgba(245,248,255,0.38)", maxWidth: 420, lineHeight: 1.7 }}>
          Equation-first, AI-enhanced. Built for the GCC personal finance context.
        </p>
      </div>

      {/* Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 1,
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14,
        overflow: "hidden",
      }}>
        {FEATURES.map(({ title, desc }, i) => (
          <div key={title} style={{
            padding: "28px 26px",
            background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{
              fontSize: 10, fontWeight: 600, letterSpacing: "0.09em",
              textTransform: "uppercase" as const,
              color: "#00E5B4", marginBottom: 10,
            }}>
              {String(i + 1).padStart(2, "0")}
            </div>
            <div style={{
              fontSize: 15, fontWeight: 600,
              color: "rgba(245,248,255,0.82)",
              marginBottom: 10, letterSpacing: "-0.01em",
            }}>{title}</div>
            <div style={{
              fontSize: 13, color: "rgba(245,248,255,0.38)",
              lineHeight: 1.7,
            }}>{desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}