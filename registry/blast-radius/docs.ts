import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { BlastRadius } from "@/components/ui/blast-radius";

export function KeyExposure({ grants }: { grants: Grant[] }) {
  return (
    <BlastRadius
      title="Blast radius"
      subtitle="sk-live-…7f2a"
      center={{ label: "sk-live-…7f2a", initials: "SK" }}
      nodes={grants.map((g) => ({
        id: g.resourceId,
        label: g.resourceName,
        parent: g.viaResourceId, // undefined = granted directly
        kind: g.resourceType, // "database", "bucket", …
        affected: g.canRead,
        indirect: Boolean(g.viaResourceId),
        note: g.reason,
      }))}
      kinds={{
        database: { label: "Database", color: "#1a9e8c" },
        bucket: { label: "Bucket", color: "#bf5af2" },
      }}
      onSelect={(node) => openResource(node.id)}
    />
  );
}`,
  props: [
    {
      name: "center",
      type: "{ label: string; initials?: string; icon?: Icon }",
      required: true,
      description:
        "The entity everything is measured from. Shows the icon, else the initials, else the first two letters of the label.",
    },
    {
      name: "nodes",
      type: "BlastNode[]",
      required: true,
      description:
        "Everything it can reach. Hop depth comes from the parent chain; the first hop is spaced evenly by angle and later hops fan around their parent.",
    },
    {
      name: "kinds",
      type: "Record<string, BlastKind>",
      description:
        "Label and colour per kind, in legend order. Kinds left out get the categorical palette.",
    },
    { name: "title", type: "string", required: true, description: "Header title." },
    { name: "subtitle", type: "string", description: "Secondary line under the title." },
    {
      name: "aside",
      type: "React.ReactNode",
      description: "Right side of the header, e.g. a status pill with the count.",
    },
    {
      name: "onSelect",
      type: "(node: BlastNode) => void",
      description: "Called when a node is hovered or reached with the arrow keys.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type BlastNode = {
  id: string;
  label: string;
  parent?: string;     // id it is reached through; omit for the centre
  kind: string;        // key into kinds
  affected?: boolean;  // negative ring, path to the centre turns negative
  indirect?: boolean;  // dashed edge and ring
  note?: string;       // tooltip line, e.g. "Read by the new key"
};

type BlastKind = { label: string; color: string };`,
};
