import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { AgentStatus } from "@/components/ui/agent-status";

export function RunStatus({ run }: { run: AgentRun }) {
  return (
    <AgentStatus
      data={{
        label: run.currentStep.title,      // "Running the test suite"
        detail: run.currentStep.detail,    // "vitest run site"
        startedAt: run.startedAt,
        steps: run.finishedSteps.map((step) => ({
          id: step.id,
          label: step.title,
          durationMs: step.durationMs,
        })),
        status: run.status, // "working" | "done" | "stopped" | "error"
      }}
      maxSteps={3}
      onStop={() => run.abort()}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "AgentStatusData",
      required: true,
      description:
        "The current step, a changing detail, the start time for the timer, finished steps and the run status.",
    },
    {
      name: "onStop",
      type: "() => void",
      description: "Shows a Stop button while the agent is working.",
    },
    {
      name: "maxSteps",
      type: "number",
      default: "3",
      description:
        "How many finished steps to show above the current one. 0 shows a single line.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type AgentStatusData = {
  label: string;
  detail?: string;
  startedAt: number; // ms since epoch
  steps?: { id: string; label: string; durationMs?: number }[];
  status?: "working" | "done" | "stopped" | "error";
};`,
};
