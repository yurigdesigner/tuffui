import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { PromptSuggestions } from "@/components/ui/prompt-suggestions";
import { ChartBar, Globe } from "@phosphor-icons/react";

// Empty chat
<PromptSuggestions
  heading="What should we work on?"
  data={[
    { id: "i18n", icon: Globe, title: "Localize the onboarding flow", hint: "German and Japanese" },
    { id: "chart", icon: ChartBar, title: "Chart last month's signups", hint: "By plan" },
  ]}
  onSelect={(_, prompt) => chat.send(prompt)}
/>

// Follow-ups under an answer
<PromptSuggestions
  variant="chips"
  data={answer.followUps}
  refreshing={loading}
  onRefresh={() => chat.suggestMore(answer.id)}
  onSelect={(_, prompt) => chat.send(prompt)}
/>`,
  props: [
    {
      name: "data",
      type: "PromptSuggestion[]",
      required: true,
      description: "Suggestions in display order. New ids animate in, old ones out.",
    },
    {
      name: "variant",
      type: '"cards" | "chips"',
      default: '"cards"',
      description:
        "Cards with icon and hint for an empty chat; wrapping chips for follow-ups.",
    },
    {
      name: "onSelect",
      type: "(suggestion, prompt: string) => void",
      required: true,
      description:
        "Called with the suggestion and the text to send (`prompt` or the title).",
    },
    {
      name: "onRefresh",
      type: "() => void",
      description: "Shows a refresh button after the chips.",
    },
    {
      name: "refreshing",
      type: "boolean",
      default: "false",
      description: "Spins the refresh icon and disables the chips.",
    },
    {
      name: "heading",
      type: "string",
      description: "Label above the suggestions; also their accessible name.",
    },
    { name: "className", type: "string", description: "Extra classes for the root." },
  ],
  types: `type PromptSuggestion = {
  id: string;
  title: string;
  hint?: string;   // second line on cards
  icon?: Icon;     // from @phosphor-icons/react
  prompt?: string; // text to send; defaults to the title
};`,
};
