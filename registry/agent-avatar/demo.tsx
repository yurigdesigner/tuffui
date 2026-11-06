"use client";

import { Avatar, AvatarGroup } from "@/components/ui/agent-avatar";

export default function AgentAvatarDemo({ variant }: { variant?: string }) {
  if (variant === "Group") {
    return (
      <div className="flex flex-col items-center gap-6 [--avatar-gap:var(--surface-inset)]">
        <AvatarGroup
          size="md"
          max={4}
          people={[
            { name: "i18n-agent", kind: "agent", status: "working" },
            { name: "Ana Ribeiro", status: "online" },
            { name: "Jonas Weber", status: "away" },
            { name: "release-bot", kind: "agent" },
            { name: "Mei Tanaka" },
            { name: "Omar Haddad" },
          ]}
        />
        <AvatarGroup
          size="sm"
          people={[
            { name: "Lena Fischer" },
            { name: "Sam Okafor" },
            { name: "docs-agent", kind: "agent" },
          ]}
        />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-6 [--avatar-gap:var(--surface-inset)]">
      <div className="flex items-end gap-4">
        <Avatar name="i18n-agent" kind="agent" size="xs" />
        <Avatar name="i18n-agent" kind="agent" size="sm" status="working" />
        <Avatar name="i18n-agent" kind="agent" size="md" status="working" />
        <Avatar name="i18n-agent" kind="agent" size="lg" status="online" />
      </div>
      <div className="flex items-end gap-4">
        <Avatar name="Ana Ribeiro" size="md" status="online" />
        <Avatar name="Jonas Weber" size="md" status="away" />
        <Avatar name="Mei Tanaka" size="md" status="busy" />
        <Avatar name="Omar Haddad" size="md" />
      </div>
    </div>
  );
}
