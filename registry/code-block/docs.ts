import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { CodeBlock } from "@/components/ui/code-block";

export function AnswerCode({ block }: { block: { code: string; lang: string; file?: string } }) {
  return (
    <CodeBlock
      data={{ code: block.code, language: block.lang as "ts", filename: block.file }}
      collapseAfter={16}
      onCopy={() => analytics.track("code_copied")}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "CodeBlockData",
      required: true,
      description: "The code, its language, an optional filename and lines to highlight.",
    },
    {
      name: "collapseAfter",
      type: "number",
      default: "14",
      description:
        "Longer code collapses to this many lines behind a “Show all N lines” control.",
    },
    {
      name: "showLineNumbers",
      type: "boolean",
      default: "true",
      description: "Line numbers in a sticky gutter.",
    },
    {
      name: "defaultWrap",
      type: "boolean",
      default: "false",
      description: "Start with soft wrap on; the header toggle switches it.",
    },
    {
      name: "onCopy",
      type: "(code: string) => void",
      description: "Called after the code is copied to the clipboard.",
    },
    { name: "className", type: "string", description: "Extra classes for the shell." },
  ],
  types: `type CodeLanguage = "ts" | "tsx" | "js" | "json" | "bash" | "python" | "text";

type CodeBlockData = {
  code: string;
  language?: CodeLanguage; // drives the built-in tokenizer
  filename?: string;
  highlight?: number[];    // 1-based line numbers
};`,
};
