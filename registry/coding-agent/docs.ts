import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { CodingAgent } from "@/components/coding-agent";
import { ToolCallBlock } from "@/components/ui/tool-call-block";
import { ToolApprovalQueue } from "@/components/ui/tool-approval-queue";

export function AgentScreen({ run }: { run: AgentRun }) {
  return (
    <div className="h-dvh">
      <CodingAgent
        data={{
          title: run.task.title,
          repo: run.repo,
          branch: run.branch,
          model: run.model,
          user: { name: run.user.name },
          // Each turn's content is any React node — tool calls, approvals.
          messages: run.turns.map((turn) => ({
            id: turn.id,
            role: turn.role,
            at: turn.createdAt,
            content:
              turn.role === "user" ? (
                turn.text
              ) : (
                <>
                  {turn.calls.map((call) => (
                    <ToolCallBlock key={call.id} data={call} />
                  ))}
                  {turn.approvals.length > 0 && (
                    <ToolApprovalQueue
                      data={turn.approvals}
                      layout="flat"
                      onDecide={(requests, decision, scope) =>
                        run.decide(requests, decision, scope)
                      }
                    />
                  )}
                </>
              ),
          })),
          activity: run.working ? run.status : undefined,
          files: run.changes,
          terminal: run.lastCommand,
          checkpoints: run.checkpoints,
          preview: { url: run.previewUrl, content: <iframe src={run.previewUrl} /> },
        }}
        status={run.working ? "streaming" : "idle"}
        onSend={(message) => run.send(message.text, message.mode)}
        onStop={() => run.stop()}
        onApply={(selection) => run.apply(selection)}
        onDiscard={() => run.discard()}
        onRestore={(checkpoint) => run.restore(checkpoint.id)}
      />
    </div>
  );
}`,
  props: [
    {
      name: "data",
      type: "CodingAgentData",
      required: true,
      description:
        "The task, repo and branch, the thread, the live activity line, changed files, the last terminal run, checkpoints and the preview.",
    },
    {
      name: "status",
      type: '"idle" | "streaming"',
      default: '"idle"',
      description:
        "While streaming, the composer queues follow-ups and shows Stop instead of Send.",
    },
    {
      name: "tab",
      type: '"changes" | "terminal" | "preview"',
      description: "Controls the work panel tab. Uncontrolled it starts on Changes.",
    },
    {
      name: "onTabChange",
      type: "(tab: WorkTab) => void",
      description: "Called when the user picks a tab.",
    },
    {
      name: "onSend",
      type: "(message: ComposerMessage) => void",
      description: "Called with the text, mode (ask, plan or act), context and model.",
    },
    {
      name: "onStop",
      type: "() => void",
      description: "Stop from the composer or the activity line.",
    },
    {
      name: "onApply",
      type: "(selection: HunkSelection) => void",
      description: "Apply the kept hunks from the Changes tab.",
    },
    {
      name: "onDiscard",
      type: "() => void",
      description: "Discard every change.",
    },
    {
      name: "applying",
      type: "boolean",
      default: "false",
      description: "Puts the Apply button in its loading state.",
    },
    {
      name: "onRestore",
      type: "(checkpoint: Checkpoint) => void",
      description: "Called after the user confirms restoring to a checkpoint.",
    },
    { name: "className", type: "string", description: "Extra classes for the root." },
  ],
  types: `type CodingAgentData = {
  title: string;
  repo: string;
  branch: string;
  model: string;
  user: { name: string; avatar?: string };
  messages: ThreadMessage[];            // from chat-thread; content is a ReactNode
  activity?: AgentStatusData;           // live status at the end of the thread
  files: FileChange[];                  // from file-changes
  terminal: TerminalRun;                // from terminal-output
  checkpoints: Checkpoint[];            // from checkpoint-timeline
  preview: { url: string; content: ReactNode };
};

// Lays out by its own width: from 960px chat and the work panel sit side by side
// and either can be collapsed; below that a switch shows Chat, Changes, Terminal
// or Preview. Give the parent a height.`,
};
