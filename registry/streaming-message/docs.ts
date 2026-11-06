import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { StreamingMessage, type StreamingMessageData } from "@/components/ui/streaming-message";

export function AssistantTurn({ message }: { message: StreamingMessageData }) {
  // Append text deltas to message.content as they arrive and flip status to
  // "done" on message_stop (or "error" if the stream breaks).
  return (
    <StreamingMessage
      data={message}
      model="Claude Opus 5.5"
      onCopy={(text) => analytics.track("copy_message", { length: text.length })}
      onRetry={() => chat.regenerate(message.id)}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "StreamingMessageData",
      required: true,
      description:
        "The message: content so far, status, optional reasoning, citations and error. Update it on every delta.",
    },
    {
      name: "model",
      type: "string",
      default: '"Assistant"',
      description: "Name shown in the message header.",
    },
    {
      name: "showHeader",
      type: "boolean",
      default: "true",
      description:
        "Show the avatar and model row. Turn it off inside a thread that already labels each turn.",
    },
    {
      name: "onCopy",
      type: "(content: string) => void",
      description: "Called after the content is copied to the clipboard.",
    },
    {
      name: "onRetry",
      type: "() => void",
      description: "Shows Retry on errors and Regenerate when done.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root article.",
    },
  ],
  types: `type StreamingMessageData = {
  content: string;          // paragraphs split on blank lines; \`code\` and **bold** supported
  status: "streaming" | "done" | "error";
  reasoning?: {
    text: string;
    streaming?: boolean;    // shows "Thinking…" and keeps the panel open
    durationMs?: number;    // "Thought for 4s" once finished
  };
  citations?: { id: string; title: string; url: string; source?: string }[];
  error?: string;
};`,
};
