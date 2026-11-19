"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { StatusPill } from "@/components/ui/status-pill";
import { useMockRun, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { TickGauge, type TickGaugeLabels } from "./tick-gauge";

type State = { ok: number; total: number };

// Requests keep landing, so the rate drifts like a live dashboard.
const script: MockStep<State>[] = [
  { delay: 1800, apply: (s) => ({ ok: s.ok + 180, total: s.total + 196 }) },
  { delay: 1800, apply: (s) => ({ ok: s.ok + 240, total: s.total + 251 }) },
  { delay: 1800, apply: (s) => ({ ok: s.ok + 210, total: s.total + 214 }) },
];

/** Keeps a Latin name in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

/** Tool names stay as they are; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    title: string;
    window: string;
    target: string;
    caption: (failed: string, total: string) => string;
    within: string;
    below: string;
    numbers: string;
    labels?: Partial<TickGaugeLabels>;
  }
> = {
  en: {
    title: "Tool call success",
    window: "last 24 h",
    target: "SLO 99%",
    caption: (failed, total) => `${failed} of ${total} failed`,
    within: "Within SLO",
    below: "Below SLO",
    numbers: "en-US",
  },
  he: {
    title: "הצלחת קריאות לכלים",
    window: "יממה אחרונה",
    target: `${ltr("SLO")} 99%`,
    caption: (failed, total) => `${failed} מתוך ${total} נכשלו`,
    within: `עומד ב־${ltr("SLO")}`,
    below: `מתחת ל־${ltr("SLO")}`,
    numbers: "he-IL",
    labels: { target: (label) => `יעד ${label}` },
  },
  ar: {
    title: "نجاح استدعاءات الأدوات",
    window: "آخر 24 ساعة",
    target: `${ltr("SLO")} 99%`,
    caption: (failed, total) => `فشل ${failed} من ${total}`,
    within: `ضمن ${ltr("SLO")}`,
    below: `دون ${ltr("SLO")}`,
    numbers: "ar",
    labels: { target: (label) => `الهدف ${label}` },
  },
};

export default function TickGaugeDemo({
  variant = "Below SLO",
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const healthy = variant === "Healthy";
  const { state } = useMockRun<State>(
    healthy ? { ok: 12_418, total: 12_436 } : { ok: 5_568, total: 5_980 },
    healthy ? [] : script,
    { autoplay },
  );
  const rate = state.ok / state.total;
  const failed = state.total - state.ok;
  const met = rate >= 0.99;
  const tool = healthy ? "web.search" : "warehouse.query";

  return (
    <TickGauge
      title={text.title}
      subtitle={
        locale === "en" ? `${tool} · ${text.window}` : `${ltr(tool)} · ${text.window}`
      }
      value={rate}
      target={0.99}
      targetLabel={text.target}
      caption={text.caption(
        failed.toLocaleString(text.numbers),
        state.total.toLocaleString(text.numbers),
      )}
      labels={text.labels}
      locale={text.numbers}
      aside={
        <StatusPill tone={met ? "positive" : "negative"}>
          {met ? text.within : text.below}
        </StatusPill>
      }
    />
  );
}
