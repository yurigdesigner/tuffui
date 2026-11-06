import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { Accordion, Collapsible } from "@/components/ui/disclosure";

<Accordion
  type="multiple"
  items={steps.map((s) => ({ id: s.id, title: s.title, meta: s.duration, content: s.output }))}
/>

<Collapsible title="Thought for 6s" defaultOpen={false}>
  {reasoning}
</Collapsible>`,
  props: [
    {
      name: "Accordion.items",
      type: "AccordionItem[]",
      required: true,
      description: "Sections in order: id, title, optional icon and meta, content.",
    },
    {
      name: "Accordion.type",
      type: '"single" | "multiple"',
      default: '"single"',
      description: "Single keeps at most one section open.",
    },
    {
      name: "Accordion.value / defaultValue / onValueChange",
      type: "string[]",
      description: "Ids of open sections, controlled or not.",
    },
    {
      name: "Collapsible.open / defaultOpen / onOpenChange",
      type: "boolean",
      description: "Open state of the single section.",
    },
    {
      name: "title / icon / meta",
      type: "ReactNode / Icon / ReactNode",
      description: "Header row: title, a filled Phosphor icon and right-aligned meta.",
    },
  ],
  types: `type AccordionItem = {
  id: string;
  title: ReactNode;
  icon?: Icon; // Phosphor
  meta?: ReactNode;
  content: ReactNode;
  disabled?: boolean;
};`,
};
