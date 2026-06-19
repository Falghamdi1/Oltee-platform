import type { Metadata } from "next";
import { ReportPageContent } from "@/components/pages/ReportPageContent";

export const metadata: Metadata = {
  title: "Download Report | OLTEE",
  description: "Generate a professional PDF report of your OLTEE analysis.",
};

export default function ReportPage() {
  return <ReportPageContent />;
}
