"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/components/ui/status-pill";
import type { DemoLocale } from "@/components/docs/demo";
import { LapTimer, type LapSector, type LapTimerLabels } from "./lap-timer";

/** Keeps a Latin name or signed number in reading order inside RTL text. */
const ltr = (text: string) => `\u2066${text}\u2069`;

type Run = {
  title: string;
  subtitle: string;
  lap: string;
  best: number;
  /** Simulated seconds per real second, so a run plays in about ten seconds. */
  speed: number;
  sectors: (Omit<LapSector, "split"> & { time: number })[];
};

const run: Run = {
  title: "Pipeline lap",
  subtitle: "eval run 418 · support-qa",
  lap: "Lap 3",
  best: 44.1,
  speed: 4,
  sectors: [
    { id: "retrieve", label: "retrieve", best: 13.9, time: 13.1 },
    { id: "generate", label: "generate", best: 19.2, time: 19.6 },
    { id: "score", label: "score", best: 10.7, time: 8.8 },
  ],
};

/** The same lap in each demo language; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    title: string;
    subtitle: string;
    lap: string;
    stages: [string, string, string];
    live: string;
    newBest: string;
    finished: string;
    format?: (seconds: number) => string;
    labels?: Partial<LapTimerLabels>;
  }
> = {
  en: {
    title: run.title,
    subtitle: run.subtitle,
    lap: run.lap,
    stages: ["retrieve", "generate", "score"],
    live: "Live",
    newBest: "New best",
    finished: "Finished",
  },
  he: {
    title: "הקפת פייפליין",
    subtitle: `הרצת הערכה 418 · ${ltr("support-qa")}`,
    lap: "הקפה 3",
    stages: ["אחזור", "יצירה", "ניקוד"],
    live: "בשידור",
    newBest: "שיא חדש",
    finished: "הסתיים",
    format: (s) => `${s.toFixed(1)} ש׳`,
    labels: {
      elapsed: (clock) => `זמן שעבר ${clock}`,
      onPace: "בקצב",
      vsBest: (delta) => `${ltr(delta)} ש׳ מול ההקפה הטובה`,
      sectors: (done, total) => `${done} מתוך ${total} מקטעים`,
      best: (time) => `שיא ${time}`,
      dial: (title, clock, delta, best) =>
        `${title}: עברו ${clock}, ${ltr(delta)} שניות מול ההקפה הטובה ביותר של ${best}.`,
      lap: "הקפה",
      caption: "זמני מקטעים מול השיא",
      sectorColumn: "מקטע",
      splitColumn: "זמן",
      deltaColumn: "הפרש מהשיא",
      split: (label, time, delta) => `${label}: ${time}, ${ltr(delta)} שניות מול השיא.`,
      lapDone: (clock) => ` הקפה ${clock}.`,
    },
  },
  ar: {
    title: "لفّة خط المعالجة",
    subtitle: `تشغيل التقييم 418 · ${ltr("support-qa")}`,
    lap: "اللفّة 3",
    stages: ["الاسترجاع", "التوليد", "التقييم"],
    live: "مباشر",
    newBest: "رقم قياسي جديد",
    finished: "انتهت",
    format: (s) => `${s.toFixed(1)} ث`,
    labels: {
      elapsed: (clock) => `الوقت المنقضي ${clock}`,
      onPace: "على الوتيرة",
      vsBest: (delta) => `${ltr(delta)} ث مقارنة بأفضل لفّة`,
      sectors: (done, total) => `${done} من ${total} مقاطع`,
      best: (time) => `الأفضل ${time}`,
      dial: (title, clock, delta, best) =>
        `${title}: انقضى ${clock}، ${ltr(delta)} ثانية مقارنة بأفضل لفّة ${best}.`,
      lap: "لفّة",
      caption: "أزمنة المقاطع مقارنة بالأفضل",
      sectorColumn: "المقطع",
      splitColumn: "الزمن",
      deltaColumn: "الفرق عن الأفضل",
      split: (label, time, delta) =>
        `${label}: ${time}، ${ltr(delta)} ثانية مقارنة بالأفضل.`,
      lapDone: (clock) => ` اللفّة ${clock}.`,
    },
  },
};

export default function LapTimerDemo({
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const total = run.sectors.reduce((a, s) => a + s.time, 0);
  const [t, setT] = useState(autoplay ? 0 : total);

  // Plays the lap once on a frame clock, then holds on the finished lap.
  useEffect(() => {
    if (!autoplay) return;
    let frame = 0;
    let start = 0;
    const tick = (now: number) => {
      start ||= now + 600;
      const next = Math.min(Math.max(0, ((now - start) / 1000) * run.speed), total);
      setT(next);
      if (next < total) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [autoplay, total]);

  const sectors: LapSector[] = run.sectors.map(({ time, ...s }, i) => {
    const edge = run.sectors.slice(0, i + 1).reduce((a, x) => a + x.time, 0);
    const label = text.stages[i];
    return t >= edge - 1e-6 ? { ...s, label, split: time } : { ...s, label };
  });
  const running = t < total;
  const newBest = total < run.best;

  return (
    <LapTimer
      title={text.title}
      subtitle={text.subtitle}
      lap={text.lap}
      sectors={sectors}
      elapsed={t}
      best={run.best}
      running={running}
      format={text.format}
      labels={text.labels}
      aside={
        running ? (
          <StatusPill tone="brand" size="sm">
            {text.live}
          </StatusPill>
        ) : (
          <StatusPill tone={newBest ? "positive" : "neutral"} size="sm">
            {newBest ? text.newBest : text.finished}
          </StatusPill>
        )
      }
    />
  );
}
