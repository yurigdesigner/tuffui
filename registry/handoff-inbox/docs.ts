import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { HandoffInbox } from "@/components/handoff-inbox";

export function SupportInbox({ inbox, chat }: { inbox: Inbox; chat: Chat }) {
  return (
    <div className="h-dvh">
      <HandoffInbox
        data={{
          team: inbox.teamName,
          operator: { id: inbox.me.id, name: inbox.me.name },
          bot: { name: "Nora" },
          queue: inbox.escalations, // customer, snippet, reason, waiting minutes…
          activeId: chat.id,
          messages: chat.turns.map((t) => ({
            id: t.id,
            from: t.handoff ? "handoff" : t.author, // "customer" | "bot" | "operator"
            at: t.createdAt,
            content: t.text,
          })),
          summary: chat.botSummary, // { wants, tried, calls }
          suggestions: chat.draftedReplies,
          customer: chat.customer, // plan, orders + orderColumns, notes
        }}
        status={chat.takenBy ? "active" : "waiting"}
        onTakeOver={() => chat.takeOver()}
        onSend={(text) => chat.reply(text)}
        onHandBack={() => chat.handBack()}
        onSelect={(escalation) => inbox.open(escalation.id)}
      />
    </div>
  );
}`,
  props: [
    {
      name: "data",
      type: "HandoffInboxData",
      required: true,
      description:
        "The queue, the open conversation, the bot's summary and drafted replies, and the customer's details.",
    },
    {
      name: "status",
      type: '"waiting" | "active" | "returned"',
      default: '"waiting"',
      description:
        "Waiting: the bot holds the chat and Take over is offered. Active: the operator replies from the composer. Returned: handed back to the bot.",
    },
    {
      name: "onTakeOver",
      type: "() => void",
      description: "The operator joins the chat.",
    },
    {
      name: "onHandBack",
      type: "() => void",
      description: "The bot takes the chat back.",
    },
    {
      name: "onSend",
      type: "(text: string) => void",
      description: "A reply from the operator.",
    },
    {
      name: "onSelect",
      type: "(escalation: Escalation) => void",
      description: "A conversation picked in the queue (click, or arrow keys and Enter).",
    },
    {
      name: "draft / onDraftChange",
      type: "string / (draft: string) => void",
      description:
        "Controls the composer text. Picking a drafted reply fills it for editing before sending.",
    },
    {
      name: "queueOpen / defaultQueueOpen / onQueueOpenChange",
      type: "boolean / boolean / (open: boolean) => void",
      default: "true",
      description:
        "The queue pane from 56rem wide; toggle with its header button or Cmd/Ctrl + backslash. Narrower, it opens as a drawer.",
    },
    {
      name: "detailsOpen / defaultDetailsOpen / onDetailsOpenChange",
      type: "boolean / boolean / (open: boolean) => void",
      default: "true",
      description: "The customer details pane from 72rem wide; a drawer below that.",
    },
    { name: "className", type: "string", description: "Extra classes for the root." },
  ],
  types: `type Escalation = {
  id: string;
  customer: { name: string; avatar?: string };
  snippet: string;  // last thing the customer said
  reason: string;   // why the bot handed off
  tone?: StatusTone;
  urgent?: boolean;
  waiting: number;  // minutes waiting for a person
  assignee?: string; // operator id; drives the "Mine" filter
};

type HandoffMessage = {
  id: string;
  from: "customer" | "bot" | "operator" | "handoff";
  at: string; // ISO
  content: React.ReactNode;
};

type HandoffInboxData = {
  team: string;
  operator: { id: string; name: string; avatar?: string };
  bot: { name: string };
  queue: Escalation[];
  activeId?: string;
  messages: HandoffMessage[];
  summary: { wants: string; tried: string[]; calls?: ToolCall[] };
  suggestions?: PromptSuggestion[];
  customer: {
    name: string; avatar?: string;
    plan: string; planTone?: StatusTone; since: string;
    orders: DataRow[]; orderColumns: DataColumn[];
    notes: Memory[];
  };
};

// The screen fills its parent and lays out by its own width (container queries).
// Give the parent a height.`,
};
