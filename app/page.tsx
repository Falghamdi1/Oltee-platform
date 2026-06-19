import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { APP } from "@/config/constants";

export const metadata: Metadata = {
  title: `${APP.name} — ${APP.tagline}`,
  description: APP.description,
};

export default function LandingPage() {
  return (
    <main style={{minHeight:"100vh",background:"var(--bg,#06080F)",color:"var(--text-1,#F5F8FF)",fontFamily:"system-ui,sans-serif"}}>
      <Navigation />
      <Hero />
      <Features />
      <Footer />
    </main>
  );
}
