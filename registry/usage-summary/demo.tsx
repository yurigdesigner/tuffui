"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  UsageSummary,
  type UsageDay,
  type UsageModel,
  type UsageSummaryLabels,
} from "./usage-summary";

/** Model names stay as they are; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    locale: string;
    monthly: string;
    weekly: string;
    labels?: Partial<UsageSummaryLabels>;
  }
> = {
  en: { locale: "en-US", monthly: "Monthly budget", weekly: "Weekly budget" },
  he: {
    locale: "he-IL",
    monthly: "תקציב חודשי",
    weekly: "תקציב שבועי",
    labels: {
      title: "שימוש",
      subtitle: (days, tokens) => (
        <>
          {days} הימים האחרונים · {tokens} טוקנים
        </>
      ),
      up: "עלייה",
      down: "ירידה",
      vsPrevious: (percent) => <>{percent} לעומת התקופה הקודמת</>,
      chart: "עלות יומית לפי מודל. מעבר בין ימים עם מקשי החצים.",
      tokens: (tokens) => `${tokens} טוקנים`,
      overBudget: "חריגה מהתקציב",
      closeToBudget: "קרוב לתקציב",
      budget: "תקציב חודשי",
      budgetUsed: "ניצול התקציב",
      budgetValue: (spent, limit, percent) => `${spent} מתוך ${limit} (${percent})`,
      budgetWarning: (percent) => `נוצלו ${percent} מהתקציב`,
    },
  },
  ar: {
    locale: "ar",
    monthly: "الميزانية الشهرية",
    weekly: "الميزانية الأسبوعية",
    labels: {
      title: "الاستخدام",
      subtitle: (days, tokens) => (
        <>
          آخر {days} {days <= 10 ? "أيام" : "يومًا"} · {tokens} رمز
        </>
      ),
      up: "ارتفاع",
      down: "انخفاض",
      vsPrevious: (percent) => <>{percent} مقارنة بالفترة السابقة</>,
      chart: "التكلفة اليومية حسب النموذج. استخدم مفاتيح الأسهم للتنقل بين الأيام.",
      tokens: (tokens) => `${tokens} رمز`,
      overBudget: "تجاوز الميزانية",
      closeToBudget: "قريب من الميزانية",
      budget: "الميزانية الشهرية",
      budgetUsed: "المستخدم من الميزانية",
      budgetValue: (spent, limit, percent) => `${spent} من ${limit} (${percent})`,
      budgetWarning: (percent) => `استُخدم ${percent} من الميزانية`,
    },
  },
};

const models: UsageModel[] = [
  { id: "opus", name: "Claude Opus 5.5" },
  { id: "sonnet", name: "Claude Sonnet 5.5" },
  { id: "haiku", name: "Claude Haiku 5.5" },
];

// Rough $ per 1k tokens, blended input/output.
const price = { opus: 0.03, sonnet: 0.008, haiku: 0.002 };

/** Deterministic, weekday-heavy usage ending on Nov 3. */
function makeDays(count: number): UsageDay[] {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.UTC(2026, 10, 3 - (count - 1 - i)));
    const weekend = [0, 6].includes(date.getUTCDay());
    const wave = 0.6 + (((i * 37) % 11) / 11) * 0.8;
    const scale = (weekend ? 0.35 : 1) * wave;
    const tokens = {
      opus: Math.round(310_000 * scale * (i % 3 === 0 ? 1.4 : 0.8)),
      sonnet: Math.round(1_150_000 * scale),
      haiku: Math.round(2_400_000 * scale * (i % 4 === 1 ? 0.5 : 1)),
    };
    return {
      date: date.toISOString().slice(0, 10),
      byModel: Object.fromEntries(
        Object.entries(tokens).map(([id, t]) => [
          id,
          { tokens: t, cost: (t / 1000) * price[id as keyof typeof price] },
        ]),
      ),
    };
  });
}

type State = { grow: number; today: number };

const script: MockStep<State>[] = [
  ...[0.25, 0.55, 0.85, 1].map((grow) => ({
    delay: 120,
    apply: (s: State) => ({ ...s, grow }),
  })),
  wait(900),
  ...[1, 2, 3, 4, 5].map(() => ({
    delay: 800,
    apply: (s: State) => ({ ...s, today: s.today + 0.18 }),
  })),
];

export default function UsageSummaryDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const month = variant === "Month";
  const { state } = useMockRun<State>({ grow: autoplay ? 0 : 1, today: 0 }, script, {
    autoplay,
  });

  const base = makeDays(month ? 30 : 7);
  const days = base.map((day, i) => {
    const last = i === base.length - 1;
    const factor = state.grow * (last ? 0.55 + state.today : 1);
    return {
      ...day,
      byModel: Object.fromEntries(
        Object.entries(day.byModel).map(([id, m]) => [
          id,
          { tokens: m.tokens * factor, cost: m.cost * factor },
        ]),
      ),
    };
  });

  return (
    <UsageSummary
      data={{
        days,
        models,
        previousCost: month ? 412 : 118,
        budget: month
          ? { limit: 600, label: text.monthly }
          : { limit: 160, label: text.weekly },
      }}
      locale={text.locale}
      labels={text.labels}
    />
  );
}
