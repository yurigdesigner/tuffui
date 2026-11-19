"use client";

import { Paperclip } from "@phosphor-icons/react";
import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  ContextWindowMeter,
  type ContextSegment,
  type ContextWindowMeterLabels,
} from "./context-window-meter";

type State = { segments: ContextSegment[]; compacting: boolean };

const LIMIT = 200_000;

/** Keeps a Latin name or number in reading order inside RTL text. */
const ltr = (text: string) => `\u2066${text}\u2069`;

type Segment = "history" | "files" | "tools" | "system";

/** The same session in each demo language; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    locale: string;
    segments: Record<Segment, { label: string; detail: string }>;
    prompt: string;
    labels?: Partial<ContextWindowMeterLabels>;
  }
> = {
  en: {
    locale: "en-US",
    segments: {
      history: { label: "Conversation", detail: "22 turns" },
      files: { label: "Workspace files", detail: "4 open" },
      tools: { label: "MCP tools", detail: "github, linear" },
      system: { label: "Instructions", detail: "AGENTS.md" },
    },
    prompt: "Refactor the billing webhooks to use the new event schema…",
  },
  he: {
    locale: "he-IL",
    segments: {
      history: { label: "שיחה", detail: "22 תורות" },
      files: { label: "קבצים בסביבת העבודה", detail: "4 פתוחים" },
      tools: { label: `כלי ${ltr("MCP")}`, detail: "github, linear" },
      system: { label: "הנחיות", detail: "AGENTS.md" },
    },
    prompt: "תעשה ריפקטור ל־webhooks של החיובים כך שישתמשו בסכמת האירועים החדשה…",
    labels: {
      region: "חלון הקשר",
      meter: "ניצול חלון ההקשר",
      valueText: (used, limit, percent) => `${used} מתוך ${limit} טוקנים (${percent})`,
      compact: "דחיסה",
      compacting: "דוחס…",
      compactAria: "דחיסת ההקשר",
      compactingAria: "דוחס את ההקשר",
      approaching: "מתקרבים למגבלת ההקשר",
      nearLimit: "קרוב למגבלה",
      context: "הקשר",
      ofLimit: (limit, percent) => (
        <>
          מתוך {limit} · {percent} בשימוש
        </>
      ),
      warningZone: (left) => `באזור האזהרה — נשארו ${ltr(left)} טוקנים`,
      tinted: (percent) => `התאים הצבועים מסמנים את ה־${percent} האחרונים`,
      pinned: "מוצמד",
    },
  },
  ar: {
    locale: "ar",
    segments: {
      history: { label: "المحادثة", detail: "22 دورة" },
      files: { label: "ملفات مساحة العمل", detail: "4 مفتوحة" },
      tools: { label: `أدوات ${ltr("MCP")}`, detail: "github, linear" },
      system: { label: "التعليمات", detail: "AGENTS.md" },
    },
    prompt: "أعد هيكلة webhooks الفوترة لتستخدم مخطط الأحداث الجديد…",
    labels: {
      region: "نافذة السياق",
      meter: "استخدام نافذة السياق",
      valueText: (used, limit, percent) => `${used} من ${limit} رمز (${percent})`,
      compact: "ضغط",
      compacting: "جارٍ الضغط…",
      compactAria: "ضغط السياق",
      compactingAria: "جارٍ ضغط السياق",
      approaching: "السياق يقترب من الحد",
      nearLimit: "قريب من الحد",
      context: "السياق",
      ofLimit: (limit, percent) => (
        <>
          من {limit} · ممتلئ بنسبة {percent}
        </>
      ),
      warningZone: (left) => `في منطقة التحذير — يتبقى ${ltr(left)} رمز`,
      tinted: (percent) => `الخلايا الملوّنة تمثّل آخر ${percent}`,
      pinned: "مثبّت",
    },
  },
};

const base = (history: number, files: number): ContextSegment[] => [
  { id: "history", label: "", tokens: history },
  { id: "files", label: "", tokens: files },
  { id: "tools", label: "", tokens: 11_840, pinned: true },
  { id: "system", label: "", tokens: 3_210, pinned: true },
];

const set = (id: string, tokens: number) => (s: State) => ({
  ...s,
  segments: s.segments.map((seg) => (seg.id === id ? { ...seg, tokens } : seg)),
});

/** One conversation turn every ~900ms. */
const turns = (id: string, from: number, deltas: number[]): MockStep<State>[] => {
  let total = from;
  return deltas.map((d) => {
    total += d;
    return { delay: 900, apply: set(id, total) };
  });
};

const compact = (history: number): MockStep<State>[] => [
  { delay: 0, apply: (s) => ({ ...s, compacting: true }) },
  { delay: 1400, apply: (s) => ({ ...set("history", history)(s), compacting: false }) },
];

const growing: MockStep<State>[] = [
  ...turns("history", 18_400, [3_200, 5_800, 2_100, 6_400]),
  { delay: 900, apply: set("files", 31_900) },
  ...turns("history", 35_900, [4_300, 7_100, 2_600]),
];

const nearLimit: MockStep<State>[] = [
  ...turns("history", 92_000, [6_200, 9_400, 8_100, 11_300]),
  wait(1600),
  ...compact(21_600),
];

export default function ContextWindowMeterDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const near = variant === "Near limit";
  const initial: State = {
    segments: near ? base(92_000, 38_600) : base(18_400, 23_500),
    compacting: false,
  };
  const { state, setState } = useMockRun<State>(initial, near ? nearLimit : growing, {
    autoplay,
  });

  const onCompact = () => {
    setState((s) => ({ ...s, compacting: true }));
    setTimeout(
      () => setState((s) => ({ ...set("history", 21_600)(s), compacting: false })),
      1400,
    );
  };

  const meter = (
    <ContextWindowMeter
      data={{
        limit: LIMIT,
        // Text is added at render time, so the run itself stays language-free.
        segments: state.segments.map((s) => ({
          ...s,
          ...text.segments[s.id as Segment],
        })),
        model: "opus-5.5",
      }}
      locale={text.locale}
      labels={text.labels}
      compacting={state.compacting}
      onCompact={onCompact}
      variant={variant === "Inline" ? "inline" : "card"}
    />
  );

  if (variant !== "Inline") return meter;

  // Inline sits in a composer footer.
  return (
    <div className="w-full max-w-xl rounded-[1.375rem] bg-surface p-1.5">
      <p className="rounded-2xl bg-surface-inset px-4 pt-3.5 pb-6 text-sm text-muted-foreground">
        {text.prompt}
      </p>
      <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Paperclip weight="fill" className="size-3.5" aria-hidden="true" />
          <span className="font-mono">webhooks.ts</span>
        </span>
        {meter}
      </div>
    </div>
  );
}
