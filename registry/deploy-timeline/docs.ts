import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { DeployTimeline } from "@/components/ui/deploy-timeline";

export function AgentDeploys({ agent }: { agent: Agent }) {
  return (
    <DeployTimeline
      title="Deployments"
      subtitle={\`\${agent.name} · prompt & model versions · 14 days\`}
      threshold={0.88} // minimum eval score
      range={[daysAgo(14), new Date()]}
      deploys={agent.releases.map((r) => ({
        id: r.id,
        version: r.kind === "model" ? r.model : \`v\${r.promptVersion}\`,
        kind: r.kind, // "prompt" | "model"
        label: r.note,
        at: r.deployedAt,
        score: r.evalScore, // 0–1
        rolledBackAfter: r.rolledBackAt
          ? (r.rolledBackAt - r.deployedAt) / 60_000 // minutes
          : undefined,
        canary: r.trafficShare < 1 ? r.trafficShare : undefined,
      }))}
      onCompare={(version, live) => openDiff(version.id, live.id)}
      onRollback={(version) => confirmRollback(version.id)}
    />
  );
}`,
  props: [
    {
      name: "deploys",
      type: "Deploy[]",
      required: true,
      description:
        "Every prompt and model deploy in the window, in any order. The score steps at each one; a deploy with `rolledBackAfter` dips and comes back, the latest one with `canary` runs as a dashed line beside live.",
    },
    {
      name: "threshold",
      type: "number",
      description:
        "Minimum eval score, drawn as a dashed line. Deploys under it count as regressions even without a rollback.",
    },
    {
      name: "range",
      type: "[Date | string | number, Date | string | number]",
      default: "around the deploys",
      description: "Time window of the axis. Day labels thin out to fit the width.",
    },
    {
      name: "now",
      type: "Date | string | number",
      default: "end of range",
      description:
        "Where the score line stops. Move it forward to grow the live and canary lines.",
    },
    {
      name: "live",
      type: "boolean",
      default: "true",
      description: "Pulses the canary while traffic is still being scored.",
    },
    {
      name: "title",
      type: "string",
      default: '"Deployments"',
      description: "Header title.",
    },
    { name: "subtitle", type: "string", description: "Secondary line under the title." },
    {
      name: "stats",
      type: "DeployStat[]",
      default: "live, canary, eval, deploys",
      description:
        "Chips under the chart. By default: the live version and its model, canary share, live eval score and the deploy count with regressions. Pass `[]` to hide them.",
    },
    {
      name: "selectedId",
      type: "string | null",
      description: "Controlled selection. Left out, the component keeps its own.",
    },
    {
      name: "onSelect",
      type: "(deploy: Deploy | null) => void",
      description:
        "Called when a marker (or its segment of the line) is clicked; null when the selection is cleared again or with Escape.",
    },
    {
      name: "onCompare",
      type: "(deploy: Deploy, live: Deploy) => void",
      description:
        "Shows a Compare button for the selected deploy against live. With nothing selected it compares the last good version before live.",
    },
    {
      name: "onRollback",
      type: "(deploy: Deploy) => void",
      description:
        "Shows a Roll back button to the selected deploy, or the last good version before live. Disabled for live, the canary and regressions.",
    },
    {
      name: "aside",
      type: "ReactNode",
      description: "Extra content in the header, before the buttons.",
    },
    {
      name: "intro",
      type: "boolean",
      default: "true",
      description:
        "Draws the line in from the left on mount, then markers and the regression callout. Off renders the finished chart. Skipped with reduced motion.",
    },
    {
      name: "formatScore",
      type: "(score: number) => string",
      default: "score.toFixed(3)",
      description: "Formats scores in the callout, chips and the minimum label.",
    },
    {
      name: "formatDate",
      type: "(date: Date) => string",
      default: '"Nov 2" in UTC',
      description: "Formats the day axis and dates in the callout.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type Deploy = {
  id: string;
  version: string;          // "v13", or a model id like "o4-mini"
  kind: "prompt" | "model"; // dot or diamond on the rail
  label?: string;           // what changed, shown in the callout
  at: Date | string | number;
  score: number;            // eval score it shipped with, 0–1
  rolledBackAfter?: number; // minutes until rollback: a regression
  canary?: number;          // traffic share 0–1 while in canary
};

type DeployStat = {
  label: string;
  value: string;
  tone?: "neutral" | "brand" | "negative";
};`,
};
