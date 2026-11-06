import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { MemoryPanel } from "@/components/ui/memory-panel";

export function AgentMemory({ memories }: { memories: Memory[] }) {
  return (
    <MemoryPanel
      data={memories}
      onEdit={(memory, text) => api.memories.update(memory.id, { text })}
      // Called after the undo window closes, so a quick Undo never hits the server.
      onForget={(memory) => api.memories.delete(memory.id)}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "Memory[]",
      required: true,
      description: "Memories in display order. Set isNew on ones added this session.",
    },
    {
      name: "onEdit",
      type: "(memory, text: string) => void",
      description: "Called when an inline edit is saved with Enter. Esc cancels.",
    },
    {
      name: "onForget",
      type: "(memory) => void",
      description:
        "Called once the undo window closes. The row hides immediately and shows an Undo pill.",
    },
    {
      name: "onUndo",
      type: "(memory) => void",
      description: "Called when the user restores a memory within the undo window.",
    },
    {
      name: "undoMs",
      type: "number",
      default: "5000",
      description: "How long the Undo pill stays before the Forget is committed.",
    },
    {
      name: "variant",
      type: '"panel" | "compact"',
      default: '"panel"',
      description: "A panel with search and scope filters, or a dense list without them.",
    },
    {
      name: "title",
      type: "string",
      default: '"Memory"',
      description: "Heading and accessible name of the panel.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type Memory = {
  id: string;
  text: string;
  scope: "user" | "project" | "session";
  source?: string; // e.g. "from chat · 2d ago"
  pinned?: boolean;
  isNew?: boolean; // shows a "New" pill
};`,
};
