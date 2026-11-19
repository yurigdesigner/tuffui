"use client";

import { ChartBar, EnvelopeSimple, Globe, MagnifyingGlass } from "@phosphor-icons/react";
import { useState } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  PromptSuggestions,
  type PromptSuggestion,
  type PromptSuggestionsLabels,
} from "./prompt-suggestions";

/** Keeps a version number or time in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

const icons = [Globe, ChartBar, EnvelopeSimple, MagnifyingGlass];

/** The same suggestions in each demo language; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    heading: string;
    starters: [string, string][];
    followUps: [string[], string[]];
    answer: string;
    sent: string;
    labels?: Partial<PromptSuggestionsLabels>;
  }
> = {
  en: {
    heading: "What should we work on?",
    starters: [
      ["Localize the onboarding flow", "German and Japanese, with the glossary"],
      ["Chart last month's signups", "By plan and by country"],
      ["Draft the 2.4 release email", "From the merged pull requests"],
      ["Find unused feature flags", "Across web and api"],
    ],
    followUps: [
      ["Send test emails to me", "Add Japanese next", "Show the German subject lines"],
      [
        "Compare open rates by locale",
        "Schedule for Monday 9:00",
        "Review the plan names",
      ],
    ],
    answer:
      "All four onboarding emails now have German versions, with product names kept in English.",
    sent: "Sent:",
  },
  he: {
    heading: "על מה נעבוד?",
    starters: [
      ["תרגום תהליך ההצטרפות", "גרמנית ויפנית, לפי מילון המונחים"],
      ["גרף ההרשמות של החודש שעבר", "לפי חבילה ולפי מדינה"],
      [`טיוטת מייל לגרסה ${ltr("2.4")}`, "מתוך ה־pull requests שמוזגו"],
      ["איתור feature flags שלא בשימוש", "ב־web וב־api"],
    ],
    followUps: [
      ["שלח לי מיילים לבדיקה", "עכשיו להוסיף יפנית", "הצג את שורות הנושא בגרמנית"],
      [
        "השוואת שיעורי פתיחה לפי שפה",
        `תזמון ליום שני ב־${ltr("9:00")}`,
        "בדיקת שמות החבילות",
      ],
    ],
    answer:
      "לכל ארבעת מיילי ההצטרפות יש עכשיו גרסה בגרמנית, ושמות המוצרים נשארו באנגלית.",
    sent: "נשלח:",
    labels: {
      suggestedPrompts: "הצעות לבקשות",
      suggestedFollowUps: "הצעות להמשך",
      moreSuggestions: "הצעות נוספות",
      loadingSuggestions: "טוען הצעות חדשות",
    },
  },
  ar: {
    heading: "على ماذا نعمل؟",
    starters: [
      ["تعريب مسار التسجيل", "الألمانية واليابانية، وفق المسرد"],
      ["رسم بياني لتسجيلات الشهر الماضي", "حسب الباقة وحسب الدولة"],
      [`مسودة رسالة الإصدار ${ltr("2.4")}`, "من طلبات الدمج المقبولة"],
      ["العثور على feature flags غير المستخدمة", "في web وapi"],
    ],
    followUps: [
      ["أرسل لي رسائل تجريبية", "أضف اليابانية بعدها", "اعرض عناوين الرسائل بالألمانية"],
      [
        "قارن معدلات الفتح حسب اللغة",
        `جدولة يوم الاثنين ${ltr("9:00")}`,
        "راجع أسماء الباقات",
      ],
    ],
    answer:
      "أصبحت لرسائل التسجيل الأربع نسخ ألمانية، مع إبقاء أسماء المنتجات بالإنجليزية.",
    sent: "أُرسل:",
    labels: {
      suggestedPrompts: "اقتراحات للطلبات",
      suggestedFollowUps: "اقتراحات للمتابعة",
      moreSuggestions: "مزيد من الاقتراحات",
      loadingSuggestions: "جارٍ تحميل اقتراحات جديدة",
    },
  },
};

type State = { set: number; refreshing: boolean };

const script: MockStep<State>[] = [
  wait(2600),
  { delay: 0, apply: (s) => ({ ...s, refreshing: true }) },
  { delay: 700, apply: () => ({ set: 1, refreshing: false }) },
];

export default function PromptSuggestionsDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const { state, setState } = useMockRun<State>({ set: 0, refreshing: false }, script, {
    autoplay,
  });
  const [sent, setSent] = useState<string | null>(null);

  if (variant !== "Chips") {
    const starters: PromptSuggestion[] = text.starters.map(([title, hint], i) => ({
      id: "abcd"[i],
      icon: icons[i],
      title,
      hint,
    }));
    return (
      <PromptSuggestions
        heading={text.heading}
        data={starters}
        labels={text.labels}
        onSelect={(_, prompt) => setSent(prompt)}
        className={sent ? "opacity-60" : undefined}
      />
    );
  }

  const followUps: PromptSuggestion[] = text.followUps[state.set].map((title, i) => ({
    id: `f${state.set * 3 + i + 1}`,
    title,
  }));

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <p className="text-sm leading-relaxed">{text.answer}</p>
      <PromptSuggestions
        variant="chips"
        data={followUps}
        refreshing={state.refreshing}
        labels={text.labels}
        onSelect={(_, prompt) => setSent(prompt)}
        onRefresh={() => {
          setState((s) => ({ ...s, refreshing: true }));
          setTimeout(
            () => setState((s) => ({ set: (s.set + 1) % 2, refreshing: false })),
            700,
          );
        }}
      />
      {sent && (
        <p className="text-xs text-muted-foreground">
          {text.sent} {sent}
        </p>
      )}
    </div>
  );
}
