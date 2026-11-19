"use client";

import { Avatar, AvatarGroup, type AvatarLabels } from "@/components/ui/agent-avatar";
import type { DemoLocale } from "@/components/docs/demo";

/** Names stay as they are; only the spoken status and group labels change. */
const labels: Record<DemoLocale, Partial<AvatarLabels> | undefined> = {
  en: undefined,
  he: {
    status: { online: "מחובר", away: "לא ליד המחשב", busy: "עסוק", working: "עובד" },
    participants: (count) => `${count} משתתפים`,
    more: (count, names) => `ועוד ${count}: ${names}`,
  },
  ar: {
    status: { online: "متصل", away: "بعيد", busy: "مشغول", working: "يعمل" },
    participants: (count) =>
      count === 1
        ? "مشارك واحد"
        : count === 2
          ? "مشاركان"
          : count <= 10
            ? `${count} مشاركين`
            : `${count} مشاركًا`,
    more: (count, names) =>
      `${count === 1 ? "وشخص آخر" : count === 2 ? "وشخصان آخران" : `و${count} آخرون`}: ${names}`,
    list: (names) => names.join("، "),
  },
};

export default function AgentAvatarDemo({
  variant,
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  const l = labels[locale];
  if (variant === "Group") {
    return (
      <div className="flex flex-col items-center gap-6 [--avatar-gap:var(--surface-inset)]">
        <AvatarGroup
          labels={l}
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
          labels={l}
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
        <Avatar labels={l} name="i18n-agent" kind="agent" size="xs" />
        <Avatar labels={l} name="i18n-agent" kind="agent" size="sm" status="working" />
        <Avatar labels={l} name="i18n-agent" kind="agent" size="md" status="working" />
        <Avatar labels={l} name="i18n-agent" kind="agent" size="lg" status="online" />
      </div>
      <div className="flex items-end gap-4">
        <Avatar labels={l} name="Ana Ribeiro" size="md" status="online" />
        <Avatar labels={l} name="Jonas Weber" size="md" status="away" />
        <Avatar labels={l} name="Mei Tanaka" size="md" status="busy" />
        <Avatar labels={l} name="Omar Haddad" size="md" />
      </div>
    </div>
  );
}
