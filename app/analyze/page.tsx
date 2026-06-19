import type { Metadata } from "next";
import { AnalyzePageContent } from "@/components/pages/AnalyzePageContent";

export const metadata: Metadata = {
  title: "Analyze Your Leverage | OLTEE",
  description: "Run the OLTEE equation to determine your optimal leverage threshold.",
};

export default function AnalyzePage() {
  return <AnalyzePageContent />;
}
