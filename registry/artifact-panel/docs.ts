import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ArtifactPanel } from "@/components/ui/artifact-panel";

// Render it beside the chat when the agent produces a document, page or component.
export function Canvas({ artifact }: { artifact: Artifact }) {
  return (
    <ArtifactPanel
      view="versions"
      data={{
        title: artifact.title,
        kind: artifact.kind, // "React", "Markdown", "SQL"…
        versions: artifact.versions.map((v) => ({
          id: v.id,
          label: \`v\${v.number}\`,
          createdAt: v.time,
          note: v.summary,
          preview: <Sandbox code={v.code} />,
          source: v.code,
          filename: artifact.filename,
        })),
      }}
      onRestore={(v) => agent.restoreArtifact(artifact.id, v.id)}
      onOpen={(v) => window.open(\`/artifacts/\${artifact.id}/\${v.id}\`)}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "{ title: string; kind: string; versions: ArtifactVersion[] }",
      required: true,
      description: "Versions oldest first; the last one is current.",
    },
    {
      name: "view",
      type: '"preview" | "versions"',
      default: '"preview"',
      description: "The canvas alone, or with the version history beside it.",
    },
    {
      name: "versionId / onVersionChange",
      type: "string",
      description:
        "The version on screen. The header stepper and ← → keys move through them.",
    },
    {
      name: "tab / onTabChange",
      type: '"preview" | "source"',
      description: "Rendered preview or the source with line numbers.",
    },
    {
      name: "onRestore",
      type: "(version) => void",
      description: "Shown under an older version in the versions view.",
    },
    {
      name: "onCopy / onDownload / onOpen",
      type: "(…) => void",
      description:
        "Toolbar actions. Copy writes the source to the clipboard; download defaults to a file named `filename`; open shows only when set.",
    },
    {
      name: "icon",
      type: "Icon",
      default: "FileCode",
      description: "Phosphor icon for the header.",
    },
    { name: "className", type: "string", description: "Extra classes for the shell." },
  ],
  types: `type ArtifactVersion = {
  id: string;
  label: string;     // "v3"
  createdAt: string;
  note: string;      // what changed
  preview: React.ReactNode;
  source: string;
  filename?: string;
};`,
};
