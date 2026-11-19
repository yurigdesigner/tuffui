"use client";

import { useState } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  AgentStatus,
  type AgentStatusData,
  type AgentStatusLabels,
  type AgentStatusStep,
} from "./agent-status";

type State = Omit<AgentStatusData, "startedAt">;

const files = [
  "src/site/build.ts",
  "src/site/images.ts",
  "src/site/images/sharp.ts",
  "src/site/cache.ts",
];

/** Rotates the detail line through `details`, one every `every` ms. */
const browse = (details: string[], every = 650): MockStep<State>[] =>
  details.map((detail) => ({ delay: every, apply: (s) => ({ ...s, detail }) }));

/** Finishes the current step and starts the next. */
const next = (label: string, durationMs: number, detail?: string): MockStep<State> => ({
  delay: 500,
  apply: (s) => ({
    ...s,
    steps: [
      ...(s.steps ?? []),
      { id: s.label, label: s.label, durationMs } satisfies AgentStatusStep,
    ],
    label,
    detail,
  }),
});

/** Keeps a Latin name or a number run in reading order inside RTL text. */
const ltr = (text: string) => `\u2066${text}\u2069`;

type Copy = {
  reading: string;
  profiling: string;
  caching: string;
  testing: string;
  result: string;
  share: string;
  labels?: Partial<AgentStatusLabels>;
};

/** The same build investigation in each demo language. */
const copy: Record<DemoLocale, Copy> = {
  en: {
    reading: "Reading the build pipeline",
    profiling: "Profiling the image pipeline",
    caching: "Caching resized images",
    testing: "Running the test suite",
    result: "Builds 3.8× faster: 48s → 12.6s",
    share: "sharp resize: 71% of 48s",
  },
  he: {
    reading: "קורא את תהליך הבנייה",
    profiling: "מודד ביצועים של עיבוד התמונות",
    caching: "שומר במטמון תמונות מוקטנות",
    testing: "מריץ את הבדיקות",
    result: `הבנייה מהירה פי 3.8: ${ltr("48s → 12.6s")}`,
    share: "sharp resize: 71% of 48s",
    labels: {
      region: "סטטוס הסוכן",
      steps: "שלבים שהסתיימו",
      stepDone: "הסתיים",
      done: "הסתיים",
      stopped: "נעצר",
      failed: "נכשל",
      stop: "עצירה",
      stopAgent: "עצירת הסוכן",
    },
  },
  ar: {
    reading: "يقرأ مسار البناء",
    profiling: "يقيس أداء معالجة الصور",
    caching: "يخزّن الصور المصغّرة مؤقتًا",
    testing: "يشغّل الاختبارات",
    result: `البناء أسرع بـ3.8 مرات: ${ltr("48s → 12.6s")}`,
    share: "sharp resize: 71% of 48s",
    labels: {
      region: "حالة الوكيل",
      steps: "الخطوات المكتملة",
      stepDone: "اكتملت",
      done: "تم",
      stopped: "توقّف",
      failed: "فشل",
      stop: "إيقاف",
      stopAgent: "إيقاف الوكيل",
    },
  },
};

const script = (text: Copy): MockStep<State>[] => [
  ...browse(files),
  next(text.profiling, 3_100, "pressd build --profile"),
  wait(900),
  { delay: 0, apply: (s) => ({ ...s, detail: text.share }) },
  wait(800),
  next(text.caching, 2_200, "src/site/cache.ts"),
  ...browse(["src/site/cache.ts", "src/site/images.ts"], 1100),
  next(text.testing, 2_900, "vitest run site"),
  ...browse(["✓ build.spec.ts", "✓ images.spec.ts", "✓ cache.spec.ts"], 800),
  wait(600),
  next(text.result, 3_000),
  { delay: 0, apply: (s) => ({ ...s, status: "done" }) },
];

export default function AgentStatusDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  // No clock during prerender; the timer shows 0s either way until it ticks.
  const [startedAt] = useState(() => (typeof window === "undefined" ? 0 : Date.now()));
  const { state, setState } = useMockRun<State>(
    {
      label: text.reading,
      detail: files[0],
      steps: [],
      status: "working",
    },
    script(text),
    { autoplay },
  );

  return (
    <AgentStatus
      data={{ ...state, startedAt }}
      maxSteps={variant === "Steps" ? 3 : 0}
      labels={text.labels}
      onStop={() => setState((s) => ({ ...s, status: "stopped" }))}
    />
  );
}
