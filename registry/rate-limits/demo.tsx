"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  RateLimits,
  type QueuedCall,
  type RateLimit,
  type RateLimitsLabels,
} from "./rate-limits";

/** Keeps a Latin name or number in reading order inside RTL text. */
const ltr = (text: string) => `\u2066${text}\u2069`;

/** The same account in each demo language; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    locale: string;
    buckets: Record<string, string>;
    queue: Record<string, string>;
    labels?: Partial<RateLimitsLabels>;
  }
> = {
  en: {
    locale: "en-US",
    buckets: { req: "Requests", in: "Input tokens", out: "Output tokens" },
    queue: {
      q1: "summarize release notes",
      q2: "draft changelog section",
      q3: "translate announcement",
    },
  },
  he: {
    locale: "he-IL",
    buckets: { req: "בקשות", in: "טוקני קלט", out: "טוקני פלט" },
    queue: {
      q1: "סיכום הערות הגרסה",
      q2: "טיוטת סעיף ביומן השינויים",
      q3: "תרגום ההודעה",
    },
    labels: {
      title: "מגבלות קצב",
      healthy: "תקין",
      throttled: "מוגבל",
      perMinute: "לדקה",
      left: (remaining, limit) => (
        <>
          נשארו {remaining} מתוך {limit}
        </>
      ),
      meter: (label) => `${label} שנותרו לדקה`,
      meterValue: (remaining, limit, resets) =>
        `נשארו ${remaining} מתוך ${limit}, מתאפס בעוד ${resets}`,
      full: "מלא",
      resetsIn: (time) => <>מתאפס בעוד {time}</>,
      seconds: (n) => `${n} ש׳`,
      countdown: (n) => <>{n} ש׳</>,
      outOf: (label) => `נגמרו ${label}`,
      rateLimited: "הקצב הוגבל",
      capacityBack: "יש שוב קיבולת — הקריאות שבתור יכולות לרוץ",
      retryAfter: (time) => <>ניסיון חוזר בעוד {time}</>,
      retryAfterText: (time) => `ניסיון חוזר בעוד ${time}`,
      retryNow: "לנסות עכשיו",
      timeUntilRetry: "זמן עד לניסיון חוזר",
      waiting: (count) => (count === 1 ? "קריאה אחת ממתינה" : `${count} קריאות ממתינות`),
      tokens: (tokens) => `${ltr(tokens)} טוקנים`,
      cleared: "מגבלת הקצב הוסרה",
      limited: (time) => `הקצב הוגבל, ניסיון חוזר בעוד ${time}`,
    },
  },
  ar: {
    locale: "ar",
    buckets: { req: "الطلبات", in: "رموز الإدخال", out: "رموز الإخراج" },
    queue: {
      q1: "تلخيص ملاحظات الإصدار",
      q2: "مسودة قسم سجل التغييرات",
      q3: "ترجمة الإعلان",
    },
    labels: {
      title: "حدود المعدّل",
      healthy: "سليم",
      throttled: "مقيّد",
      perMinute: "في الدقيقة",
      left: (remaining, limit) => (
        <>
          يتبقى {remaining} من {limit}
        </>
      ),
      meter: (label) => `${label} المتبقية في الدقيقة`,
      meterValue: (remaining, limit, resets) =>
        `يتبقى ${remaining} من ${limit}، يُعاد الضبط خلال ${resets}`,
      full: "ممتلئ",
      resetsIn: (time) => <>يُعاد الضبط خلال {time}</>,
      seconds: (n) => `${n} ث`,
      countdown: (n) => <>{n} ث</>,
      outOf: (label) => `نفدت ${label}`,
      rateLimited: "تم تقييد المعدّل",
      capacityBack: "عادت السعة — يمكن تشغيل الاستدعاءات المنتظرة",
      retryAfter: (time) => <>إعادة المحاولة خلال {time}</>,
      retryAfterText: (time) => `إعادة المحاولة خلال ${time}`,
      retryNow: "أعد المحاولة الآن",
      timeUntilRetry: "الوقت حتى إعادة المحاولة",
      waiting: (count) =>
        count === 1
          ? "استدعاء واحد في الانتظار"
          : count === 2
            ? "استدعاءان في الانتظار"
            : count <= 10
              ? `${count} استدعاءات في الانتظار`
              : `${count} استدعاءً في الانتظار`,
      tokens: (tokens) => `${ltr(tokens)} رمز`,
      cleared: "رُفع تقييد المعدّل",
      limited: (time) => `تم تقييد المعدّل، إعادة المحاولة خلال ${time}`,
    },
  },
};

type State = { limits: RateLimit[]; queued: QueuedCall[]; retryAfterMs: number };

const full: RateLimit[] = [
  { id: "req", label: "Requests", limit: 4_000, remaining: 4_000, resetsInMs: 0 },
  {
    id: "in",
    label: "Input tokens",
    limit: 2_000_000,
    remaining: 2_000_000,
    resetsInMs: 0,
  },
  {
    id: "out",
    label: "Output tokens",
    limit: 400_000,
    remaining: 400_000,
    resetsInMs: 0,
  },
];

/** One API call: spends from every bucket and starts the reset timers. */
const call = (input: number, output: number, delay = 700): MockStep<State> => ({
  delay,
  apply: (s) => ({
    ...s,
    limits: s.limits.map((l) => {
      const spent = l.id === "req" ? 180 : l.id === "in" ? input : output;
      return {
        ...l,
        remaining: Math.max(0, l.remaining - spent),
        resetsInMs: l.resetsInMs || 12_000,
      };
    }),
  }),
});

