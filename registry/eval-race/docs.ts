import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { EvalRace } from "@/components/ui/eval-race";

export function SuiteRace({ run }: { run: EvalRun }) {
  return (
    <EvalRace
      title="Eval race"
      subtitle={\`\${run.models.length} models · \${run.cases} cases · \${run.suite}\`}
      total={run.cases}
      perLap={100} // one lap of the track per 100 cases
      racers={run.models.map((m) => ({
        id: m.id,
        label: m.name,
        scored: m.casesScored,
        laps: m.lapSeconds, // duration of each completed batch of 100
      }))}
      onSelect={(id) => setHighlighted(id)}
    />
  );
}`,
  props: [
    {
      name: "racers",
      type: "EvalRacer[]",
      required: true,
      description:
        "One per model. Ranked by cases scored, ties broken by total lap time. Order in the array only breaks exact ties.",
    },
    {
      name: "total",
      type: "number",
      required: true,
      description: "Cases in the eval set. A racer that reaches it has finished.",
    },
    {
      name: "perLap",
      type: "number",
      required: true,
      description:
        "Cases per lap of the track. A racer a full lap behind the leader shows +1 lap.",
    },
    {
      name: "title",
      type: "string",
      default: '"Eval race"',
      description: "Header title.",
    },
    {
      name: "subtitle",
      type: "string",
      default: '"5 models · 400 cases"',
      description: "Secondary line under the title.",
    },
    {
      name: "layout",
      type: '"race" | "standings"',
      default: '"race"',
      description:
        "`race` draws the full track with lap and fastest lap in the middle. `standings` leads with the table, a small track beside the headline and last and best lap columns.",
    },
    {
      name: "status",
      type: '"live" | "final"',
      description:
        "Overrides the header state. By default the race is final once every racer has scored `total`.",
    },
    {
      name: "formatTime",
      type: "(seconds: number) => string",
      default: "s.toFixed(1) + 's'",
      description: "Formats lap times and time gaps between finished racers.",
    },
    {
      name: "onSelect",
      type: "(id: string | null) => void",
      description:
        "Called when a racer is hovered on the track or in the table, or reached with the arrow keys.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type EvalRacer = {
  id: string;
  label: string;    // short, e.g. a model id
  name?: string;    // full name for screen readers
  scored: number;   // cases scored so far, 0…total
  laps?: number[];  // seconds per completed lap
};`,
};
