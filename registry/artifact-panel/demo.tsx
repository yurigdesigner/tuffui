"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait } from "@/registry/use-mock-run/use-mock-run";
import {
  ArtifactPanel,
  type ArtifactPanelLabels,
  type ArtifactTab,
  type ArtifactVersion,
} from "./artifact-panel";

type HeroCopy = {
  headline: string;
  body: string;
  start: string;
  docs: string;
  stats: [string, string, string];
};

/** The same artifact in each demo language; the source code stays English. */
const copy: Record<
  DemoLocale,
  {
    title: string;
    notes: [string, string, string];
    hero: HeroCopy;
    labels?: Partial<ArtifactPanelLabels>;
  }
> = {
  en: {
    title: "Landing hero",
    notes: [
      "First draft of the hero copy.",
      "Added primary and docs actions.",
      "Stats row from the latest benchmark run.",
    ],
    hero: {
      headline: "Static sites that build in seconds",
      body: "Cached image pipeline, instant previews, zero config.",
      start: "Get started",
      docs: "Docs",
      stats: ["faster", "full build", "config"],
    },
  },
  he: {
    title: "אזור פתיחה לדף הנחיתה",
    notes: [
      "טיוטה ראשונה של הטקסט.",
      "נוספו כפתור ראשי וקישור לתיעוד.",
      "שורת נתונים מהרצת הביצועים האחרונה.",
    ],
    hero: {
      headline: "אתרים סטטיים שנבנים תוך שניות",
      body: "צינור תמונות עם מטמון, תצוגה מקדימה מיידית, בלי הגדרות.",
      start: "להתחיל",
      docs: "תיעוד",
      stats: ["מהר יותר", "בנייה מלאה", "הגדרות"],
    },
    labels: {
      version: "גרסה",
      previousVersion: "הגרסה הקודמת",
      nextVersion: "הגרסה הבאה",
      of: "מתוך",
      view: "תצוגה",
      preview: "תצוגה מקדימה",
      source: "קוד",
      copySource: "העתקת הקוד",
      copied: "הועתק",
      download: "הורדה",
      open: "פתיחה בכרטיסייה חדשה",
      versions: "גרסאות",
      current: "נוכחית",
      viewing: (label, current) => `מוצגת ${label} · הנוכחית היא ${current}`,
      restore: "שחזור הגרסה הזו",
      sourceCopied: "הקוד הועתק",
      status: (label, tab) => `${label}, ${tab === "source" ? "קוד" : "תצוגה מקדימה"}`,
    },
  },
  ar: {
    title: "واجهة صفحة الهبوط",
    notes: [
      "المسودة الأولى لنص الواجهة.",
      "أُضيف زر رئيسي ورابط للتوثيق.",
      "صف أرقام من آخر اختبار أداء.",
    ],
    hero: {
      headline: "مواقع ثابتة تُبنى في ثوانٍ",
      body: "معالجة صور مع تخزين مؤقت، ومعاينات فورية، دون أي إعداد.",
      start: "ابدأ الآن",
      docs: "التوثيق",
      stats: ["أسرع", "بناء كامل", "إعدادات"],
    },
    labels: {
      version: "الإصدار",
      previousVersion: "الإصدار السابق",
      nextVersion: "الإصدار التالي",
      of: "من",
      view: "العرض",
      preview: "معاينة",
      source: "الشيفرة",
      copySource: "نسخ الشيفرة",
      copied: "تم النسخ",
      download: "تنزيل",
      open: "فتح في علامة تبويب جديدة",
      versions: "الإصدارات",
      current: "الحالي",
      viewing: (label, current) => `تعرض ${label} · الإصدار الحالي ${current}`,
      restore: "استعادة هذا الإصدار",
      sourceCopied: "تم نسخ الشيفرة",
      status: (label, tab) => `${label}، ${tab === "source" ? "الشيفرة" : "معاينة"}`,
    },
  },
};

