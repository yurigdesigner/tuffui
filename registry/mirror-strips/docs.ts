import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { MirrorStrips } from "@/components/ui/mirror-strips";

// A contract review: where each side edited, round by round.
export function RedlineRounds({ review }: { review: Review }) {
  return (
    <MirrorStrips
      title="Edits by page"
      subtitle={\`\${review.pages} pages · \${review.rounds.length} rounds\`}
      columns={review.pageLabels}
      rows={review.rounds.map((r, i) => ({
        id: r.id,
        label: r.name,
        sublabel: r.date,
        up: r.theirEdits,
        down: r.ourRedlines,
        current: i === review.rounds.length - 1,
      }))}
      series={{ up: { label: "Their edits" }, down: { label: "Our redlines" } }}
      marks={review.openClauses.map((c) => ({ column: c.page, label: c.ref, note: c.title }))}
    />
  );
}`,
  props: [
    {
      name: "columns",
      type: "string[]",
      required: true,
      description: "One label per column. Every few are drawn under the chart.",
    },
    {
      name: "rows",
      type: "MirrorRow[]",
      required: true,
      description: "Each row has one count per column above the line and one below.",
    },
    {
      name: "series",
      type: "{ up: { label; color? }; down: { label; color? } }",
      required: true,
      description:
        "Names and colors for the two sides. Defaults to foreground above, brand below.",
    },
    { name: "title", type: "string", required: true, description: "Header title." },
    { name: "subtitle", type: "string", description: "Secondary line under the title." },
    {
      name: "marks",
      type: "MirrorMark[]",
      description:
        "Columns pinned with a label above the chart and a note in the tooltip.",
    },
    {
      name: "onSelect",
      type: "(column: number) => void",
      description: "Called when a column is hovered or reached with the arrow keys.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type MirrorRow = {
  id: string;
  label: string;
  sublabel?: string;
  up: number[];
  down: number[];
  current?: boolean; // emphasized label and total
};

type MirrorMark = { column: number; label: string; note?: string };

// Stacks hold up to five dots each way; bigger counts switch to one dot per group.`,
};
