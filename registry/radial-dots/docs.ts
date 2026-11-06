import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { RadialDots } from "@/components/ui/radial-dots";

export function RunsByHour({ stats }: { stats: HourlyStats }) {
  return (
    <RadialDots
      title="Runs by hour"
      subtitle="Last 7 days, UTC"
      labels={stats.hours} // "00" … "23"
      series={[
        { id: "people", label: "Started by people", values: stats.manual },
        { id: "scheduled", label: "Scheduled", values: stats.scheduled },
      ]}
      center={{ value: \`\${stats.medianSeconds} s\`, caption: "per run" }}
      onSelect={(hour) => filterRuns(hour)}
    />
  );
}`,
  props: [
    {
      name: "labels",
      type: "string[]",
      required: true,
      description: "One label per sector, clockwise from the top.",
    },
    {
      name: "series",
      type: "RadialSeries[]",
      required: true,
      description: "Stacked outward in order. The busiest sector fills every ring.",
    },
    { name: "title", type: "string", required: true, description: "Header title." },
    { name: "subtitle", type: "string", description: "Secondary line under the title." },
    {
      name: "center",
      type: "{ value: string; caption?: string }",
      required: true,
      description:
        "Headline in the middle. Hovering a sector shows its numbers there instead.",
    },
    {
      name: "axis",
      type: "number[]",
      description:
        "Indexes of the labels drawn around the edge. Defaults to the four quarters.",
    },
    {
      name: "format",
      type: "(value: number) => string",
      description: "Formats sector values. Defaults to 1,234.",
    },
    {
      name: "onSelect",
      type: "(index: number) => void",
      description: "Called when a sector is hovered or reached with the arrow keys.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type RadialSeries = {
  id: string;
  label: string;
  values: number[]; // one per sector
  color?: string;   // defaults to brand, foreground, muted
};`,
};
