import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { IsoBars } from "@/components/ui/iso-bars";

export function DailyTokens({ usage }: { usage: DailyUsage }) {
  return (
    <IsoBars
      title="Daily tokens"
      subtitle="Last 14 days"
      labels={usage.days} // "Oct 23" … "Nov 5"
      back={[
        { id: "input", label: "Input", values: usage.input },
        { id: "cached", label: "Cached", values: usage.cached },
        { id: "output", label: "Output", values: usage.output },
      ]}
      front={[
        { id: "failed", label: "Failed", values: usage.failed },
        { id: "retried", label: "Retried", values: usage.retried },
      ]}
      aside={{ value: "18.4M", caption: "tokens", flag: "failed 1.9%" }}
      onSelect={({ row, index }) => openDay(usage.days[index], row)}
    />
  );
}`,
  props: [
    {
      name: "labels",
      type: "string[]",
      required: true,
      description: "One label per period, drawn along the front edge of the floor.",
    },
    {
      name: "back",
      type: "IsoSeries[]",
      required: true,
      description: "The main stack, drawn as the back row. Series stack upward in order.",
    },
    {
      name: "front",
      type: "IsoSeries[]",
      description:
        "A smaller stack in front, e.g. rework or failures. Shares the back row's scale and defaults to warning and negative colors.",
    },
    { name: "title", type: "string", required: true, description: "Header title." },
    { name: "subtitle", type: "string", description: "Secondary line under the title." },
    {
      name: "aside",
      type: '{ value: string; caption?: string; flag?: string; tone?: "warning" | "negative" }',
      description: "Headline in the header. The flag sits under it in the tone color.",
    },
    {
      name: "format",
      type: "(value: number) => string",
      description: "Formats values in the tooltip and the table. Defaults to 1.2k.",
    },
    {
      name: "onSelect",
      type: '(point: { row: "back" | "front"; index: number }) => void',
      description:
        "Called when a prism is hovered, clicked or reached with the arrow keys.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type IsoSeries = {
  id: string;
  label: string;
  values: number[]; // one per period
  color?: string;   // faces are shaded from it with color-mix
};`,
};
