import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { RadarChart } from "@/components/ui/radar-chart";

export function TeamSkills({ review }: { review: SkillsReview }) {
  return (
    <RadarChart
      title="Team skills"
      subtitle={\`\${review.team} · \${review.cycle}\`}
      axes={review.skills} // "Craft", "Systems thinking", …
      max={4}
      series={{ id: "avg", label: "Team average", values: review.average }}
      baseline={{ label: "Senior bar", values: review.bar }}
      members={review.people.map((p) => ({
        id: p.id,
        label: p.initials,
        name: p.name,
        values: p.scores,
      }))}
      headline={{ value: review.overall.toFixed(1), caption: "bar 3.0" }}
      onSelect={(axis) => openRubric(review.skills[axis])}
    />
  );
}`,
  props: [
    {
      name: "axes",
      type: "string[]",
      required: true,
      description: "One label per axis, clockwise from the top. Five to eight read best.",
    },
    {
      name: "max",
      type: "number",
      required: true,
      description:
        "Top of the scale, drawn as the outer ring. Up to 10 gets a ring per step, otherwise four.",
    },
    {
      name: "series",
      type: "RadarSeries",
      required: true,
      description: "The filled polygon, e.g. a team average. Its values label each axis.",
    },
    {
      name: "baseline",
      type: "{ label: string; values: number[] }",
      description: "A dashed polygon to measure against, like the bar for a level.",
    },
    {
      name: "members",
      type: "RadarMember[]",
      default: "[]",
      description:
        "Individual values drawn as dots on each spoke. Hovering an axis lists them all.",
    },
    { name: "title", type: "string", required: true, description: "Header title." },
    { name: "subtitle", type: "string", description: "Secondary line under the title." },
    {
      name: "headline",
      type: "{ value: string; caption?: string }",
      description: "Number on the right of the header, with a short caption.",
    },
    {
      name: "format",
      type: "(value: number) => string",
      default: "v.toFixed(1)",
      description: "Formats every value: axis labels, tooltip and screen reader text.",
    },
    {
      name: "onSelect",
      type: "(axis: number) => void",
      description: "Called when an axis is hovered or reached with the arrow keys.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type RadarSeries = {
  id: string;
  label: string;
  values: number[]; // one per axis, 0…max
  color?: string;   // defaults to brand
};

type RadarMember = {
  id: string;
  label: string;    // short, e.g. initials
  name?: string;    // full name for screen readers
  values: number[]; // one per axis, 0…max
  color?: string;   // defaults to blue, teal, purple, gold
};`,
};
