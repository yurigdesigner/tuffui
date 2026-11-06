"use client";

import { Robot } from "@phosphor-icons/react";
import { MatchField, type MatchItem } from "./match-field";

const candidates: MatchItem[] = [
  { id: "lh", name: "Lena Hoffmann", sector: 0, score: 0.96 },
  { id: "dp", name: "Dev Patel", sector: 0, score: 0.62 },
  { id: "mk", name: "Malik Kaya", sector: 1, score: 0.91 },
  { id: "sn", name: "Sara Nilsson", sector: 1, score: 0.6 },
  { id: "ab", name: "Ana Bento", sector: 2, score: 0.77 },
  { id: "tw", name: "Tom Walsh", sector: 2, score: 0.52 },
  { id: "jr", name: "Julia Roth", sector: 3, score: 0.78 },
  { id: "yo", name: "Yuki Ono", sector: 2, score: 0.58 },
];

const bots: MatchItem[] = [
  { id: "billing", name: "billing-agent", initials: "BA", sector: 0, score: 0.94 },
  { id: "refunds", name: "refunds-bot", initials: "RF", sector: 0, score: 0.71 },
  { id: "triage", name: "support-triage", initials: "ST", sector: 1, score: 0.88 },
  { id: "faq", name: "help-center", initials: "HC", sector: 1, score: 0.58 },
  { id: "fraud", name: "risk-review", initials: "RR", sector: 2, score: 0.76 },
  { id: "sdr", name: "sales-assist", initials: "SA", sector: 3, score: 0.46 },
];

export default function MatchFieldDemo({
  variant = "Candidates",
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  return variant === "Bots" ? (
    <MatchField
      title="Best bot for this request"
      subtitle="“I was charged twice for March”"
      sectors={["Billing", "Support", "Risk", "Sales"]}
      items={bots}
      rings={[0.5, 0.7, 0.9]}
      threshold={0.85}
      icon={Robot}
    />
  ) : (
    <MatchField
      title="Senior product designer"
      subtitle="148 applicants · ranked by fit"
      sectors={["Design systems", "Fintech", "Consumer apps", "Agency"]}
      items={candidates}
    />
  );
}
