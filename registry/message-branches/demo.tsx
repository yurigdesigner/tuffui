"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  MessageBranches,
  type MessageBranchesLabels,
  type MessageVersion,
} from "./message-branches";

type State = { versions: MessageVersion[]; index: number };

/** Renders `code` spans; enough for the demo copy. Code reads left to right. */
const md = (text: string) =>
  text.split(/`([^`]+)`/).map((part, i) =>
    i % 2 ? (
      <code
        key={i}
        dir="ltr"
        className="rounded-md bg-foreground/[0.06] px-1 font-mono text-[0.85em]"
      >
        {part}
      </code>
    ) : (
      part
    ),
  );

type Copy = {
  /** The original answer, then three later versions. */
  answers: [string, string, string, string];
  prompt: string;
  labels?: Partial<MessageBranchesLabels>;
};

/** The same caching answer in each demo language; model names stay Latin. */
const copy: Record<DemoLocale, Copy> = {
  en: {
    answers: [
      "Cache resized images by content hash in `.pressd/cache`. On each build, hash the source file and the resize options; if the key exists, copy the cached output instead of running sharp again.",
      "Key the cache on a hash of the source bytes plus the resize options, store outputs in `.pressd/cache/images`, and prune entries untouched for 30 days. That keeps CI warm without the cache growing forever.",
      "Two layers work best: an in-memory map for the current build, so the same image used twice is resized once, and a disk cache keyed by content hash for the next build. Expect 48s builds to drop to about 13s.",
      "On Vercel, write the cache to `node_modules/.cache/pressd` — that folder is restored between builds. Keep the content-hash key so a changed image always misses, and skip the 30-day prune there.",
    ],
    prompt: "Same question, but the cache has to work on Vercel builds too.",
  },
  he: {
    answers: [
      "שמרו את התמונות המוקטנות במטמון לפי גיבוב התוכן, בתיקייה `.pressd/cache`. בכל בנייה מחשבים גיבוב של קובץ המקור ושל אפשרויות ההקטנה; אם המפתח כבר קיים, מעתיקים את הפלט השמור במקום להריץ שוב את `sharp`.",
      "המפתח של המטמון הוא גיבוב של בייטי המקור יחד עם אפשרויות ההקטנה. את הפלטים שומרים ב־`.pressd/cache/images`, ורשומות שלא נגעו בהן 30 יום נמחקות. כך ה־CI נשאר חם בלי שהמטמון יגדל בלי סוף.",
      "הכי טוב לעבוד בשתי שכבות: מפה בזיכרון לבנייה הנוכחית, כך שתמונה שמופיעה פעמיים מוקטנת רק פעם אחת, ומטמון בדיסק לפי גיבוב התוכן לבנייה הבאה. בנייה של 48 שניות צפויה לרדת לכ־13 שניות.",
      "ב־Vercel כתבו את המטמון ל־`node_modules/.cache/pressd` — התיקייה הזו נשמרת בין בניות. השאירו את המפתח לפי גיבוב התוכן, כדי שתמונה שהשתנתה תמיד תיבנה מחדש, ואל תפעילו שם את הניקוי של 30 יום.",
    ],
    prompt: "אותה שאלה, אבל המטמון צריך לעבוד גם בבניות ב־Vercel.",
    labels: {
      kinds: { original: "מקורית", regenerated: "נוצרה מחדש", edited: "בקשה ערוכה" },
      editedPrompt: "בקשה ערוכה: ",
      regenerate: "יצירת תשובה מחדש",
      region: "גרסאות התשובה",
      switchVersion: "מעבר בין גרסאות",
      previous: "הגרסה הקודמת",
      next: "הגרסה הבאה",
      branches: "ענפים",
      announce: (current, total, label) => `גרסה ${current} מתוך ${total}, ${label}`,
    },
  },
  ar: {
    answers: [
      "خزّن الصور المصغّرة مؤقتًا حسب تجزئة المحتوى في `.pressd/cache`. في كل عملية بناء، احسب تجزئة الملف المصدر وخيارات التصغير؛ وإذا كان المفتاح موجودًا فانسخ الناتج المخزّن بدل تشغيل `sharp` من جديد.",
      "اجعل مفتاح التخزين المؤقت تجزئةً لبايتات المصدر مع خيارات التصغير، واحفظ النواتج في `.pressd/cache/images`، واحذف الإدخالات التي لم تُستخدم منذ 30 يومًا. هكذا يبقى CI سريعًا دون أن يكبر التخزين بلا حدود.",
      "الأفضل طبقتان: خريطة في الذاكرة للبناء الحالي، فتُصغَّر الصورة المستخدمة مرتين مرة واحدة فقط، وتخزين على القرص حسب تجزئة المحتوى للبناء التالي. توقّع أن ينخفض البناء من 48 ثانية إلى نحو 13 ثانية.",
      "على Vercel اكتب التخزين المؤقت في `node_modules/.cache/pressd`، فهذا المجلد يُستعاد بين عمليات البناء. أبقِ المفتاح المبني على تجزئة المحتوى حتى لا تُستخدم نسخة قديمة من صورة تغيّرت، وتخطَّ حذف الثلاثين يومًا هناك.",
    ],
    prompt:
      "السؤال نفسه، لكن يجب أن يعمل التخزين المؤقت في عمليات البناء على Vercel أيضًا.",
    labels: {
      kinds: { original: "الأصلية", regenerated: "مُعاد إنشاؤها", edited: "طلب معدَّل" },
      editedPrompt: "طلب معدَّل: ",
      regenerate: "إعادة إنشاء الرد",
      region: "نسخ الرد",
      switchVersion: "التبديل بين النسخ",
      previous: "النسخة السابقة",
      next: "النسخة التالية",
      branches: "الفروع",
      announce: (current, total, label) => `النسخة ${current} من ${total}، ${label}`,
    },
  },
};

const build = (text: Copy): MessageVersion[] => [
  { id: "v1", kind: "original", meta: "sonnet-5.5", content: md(text.answers[0]) },
  { id: "v2", kind: "regenerated", meta: "opus-5.5", content: md(text.answers[1]) },
  { id: "v3", kind: "regenerated", meta: "opus-5.5", content: md(text.answers[2]) },
  {
    id: "v4",
    kind: "edited",
    meta: "opus-5.5",
    prompt: text.prompt,
    turnsAfter: 2,
    content: md(text.answers[3]),
  },
];

const add = (v: MessageVersion, delay: number): MockStep<State> => ({
  delay,
  apply: (s) => ({ versions: [...s.versions, v], index: s.versions.length }),
});

const script = (versions: MessageVersion[]): MockStep<State>[] => [
  add(versions[0], 1600),
  add(versions[1], 2200),
  wait(1800),
  { delay: 0, apply: (s) => ({ ...s, index: 0 }) },
  add(versions[2], 2000),
];

export default function MessageBranchesDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const [original, ...versions] = build(text);
  const { state, setState } = useMockRun<State>(
    // A paused thumbnail shows every version already in place.
    autoplay
      ? { versions: [original], index: 0 }
      : { versions: [original, ...versions], index: 3 },
    script(versions),
    { autoplay },
  );

  return (
    <MessageBranches
      data={{ versions: state.versions, turnsBefore: 3 }}
      index={state.index}
      onIndexChange={(index) => setState((s) => ({ ...s, index }))}
      onRegenerate={() => {}}
      variant={variant === "Map" ? "map" : "inline"}
      labels={text.labels}
    />
  );
}
