import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { DotHistogram } from "@/components/ui/dot-histogram";

// Show how response times spread when the agent reports on recent runs.
export function LatencyAnswer({ runs }: { runs: Run[] }) {
  return (
    <DotHistogram
      title="Response time"
      subtitle={\`Last \${runs.length} runs · timeout 15 s\`}
      values={runs.map((r) => r.seconds)}
      threshold={15}
      thresholdLabel="timed out"
      unit="runs"
      format={(v) => \`\${+v.toFixed(1)}s\`}
      onSelect={(bin) => openRuns(bin.from, bin.to)}
    />
  );
}`,
  props: [
    {
      name: "values",
      type: "number[]",
      required: true,
      description:
        "Raw samples. The component bins them and works out the median and p95.",
    },
    { name: "title", type: "string", required: true, description: "Header title." },
    { name: "subtitle", type: "string", description: "Secondary line under the title." },
    {
      name: "threshold",
      type: "number",
      description: "Samples at or above it are drawn red and counted in the footer.",
    },
    {
      name: "thresholdLabel",
      type: "string",
      default: '"over limit"',
      description: "What a flagged sample means, e.g. “timed out”.",
    },
    { name: "bins", type: "number", default: "48", description: "Number of columns." },
    {
      name: "unit",
      type: "string",
      default: '"samples"',
      description: "Plural name for one sample, used in the header, tooltip and footer.",
    },
    {
      name: "format",
      type: "(value: number) => string",
      description: "Formats axis labels, the median, p95 and tooltip ranges.",
    },
    {
      name: "onSelect",
      type: "(bin: DotHistogramBin) => void",
      description: "Called when a column is hovered or reached with the arrow keys.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type DotHistogramBin = { from: number; to: number; count: number; flagged: boolean };

// Tall columns switch to one dot per group ("1 dot = 3 runs") so the chart keeps its height.
// Keyboard: focus the chart, then ← → Home End move between filled columns, Esc clears.`,
};
