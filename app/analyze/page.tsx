import type { Metadata } from "next";
import { Suspense } from "react";
import { AnalyzePageContent } from "@/components/pages/AnalyzePageContent";

export const metadata: Metadata = {
  title: "Analyze Your Leverage | OLTEE",
  description: "Run the OLTEE equation to determine your optimal leverage threshold.",
};

export default function AnalyzePage() {
  return (
    <Suspense 
      fallback={
        <div style={{ padding: "40px", textAlign: "center", color: "rgba(245,248,255,0.45)" }}>
          Loading analysis...
        </div>
      }
    >
      <AnalyzePageContent />
    </Suspense>
  );
}
