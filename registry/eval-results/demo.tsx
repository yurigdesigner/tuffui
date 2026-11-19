"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  EvalResults,
  type EvalCase,
  type EvalResultsLabels,
  type EvalStatus,
} from "./eval-results";

/** Keeps a Latin name or number in reading order inside RTL text. */
const ltr = (text: string) => `\u2066${text}\u2069`;

const tables = ["orders", "customers", "invoices", "events", "sessions", "products"];

/** The same eval run in each demo language; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    locale: string;
    runLabel: string;
    asks: string[];
    bad: string;
    good: string;
    metrics: [string, string, string, string];
    labels?: Partial<EvalResultsLabels>;
  }
> = {
  en: {
    locale: "en-US",
    runLabel: "opus-5.5 vs sonnet-5.5",
    asks: [
      "Top 5 customers by revenue last quarter",
      "Daily active sessions for the past week",
      "Orders with no matching invoice",
      "Median order value by country",
      "Products never ordered",
      "Events per user, bucketed by hour",
    ],
    bad: "Missing GROUP BY — the query returns one row per order instead of per customer.",
    good: "Result set matches the reference on the fixture database.",
    metrics: ["Exact-match accuracy", "Latency p50", "Cost per case", "Refusals"],
  },
  he: {
    locale: "he-IL",
    runLabel: `${ltr("opus-5.5")} מול ${ltr("sonnet-5.5")}`,
    asks: [
      "5 הלקוחות המובילים לפי הכנסות ברבעון האחרון",
      "סשנים פעילים ביום בשבוע האחרון",
      "הזמנות בלי חשבונית תואמת",
      "ערך הזמנה חציוני לפי מדינה",
      "מוצרים שאף פעם לא הוזמנו",
      "אירועים למשתמש, לפי שעה",
    ],
    bad: `חסר ${ltr("GROUP BY")} — השאילתה מחזירה שורה לכל הזמנה במקום לכל לקוח.`,
    good: "התוצאה תואמת לתשובת הייחוס על מסד הנתונים לבדיקות.",
    metrics: ["דיוק התאמה מלאה", `זמן תגובה ${ltr("p50")}`, "עלות לבדיקה", "סירובים"],
    labels: {
      region: (suite) => `תוצאות הערכה: ${suite}`,
      running: (count, total) => (
        <>
          {count} מתוך {total} רצות
        </>
      ),
      cases: (total) => `${total} בדיקות`,
      up: "עלייה",
      down: "ירידה",
      vsBaseline: (points) => <>{points} נק׳ לעומת הבסיס</>,
      filterCases: "סינון בדיקות",
      grid: "בדיקות",
      status: {
        pending: "ממתינה",
        running: "רצה",
        pass: "עברה",
        fail: "נכשלה",
        regressed: "נסיגה",
        improved: "שיפור",
      },
      filters: { all: "הכול", failed: "נכשלו", regressed: "נסיגות", improved: "שיפורים" },
      score: (score) => `ציון ${score}`,
      input: "קלט",
      expected: "צפוי",
      actual: "בפועל",
      finished: (passed, total) => `ההערכה הסתיימה: ${passed} מתוך ${total} עברו`,
      noChange: "ללא שינוי",
      better: (amount) => `טוב יותר · ${ltr(amount)}`,
      worse: (amount) => `גרוע יותר · ${ltr(amount)}`,
      baseline: "בסיס",
      candidate: "מועמד",
      regressedCases: (count) => `בדיקות עם נסיגה · ${count}`,
      nothingRegressed: "אין נסיגות.",
    },
  },
  ar: {
    locale: "ar",
    runLabel: `${ltr("opus-5.5")} مقابل ${ltr("sonnet-5.5")}`,
    asks: [
      "أفضل 5 عملاء حسب الإيرادات في الربع الماضي",
      "الجلسات النشطة يوميًا خلال الأسبوع الماضي",
      "طلبات بلا فاتورة مطابقة",
      "متوسط قيمة الطلب حسب الدولة",
      "منتجات لم تُطلب قط",
      "الأحداث لكل مستخدم موزعة حسب الساعة",
    ],
    bad: `ينقص ${ltr("GROUP BY")} — يُرجع الاستعلام صفًا لكل طلب بدلًا من كل عميل.`,
    good: "النتيجة تطابق المرجع على قاعدة بيانات الاختبار.",
    metrics: [
      "دقة المطابقة التامة",
      `زمن الاستجابة ${ltr("p50")}`,
      "التكلفة لكل حالة",
      "حالات الرفض",
    ],
    labels: {
      region: (suite) => `نتائج التقييم: ${suite}`,
      running: (count, total) => (
        <>
          {count} من {total} قيد التشغيل
        </>
      ),
      cases: (total) => `${total} حالة`,
      up: "ارتفاع",
      down: "انخفاض",
      vsBaseline: (points) => <>{points} نقطة مقارنة بالأساس</>,
      filterCases: "تصفية الحالات",
      grid: "الحالات",
      status: {
        pending: "في الانتظار",
        running: "قيد التشغيل",
        pass: "ناجحة",
        fail: "فاشلة",
        regressed: "تراجع",
        improved: "تحسّن",
      },
      filters: {
        all: "الكل",
        failed: "الفاشلة",
        regressed: "التراجعات",
        improved: "التحسينات",
      },
      score: (score) => `الدرجة ${score}`,
      input: "المدخل",
      expected: "المتوقع",
      actual: "الفعلي",
      finished: (passed, total) => `انتهى التقييم: نجحت ${passed} من ${total}`,
      noChange: "بلا تغيير",
      better: (amount) => `أفضل · ${ltr(amount)}`,
      worse: (amount) => `أسوأ · ${ltr(amount)}`,
      baseline: "الأساس",
      candidate: "المرشّح",
      regressedCases: (count) => `حالات التراجع · ${count}`,
      nothingRegressed: "لا تراجعات.",
    },
  },
};

// Deterministic spread: mostly passes, a few failures, regressions and wins.
const finalStatus = (i: number): EvalStatus =>
  [7, 23, 41].includes(i)
    ? "regressed"
    : [12, 35, 50, 57].includes(i)
      ? "fail"
      : [4, 29, 46].includes(i)
        ? "improved"
        : "pass";

const makeCase = (i: number): EvalCase => {
  const status = finalStatus(i);
  const table = tables[i % tables.length];
  const bad = status === "fail" || status === "regressed";
  return {
    id: `case-${i}`,
    name: `sql/${table}-${String(i + 1).padStart(2, "0")}`,
    status: "pending",
    score: bad ? 0.2 + (i % 3) * 0.1 : 0.9 + (i % 2) * 0.1,
    expected: `SELECT … FROM ${table} GROUP BY 1 ORDER BY 2 DESC LIMIT 5;`,
    actual: bad
      ? `SELECT … FROM ${table} ORDER BY 2 DESC;`
      : `SELECT … FROM ${table} GROUP BY 1 ORDER BY 2 DESC LIMIT 5;`,
  };
};

const COUNT = 60;
const initial = Array.from({ length: COUNT }, (_, i) => makeCase(i));
const finished = initial.map((c, i) => ({ ...c, status: finalStatus(i) }));

/** Text is added at render time, so switching language keeps the run going. */
const translate = (cases: EvalCase[], t: (typeof copy)[DemoLocale]) =>
  cases.map((c, i) => {
    const bad = finalStatus(i) === "fail" || finalStatus(i) === "regressed";
    return { ...c, input: t.asks[i % t.asks.length], reason: bad ? t.bad : t.good };
  });

