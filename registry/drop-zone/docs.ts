import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { DropOverlay, DropZone } from "@/components/ui/drop-zone";

<DropZone
  accept="application/pdf,image/*,.csv"
  maxSize={10 * 1024 * 1024}
  onFiles={(files) => upload(files)}
/>

// Over a whole chat: shows an overlay while files are dragged in.
<DropOverlay accept="image/*,.pdf" onFiles={attach}>
  <ChatThread data={thread} />
</DropOverlay>`,
  props: [
    {
      name: "onFiles",
      type: "(accepted: File[]) => void",
      required: true,
      description: "Files that passed the rules.",
    },
    {
      name: "onReject",
      type: "(rejected: { file; reason }[]) => void",
      description: "Files turned away, with a readable reason. DropZone also lists them.",
    },
    {
      name: "accept",
      type: "string",
      description: 'MIME types or extensions, like "image/*,.pdf".',
    },
    { name: "maxSize", type: "number", description: "Bytes per file." },
    {
      name: "multiple",
      type: "boolean",
      default: "true",
      description: "Allow several files.",
    },
    { name: "maxFiles", type: "number", description: "Most files per drop." },
    {
      name: "title / hint",
      type: "string",
      description: "DropZone text; the hint defaults to the rules.",
    },
    {
      name: "show",
      type: "boolean",
      description:
        "DropOverlay: force the overlay, e.g. for a page-level drag you track.",
    },
  ],
  types: `function checkFiles(files: File[], rules: FileRules): {
  accepted: File[];
  rejected: { file: File; reason: string }[];
};`,
};
