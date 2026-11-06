import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { MatchField } from "@/components/ui/match-field";

export function Shortlist({ role, matches }: { role: Role; matches: Match[] }) {
  return (
    <MatchField
      title={role.title}
      subtitle={\`\${matches.length} applicants · ranked by fit\`}
      sectors={["Design systems", "Fintech", "Consumer apps", "Agency"]}
      items={matches.map((m) => ({
        id: m.id,
        name: m.name,
        sector: m.backgroundIndex,
        score: m.fit, // 0–1 from your ranking model
      }))}
      threshold={0.85}
      onSelect={(item) => openProfile(item.id)}
    />
  );
}`,
  props: [
    {
      name: "sectors",
      type: "string[]",
      required: true,
      description: "Categories around the edge, clockwise from the top.",
    },
    {
      name: "items",
      type: "MatchItem[]",
      required: true,
      description:
        "Placed in their sector, closer to the middle the higher they score. Items at or above the threshold get a label.",
    },
    { name: "title", type: "string", required: true, description: "Header title." },
    { name: "subtitle", type: "string", description: "Secondary line under the title." },
    {
      name: "rings",
      type: "number[]",
      default: "[0.5, 0.7, 0.85]",
      description: "Scores drawn as dashed, labeled rings.",
    },
    {
      name: "threshold",
      type: "number",
      default: "highest ring",
      description: "Strong-fit score. Its ring and the dots inside it are tinted brand.",
    },
    {
      name: "min",
      type: "number",
      default: "lowest ring − 0.15",
      description: "Score on the outer edge. Lower scores are clamped to it.",
    },
    {
      name: "icon",
      type: "Icon",
      default: "Briefcase",
      description: "Phosphor icon in the middle: the role or request being matched.",
    },
    {
      name: "onSelect",
      type: "(item: MatchItem) => void",
      description:
        "Called when an item is hovered, clicked or reached with the arrow keys.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type MatchItem = {
  id: string;
  name: string;
  initials?: string; // defaults to the first letters of the name
  sector: number;    // index into sectors
  score: number;     // 0–1, higher sits closer to the middle
  color?: string;    // avatar color, defaults to a categorical palette
};`,
};