const refill = (ids: string[]): MockStep<State> => ({
  delay: 0,
  apply: (s) => ({
    ...s,
    limits: s.limits.map((l) =>
      ids.includes(l.id) ? { ...l, remaining: l.limit, resetsInMs: 0 } : l,
    ),
  }),
});

const healthy: MockStep<State>[] = [
  wait(600),
  call(180_000, 38_000),
  call(240_000, 52_000),
  call(120_000, 21_000),
  call(310_000, 64_000),
  call(90_000, 18_000),
  wait(2_400),
  refill(["req", "in", "out"]),
  call(150_000, 30_000, 900),
];

const queue: QueuedCall[] = [
  { id: "q1", label: "summarize release notes", tokens: 42_000 },
  { id: "q2", label: "draft changelog section", tokens: 28_000 },
  { id: "q3", label: "translate announcement", tokens: 19_000 },
];

const throttled: MockStep<State>[] = [
  wait(700),
  call(380_000, 140_000),
  call(420_000, 160_000),
  call(300_000, 100_000),
  { delay: 400, apply: (s) => ({ ...s, queued: queue, retryAfterMs: 8_000 }) },
  wait(8_200),
  refill(["out"]),
  { delay: 0, apply: (s) => ({ ...s, retryAfterMs: 0 }) },
  ...queue.map((q) => ({
    delay: 700,
    apply: (s: State) => ({
      ...s,
      queued: s.queued.filter((x) => x.id !== q.id),
      limits: s.limits.map((l) =>
        l.id === "out"
          ? { ...l, remaining: l.remaining - (q.tokens ?? 0), resetsInMs: 12_000 }
          : l,
      ),
    }),
  })),
];

export default function RateLimitsDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const isThrottled = variant === "Throttled";
  const { state, setState } = useMockRun<State>(
    { limits: full, queued: [], retryAfterMs: 0 },
    isThrottled ? throttled : healthy,
    { autoplay },
  );

  return (
    <RateLimits
      data={{
        model: "opus-5.5 · Tier 3",
        ...state,
        // Text is added at render time, so the run itself stays language-free.
        limits: state.limits.map((l) => ({ ...l, label: text.buckets[l.id] })),
        queued: state.queued.map((q) => ({ ...q, label: text.queue[q.id] })),
      }}
      locale={text.locale}
      labels={text.labels}
      onRetry={() =>
        setState((s) => ({
          ...s,
          retryAfterMs: 0,
          limits: s.limits.map((l) => ({ ...l, remaining: l.limit, resetsInMs: 0 })),
        }))
      }
    />
  );
}
