import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { Checkbox, Radio, RadioGroup, Switch } from "@/components/ui/choice-controls";

<Switch label="Web search" checked={web} onCheckedChange={setWeb} />
<Checkbox label="Remember this choice" checked={remember} onCheckedChange={setRemember} />
<RadioGroup label="Reasoning effort" value={effort} onValueChange={setEffort}>
  <Radio value="low" label="Low" />
  <Radio value="high" label="High" description="Thinks longer on hard tasks" />
</RadioGroup>`,
  props: [
    {
      name: "checked / defaultChecked",
      type: 'boolean (Checkbox: | "mixed")',
      description: "Controlled or uncontrolled state.",
    },
    {
      name: "onCheckedChange",
      type: "(checked: boolean) => void",
      description: "Called on toggle.",
    },
    {
      name: "label",
      type: "ReactNode",
      description: "Visible label; clicking it toggles. Without it, pass aria-label.",
    },
    {
      name: "description",
      type: "ReactNode",
      description: "Secondary line under the label.",
    },
    {
      name: "RadioGroup.value / defaultValue",
      type: "string",
      description: "Selected radio.",
    },
    {
      name: "RadioGroup.onValueChange",
      type: "(value: string) => void",
      description: "Called when a radio is picked by click or arrow keys.",
    },
    {
      name: "RadioGroup.label",
      type: "string",
      required: true,
      description: "Accessible name of the group.",
    },
  ],
};
