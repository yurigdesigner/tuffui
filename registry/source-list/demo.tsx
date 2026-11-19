"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { SourceList, type Source, type SourceListLabels } from "./source-list";

/** Keeps a header name or path in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

const SOURCES = [
  {
    id: "edge",
    url: "https://developers.cloudflare.com/cache/concepts/default-cache-behavior/",
    month: 8,
  },
  { id: "next", url: "https://nextjs.org/docs/app/guides/static-exports", month: 9 },
  {
    id: "web",
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control",
    month: 7,
  },
  {
    id: "edge2",
    url: "https://developers.cloudflare.com/workers/static-assets/headers/",
    month: 6,
  },
];

/** The same answer and sources in each demo language; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    locale: string;
    /** Title and snippet per source, in `SOURCES` order. */
    sources: [string, string][];
    text: string;
    claims: [string, string, string];
    labels?: Partial<SourceListLabels>;
  }
> = {
  en: {
    locale: "en-US",
    sources: [
      [
        "Caching static assets at the edge",
        "Static files are cached by default based on file extension; HTML is not cached unless a rule says so.",
      ],
      [
        "Static exports",
        "Route Handlers render a static response at build time when marked force-static.",
      ],
      [
        "Cache-Control: immutable",
        "Indicates that the response will not be updated while it's fresh, so browsers skip revalidation.",
      ],
      [
        "Custom headers for static assets",
        "A _headers file in the assets directory attaches headers to matching paths.",
      ],
    ],
    text: "Hashed build files can be cached for a year with immutable [3] because their names change on every deploy [2]. Cloudflare caches them by extension out of the box [1], and a _headers file sets the long Cache-Control for /_next/static/* [4, 1]. HTML stays uncached so new deploys show up at once [1].",
    claims: [
      "Hashed files can be cached for a year",
      "Cached by extension by default",
      "_headers sets Cache-Control",
    ],
  },
  he: {
    locale: "he-IL",
    sources: [
      [
        "שמירת קבצים סטטיים במטמון בקצה הרשת",
        "קבצים סטטיים נשמרים במטמון כברירת מחדל לפי סיומת הקובץ; HTML לא נשמר אלא אם כלל מגדיר זאת.",
      ],
      [
        "ייצוא סטטי",
        "Route Handlers מחזירים תגובה סטטית בזמן ה־build כשהם מסומנים force-static.",
      ],
      [
        ltr("Cache-Control: immutable"),
        "מציין שהתגובה לא תתעדכן כל עוד היא טרייה, ולכן הדפדפן מדלג על אימות מחדש.",
      ],
      [
        "כותרות מותאמות לקבצים סטטיים",
        `קובץ ${ltr("_headers")} בתיקיית הנכסים מוסיף כותרות לנתיבים תואמים.`,
      ],
    ],
    text: `קבצי build עם hash בשם אפשר לשמור במטמון לשנה עם immutable [3], כי השם שלהם משתנה בכל פריסה [2]. Cloudflare שומר אותם לפי סיומת כבר מההתחלה [1], וקובץ ${ltr("_headers")} מגדיר Cache-Control ארוך עבור ${ltr("/_next/static/*")} [4, 1]. HTML לא נשמר במטמון, כך שפריסות חדשות מופיעות מיד [1].`,
    claims: [
      "קבצים עם hash נשמרים לשנה",
      "נשמר לפי סיומת כברירת מחדל",
      `${ltr("_headers")} מגדיר Cache-Control`,
    ],
    labels: {
      sources: "מקורות",
      source: (n, title) => `מקור ${n}: ${title}`,
      count: (sources) => (sources === 1 ? "מקור אחד" : `${sources} מקורות`),
      summary: (sites, claims) =>
        `${sites === 1 ? "אתר אחד" : `${sites} אתרים`} · ${claims === 1 ? "טענה אחת מגובה" : `${claims} טענות מגובות`}`,
      supports: "תומך ב:",
      opensInNewTab: "נפתח בכרטיסייה חדשה",
    },
  },
  ar: {
    locale: "ar",
    sources: [
      [
        "التخزين المؤقت للملفات الثابتة على الحافة",
        "تُخزَّن الملفات الثابتة مؤقتًا افتراضيًا حسب امتداد الملف؛ ولا يُخزَّن HTML ما لم تنص قاعدة على ذلك.",
      ],
      [
        "التصدير الثابت",
        "تُنتج Route Handlers استجابة ثابتة وقت البناء عند وسمها بـ force-static.",
      ],
      [
        ltr("Cache-Control: immutable"),
        "يشير إلى أن الاستجابة لن تتغير ما دامت حديثة، فيتخطى المتصفح إعادة التحقق.",
      ],
      [
        "ترويسات مخصصة للملفات الثابتة",
        `يضيف ملف ${ltr("_headers")} في مجلد الأصول ترويسات إلى المسارات المطابقة.`,
      ],
    ],
    text: `يمكن تخزين ملفات البناء ذات البصمة لمدة عام مع immutable [3] لأن أسماءها تتغير مع كل نشر [2]. يخزّنها Cloudflare حسب الامتداد افتراضيًا [1]، ويضبط ملف ${ltr("_headers")} قيمة Cache-Control طويلة للمسار ${ltr("/_next/static/*")} [4, 1]. أما HTML فلا يُخزَّن، فتظهر الإصدارات الجديدة فورًا [1].`,
    claims: [
      "الملفات ذات البصمة تُخزَّن لعام",
      "التخزين حسب الامتداد افتراضيًا",
      `${ltr("_headers")} يضبط Cache-Control`,
    ],
    labels: {
      sources: "المصادر",
      source: (n, title) => `المصدر ${n}: ${title}`,
      count: (sources) =>
        sources === 1
          ? "مصدر واحد"
          : sources === 2
            ? "مصدران"
            : sources <= 10
              ? `${sources} مصادر`
              : `${sources} مصدرًا`,
      summary: (sites, claims) =>
        `${sites === 1 ? "موقع واحد" : sites === 2 ? "موقعان" : `${sites} مواقع`} · ${claims === 1 ? "ادعاء واحد موثّق" : claims === 2 ? "ادعاءان موثّقان" : `${claims} ادعاءات موثّقة`}`,
      supports: "يدعم:",
      opensInNewTab: "يُفتح في علامة تبويب جديدة",
    },
  },
};

export default function SourceListDemo({
  variant,
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const sources: Source[] = SOURCES.map((s, i) => ({
    id: s.id,
    url: s.url,
    title: text.sources[i][0],
    snippet: text.sources[i][1],
    date: new Date(2026, s.month).toLocaleDateString(text.locale, {
      month: "short",
      year: "numeric",
    }),
  }));

  if (variant === "Panel") {
    return (
      <SourceList
        variant="panel"
        labels={text.labels}
        data={{
          sources,
          claims: [
            { id: "c1", text: text.claims[0], sourceIds: ["web", "next"] },
            { id: "c2", text: text.claims[1], sourceIds: ["edge"] },
            { id: "c3", text: text.claims[2], sourceIds: ["edge2", "edge"] },
          ],
        }}
      />
    );
  }
  return <SourceList labels={text.labels} data={{ sources, text: text.text }} />;
}
