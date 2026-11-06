import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { Avatar, AvatarGroup } from "@/components/ui/agent-avatar";

<Avatar name="i18n-agent" kind="agent" status={run.active ? "working" : "online"} />

{/* Match --avatar-gap to the surface the group sits on. */}
<div className="[--avatar-gap:var(--surface-inset)]">
  <AvatarGroup people={participants} max={4} />
</div>`,
  props: [
    {
      name: "name",
      type: "string",
      required: true,
      description: "Used for initials, tint and the accessible name.",
    },
    {
      name: "src",
      type: "string",
      description: "Image URL; without it, initials on a tint derived from the name.",
    },
    {
      name: "size",
      type: '"xs" | "sm" | "md" | "lg"',
      default: '"md"',
      description: "20, 28, 36 or 48px.",
    },
    {
      name: "kind",
      type: '"agent" | "person"',
      default: '"person"',
      description: "Agents are rounded squares, people circles.",
    },
    {
      name: "status",
      type: '"online" | "away" | "busy" | "working"',
      description:
        "Badge in the corner; working spins. Always included in the accessible name.",
    },
    {
      name: "AvatarGroup.people / max",
      type: "AvatarProps[] / number",
      description:
        "Overlapping avatars with names in tooltips; the rest collapse into +N.",
    },
  ],
  types: `/* CSS variable: --avatar-gap — the colour of the gap around badges and
   overlapping avatars. Defaults to var(--background). */`,
};
