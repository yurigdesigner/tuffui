import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { LapTimer } from "@/components/ui/lap-timer";

export function PipelineLap({ run }: { run: PipelineRun }) {
  // Re-render on a frame clock (or every 100 ms) while the run is live.
  const elapsed = useElapsed(run.startedAt, run.finishedAt);

  return (
    <LapTimer
      title="Pipeline lap"
      subtitle={\`eval run \${run.id}\`}
      lap={\`Lap \${run.attempt}\`}
      elapsed={elapsed}
      best={run.bestLap} // seconds
      running={!run.finishedAt}
      sectors={run.stages.map((stage) => ({
        id: stage.id,
        label: stage.name, // "retrieve", "generate", "score"
        best: stage.bestSplit,
        split: stage.finishedAt ? stage.duration : undefined,
      }))}
    />
  );
}`,
  props: [
    {
      name: "sectors",
      type: "LapSector[]",
      required: true,
      description:
        "Stages in order. Each one paints its arc on the dial; the first one without a split is the running one.",
    },
    {
      name: "elapsed",
      type: "number",
      required: true,
      description: "Seconds since the lap started. Drives the hand and the clock.",
    },
    {
      name: "best",
      type: "number",
      default: "sum of sector bests",
      description:
        "Best full lap in seconds. Marked on the dial and used for the delta next to the clock.",
    },
    {
      name: "running",
      type: "boolean",
      default: "true",
      description:
        "Whether the lap is still going. When false, the last split ends the lap.",
    },
    {
      name: "dial",
      type: "number",
      default: "auto",
      description:
        "Seconds per turn of the dial. Left out, it picks the smallest of 10 s, 15 s, 20 s, 30 s, 1 min… that fits the best lap.",
    },
    { name: "title", type: "string", required: true, description: "Header title." },
    { name: "subtitle", type: "string", description: "Secondary line under the title." },
    {
      name: "lap",
      type: "string",
      description: 'Label above the dial next to the sector count, e.g. "Lap 3".',
    },
    {
      name: "aside",
      type: "ReactNode",
      description: "Extra content on the right of the header, e.g. a status pill.",
    },
    {
      name: "format",
      type: "(seconds: number) => string",
      default: "s.toFixed(1) + ' s'",
      description: "Formats split times and the best lap. The clock is always mm:ss.t.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type LapSector = {
  id: string;
  label: string;  // stage name
  best: number;   // best split, seconds
  split?: number; // seconds, once the stage is done
};`,
};
