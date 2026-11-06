import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { CheckpointTimeline } from "@/components/ui/checkpoint-timeline";

export function SessionHistory({ session }: { session: AgentSession }) {
  return (
    <CheckpointTimeline
      data={session.checkpoints.map((c) => ({
        id: c.id,
        label: c.summary,
        at: formatRelative(c.createdAt),
        files: c.diffStat, // [{ path, additions, deletions }]
      }))}
      onRestore={async (checkpoint) => {
        await session.rewind(checkpoint.id); // reverts files and drops later turns
      }}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "Checkpoint[]",
      required: true,
      description:
        "Checkpoints oldest first. The last one is treated as the current state.",
    },
    {
      name: "variant",
      type: '"timeline" | "compact"',
      default: '"timeline"',
      description:
        "A scrubber with a preview of the hovered or selected checkpoint, or a single row with previous / next.",
    },
    {
      name: "selectedId",
      type: "string",
      description: "Controlled selection. Defaults to the latest checkpoint.",
    },
    {
      name: "onSelect",
      type: "(checkpoint: Checkpoint) => void",
      description: "Called on click, focus or arrow keys (← → Home End).",
    },
    {
      name: "onRestore",
      type: "(checkpoint: Checkpoint) => void",
      description:
        "Called after the inline confirmation. Remove the later checkpoints from data — the track trims with an animation.",
    },
    {
      name: "confirming",
      type: "boolean",
      description:
        "Controls the confirmation step. Leave unset to let the component own it.",
    },
    {
      name: "onConfirmingChange",
      type: "(confirming: boolean) => void",
      description: "Called when the user opens or cancels the confirmation.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type Checkpoint = {
  id: string;
  label: string; // what the turn did
  at: string; // display time, e.g. "4m ago"
  files: { path: string; additions: number; deletions: number }[];
};`,
};
