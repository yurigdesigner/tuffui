import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { SourceList } from "@/components/ui/source-list";

// The model writes markers like [1] or [2, 3] that index into the sources it used.
export function CitedAnswer({ answer }: { answer: { text: string; sources: Source[] } }) {
  return <SourceList data={{ text: answer.text, sources: answer.sources }} />;
}

export function SourcesTab({ answer }: { answer: Answer }) {
  return (
    <SourceList
      variant="panel"
      data={{ sources: answer.sources, claims: answer.claims }}
      onOpen={(source) => analytics.track("source_opened", { url: source.url })}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "SourceListData",
      required: true,
      description:
        "Sources in citation order, plus the answer text with [n] markers (footnotes) or the claims each source supports (panel).",
    },
    {
      name: "variant",
      type: '"footnotes" | "panel"',
      default: '"footnotes"',
      description:
        "Inline markers with hover previews and a numbered list, or a panel grouped by site showing which claims each source backs.",
    },
    {
      name: "onOpen",
      type: "(source: Source) => void",
      description: "Called when a source link is opened.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type Source = { id: string; title: string; url: string; snippet?: string; date?: string };

type SourceListData = {
  sources: Source[];
  text?: string; // "… [1] … [2, 3]"
  claims?: { id: string; text: string; sourceIds: string[] }[];
};`,
};
