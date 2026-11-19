"use client";

import { useEffect, useState } from "react";
import { ProgressBar, SegmentedBar } from "@/components/ui/progress-bar";
import type { DemoLocale } from "@/components/docs/demo";

/** The bars have no visible text: these are their accessible names. */
const copy: Record<
  DemoLocale,
  {
    intl: string;
    context: string;
    conversation: string;
    files: string;
    tools: string;
    spend: string;
    upload: string;
    requests: string;
    budget: string;
    output: string;
    queued: string;
  }
> = {
  en: {
    intl: "en-US",
    context: "Context window",
    conversation: "Conversation",
    files: "Files",
    tools: "Tools",
    spend: "Spend by model",
    upload: "Upload",
    requests: "Requests left",
    budget: "Budget",
    output: "Output tokens",
    queued: "Queued",
  },
  he: {
    intl: "he-IL",
    context: "חלון הקשר",
    conversation: "שיחה",
    files: "קבצים",
    tools: "כלים",
    spend: "הוצאה לפי מודל",
    upload: "העלאה",
    requests: "בקשות שנותרו",
    budget: "תקציב",
    output: "טוקנים בפלט",
    queued: "בתור",
  },
  ar: {
    intl: "ar",
    context: "نافذة السياق",
    conversation: "المحادثة",
    files: "الملفات",
    tools: "الأدوات",
    spend: "الإنفاق حسب النموذج",
    upload: "الرفع",
    requests: "الطلبات المتبقية",
    budget: "الميزانية",
    output: "رموز الإخراج",
    queued: "في قائمة الانتظار",
  },
};

function useTicking(autoplay: boolean) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => setStep((n) => (n + 1) % 6), 1200);
    return () => clearInterval(timer);
  }, [autoplay]);
  return step;
}

export default function ProgressBarDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const step = useTicking(autoplay);
  const text = copy[locale];

  if (variant === "Segmented") {
    return (
      <div className="flex w-full max-w-sm flex-col gap-2">
        <SegmentedBar
          label={text.context}
          locale={text.intl}
          max={200_000}
          segments={[
            {
              id: "chat",
              label: text.conversation,
              value: 52_000 + step * 9_000,
              color: "var(--brand)",
            },
            { id: "files", label: text.files, value: 31_400, color: "#5e5ce6" },
            { id: "tools", label: text.tools, value: 11_800, color: "#bf5af2" },
          ]}
        />
        <SegmentedBar
          label={text.spend}
          locale={text.intl}
          size="sm"
          striped
          max={600}
          segments={[
            { id: "opus", label: "Opus", value: 216, color: "var(--brand)" },
            { id: "sonnet", label: "Sonnet", value: 180, color: "#bf5af2" },
            { id: "haiku", label: "Haiku", value: 97, color: "#40c8e0" },
          ]}
        />
      </div>
    );
  }

  const value = 20 + step * 15;
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <ProgressBar label={text.upload} value={value} locale={text.intl} />
      <ProgressBar
        label={text.requests}
        locale={text.intl}
        kind="meter"
        value={82}
        tone="positive"
        striped
      />
      <ProgressBar
        label={text.budget}
        locale={text.intl}
        kind="meter"
        value={88}
        tone="warning"
        striped
      />
      <ProgressBar
        label={text.output}
        locale={text.intl}
        kind="meter"
        value={4}
        tone="negative"
        size="sm"
      />
      <ProgressBar
        label={text.queued}
        locale={text.intl}
        value={35}
        tone="neutral"
        size="lg"
      />
    </div>
  );
}
