import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { Brain } from "@phosphor-icons/react";
import { Inset, Panel, Shell, ShellHeader } from "@/components/ui/surface";

export function MemoryCard() {
  return (
    <Shell className="max-w-md">
      <ShellHeader icon={Brain} title="Memory" subtitle="5 memories" />
      <Panel className="p-4">
        <Inset className="px-3.5 py-3 font-mono text-xs">AGENTS.md</Inset>
      </Panel>
    </Shell>
  );
}`,
  props: [
    {
      name: "Shell",
      type: "<section>",
      description: "Outer frame: rounded-[1.375rem] bg-surface p-1.5.",
    },
    {
      name: "Panel",
      type: "<div>",
      description: "Content area inside a shell: rounded-2xl bg-surface-inset.",
    },
    {
      name: "Inset",
      type: "<div>",
      description: "Deeper block inside a panel: rounded-xl bg-foreground/[0.04].",
    },
    {
      name: "IconTile",
      type: "{ icon?: Icon } & <div>",
      description: "Tinted 36px square holding a filled Phosphor icon, or children.",
    },
    {
      name: "ShellHeader.icon",
      type: "Icon",
      description: "Phosphor icon shown in an IconTile, 12px from the shell edge.",
    },
    {
      name: "ShellHeader.title",
      type: "ReactNode",
      required: true,
      description: "Header title.",
    },
    {
      name: "ShellHeader.subtitle",
      type: "ReactNode",
      description: "Secondary line under the title.",
    },
    {
      name: "ShellHeader.aside",
      type: "ReactNode",
      description: "Right side — a stat, pill or actions, vertically centered.",
    },
    {
      name: "ShellHeader.as",
      type: '"h2" | "h3" | "h4"',
      default: '"h3"',
      description: "Heading level of the title.",
    },
  ],
};
