import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { SupportWidget } from "@/components/support-widget";

export function SiteWithSupport({ chat, children }: { chat: SupportChat; children: React.ReactNode }) {
  return (
    <SupportWidget
      data={{
        bot: { name: "Ridge" },
        human: chat.assignee ? { name: chat.assignee.name, role: "Support team" } : undefined,
        visitor: { name: chat.visitor.name },
        // content is any React node — order cards, questions, forms.
        messages: chat.messages.map((m) => ({
          id: m.id,
          role: m.from === "visitor" ? "user" : "assistant",
          author: m.from === "agent" ? chat.assignee?.name : undefined,
          at: m.createdAt,
          content: m.text,
        })),
        quickReplies: chat.messages.length < 2 ? chat.quickReplies : undefined,
        mode: chat.assignee ? "human" : chat.queued ? "waiting" : chat.botTyping ? "typing" : "bot",
        wait: chat.queueEstimate,
        askRating: chat.closed,
        unread: chat.unread,
      }}
      onSend={(text) => chat.send(text)}
      onRate={(rating) => chat.rate(rating)}
      onClose={() => chat.end()}
    >
      {children}
    </SupportWidget>
  );
}`,
  props: [
    {
      name: "data",
      type: "SupportWidgetData",
      required: true,
      description:
        "Bot, the person who takes over, the visitor, the turns, quick replies and the current mode.",
    },
    {
      name: "children",
      type: "ReactNode",
      description:
        "The host page the widget floats over. It stays usable while the panel is open.",
    },
    {
      name: "open / defaultOpen / onOpenChange",
      type: "boolean / boolean / (open: boolean) => void",
      default: "— / false / —",
      description:
        "Whether the panel is open. The launcher toggles it, Esc and the minimise button close it.",
    },
    {
      name: "onSend",
      type: "(text: string) => void",
      description: "A message from the composer or a quick reply.",
    },
    {
      name: "onRate",
      type: "(feedback) => void",
      description: "The 1–5 rating, reasons and note from the end-of-chat rating.",
    },
    {
      name: "onClose",
      type: "() => void",
      description: "The end-chat button. Minimising only hides the panel.",
    },
    { name: "className", type: "string", description: "Extra classes for the root." },
  ],
  types: `type SupportPerson = { name: string; avatar?: string; role?: string };

type SupportWidgetData = {
  bot: SupportPerson;
  human?: SupportPerson;               // set message.author to human.name for their turns
  visitor: { name: string };
  messages: ThreadMessage[];           // from chat-thread; content is a ReactNode
  quickReplies?: PromptSuggestion[];   // chips under the last bot message
  mode?: "bot" | "typing" | "waiting" | "human";
  wait?: string;                       // queue estimate, e.g. "~2 min"
  askRating?: boolean;
  unread?: number;                     // badge on the launcher while closed
};

// The widget fills its parent and lays out by its own width: from 28rem the panel
// floats bottom-right over the page, below that it fills the screen.`,
};
