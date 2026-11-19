"use client";

import type { DemoLocale } from "@/components/docs/demo";
import {
  streamText,
  useMockRun,
  wait,
  type MockStep,
} from "@/registry/use-mock-run/use-mock-run";
import { ChatThread, type ChatThreadLabels, type ThreadMessage } from "./chat-thread";

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

/** The same conversation in each demo language; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    locale: string;
    userName?: string;
    labels?: Partial<ChatThreadLabels>;
    turns: [string, string, string, string];
    answer: string;
    followUp: string;
  }
> = {
  en: {
    locale: "en-US",
    turns: [
      "Which onboarding emails still go out in English only?",
      "Four of the seven: welcome, verify-email, trial-ending and first-invoice. The other three already use the locale from the user profile.",
      "Translate those four into German.",
      "Keep product names in English, and use the glossary for plan names.",
    ],
    answer:
      "Done — all four templates now have a German version under emails/de. Product names stay in English and the plan names come from the glossary, so “Team” and “Business” match the pricing page. Want me to send test emails to your inbox?",
    followUp: "Yes, send them to me.",
  },
  he: {
    locale: "he-IL",
    userName: "אתה",
    labels: {
      conversation: "שיחה",
      today: "היום",
      yesterday: "אתמול",
      unread: "לא נקראו",
      jumpToLatest: "מעבר להודעה האחרונה",
      fresh: (count) => `${count} חדשות`,
    },
    turns: [
      "אילו מיילים של תהליך ההצטרפות עדיין יוצאים רק באנגלית?",
      "ארבעה מתוך שבעה: ברוכים הבאים, אימות מייל, סיום תקופת הניסיון והחשבונית הראשונה. שלושת האחרים כבר משתמשים בשפה שבפרופיל המשתמש.",
      "תתרגם את הארבעה האלה לגרמנית.",
      "את שמות המוצרים תשאיר באנגלית, ולשמות החבילות תשתמש במילון המונחים.",
    ],
    answer:
      "בוצע — לכל ארבע התבניות יש עכשיו גרסה בגרמנית בתיקייה emails/de. שמות המוצרים נשארו באנגלית ושמות החבילות לקוחים ממילון המונחים, כך ש־Team ו־Business תואמים לעמוד המחירים. לשלוח לך מיילים לבדיקה?",
    followUp: "כן, תשלח לי.",
  },
  ar: {
    locale: "ar",
    userName: "أنت",
    labels: {
      conversation: "المحادثة",
      today: "اليوم",
      yesterday: "أمس",
      unread: "غير مقروءة",
      jumpToLatest: "الانتقال إلى الأحدث",
      fresh: (count) => `${count} جديدة`,
    },
    turns: [
      "أي رسائل التسجيل ما زالت تُرسل بالإنجليزية فقط؟",
      "أربع من سبع: الترحيب، وتأكيد البريد، وانتهاء الفترة التجريبية، والفاتورة الأولى. أما الثلاث الأخرى فتستخدم اللغة المحددة في ملف المستخدم.",
      "ترجم هذه الأربع إلى الألمانية.",
      "أبقِ أسماء المنتجات بالإنجليزية، واستخدم المسرد لأسماء الباقات.",
    ],
    answer:
      "تم — أصبحت للقوالب الأربعة نسخة ألمانية في emails/de. بقيت أسماء المنتجات بالإنجليزية وأُخذت أسماء الباقات من المسرد، لذا تطابق Team وBusiness صفحة الأسعار. هل أرسل رسائل تجريبية إلى بريدك؟",
    followUp: "نعم، أرسلها إليّ.",
  },
};

type State = { messages: ThreadMessage[] };

function history([q1, a1, q2, q3]: string[]): ThreadMessage[] {
  return [
    { id: "y1", role: "user", at: ago(26 * 60), content: q1 },
    { id: "y2", role: "assistant", at: ago(26 * 60 - 1), content: a1 },
    { id: "t1", role: "user", at: ago(4), content: q2 },
    { id: "t2", role: "user", at: ago(3), content: q3 },
  ];
}

function script(answer: string, followUp: string): MockStep<State>[] {
  return [
    wait(900),
    {
      delay: 0,
      apply: (s) => ({
        messages: [
          ...s.messages,
          {
            id: "t3",
            role: "assistant",
            at: new Date().toISOString(),
            content: "",
            streaming: true,
          },
        ],
      }),
    },
    ...streamText<State>(
      answer,
      (s, content) => ({
        messages: s.messages.map((m) => (m.id === "t3" ? { ...m, content } : m)),
      }),
      { interval: 26 },
    ),
    {
      delay: 0,
      apply: (s) => ({
        messages: s.messages.map((m) => (m.id === "t3" ? { ...m, streaming: false } : m)),
      }),
    },
    {
      delay: 1400,
      apply: (s) => ({
        messages: [
          ...s.messages,
          { id: "t4", role: "user", at: new Date().toISOString(), content: followUp },
        ],
      }),
    },
  ];
}

export default function ChatThreadDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const { state } = useMockRun<State>(
    { messages: history(text.turns) },
    script(text.answer, text.followUp),
    { autoplay },
  );

  return (
    <ChatThread
      data={{ messages: state.messages, unreadFrom: "t3" }}
      density={variant === "Dense" ? "dense" : "default"}
      agentName="Claude"
      userName={text.userName}
      locale={text.locale}
      labels={text.labels}
      height={variant === "Dense" ? 340 : 420}
    />
  );
}
