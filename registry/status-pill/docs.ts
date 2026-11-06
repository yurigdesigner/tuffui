import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { CheckCircle } from "@phosphor-icons/react";
import { StatusPill, Tag } from "@/components/ui/status-pill";

<StatusPill tone="positive" icon={CheckCircle}>Done</StatusPill>
<StatusPill tone="brand">Running</StatusPill>
<Tag>opus-5.5</Tag>`,
  props: [
    {
      name: "tone",
      type: '"neutral" | "brand" | "positive" | "negative" | "warning"',
      default: '"neutral"',
      description: "Tinted background and text color. Always pair with text.",
    },
    {
      name: "size",
      type: '"sm" | "md"',
      default: '"md"',
      description: "20px or 24px tall.",
    },
    { name: "icon", type: "Icon", description: "Leading Phosphor icon." },
    {
      name: "iconWeight",
      type: '"fill" | "bold"',
      default: '"fill"',
      description: "Bold for line glyphs.",
    },
  ],
};
