"use client";

import { useState } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  DeliveryHeatmap,
  type DeliveryBucket,
  type DeliveryEndpoint,
  type DeliveryHeatmapLabels,
  type DeliveryRange,
} from "./delivery-heatmap";

// Seeded noise so the server and the client draw the same data.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

/** Peak attempts per hour, the hour traffic peaks and how wide the day is. */
const ENDPOINTS = [
  { id: "orders-api", scale: 640, peak: 13, spread: 4.2 },
  { id: "billing-svc", scale: 470, peak: 13, spread: 3.6 },
  { id: "crm-sync", scale: 300, peak: 13, spread: 3.4 },
  { id: "slack-relay", scale: 150, peak: 15, spread: 5 },
  { id: "analytics", scale: 420, peak: 14, spread: 3.2 },
  { id: "fulfil-eu", scale: 230, peak: 10, spread: 3.6 },
  { id: "search-index", scale: 380, peak: 12, spread: 3.4 },
  { id: "audit-log", scale: 140, peak: 13, spread: 6 },
];

const HOURS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);
const MINUTES = Array.from(
  { length: 12 },
  (_, i) => `11:${String(i * 5).padStart(2, "0")}`,
);
const DAYS = ["Oct 29", "Oct 30", "Oct 31", "Nov 1", "Nov 2", "Nov 3", "Nov 4"];
/** Weekend traffic runs lighter. */
const DAY_LOAD = [1, 0.97, 0.78, 0.72, 1.02, 0.98, 1];

/** Failures that are there from the start, by endpoint and hour. */
const INCIDENTS: Record<string, Record<number, { share: number; status: number }>> = {
  "audit-log": { 3: { share: 0.62, status: 500 } },
  "slack-relay": { 19: { share: 0.48, status: 429 } },
};
/** The billing outage, hour by hour, in the order it spreads. */
const SPIKE = [
  { hour: 11, share: 0.8, status: 503 },
  { hour: 10, share: 0.42, status: 502 },
  { hour: 12, share: 0.55, status: 503 },
];

const noise = rng(7);
const BASE = ENDPOINTS.map((e) =>
  HOURS.map((_, h) => {
    const curve = 0.07 + 0.93 * Math.exp(-((h - e.peak) ** 2) / (2 * e.spread ** 2));
    return Math.round(e.scale * curve * (0.86 + noise() * 0.28));
  }),
);
const BASE_FAILED = BASE.map((row) =>
  row.map((a) => (noise() < 0.4 ? Math.round(a * noise() * 0.006) : 0)),
);
const MINUTE_NOISE = BASE.map(() => MINUTES.map(() => 0.8 + noise() * 0.4));
const DAY_NOISE = BASE.map(() => DAYS.map(() => 0.92 + noise() * 0.16));

function failure(id: string, h: number, level: number) {
  const spike = id === "billing-svc" && SPIKE.slice(0, level).find((s) => s.hour === h);
  return spike || INCIDENTS[id]?.[h];
}

function hours(level: number): DeliveryEndpoint[] {
  return ENDPOINTS.map((e, r) => ({
    id: e.id,
    label: e.id,
    buckets: HOURS.map((_, h): DeliveryBucket => {
      const f = failure(e.id, h, level);
      // Failed deliveries are retried, so a failing hour has more attempts.
      const attempts = Math.round(BASE[r][h] * (f ? 1 + f.share * 0.4 : 1));
      return f
        ? { attempts, failed: Math.round(attempts * f.share), status: f.status }
        : { attempts, failed: BASE_FAILED[r][h] };
    }),
  }));
}