type State = { cases: EvalCase[]; selected: string | null };

const setStatus = (ids: number[], status?: EvalStatus) => (s: State) => ({
  ...s,
  cases: s.cases.map((c, i) =>
    ids.includes(i) ? { ...c, status: status ?? finalStatus(i) } : c,
  ),
});

// Batches of four start running, then resolve.
const script: MockStep<State>[] = [wait(500)];
for (let i = 0; i < COUNT; i += 4) {
  const batch = [i, i + 1, i + 2, i + 3].filter((n) => n < COUNT);
  script.push({ delay: 90, apply: setStatus(batch, "running") });
  script.push({ delay: 160, apply: setStatus(batch) });
}
script.push(wait(500), { delay: 0, apply: (s) => ({ ...s, selected: "case-23" }) });

const metrics = ([acc, p50, cost, refusals]: string[]) => [
  {
    id: "acc",
    label: acc,
    baseline: 0.849,
    candidate: 0.883,
    better: "higher" as const,
    format: (v: number) => `${(v * 100).toFixed(1)}%`,
  },
  {
    id: "p50",
    label: p50,
    baseline: 1840,
    candidate: 1320,
    better: "lower" as const,
    format: (v: number) => `${(v / 1000).toFixed(2)}s`,
  },
  {
    id: "cost",
    label: cost,
    baseline: 0.0042,
    candidate: 0.0051,
    better: "lower" as const,
    format: (v: number) => `$${v.toFixed(4)}`,
  },
  {
    id: "refusals",
    label: refusals,
    baseline: 3,
    candidate: 1,
    better: "lower" as const,
  },
];

export default function EvalResultsDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const t = copy[locale];
  const compare = variant === "Compare";
  const { state, setState } = useMockRun<State>(
    // Thumbnails and the compare view start from a finished run.
    { cases: compare || !autoplay ? finished : initial, selected: null },
    compare || !autoplay ? [] : script,
    { autoplay },
  );

  return (
    <EvalResults
      data={{
        suite: "sql-generation",
        label: t.runLabel,
        cases: translate(state.cases, t),
        baselinePassRate: 0.849,
        metrics: metrics(t.metrics),
      }}
      view={compare ? "compare" : "grid"}
      selectedId={state.selected}
      onSelectCase={(c) => setState((s) => ({ ...s, selected: c.id }))}
      locale={t.locale}
      labels={t.labels}
    />
  );
}
