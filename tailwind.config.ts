import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],

  theme: {
    extend: {
      // ─── OLTEE Color System ──────────────────────────────────────────────
      // Derived from the financial precision aesthetic:
      // Deep navy authority + teal intelligence + semantic risk colors
      colors: {
        // Brand — Deep Navy
        navy: {
          950: "#05070F",
          900: "#0A0F1E",
          800: "#0D1320",
          700: "#111828",
          600: "#161E30",
          500: "#1C2438",
          400: "#243047",
          300: "#344059",
          200: "#4A587A",
          100: "#6B7FA0",
          50:  "#8B9BBF",
        },

        // Brand — Precision Teal (intelligence, accuracy)
        teal: {
          950: "#001A16",
          900: "#00332C",
          800: "#004D40",
          700: "#006655",
          600: "#008069",
          500: "#00997E",
          400: "#00B394",
          300: "#00CCAA",
          200: "#00D4AA",  // Primary accent
          100: "#4DE0C5",
          50:  "#99EDD9",
        },

        // Status — Optimal (green)
        optimal: {
          900: "#052E16",
          700: "#14532D",
          500: "#166534",
          400: "#15803D",
          300: "#16A34A",
          200: "#22C55E",
          100: "#4ADE80",
          50:  "#BBF7D0",
          bg:  "#052E16",
          border: "#166534",
          text: "#4ADE80",
          muted: "#22C55E",
        },

        // Status — Caution (amber)
        caution: {
          900: "#451A03",
          700: "#78350F",
          500: "#92400E",
          400: "#B45309",
          300: "#D97706",
          200: "#F59E0B",
          100: "#FCD34D",
          50:  "#FEF3C7",
          bg:  "#451A03",
          border: "#92400E",
          text: "#FCD34D",
          muted: "#F59E0B",
        },

        // Status — Suboptimal (red)
        suboptimal: {
          900: "#450A0A",
          700: "#7F1D1D",
          500: "#991B1B",
          400: "#B91C1C",
          300: "#DC2626",
          200: "#EF4444",
          100: "#FCA5A5",
          50:  "#FEE2E2",
          bg:  "#450A0A",
          border: "#991B1B",
          text: "#FCA5A5",
          muted: "#EF4444",
        },

        // Status — Negative Spread (deep crimson)
        negspread: {
          bg:  "#2D0A14",
          border: "#7C0B28",
          text: "#FF8FAB",
          muted: "#E8305A",
        },

        // Surface system (dark-first)
        surface: {
          base:    "#05070F",  // Page background
          raised:  "#0A0F1E",  // Cards, panels
          overlay: "#0D1320",  // Modals, dropdowns
          sunken:  "#070A15",  // Input backgrounds
          border:  "#1C2438",  // Default border
          muted:   "#243047",  // Muted border / dividers
        },

        // Text system
        ink: {
          primary:   "#F0F4FF",  // Main text
          secondary: "#8892A4",  // Muted text
          tertiary:  "#4A5568",  // Disabled / hints
          inverse:   "#0A0F1E",  // Text on light backgrounds
        },
      },

      // ─── Typography ──────────────────────────────────────────────────────
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
        display: ["var(--font-inter)", ...fontFamily.sans],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "Fira Code", ...fontFamily.mono],
      },

      fontSize: {
        "2xs":  ["10px", { lineHeight: "14px", letterSpacing: "0.05em" }],
        xs:     ["12px", { lineHeight: "16px", letterSpacing: "0.03em" }],
        sm:     ["13px", { lineHeight: "20px" }],
        base:   ["15px", { lineHeight: "24px" }],
        md:     ["16px", { lineHeight: "26px" }],
        lg:     ["18px", { lineHeight: "28px" }],
        xl:     ["21px", { lineHeight: "30px" }],
        "2xl":  ["24px", { lineHeight: "32px" }],
        "3xl":  ["30px", { lineHeight: "38px" }],
        "4xl":  ["36px", { lineHeight: "44px", letterSpacing: "-0.02em" }],
        "5xl":  ["48px", { lineHeight: "56px", letterSpacing: "-0.03em" }],
        "6xl":  ["60px", { lineHeight: "66px", letterSpacing: "-0.04em" }],
        "7xl":  ["72px", { lineHeight: "76px", letterSpacing: "-0.04em" }],
      },

      // ─── Spacing ──────────────────────────────────────────────────────────
      spacing: {
        "4.5":  "1.125rem",
        "13":   "3.25rem",
        "18":   "4.5rem",
        "22":   "5.5rem",
        "26":   "6.5rem",
        "30":   "7.5rem",
        "34":   "8.5rem",
        "100":  "25rem",
        "120":  "30rem",
        "140":  "35rem",
        "160":  "40rem",
      },

      // ─── Border Radius ────────────────────────────────────────────────────
      borderRadius: {
        "none": "0",
        "xs":   "3px",
        "sm":   "4px",
        "md":   "6px",
        "lg":   "8px",
        "xl":   "12px",
        "2xl":  "16px",
        "3xl":  "20px",
        "4xl":  "24px",
        "full": "9999px",
      },

      // ─── Box Shadows ──────────────────────────────────────────────────────
      // Dark-mode appropriate — subtle glow rather than hard drop shadows
      boxShadow: {
        "none":    "none",
        "card":    "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)",
        "panel":   "0 4px 16px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.4)",
        "modal":   "0 8px 32px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)",
        "teal-sm": "0 0 8px rgba(0,212,170,0.15)",
        "teal-md": "0 0 16px rgba(0,212,170,0.2)",
        "teal-lg": "0 0 32px rgba(0,212,170,0.25)",
        "optimal": "0 0 16px rgba(34,197,94,0.15)",
        "caution": "0 0 16px rgba(245,158,11,0.15)",
        "danger":  "0 0 16px rgba(239,68,68,0.15)",
        "inner":   "inset 0 1px 3px rgba(0,0,0,0.5)",
      },

      // ─── Animations ───────────────────────────────────────────────────────
      keyframes: {
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          "0%":   { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "count-up": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-teal": {
          "0%, 100%": { boxShadow: "0 0 8px rgba(0,212,170,0.1)" },
          "50%":       { boxShadow: "0 0 24px rgba(0,212,170,0.3)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "gauge-fill": {
          "0%":   { strokeDashoffset: "283" },
          "100%": { strokeDashoffset: "var(--target-offset)" },
        },
        "status-entrance": {
          "0%":   { opacity: "0", transform: "scale(0.9) translateY(-4px)" },
          "60%":  { transform: "scale(1.02) translateY(0)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
      animation: {
        "fade-in":        "fade-in 0.4s ease-out",
        "slide-up":       "slide-up 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-down":     "slide-down 0.3s ease-out",
        "scale-in":       "scale-in 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        "count-up":       "count-up 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
        "pulse-teal":     "pulse-teal 2.5s ease-in-out infinite",
        "shimmer":        "shimmer 2s linear infinite",
        "gauge-fill":     "gauge-fill 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "status-entrance":"status-entrance 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
      },

      // ─── Transitions ──────────────────────────────────────────────────────
      transitionTimingFunction: {
        "spring":   "cubic-bezier(0.22, 1, 0.36, 1)",
        "smooth":   "cubic-bezier(0.4, 0, 0.2, 1)",
        "entrance": "cubic-bezier(0.0, 0.0, 0.2, 1)",
      },

      // ─── Z-Index Scale ────────────────────────────────────────────────────
      zIndex: {
        "base":     "0",
        "raised":   "10",
        "dropdown": "100",
        "sticky":   "200",
        "overlay":  "300",
        "modal":    "400",
        "toast":    "500",
        "tooltip":  "600",
      },

      // ─── Background Images ────────────────────────────────────────────────
      backgroundImage: {
        // Subtle grid pattern for hero section
        "grid-navy": "radial-gradient(circle, rgba(28,36,56,0.8) 1px, transparent 1px)",
        // Teal glow gradient for accent elements
        "teal-glow": "radial-gradient(ellipse at center, rgba(0,212,170,0.15) 0%, transparent 70%)",
        // Shimmer for loading states
        "shimmer-dark": "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
      },

      backgroundSize: {
        "grid-24": "24px 24px",
      },
    },
  },

  plugins: [],
};

export default config;
