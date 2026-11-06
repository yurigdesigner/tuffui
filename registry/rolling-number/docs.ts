import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { RollingNumber } from "@/components/ui/rolling-number";

<RollingNumber value={formatTokens(used)} className="font-mono text-2xl" />
<RollingNumber value={cost} format={(n) => \`$\${n.toFixed(2)}\`} />`,
  props: [
    {
      name: "value",
      type: "number | string",
      required: true,
      description: 'A number, or a preformatted string like "87.2k". Only digits roll.',
    },
    {
      name: "format",
      type: "(value: number) => string",
      description: "Formats a numeric value; defaults to en-US grouping.",
    },
    {
      name: "stagger",
      type: "number",
      default: "24",
      description: "Delay between neighbouring digits, right to left, in ms.",
    },
    {
      name: "className",
      type: "string",
      description: "Typography is inherited; tabular figures are applied.",
    },
  ],
};
