"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { StatGrid, type Stat, type StatGridLabels } from "./stat-grid";

type State = {
  mrr: number;
  active: number;
  latency: number;
  churn: number;
  tick: number;
};

const money = (n: number) => `$${(n / 1000).toFixed(1)}k`;
const trendOf = (base: number[], last: number) => [...base.slice(1), last];

const mrrTrend = [41.2, 42.0, 41.8, 43.5, 44.1, 45.9, 46.4, 47.1].map((v) => v * 1000);
const activeTrend = [980, 1012, 1005, 1060, 1101, 1094, 1150, 1188];
const latencyTrend = [1.62, 1.58, 1.55, 1.49, 1.51, 1.44, 1.41, 1.38];
const churnTrend = [2.4, 2.3, 2.5, 2.2, 2.1, 2.3, 2.0, 1.9];

const initial: State = { mrr: 47_100, active: 1188, latency: 1.38, churn: 1.9, tick: 0 };

// New data lands every couple of seconds, like a live dashboard answer.
const script: MockStep<State>[] = [
  { delay: 1600, apply: (s) => ({ ...s, mrr: 47_920, active: 1204, tick: 1 }) },
  { delay: 1800, apply: (s) => ({ ...s, latency: 1.31, churn: 1.8, tick: 2 }) },
  { delay: 1800, apply: (s) => ({ ...s, mrr: 48_260, active: 1231, tick: 3 }) },
];

/** Keeps an amount or model name in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

/** The same dashboard in each demo language; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    locale: string;
    title: string;
    subtitle: string;
    stats: Record<"mrr" | "active" | "latency" | "churn", string>;
    lastWeek: string;
    goal: (target: string) => string;
    target: (target: string) => string;
    /** Latin "s" in every language: the value sits in a left-to-right number. */
    seconds: (n: string) => string;
    labels?: Partial<StatGridLabels>;
  }
> = {
  en: {
    locale: "en-US",
    title: "October at a glance",
    subtitle: "Updated live from the billing and usage APIs",
    stats: {
      mrr: "Monthly recurring revenue",
      active: "Weekly active teams",
      latency: "Median response time",
      churn: "Logo churn",
    },
    lastWeek: "vs. last week",
    goal: (target) => `Goal ${target}`,
    target: (target) => `Target ${target}`,
    seconds: (n) => `${n}s`,
  },
  he: {
    locale: "he-IL",
    title: "אוקטובר במבט אחד",
    subtitle: "מתעדכן בזמן אמת מממשקי החיוב והשימוש",
    stats: {
      mrr: "הכנסה חודשית חוזרת",
      active: "צוותים פעילים בשבוע",
      latency: "זמן תגובה חציוני",
      churn: "נטישת לקוחות",
    },
    lastWeek: "לעומת השבוע שעבר",
    goal: (target) => `יעד ${ltr(target)}`,
    target: (target) => `יעד ${ltr(target)}`,
    seconds: (n) => `${n}s`,
    labels: {
      flat: "ללא שינוי",
      better: ", שיפור",
      worse: ", הרעה",
      goalProgress: (percent, goal) => `${percent}% מתוך ${goal}`,
    },
  },
  ar: {
    locale: "ar",
    title: "أكتوبر في لمحة",
    subtitle: "يُحدَّث مباشرة من واجهات الفوترة والاستخدام",
    stats: {
      mrr: "الإيراد الشهري المتكرر",
      active: "الفرق النشطة أسبوعيًا",
      latency: "متوسط زمن الاستجابة",
      churn: "معدل فقدان العملاء",
    },
    lastWeek: "مقارنة بالأسبوع الماضي",
    goal: (target) => `الهدف ${ltr(target)}`,
    target: (target) => `المستهدف ${ltr(target)}`,
    seconds: (n) => `${n}s`,
    labels: {
      flat: "دون تغيير",
      better: "، تحسّن",
      worse: "، تراجع",
      goalProgress: (percent, goal) => `${percent}% من ${goal}`,
    },
  },
};

export default function StatGridDemo({
  variant = "KPIs",
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const { state } = useMockRun<State>(initial, script, { autoplay });
  const sparklines = variant === "Sparklines";

  const stats: Stat[] = [
    {
      id: "mrr",
      label: text.stats.mrr,
      value: money(state.mrr),
      delta: 9.6 + state.tick * 0.4,
      trend: trendOf(mrrTrend, state.mrr),
      goal: sparklines
        ? undefined
        : { ratio: state.mrr / 60_000, label: text.goal("$60k") },
    },
    {
      id: "active",
      label: text.stats.active,
      value: state.active.toLocaleString("en-US"),
      delta: 7.9 + state.tick * 0.3,
      trend: trendOf(activeTrend, state.active),
      hint: text.lastWeek,
      goal: sparklines
        ? undefined
        : { ratio: state.active / 1500, label: text.goal("1,500") },
    },
    {
      id: "latency",
      label: text.stats.latency,
      value: text.seconds(state.latency.toFixed(2)),
      delta: -((1.62 - state.latency) / 1.62) * 100,
      higherIsBetter: false,
      trend: trendOf(latencyTrend, state.latency),
      hint: "opus-5.5",
      goal: sparklines
        ? undefined
        : { ratio: 1.2 / state.latency, label: text.target(text.seconds("1.2")) },
    },
    {
      id: "churn",
      label: text.stats.churn,
      value: `${state.churn.toFixed(1)}%`,
      delta: -((2.4 - state.churn) / 2.4) * 100,
      higherIsBetter: false,
      trend: trendOf(churnTrend, state.churn),
      goal: sparklines
        ? undefined
        : { ratio: 1.5 / state.churn, label: text.target("1.5%") },
    },
  ];

  return (
    <StatGrid
      title={text.title}
      subtitle={text.subtitle}
      locale={text.locale}
      labels={text.labels}
      sparklines={sparklines}
      data={stats}
    />
  );
}
