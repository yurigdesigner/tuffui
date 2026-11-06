import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { DataAnswer } from "@/components/data-answer";
import { ChartCard } from "@/components/ui/chart-card";
import { DataTable } from "@/components/ui/data-table";
import { StatGrid } from "@/components/ui/stat-grid";
import { ToolCallBlock } from "@/components/ui/tool-call-block";

export function AnalyticsScreen({ workspace, chat }: { workspace: Workspace; chat: Chat }) {
  return (
    <DataAnswer
      data={{
        title: chat.title,
        model: chat.model,
        user: { name: workspace.user.name },
        sources: workspace.sources, // { id, name, detail, status: "synced" | "syncing" | "stale" }
        saved: workspace.savedQuestions,
        followUps: chat.done ? chat.followUps : undefined,
        // An answer is any React node — compose it from the data components.
        messages: chat.turns.map((turn) => ({
          id: turn.id,
          role: turn.role,
          at: turn.createdAt,
          content:
            turn.role === "user" ? (
              turn.text
            ) : (
              <div className="flex flex-col gap-3">
                <ToolCallBlock data={turn.query} />
                <p>{turn.text}</p>
                {turn.stats && <StatGrid data={turn.stats} sparklines />}
                {turn.chart && <ChartCard {...turn.chart} />}
                {turn.table && <DataTable {...turn.table} />}
              </div>
            ),
        })),
      }}
      status={chat.streaming ? "streaming" : "idle"}
      onSend={(text) => chat.ask(text)}
      onStop={() => chat.stop()}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "DataAnswerData",
      required: true,
      description:
        "Title, model, data sources and saved questions for the sidebar, the thread's messages, follow-up chips and the user.",
    },
    {
      name: "status",
      type: '"idle" | "streaming"',
      default: '"idle"',
      description:
        "While streaming the composer queues messages and follow-ups are hidden.",
    },
    {
      name: "onSend",
      type: "(text: string) => void",
      description: "A message from the composer, a follow-up chip or a saved question.",
    },
    { name: "onStop", type: "() => void", description: "Stop the running answer." },
    {
      name: "sidebarOpen",
      type: "boolean",
      description:
        "Controls the sidebar on wide screens (from 56rem). Below that the toggle opens it as a drawer.",
    },
    {
      name: "onSidebarOpenChange",
      type: "(open: boolean) => void",
      description: "Called when the sidebar toggle is used on a wide screen.",
    },
    { name: "className", type: "string", description: "Extra classes for the root." },
  ],
  types: `type DataAnswerData = {
  title: string;
  model: string;
  sources: { id: string; name: string; detail?: string; status: "synced" | "syncing" | "stale" }[];
  saved: { id: string; title: string; prompt?: string }[];
  messages: ThreadMessage[]; // content: any ReactNode
  followUps?: PromptSuggestion[];
  user: { name: string; avatar?: string };
};`,
};
