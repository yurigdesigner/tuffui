import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ChatThread } from "@/components/ui/chat-thread";
import { StreamingMessage } from "@/components/ui/streaming-message";

export function Conversation({ messages, lastReadId }: Props) {
  return (
    <ChatThread
      agentName="Claude"
      data={{
        unreadFrom: lastReadId,
        messages: messages.map((m) => ({
          id: m.id,
          role: m.role,
          at: m.createdAt,
          streaming: m.status === "streaming",
          // Any node: plain text, a StreamingMessage, tool calls, charts…
          content: m.role === "assistant" ? <StreamingMessage data={m} /> : m.text,
        })),
      }}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "{ messages: ThreadMessage[]; unreadFrom?: string }",
      required: true,
      description:
        "Turns in order. Consecutive turns from one side within five minutes share a header; `unreadFrom` puts an Unread divider before that message.",
    },
    {
      name: "density",
      type: '"default" | "dense"',
      default: '"default"',
      description: "Dense drops avatars and tightens spacing for side panels.",
    },
    {
      name: "agentName",
      type: "string",
      default: '"Assistant"',
      description: "Header name for assistant turns.",
    },
    {
      name: "userName",
      type: "string",
      default: '"You"',
      description: "Header name for user turns.",
    },
    {
      name: "renderAvatar",
      type: "(message: ThreadMessage) => ReactNode",
      description:
        "Custom avatar; defaults to a sparkle for the agent and an initial for people.",
    },
    {
      name: "height",
      type: "number | string",
      default: "420 (100% when bare)",
      description:
        "Height of the scroll area. The thread follows new content while you're at the bottom and shows Jump to latest when you scroll up.",
    },
    {
      name: "bare",
      type: "boolean",
      default: "false",
      description:
        "Drop the shell and panel so the thread is just the scroll area and fills its parent — for full screens where the thread is the page.",
    },
    {
      name: "footer",
      type: "ReactNode",
      description:
        "Rendered after the last message inside the scroll area, e.g. follow-up chips.",
    },
    {
      name: "bottomInset",
      type: "number",
      default: "0",
      description:
        "Pixels kept free at the bottom for a composer that floats over the thread; Jump to latest sits above it.",
    },
    {
      name: "contentClassName",
      type: "string",
      description: "Classes for the message column, e.g. `mx-auto max-w-3xl`.",
    },
    { name: "className", type: "string", description: "Extra classes for the shell." },
  ],
  types: `type ThreadMessage = {
  id: string;
  role: "user" | "assistant";
  content: ReactNode;
  at: string;          // ISO timestamp
  author?: string;
  streaming?: boolean; // shows a caret and keeps the thread pinned while it grows
};`,
};
