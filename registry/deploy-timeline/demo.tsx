"use client";

import { useEffect, useState } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import {
  DeployTimeline,
  type Deploy,
  type DeployTimelineLabels,
} from "./deploy-timeline";

const HOUR = 3_600_000;

const history: Deploy[] = [
  {
    id: "v11",
    version: "v11",
    kind: "prompt",
    label: "few-shot refresh",
    at: "2026-10-27T10:00:00Z",
    score: 0.904,
  },
  {
    id: "v12",
    version: "v12",
    kind: "prompt",
    label: "shorter system prompt",
    at: "2026-10-29T15:00:00Z",
    score: 0.912,
  },
  {
    id: "o4-mini",
    version: "o4-mini",
    kind: "model",
    label: "model swap",
    at: "2026-10-31T11:00:00Z",
    score: 0.921,
  },
  {
    id: "v13",
    version: "v13",
    kind: "prompt",
    label: "stricter escalation rules",
    at: "2026-11-02T14:20:00Z",
    score: 0.877,
    rolledBackAfter: 38,
  },
  {
    id: "v14",
    version: "v14",
    kind: "prompt",
    label: "escalation rules, take two",
    at: "2026-11-04T09:00:00Z",
    score: 0.931,
  },
];

const CANARY_AT = Date.parse("2026-11-07T13:00:00Z");
const END = Date.parse("2026-11-08T22:00:00Z");
const RANGE: [string, string] = ["2026-10-26T12:00:00Z", "2026-11-09T00:00:00Z"];

/** Canary beats: traffic share and the eval score it is settling on. */
const beats = [
  { at: 0, share: 0.01, score: 0.918 },
  { at: 0.22, share: 0.02, score: 0.941 },
  { at: 0.48, share: 0.05, score: 0.933 },
  { at: 0.74, share: 0.1, score: 0.936 },
];

/** Keeps a Latin name, version or number in reading order inside RTL text. */
const ltr = (text: string) => `\u2066${text}\u2069`;

/** Version names stay as they are; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    locale?: string;
    title: string;
    subtitle: string;
    /** What changed in each deploy, by id. */
    changes?: Record<string, string>;
    labels?: Partial<DeployTimelineLabels>;
  }
