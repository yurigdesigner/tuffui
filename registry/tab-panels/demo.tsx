"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/tab-panels";

const panel = "rounded-2xl bg-surface-inset p-4 text-[0.8125rem] text-muted-foreground";

/** Keeps a Latin name in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

const copy: Record<
  DemoLocale,
  {
    response: string;
    answer: string;
    sources: string;
    steps: string;
    raw: string;
    answerText: string;
    sourcesText: string;
    stepsText: string;
  }
> = {
  en: {
    response: "Response",
    answer: "Answer",
    sources: "Sources",
    steps: "Steps",
    raw: "Raw",
    answerText:
      "Ship German first: 38% of trial sign-ups last month came from DACH, and the glossary is already reviewed.",
    sourcesText:
      "6 sources — analytics export, glossary, two support threads and the pricing page.",
    stepsText:
      "Queried sign-ups by country, checked translation coverage, compared support volume.",
  },
  he: {
    response: "פרטי התשובה",
    answer: "תשובה",
    sources: "מקורות",
    steps: "שלבים",
    raw: "גולמי",
    answerText: `כדאי להתחיל בגרמנית: 38% מההרשמות לניסיון בחודש שעבר הגיעו מאזור ${ltr("DACH")}, ומילון המונחים כבר עבר בדיקה.`,
    sourcesText:
      "6 מקורות — ייצוא מהאנליטיקס, מילון המונחים, שתי פניות לתמיכה ודף התמחור.",
    stepsText:
      "שלפתי הרשמות לפי מדינה, בדקתי את כיסוי התרגום והשוויתי את נפח הפניות לתמיכה.",
  },
  ar: {
    response: "الرد",
    answer: "الإجابة",
    sources: "المصادر",
    steps: "الخطوات",
    raw: "الخام",
    answerText: `ابدأ بالألمانية: جاء 38% من التسجيلات التجريبية الشهر الماضي من منطقة ${ltr("DACH")}، ومسرد المصطلحات مُراجَع بالفعل.`,
    sourcesText:
      "6 مصادر: تصدير التحليلات، ومسرد المصطلحات، ومحادثتا دعم، وصفحة الأسعار.",
    stepsText:
      "استعلمتُ عن التسجيلات حسب الدولة، وتحقّقتُ من تغطية الترجمة، وقارنتُ حجم طلبات الدعم.",
  },
};

export default function TabPanelsDemo({
  variant,
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const pills = variant === "Pills";
  return (
    <div className="w-full max-w-md">
      <Tabs defaultValue="answer" variant={pills ? "pills" : "default"}>
        <TabList label={text.response}>
          <Tab value="answer">{text.answer}</Tab>
          <Tab value="sources" count={6}>
            {text.sources}
          </Tab>
          <Tab value="steps" count={4}>
            {text.steps}
          </Tab>
          <Tab value="raw" disabled>
            {text.raw}
          </Tab>
        </TabList>
        <TabPanel value="answer" className={panel}>
          {text.answerText}
        </TabPanel>
        <TabPanel value="sources" lazy className={panel}>
          {text.sourcesText}
        </TabPanel>
        <TabPanel value="steps" lazy className={panel}>
          {text.stepsText}
        </TabPanel>
      </Tabs>
    </div>
  );
}
