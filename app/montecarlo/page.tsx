import type { Metadata } from "next";
import { MonteCarloPageContent } from "@/components/pages/MonteCarloPageContent";

export const metadata: Metadata = {
  title: "Monte Carlo Analysis | OLTEE",
  description: "Simulate thousands of futures to understand the probability your leverage stays productive.",
};

export default function MonteCarloPage() {
  return <MonteCarloPageContent />;
}