> = {
  en: {
    title: "Deployments",
    subtitle: "triage-l · prompt & model versions · 14 days",
  },
  he: {
    locale: "he-IL",
    title: "פריסות",
    subtitle: `${ltr("triage-l")} · גרסאות פרומפט ומודל · 14 ימים`,
    changes: {
      v11: "רענון דוגמאות few-shot",
      v12: "פרומפט מערכת מקוצר",
      "o4-mini": "החלפת מודל",
      v13: "כללי הסלמה מחמירים",
      v14: "כללי הסלמה, ניסיון שני",
      v15: "רמזים לשימוש בכלים",
    },
    labels: {
      compare: "השוואה",
      rollback: "שחזור",
      compareAria: (target, live) => `השוואה בין ${ltr(target)} ל־${ltr(live)}`,
      rollbackAria: (target) => `שחזור ל־${ltr(target)}`,
      kinds: { prompt: "פרומפט", model: "מודל" },
      live: "פעיל",
      canary: (share) => `קנרי ${ltr(share)}`,
      rolledBack: "בוטלה",
      belowMin: "מתחת למינימום",
      rolledBackIn: (d) => `בוטלה אחרי ${d}`,
      backIn: (d) => `בוטלה אחרי ${d}`,
      min: (score) => `מינ׳ ${score}`,
      points: (delta) => `${ltr(delta)} נק׳`,
      duration: (minutes) => {
        if (minutes < 60) return `${Math.round(minutes)} דק׳`;
        const h = Math.floor(minutes / 60);
        const m = Math.round(minutes % 60);
        return m ? `${h} שע׳ ${m} דק׳` : `${h} שע׳`;
      },
      statLive: "פעיל",
      statEval: "הערכה",
      statDeploys: "פריסות",
      regressions: (n) => `${n} נסיגות`,
      marker: (version, kind, label) =>
        `${ltr(version)}, פריסת ${kind}${label ? `: ${label}` : ""}`,
      evalScore: (score) => `ציון ${score}`,
      rolledBackAfter: (d) => `בוטלה אחרי ${d}`,
      belowMinimum: "מתחת למינימום",
      canaryAt: (share) => `קנרי על ${ltr(share)} מהתנועה`,
      deploysCount: (n) => `${n} פריסות`,
      summaryLive: (version, score) => `פעיל: ${ltr(version)} עם ${score}`,
      summaryRegression: (version, change, after) =>
        `${ltr(version)} נסוגה ב־${change}${after ? ` ובוטלה אחרי ${after}` : ""}`,
      summaryCanary: (version, share) => `${ltr(version)} בקנרי על ${share}`,
      columns: {
        version: "גרסה",
        kind: "סוג",
        deployed: "נפרסה",
        score: "ציון הערכה",
        change: "שינוי",
        status: "סטטוס",
      },
      first: "ראשונה",
      statuses: {
        rolledBack: (d) => `בוטלה אחרי ${d}`,
        below: "מתחת למינימום",
        canary: (share) => `קנרי, ${ltr(share)} מהתנועה`,
        live: "פעילה",
        replaced: "הוחלפה",
      },
      selected: (version) => `נבחרה ${ltr(version)}`,
    },
  },
  ar: {
    locale: "ar",
    title: "عمليات النشر",
    subtitle: `${ltr("triage-l")} · إصدارات التعليمات والنماذج · 14 يومًا`,
    changes: {
      v11: "تحديث أمثلة few-shot",
      v12: "تعليمات نظام أقصر",
      "o4-mini": "تبديل النموذج",
      v13: "قواعد تصعيد أكثر صرامة",
      v14: "قواعد التصعيد، المحاولة الثانية",
      v15: "تلميحات لاستخدام الأدوات",
    },
    labels: {
      compare: "مقارنة",
      rollback: "تراجع",
      compareAria: (target, live) => `قارن ${ltr(target)} مع ${ltr(live)}`,
      rollbackAria: (target) => `التراجع إلى ${ltr(target)}`,
      kinds: { prompt: "تعليمات", model: "نموذج" },
      live: "مباشر",
      canary: (share) => `كناري ${ltr(share)}`,
      rolledBack: "تم التراجع",
      belowMin: "دون الحد",
      rolledBackIn: (d) => `تم التراجع بعد ${d}`,
      backIn: (d) => `تراجع بعد ${d}`,
      min: (score) => `الحد ${score}`,
      points: (delta) => `${ltr(delta)} نقطة`,
      duration: (minutes) => {
        if (minutes < 60) return `${Math.round(minutes)} دقيقة`;
        const h = Math.floor(minutes / 60);
        const m = Math.round(minutes % 60);
        return m ? `${h} س ${m} د` : `${h} س`;
      },
      statLive: "مباشر",
      statEval: "التقييم",
      statDeploys: "عمليات النشر",
      regressions: (n) =>
        n === 1
          ? "تراجع واحد"
          : n === 2
            ? "تراجعان"
            : n <= 10
              ? `${n} تراجعات`
              : `${n} تراجعًا`,
      separator: "، ",
      marker: (version, kind, label) =>
        `${ltr(version)}، نشر ${kind}${label ? `: ${label}` : ""}`,
      evalScore: (score) => `التقييم ${score}`,
      rolledBackAfter: (d) => `تم التراجع عنه بعد ${d}`,
      belowMinimum: "دون الحد الأدنى",
      canaryAt: (share) => `كناري على ${ltr(share)} من الحركة`,
      deploysCount: (n) =>
        n === 1
          ? "عملية نشر واحدة"
          : n === 2
            ? "عمليتا نشر"
            : n <= 10
              ? `${n} عمليات نشر`
              : `${n} عملية نشر`,
      summaryLive: (version, score) => `المباشر ${ltr(version)} بتقييم ${score}`,
      summaryRegression: (version, change, after) =>
        `تراجع ${ltr(version)} بمقدار ${change}${after ? ` وأُلغي نشره بعد ${after}` : ""}`,
      summaryCanary: (version, share) => `${ltr(version)} في الكناري على ${share}`,
      columns: {
        version: "الإصدار",
        kind: "النوع",
        deployed: "تاريخ النشر",
        score: "درجة التقييم",
        change: "التغيير",
        status: "الحالة",
      },
      first: "الأول",
      statuses: {
        rolledBack: (d) => `أُلغي بعد ${d}`,
        below: "دون الحد الأدنى",
        canary: (share) => `كناري، ${ltr(share)} من الحركة`,
        live: "مباشر",
        replaced: "استُبدل",
      },
      selected: (version) => `تم تحديد ${ltr(version)}`,
    },
  },
};

const INTRO = 1900; // ms: the line draws in, then the canary starts moving
const GROW = 5200; // ms: the canary runs from deploy to now

export default function DeployTimelineDemo({
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const [p, setP] = useState(autoplay ? 0 : 1);

  // One frame clock: after the intro, the canary's clock runs to the end.
  useEffect(() => {
    if (!autoplay) return;
    let frame = 0;
    let start = 0;
    const tick = (now: number) => {
      start ||= now + INTRO;
      const next = Math.min(Math.max((now - start) / GROW, 0), 1);
      setP(next);
      if (next < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [autoplay]);

  // Ease the clock out so the canary arrives gently.
  const t = 1 - (1 - p) ** 2;
  const now = CANARY_AT + 2 * HOUR + t * (END - CANARY_AT - 2 * HOUR);
  const beat = [...beats].reverse().find((b) => p >= b.at) ?? beats[0];

  const deploys: Deploy[] = [
    ...history.map((d) => ({ ...d, label: text.changes?.[d.id] ?? d.label })),
    {
      id: "v15",
      version: "v15",
      kind: "prompt",
      label: text.changes?.v15 ?? "tool-use hints",
      at: CANARY_AT,
      score: beat.score,
      canary: beat.share,
    },
  ];

  return (
    <DeployTimeline
      title={text.title}
      subtitle={text.subtitle}
      locale={text.locale}
      labels={text.labels}
      deploys={deploys}
      threshold={0.88}
      range={RANGE}
      now={now}
      intro={autoplay}
      onCompare={() => {}}
      onRollback={() => {}}
    />
  );
}
