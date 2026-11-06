import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { JsonViewer } from "@/components/ui/json-viewer";

export function ToolResult({ call }: { call: { name: string; result: unknown } }) {
  return (
    <JsonViewer
      title={call.name}
      data={call.result as JsonValue}
      defaultDepth={1}
      onCopy={(kind, text) => toast(kind === "path" ? \`Copied \${text}\` : "Value copied")}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "JsonValue",
      required: true,
      description: "Any JSON-serializable value.",
    },
    {
      name: "title",
      type: "string",
      default: '"Output"',
      description: "Header title and root label.",
    },
    {
      name: "view",
      type: '"tree" | "raw"',
      default: '"tree"',
      description:
        "Collapsible tree with search, or pretty-printed JSON with a copy button.",
    },
    {
      name: "defaultDepth",
      type: "number",
      default: "1",
      description: "Levels open on first render. Search opens every ancestor of a match.",
    },
    {
      name: "onCopy",
      type: '(kind: "path" | "value", text: string) => void',
      description:
        "Called after copying — clicking a key copies its path ($.items[2].price), the row button copies its value.",
    },
    { name: "className", type: "string", description: "Extra classes for the shell." },
  ],
  types: `type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

// Keyboard: ↑ ↓ move, → opens or steps in, ← closes or steps out, Enter toggles or copies.`,
};
