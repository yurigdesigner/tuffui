"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { MemoryPanel, type Memory, type MemoryPanelLabels } from "./memory-panel";

/** Keeps a Latin name, path or code in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

type Copy = {
  memories: [string, string, string, string];
  sources: [string, string, string, string];
  added: string;
  addedSource: string;
  edited: string;
  editedSource: string;
  labels?: Partial<MemoryPanelLabels>;
};

/** The same memories in each demo language; Hebrew and Arabic show the RTL layout. */
const copy: Record<DemoLocale, Copy> = {
  en: {
    memories: [
      "Uses pnpm, never npm or yarn, in every repo.",
      "Run the e2e suite in every shipped locale before calling i18n work done.",
      "Product names stay in English; the glossary in docs/glossary.md wins over MT.",
      "Working on feat/onboarding-de for this session.",
    ],
    sources: [
      "from chat · 3w ago",
      "from a correction · 4d ago",
      "from docs/glossary.md · 2d ago",
      "from git · just now",
    ],
    added: "Prefers PRs opened as drafts until CI is green.",
    addedSource: "from chat · just now",
    edited: "Run the e2e suite in de-DE and ja-JP before calling i18n work done.",
    editedSource: "edited · just now",
  },
  he: {
    memories: [
      `משתמש ב־${ltr("pnpm")} בכל ריפו, אף פעם לא ב־${ltr("npm")} או ב־${ltr("yarn")}.`,
      "להריץ את בדיקות ה־e2e בכל שפה שיוצאת לפני שסוגרים עבודת תרגום.",
      `שמות מוצרים נשארים באנגלית; המילון ב־${ltr("docs/glossary.md")} גובר על תרגום מכונה.`,
      `בסשן הזה עובדים על ${ltr("feat/onboarding-de")}.`,
    ],
    sources: [
      "מהשיחה · לפני 3 שבועות",
      "מתיקון · לפני 4 ימים",
      `מ־${ltr("docs/glossary.md")} · לפני יומיים`,
      `מ־${ltr("git")} · הרגע`,
    ],
    added: `מעדיף לפתוח ${ltr("PR")} כטיוטה עד שה־${ltr("CI")} ירוק.`,
    addedSource: "מהשיחה · הרגע",
    edited: `להריץ את בדיקות ה־e2e ב־${ltr("de-DE")} וב־${ltr("ja-JP")} לפני שסוגרים עבודת תרגום.`,
    editedSource: "נערך · הרגע",
    labels: {
      title: "זיכרון",
      count: (count, total) => (
        <>
          {count} {total === 1 ? "זיכרון" : "זיכרונות"}
        </>
      ),
      search: "חיפוש",
      searchMemories: "חיפוש בזיכרונות",
      clearSearch: "ניקוי החיפוש",
      scope: "היקף",
      scopes: { all: "הכול", user: "משתמש", project: "פרויקט", session: "סשן" },
      noMatch: "אין זיכרונות תואמים",
      noMatchHint: "נסו חיפוש או היקף אחר.",
      empty: "עוד לא נשמר כלום",
      emptyHint: "זיכרונות יופיעו ככל שהסוכן לומד.",
      footer: "הסוכן קורא אותם בתחילת כל הרצה.",
      undo: "ביטול המחיקה",
      forgot: (text) => `"${text}" נשכח. אפשר לבטל.`,
      restored: "הזיכרון שוחזר",
      updated: "הזיכרון עודכן",
      editField: "עריכת זיכרון",
      new: "חדש",
      pinned: "מוצמד",
      editHint: "Enter לשמירה · Esc לביטול",
      edit: (text) => `עריכת "${text}"`,
      forget: (text) => `שכחת "${text}"`,
    },
  },
  ar: {
    memories: [
      `يستخدم ${ltr("pnpm")} في كل مستودع، ولا يستخدم ${ltr("npm")} أو ${ltr("yarn")} أبدًا.`,
      "شغّل اختبارات e2e بكل لغة منشورة قبل اعتبار عمل الترجمة منتهيًا.",
      `تبقى أسماء المنتجات بالإنجليزية؛ والمسرد في ${ltr("docs/glossary.md")} مقدَّم على الترجمة الآلية.`,
      `العمل في هذه الجلسة على ${ltr("feat/onboarding-de")}.`,
    ],
    sources: [
      "من المحادثة · قبل 3 أسابيع",
      "من تصحيح · قبل 4 أيام",
      `من ${ltr("docs/glossary.md")} · قبل يومين`,
      `من ${ltr("git")} · الآن`,
    ],
    added: `يفضّل فتح طلبات الدمج كمسودات حتى ينجح ${ltr("CI")}.`,
    addedSource: "من المحادثة · الآن",
    edited: `شغّل اختبارات e2e بلغتَي ${ltr("de-DE")} و${ltr("ja-JP")} قبل اعتبار عمل الترجمة منتهيًا.`,
    editedSource: "عُدّل · الآن",
    labels: {
      title: "الذاكرة",
      count: (count, total) => (
        <>
          {count}{" "}
          {total === 1
            ? "ذكرى"
            : total === 2
              ? "ذكريان"
              : total <= 10
                ? "ذكريات"
                : "ذكرى"}
        </>
      ),
      search: "بحث",
      searchMemories: "البحث في الذكريات",
      clearSearch: "مسح البحث",
      scope: "النطاق",
      scopes: { all: "الكل", user: "المستخدم", project: "المشروع", session: "الجلسة" },
      noMatch: "لا ذكريات مطابقة",
      noMatchHint: "جرّب بحثًا أو نطاقًا آخر.",
      empty: "لا شيء محفوظ بعد",
      emptyHint: "تظهر الذكريات كلما تعلّم الوكيل.",
      footer: "يقرأ الوكيل هذه الذكريات في بداية كل تشغيل.",
      undo: "تراجع عن النسيان",
      forgot: (text) => `نُسيت «${text}». يمكنك التراجع.`,
      restored: "استُعيدت الذكرى",
      updated: "حُدّثت الذكرى",
      editField: "تعديل الذكرى",
      new: "جديدة",
      pinned: "مثبّتة",
      editHint: "Enter للحفظ · Esc للإلغاء",
      edit: (text) => `تعديل «${text}»`,
      forget: (text) => `نسيان «${text}»`,
    },
  },
};

