import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ConversationList } from "@/components/ui/conversation-list";

export function ChatSidebar({ chats, activeId }: Props) {
  return (
    <ConversationList
      data={chats.map((c) => ({
        id: c.id,
        title: c.title,
        updatedAt: c.lastMessageAt,
        pinned: c.pinned,
        running: c.status === "running",
      }))}
      activeId={activeId}
      onSelect={(c) => router.push(\`/chat/\${c.id}\`)}
      onNew={() => router.push("/chat/new")}
      onRename={(c, title) => api.rename(c.id, title)}
      onPin={(c, pinned) => api.pin(c.id, pinned)}
      onArchive={(c) => api.archive(c.id)} // after the undo window
      onDelete={(c) => api.delete(c.id)}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "Conversation[]",
      required: true,
      description:
        "Chats, grouped into Pinned, Today, Yesterday, Previous 7 days and Older.",
    },
    {
      name: "activeId",
      type: "string",
      description: "The open chat, marked with aria-current.",
    },
    {
      name: "onSelect",
      type: "(conversation) => void",
      description: "Click or Enter on a row. Arrow keys move between rows.",
    },
    {
      name: "onNew",
      type: "() => void",
      description: "Shows a New chat button in the header.",
    },
    {
      name: "onRename",
      type: "(conversation, title) => void",
      description: "Inline rename from the row menu: Enter or blur saves, Esc cancels.",
    },
    {
      name: "onPin",
      type: "(conversation, pinned) => void",
      description: "Pin or unpin from the row menu.",
    },
    {
      name: "onArchive / onDelete",
      type: "(conversation) => void",
      description:
        "The row hides at once with an Undo pill; the callback runs when the undo window closes.",
    },
    {
      name: "undoMs",
      type: "number",
      default: "5000",
      description: "How long Undo stays available.",
    },
    {
      name: "variant",
      type: '"sidebar" | "compact"',
      default: '"sidebar"',
      description: "Compact lists titles only, without search or group labels.",
    },
    {
      name: "now",
      type: "string",
      description: "Reference time for the date groups (ISO); defaults to now.",
    },
    {
      name: "headerAction",
      type: "ReactNode",
      description:
        "Extra control in the header next to New chat, e.g. a hide-sidebar toggle.",
    },
    { name: "className", type: "string", description: "Extra classes for the shell." },
  ],
  types: `type Conversation = {
  id: string;
  title: string;
  updatedAt: string; // ISO
  pinned?: boolean;
  running?: boolean; // shows a pulsing dot while the agent works
};`,
};
