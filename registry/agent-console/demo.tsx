"use client";

import { useEffect, useRef } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import type { BackgroundAgent } from "@/components/ui/background-agents";
import type { EvalCase, EvalMetric } from "@/components/ui/eval-results";
import type { RateLimit } from "@/components/ui/rate-limits";
import type { TraceSpan } from "@/components/ui/run-trace";
import type { Stat } from "@/components/ui/stat-grid";
import { toast } from "@/components/ui/toast-stack";
import type { ToolApprovalRequest } from "@/components/ui/tool-approval-queue";
import type { UsageDay } from "@/components/ui/usage-summary";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  AgentConsole,
  type AgentConsoleData,
  type AgentConsoleLabels,
} from "./agent-console";

/** Keeps a Latin name or a number run in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

type Copy = {
  /** Intl locale for the widgets. */
  locale?: string;
  title: string;
  stats: Record<"runs" | "success" | "p95" | "spend", string>;
  goals: Record<"quota" | "slo" | "target" | "cap", string>;
  tasks: Record<"invoices" | "tickets" | "docs" | "duplicates", string>;
  actions: Record<
    "timedOut" | "written" | "rendering" | "classifying" | "glossary" | "worker",
    string
  >;
  compare: string;
  metrics: Record<"acc" | "lat" | "cost", string>;
  month: string;
  limits: Record<"req" | "in" | "out", string>;
  tier: string;
  queued: [string, string];
  segments: Record<"history" | "files" | "tools" | "system", string>;
  toolCount: string;
  incident: { title: string; description: string };
  rollback: string;
  toasts: Record<
    "finished" | "finishedDetail" | "started" | "dismissed" | "acknowledged",
    string
  >;
  labels?: Partial<AgentConsoleLabels>;
};