function minutes(level: number): DeliveryEndpoint[] {
  return ENDPOINTS.map((e, r) => ({
    id: e.id,
    label: e.id,
    buckets: MINUTES.map((_, i): DeliveryBucket => {
      // 11:00 goes down with the first beat and recovers at 11:50 until the third.
      const down = e.id === "billing-svc" && level > 0 && (i < 10 || level > 2);
      const attempts = Math.round(
        (BASE[r][11] / 12) * MINUTE_NOISE[r][i] * (down ? 1.3 : 1),
      );
      return down
        ? { attempts, failed: Math.round(attempts * (i < 2 ? 0.55 : 0.82)), status: 503 }
        : { attempts, failed: 0 };
    }),
  }));
}

function days(level: number): DeliveryEndpoint[] {
  const today = hours(level);
  return ENDPOINTS.map((e, r) => {
    const total = today[r].buckets.reduce((a, b) => a + b.attempts, 0);
    const base = BASE[r].reduce((a, b) => a + b, 0);
    return {
      id: e.id,
      label: e.id,
      buckets: DAYS.map((_, d): DeliveryBucket => {
        if (d === DAYS.length - 1) {
          const failed = today[r].buckets.reduce((a, b) => a + b.failed, 0);
          return { attempts: total, failed, status: failed > 200 ? 503 : undefined };
        }
        const attempts = Math.round(base * DAY_LOAD[d] * DAY_NOISE[r][d]);
        // crm-sync lost its token over the weekend.
        if (e.id === "crm-sync" && d === 3)
          return { attempts, failed: Math.round(attempts * 0.18), status: 401 };
        return { attempts, failed: Math.round(attempts * 0.0015) };
      }),
    };
  });
}

const VIEWS: Record<
  DeliveryRange,
  { labels: string[]; date: string; data: (level: number) => DeliveryEndpoint[] }
> = {
  "1h": { labels: MINUTES, date: "Nov 4 · 11:00–12:00 UTC", data: minutes },
  "24h": { labels: HOURS, date: "Nov 4 · UTC", data: hours },
  "7d": { labels: DAYS, date: "Oct 29 – Nov 4 · UTC", data: days },
};

/** Keeps a Latin name, time or code in reading order inside RTL text. */
const ltr = (text: string) => `\u2066${text}\u2069`;

const dayLabels = (locale: string) =>
  [29, 30, 31, 1, 2, 3, 4].map((d, i) =>
    new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(Date.UTC(2026, i < 3 ? 9 : 10, d)),
  );

/** Arabic plural for endpoints and columns. */
const arCount = (n: number, one: string, two: string, few: string, many: string) =>
  n === 1 ? one : n === 2 ? two : n <= 10 ? `${n} ${few}` : `${n} ${many}`;

