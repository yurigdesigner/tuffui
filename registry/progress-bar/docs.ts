import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ProgressBar, SegmentedBar } from "@/components/ui/progress-bar";

<ProgressBar
  label="Requests left"
  kind="meter"
  value={limit.remaining}
  max={limit.limit}
  tone={limit.remaining < limit.limit * 0.2 ? "warning" : "brand"}
  striped
/>

<SegmentedBar
  label="Context window"
  max={200_000}
  segments={[{ id: "chat", label: "Conversation", value: 52_000, color: "var(--brand)" }]}
/>`,
  props: [
    { name: "value", type: "number", required: true, description: "Current value." },
    { name: "max", type: "number", default: "100", description: "Upper bound." },
    {
      name: "tone",
      type: '"brand" | "positive" | "negative" | "warning" | "neutral"',
      default: '"brand"',
      description: "Fill color.",
    },
    {
      name: "color",
      type: "string",
      description:
        "Any CSS color for the fill. Overrides `tone`, e.g. a per-series color.",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg"',
      default: '"md"',
      description: "6, 8 or 12px tall.",
    },
    {
      name: "striped",
      type: "boolean",
      default: "false",
      description:
        "Diagonal stripes on the fill; revealed with clip-path so they never stretch.",
    },
    {
      name: "kind",
      type: '"progress" | "meter"',
      default: '"progress"',
      description: "progressbar for work toward done, meter for a level.",
    },
    { name: "label", type: "string", required: true, description: "Accessible name." },
    {
      name: "valueText",
      type: "string",
      description: "Spoken value; defaults to a percentage.",
    },
    {
      name: "SegmentedBar.segments",
      type: "{ id, label, value, color }[]",
      required: true,
      description: "Stacked segments in order.",
    },
  ],
};
