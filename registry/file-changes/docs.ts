import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { useState } from "react";
import { FileChanges, type FileChange } from "@/components/ui/file-changes";

export function ReviewEdits({ changes }: { changes: FileChange[] }) {
  const [applying, setApplying] = useState(false);

  return (
    <FileChanges
      data={changes}
      applying={applying}
      onApply={async (selection) => {
        // selection maps each file id to the hunk ids the user kept
        setApplying(true);
        await workspace.applyHunks(selection);
        setApplying(false);
      }}
      onDiscard={() => workspace.revertAll()}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "FileChange[]",
      required: true,
      description:
        "Files the agent edited, each with its diff hunks. Every hunk needs an id.",
    },
    {
      name: "view",
      type: '"split" | "stacked"',
      default: '"split"',
      description:
        "Split puts a folder tree beside the hunks; stacked swaps the tree for a row of file tabs for narrow columns.",
    },
    {
      name: "onApply",
      type: "(selection: HunkSelection) => void",
      required: true,
      description:
        "Called with the hunk ids kept per file. Hunks left out were reverted.",
    },
    {
      name: "onHunkChange",
      type: "(fileId: string, hunkId: string, keep: boolean) => void",
      description: "Called whenever a hunk is switched between Keep and Revert.",
    },
    {
      name: "onDiscard",
      type: "() => void",
      description: "Shows a Discard all button. Throw away every change here.",
    },
    {
      name: "applying",
      type: "boolean",
      default: "false",
      description: "Puts the Apply button in its loading state.",
    },
    {
      name: "selectedId / onSelectedChange",
      type: "string / (fileId: string) => void",
      description: "Control the open file. Leave out to let the component track it.",
    },
    {
      name: "defaultSelectedId",
      type: "string",
      description:
        "File open on first render when uncontrolled. Defaults to the first file.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type FileChange = {
  id: string;
  path: string;
  from?: string; // previous path when renamed
  status: "added" | "modified" | "deleted" | "renamed";
  hunks: DiffHunk[];
};

type DiffHunk = {
  id: string;
  oldStart: number;
  newStart: number;
  lines: { type: "add" | "remove" | "context"; text: string }[];
};

type HunkSelection = Record<string, string[]>; // file id → kept hunk ids`,
};