/** Endpoint names and hours stay as they are; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    locale?: string;
    title?: string;
    section?: string;
    heading?: string;
    days?: string[];
    dates?: Record<DeliveryRange, string>;
    strings?: Partial<DeliveryHeatmapLabels>;
  }
> = {
  en: {},
  he: {
    locale: "he-IL",
    title: "מסירות",
    section: "Webhooks",
    heading: "ניסיונות לפי נקודת קצה",
    days: dayLabels("he-IL"),
    dates: {
      "1h": `4 בנוב׳ · ${ltr("11:00–12:00 UTC")}`,
      "24h": `4 בנוב׳ · ${ltr("UTC")}`,
      "7d": `29 באוק׳ – 4 בנוב׳ · ${ltr("UTC")}`,
    },
    strings: {
      range: "טווח",
      ranges: { "1h": "שעה", "24h": "24 שעות", "7d": "7 ימים" },
      failing: { "1h": "5 דקות עם כשלים", "24h": "שעה עם כשלים", "7d": "יום עם כשלים" },
      fewer: "פחות",
      more: "יותר",
      attempts: "ניסיונות",
      delivered: "נמסרו",
      failed: "נכשלו",
      tipFailed: (failed) => `${failed} נכשלו`,
      tipOf: (attempts) => `מתוך ${attempts}`,
      tipDelivered: (attempts) => `${attempts} נמסרו`,
      gridHint: "מעבר בין התאים בעזרת מקשי החיצים.",
      cell: (c) =>
        `${ltr(c.endpoint)}, ${ltr(c.column)}: ${c.attempts} ניסיונות, ${c.failed} נכשלו${c.status !== undefined ? `, סטטוס ${c.status}` : ""}${c.failing ? ", בכשל" : ""}`,
      summary: (s) =>
        `${s.heading}${s.date ? `, ${s.date}` : ""}: ${s.endpoints} נקודות קצה לאורך ${s.columns} עמודות, ${s.attempts} ניסיונות, ${s.failed} נכשלו.${s.failing.length ? ` בכשל: ${s.failing.map((f) => `${ltr(f.endpoint)} ב־${ltr(f.column)}`).join(", ")}.` : " אין כשלים."}`,
    },
  },
  ar: {
    locale: "ar",
    title: "عمليات التسليم",
    section: "Webhooks",
    heading: "المحاولات حسب نقطة النهاية",
    days: dayLabels("ar"),
    dates: {
      "1h": `4 نوفمبر · ${ltr("11:00–12:00 UTC")}`,
      "24h": `4 نوفمبر · ${ltr("UTC")}`,
      "7d": `29 أكتوبر – 4 نوفمبر · ${ltr("UTC")}`,
    },
    strings: {
      range: "النطاق",
      ranges: { "1h": "ساعة", "24h": "24 ساعة", "7d": "7 أيام" },
      failing: {
        "1h": "5 دقائق فيها إخفاقات",
        "24h": "ساعة فيها إخفاقات",
        "7d": "يوم فيه إخفاقات",
      },
      fewer: "أقل",
      more: "أكثر",
      attempts: "المحاولات",
      delivered: "تم التسليم",
      failed: "فشلت",
      tipFailed: (failed) => `فشلت ${failed}`,
      tipOf: (attempts) => `من ${attempts}`,
      tipDelivered: (attempts) => `تم تسليم ${attempts}`,
      gridHint: "استخدم مفاتيح الأسهم للتنقل بين الخلايا.",
      cell: (c) =>
        `${ltr(c.endpoint)}، ${ltr(c.column)}: ${c.attempts} محاولة، فشلت ${c.failed}${c.status !== undefined ? `، الحالة ${c.status}` : ""}${c.failing ? "، متعثّرة" : ""}`,
      summary: (s) =>
        `${s.heading}${s.date ? `، ${s.date}` : ""}: ${arCount(s.endpoints, "نقطة نهاية واحدة", "نقطتا نهاية", "نقاط نهاية", "نقطة نهاية")} على ${arCount(s.columns, "عمود واحد", "عمودان", "أعمدة", "عمودًا")}، ${s.attempts} محاولة، فشلت ${s.failed}.${s.failing.length ? ` متعثّرة: ${s.failing.map((f) => `${ltr(f.endpoint)} عند ${ltr(f.column)}`).join("، ")}.` : " لا توجد إخفاقات."}`,
    },
  },
};

type State = { level: number };

export default function DeliveryHeatmapDemo({
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const [range, setRange] = useState<DeliveryRange>("24h");
  // Cells fill in first, then the billing outage spreads hour by hour.
  const steps: MockStep<State>[] = autoplay
    ? [
        wait(1500),
        ...SPIKE.map((_, i) => ({ delay: 750, apply: () => ({ level: i + 1 }) })),
      ]
    : [];
  const { state } = useMockRun<State>({ level: autoplay ? 0 : SPIKE.length }, steps, {
    autoplay,
  });
  const view = VIEWS[range];

  return (
    <DeliveryHeatmap
      endpoints={view.data(state.level)}
      labels={range === "7d" && text.days ? text.days : view.labels}
      date={text.dates?.[range] ?? view.date}
      title={text.title}
      section={text.section}
      heading={text.heading}
      locale={text.locale}
      strings={text.strings}
      range={range}
      onRangeChange={setRange}
      intro={autoplay}
      onSelect={() => {}}
    />
  );
}
