import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { Spinner, Thinking } from "@/components/ui/loader";

<Spinner label="Loading history" showLabel />
<Thinking words={["Thinking", "Searching", "Writing"]} />`,
  props: [
    {
      name: "size",
      type: '"sm" | "md" | "lg"',
      default: '"md"',
      description: "Spinner and Thinking size.",
    },
    {
      name: "label",
      type: "string",
      default: '"Loading" / "Thinking"',
      description:
        'Spoken label, also the Spinner\'s visible text with showLabel. Thinking defaults to "Thinking" and speaks it when no words are shown.',
    },
    {
      name: "showLabel",
      type: "boolean",
      default: "false",
      description: "Spinner: show the label next to the ring.",
    },
    {
      name: "words",
      type: "string[]",
      default: "[]",
      description:
        "Thinking: verbs to cycle through next to the dots. Each swaps in from below.",
    },
    {
      name: "interval",
      type: "number",
      default: "1800",
      description: "Thinking: ms per word.",
    },
  ],
};
