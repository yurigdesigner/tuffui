import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { StatGrid } from "@/components/ui/stat-grid";

// A summary answer: the agent fetched metrics and shows the headline numbers.
export function MetricsAnswer({ m }: { m: Metrics }) {
  return (
    <StatGrid
      title="October at a glance"
      data={[
        { id: "mrr", label: "MRR", value: formatMoney(m.mrr), delta: m.mrrDelta, trend: m.mrrTrend },
        {
          id: "latency",
          label: "Median response time",
          value: \`\${m.p50}s\`,
          delta: m.p50Delta,
          higherIsBetter: false, // a drop is good news
        },
      ]}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "Stat[]",
      required: true,
      description:
        "Two to four stats. Values are preformatted strings and roll when they change.",
    },
    { name: "title", type: "string", description: "Optional header above the cards." },
    { name: "subtitle", type: "string", description: "Secondary line under the title." },
    {
      name: "sparklines",
      type: "boolean",
      default: "true",
      description: "Draw a trend line for stats that carry `trend`.",
    },
    {
      name: "onSelect",
      type: "(stat: Stat) => void",
      description: "Makes each card a button, e.g. to open a chart for that metric.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type Stat = {
  id: string;
  label: string;
  value: string;            // "$48.2k", "1,204", "1.31s"
  delta?: number;           // % change; shown with an arrow and better/worse text
  higherIsBetter?: boolean; // default true; set false for latency, churn, cost
  trend?: number[];         // oldest first
  goal?: { ratio: number; label: string }; // striped progress toward a target
  hint?: string;            // e.g. "vs. last week"
};`,
};
