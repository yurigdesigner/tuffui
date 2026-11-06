import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { SearchField, TextArea, TextField } from "@/components/ui/text-field";

<SearchField value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery("")} />
<TextField label="Agent name" description="Shown in traces." error={nameError} />
<TextArea label="Instructions" rows={4} />`,
  props: [
    {
      name: "label",
      type: "ReactNode",
      description: "Visible label, linked to the control.",
    },
    {
      name: "description",
      type: "ReactNode",
      description: "Help text, linked with aria-describedby.",
    },
    {
      name: "error",
      type: "ReactNode",
      description:
        "Error text; marks the control aria-invalid and replaces the description.",
    },
    {
      name: "SearchField.onClear",
      type: "() => void",
      description: "Shows a clear button while there is text.",
    },
    {
      name: "...rest",
      type: "<input> / <textarea> props",
      description: "Passed to the native control.",
    },
  ],
};
