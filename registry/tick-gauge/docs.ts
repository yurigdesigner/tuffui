import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { StatusPill } from "@/components/ui/status-pill";
import { TickGauge } from "@/components/ui/tick-gauge";

export function SuccessRate({ ok, total }: { ok: number; total: number }) {
  const rate = ok / total;
  return (
    <TickGauge
      title="Tool call success"
      subtitle="warehouse.query · last 24 h"
      value={rate}
      target={0.99}
      targetLabel="SLO 99%"
      caption={\`\${total - ok} of \${total} failed\`}
      aside={<StatusPill tone={rate >= 0.99 ? "positive" : "negative"}>{rate >= 0.99 ? "Within SLO" : "Below SLO"}</StatusPill>}
    />
  );
}`,
  props: [
    { name: "value", type: "number", required: true, description: "Current value, 0–1." },
    { name: "title", type: "string", required: true, description: "Header title." },
    { name: "subtitle", type: "string", description: "Secondary line under the title." },
    {
      name: "target",
      type: "number",
      description: "Goal, 0–1. Ticks between the value and the target turn red.",
    },
    {
      name: "targetLabel",
      type: "string",
      description: "Label under the right end of the arc.",
    },
    { name: "caption", type: "string", description: "Line under the big number." },
    {
      name: "format",
      type: "(value: number) => string",
      description: "Formats the big number. Defaults to a percent with one decimal.",
    },
    {
      name: "ticks",
      type: "number",
      default: "44",
      description: "Number of ticks on the arc.",
    },
    {
      name: "aside",
      type: "ReactNode",
      description: "Right side of the header, e.g. a status pill.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `// Exposed as role="meter" with the value, caption and target in aria-valuetext.
// Ticks fill in order on mount; later values recolor them in place.`,
};
