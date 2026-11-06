import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { HexDensity } from "@/components/ui/hex-density";

// Show where retrieved chunks cluster and how many made the similarity cut.
export function RetrievalAnswer({ chunks }: { chunks: Chunk[] }) {
  return (
    <HexDensity
      title="Retrieval chunks"
      subtitle={\`\${chunks.length} chunks · top-k 8\`}
      points={chunks.map((c) => [c.tokens, c.score])}
      x={{ label: "Chunk length", min: 20, max: 1500, format: (v) => \`\${Math.round(v)} tok\` }}
      y={{ label: "Similarity", min: 0.4, max: 1, format: (v) => v.toFixed(2) }}
      threshold={{ value: 0.75, label: "0.75 cut-off", above: "retrieved", below: "dropped" }}
      unit="chunks"
      onSelect={(bin) => openChunks(bin.x, bin.y)}
    />
  );
}`,
  props: [
    {
      name: "points",
      type: "[number, number][]",
      required: true,
      description:
        "Raw [x, y] samples. The component bins them into hexagons and shades each by its count.",
    },
    { name: "title", type: "string", required: true, description: "Header title." },
    { name: "subtitle", type: "string", description: "Secondary line under the title." },
    {
      name: "x",
      type: "HexDensityAxis",
      description:
        "Horizontal axis: label, domain and formatter. The domain defaults to the data extent.",
    },
    {
      name: "y",
      type: "HexDensityAxis",
      description: "Vertical axis, same shape as x.",
    },
    {
      name: "threshold",
      type: "HexDensityThreshold",
      description:
        "Dashed line at a y value. Bins above it use the tone, bins below are grey, and the footer counts both sides.",
    },
    {
      name: "radius",
      type: "number",
      default: "11",
      description:
        "Largest hexagon radius in px. It shrinks on narrow screens so ~26 columns fit.",
    },
    {
      name: "tone",
      type: "string",
      default: '"var(--brand)"',
      description: "Any CSS colour for bins above the threshold, e.g. var(--brand).",
    },
    {
      name: "unit",
      type: "string",
      default: '"points"',
      description:
        "Plural name for one point, used in the header, callout, tooltip and footer.",
    },
    {
      name: "aside",
      type: "React.ReactNode",
      description: "Replaces the point count on the right of the header.",
    },
    {
      name: "onSelect",
      type: "(bin: HexDensityBin) => void",
      description: "Called when a bin is hovered or reached with the arrow keys.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type HexDensityAxis = {
  label?: string;
  min?: number;
  max?: number;
  format?: (value: number) => string;
};

type HexDensityThreshold = {
  value: number;
  label?: string; // on the line, e.g. "0.75 cut-off"
  above?: string; // e.g. "retrieved"
  below?: string; // e.g. "dropped"
};

type HexDensityBin = {
  col: number;
  row: number;
  x: [number, number];
  y: [number, number];
  count: number;
  above: boolean;
};

// The grid is shifted so the threshold runs between two rows: every hexagon is
// wholly above or below it, and footer counts match the colours.
// The densest bins get an outline and a pinned "Densest bin" callout.
// Keyboard: focus the chart, then ← → ↑ ↓ move to the nearest filled bin,
// Home End jump to the first and last, Esc clears.`,
};
