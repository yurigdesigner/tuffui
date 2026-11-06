import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { Select, Combobox } from "@/components/ui/select-field";

<Select
  label="Model"
  value={model}
  onValueChange={setModel}
  options={[
    { label: "Anthropic", options: [
      { value: "opus", label: "opus-5.5", icon: Brain, description: "Deep reasoning" },
      { value: "sonnet", label: "sonnet-5.5", icon: Cpu },
    ] },
  ]}
/>

<Combobox
  label="Tool"
  options={results}
  loading={searching}
  onQueryChange={search}   // filter on the server; omit to filter by label
  onValueChange={setTool}
/>`,
  props: [
    {
      name: "options",
      type: "SelectOption[] | SelectGroup[]",
      required: true,
      description: "Flat options or labelled groups (Combobox takes a flat list).",
    },
    {
      name: "value / defaultValue / onValueChange",
      type: "string",
      description: "Selected value. Combobox passes null when cleared.",
    },
    {
      name: "label / description / error",
      type: "ReactNode",
      description: "Field label, help text and error, wired like TextField.",
    },
    { name: "placeholder", type: "string", description: "Shown with no value." },
    {
      name: "onQueryChange",
      type: "(query: string) => void",
      description:
        "Combobox. Called as the user types; when set, options are shown as given.",
    },
    {
      name: "loading / emptyText",
      type: "boolean / string",
      description: "Combobox. Spinner while searching and the no-results line.",
    },
    {
      name: "name / required / disabled",
      type: "string / boolean / boolean",
      description: "Select. Form integration.",
    },
  ],
  types: `type SelectOption = { value: string; label: string; icon?: Icon; description?: string; disabled?: boolean };
type SelectGroup = { label?: string; options: SelectOption[] };`,
};
