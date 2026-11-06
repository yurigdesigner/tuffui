import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { Check, Trash } from "@phosphor-icons/react";
import { Button, IconButton } from "@/components/ui/action-button";

<Button variant="primary" icon={Check} iconWeight="bold" onClick={approve}>
  Approve
</Button>
<Button variant="secondary" loading={saving}>Save</Button>
<IconButton icon={Trash} label="Delete" variant="danger" onClick={remove} />`,
  props: [
    {
      name: "variant",
      type: '"primary" | "secondary" | "quiet" | "danger"',
      default: '"secondary"',
      description: "Primary is the silver gradient; use one per view.",
    },
    {
      name: "size",
      type: '"sm" | "md"',
      default: '"sm"',
      description: "Height 32px or 36px.",
    },
    { name: "icon", type: "Icon", description: "Leading Phosphor icon." },
    {
      name: "iconWeight",
      type: '"fill" | "bold"',
      default: '"fill"',
      description: "Use bold for line glyphs like check, x and arrows.",
    },
    {
      name: "loading",
      type: "boolean",
      default: "false",
      description: "Swaps the icon for a spinner and disables the button.",
    },
    {
      name: "IconButton.label",
      type: "string",
      required: true,
      description:
        "Accessible name of an icon-only button; also its native title unless `tooltip` is set.",
    },
    {
      name: "IconButton.tooltip",
      type: "ReactNode | true",
      description:
        "Shows our Tooltip instead of the native title. `true` reuses the label. Wrapping an IconButton in Tooltip also drops the title.",
    },
    {
      name: "IconButton.tooltipSide / tooltipAlign",
      type: '"top" | "bottom" / "start" | "center" | "end"',
      default: '"top" / "center"',
      description: "Where the tooltip sits relative to the button.",
    },
  ],
};