// Agent names, span names, model names and code stay as they are in every language.
const copy: Record<DemoLocale, Copy> = {
  en: {
    title: "Agents",
    stats: {
      runs: "Runs today",
      success: "Success rate",
      p95: "p95 latency",
      spend: "Spend today",
    },
    goals: {
      quota: "of 1,500 daily quota",
      slo: "SLO 99%",
      target: "Target 8s",
      cap: "of $300 daily cap",
    },
    tasks: {
      invoices: "Backfill March invoice PDFs",
      tickets: "Label new support tickets",
      docs: "Translate API reference to Japanese",
      duplicates: "Merge duplicate tickets",
    },
    actions: {
      timedOut: "pdf.render timed out after 3 retries",
      written: "1,204 PDFs written",
      rendering: "Rendering batch 7 of 12",
      classifying: "Classifying ticket #48213",
      glossary: "Needs a glossary decision",
      worker: "Waits for a free worker",
    },
    compare: "v42 vs v41",
    metrics: { acc: "Accuracy", lat: "Latency p50", cost: "Cost per run" },
    month: "November",
    limits: { req: "Requests", in: "Input tokens", out: "Output tokens" },
    tier: "opus-5.5 · Tier 3",
    queued: ["summarize batch 7", "triage #48214"],
    segments: {
      history: "Run history",
      files: "Invoices batch",
      tools: "Tools",
      system: "Instructions",
    },
    toolCount: "9 tools",
    incident: {
      title: "invoice-agent v42 is failing renders",
      description:
        "pdf.render times out on 52% of runs since 14:05 and output tokens are throttled.",
    },
    rollback: "Roll invoice-agent back to v41",
    toasts: {
      finished: "invoice-backfill finished",
      finishedDetail: "1,204 PDFs written in 8m 32s",
      started: "Rollback started",
      dismissed: "Rollback dismissed",
      acknowledged: "Incident acknowledged",
    },
  },
  he: {
    locale: "he-IL",
    title: "סוכנים",
    stats: {
      runs: "הרצות היום",
      success: "שיעור הצלחה",
      p95: "השהיה p95",
      spend: "הוצאה היום",
    },
    goals: {
      quota: `מתוך מכסה יומית של ${ltr("1,500")}`,
      slo: ltr("SLO 99%"),
      target: `יעד ${ltr("8s")}`,
      cap: `מתוך תקרה יומית של ${ltr("$300")}`,
    },
    tasks: {
      invoices: "השלמת קובצי PDF של חשבוניות מרץ",
      tickets: "תיוג פניות תמיכה חדשות",
      docs: "תרגום תיעוד ה־API ליפנית",
      duplicates: "מיזוג פניות כפולות",
    },
    actions: {
      timedOut: `${ltr("pdf.render")} חרג מהזמן אחרי 3 ניסיונות`,
      written: `נכתבו ${ltr("1,204")} קובצי PDF`,
      rendering: "מרנדר אצווה 7 מתוך 12",
      classifying: `מסווג את פנייה ${ltr("#48213")}`,
      glossary: "ממתין להחלטה על מילון המונחים",
      worker: "ממתין לעובד פנוי",
    },
    compare: `${ltr("v42")} מול ${ltr("v41")}`,
    metrics: { acc: "דיוק", lat: "השהיה p50", cost: "עלות להרצה" },
    month: "נובמבר",
    limits: { req: "בקשות", in: "טוקני קלט", out: "טוקני פלט" },
    tier: `${ltr("opus-5.5")} · רמה 3`,
    queued: ["סיכום אצווה 7", `מיון ${ltr("#48214")}`],
    segments: {
      history: "היסטוריית ההרצה",
      files: "אצוות חשבוניות",
      tools: "כלים",
      system: "הנחיות",
    },
    toolCount: "9 כלים",
    incident: {
      title: `${ltr("invoice-agent v42")} נכשל ברינדור`,
      description: `${ltr("pdf.render")} חורג מהזמן ב־52% מההרצות מאז 14:05, וטוקני הפלט מוגבלים.`,
    },
    rollback: `החזרת ${ltr("invoice-agent")} לגרסה ${ltr("v41")}`,
    toasts: {
      finished: `${ltr("invoice-backfill")} הסתיים`,
      finishedDetail: `נכתבו ${ltr("1,204")} קובצי PDF תוך 8 דק׳ 32 שנ׳`,
      started: "ההחזרה לגרסה הקודמת התחילה",
      dismissed: "ההחזרה נדחתה",
      acknowledged: "התקלה סומנה כמטופלת",
    },
    labels: {
      sections: {
        agents: "סוכנים",
        runs: "הרצות",
        evals: "הערכות",
        usage: "שימוש",
        settings: "הגדרות",
      },
      console: "קונסולה",
      team: "צוות",
      navigation: "ניווט",
      expandSidebar: "הרחבת סרגל הצד",
      collapseSidebar: "כיווץ סרגל הצד",
      openNavigation: "פתיחת הניווט",
      closeNavigation: "סגירת הניווט",
      close: "סגירה",
      incident: "תקלה",
      acknowledge: "לקחתי",
      trace: (run) => `מעקב עבור ${ltr(run)}`,
      avatar: {
        status: { online: "מחובר", away: "לא ליד המחשב", busy: "עסוק", working: "עובד" },
        participants: (count) => `${count} משתתפים`,
        more: (count, names) => `ועוד ${count}: ${names}`,
      },
      approvals: {
        title: "בקשות הרשאה",
        waiting: (n) => <>{n} ממתינות לך</>,
        allClear: "הכול טופל",
        selected: (n) => <>{n} נבחרו</>,
        clear: "ניקוי",
        deny: "דחייה",
        approve: "אישור",
        approveFor: (scope) =>
          ({ once: "אישור חד־פעמי", session: "אישור לסשן", always: "אישור תמיד" })[scope],
        grantFor: "תוקף ההרשאה",
        scopes: { once: "פעם אחת", session: "הסשן הזה", always: "תמיד" },
        risk: { high: "סיכון גבוה", medium: "סיכון בינוני", low: "סיכון נמוך" },
        riskShort: { high: "גבוה", medium: "בינוני", low: "נמוך" },
        requests: "בקשות",
        emptyTitle: "אין מה לבדוק",
        emptyDescription: "בקשות חדשות יופיעו כאן.",
        select: (title) => `בחירת ${title}`,
        resolved: (n) => `טופלו · ${n}`,
        outcome: (decision, scope) =>
          decision === "approved"
            ? { once: "אושר פעם אחת", session: "אושר לסשן", always: "אושר תמיד" }[scope]
            : "נדחה",
        undo: "ביטול",
        decided: (title, count, decision, scope) => {
          const subject = count === 1 ? title : `${count} בקשות`;
          if (decision === "denied") return `${subject}: נדחה`;
          return `${subject}: ${{ once: "אושר פעם אחת", session: "אושר לסשן", always: "אושר תמיד" }[scope]}`;
        },
        backInQueue: (title) => `${title} חזר לתור`,
      },
      stats: {
        flat: "ללא שינוי",
        better: ", שיפור",
        worse: ", הרעה",
        goalProgress: (percent, goal) => `${percent}% מתוך ${goal}`,
      },
      agents: {
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
      runTrace: {
        region: "מעקב הרצה",
        kinds: { llm: "מודל", tool: "כלי", agent: "סוכן", retrieval: "אחזור" },
        zoomPath: "נתיב זום",
        wholeRun: "כל ההרצה",
        running: "רץ",
        failed: "נכשל",
        block: (name, kind, duration, failed) =>
          `${ltr(name)}, ${kind}, ${ltr(duration)}${failed ? ", נכשל" : ""}. הגדלה`,
        tokensShort: (tokens) => `${ltr(tokens)} טוקנים`,
        tokens: (tokens) => `${ltr(tokens)} טוקנים`,
        hint: "לחיצה על בלוק מגדילה אותו, Esc חוזר אחורה",
        excluded: "בלי ספאנים של סוכנים — הם עוטפים את הצאצאים שלהם",
        metric: "מדד",
        metrics: { time: "זמן", tokens: "טוקנים", cost: "עלות" },
        errors: (count) => `${count} נכשלו`,
        share: (name, metric) => `החלק של ${ltr(name)} ב${metric}`,
        waiting: "ממתין לספאנים…",
        recording: "מקליט",
        finishedIn: "הסתיים תוך",
        spans: (count) => <>{count} ספאנים</>,
        finished: (time) => `ההרצה הסתיימה תוך ${ltr(time)}`,
      },
      evals: {
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
        filters: {
          all: "הכול",
          failed: "נכשלו",
          regressed: "נסיגות",
          improved: "שיפורים",
        },
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
      usage: {
        title: "שימוש",
        subtitle: (days, tokens) => (
          <>
            {days} הימים האחרונים · {tokens} טוקנים
          </>
        ),
        up: "עלייה",
        down: "ירידה",
        vsPrevious: (percent) => <>{percent} לעומת התקופה הקודמת</>,
        chart: "עלות יומית לפי מודל. מעבר בין ימים עם מקשי החצים.",
        tokens: (tokens) => `${tokens} טוקנים`,
        overBudget: "חריגה מהתקציב",
        closeToBudget: "קרוב לתקציב",
        budget: "תקציב חודשי",
        budgetUsed: "ניצול התקציב",
        budgetValue: (spent, limit, percent) => `${spent} מתוך ${limit} (${percent})`,
        budgetWarning: (percent) => `נוצלו ${percent} מהתקציב`,
      },
      limits: {
        title: "מגבלות קצב",
        healthy: "תקין",
        throttled: "מוגבל",
        perMinute: "לדקה",
        left: (remaining, limit) => (
          <>
            נשארו {remaining} מתוך {limit}
          </>
        ),
        meter: (label) => `${label} שנותרו לדקה`,
        meterValue: (remaining, limit, resets) =>
          `נשארו ${remaining} מתוך ${limit}, מתאפס בעוד ${resets}`,
        full: "מלא",
        resetsIn: (time) => <>מתאפס בעוד {time}</>,
        seconds: (n) => `${n} ש׳`,
        countdown: (n) => <>{n} ש׳</>,
        outOf: (label) => `נגמרו ${label}`,
        rateLimited: "הקצב הוגבל",
        capacityBack: "יש שוב קיבולת — הקריאות שבתור יכולות לרוץ",
        retryAfter: (time) => <>ניסיון חוזר בעוד {time}</>,
        retryAfterText: (time) => `ניסיון חוזר בעוד ${time}`,
        retryNow: "לנסות עכשיו",
        timeUntilRetry: "זמן עד לניסיון חוזר",
        waiting: (count) =>
          count === 1 ? "קריאה אחת ממתינה" : `${count} קריאות ממתינות`,
        tokens: (tokens) => `${ltr(tokens)} טוקנים`,
        cleared: "מגבלת הקצב הוסרה",
        limited: (time) => `הקצב הוגבל, ניסיון חוזר בעוד ${time}`,
      },
      context: {
        region: "חלון הקשר",
        meter: "ניצול חלון ההקשר",
        valueText: (used, limit, percent) => `${used} מתוך ${limit} טוקנים (${percent})`,
        compact: "דחיסה",
        compacting: "דוחס…",
        compactAria: "דחיסת ההקשר",
        compactingAria: "דוחס את ההקשר",
        approaching: "מתקרבים למגבלת ההקשר",
        nearLimit: "קרוב למגבלה",
        context: "הקשר",
        ofLimit: (limit, percent) => (
          <>
            מתוך {limit} · {percent} בשימוש
          </>
        ),
        warningZone: (left) => `באזור האזהרה — נשארו ${ltr(left)} טוקנים`,
        tinted: (percent) => `התאים הצבועים מסמנים את ה־${percent} האחרונים`,
        pinned: "מוצמד",
      },
      toasts: { region: "התראות", fallback: "התראה", dismiss: "סגירה" },
    },
  },
  ar: {
    locale: "ar",
    title: "الوكلاء",
    stats: {
      runs: "عمليات التشغيل اليوم",
      success: "معدل النجاح",
      p95: "زمن الاستجابة p95",
      spend: "الإنفاق اليوم",
    },
    goals: {
      quota: `من حصة يومية قدرها ${ltr("1,500")}`,
      slo: ltr("SLO 99%"),
      target: `الهدف ${ltr("8s")}`,
      cap: `من سقف يومي قدره ${ltr("$300")}`,
    },
    tasks: {
      invoices: "استكمال ملفات PDF لفواتير مارس",
      tickets: "تصنيف تذاكر الدعم الجديدة",
      docs: "ترجمة مرجع API إلى اليابانية",
      duplicates: "دمج التذاكر المكررة",
    },
    actions: {
      timedOut: `انتهت مهلة ${ltr("pdf.render")} بعد 3 محاولات`,
      written: `كُتب ${ltr("1,204")} ملف PDF`,
      rendering: "يعالج الدفعة 7 من 12",
      classifying: `يصنّف التذكرة ${ltr("#48213")}`,
      glossary: "بحاجة إلى قرار بشأن المسرد",
      worker: "بانتظار عامل متاح",
    },
    compare: `${ltr("v42")} مقابل ${ltr("v41")}`,
    metrics: { acc: "الدقة", lat: "زمن الاستجابة p50", cost: "تكلفة التشغيل الواحد" },
    month: "نوفمبر",
    limits: { req: "الطلبات", in: "رموز الإدخال", out: "رموز الإخراج" },
    tier: `${ltr("opus-5.5")} · المستوى 3`,
    queued: ["تلخيص الدفعة 7", `فرز ${ltr("#48214")}`],
    segments: {
      history: "سجل التشغيل",
      files: "دفعة الفواتير",
      tools: "الأدوات",
      system: "التعليمات",
    },
    toolCount: "9 أدوات",
    incident: {
      title: `${ltr("invoice-agent v42")} يفشل في توليد الملفات`,
      description: `تنتهي مهلة ${ltr("pdf.render")} في 52% من عمليات التشغيل منذ 14:05، ورموز الإخراج مقيّدة.`,
    },
    rollback: `إرجاع ${ltr("invoice-agent")} إلى ${ltr("v41")}`,
    toasts: {
      finished: `اكتمل ${ltr("invoice-backfill")}`,
      finishedDetail: `كُتب ${ltr("1,204")} ملف PDF في 8 د 32 ث`,
      started: "بدأ الإرجاع إلى الإصدار السابق",
      dismissed: "رُفض الإرجاع",
      acknowledged: "تم تأكيد استلام العطل",
    },
    labels: {
      sections: {
        agents: "الوكلاء",
        runs: "عمليات التشغيل",
        evals: "التقييمات",
        usage: "الاستخدام",
        settings: "الإعدادات",
      },
      console: "لوحة التحكم",
      team: "الفريق",
      navigation: "التنقل",
      expandSidebar: "توسيع الشريط الجانبي",
      collapseSidebar: "طي الشريط الجانبي",
      openNavigation: "فتح التنقل",
      closeNavigation: "إغلاق التنقل",
      close: "إغلاق",
      incident: "عطل",
      acknowledge: "تأكيد الاستلام",
      trace: (run) => `تتبّع ${ltr(run)}`,
      avatar: {
        status: { online: "متصل", away: "بعيد", busy: "مشغول", working: "يعمل" },
        participants: (count) =>
          count === 1
            ? "مشارك واحد"
            : count === 2
              ? "مشاركان"
              : count <= 10
                ? `${count} مشاركين`
                : `${count} مشاركًا`,
        more: (count, names) =>
          `${count === 1 ? "وشخص آخر" : count === 2 ? "وشخصان آخران" : `و${count} آخرون`}: ${names}`,
        list: (names) => names.join("، "),
      },
      approvals: {
        title: "طلبات الأذونات",
        waiting: (n) => <>{n} بانتظارك</>,
        allClear: "لا شيء معلّق",
        selected: (n) => <>تم تحديد {n}</>,
        clear: "مسح",
        deny: "رفض",
        approve: "موافقة",
        approveFor: (scope) =>
          ({
            once: "موافقة لمرة واحدة",
            session: "موافقة لهذه الجلسة",
            always: "موافقة دائمة",
          })[scope],
        grantFor: "مدة الإذن",
        scopes: { once: "مرة واحدة", session: "هذه الجلسة", always: "دائمًا" },
        risk: { high: "خطورة عالية", medium: "خطورة متوسطة", low: "خطورة منخفضة" },
        riskShort: { high: "عالية", medium: "متوسطة", low: "منخفضة" },
        requests: "الطلبات",
        emptyTitle: "لا شيء للمراجعة",
        emptyDescription: "ستظهر الطلبات الجديدة هنا.",
        select: (title) => `تحديد ${title}`,
        resolved: (n) => `تمت معالجتها · ${n}`,
        outcome: (decision, scope) =>
          decision === "approved"
            ? {
                once: "تمت الموافقة لمرة واحدة",
                session: "تمت الموافقة لهذه الجلسة",
                always: "تمت الموافقة دائمًا",
              }[scope]
            : "مرفوض",
        undo: "تراجع",
        decided: (title, count, decision, scope) => {
          const subject = count === 1 ? title : `${count} طلبات`;
          if (decision === "denied") return `${subject}: مرفوض`;
          return `${subject}: ${{ once: "تمت الموافقة لمرة واحدة", session: "تمت الموافقة لهذه الجلسة", always: "تمت الموافقة دائمًا" }[scope]}`;
        },
        backInQueue: (title) => `أُعيد ${title} إلى قائمة الانتظار`,
      },
      stats: {
        flat: "دون تغيير",
        better: "، تحسّن",
        worse: "، تراجع",
        goalProgress: (percent, goal) => `${percent}% من ${goal}`,
      },
      agents: {
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
      runTrace: {
        region: "تتبّع التشغيل",
        kinds: { llm: "نموذج", tool: "أداة", agent: "وكيل", retrieval: "استرجاع" },
        zoomPath: "مسار التكبير",
        wholeRun: "التشغيل كاملًا",
        running: "قيد التشغيل",
        failed: "فشل",
        block: (name, kind, duration, failed) =>
          `${ltr(name)}، ${kind}، ${ltr(duration)}${failed ? "، فشل" : ""}. تكبير`,
        tokensShort: (tokens) => `${ltr(tokens)} رمز`,
        tokens: (tokens) => `${ltr(tokens)} رمز`,
        hint: "انقر على كتلة لتكبيرها، وEsc للرجوع",
        excluded: "استُبعدت فترات الوكلاء — فهي تغلّف ما بداخلها",
        metric: "المقياس",
        metrics: { time: "الوقت", tokens: "الرموز", cost: "التكلفة" },
        errors: (count) => `فشل ${count}`,
        share: (name, metric) => `حصة ${ltr(name)} من ${metric}`,
        waiting: "في انتظار الفترات…",
        recording: "جارٍ التسجيل",
        finishedIn: "انتهى خلال",
        spans: (count) => <>{count} فترة</>,
        finished: (time) => `انتهى التشغيل خلال ${ltr(time)}`,
      },
      evals: {
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
      usage: {
        title: "الاستخدام",
        subtitle: (days, tokens) => (
          <>
            آخر {days} {days <= 10 ? "أيام" : "يومًا"} · {tokens} رمز
          </>
        ),
        up: "ارتفاع",
        down: "انخفاض",
        vsPrevious: (percent) => <>{percent} مقارنة بالفترة السابقة</>,
        chart: "التكلفة اليومية حسب النموذج. استخدم مفاتيح الأسهم للتنقل بين الأيام.",
        tokens: (tokens) => `${tokens} رمز`,
        overBudget: "تجاوز الميزانية",
        closeToBudget: "قريب من الميزانية",
        budget: "الميزانية الشهرية",
        budgetUsed: "المستخدم من الميزانية",
        budgetValue: (spent, limit, percent) => `${spent} من ${limit} (${percent})`,
        budgetWarning: (percent) => `استُخدم ${percent} من الميزانية`,
      },
      limits: {
        title: "حدود المعدّل",
        healthy: "سليم",
        throttled: "مقيّد",
        perMinute: "في الدقيقة",
        left: (remaining, limit) => (
          <>
            يتبقى {remaining} من {limit}
          </>
        ),
        meter: (label) => `${label} المتبقية في الدقيقة`,
        meterValue: (remaining, limit, resets) =>
          `يتبقى ${remaining} من ${limit}، يُعاد الضبط خلال ${resets}`,
        full: "ممتلئ",
        resetsIn: (time) => <>يُعاد الضبط خلال {time}</>,
        seconds: (n) => `${n} ث`,
        countdown: (n) => <>{n} ث</>,
        outOf: (label) => `نفدت ${label}`,
        rateLimited: "تم تقييد المعدّل",
        capacityBack: "عادت السعة — يمكن تشغيل الاستدعاءات المنتظرة",
        retryAfter: (time) => <>إعادة المحاولة خلال {time}</>,
        retryAfterText: (time) => `إعادة المحاولة خلال ${time}`,
        retryNow: "أعد المحاولة الآن",
        timeUntilRetry: "الوقت حتى إعادة المحاولة",
        waiting: (count) =>
          count === 1
            ? "استدعاء واحد في الانتظار"
            : count === 2
              ? "استدعاءان في الانتظار"
              : count <= 10
                ? `${count} استدعاءات في الانتظار`
                : `${count} استدعاءً في الانتظار`,
        tokens: (tokens) => `${ltr(tokens)} رمز`,
        cleared: "رُفع تقييد المعدّل",
        limited: (time) => `تم تقييد المعدّل، إعادة المحاولة خلال ${time}`,
      },
      context: {
        region: "نافذة السياق",
        meter: "استخدام نافذة السياق",
        valueText: (used, limit, percent) => `${used} من ${limit} رمز (${percent})`,
        compact: "ضغط",
        compacting: "جارٍ الضغط…",
        compactAria: "ضغط السياق",
        compactingAria: "جارٍ ضغط السياق",
        approaching: "السياق يقترب من الحد",
        nearLimit: "قريب من الحد",
        context: "السياق",
        ofLimit: (limit, percent) => (
          <>
            من {limit} · ممتلئ بنسبة {percent}
          </>
        ),
        warningZone: (left) => `في منطقة التحذير — يتبقى ${ltr(left)} رمز`,
        tinted: (percent) => `الخلايا الملوّنة تمثّل آخر ${percent}`,
        pinned: "مثبّت",
      },
      toasts: { region: "الإشعارات", fallback: "إشعار", dismiss: "إغلاق" },
    },
  },
};

const team: AgentConsoleData["team"] = [
  { id: "invoice", name: "invoice-agent", status: "working" },
  { id: "triage", name: "triage-agent", status: "online" },
  { id: "docs", name: "docs-agent", status: "away" },
];

const stats = (t: Copy, runs: number, failing: boolean): Stat[] => [
  {
    id: "runs",
    label: t.stats.runs,
    value: runs.toLocaleString("en-US"),
    delta: 12,
    trend: [32, 41, 38, 52, 47, 58, 61],
    goal: { ratio: runs / 1500, label: t.goals.quota },
  },
  {
    id: "success",
    label: t.stats.success,
    value: failing ? "91.4%" : "98.2%",
    delta: failing ? -6.8 : 0.4,
    trend: failing ? [98, 98, 97, 98, 96, 93, 91] : [97, 98, 97, 98, 98, 98, 98],
    goal: { ratio: (failing ? 91.4 : 98.2) / 99, label: t.goals.slo },
  },
  {
    id: "p95",
    label: t.stats.p95,
    value: failing ? "14.8s" : "6.2s",
    delta: failing ? 139 : -8,
    higherIsBetter: false,
    trend: [7, 6.8, 6.5, 6.6, 6.3, failing ? 11 : 6.2, failing ? 14.8 : 6.2],
    // Under target reads as a full bar; over it shrinks.
    goal: { ratio: Math.min(8 / (failing ? 14.8 : 6.2), 1), label: t.goals.target },
  },
  {
    id: "spend",
    label: t.stats.spend,
    value: "$184.20",
    delta: 5,
    goal: { ratio: 0.61, label: t.goals.cap },
  },
];

const agents = (t: Copy, progress: number, failing: boolean): BackgroundAgent[] => [
  {
    id: "a1",
    name: "invoice-agent",
    task: t.tasks.invoices,
    status: failing ? "failed" : progress >= 1 ? "done" : "running",
    progress: failing ? 0.48 : Math.min(progress, 1),
    action: failing
      ? t.actions.timedOut
      : progress >= 1
        ? t.actions.written
        : t.actions.rendering,
    elapsedMs: 412_000 + progress * 90_000,
  },
  {
    id: "a2",
    name: "triage-agent",
    task: t.tasks.tickets,
    status: "running",
    progress: 0.72,
    action: t.actions.classifying,
    elapsedMs: 1_820_000,
  },
  {
    id: "a3",
    name: "docs-agent",
    task: t.tasks.docs,
    status: "waiting",
    progress: 0.4,
    action: t.actions.glossary,
    elapsedMs: 960_000,
  },
  {
    id: "a4",
    name: "triage-agent",
    task: t.tasks.duplicates,
    status: "queued",
    progress: 0,
    action: t.actions.worker,
    elapsedMs: 0,
  },
];

const spans = (elapsed: number, failing: boolean): TraceSpan[] => {
  const all: TraceSpan[] = [
    { id: "root", name: "invoice-backfill", kind: "agent", startMs: 0, endMs: 7400 },
    {
      id: "plan",
      parentId: "root",
      name: "plan",
      kind: "llm",
      startMs: 120,
      endMs: 1050,
      model: "opus-5.5",
      tokens: { input: 1840, output: 260 },
      costUsd: 0.014,
    },
    {
      id: "list",
      parentId: "root",
      name: "billing.list",
      kind: "tool",
      startMs: 1100,
      endMs: 1900,
    },
    {
      id: "vat",
      parentId: "root",
      name: "vat.lookup",
      kind: "retrieval",
      startMs: 1950,
      endMs: 2600,
    },
    {
      id: "render",
      parentId: "root",
      name: "pdf.render",
      kind: "tool",
      startMs: 2650,
      endMs: failing ? 6100 : 5200,
      status: failing ? "error" : "ok",
    },
    {
      id: "write",
      parentId: "root",
      name: "storage.put",
      kind: "tool",
      startMs: failing ? 6150 : 5250,
      endMs: failing ? 6600 : 5900,
      status: failing ? "error" : "ok",
    },
    {
      id: "sum",
      parentId: "root",
      name: "summarize",
      kind: "llm",
      startMs: 6000,
      endMs: 7300,
      model: "sonnet-5.5",
      tokens: { input: 3200, output: 410 },
      costUsd: 0.006,
    },
  ];
  return all
    .filter((s) => s.startMs <= elapsed && !(failing && s.id === "sum"))
    .map((s) => (s.endMs && s.endMs > elapsed ? { ...s, endMs: undefined } : s));
};

const finalCase = (i: number): EvalCase["status"] =>
  [5, 19].includes(i)
    ? "regressed"
    : [11].includes(i)
      ? "fail"
      : [8, 27].includes(i)
        ? "improved"
        : "pass";

const cases = (done: number): EvalCase[] =>
  Array.from({ length: 32 }, (_, i) => ({
    id: `c${i}`,
    name: `invoice/case-${String(i + 1).padStart(2, "0")}`,
    status: i < done ? finalCase(i) : i < done + 4 ? "running" : "pending",
    score: finalCase(i) === "pass" || finalCase(i) === "improved" ? 0.94 : 0.31,
  }));

const metrics = (t: Copy): EvalMetric[] => [
  {
    id: "acc",
    label: t.metrics.acc,
    baseline: 0.89,
    candidate: 0.93,
    better: "higher",
    format: (v) => `${Math.round(v * 100)}%`,
  },
  {
    id: "lat",
    label: t.metrics.lat,
    baseline: 4.1,
    candidate: 3.6,
    better: "lower",
    format: (v) => `${v.toFixed(1)}s`,
  },
  {
    id: "cost",
    label: t.metrics.cost,
    baseline: 0.031,
    candidate: 0.024,
    better: "lower",
    format: (v) => `$${v.toFixed(3)}`,
  },
];

const dates = ["10-28", "10-29", "10-30", "10-31", "11-01", "11-02", "11-03"];
const days: UsageDay[] = [42, 51, 47, 63, 58, 71, 66].map((k, i) => ({
  date: `2026-${dates[i]}`,
  byModel: {
    opus: { tokens: k * 90_000, cost: k * 1.4 },
    sonnet: { tokens: k * 160_000, cost: k * 0.9 },
  },
}));

const limits = (t: Copy, throttled: boolean): RateLimit[] => [
  {
    id: "req",
    label: t.limits.req,
    limit: 4000,
    remaining: throttled ? 1210 : 3120,
    resetsInMs: 14_000,
  },
  {
    id: "in",
    label: t.limits.in,
    limit: 2_000_000,
    remaining: throttled ? 240_000 : 1_310_000,
    resetsInMs: 14_000,
  },
  {
    id: "out",
    label: t.limits.out,
    limit: 400_000,
    remaining: throttled ? 0 : 228_000,
    resetsInMs: 14_000,
  },
];

const rollback = (t: Copy): ToolApprovalRequest => ({
  id: "rollback",
  tool: "deploy.rollback",
  title: t.rollback,
  risk: "high",
  agent: "ops-agent",
  status: "pending",
  payload: {
    kind: "shell",
    command: "agentctl rollback invoice-agent --to v41 --drain 60s",
    cwd: "prod",
  },
});

type State = {
  runs: number;
  progress: number;
  elapsed: number;
  evalDone: number;
  incident: boolean;
};

const build = (t: Copy, s: State, failing: boolean): AgentConsoleData => ({
  title: t.title,
  environment: "prod",
  team,
  stats: stats(t, s.runs, failing),
  agents: agents(t, s.progress, failing),
  run: {
    name: "invoice-backfill",
    spans: spans(s.elapsed, failing),
    elapsedMs: s.elapsed,
    failed: failing,
  },
  evals: {
    suite: "invoice-agent v42",
    label: t.compare,
    cases: cases(s.evalDone),
    baselinePassRate: 0.89,
    metrics: metrics(t),
  },
  usage: {
    days,
    models: [
      { id: "opus", name: "opus-5.5" },
      { id: "sonnet", name: "sonnet-5.5" },
    ],
    previousCost: 690,
    budget: { limit: 1200, label: t.month },
  },
  limits: {
    model: t.tier,
    limits: limits(t, failing),
    queued: failing
      ? [
          { id: "q1", label: t.queued[0], tokens: 41_000 },
          { id: "q2", label: t.queued[1], tokens: 6_000 },
        ]
      : [],
    retryAfterMs: failing ? 18_000 : undefined,
  },
  context: {
    limit: 200_000,
    model: "opus-5.5",
    segments: [
      { id: "history", label: t.segments.history, tokens: 61_000 },
      { id: "files", label: t.segments.files, tokens: 38_000 },
      {
        id: "tools",
        label: t.segments.tools,
        detail: t.toolCount,
        tokens: 12_400,
        pinned: true,
      },
      { id: "system", label: t.segments.system, tokens: 3_100, pinned: true },
    ],
  },
  incident:
    failing && s.incident
      ? {
          title: t.incident.title,
          description: t.incident.description,
          approvals: [rollback(t)],
        }
      : undefined,
});

export default function AgentConsoleDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const t = copy[locale];
  const failing = variant === "Incident";
  const script: MockStep<State>[] = [
    wait(600),
    ...Array.from({ length: 10 }, (_, i): MockStep<State> => ({
      delay: 450,
      apply: (s) => ({
        ...s,
        runs: s.runs + 3,
        elapsed: Math.min(7400, s.elapsed + 800),
        progress: s.progress + 0.05,
        evalDone: Math.min(32, s.evalDone + 3 + (i % 2)),
      }),
    })),
    { delay: 400, apply: (s) => ({ ...s, progress: 1, elapsed: 7400, evalDone: 32 }) },
  ];
  const { state } = useMockRun<State>(
    {
      runs: 1_284,
      progress: 0.62,
      elapsed: failing ? 7400 : 2000,
      evalDone: failing ? 32 : 4,
      incident: true,
    },
    failing ? [] : script,
    { autoplay },
  );

  // A toast when the run finishes — only while the demo is playing.
  const told = useRef(false);
  useEffect(() => {
    if (!autoplay || failing || state.progress < 1 || told.current) return;
    told.current = true;
    toast.success(t.toasts.finished, { description: t.toasts.finishedDetail });
  }, [autoplay, failing, state.progress, t]);

  return (
    <AgentConsole
      data={build(t, state, failing)}
      onDecide={(_, decision) =>
        toast(decision === "approved" ? t.toasts.started : t.toasts.dismissed)
      }
      onAcknowledge={() => toast(t.toasts.acknowledged)}
      locale={t.locale}
      labels={t.labels}
    />
  );
}
