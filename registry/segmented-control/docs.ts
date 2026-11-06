import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { Segmented } from "@/components/ui/segmented-control";

<Segmented
  label="Mode"
  value={mode}
  onValueChange={setMode}
  options={[
    { value: "ask", label: "Ask" },
    { value: "plan", label: "Plan" },
    { value: "act", label: "Act" },
  ]}
/>`,
  props: [
    {
      name: "options",
      type: "{ value: T; label: ReactNode; disabled?: boolean }[]",
      required: true,
      description: "Segments in order.",
    },
    {
      name: "value / defaultValue",
      type: "T",
      description: "Selected segment; defaults to the first.",
    },
    {
      name: "onValueChange",
      type: "(value: T) => void",
      description: "Called on click or arrow keys.",
    },
    {
      name: "label",
      type: "string",
      required: true,
      description: "Accessible name of the radiogroup.",
    },
    {
      name: "size",
      type: '"sm" | "md"',
      default: '"sm"',
      description: "32px or 36px tall.",
    },
  ],
};
