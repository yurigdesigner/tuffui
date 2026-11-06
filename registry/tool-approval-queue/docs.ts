import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ToolApprovalQueue, type ToolApprovalRequest } from "@/components/ui/tool-approval-queue";

export function Permissions({ requests }: { requests: ToolApprovalRequest[] }) {
  return (
    <ToolApprovalQueue
      data={requests}
      layout="grouped"
      onDecide={(picked, decision, scope) => {
        for (const request of picked) {
          agent.resolveToolCall(request.id, { approved: decision === "approved" });
          if (decision === "approved" && scope !== "once") {
            permissions.allow(request.tool, { scope }); // "session" | "always"
          }
        }
      }}
      onUndo={(request) => agent.reopenToolCall(request.id)}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "ToolApprovalRequest[]",
      required: true,
      description:
        "Tool calls waiting on the user. Set a request's status to approved or denied to move it into the resolved log yourself.",
    },
    {
      name: "layout",
      type: '"grouped" | "flat"',
      default: '"grouped"',
      description:
        "Grouped sections requests by risk, high first; flat keeps arrival order.",
    },
    {
      name: "onDecide",
      type: '(requests, decision: "approved" | "denied", scope: GrantScope) => void',
      description:
        "Called from a row (with the scope picked there) or from the bulk bar for every selected request (scope once).",
    },
    {
      name: "onUndo",
      type: "(request) => void",
      description: "Called when the user undoes a decision from the resolved log.",
    },
    {
      name: "undoMs",
      type: "number",
      default: "5000",
      description: "How long Undo stays available after a decision.",
    },
    {
      name: "selected",
      type: "string[]",
      description:
        "Controlled selection of request ids. Leave unset to let the queue own it.",
    },
    {
      name: "onSelectedChange",
      type: "(ids: string[]) => void",
      description: "Called when rows are selected or cleared.",
    },
    {
      name: "defaultExpanded",
      type: "string",
      description: "Id of a request to open on mount.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root section.",
    },
  ],
  types: `type GrantScope = "once" | "session" | "always";

type ToolApprovalRequest = {
  id: string;
  tool: string;            // "bash", "fs.write", "slack.post"
  title: string;
  risk: "low" | "medium" | "high";
  agent?: string;
  status?: "pending" | "approved" | "denied";
  scope?: GrantScope;      // for requests you resolve yourself
  payload:
    | { kind: "shell"; command: string; cwd?: string }
    | { kind: "diff"; path: string; lines: { type: "add" | "remove" | "context"; text: string }[] }
    | { kind: "email"; to: string; subject: string; body: string }
    | { kind: "json"; args: Record<string, unknown> };
};

// Keyboard: ↑/↓ move between rows, Space selects, Enter opens a row.`,
};
