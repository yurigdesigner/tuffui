import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { Tooltip } from "@/components/ui/tooltip-hint";

<Tooltip content="Regenerate">
  <IconButton icon={ArrowClockwise} label="Regenerate" />
</Tooltip>`,
  props: [
    { name: "content", type: "ReactNode", required: true, description: "Tooltip text." },
    {
      name: "children",
      type: "ReactElement",
      required: true,
      description: "One focusable trigger; it gets aria-describedby while open.",
    },
    {
      name: "side",
      type: '"top" | "bottom"',
      default: '"top"',
      description: "Which side of the trigger.",
    },
    {
      name: "align",
      type: '"start" | "center" | "end"',
      default: '"center"',
      description: "Alignment; the tooltip scales from that corner.",
    },
    {
      name: "delay",
      type: "number",
      default: "300",
      description: "First-hover delay in ms. Focus and warm hovers open instantly.",
    },
  ],
};
