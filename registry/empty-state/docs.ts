import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { EmptyState } from "@/components/ui/empty-state";

{chats.length === 0 && (
  <EmptyState
    icon={ChatsCircle}
    title="No conversations yet"
    description="Start a chat and it will show up here."
    action={{ label: "New chat", onClick: newChat, icon: Plus, iconWeight: "bold" }}
  />
)}

{error && <EmptyState tone="error" title="Couldn't load history" onRetry={reload} />}`,
  props: [
    {
      name: "title",
      type: "ReactNode",
      required: true,
      description: "One line saying what's empty or what failed.",
    },
    { name: "description", type: "ReactNode", description: "What to do next." },
    {
      name: "icon",
      type: "Icon",
      description: "Phosphor icon, filled. Errors default to a warning.",
    },
    {
      name: "action / secondaryAction",
      type: "{ label, onClick, icon?, iconWeight? }",
      description: "Silver primary and a quiet secondary button.",
    },
    {
      name: "tone",
      type: '"neutral" | "error"',
      default: '"neutral"',
      description: "Error tints the icon and announces as an alert.",
    },
    {
      name: "onRetry",
      type: "() => void",
      description: "With tone error and no action, adds a Retry button.",
    },
    {
      name: "compact",
      type: "boolean",
      default: "false",
      description: "Row layout for empty lists inside a panel.",
    },
  ],
};
