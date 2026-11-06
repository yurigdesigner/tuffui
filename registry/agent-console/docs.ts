import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { AgentConsole } from "@/components/agent-console";

export function ConsoleScreen({ fleet }: { fleet: Fleet }) {
  return (
    <AgentConsole
      data={{
        title: "Agents",
        environment: fleet.env,
        team: fleet.agents.map((a) => ({ id: a.id, name: a.name, status: a.presence })),
        stats: fleet.kpis, // StatGrid items
        agents: fleet.runs, // BackgroundAgents items
        run: { name: fleet.selected.name, spans: fleet.selected.spans, elapsedMs: fleet.selected.ms },
        evals: fleet.latestEval, // EvalResults data
        usage: fleet.usage, // UsageSummary data
        limits: fleet.rateLimits, // RateLimits data
        context: fleet.context, // ContextWindowMeter data
        incident: fleet.incident && {
          title: fleet.incident.title,
          description: fleet.incident.summary,
          approvals: fleet.incident.pendingActions, // ToolApprovalQueue items
        },
      }}
      onSelectAgent={(agent) => openRun(agent.id)}
      onDecide={(requests, decision, scope) => resolve(requests, decision, scope)}
      onAcknowledge={() => acknowledge(fleet.incident.id)}
    />
  );
}

// Mount nothing else for toasts: the screen renders its own Toaster, so
// toast("…") calls from anywhere show up inside the console.`,
  props: [
    {
      name: "data",
      type: "AgentConsoleData",
      required: true,
      description:
        "Everything the console shows: nav team, KPIs, background runs, the selected run's spans, eval results, usage, rate limits, context and an optional incident.",
    },
    {
      name: "section",
      type: '"agents" | "runs" | "evals" | "usage" | "settings"',
      description: "Active nav item. Uncontrolled by default.",
    },
    {
      name: "onSectionChange",
      type: "(section: ConsoleSection) => void",
      description: "Called when a nav item is picked.",
    },
    {
      name: "onSelectAgent",
      type: "(agent: BackgroundAgent) => void",
      description: "Open a background run, e.g. to load its trace.",
    },
    {
      name: "onDecide",
      type: "(requests, decision, scope) => void",
      description: "Forwarded to the incident's ToolApprovalQueue.",
    },
    {
      name: "onRetryLimits",
      type: "() => void",
      description: "Forwarded to RateLimits' Retry now.",
    },
    {
      name: "onAcknowledge",
      type: "() => void",
      description: "The incident banner's Acknowledge button.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root. The screen fills its parent.",
    },
  ],
  types: `type AgentConsoleData = {
  title: string;
  environment?: string;
  team: { id: string; name: string; status?: "online" | "away" | "busy" | "working" }[];
  stats: Stat[];                 // from stat-grid
  agents: BackgroundAgent[];     // from background-agents
  run: { name: string; spans: TraceSpan[]; elapsedMs: number; failed?: boolean };
  evals: EvalResultsProps["data"];
  usage: UsageSummaryProps["data"];
  limits: RateLimitsProps["data"];
  context: { limit: number; segments: ContextSegment[]; model?: string };
  incident?: { title: string; description: string; approvals: ToolApprovalRequest[] };
};`,
};
