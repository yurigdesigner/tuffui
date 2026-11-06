import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { BackgroundAgents, type BackgroundAgent } from "@/components/ui/background-agents";

export function AgentsPanel({ agents }: { agents: BackgroundAgent[] }) {
  return (
    <BackgroundAgents
      data={agents}
      onPause={(agent) => runtime.pause(agent.id)}
      onResume={(agent) => runtime.resume(agent.id)}
      onCancel={(agent) => runtime.cancel(agent.id)}
      onOpen={(agent) => router.push(\`/agents/\${agent.id}\`)}
      onReview={(agent) => router.push(\`/agents/\${agent.id}/review\`)}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "BackgroundAgent[]",
      required: true,
      description:
        "Agents to show, in your order. Each tile or avatar fills from the bottom as progress grows.",
    },
    {
      name: "layout",
      type: '"grid" | "dock"',
      default: '"grid"',
      description:
        "Grid shows a live tile per agent; dock is a row of avatars that expands into the selected agent.",
    },
    {
      name: "onPause / onResume / onCancel / onOpen",
      type: "(agent: BackgroundAgent) => void",
      description:
        "Each shows its action on the tile (on hover or focus) or in the dock strip. Update the agent's status yourself.",
    },
    {
      name: "onReview",
      type: "(agent: BackgroundAgent) => void",
      description:
        "Called from the Review action of an agent with status waiting. Falls back to onOpen.",
    },
    {
      name: "selectedId",
      type: "string | null",
      description: "Controls which agent the dock expands; null collapses it.",
    },
    {
      name: "onSelect",
      type: "(agent: BackgroundAgent | null) => void",
      description: "Called when the viewer picks or collapses an agent in the dock.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root section.",
    },
  ],
  types: `type BackgroundAgent = {
  id: string;
  name: string;
  task: string;
  status: "queued" | "running" | "waiting" | "paused" | "done" | "failed" | "cancelled";
  progress: number;  // 0–1
  action?: string;   // what it is doing right now
  elapsedMs: number;
};`,
};
