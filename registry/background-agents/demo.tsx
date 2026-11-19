"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  BackgroundAgents,
  type BackgroundAgent,
  type BackgroundAgentsLabels,
} from "./background-agents";

type State = BackgroundAgent[];

/** Keeps a Latin path, file name or license in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

type Copy = {
  agents: Record<"licenses" | "og" | "invoices" | "docs", { name: string; task: string }>;
  /** Ticker lines, in script order. */
  actions: {
    licenses: [string, string, string, string, string, string];
    og: [string, string, string, string, string];
    invoices: string;
    docs: [string, string, string, string];
  };
  paused: string;
  cancelled: string;
  reviewed: string;
  labels?: Partial<BackgroundAgentsLabels>;
};

/** The same four agents in each demo language; Hebrew and Arabic show the RTL layout. */
const copy: Record<DemoLocale, Copy> = {
  en: {
    agents: {
      licenses: {
        name: "License audit",
        task: "Check every npm dependency against the allowed-license list",
      },
      og: { name: "OG images", task: "Generate social cards for 40 blog posts" },
      invoices: {
        name: "Invoice backfill",
        task: "Regenerate PDFs for March invoices with the new tax line",
      },
      docs: {
        name: "Docs in Japanese",
        task: "Translate the getting-started guide and API reference",
      },
    },
    actions: {
      licenses: [
        "Reading node_modules/sharp/package.json",
        "sharp — Apache-2.0 · allowed",
        "Flagged caniuse-lite — CC-BY-4.0",
        "Reading node_modules/@img/…",
        "Writing licenses.csv",
        "412 packages · 1 needs legal review",
      ],
      og: [
        "Rendered 24 of 40 · /blog/edge-caching",
        "Rendered 27 of 40 · /blog/rsc-patterns",
        "Rendered 32 of 40 · /blog/vector-search",
        "Rendered 37 of 40 · /blog/zero-downtime",
        "40 images in public/og · 3.1 MB",
      ],
      invoices: "3 invoices have no VAT ID — needs a decision",
      docs: [
        "Waits for a free worker",
        "Splitting 18 pages into chunks",
        "Translating getting-started.mdx",
        "Translating api/authentication.mdx",
      ],
    },
    paused: "Paused by you",
    cancelled: "Cancelled by you",
    reviewed: "Skipping invoices without a VAT ID",
  },
  he: {
    agents: {
      licenses: {
        name: "בדיקת רישיונות",
        task: "בדיקה של כל תלות npm מול רשימת הרישיונות המותרים",
      },
      og: { name: "תמונות OG", task: "יצירת כרטיסי שיתוף ל־40 פוסטים בבלוג" },
      invoices: {
        name: "השלמת חשבוניות",
        task: "הפקה מחדש של קובצי PDF לחשבוניות מרץ עם שורת המס החדשה",
      },
      docs: {
        name: "תיעוד ביפנית",
        task: "תרגום מדריך תחילת העבודה ומסמכי ה־API",
      },
    },
    actions: {
      licenses: [
        `קורא את ${ltr("node_modules/sharp/package.json")}`,
        `${ltr("sharp — Apache-2.0")} · מותר`,
        `סומן: ${ltr("caniuse-lite — CC-BY-4.0")}`,
        `קורא את ${ltr("node_modules/@img/…")}`,
        `כותב את ${ltr("licenses.csv")}`,
        "412 חבילות · אחת דורשת בדיקה משפטית",
      ],
      og: [
        `נוצרו 24 מתוך 40 · ${ltr("/blog/edge-caching")}`,
        `נוצרו 27 מתוך 40 · ${ltr("/blog/rsc-patterns")}`,
        `נוצרו 32 מתוך 40 · ${ltr("/blog/vector-search")}`,
        `נוצרו 37 מתוך 40 · ${ltr("/blog/zero-downtime")}`,
        `40 תמונות ב־${ltr("public/og")} · ${ltr("3.1 MB")}`,
      ],
      invoices: "ל־3 חשבוניות אין מספר עוסק — צריך החלטה",
      docs: [
        "ממתין ל־worker פנוי",
        "מחלק 18 עמודים לקטעים",
        `מתרגם את ${ltr("getting-started.mdx")}`,
        `מתרגם את ${ltr("api/authentication.mdx")}`,
      ],
    },
    paused: "הושהה על ידך",
    cancelled: "בוטל על ידך",
    reviewed: "מדלג על חשבוניות בלי מספר עוסק",
    labels: {
      status: {
        queued: "בתור",
        running: "רץ",
        waiting: "דורש בדיקה",
        paused: "מושהה",
        done: "הסתיים",
        failed: "נכשל",
        cancelled: "בוטל",
      },
      region: "סוכנים ברקע",
      agents: "סוכנים",
      review: "לבדיקה",
      action: {
        pause: (name) => `השהיית ${name}`,
        resume: (name) => `המשך ${name}`,
        open: (name) => `פתיחת ${name}`,
        cancel: (name) => `ביטול ${name}`,
      },
      announce: {
        review: (name) => `בודקים את ${name}`,
        pause: (name) => `${name} הושהה`,
        resume: (name) => `${name} ממשיך`,
        open: (name) => `${name} נפתח`,
        cancel: (name) => `${name} בוטל`,
      },
      card: (name, status, percent) => `${name}, ${status}, ${percent}%`,
    },
  },
  ar: {
    agents: {
      licenses: {
        name: "تدقيق التراخيص",
        task: "مطابقة كل اعتمادية npm مع قائمة التراخيص المسموح بها",
      },
      og: { name: "صور OG", task: "إنشاء بطاقات مشاركة لـ 40 مقالًا في المدونة" },
      invoices: {
        name: "استكمال الفواتير",
        task: "إعادة إنشاء ملفات PDF لفواتير مارس مع بند الضريبة الجديد",
      },
      docs: {
        name: "التوثيق باليابانية",
        task: "ترجمة دليل البدء ومرجع الـ API",
      },
    },
    actions: {
      licenses: [
        `قراءة ${ltr("node_modules/sharp/package.json")}`,
        `${ltr("sharp — Apache-2.0")} · مسموح`,
        `تم التنبيه: ${ltr("caniuse-lite — CC-BY-4.0")}`,
        `قراءة ${ltr("node_modules/@img/…")}`,
        `كتابة ${ltr("licenses.csv")}`,
        "412 حزمة · واحدة تحتاج إلى مراجعة قانونية",
      ],
      og: [
        `أُنشئت 24 من 40 · ${ltr("/blog/edge-caching")}`,
        `أُنشئت 27 من 40 · ${ltr("/blog/rsc-patterns")}`,
        `أُنشئت 32 من 40 · ${ltr("/blog/vector-search")}`,
        `أُنشئت 37 من 40 · ${ltr("/blog/zero-downtime")}`,
        `40 صورة في ${ltr("public/og")} · ${ltr("3.1 MB")}`,
      ],
      invoices: "3 فواتير بلا رقم ضريبي — يلزم قرار",
      docs: [
        "في انتظار عامل متاح",
        "تقسيم 18 صفحة إلى أجزاء",
        `ترجمة ${ltr("getting-started.mdx")}`,
        `ترجمة ${ltr("api/authentication.mdx")}`,
      ],
    },
    paused: "أوقفته مؤقتًا",
    cancelled: "ألغيته",
    reviewed: "تخطي الفواتير التي بلا رقم ضريبي",
    labels: {
      status: {
        queued: "في الانتظار",
        running: "قيد التشغيل",
        waiting: "بحاجة إلى مراجعة",
        paused: "متوقف مؤقتًا",
        done: "اكتمل",
        failed: "فشل",
        cancelled: "أُلغي",
      },
      region: "الوكلاء في الخلفية",
      agents: "الوكلاء",
      review: "مراجعة",
      action: {
        pause: (name) => `إيقاف ${name} مؤقتًا`,
        resume: (name) => `استئناف ${name}`,
        open: (name) => `فتح ${name}`,
        cancel: (name) => `إلغاء ${name}`,
      },
      announce: {
        review: (name) => `جارٍ مراجعة ${name}`,
        pause: (name) => `أُوقف ${name} مؤقتًا`,
        resume: (name) => `استُؤنف ${name}`,
        open: (name) => `فُتح ${name}`,
        cancel: (name) => `أُلغي ${name}`,
      },
      card: (name, status, percent) => `${name}، ${status}، ${percent}%`,
    },
  },
};

