import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ToolCallBlock, type ToolCall } from "@/components/ui/tool-call-block";

// Map your SDK's tool-use events onto ToolCall and re-render as they change.
function toToolCall(part: ToolUsePart): ToolCall {
  return {
    id: part.id,
    name: part.name,
    args: part.input,
    status: part.state === "output-available" ? "success" : part.state === "error" ? "error" : "running",
    durationMs: part.durationMs,
    result: part.output,
    error: part.errorText,
  };
}

export function ToolCalls({ parts }: { parts: ToolUsePart[] }) {
  return parts.map((part) => (
    <ToolCallBlock
      key={part.id}
      data={toToolCall(part)}
      onRetry={(call) => agent.retryToolCall(call.id)}
    />
  ));
}`,
  props: [
    {
      name: "data",
      type: "ToolCall",
      required: true,
      description:
        "The tool call. While status is running the duration counts up on its own; pass durationMs once it settles.",
    },
    {
      name: "defaultOpen",
      type: "boolean",
      default: "false",
      description: "Start with arguments and result expanded.",
    },
    {
      name: "onRetry",
      type: "(call: ToolCall) => void",
      description: "Shows a Retry button next to the error when the call failed.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type ToolCall = {
  id: string;
  name: string;                 // "web.search", "fs.read"
  args: Record<string, unknown>;
  status: "pending" | "running" | "success" | "error";
  durationMs?: number;
  result?: string | Record<string, unknown>;
  error?: string;
};`,
};
