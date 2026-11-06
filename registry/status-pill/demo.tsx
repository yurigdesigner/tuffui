"use client";

import { CheckCircle, Clock, Warning, XCircle } from "@phosphor-icons/react";
import { StatusPill, Tag } from "@/components/ui/status-pill";

export default function StatusPillDemo({ variant }: { variant?: string }) {
  if (variant === "Tags") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Tag>opus-5.5</Tag>
        <Tag>http</Tag>
        <Tag>stdio</Tag>
        <Tag>feat/onboarding-de</Tag>
        <Tag>.tsx</Tag>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <StatusPill>Queued</StatusPill>
        <StatusPill tone="brand">Running</StatusPill>
        <StatusPill tone="positive" icon={CheckCircle}>
          Done
        </StatusPill>
        <StatusPill tone="negative" icon={XCircle}>
          Failed
        </StatusPill>
        <StatusPill tone="warning" icon={Warning}>
          Needs review
        </StatusPill>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <StatusPill size="sm" icon={Clock}>
          Waiting
        </StatusPill>
        <StatusPill size="sm" tone="positive">
          Healthy
        </StatusPill>
        <StatusPill size="sm" tone="negative">
          High risk
        </StatusPill>
      </div>
    </div>
  );
}
