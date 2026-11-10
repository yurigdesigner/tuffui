import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ToolCallGraph } from "@/components/ui/tool-call-graph";

export function AgentTools({ agent, window }: { agent: Agent; window: ToolStats[] }) {
  const calls = window.reduce((sum, t) => sum + t.calls, 0);

  return (
    <ToolCallGraph
      subtitle={\`\${agent.name} · \${agent.version} · last 24 h · \${calls.toLocaleString()} calls\`}
      agent={{ label: \`\${agent.name} · \${agent.version}\`, meta: \`agent · \${agent.runs} runs\` }}
      tools={window.map((t) => ({
        id: t.tool,
        label: t.tool, // "refund.create"
        calls: t.calls,
        p50Ms: t.p50,
        errorRate: t.failed / t.calls, // 0…1
        retries: t.retries,
      }))}
      stats={[
        { label: "Calls / run", value: (calls / agent.runs).toFixed(1) },
        { label: "Hot path", value: "refund.create → email.send", accent: true },
      ]}
      onSelect={(id) => openToolTraces(id)}
    />
  );
}`,
  props: [
    {
      name: "agent",
      type: "{ label: string; meta?: string }",
      required: true,
      description:
        "The caller drawn on the left. `meta` is a short second line, e.g. run count. Narrow cards show only its icon.",
    },
    {
      name: "tools",
      type: "ToolCallNode[]",
      required: true,
      description:
        "One node per tool, drawn top to bottom in array order. The order never changes with the metric, so nodes stay put while edges re-weigh.",
    },
    {
      name: "metric",
      type: '"calls" | "latency" | "errors"',
      description:
        "Controlled metric. Edge width and opacity scale with it, against the tool with the most of it.",
    },
    {
      name: "defaultMetric",
      type: '"calls" | "latency" | "errors"',
      default: '"calls"',
      description: "Starting metric when uncontrolled.",
    },
    {
      name: "onMetricChange",
      type: "(metric: ToolCallMetric) => void",
      description: "Called when the Calls / Latency / Errors switch changes.",
    },
    {
      name: "highlight",
      type: "string | null",
      default: "top tool for the metric",
      description:
        "Tool to pick out with a tinted node and a flowing edge. Left out, it follows the metric; `null` turns it off.",
    },
    {
      name: "errorThreshold",
      type: "number",
      default: "0.02",
      description:
        "Error rate from which a tool reads as failing: red dot, red error chip, and a red pick in the Errors view.",
    },
    {
      name: "title",
      type: "string",
      default: '"Tool call graph"',
      description: "Header title.",
    },
    {
      name: "subtitle",
      type: "string",
      default: '"<agent> · <calls> calls"',
      description: "Secondary line under the title.",
    },
    {
      name: "stats",
      type: "ToolCallStat[]",
      default: "calls, error rate, retries",
      description:
        "Footer row. Pass `[]` to hide it. `accent` draws a value in the accent colour, e.g. a hot path.",
    },
    {
      name: "formatLatency",
      type: "(ms: number) => string",
      default: '"212 ms" / "1.8 s"',
      description: "Formats p50 latency on the nodes.",
    },
    {
      name: "onSelect",
      type: "(id: string) => void",
      description:
        "Called when a tool node is clicked or pressed. Hover and focus highlight the node's edge on their own.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type ToolCallNode = {
  id: string;
  label: string;      // tool name
  calls: number;      // calls in the window
  p50Ms: number;      // median latency, ms
  errorRate: number;  // 0…1
  retries?: number;
};

type ToolCallStat = {
  label: string;
  value: ReactNode;
  accent?: boolean;
};`,
};