function Hero({ text, cta, stats }: { text: HeroCopy; cta?: boolean; stats?: boolean }) {
  return (
    <div className="w-full max-w-sm rounded-2xl bg-foreground/[0.04] p-5">
      <p className="text-[0.6875rem] font-medium text-brand">pressd 3.1</p>
      <p className="mt-1 text-lg font-semibold tracking-tight text-balance rtl:tracking-normal">
        {text.headline}
      </p>
      <p className="mt-1.5 text-[0.8125rem] text-muted-foreground">{text.body}</p>
      {cta && (
        <div className="mt-4 flex gap-2">
          <span className="rounded-full bg-foreground px-3.5 py-1.5 text-xs font-medium text-background">
            {text.start}
          </span>
          <span className="rounded-full bg-foreground/[0.07] px-3.5 py-1.5 text-xs">
            {text.docs}
          </span>
        </div>
      )}
      {stats && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {["3.8×", "12.6s", "0"].map((n, i) => (
            <div key={n} className="rounded-xl bg-foreground/[0.05] py-2">
              <p dir="ltr" className="font-mono text-sm font-medium">
                {n}
              </p>
              <p className="text-[0.6875rem] text-muted-foreground">{text.stats[i]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const source = (extra: string) => `export function Hero() {
  return (
    <section className="rounded-2xl p-5">
      <p className="text-brand">pressd 3.1</p>
      <h1>Static sites that build in seconds</h1>
      <p>Cached image pipeline, instant previews, zero config.</p>${extra}
    </section>
  );
}`;

const versionsFor = ({ notes, hero }: (typeof copy)[DemoLocale]): ArtifactVersion[] => [
  {
    id: "v1",
    label: "v1",
    createdAt: "14:02",
    note: notes[0],
    preview: <Hero text={hero} />,
    source: source(""),
    filename: "hero.tsx",
  },
  {
    id: "v2",
    label: "v2",
    createdAt: "14:05",
    note: notes[1],
    preview: <Hero text={hero} cta />,
    source: source(`
      <div className="flex gap-2">
        <a href="/start">Get started</a>
        <a href="/docs">Docs</a>
      </div>`),
    filename: "hero.tsx",
  },
  {
    id: "v3",
    label: "v3",
    createdAt: "14:09",
    note: notes[2],
    preview: <Hero text={hero} cta stats />,
    source: source(`
      <Actions />
      <Stats items={[["3.8×", "faster"], ["12.6s", "full build"], ["0", "config"]]} />`),
    filename: "hero.tsx",
  },
];

type State = { versionId: string; tab: ArtifactTab };

export default function ArtifactPanelDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const history = variant === "Versions";
  const { state, setState } = useMockRun<State>(
    { versionId: history ? "v3" : "v1", tab: "preview" },
    history
      ? [
          wait(1500),
          { delay: 0, apply: (s) => ({ ...s, versionId: "v2" }) },
          { delay: 1600, apply: (s) => ({ ...s, versionId: "v1" }) },
          { delay: 1600, apply: (s) => ({ ...s, tab: "source" }) },
        ]
      : [
          wait(1200),
          { delay: 0, apply: (s) => ({ ...s, versionId: "v2" }) },
          { delay: 1400, apply: (s) => ({ ...s, versionId: "v3" }) },
          { delay: 1800, apply: (s) => ({ ...s, tab: "source" }) },
          { delay: 2200, apply: (s) => ({ ...s, tab: "preview" }) },
        ],
    { autoplay },
  );

  return (
    <ArtifactPanel
      view={history ? "versions" : "preview"}
      data={{ title: text.title, kind: "React", versions: versionsFor(text) }}
      versionId={state.versionId}
      onVersionChange={(v) => setState((s) => ({ ...s, versionId: v.id }))}
      tab={state.tab}
      onTabChange={(tab) => setState((s) => ({ ...s, tab }))}
      onRestore={() => setState((s) => ({ ...s, versionId: "v3" }))}
      onOpen={() => {}}
      labels={text.labels}
    />
  );
}
