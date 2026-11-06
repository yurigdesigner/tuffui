import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/tab-panels";

<Tabs defaultValue="answer" variant="pills">
  <TabList label="Response">
    <Tab value="answer">Answer</Tab>
    <Tab value="sources" count={sources.length}>Sources</Tab>
  </TabList>
  <TabPanel value="answer">{answer}</TabPanel>
  <TabPanel value="sources" lazy>
    <SourceList data={{ sources }} />
  </TabPanel>
</Tabs>`,
  props: [
    {
      name: "Tabs.value / defaultValue",
      type: "string",
      required: true,
      description: "Selected tab. `defaultValue` is required for the uncontrolled case.",
    },
    {
      name: "Tabs.onValueChange",
      type: "(value: string) => void",
      description: "Called on click or, with automatic activation, on arrow keys.",
    },
    {
      name: "Tabs.variant",
      type: '"default" | "pills"',
      default: '"default"',
      description: "A short bar under the active tab, or a raised pill behind it.",
    },
    {
      name: "Tabs.activation",
      type: '"automatic" | "manual"',
      default: '"automatic"',
      description:
        "Automatic selects as focus moves; manual moves focus only, Enter or Space selects.",
    },
    {
      name: "TabList.label",
      type: "string",
      required: true,
      description: "Accessible name of the tab list.",
    },
    {
      name: "Tab.count",
      type: "number",
      description: "Small count after the label.",
    },
    {
      name: "TabPanel.lazy",
      type: "boolean",
      default: "false",
      description:
        "Mount the panel the first time it's selected; it stays mounted after.",
    },
  ],
};
