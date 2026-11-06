import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { UserMessage } from "@/components/ui/user-message";

export function Prompt({ message }: { message: Message }) {
  return (
    <UserMessage
      data={{
        id: message.id,
        content: message.text,
        attachments: message.files,
        sentAt: formatTime(message.createdAt),
        status: message.status, // "sending" | "sent" | "failed"
        edited: message.edited,
      }}
      onEdit={(text) => chat.editAndResend(message.id, text)}
      onRetry={() => chat.resend(message.id)}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "UserMessageData",
      required: true,
      description: "The prompt text, attachments, display time and delivery status.",
    },
    {
      name: "onEdit",
      type: "(text: string) => void",
      description:
        "Save & resend from the inline editor (Enter saves, Shift+Enter adds a line, Esc cancels). The edit action is hidden without it.",
    },
    {
      name: "onRetry",
      type: "() => void",
      description: "Shows a Retry button when the status is failed.",
    },
    {
      name: "onCopy",
      type: "(text: string) => void",
      description: "Called after the text is copied to the clipboard.",
    },
    { name: "className", type: "string", description: "Extra classes for the root." },
  ],
  types: `type UserMessageData = {
  id: string;
  content: string;
  attachments?: { id: string; name: string; kind: "image" | "file"; size?: number; previewUrl?: string }[];
  sentAt?: string;            // display time, e.g. "14:02"
  status?: "sending" | "sent" | "failed";
  edited?: boolean;
};`,
};
