import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { AttachmentPreview, type Attachment } from "@/components/ui/attachment-preview";

export function ComposerAttachments({ files, setFiles }: {
  files: Attachment[];
  setFiles: (files: Attachment[]) => void;
}) {
  return (
    <AttachmentPreview
      data={files} // { id, name, size, type, src?, status, progress }
      onRemove={(file) => setFiles(files.filter((f) => f.id !== file.id))}
      onRetry={(file) => upload(file.id)}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "Attachment[]",
      required: true,
      description:
        "Files in display order. Images with a src render as thumbnails that open an enlarged view; everything else renders as a file tile.",
    },
    {
      name: "onRemove",
      type: "(attachment) => void",
      description:
        "Shows a remove button on each tile (on hover, focus, or always on touch).",
    },
    {
      name: "onRetry",
      type: "(attachment) => void",
      description: "Shows Retry on failed file uploads.",
    },
    {
      name: "onOpen",
      type: "(attachment | null) => void",
      description:
        "Called when an image opens in the enlarged view and with null when it closes.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type Attachment = {
  id: string;
  name: string;
  size: number;          // bytes
  type: string;          // MIME type
  src?: string;          // images only
  alt?: string;
  status?: "uploading" | "ready" | "failed";
  progress?: number;     // 0–1 while uploading
  error?: string;
};`,
};
