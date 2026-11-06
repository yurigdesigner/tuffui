import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { DivergingBars } from "@/components/ui/diverging-bars";

// A security agent's month: alerts by source, escalations hanging below.
export function TriageVolume({ report }: { report: TriageReport }) {
  return (
    <DivergingBars
      title="Alerts by source"
      subtitle="Security agent · last 30 days"
      labels={report.days.map((d) => d.label)}
      series={report.sources.map((s) => ({
        id: s.id,
        label: s.name,
        values: report.days.map((d) => d.bySource[s.id] ?? 0),
      }))}
      below={{
        id: "escalated",
        label: "Escalated",
        values: report.days.map((d) => d.escalated),
      }}
      headline={{
        value: report.total.toLocaleString("en-US"),
        caption: "alerts triaged in 30 days",
      }}
      aside={\`\${report.autoClosedPct}% closed without a human\`}
      onSelect={(i) => openDay(report.days[i].date)}
    />
  );
}`,
  props: [
    {
      name: "labels",
      type: "string[]",
      required: true,
      description:
        "One label per column, e.g. a date. Every few are drawn under the chart.",
    },
    {
      name: "series",
      type: "DivergingSeries[]",
      required: true,
      description:
        "Stacked upward as separate segments, first series at the bottom. Colors default to the palette by position.",
    },
    {
      name: "below",
      type: "DivergingSeries",
      description:
        "One series that hangs below the zero line on its own smaller scale. Defaults to the negative color.",
    },
    { name: "title", type: "string", required: true, description: "Header title." },
    { name: "subtitle", type: "string", description: "Secondary line under the title." },
    {
      name: "headline",
      type: "{ value: string; caption?: string }",
      description: "Big number above the chart with a caption. Rolls when it changes.",
    },
    {
      name: "aside",
      type: "ReactNode",
      description: "Right side of the headline row, e.g. a secondary stat.",
    },
    {
      name: "format",
      type: "(value: number) => string",
      default: "compact (1.2k)",
      description: "Formats ticks, the tooltip and the hidden table.",
    },
    {
      name: "onSelect",
      type: "(index: number) => void",
      description:
        "Called when a column is hovered, clicked or reached with the arrow keys.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type DivergingSeries = {
  id: string;
  label: string;
  values: number[]; // one per label
  color?: string; // any CSS color
};

// Legend chips toggle series; at least one stacked series stays on.
// The tooltip total is the stack; the series below is listed but not added in.`,
};
