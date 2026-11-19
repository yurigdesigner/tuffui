"use client";

import { CheckCircle, Clock, Warning, XCircle } from "@phosphor-icons/react";
import { StatusPill, Tag } from "@/components/ui/status-pill";
import type { DemoLocale } from "@/components/docs/demo";

const copy: Record<
  DemoLocale,
  {
    queued: string;
    running: string;
    done: string;
    failed: string;
    review: string;
    waiting: string;
    healthy: string;
    risk: string;
  }
> = {
  en: {
    queued: "Queued",
    running: "Running",
    done: "Done",
    failed: "Failed",
    review: "Needs review",
    waiting: "Waiting",
    healthy: "Healthy",
    risk: "High risk",
  },
  he: {
    queued: "בתור",
    running: "רץ",
    done: "הושלם",
    failed: "נכשל",
    review: "דורש בדיקה",
    waiting: "ממתין",
    healthy: "תקין",
    risk: "סיכון גבוה",
  },
  ar: {
    queued: "في قائمة الانتظار",
    running: "قيد التشغيل",
    done: "اكتمل",
    failed: "فشل",
    review: "يحتاج إلى مراجعة",
    waiting: "قيد الانتظار",
    healthy: "سليم",
    risk: "خطورة عالية",
  },
};

export default function StatusPillDemo({
  variant,
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
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
        <StatusPill>{text.queued}</StatusPill>
        <StatusPill tone="brand">{text.running}</StatusPill>
        <StatusPill tone="positive" icon={CheckCircle}>
          {text.done}
        </StatusPill>
        <StatusPill tone="negative" icon={XCircle}>
          {text.failed}
        </StatusPill>
        <StatusPill tone="warning" icon={Warning}>
          {text.review}
        </StatusPill>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <StatusPill size="sm" icon={Clock}>
          {text.waiting}
        </StatusPill>
        <StatusPill size="sm" tone="positive">
          {text.healthy}
        </StatusPill>
        <StatusPill size="sm" tone="negative">
          {text.risk}
        </StatusPill>
      </div>
    </div>
  );
}
