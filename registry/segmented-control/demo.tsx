"use client";

import { Segmented } from "@/components/ui/segmented-control";
import type { DemoLocale } from "@/components/docs/demo";

const copy: Record<
  DemoLocale,
  {
    mode: string;
    modes: [ask: string, plan: string, act: string];
    period: string;
    week: string;
    month: string;
    metric: string;
    time: string;
    tokens: string;
    cost: string;
    calls: string;
  }
> = {
  en: {
    mode: "Mode",
    modes: ["Ask", "Plan", "Act"],
    period: "Period",
    week: "Week",
    month: "Month",
    metric: "Metric",
    time: "Time",
    tokens: "Tokens",
    cost: "Cost",
    calls: "Calls",
  },
  he: {
    mode: "מצב",
    modes: ["שאלה", "תכנון", "ביצוע"],
    period: "תקופה",
    week: "שבוע",
    month: "חודש",
    metric: "מדד",
    time: "זמן",
    tokens: "טוקנים",
    cost: "עלות",
    calls: "קריאות",
  },
  ar: {
    mode: "الوضع",
    modes: ["سؤال", "تخطيط", "تنفيذ"],
    period: "الفترة",
    week: "أسبوع",
    month: "شهر",
    metric: "المقياس",
    time: "الوقت",
    tokens: "الرموز",
    cost: "التكلفة",
    calls: "الاستدعاءات",
  },
};

export default function SegmentedControlDemo({
  variant,
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  if (variant === "Sizes") {
    return (
      <div className="flex flex-col items-center gap-3">
        <Segmented
          label={text.period}
          options={[
            { value: "week", label: text.week },
            { value: "month", label: text.month },
          ]}
        />
        <Segmented
          label={text.metric}
          size="md"
          options={[
            { value: "time", label: text.time },
            { value: "tokens", label: text.tokens },
            { value: "cost", label: text.cost },
            { value: "calls", label: text.calls, disabled: true },
          ]}
        />
      </div>
    );
  }
  const [ask, plan, act] = text.modes;
  return (
    <Segmented
      label={text.mode}
      options={[
        { value: "ask", label: ask },
        { value: "plan", label: plan },
        { value: "act", label: act },
      ]}
      defaultValue="plan"
    />
  );
}
