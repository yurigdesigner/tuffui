"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  UserMessage,
  type UserMessageData,
  type UserMessageLabels,
} from "./user-message";

const attachments: UserMessageData["attachments"] = [
  { id: "shot", name: "plan-picker-de.png", kind: "image", size: 284_000 },
  { id: "log", name: "e2e-de-DE.log", kind: "file", size: 41_200 },
];

/** The same message in each demo language; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  { withFiles: string; plain: string; labels?: Partial<UserMessageLabels> }
> = {
  en: {
    withFiles:
      "The German plan picker overflows on mobile — screenshot and the e2e log attached. Can you shorten the labels?",
    plain:
      "Translate the onboarding emails into German and keep product names in English.",
  },
  he: {
    withFiles:
      "בורר החבילות בגרמנית גולש מהמסך במובייל — צירפתי צילום מסך ואת לוג ה־e2e. אפשר לקצר את התוויות?",
    plain: "תתרגם את מיילי ההצטרפות לגרמנית, ואת שמות המוצרים תשאיר באנגלית.",
    labels: {
      attachments: "קבצים מצורפים",
      image: "תמונה",
      file: "קובץ",
      edit: "עריכת ההודעה",
      copy: "העתקת ההודעה",
      copied: "הועתק",
      cancel: "ביטול",
      saveAndResend: "שמירה ושליחה מחדש",
      sending: "שולח",
      notSent: "לא נשלחה",
      failed: "ההודעה לא נשלחה",
      retry: "ניסיון חוזר",
      sent: "נשלחה",
      edited: "נערכה",
    },
  },
  ar: {
    withFiles:
      "قائمة اختيار الباقات بالألمانية تتجاوز حدود الشاشة على الجوال — أرفقت لقطة شاشة وسجل e2e. هل يمكنك تقصير التسميات؟",
    plain: "ترجم رسائل التسجيل إلى الألمانية وأبقِ أسماء المنتجات بالإنجليزية.",
    labels: {
      attachments: "المرفقات",
      image: "صورة",
      file: "ملف",
      edit: "تعديل الرسالة",
      copy: "نسخ الرسالة",
      copied: "تم النسخ",
      cancel: "إلغاء",
      saveAndResend: "حفظ وإعادة الإرسال",
      sending: "جارٍ الإرسال",
      notSent: "لم تُرسل",
      failed: "لم تُرسل الرسالة",
      retry: "إعادة المحاولة",
      sent: "أُرسلت",
      edited: "معدّلة",
    },
  },
};

const initial = (content: string, withFiles: boolean): UserMessageData => ({
  id: "m1",
  content,
  attachments: withFiles ? attachments : undefined,
  status: "sending",
  sentAt: "14:02",
});

const script: MockStep<UserMessageData>[] = [
  wait(1200),
  { delay: 0, apply: (s) => ({ ...s, status: "failed" }) },
  wait(2200),
  { delay: 0, apply: (s) => ({ ...s, status: "sending" }) },
  { delay: 900, apply: (s) => ({ ...s, status: "sent" }) },
];

export default function UserMessageDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const withFiles = variant === "With attachments";
  const start = initial(withFiles ? text.withFiles : text.plain, withFiles);
  const { state, setState } = useMockRun<UserMessageData>(
    autoplay ? start : { ...start, status: "sent" },
    script,
    { autoplay },
  );

  return (
    <div className="w-full max-w-xl">
      <UserMessage
        data={state}
        labels={text.labels}
        onEdit={(content) => {
          setState((s) => ({ ...s, content, edited: true, status: "sending" }));
          setTimeout(() => setState((s) => ({ ...s, status: "sent" })), 900);
        }}
        onRetry={() => {
          setState((s) => ({ ...s, status: "sending" }));
          setTimeout(() => setState((s) => ({ ...s, status: "sent" })), 900);
        }}
      />
    </div>
  );
}
