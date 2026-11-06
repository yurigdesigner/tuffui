import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { UsageSummary } from "@/components/ui/usage-summary";

export function Billing({ report }: { report: UsageReport }) {
  return (
    <UsageSummary
      data={{
        models: [
          { id: "opus", name: "Claude Opus 5.5" },
          { id: "sonnet", name: "Claude Sonnet 5.5" },
        ],
        // One entry per day: { date: "2026-11-03", byModel: { opus: { tokens, cost } } }
        days: report.days,
        previousCost: report.previousPeriodCost,
        budget: { limit: 500, label: "Monthly budget" },
      }}
      currency="USD"
      onSelectDay={(day) => router.push(\`/usage/\${day.date}\`)}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "{ days: UsageDay[]; models: UsageModel[]; previousCost?: number; budget?: { limit: number; label?: string } }",
      required: true,
      description:
        "One entry per day with tokens and cost per model. previousCost adds a delta pill; budget adds a budget bar.",
    },
    {
      name: "currency",
      type: "string",
      default: '"USD"',
      description: "ISO 4217 code used to format costs.",
    },
    {
      name: "warnAt",
      type: "number",
      default: "0.8",
      description: "Share of the budget past which the budget bar turns into a warning.",
    },
    {
      name: "onSelectDay",
      type: "(day: UsageDay) => void",
      description: "Called when a bar is clicked or activated with Enter / Space.",
    },
    {
      name: "title",
      type: "string",
      default: '"Usage"',
      description: "Heading and accessible name of the card.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type UsageModel = {
  id: string;
  name: string;
  color?: string; // any CSS color; defaults to the built-in palette
};

type UsageDay = {
  date: string; // ISO date, e.g. "2026-11-03"
  byModel: Record<string, { tokens: number; cost: number }>;
};`,
};
