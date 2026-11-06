import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ResultCarousel } from "@/components/ui/result-carousel";

// Render search results the agent found; the action hands the pick back to it.
export function HotelsAnswer({ results }: { results: Hotel[] }) {
  return (
    <ResultCarousel
      title="Hotels in Lisbon"
      subtitle="Nov 14–17 · 2 guests"
      data={results.map((h) => ({
        id: h.id,
        title: h.name,
        meta: h.area,
        price: \`$\${h.rate} / night\`,
        rating: h.rating,
        image: h.photoUrl,
        action: "Book",
      }))}
      onAction={(item) => agent.send(\`Book \${item.title}\`)}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "ResultItem[]",
      required: true,
      description: "Cards in order. New items can be appended while results stream in.",
    },
    {
      name: "title",
      type: "string",
      required: true,
      description: "Header title and the carousel's accessible name.",
    },
    {
      name: "subtitle",
      type: "string",
      description: "Replaces the default result count.",
    },
    {
      name: "compact",
      type: "boolean",
      default: "false",
      description: "Narrower cards without the image area.",
    },
    {
      name: "onAction",
      type: "(item: ResultItem) => void",
      description: "Adds a button to each card; the first card's button is primary.",
    },
    {
      name: "onOpen",
      type: "(item: ResultItem) => void",
      description: "Makes the title and image open the item.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type ResultItem = {
  id: string;
  title: string;
  meta?: string;   // one line under the title
  price?: string;  // right-aligned, e.g. "$214 / night"
  rating?: number; // 0–5
  image?: string;  // URL; without it a gradient from \`tint\`
  tint?: string;
  badge?: string;  // e.g. "Best match"
  action?: string; // button label, default "Select"
};

// The track scrolls with snap; arrows page by one card and disable at the ends.`,
};
