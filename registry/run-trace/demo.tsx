"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { RunTrace, type RunTraceLabels, type TraceSpan } from "./run-trace";

/** Keeps a Latin name or number in reading order inside RTL text. */
const ltr = (text: string) => `\u2066${text}\u2069`;

/** Span names are code and stay as they are; the trace's own strings are translated. */
const labels: Record<DemoLocale, Partial<RunTraceLabels> | undefined> = {
  en: undefined,
  he: {
    region: "מעקב הרצה",
    kinds: { llm: "מודל", tool: "כלי", agent: "סוכן", retrieval: "אחזור" },
    zoomPath: "נתיב זום",
    wholeRun: "כל ההרצה",
    running: "רץ",
    failed: "נכשל",
    block: (name, kind, duration, failed) =>
      `${ltr(name)}, ${kind}, ${ltr(duration)}${failed ? ", נכשל" : ""}. הגדלה`,
    tokensShort: (tokens) => `${ltr(tokens)} טוקנים`,
    tokens: (tokens) => `${ltr(tokens)} טוקנים`,
    hint: "לחיצה על בלוק מגדילה אותו, Esc חוזר אחורה",
    excluded: "בלי ספאנים של סוכנים — הם עוטפים את הצאצאים שלהם",
    metric: "מדד",
    metrics: { time: "זמן", tokens: "טוקנים", cost: "עלות" },
    errors: (count) => `${count} נכשלו`,
    share: (name, metric) => `החלק של ${ltr(name)} ב${metric}`,
    waiting: "ממתין לספאנים…",
    recording: "מקליט",
    finishedIn: "הסתיים תוך",
    spans: (count) => <>{count} ספאנים</>,
    finished: (time) => `ההרצה הסתיימה תוך ${ltr(time)}`,
  },
  ar: {
    region: "تتبّع التشغيل",
    kinds: { llm: "نموذج", tool: "أداة", agent: "وكيل", retrieval: "استرجاع" },
    zoomPath: "مسار التكبير",
    wholeRun: "التشغيل كاملًا",
    running: "قيد التشغيل",
    failed: "فشل",
    block: (name, kind, duration, failed) =>
      `${ltr(name)}، ${kind}، ${ltr(duration)}${failed ? "، فشل" : ""}. تكبير`,
    tokensShort: (tokens) => `${ltr(tokens)} رمز`,
    tokens: (tokens) => `${ltr(tokens)} رمز`,
    hint: "انقر على كتلة لتكبيرها، وEsc للرجوع",
    excluded: "استُبعدت فترات الوكلاء — فهي تغلّف ما بداخلها",
    metric: "المقياس",
    metrics: { time: "الوقت", tokens: "الرموز", cost: "التكلفة" },
    errors: (count) => `فشل ${count}`,
    share: (name, metric) => `حصة ${ltr(name)} من ${metric}`,
    waiting: "في انتظار الفترات…",
    recording: "جارٍ التسجيل",
    finishedIn: "انتهى خلال",
    spans: (count) => <>{count} فترة</>,
    finished: (time) => `انتهى التشغيل خلال ${ltr(time)}`,
  },
};

// A release-notes agent; the demo reveals the run over time.
const plan: (TraceSpan & { endMs: number })[] = [
  { id: "run", name: "release-notes", kind: "agent", startMs: 0, endMs: 8400 },
  { id: "log", parentId: "run", name: "git.log", kind: "tool", startMs: 100, endMs: 900 },
  {
    id: "issues",
    parentId: "run",
    name: "linear.search",
    kind: "tool",
    startMs: 150,
    endMs: 1300,
  },
  {
    id: "past",
    parentId: "run",
    name: "changelog.search",
    kind: "retrieval",
    startMs: 950,
    endMs: 1350,
  },
  {
    id: "summary",
    parentId: "run",
    name: "summarize",
    kind: "llm",
    model: "claude-sonnet-5-5",
    startMs: 1400,
    endMs: 3000,
    tokens: { input: 18_400, output: 1_120 },
    costUsd: 0.0721,
  },
  {
    id: "drafter",
    parentId: "run",
    name: "drafter",
    kind: "agent",
    startMs: 3100,
    endMs: 7200,
  },
  {
    id: "features",
    parentId: "drafter",
    name: "draft.features",
    kind: "llm",
    model: "claude-haiku-5-5",
    startMs: 3200,
    endMs: 4700,
    tokens: { input: 6_200, output: 940 },
    costUsd: 0.0109,
  },
  {
    id: "fixes",
    parentId: "drafter",
    name: "draft.fixes",
    kind: "llm",
    model: "claude-haiku-5-5",
    startMs: 3250,
    endMs: 4400,
    tokens: { input: 4_800, output: 610 },
    costUsd: 0.0078,
  },
  {
    id: "people-1",
    parentId: "drafter",
    name: "github.contributors",
    kind: "tool",
    startMs: 4500,
    endMs: 5400,
    status: "error",
  },
  {
    id: "people-2",
    parentId: "drafter",
    name: "github.contributors",
    kind: "tool",
    startMs: 5500,
    endMs: 6100,
  },
  {
    id: "polish",
    parentId: "drafter",
    name: "polish",
    kind: "llm",
    model: "claude-sonnet-5-5",
    startMs: 6150,
    endMs: 7100,
    tokens: { input: 3_900, output: 1_480 },
    costUsd: 0.0339,
  },
  {
    id: "post",
    parentId: "run",
    name: "slack.post",
    kind: "tool",
    startMs: 7300,
    endMs: 8000,
  },
];

type State = { spans: TraceSpan[]; elapsedMs: number };

/** Snapshot of the run at time `t`: started spans only, unfinished ones still open. */
function at(t: number): State {
  return {
    elapsedMs: Math.min(t, plan[0].endMs),
    spans: plan
      .filter((s) => s.startMs <= t)
      .map((s) =>
        s.endMs <= t
          ? s
          : {
              ...s,
              endMs: undefined,
              tokens: undefined,
              costUsd: undefined,
              status: undefined,
            },
      ),
  };
}

const TICK = 100;
const script: MockStep<State>[] = Array.from(
  { length: plan[0].endMs / TICK },
  (_, i) => ({
    delay: TICK,
    apply: () => at((i + 1) * TICK),
  }),
);

export default function RunTraceDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  // Paused thumbnails show the finished run; live previews start from zero.
  const { state } = useMockRun<State>(at(autoplay ? 0 : plan[0].endMs), script, {
    autoplay,
  });

  return (
    <RunTrace
      data={state}
      view={variant === "Breakdown" ? "breakdown" : "flame"}
      locale={{ en: "en-US", he: "he-IL", ar: "ar" }[locale]}
      labels={labels[locale]}
    />
  );
}
