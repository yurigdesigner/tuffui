import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { AIChat } from "@/components/ai-chat";
import { ToolCallBlock } from "@/components/ui/tool-call-block";
import { SourceList } from "@/components/ui/source-list";
import { StreamingMessage } from "@/components/ui/streaming-message";

export function ChatScreen({ chat, run }: { chat: Chat; run: AgentRun }) {
  return (
    <AIChat
      data={{
        conversations: chat.history,
        activeId: chat.id,
        title: chat.title,
        model: run.model,
        user: { name: chat.user.name },
        starters: chat.starters,
        followUps: run.done ? run.followUps : undefined,
        context: { limit: run.contextLimit, segments: run.contextSegments },
        // Each turn's content is any React node — compose answers from components.
        messages: chat.turns.map((turn) => ({
          id: turn.id,
          role: turn.role,
          at: turn.createdAt,
          content:
            turn.role === "user" ? (
              turn.text
            ) : (
              <>
                {turn.toolCalls.map((call) => (
                  <ToolCallBlock key={call.id} data={call} />
                ))}
                {turn.streaming ? (
                  <StreamingMessage
                    data={{ content: turn.text, status: "streaming" }}
                    showHeader={false}
                  />
                ) : (
                  <SourceList data={{ sources: turn.sources, text: turn.text }} />
                )}
              </>
            ),
        })),
      }}
      status={run.streaming ? "streaming" : "idle"}
      onSend={(text) => run.send(text)}
      onStop={() => run.stop()}
      onNewChat={() => chat.create()}
      onSelectConversation={(c) => chat.open(c.id)}
      onShare={() => chat.share()}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "AIChatData",
      required: true,
      description:
        "History, the open chat (title, model, turns), starter cards, follow-up chips, context usage and the signed-in user.",
    },
    {
      name: "status",
      type: '"idle" | "streaming"',
      default: '"idle"',
      description:
        "While streaming, the composer queues new messages and follow-up chips are hidden.",
    },
    {
      name: "onSend",
      type: "(text: string) => void",
      description: "A message from the composer, a starter card or a follow-up chip.",
    },
    { name: "onStop", type: "() => void", description: "Stop the current run." },
    {
      name: "onNewChat",
      type: "() => void",
      description:
        "From the history panel. Pass empty `messages` to show the starter cards.",
    },
    {
      name: "onSelectConversation",
      type: "(conversation: Conversation) => void",
      description: "A chat picked in the history sidebar or drawer.",
    },
    { name: "onShare", type: "() => void", description: "Share button in the header." },
    {
      name: "sidebarOpen",
      type: "boolean",
      description:
        "Controls the history sidebar at wide widths. The header button and mod+\\ toggle it; below 56rem the history opens as a drawer instead.",
    },
    {
      name: "defaultSidebarOpen",
      type: "boolean",
      default: "true",
      description: "Initial sidebar state when uncontrolled.",
    },
    {
      name: "onSidebarOpenChange",
      type: "(open: boolean) => void",
      description: "Called when the sidebar is shown or hidden.",
    },
    { name: "className", type: "string", description: "Extra classes for the root." },
  ],
  types: `type AIChatData = {
  conversations: Conversation[];        // from conversation-list
  activeId?: string;
  title: string;
  model: string;
  messages: ThreadMessage[];            // from chat-thread; content is a ReactNode
  followUps?: PromptSuggestion[];       // chips under the last answer
  starters: PromptSuggestion[];         // cards for an empty chat
  context: { limit: number; segments: ContextSegment[] };
  user: { name: string; avatar?: string };
};

// The screen fills its parent and lays out by its own width (container queries):
// a history sidebar from 56rem, a drawer below that. Give the parent a height.`,
};
