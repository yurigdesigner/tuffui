"use client";

import { useState } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import {
  streamText,
  useMockRun,
  wait,
  type MockStep,
} from "@/registry/use-mock-run/use-mock-run";
import {
  StreamingMessage,
  type StreamingMessageData,
  type StreamingMessageLabels,
} from "./streaming-message";

/** Keeps a number with a Latin unit in reading order inside RTL text. */
const ltr = (text: string) => `\u2066${text}\u2069`;

const URLS = [
  "https://docs.anthropic.com/en/api/rate-limits",
  "https://docs.anthropic.com/en/api/errors",
  "https://github.com/northwind/batch-runner/issues/212",
];

/** The same answer in each demo language; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    answer: string;
    reasoning: string;
    /** Citation titles, in `URLS` order. */
    titles: [string, string, string];
    /** Start of the second paragraph where the Error variant cuts off. */
    cut: string;
    error: string;
    labels?: Partial<StreamingMessageLabels>;
  }
> = {
  en: {
    answer: `The 429s come from your org's **output tokens per minute** limit, not requests per minute. The batch job fires 40 parallel calls with \`max_tokens: 8192\`, so the reserved output budget spikes to ~327k even though most summaries finish under 600 tokens.

Lower \`max_tokens\` to 1024 and cap concurrency at 8. If you still get throttled, read the \`retry-after\` header and back off with jitter instead of retrying immediately.`,
    reasoning:
      "429s on a batch job — check which limit trips. 40 parallel × 8192 max_tokens = 327k reserved output tokens, well over a 160k OTPM tier. Requests per minute is only 40, so RPM isn't it. Fix: smaller max_tokens, lower concurrency, honor retry-after.",
    titles: [
      "Rate limits — API reference",
      "Errors and the retry-after header",
      "batch-runner#212: Throttled during nightly summaries",
    ],
    cut: "Lower the per-request ceiling and cap ",
    error: "Connection reset after 260 tokens.",
  },
  he: {
    answer: `שגיאות ה־429 מגיעות מהמגבלה של הארגון על **טוקני פלט לדקה**, לא על בקשות לדקה. משימת ה־batch שולחת 40 קריאות במקביל עם \`max_tokens: 8192\`, כך שתקציב הפלט השמור קופץ לכ־${ltr("327k")}, אף שרוב הסיכומים מסתיימים בפחות מ־600 טוקנים.

הורידו את \`max_tokens\` ל־1024 והגבילו את המקביליות ל־8. אם עדיין יש האטה, קראו את הכותרת \`retry-after\` והמתינו עם jitter במקום לנסות שוב מיד.`,
    reasoning: `שגיאות 429 במשימת batch — לבדוק איזו מגבלה נחצית. ${ltr("40 × 8192")} = ${ltr("327k")} טוקני פלט שמורים, הרבה מעל מכסה של ${ltr("160k OTPM")}. בקשות לדקה הן רק 40, אז זה לא RPM. הפתרון: max_tokens קטן יותר, פחות מקביליות, לכבד את retry-after.`,
    titles: [
      "מגבלות קצב — תיעוד ה־API",
      "שגיאות והכותרת retry-after",
      `${ltr("batch-runner#212")}: האטה בזמן הסיכומים הליליים`,
    ],
    cut: "הורידו את התקרה לכל בקשה והגבילו ",
    error: "החיבור נותק אחרי 260 טוקנים.",
    labels: {
      messageFrom: (model) => `הודעה מ־${model}`,
      responding: "עונה…",
      thinking: "חושב…",
      thoughtFor: (seconds) => `חשב ${seconds} שניות`,
      sources: "מקורות",
      source: (index, title, site) => `מקור ${index}: ${title} (${site})`,
      interrupted: "התשובה נקטעה.",
      genericError: "משהו השתבש.",
      retry: "ניסיון חוזר",
      regenerate: "יצירת תשובה מחדש",
      copy: "העתקת ההודעה",
      copied: "הועתק",
      complete: "התשובה הושלמה",
      failed: "התשובה נכשלה",
    },
  },
  ar: {
    answer: `أخطاء 429 سببها حد مؤسستك على **رموز الإخراج في الدقيقة**، لا على الطلبات في الدقيقة. مهمة الدفعات ترسل 40 طلبًا متوازيًا مع \`max_tokens: 8192\`، فيقفز رصيد الإخراج المحجوز إلى نحو ${ltr("327k")} مع أن معظم الملخصات تنتهي بأقل من 600 رمز.

خفّض \`max_tokens\` إلى 1024 وحدّد التوازي بـ 8. وإن استمر التقييد، فاقرأ ترويسة \`retry-after\` وتراجع مع jitter بدل إعادة المحاولة فورًا.`,
    reasoning: `أخطاء 429 في مهمة دفعات — أتحقق أي حد يُتجاوز. ${ltr("40 × 8192")} = ${ltr("327k")} رمز إخراج محجوز، أعلى بكثير من فئة ${ltr("160k OTPM")}. الطلبات في الدقيقة 40 فقط، إذن ليس RPM. الحل: max_tokens أصغر، توازٍ أقل، واحترام retry-after.`,
    titles: [
      "حدود المعدل — مرجع API",
      "الأخطاء وترويسة retry-after",
      `${ltr("batch-runner#212")}: تقييد أثناء الملخصات الليلية`,
    ],
    cut: "خفّض الحد الأقصى لكل طلب وحدّد ",
    error: "انقطع الاتصال بعد 260 رمزًا.",
    labels: {
      messageFrom: (model) => `رسالة من ${model}`,
      responding: "يكتب الرد…",
      thinking: "يفكّر…",
      thoughtFor: (seconds) =>
        `فكّر ${seconds === 1 ? "ثانية واحدة" : seconds === 2 ? "ثانيتين" : seconds <= 10 ? `${seconds} ثوانٍ` : `${seconds} ثانية`}`,
      sources: "المصادر",
      source: (index, title, site) => `المصدر ${index}: ${title} (${site})`,
      interrupted: "انقطع الرد.",
      genericError: "حدث خطأ ما.",
      retry: "إعادة المحاولة",
      regenerate: "إعادة توليد الرد",
      copy: "نسخ الرسالة",
      copied: "تم النسخ",
      complete: "اكتمل الرد",
      failed: "تعذّر الرد",
    },
  },
};

