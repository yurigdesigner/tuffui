"use client";

import { Brain, Database, Globe, Wrench } from "@phosphor-icons/react";
import type { DemoLocale } from "@/components/docs/demo";
import { Accordion, Collapsible } from "@/components/ui/disclosure";

/** Keeps a Latin fragment in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

const copy: Record<
  DemoLocale,
  {
    thought: string;
    steps: string;
    reasoning: string;
    search: string;
    results: string;
    searched: string;
    query: string;
    tools: string;
  }
> = {
  en: {
    thought: "Thought for 6s",
    steps: "3 steps",
    reasoning:
      "Compared sign-ups by country, checked which locales have a reviewed glossary, then weighed support volume per language.",
    search: "Web search",
    results: "4 results",
    searched: "Searched “onboarding localization best practices” and opened 4 pages.",
    query: "Database query",
    tools: "Tools used",
  },
  he: {
    thought: "חשב 6 שניות",
    steps: "3 שלבים",
    reasoning:
      "השווה הרשמות לפי מדינה, בדק לאילו שפות יש מילון מונחים מאושר, ואז שקל את נפח הפניות לתמיכה בכל שפה.",
    search: "חיפוש באינטרנט",
    results: "4 תוצאות",
    searched: "חיפש ”שיטות מומלצות ללוקליזציה של אונבורדינג“ ופתח 4 דפים.",
    query: "שאילתה למסד הנתונים",
    tools: "כלים שהופעלו",
  },
  ar: {
    thought: "فكّر لمدة 6 ثوانٍ",
    steps: "3 خطوات",
    reasoning:
      "قارن التسجيلات حسب الدولة، وتحقّق من اللغات التي لديها مسرد مصطلحات مُراجَع، ثم وازن حجم طلبات الدعم لكل لغة.",
    search: "البحث على الويب",
    results: "4 نتائج",
    searched: "بحث عن «أفضل ممارسات توطين تجربة الإعداد» وفتح 4 صفحات.",
    query: "استعلام قاعدة البيانات",
    tools: "الأدوات المستخدمة",
  },
};

export default function DisclosureDemo({
  variant,
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  if (variant === "Single") {
    return (
      <div className="w-full max-w-md">
        <Collapsible title={text.thought} icon={Brain} meta={text.steps}>
          {text.reasoning}
        </Collapsible>
      </div>
    );
  }
  return (
    <div className="w-full max-w-md rounded-2xl bg-surface-inset p-1.5">
      <Accordion
        defaultValue={["search"]}
        items={[
          {
            id: "search",
            title: text.search,
            icon: Globe,
            meta: text.results,
            content: text.searched,
          },
          {
            id: "query",
            title: text.query,
            icon: Database,
            meta: locale === "en" ? "120ms" : ltr("120ms"),
            content: (
              <span dir="ltr" className="block">
                SELECT country, count(*) FROM signups WHERE created_at &gt; now() - 30d …
              </span>
            ),
          },
          {
            id: "tools",
            title: text.tools,
            icon: Wrench,
            meta: "2",
            content: <span dir="ltr">analytics.export, glossary.lookup</span>,
          },
        ]}
      />
    </div>
  );
}
