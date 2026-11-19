"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  ToolCallGraph,
  type ToolCallGraphLabels,
  type ToolCallNode,
} from "./tool-call-graph";

/** Keeps a Latin name or number in reading order inside RTL text. */
const ltr = (text: string) => `\u2066${text}\u2069`;

const AGENT = "triage-l · v14";

/** Tool names are code and stay as they are; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    locale: string;
    subtitle: (calls: string) => string;
    meta: string;
    perRun: string;
    latencyShare: string;
    retries: string;
    hotPath: string;
    labels?: Partial<ToolCallGraphLabels>;
  }
> = {
  en: {
    locale: "en-US",
    subtitle: (calls) => `${AGENT} · last 24 h · ${calls} calls`,
    meta: "agent · 3.1k runs",
    perRun: "Calls / run",
    latencyShare: "Tool share of latency",
    retries: "Retries",
    hotPath: "Hot path",
  },
  he: {
    locale: "he-IL",
    subtitle: (calls) => `${ltr(AGENT)} · 24 השעות האחרונות · ${calls} קריאות`,
    meta: `סוכן · ${ltr("3.1k")} הרצות`,
    perRun: "קריאות להרצה",
    latencyShare: "חלק הכלים בזמן התגובה",
    retries: "ניסיונות חוזרים",
    hotPath: "הנתיב החם",
    labels: {
      title: "גרף קריאות לכלים",
      metrics: { calls: "קריאות", latency: "זמן תגובה", errors: "שגיאות" },
      nouns: {
        calls: "נפח קריאות",
        latency: `זמן תגובה ${ltr("p50")}`,
        errors: "שיעור שגיאות",
      },
      edgeMetric: "מדד הקשתות",
      calls: "קריאות",
      errorRate: "שיעור שגיאות",
      retries: "ניסיונות חוזרים",
      node: (label, calls, latency, errors, highest) =>
        `${ltr(label)}: ${calls} קריאות, ${ltr(`p50 ${latency}`)}, ${errors} שגיאות${highest ? `, הכי גבוה ב${highest}` : ""}`,
      callCount: (calls) => `${calls} קריאות`,
      err: "שגיאות",
      highest: (noun, label) => `הכי גבוה ב${noun}: ${ltr(label)}`,
    },
  },
  ar: {
    locale: "ar",
    subtitle: (calls) => `${ltr(AGENT)} · آخر 24 ساعة · ${calls} استدعاء`,
    meta: `وكيل · ${ltr("3.1k")} تشغيل`,
    perRun: "استدعاءات لكل تشغيل",
    latencyShare: "حصة الأدوات من زمن الاستجابة",
    retries: "إعادات المحاولة",
    hotPath: "المسار الأكثر نشاطًا",
    labels: {
      title: "مخطط استدعاءات الأدوات",
      metrics: { calls: "الاستدعاءات", latency: "زمن الاستجابة", errors: "الأخطاء" },
      nouns: {
        calls: "حجم الاستدعاءات",
        latency: `زمن الاستجابة ${ltr("p50")}`,
        errors: "معدل الأخطاء",
      },
      edgeMetric: "مقياس الروابط",
      calls: "الاستدعاءات",
      errorRate: "معدل الأخطاء",
      retries: "إعادات المحاولة",
      node: (label, calls, latency, errors, highest) =>
        `${ltr(label)}: ${calls} استدعاء، ${ltr(`p50 ${latency}`)}، ${errors} أخطاء${highest ? `، الأعلى في ${highest}` : ""}`,
      callCount: (calls) => `${calls} استدعاء`,
      err: "أخطاء",
      highest: (noun, label) => `الأعلى في ${noun}: ${ltr(label)}`,
    },
  },
};

// Seeded noise so the server and the client draw the same feed.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

type Tool = ToolCallNode & { retries: number };

/** Where the 24 h window ends up; the feed counts its way here. */
const FINAL: Tool[] = [
  {
    id: "crm",
    label: "crm.lookup",
    calls: 4820,
    p50Ms: 212,
    errorRate: 0.004,
    retries: 41,
  },
  {
    id: "kb",
    label: "kb.search",
    calls: 3910,
    p50Ms: 340,
    errorRate: 0.006,
    retries: 52,
  },
  {
    id: "refund",
    label: "refund.create",
    calls: 1240,
    p50Ms: 1800,
    errorRate: 0.029,
    retries: 96,
  },
  {
    id: "email",
    label: "email.send",
    calls: 1610,
    p50Ms: 420,
    errorRate: 0.001,
    retries: 12,
  },
  {
    id: "calendar",
    label: "calendar.book",
    calls: 900,
    p50Ms: 610,
    errorRate: 0.003,
    retries: 17,
  },
];

const TICKS = 40;
const TICK = 1400;
// The refund provider starts failing a third of the way in and settles high.
const SPIKE = [12, 20];

function simulate(): Tool[][] {
  const next = rng(11);
  // Uneven but monotonic: each tool's share of the remaining calls per tick.
  const steps = FINAL.map(() => Array.from({ length: TICKS }, () => 0.6 + next() * 0.8));
  const sums = steps.map((s) => s.reduce((a, b) => a + b, 0));
  const ramp = (k: number) =>
    Math.min(Math.max((k - SPIKE[0]) / (SPIKE[1] - SPIKE[0]), 0), 1);
  const ease = (x: number) => x * x * (3 - 2 * x);

  return Array.from({ length: TICKS + 1 }, (_, k) =>
    FINAL.map((t, i) => {
      const start = Math.round(t.calls * 0.95);
      const done = steps[i].slice(0, k).reduce((a, b) => a + b, 0) / sums[i];
      const calls = Math.round(start + (t.calls - start) * done);
      if (t.id !== "refund") {
        return { ...t, calls, retries: Math.round(t.retries * (calls / t.calls)) };
      }
      const s = ease(ramp(k));
      return {
        ...t,
        calls,
        p50Ms: Math.round(1240 + (t.p50Ms - 1240) * s),
        errorRate: 0.005 + (t.errorRate - 0.005) * s,
        retries: Math.round(58 + (t.retries - 58) * s),
      };
    }),
  );
}

const FRAMES = simulate();
const LAST = FRAMES.length - 1;

type State = { frame: number };

export default function ToolCallGraphDemo({
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const steps: MockStep<State>[] = autoplay
    ? FRAMES.slice(1).map(() => ({
        delay: TICK,
        apply: (s) => ({ frame: Math.min(s.frame + 1, LAST) }),
      }))
    : [];
  const { state } = useMockRun<State>({ frame: autoplay ? 0 : LAST }, steps, {
    autoplay,
  });
  const tools = FRAMES[state.frame];
  const total = tools.reduce((a, t) => a + t.calls, 0);
  const retries = tools.reduce((a, t) => a + t.retries, 0);

  return (
    <ToolCallGraph
      subtitle={text.subtitle(total.toLocaleString(text.locale))}
      agent={{ label: AGENT, meta: text.meta }}
      tools={tools}
      locale={text.locale}
      labels={text.labels}
      stats={[
        { label: text.perRun, value: (total / 3120).toFixed(1) },
        { label: text.latencyShare, value: "63%" },
        {
          label: text.retries,
          value: (
            <bdi dir="ltr">
              {`${retries.toLocaleString(text.locale)} · ${((retries / total) * 100).toFixed(1)}%`}
            </bdi>
          ),
        },
        {
          label: text.hotPath,
          value: <bdi dir="ltr">refund.create → email.send</bdi>,
          accent: true,
        },
      ]}
    />
  );
}
