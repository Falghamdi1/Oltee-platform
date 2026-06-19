// ═══════════════════════════════════════════════════════════════════════════
// OLTEE — Root Layout
// Wraps the entire app in OLTEEProvider so state persists across page navigation.
// ═══════════════════════════════════════════════════════════════════════════

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { APP } from "@/config/constants";
import { OLTEEProvider } from "@/lib/context";

// ─── Font Loading ─────────────────────────────────────────────────────────────

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: `${APP.name} — ${APP.fullName}`,
    template: `%s | ${APP.name}`,
  },
  description: APP.description,
  keywords: [
    "leverage analysis",
    "optimal leverage threshold",
    "debt ratio calculator",
    "financial intelligence",
    "Islamic finance",
    "Saudi Arabia",
    "SAR",
    "investment debt analysis",
    "Faisal Alghamdi",
  ],
  authors: [{ name: APP.engineer }],
  creator: APP.engineer,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_SA",
    url: APP.url,
    title: APP.name,
    description: APP.tagline,
    siteName: APP.fullName,
  },
  twitter: {
    card: "summary_large_image",
    title: APP.name,
    description: APP.tagline,
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0F1E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-surface-base text-ink-primary antialiased">
        {/*
          OLTEEProvider persists state across all pages:
          /analyze → /scenarios → /montecarlo → /report
          No re-fetch when navigating back.
        */}
        <OLTEEProvider>
          {children}
        </OLTEEProvider>
      </body>
    </html>
  );
}