const memories = (t: Copy): Memory[] => [
  { id: "pnpm", text: t.memories[0], scope: "user", source: t.sources[0], pinned: true },
  { id: "tests", text: t.memories[1], scope: "project", source: t.sources[1] },
  { id: "glossary", text: t.memories[2], scope: "project", source: t.sources[2] },
  { id: "branch", text: t.memories[3], scope: "session", source: t.sources[3] },
];

const script = (t: Copy): MockStep<Memory[]>[] => [
  wait(1400),
  {
    delay: 0,
    apply: (s) => [
      { id: "tz", text: t.added, scope: "user", source: t.addedSource, isNew: true },
      ...s,
    ],
  },
  wait(2200),
  {
    delay: 0,
    apply: (s) =>
      s.map((m) =>
        m.id === "tests" ? { ...m, text: t.edited, source: t.editedSource } : m,
      ),
  },
];

export default function MemoryPanelDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const t = copy[locale];
  const { state, setState } = useMockRun<Memory[]>(memories(t), script(t), { autoplay });

  return (
    <MemoryPanel
      data={state}
      variant={variant === "Compact" ? "compact" : "panel"}
      labels={t.labels}
      onEdit={(memory, text) =>
        setState((s) =>
          s.map((m) => (m.id === memory.id ? { ...m, text, source: t.editedSource } : m)),
        )
      }
      onForget={(memory) => setState((s) => s.filter((m) => m.id !== memory.id))}
    />
  );
}
