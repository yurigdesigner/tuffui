"use client";

import { Robot } from "@phosphor-icons/react";
import type { DemoLocale } from "@/components/docs/demo";
import { MatchField, type MatchFieldLabels, type MatchItem } from "./match-field";

const candidates: MatchItem[] = [
  { id: "lh", name: "Lena Hoffmann", sector: 0, score: 0.96 },
  { id: "dp", name: "Dev Patel", sector: 0, score: 0.62 },
  { id: "mk", name: "Malik Kaya", sector: 1, score: 0.91 },
  { id: "sn", name: "Sara Nilsson", sector: 1, score: 0.6 },
  { id: "ab", name: "Ana Bento", sector: 2, score: 0.77 },
  { id: "tw", name: "Tom Walsh", sector: 2, score: 0.52 },
  { id: "jr", name: "Julia Roth", sector: 3, score: 0.78 },
  { id: "yo", name: "Yuki Ono", sector: 2, score: 0.58 },
];

const bots: MatchItem[] = [
  { id: "billing", name: "billing-agent", initials: "BA", sector: 0, score: 0.94 },
  { id: "refunds", name: "refunds-bot", initials: "RF", sector: 0, score: 0.71 },
  { id: "triage", name: "support-triage", initials: "ST", sector: 1, score: 0.88 },
  { id: "faq", name: "help-center", initials: "HC", sector: 1, score: 0.58 },
  { id: "fraud", name: "risk-review", initials: "RR", sector: 2, score: 0.76 },
  { id: "sdr", name: "sales-assist", initials: "SA", sector: 3, score: 0.46 },
];

/** Keeps a number in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

type Copy = {
  locale: string;
  bots: { title: string; subtitle: string; sectors: string[] };
  candidates: { title: string; subtitle: string; sectors: string[] };
  labels?: Partial<MatchFieldLabels>;
};

/** People and bot names stay as they are; Hebrew and Arabic show the RTL layout. */
const copy: Record<DemoLocale, Copy> = {
  en: {
    locale: "en-US",
    bots: {
      title: "Best bot for this request",
      subtitle: "“I was charged twice for March”",
      sectors: ["Billing", "Support", "Risk", "Sales"],
    },
    candidates: {
      title: "Senior product designer",
      subtitle: "148 applicants · ranked by fit",
      sectors: ["Design systems", "Fintech", "Consumer apps", "Agency"],
    },
  },
  he: {
    locale: "he-IL",
    bots: {
      title: "הבוט המתאים לפנייה",
      subtitle: "„חייבו אותי פעמיים על מרץ”",
      sectors: ["חיוב", "תמיכה", "סיכונים", "מכירות"],
    },
    candidates: {
      title: "מעצב/ת מוצר בכיר/ה",
      subtitle: "148 מועמדים · לפי התאמה",
      sectors: ["מערכות עיצוב", "פינטק", "אפליקציות צרכניות", "סוכנות"],
    },
    labels: {
      above: (count, threshold) => `${count} מעל ${ltr(threshold)}`,
      chart: (title) => `${title}. אפשר לעבור בין ההתאמות בעזרת החצים.`,
      summary: (title, strong, total, threshold, best) =>
        `${title}: ${strong} מתוך ${total} מעל ${ltr(threshold)}${best ? `, הכי מתאים: ${best.name} עם ${ltr(best.score)}` : ""}`,
      status: (name, sector, score) => `${name}, ${sector}, התאמה של ${ltr(score)}`,
    },
  },
  ar: {
    locale: "ar",
    bots: {
      title: "أنسب روبوت لهذا الطلب",
      subtitle: "«خُصم مني المبلغ مرتين عن شهر مارس»",
      sectors: ["الفوترة", "الدعم", "المخاطر", "المبيعات"],
    },
    candidates: {
      title: "مصمم منتجات أول",
      subtitle: "148 متقدمًا · مرتبون حسب الملاءمة",
      sectors: ["أنظمة التصميم", "التقنية المالية", "تطبيقات المستهلكين", "الوكالات"],
    },
    labels: {
      above: (count, threshold) => `${count} فوق ${ltr(threshold)}`,
      chart: (title) => `${title}. استخدم مفاتيح الأسهم للتنقل بين النتائج.`,
      summary: (title, strong, total, threshold, best) =>
        `${title}: ${strong} من ${total} فوق ${ltr(threshold)}${best ? `، الأفضل ${best.name} بنسبة ${ltr(best.score)}` : ""}`,
      status: (name, sector, score) => `${name}، ${sector}، تطابق بنسبة ${ltr(score)}`,
    },
  },
};

export default function MatchFieldDemo({
  variant = "Candidates",
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  return variant === "Bots" ? (
    <MatchField
      title={text.bots.title}
      subtitle={text.bots.subtitle}
      sectors={text.bots.sectors}
      items={bots}
      rings={[0.5, 0.7, 0.9]}
      threshold={0.85}
      icon={Robot}
      locale={text.locale}
      labels={text.labels}
    />
  ) : (
    <MatchField
      title={text.candidates.title}
      subtitle={text.candidates.subtitle}
      sectors={text.candidates.sectors}
      items={candidates}
      locale={text.locale}
      labels={text.labels}
    />
  );
}
