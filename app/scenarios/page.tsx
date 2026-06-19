import type { Metadata } from "next";
import { ScenariosPageContent } from "@/components/pages/ScenariosPageContent";

export const metadata: Metadata = {
  title: "Scenario Lab | OLTEE",
  description: "Simulate market changes and their impact on your safe leverage threshold.",
};

export default function ScenariosPage() {
  return <ScenariosPageContent />;
}
