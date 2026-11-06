import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ChartCard } from "@/components/ui/chart-card";

// Render a chart when a tool returns a time series.
export function SignupsAnswer({ result }: { result: SignupsResult }) {
  return (
    <ChartCard
      type="bar"
      title="Weekly signups"
      subtitle="Self-serve vs. sales-led"
      total={result.total.toLocaleString()}
      partialLast // the current week isn't over
      data={{
        labels: result.weeks,
        series: [
          { id: "self", label: "Self-serve", values: result.selfServe },
          { id: "sales", label: "Sales-led", values: result.salesLed },
        ],
      }}
      onSelect={(index) => console.log(result.weeks[index])}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "{ labels: string[]; series: ChartSeries[] }",
      required: true,
      description:
        "One label per point and up to four series. Series keep their color when others are toggled off.",
    },
    {
      name: "type",
      type: '"bar" | "line" | "area" | "donut"',
      default: '"bar"',
      description:
        "Grouped bars, lines, filled areas, or a donut where each series is one slice.",
    },
    {
      name: "title",
      type: "string",
      required: true,
      description: "Header title, also the chart's accessible name.",
    },
    { name: "subtitle", type: "string", description: "Secondary line under the title." },
    {
      name: "total",
      type: "string",
      description: "Headline value in the header; rolls when it changes.",
    },
    {
      name: "format",
      type: "(value: number) => string",
      description:
        "Formats axis ticks, tooltip values and the donut center. Defaults to 1.2k / 3.4M.",
    },
    {
      name: "partialLast",
      type: "boolean",
      default: "false",
      description: "Stripes the last bar, for a period that is still in progress.",
    },
    {
      name: "onSelect",
      type: "(index: number) => void",
      description:
        "Called when a point or slice is hovered, clicked or reached with the arrow keys.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type ChartSeries = {
  id: string;
  label: string;
  values: number[]; // one per label; a donut slice is their sum
  color?: string;   // defaults to blue, teal, purple, ochre by position
};

// Keyboard: focus the chart, then ← → Home End move between points, Esc clears.
// Screen readers get a summary label and a hidden data table.`,
};
