"use client";

import type { ReactNode } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  ResponseFeedback,
  emptyFeedback,
  type Feedback,
  type ResponseFeedbackLabels,
} from "./response-feedback";

const code = (text: string) => (
  <code
    dir="ltr"
    className="rounded-md bg-foreground/[0.06] px-1 font-mono text-[0.85em]"
  >
    {text}
  </code>
);

/** The same answer and feedback in each demo language; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    answer: ReactNode;
    /** Inaccurate, Not helpful, Too long, Unsafe, Other. */
    reasons: [string, string, string, string, string];
    note: string;
    labels?: Partial<ResponseFeedbackLabels>;
  }
> = {
  en: {
    answer: (
      <>
        Cache resized images by content hash in{" "}
        <code className="rounded-md bg-foreground/[0.06] px-1 font-mono text-[0.85em]">
          .pressd/cache
        </code>
        . On each build, hash the source and the resize options; if the key exists, copy
        the cached output instead of running sharp again.
      </>
    ),
    reasons: ["Inaccurate", "Not helpful", "Too long", "Unsafe", "Other"],
    note: "It skipped the Vercel cache folder",
  },
  he: {
    answer: (
      <>
        שמרו את התמונות המוקטנות במטמון לפי hash של התוכן, בתיקייה {code(".pressd/cache")}
        . בכל build חשבו hash של קובץ המקור ושל הגדרות ההקטנה; אם המפתח כבר קיים, העתיקו
        את הפלט מהמטמון במקום להריץ שוב את sharp.
      </>
    ),
    reasons: ["לא מדויק", "לא עזר", "ארוך מדי", "לא בטוח", "אחר"],
    note: "התשובה התעלמה מתיקיית המטמון של Vercel",
    labels: {
      helpful: "עזר לי",
      notHelpful: "לא עזר",
      copy: "העתקה",
      copied: "הועתק",
      regenerate: "תשובה חדשה",
      thanks: "תודה",
      whatWentWrong: "מה השתבש?",
      whatStoodOut: "מה בלט?",
      reasons: "סיבות",
      note: "הוספת הערה",
      notePlaceholder: "הוספת הערה (לא חובה)",
      cancel: "ביטול",
      send: "שליחת משוב",
      sentThanks: "תודה — נשתמש בזה כדי להשתפר.",
      undo: "בטל",
      question: "איך הייתה התשובה?",
      rating: "דירוג",
      scale: ["גרועה", "חלשה", "סבירה", "טובה", "מצוינת"],
      announceSent: "המשוב נשלח",
      announceHelpful: "סומן כמועיל",
      announceOpen: "ספרו לנו מה השתבש",
    },
  },
  ar: {
    answer: (
      <>
        خزّن الصور المصغّرة مؤقتًا حسب بصمة المحتوى في {code(".pressd/cache")}. في كل
        عملية بناء، احسب بصمة الملف الأصلي وخيارات التصغير؛ وإن وُجد المفتاح، انسخ الناتج
        المخزّن بدل تشغيل sharp من جديد.
      </>
    ),
    reasons: ["غير دقيقة", "غير مفيدة", "طويلة جدًا", "غير آمنة", "أخرى"],
    note: "تجاهلت مجلد التخزين المؤقت في Vercel",
    labels: {
      helpful: "مفيدة",
      notHelpful: "غير مفيدة",
      copy: "نسخ",
      copied: "تم النسخ",
      regenerate: "إعادة التوليد",
      thanks: "شكرًا",
      whatWentWrong: "ما الخطأ؟",
      whatStoodOut: "ما الذي لفت انتباهك؟",
      reasons: "الأسباب",
      note: "إضافة ملاحظة",
      notePlaceholder: "إضافة ملاحظة (اختياري)",
      cancel: "إلغاء",
      send: "إرسال الملاحظات",
      sentThanks: "شكرًا — سنستفيد من ذلك في التحسين.",
      undo: "تراجع",
      question: "ما رأيك في هذه الإجابة؟",
      rating: "التقييم",
      scale: ["سيئة", "ضعيفة", "مقبولة", "جيدة", "ممتازة"],
      announceSent: "تم إرسال الملاحظات",
      announceHelpful: "تم وضع علامة مفيدة",
      announceOpen: "أخبرنا بما حدث من خطأ",
    },
  },
};

/** Types the note one character at a time, starting `from` ms after the last step. */
const typeNote = (note: string, from: number): MockStep<Feedback>[] =>
  Array.from(note, (_, i) => ({
    delay: i === 0 ? from : 45,
    apply: (s: Feedback) => ({ ...s, note: note.slice(0, i + 1) }),
  }));

const inline = (reasons: string[], note: string): MockStep<Feedback>[] => [
  { delay: 1400, apply: () => ({ ...emptyFeedback, rating: "down", status: "open" }) },
  { delay: 900, apply: (s) => ({ ...s, reasons: [reasons[0]] }) },
  { delay: 600, apply: (s) => ({ ...s, reasons: [...s.reasons, reasons[1]] }) },
  ...typeNote(note, 700),
  wait(700),
  { delay: 0, apply: (s) => ({ ...s, status: "sent" }) },
];

const detailed = (reasons: string[], note: string): MockStep<Feedback>[] => [
  { delay: 1200, apply: (s) => ({ ...s, rating: 2 }) },
  { delay: 800, apply: (s) => ({ ...s, reasons: [reasons[0]] }) },
  { delay: 600, apply: (s) => ({ ...s, reasons: [...s.reasons, reasons[2]] }) },
  ...typeNote(note, 700),
  wait(700),
  { delay: 0, apply: (s) => ({ ...s, status: "sent" }) },
];

export default function ResponseFeedbackDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const isDetailed = variant === "Detailed";
  const { state, setState } = useMockRun<Feedback>(
    emptyFeedback,
    (isDetailed ? detailed : inline)(text.reasons, text.note),
    { autoplay },
  );

  const feedback = (
    <ResponseFeedback
      value={state}
      onValueChange={setState}
      onCopy={() => {}}
      onRegenerate={() => {}}
      variant={isDetailed ? "detailed" : "inline"}
      reasons={locale === "en" ? undefined : text.reasons}
      labels={text.labels}
    />
  );

  if (isDetailed) return feedback;

  return (
    <div className="w-full max-w-xl">
      <p className="mb-2 text-[0.9375rem] leading-relaxed">{text.answer}</p>
      {feedback}
    </div>
  );
}