type State = StreamingMessageData;

const stream = (text: string, from = "") =>
  streamText<State>(
    text.slice(from.length),
    (s, partial) => ({ ...s, content: from + partial }),
    {
      interval: 55,
    },
  );

function scripts(locale: DemoLocale) {
  const { answer, reasoning, titles, cut, error } = copy[locale];
  const citations = URLS.map((url, i) => ({
    id: ["limits", "errors", "issue"][i],
    title: titles[i],
    url,
    source: i === 2 ? "github.com" : undefined,
  }));
  const interrupted = answer.slice(0, answer.indexOf("\n\n")) + "\n\n" + cut;
  const opening = answer.split(" ").slice(0, 9).join(" ") + " ";

  const all: Record<string, { initial: State; steps: MockStep<State>[] }> = {
    Default: {
      initial: { content: opening, status: "streaming", citations },
      steps: [
        ...stream(answer, opening),
        { delay: 200, apply: (s) => ({ ...s, status: "done" }) },
      ],
    },
    Reasoning: {
      initial: {
        content: "",
        status: "streaming",
        citations,
        reasoning: { text: reasoning.slice(0, 64), streaming: true },
      },
      steps: [
        ...streamText<State>(
          reasoning.slice(64),
          (s, partial) => ({
            ...s,
            reasoning: { text: reasoning.slice(0, 64) + partial, streaming: true },
          }),
          { interval: 40 },
        ),
        {
          delay: 300,
          apply: (s) => ({
            ...s,
            reasoning: { text: reasoning, streaming: false, durationMs: 4200 },
          }),
        },
        ...stream(answer),
        { delay: 200, apply: (s) => ({ ...s, status: "done" }) },
      ],
    },
    Error: {
      initial: { content: opening, status: "streaming" },
      steps: [
        ...stream(interrupted, opening),
        wait(400),
        { delay: 0, apply: (s) => ({ ...s, status: "error", error }) },
      ],
    },
  };
  return all;
}

function Run({
  variant,
  locale,
  autoplay,
  onRetry,
}: {
  variant: string;
  locale: DemoLocale;
  autoplay: boolean;
  onRetry?: () => void;
}) {
  const [all] = useState(() => scripts(locale));
  const script = all[variant] ?? all.Default;
  const { state, replay } = useMockRun<State>(script.initial, script.steps, { autoplay });
  return (
    <StreamingMessage
      data={state}
      model="Claude Opus 5.5"
      labels={copy[locale].labels}
      onRetry={onRetry ?? replay}
    />
  );
}

export default function StreamingMessageDemo({
  variant = "Default",
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  // Error variant: the first attempt fails, Retry streams a clean answer.
  const [attempt, setAttempt] = useState(0);
  if (variant === "Error" && attempt > 0)
    return <Run key={attempt} variant="Default" locale={locale} autoplay />;
  return (
    <Run
      key={locale}
      variant={variant}
      locale={locale}
      autoplay={autoplay}
      onRetry={variant === "Error" ? () => setAttempt((n) => n + 1) : undefined}
    />
  );
}