function initial({ agents, actions }: Copy): State {
  return [
    {
      id: "licenses",
      ...agents.licenses,
      status: "running",
      progress: 0.34,
      action: actions.licenses[0],
      elapsedMs: 74_000,
    },
    {
      id: "og",
      ...agents.og,
      status: "running",
      progress: 0.6,
      action: actions.og[0],
      elapsedMs: 211_000,
    },
    {
      id: "invoices",
      ...agents.invoices,
      status: "waiting",
      progress: 0.48,
      action: actions.invoices,
      elapsedMs: 166_000,
    },
    {
      id: "docs-ja",
      ...agents.docs,
      status: "queued",
      progress: 0,
      action: actions.docs[0],
      elapsedMs: 0,
    },
  ];
}

/** Patches an agent unless the viewer paused or cancelled it. */
const step = (
  delay: number,
  id: string,
  patch: Partial<BackgroundAgent>,
): MockStep<State> => ({
  delay,
  apply: (s) =>
    s.map((a) =>
      a.id === id && (a.status === "running" || a.status === "queued")
        ? { ...a, ...patch, elapsedMs: a.elapsedMs + delay }
        : a,
    ),
});

function script({ actions: { licenses, og, docs } }: Copy): MockStep<State>[] {
  return [
    step(900, "og", { progress: 0.68, action: og[1] }),
    step(800, "licenses", { progress: 0.45, action: licenses[1] }),
    step(1000, "og", { progress: 0.79, action: og[2] }),
    step(900, "licenses", { progress: 0.58, action: licenses[2] }),
    step(1000, "og", { progress: 0.93, action: og[3] }),
    step(900, "licenses", { progress: 0.71, action: licenses[3] }),
    step(900, "og", { progress: 1, status: "done", action: og[4] }),
    step(600, "docs-ja", { status: "running", progress: 0.06, action: docs[1] }),
    step(1000, "licenses", { progress: 0.86, action: licenses[4] }),
    step(900, "docs-ja", { progress: 0.19, action: docs[2] }),
    step(1000, "licenses", { progress: 1, status: "done", action: licenses[5] }),
    step(900, "docs-ja", { progress: 0.33, action: docs[3] }),
  ];
}

export default function BackgroundAgentsDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const { state, setState } = useMockRun<State>(initial(text), script(text), {
    autoplay,
  });
  const set = (id: string, patch: Partial<BackgroundAgent>) =>
    setState((s) => s.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  return (
    <BackgroundAgents
      data={state}
      layout={variant === "Dock" ? "dock" : "grid"}
      className={variant === "Dock" ? "max-w-md" : undefined}
      labels={text.labels}
      onPause={(a) => set(a.id, { status: "paused", action: text.paused })}
      onResume={(a) => set(a.id, { status: "running" })}
      onCancel={(a) => set(a.id, { status: "cancelled", action: text.cancelled })}
      onReview={(a) => set(a.id, { status: "running", action: text.reviewed })}
      onOpen={() => {}}
    />
  );
}
