"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { DotHistogram, type DotHistogramLabels } from "./dot-histogram";

// Seeded noise so the server and the client draw the same chart.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

function logNormal(count: number, median: number, spread: number, seed: number) {
  const next = rng(seed);
  return Array.from({ length: count }, () => {
    const g = Math.sqrt(-2 * Math.log(next() || 1e-9)) * Math.cos(2 * Math.PI * next());
    return median * Math.exp(g * spread);
  });
}

const latency = [
  ...logNormal(296, 4.2, 0.42, 7).map((v) => Math.min(v, 14.6)),
  ...logNormal(24, 15.4, 0.015, 11),
];

const tokens = logNormal(420, 1800, 0.5, 3).map(Math.round);

/** Keeps a Latin name in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

type Scenario = {
  title: string;
  subtitle: string;
  threshold: string;
  unit: string;
  count?: DotHistogramLabels["count"];
};

/** Model names and units stay Latin; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    latency: Scenario;
    tokens: Scenario;
    intl: string;
    labels?: Partial<DotHistogramLabels>;
  }
> = {
  en: {
    latency: {
      title: "Response time",
      subtitle: "Last 320 runs · timeout 15 s",
      threshold: "timed out",
      unit: "runs",
    },
    tokens: {
      title: "Output tokens",
      subtitle: "Per response · sonnet-5.5 · today",
      threshold: "hit max_tokens",
      unit: "responses",
    },
    intl: "en-US",
  },
  he: {
    latency: {
      title: "זמן תגובה",
      subtitle: "320 הריצות האחרונות · מגבלת זמן 15 שניות",
      threshold: "חרגו מהזמן",
      unit: "ריצות",
      count: (n, f) => (n === 1 ? "ריצה אחת" : `${f} ריצות`),
    },
    tokens: {
      title: "טוקני פלט",
      subtitle: `לכל תשובה · ${ltr("sonnet-5.5")} · היום`,
      threshold: `הגיעו ל־${ltr("max_tokens")}`,
      unit: "תשובות",
      count: (n, f) => (n === 1 ? "תשובה אחת" : `${f} תשובות`),
    },
    intl: "he-IL",
    labels: {
      median: "חציון",
      p95: "p95",
      perDot: (count) => `נקודה = ${count}`,
      summary: (count, median, p95) => `${count}, חציון ${median}, p95 ${p95}`,
      instructions: (title) => `${title}. אפשר לעבור בין העמודות עם מקשי החיצים.`,
      range: (from, to, count) => `${from} עד ${to}: ${count}`,
    },
  },
  ar: {
    latency: {
      title: "زمن الاستجابة",
      subtitle: "آخر 320 عملية تشغيل · المهلة 15 ثانية",
      threshold: "انتهت مهلتها",
      unit: "عمليات",
      count: (n, f) =>
        n === 1
          ? "عملية واحدة"
          : n === 2
            ? "عمليتان"
            : n % 100 >= 3 && n % 100 <= 10
              ? `${f} عمليات`
              : `${f} عملية`,
    },
    tokens: {
      title: "رموز الإخراج",
      subtitle: `لكل رد · ${ltr("sonnet-5.5")} · اليوم`,
      threshold: `بلغت ${ltr("max_tokens")}`,
      unit: "ردود",
      count: (n, f) =>
        n === 1
          ? "رد واحد"
          : n === 2
            ? "ردّان"
            : n % 100 >= 3 && n % 100 <= 10
              ? `${f} ردود`
              : `${f} ردًّا`,
    },
    intl: "ar",
    labels: {
      median: "الوسيط",
      p95: "p95",
      perDot: (count) => `النقطة = ${count}`,
      summary: (count, median, p95) => `${count}، الوسيط ${median}، p95 ${p95}`,
      instructions: (title) => `${title}. استخدم مفاتيح الأسهم لقراءة الأعمدة.`,
      range: (from, to, count) => `من ${from} إلى ${to}: ${count}`,
    },
  },
};

export default function DotHistogramDemo({
  variant = "Latency",
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const scenario = variant === "Tokens" ? text.tokens : text.latency;
  const labels = scenario.count ? { ...text.labels, count: scenario.count } : text.labels;
  return variant === "Tokens" ? (
    <DotHistogram
      title={scenario.title}
      subtitle={scenario.subtitle}
      values={tokens}
      threshold={4096}
      thresholdLabel={scenario.threshold}
      unit={scenario.unit}
      format={(v) => (v >= 1000 ? `${+(v / 1000).toFixed(1)}k` : `${Math.round(v)}`)}
      labels={labels}
      locale={text.intl}
    />
  ) : (
    <DotHistogram
      title={scenario.title}
      subtitle={scenario.subtitle}
      values={latency}
      threshold={15}
      thresholdLabel={scenario.threshold}
      unit={scenario.unit}
      format={(v) => `${+v.toFixed(1)}s`}
      labels={labels}
      locale={text.intl}
    />
  );
}
