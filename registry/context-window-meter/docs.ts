import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { useState } from "react";
import { ContextWindowMeter } from "@/components/ui/context-window-meter";

export function ContextUsage({ usage }: { usage: Usage }) {
  const [compacting, setCompacting] = useState(false);

  return (
    <ContextWindowMeter
      data={{
        limit: 200_000,
        model: "opus-5.5",
        segments: [
          { id: "history", label: "Conversation", tokens: usage.history },
          { id: "files", label: "Workspace files", tokens: usage.files },
          { id: "tools", label: "MCP tools", tokens: usage.tools, pinned: true },
          { id: "system", label: "Instructions", tokens: usage.system, pinned: true },
        ],
      }}
      warnAt={0.8}
      compacting={compacting}
      onCompact={async () => {
        setCompacting(true);
        await agent.compact(); // summarize older turns
        setCompacting(false);
      }}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "{ limit: number; segments: ContextSegment[]; model?: string }",
      required: true,
      description:
        "The model's context limit, token counts per segment in fill order, and an optional model name shown as a tag.",
    },
    {
      name: "warnAt",
      type: "number",
      default: "0.8",
      description:
        "Share of the limit where the tinted warning zone starts. Past it the count turns orange and the inline row shows Compact.",
    },
    {
      name: "onCompact",
      type: "() => void",
      description:
        "Shows a Compact button (always in the card, past `warnAt` inline). Summarize or drop context here.",
    },
    {
      name: "compacting",
      type: "boolean",
      default: "false",
      description: "Puts the Compact button in its loading state.",
    },
    {
      name: "variant",
      type: '"card" | "inline"',
      default: '"card"',
      description:
        "A panel with a 100-cell grid (1% per cell) and a legend, or a 20-cell row for a composer footer.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type ContextSegment = {
  id: string;
  label: string;
  tokens: number;
  detail?: string; // secondary text, e.g. "4 open"
  pinned?: boolean; // shows a lock next to the label
  color?: string; // any CSS color; defaults to the built-in palette
};`,
};
