"use client";

import { DownloadSimple } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import { Button } from "@/components/ui/action-button";
import { ChartCard, type ChartCardLabels } from "@/components/ui/chart-card";
import {
  DataTable,
  type DataColumn,
  type DataRow,
  type DataTableLabels,
  type DataTableProps,
} from "@/components/ui/data-table";
import {
  SourceList,
  type Source,
  type SourceListLabels,
} from "@/components/ui/source-list";
import { StatGrid, type Stat, type StatGridLabels } from "@/components/ui/stat-grid";
import {
  StreamingMessage,
  type StreamingMessageLabels,
} from "@/components/ui/streaming-message";
import {
  ToolCallBlock,
  type ToolCall,
  type ToolCallBlockLabels,
} from "@/components/ui/tool-call-block";
import { EASE_OUT } from "@/lib/motion-tokens";
import {
  streamText,
  useMockRun,
  wait,
  type MockStep,
} from "@/registry/use-mock-run/use-mock-run";
import { DataAnswer, type DataAnswerData, type DataAnswerLabels } from "./data-answer";

/** Keeps Latin fragments next to numbers and punctuation in order inside RTL text. */
const ltr = (text: string) => `\u2066${text}\u2069`;

const arabicPlural = (n: number, one: string, two: string, few: string, many: string) =>
  n === 1 ? one : n === 2 ? two : n % 100 >= 3 && n % 100 <= 10 ? few : many;

type Copy = {
  /** Intl locale for dates, message times and deltas. */
  intl: string;
  /** Isolates Latin data (week codes, names) inside right-to-left text. */
  latin: (text: string) => string;
  title: string;
  sources: [string, string, string];
  details: [string, string, string];
  saved: [string, string, string];
  firstQuestion: string;
  drillQuestion: string;
  followUps: [string, string];
  stats: [string, string, string, string];
  /** Value of the second stat; Latin only, it rolls left to right. */
  ttv: string;
  statsTitle: string;
  statsSubtitle: string;
  cohortColumns: [string, string, string, string, string, string];
  accountColumns: [string, string, string, string];
  days: (v: unknown) => string;
  cohortsTitle: string;
  cohortsSubtitle: string;
  accountsTitle: string;
  accountsCount: (n: number) => string;
  exportLabel: string;
  citations: [{ title: string; snippet: string }, { title: string; snippet: string }];
  overviewText: string;
  drillText: string;
  areaTitle: string;
  areaSubtitle: string;
  areaSeries: [string, string];
  donutTitle: string;
  donutSubtitle: string;
  donutLabel: string;
  labels?: Partial<DataAnswerLabels>;
  toolCall?: Partial<ToolCallBlockLabels>;
  streaming?: Partial<StreamingMessageLabels>;
  sourceList?: Partial<SourceListLabels>;
  statGrid?: Partial<StatGridLabels>;
  chart?: Partial<ChartCardLabels>;
  table?: Partial<DataTableLabels>;
};

const copy: Record<DemoLocale, Copy> = {
  en: {
    intl: "en-US",
    latin: (text) => text,
    title: "Onboarding activation",
    sources: ["Product warehouse", "CRM accounts", "Billing"],
    details: ["events · 48M rows", "accounts · 12.4k rows", "subscriptions · 9.8k rows"],
    saved: [
      "Weekly active workspaces",
      "Churn by plan, last 90 days",
      "Where do trials drop off?",
    ],
    firstQuestion: "How did activation change after the new onboarding?",
    drillQuestion: "Break activation down by plan",
    followUps: ["Which step loses the most people?", "Compare with last quarter"],
    stats: [
      "Activated in 7 days",
      "Time to first value",
      "Invited a teammate",
      "Signups",
    ],
    ttv: "2.4 days",
    statsTitle: "Since onboarding v2",
    statsSubtitle: "Weeks 41–45 vs 36–40",
    cohortColumns: ["Cohort", "Signups", "Activated", "Rate", "Invited", "Δ pts"],
    accountColumns: ["Account", "Seats", "Days to activate", "Owner"],
    days: (v) => `${v}d`,
    cohortsTitle: "Weekly cohorts",
    cohortsSubtitle: "Last 6 signup weeks",
    accountsTitle: "Team accounts activated in week 45",
    accountsCount: (n) => `${n} accounts`,
    exportLabel: "Export",
    citations: [
      {
        title: "events.onboarding_step — warehouse",
        snippet: "Step completions per account, refreshed hourly.",
      },
      {
        title: "Onboarding v2 launch note",
        snippet: "New checklist shipped to all new workspaces in week 41.",
      },
    ],
    overviewText:
      "Activation in the first 7 days rose from 35.2% to 41.8% since the new onboarding shipped in week 41 [2], and teams reach their first report almost a day sooner [1]. Invites moved less — about 3 points — so the checklist helps people start, not yet bring their team.",
    drillText:
      "Team accounts drive most of the lift: they activate 1.6× faster than Free and make up 41% of activated workspaces. Below are the Team accounts that activated last week — select a few to export.",
    areaTitle: "7-day activation by signup week",
    areaSubtitle: "Onboarding v2 from week 41",
    areaSeries: ["Activated", "Invited a teammate"],
    donutTitle: "Activated workspaces by plan",
    donutSubtitle: "Week 45",
    donutLabel: "Activated",
  },
  he: {
    intl: "he-IL",
    latin: ltr,
    title: "הפעלת משתמשים חדשים",
    sources: ["מחסן נתוני המוצר", `חשבונות ${ltr("CRM")}`, "חיובים"],
    details: [
      `events · ${ltr("48M")} שורות`,
      `accounts · ${ltr("12.4k")} שורות`,
      `subscriptions · ${ltr("9.8k")} שורות`,
    ],
    saved: [
      "סביבות עבודה פעילות בשבוע",
      "נטישה לפי חבילה, 90 הימים האחרונים",
      "איפה נושרים בתקופת הניסיון?",
    ],
    firstQuestion: "איך השתנתה ההפעלה אחרי תהליך ההצטרפות החדש?",
    drillQuestion: "פירוט ההפעלה לפי חבילה",
    followUps: ["באיזה שלב נושרים הכי הרבה?", "השוואה לרבעון הקודם"],
    stats: ["הופעלו תוך 7 ימים", "ימים עד ערך ראשון", "הזמינו חבר צוות", "הרשמות"],
    ttv: "2.4",
    statsTitle: "מאז תהליך ההצטרפות החדש",
    statsSubtitle: `שבועות ${ltr("41–45")} לעומת ${ltr("36–40")}`,
    cohortColumns: ["קוהורט", "הרשמות", "הופעלו", "שיעור", "הזמינו", "Δ נק׳"],
    accountColumns: ["חשבון", "מושבים", "ימים להפעלה", "אחראי"],
    days: (v) => String(v),
    cohortsTitle: "קוהורטים שבועיים",
    cohortsSubtitle: "6 שבועות ההרשמה האחרונים",
    accountsTitle: `חשבונות ${ltr("Team")} שהופעלו בשבוע 45`,
    accountsCount: (n) => `${n} חשבונות`,
    exportLabel: "ייצוא",
    citations: [
      {
        title: `${ltr("events.onboarding_step")} — מחסן הנתונים`,
        snippet: "השלמת שלבים לפי חשבון, מתעדכן כל שעה.",
      },
      {
        title: "הודעת ההשקה של תהליך ההצטרפות החדש",
        snippet: "רשימת המשימות החדשה הושקה לכל סביבות העבודה החדשות בשבוע 41.",
      },
    ],
    overviewText:
      "שיעור ההפעלה ב־7 הימים הראשונים עלה מ־35.2% ל־41.8% מאז שתהליך ההצטרפות החדש הושק בשבוע 41 [2], וצוותים מגיעים לדוח הראשון כמעט יום מוקדם יותר [1]. ההזמנות זזו פחות, בערך 3 נקודות, כך שרשימת המשימות עוזרת להתחיל אבל עוד לא מביאה את הצוות.",
    drillText: `חשבונות ${ltr("Team")} אחראים לרוב העלייה: הם מופעלים פי 1.6 מהר יותר מ־${ltr("Free")} ומהווים 41% מסביבות העבודה שהופעלו. למטה חשבונות ה־${ltr("Team")} שהופעלו בשבוע שעבר — בחרו כמה לייצוא.`,
    areaTitle: "הפעלה תוך 7 ימים לפי שבוע הרשמה",
    areaSubtitle: "התהליך החדש משבוע 41",
    areaSeries: ["הופעלו", "הזמינו חבר צוות"],
    donutTitle: "סביבות עבודה שהופעלו לפי חבילה",
    donutSubtitle: "שבוע 45",
    donutLabel: "הופעלו",
    labels: {
      sidebar: "נתונים ושאלות שמורות",
      hideSidebar: "הסתרת סרגל הצד",
      showSidebar: "הצגת סרגל הצד",
      drawerHint: "נתונים ושאלות",
      openDrawer: "פתיחת נתונים ושאלות",
      dataSources: "מקורות נתונים",
      savedQuestions: "שאלות שמורות",
      sourceStatus: { synced: "מסונכרן", syncing: "מסתנכרן", stale: "לא עדכני" },
      placeholder: "שאלו על הנתונים…",
      close: "סגירה",
      thread: {
        conversation: "שיחה",
        today: "היום",
        yesterday: "אתמול",
        unread: "לא נקראו",
        jumpToLatest: "מעבר להודעה האחרונה",
        fresh: (count) => `${count} חדשות`,
      },
      composer: {
        followUp: "הוסיפו המשך — הוא ירוץ כשהתשובה תסתיים",
        message: "הודעה",
        commands: "פקודות",
        files: "קבצים",
        tokens: (count) => `${ltr(count)} טוקנים`,
        totalTokens: (count) => `+ ${ltr(count)} טוקנים`,
        queued: (count) => `בתור · ${count}`,
        queuedMessages: "הודעות בתור",
        removeQueued: (text) => `הסרת ההודעה מהתור: ${text}`,
        context: "הקשר",
        remove: (name) => `הסרת ${name}`,
        add: "הוספה",
        addContext: "הוספת הקשר",
        agentWorking: "הסוכן עובד",
        working: "עובד · הודעות חדשות ייכנסו לתור",
        shortcuts: "קבצים · / פקודות",
        stop: "עצירה",
        queue: "לתור",
        send: "שליחה",
        workingStatus: (queued) => `הסוכן עובד${queued ? `, ${queued} בתור` : ""}`,
      },
      suggestions: {
        suggestedPrompts: "הצעות לבקשות",
        suggestedFollowUps: "הצעות להמשך",
        moreSuggestions: "הצעות נוספות",
        loadingSuggestions: "טוען הצעות חדשות",
      },
    },
    toolCall: {
      status: { pending: "בתור", running: "רץ", success: "הסתיים", error: "נכשל" },
      arguments: "ארגומנטים",
      result: "תוצאה",
      failed: "הקריאה לכלי נכשלה.",
      retry: "ניסיון חוזר",
      copy: (section) => `העתקת ${section}`,
      copied: (section) => `הועתק: ${section}`,
    },
    streaming: {
      messageFrom: (model) => `הודעה מ־${model}`,
      responding: "עונה…",
      thinking: "חושב…",
      complete: "התשובה הושלמה",
      failed: "התשובה נכשלה",
    },
    sourceList: {
      sources: "מקורות",
      source: (n, title) => `מקור ${n}: ${title}`,
      count: (sources) => (sources === 1 ? "מקור אחד" : `${sources} מקורות`),
      summary: (sites, claims) =>
        `${sites === 1 ? "אתר אחד" : `${sites} אתרים`} · ${claims === 1 ? "טענה אחת מגובה" : `${claims} טענות מגובות`}`,
      supports: "תומך ב:",
      opensInNewTab: "נפתח בכרטיסייה חדשה",
    },
    statGrid: {
      flat: "ללא שינוי",
      better: ", שיפור",
      worse: ", הרעה",
    },
    chart: {
      series: "סדרות",
      label: "תווית",
      total: "סה״כ",
      instructions: (title) => `${title}. אפשר לעבור בין הערכים עם מקשי החיצים.`,
      summary: (type, series, from, to) =>
        `תרשים ${{ bar: "עמודות", line: "קו", area: "שטח", donut: "טבעת" }[type]} של ${series.join(", ")} מ־${from} עד ${to}`,
    },
    table: {
      rows: (count) => (count === 1 ? "שורה" : "שורות"),
      copyCsv: "העתקה כ־CSV",
      copiedCsv: "הועתק כ־CSV",
      filter: "סינון שורות",
      clearFilter: "ניקוי החיפוש",
      selected: (count) => (count === 1 ? "נבחרה" : "נבחרו"),
      clearSelection: "ניקוי",
      selectAll: "בחירת כל השורות בעמוד",
      selectRow: (name) => `בחירת ${name}`,
      noMatch: "אין שורות תואמות",
      noMatchDescription: (query) => `אין תוצאות עבור „${query}”.`,
      range: (from, to, total) => `${ltr(`${from}–${to}`)} מתוך ${total}`,
      previousPage: "העמוד הקודם",
      nextPage: "העמוד הבא",
      status: (count, sort) =>
        `${count} שורות${sort ? `, ממוינות לפי ${sort.label} בסדר ${sort.dir === "asc" ? "עולה" : "יורד"}` : ""}`,
    },
  },
  ar: {
    intl: "ar",
    latin: ltr,
    title: "تفعيل المستخدمين الجدد",
    sources: ["مستودع بيانات المنتج", `حسابات ${ltr("CRM")}`, "الفوترة"],
    details: [
      `events · ${ltr("48M")} صف`,
      `accounts · ${ltr("12.4k")} صف`,
      `subscriptions · ${ltr("9.8k")} صف`,
    ],
    saved: [
      "مساحات العمل النشطة أسبوعيًا",
      "الإلغاء حسب الباقة، آخر 90 يومًا",
      "أين يتوقف مستخدمو التجربة؟",
    ],
    firstQuestion: "كيف تغيّر التفعيل بعد مسار التسجيل الجديد؟",
    drillQuestion: "قسّم التفعيل حسب الباقة",
    followUps: ["في أي خطوة نخسر أكبر عدد من الناس؟", "قارن بالربع الماضي"],
    stats: ["فُعّلوا خلال 7 أيام", "أيام حتى أول قيمة", "دعوا زميلًا", "التسجيلات"],
    ttv: "2.4",
    statsTitle: "منذ مسار التسجيل الجديد",
    statsSubtitle: `الأسابيع ${ltr("41–45")} مقابل ${ltr("36–40")}`,
    cohortColumns: ["الدفعة", "التسجيلات", "المفعّلة", "المعدل", "الدعوات", "Δ نقاط"],
    accountColumns: ["الحساب", "المقاعد", "أيام التفعيل", "المسؤول"],
    days: (v) => String(v),
    cohortsTitle: "الدفعات الأسبوعية",
    cohortsSubtitle: "آخر 6 أسابيع تسجيل",
    accountsTitle: `حسابات ${ltr("Team")} المفعّلة في الأسبوع 45`,
    accountsCount: (n) => `${n} ${arabicPlural(n, "حساب", "حسابان", "حسابات", "حسابًا")}`,
    exportLabel: "تصدير",
    citations: [
      {
        title: `${ltr("events.onboarding_step")} — مستودع البيانات`,
        snippet: "إكمال الخطوات لكل حساب، يُحدَّث كل ساعة.",
      },
      {
        title: "ملاحظة إطلاق مسار التسجيل الجديد",
        snippet: "أُطلقت قائمة المهام الجديدة لكل مساحات العمل الجديدة في الأسبوع 41.",
      },
    ],
    overviewText:
      "ارتفع التفعيل خلال أول 7 أيام من 35.2% إلى 41.8% منذ إطلاق مسار التسجيل الجديد في الأسبوع 41 [2]، وتصل الفرق إلى أول تقرير لها أسرع بيوم تقريبًا [1]. أما الدعوات فتحركت أقل، بنحو 3 نقاط، أي أن قائمة المهام تساعد الناس على البدء لكنها لا تجلب فرقهم بعد.",
    drillText: `حسابات ${ltr("Team")} وراء معظم الارتفاع: تتفعّل أسرع بـ1.6 مرة من ${ltr("Free")} وتشكّل 41% من مساحات العمل المفعّلة. في الأسفل حسابات ${ltr("Team")} التي تفعّلت الأسبوع الماضي، حدّد بعضها لتصديرها.`,
    areaTitle: "التفعيل خلال 7 أيام حسب أسبوع التسجيل",
    areaSubtitle: "المسار الجديد منذ الأسبوع 41",
    areaSeries: ["المفعّلة", "دعوا زميلًا"],
    donutTitle: "مساحات العمل المفعّلة حسب الباقة",
    donutSubtitle: "الأسبوع 45",
    donutLabel: "المفعّلة",
    labels: {
      sidebar: "البيانات والأسئلة المحفوظة",
      hideSidebar: "إخفاء الشريط الجانبي",
      showSidebar: "إظهار الشريط الجانبي",
      drawerHint: "البيانات والأسئلة",
      openDrawer: "فتح البيانات والأسئلة",
      dataSources: "مصادر البيانات",
      savedQuestions: "الأسئلة المحفوظة",
      sourceStatus: { synced: "متزامن", syncing: "قيد المزامنة", stale: "قديم" },
      placeholder: "اسأل عن بياناتك…",
      close: "إغلاق",
      thread: {
        conversation: "المحادثة",
        today: "اليوم",
        yesterday: "أمس",
        unread: "غير مقروءة",
        jumpToLatest: "الانتقال إلى الأحدث",
        fresh: (count) => `${count} جديدة`,
      },
      composer: {
        followUp: "أضف متابعة، وستُنفَّذ عندما ينتهي الرد",
        message: "الرسالة",
        commands: "الأوامر",
        files: "الملفات",
        tokens: (count) => `${ltr(count)} رمز`,
        totalTokens: (count) => `+ ${ltr(count)} رمز`,
        queued: (count) => `في الانتظار · ${count}`,
        queuedMessages: "الرسائل المنتظرة",
        removeQueued: (text) => `إزالة الرسالة المنتظرة: ${text}`,
        context: "السياق",
        remove: (name) => `إزالة ${name}`,
        add: "إضافة",
        addContext: "إضافة سياق",
        agentWorking: "الوكيل يعمل",
        working: "يعمل · الرسائل الجديدة تنتظر دورها",
        shortcuts: "الملفات · / الأوامر",
        stop: "إيقاف",
        queue: "إلى الانتظار",
        send: "إرسال",
        workingStatus: (queued) =>
          `الوكيل يعمل${queued ? `، ${queued} في الانتظار` : ""}`,
      },
      suggestions: {
        suggestedPrompts: "اقتراحات للطلبات",
        suggestedFollowUps: "اقتراحات للمتابعة",
        moreSuggestions: "مزيد من الاقتراحات",
        loadingSuggestions: "جارٍ تحميل اقتراحات جديدة",
      },
    },
    toolCall: {
      status: {
        pending: "في الانتظار",
        running: "قيد التشغيل",
        success: "تم",
        error: "فشل",
      },
      arguments: "الوسائط",
      result: "النتيجة",
      failed: "فشل استدعاء الأداة.",
      retry: "إعادة المحاولة",
      copy: (section) => `نسخ ${section}`,
      copied: (section) => `تم نسخ ${section}`,
    },
    streaming: {
      messageFrom: (model) => `رسالة من ${model}`,
      responding: "يكتب الرد…",
      thinking: "يفكّر…",
      complete: "اكتمل الرد",
      failed: "تعذّر الرد",
    },
    sourceList: {
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
    statGrid: {
      flat: "دون تغيير",
      better: "، تحسّن",
      worse: "، تراجع",
    },
    chart: {
      series: "السلاسل",
      label: "التسمية",
      total: "الإجمالي",
      instructions: (title) => `${title}. استخدم مفاتيح الأسهم لقراءة القيم.`,
      summary: (type, series, from, to) =>
        `مخطط ${{ bar: "أعمدة", line: "خطي", area: "مساحي", donut: "حلقي" }[type]} لـ${series.join("، ")} من ${from} إلى ${to}`,
    },
    table: {
      rows: (count) => arabicPlural(count, "صف", "صفوف", "صفوف", "صفًا"),
      copyCsv: "نسخ بصيغة CSV",
      copiedCsv: "تم النسخ بصيغة CSV",
      filter: "تصفية الصفوف",
      clearFilter: "مسح البحث",
      selected: (count) => (count === 1 ? "محدد" : "محددة"),
      clearSelection: "مسح",
      selectAll: "تحديد كل صفوف هذه الصفحة",
      selectRow: (name) => `تحديد ${name}`,
      noMatch: "لا توجد صفوف مطابقة",
      noMatchDescription: (query) => `لا شيء يطابق «${query}».`,
      range: (from, to, total) => `${ltr(`${from}–${to}`)} من ${total}`,
      previousPage: "الصفحة السابقة",
      nextPage: "الصفحة التالية",
      status: (count, sort) =>
        `${count} ${arabicPlural(count, "صف", "صفوف", "صفوف", "صفًا")}${sort ? `، مرتبة حسب ${sort.label} ${sort.dir === "asc" ? "تصاعديًا" : "تنازليًا"}` : ""}`,
    },
  },
};

// Fixed timestamps keep the prerendered HTML and the client in agreement.
const at = (minute: number) => new Date(Date.UTC(2026, 10, 3, 14, minute)).toISOString();

const weeks = ["W36", "W37", "W38", "W39", "W40", "W41", "W42", "W43", "W44", "W45"];

/** "Oct 5" in English; the month name follows the locale. */
const day = (t: Copy, month: number, date: number) =>
  new Intl.DateTimeFormat(t.intl, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2026, month, date)));

const statsFor = (t: Copy): Stat[] => [
  {
    id: "act",
    label: t.stats[0],
    value: "41.8%",
    delta: 18.6,
    trend: [33, 34, 35, 34, 35, 38, 40, 41, 42, 41.8],
  },
  {
    id: "ttv",
    label: t.stats[1],
    value: t.ttv,
    delta: -22,
    higherIsBetter: false,
    trend: [3.2, 3.1, 3.2, 3.1, 3, 2.8, 2.6, 2.5, 2.4, 2.4],
  },
  {
    id: "inv",
    label: t.stats[2],
    value: "29.1%",
    delta: 6.1,
    trend: [26, 27, 27, 26, 27, 28, 28, 29, 29, 29.1],
  },
  {
    id: "sign",
    label: t.stats[3],
    value: "3,412",
    delta: 4.2,
    trend: [3100, 3180, 3220, 3150, 3260, 3300, 3350, 3390, 3400, 3412],
  },
];

type Cohort = DataRow & {
  cohort: string;
  signups: number;
  activated: number;
  rate: number;
  invited: number;
  change: number;
};

const cohortDays: [number, number][] = [
  [9, 5],
  [9, 12],
  [9, 19],
  [9, 26],
  [10, 2],
  [10, 9],
];

const cohortsFor = (t: Copy): Cohort[] =>
  weeks.slice(-6).map((w, i) => {
    const signups = [3260, 3300, 3350, 3390, 3400, 3412][i];
    const rate = [35.2, 38.1, 40.3, 41.2, 42.0, 41.8][i];
    return {
      id: w,
      cohort: `${t.latin(w)} · ${day(t, ...cohortDays[i])}`,
      signups,
      activated: Math.round((signups * rate) / 100),
      rate,
      invited: [26.4, 27.8, 28.1, 28.9, 29.4, 29.1][i],
      change: i === 0 ? 0 : +(rate - [35.2, 38.1, 40.3, 41.2, 42.0][i - 1]).toFixed(1),
    };
  });

const pct = (v: unknown) => `${Number(v).toFixed(1)}%`;
const signed = (v: unknown) =>
  Number(v) > 0 ? `+${Number(v).toFixed(1)}` : Number(v).toFixed(1);

const cohortColumnsFor = (t: Copy): DataColumn<Cohort>[] => [
  { key: "cohort", label: t.cohortColumns[0], sortable: true },
  {
    key: "signups",
    label: t.cohortColumns[1],
    align: "right",
    sortable: true,
    format: (v) => Number(v).toLocaleString("en-US"),
  },
  {
    key: "activated",
    label: t.cohortColumns[2],
    align: "right",
    sortable: true,
    format: (v) => Number(v).toLocaleString("en-US"),
  },
  { key: "rate", label: t.cohortColumns[3], align: "right", sortable: true, format: pct },
  {
    key: "invited",
    label: t.cohortColumns[4],
    align: "right",
    sortable: true,
    format: pct,
  },
  { key: "change", label: t.cohortColumns[5], align: "right", format: signed },
];

type Account = DataRow & {
  account: string;
  plan: string;
  seats: number;
  days: number;
  owner: string;
};

const accounts: Account[] = [
  ["Northwind Labs", "Team", 24, 1.2, "Ana P."],
  ["Halcyon Health", "Team", 41, 2.8, "Leo M."],
  ["Brightline Freight", "Team", 12, 0.9, "Ana P."],
  ["Copperleaf Studio", "Team", 9, 1.6, "Sam K."],
  ["Ostrava Robotics", "Team", 33, 3.4, "Leo M."],
  ["Pinecrest Schools", "Team", 18, 2.1, "Sam K."],
  ["Lumen Dental", "Team", 7, 1.1, "Ana P."],
].map(
  ([account, plan, seats, days, owner], i) =>
    ({ id: `a${i}`, account, plan, seats, days, owner }) as Account,
);

const accountColumnsFor = (t: Copy): DataColumn<Account>[] => [
  { key: "account", label: t.accountColumns[0], sortable: true },
  { key: "seats", label: t.accountColumns[1], align: "right", sortable: true },
  {
    key: "days",
    label: t.accountColumns[2],
    align: "right",
    sortable: true,
    format: t.days,
  },
  {
    key: "owner",
    label: t.accountColumns[3],
    sortable: true,
    format: (v) => t.latin(String(v)),
  },
];

/** True while the element is narrower than `px` — answers adapt to the message column. */
function useNarrow(px: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setNarrow(el.clientWidth < px));
    observer.observe(el);
    return () => observer.disconnect();
  }, [px]);
  return [ref, narrow] as const;
}

/** KPI cards; sparklines only when two cards per row have room for them. */
function FittedStats({ t }: { t: Copy }) {
  const [ref, narrow] = useNarrow(520);
  return (
    <div ref={ref} className="min-w-0">
      <StatGrid
        data={statsFor(t)}
        sparklines={!narrow}
        title={t.statsTitle}
        subtitle={t.statsSubtitle}
        locale={t.intl}
        labels={t.statGrid}
        className="max-w-none"
      />
    </div>
  );
}

/** Keeps a table inside the message column: drops less important columns when narrow. */
function FittedTable<R extends DataRow>({
  columns,
  keep,
  ...props
}: DataTableProps<R> & { keep: string[] }) {
  const [ref, narrow] = useNarrow(520);
  return (
    <div ref={ref} className="min-w-0">
      <DataTable
        {...props}
        columns={narrow ? columns.filter((c) => keep.includes(c.key)) : columns}
        className="max-w-none"
      />
    </div>
  );
}

const sourcesFor = (t: Copy): Source[] => [
  {
    id: "s1",
    title: t.citations[0].title,
    url: "https://data.acme.app/tables/onboarding_step",
    snippet: t.citations[0].snippet,
    date: day(t, 10, 9),
  },
  {
    id: "s2",
    title: t.citations[1].title,
    url: "https://acme.app/changelog/onboarding-v2",
    snippet: t.citations[1].snippet,
    date: day(t, 9, 12),
  },
];

const strip = (t: string) => t.replace(/\s?\[\d+(?:,\s?\d+)*\]/g, "");

const query = (status: ToolCall["status"], sql: string): ToolCall => ({
  id: "sql",
  name: "warehouse.query",
  args: { sql },
  status,
  durationMs: status === "success" ? 2_180 : undefined,
  result: status === "success" ? { rows: 60, bytes_scanned: "1.4 GB" } : undefined,
});

const overviewSql =
  "select week, count(*) signups, avg(activated_7d) rate, avg(invited) invited from onboarding_cohorts where week >= 'W36' group by week order by week";
const drillSql =
  "select plan, count(*) activated, avg(days_to_activate) days from onboarding_cohorts where activated_7d and week = 'W45' group by plan";

type Phase = "query" | "text" | "stats" | "chart" | "table" | "done";
type Turn = {
  id: string;
  role: "user" | "assistant";
  at: string;
  text: string;
  kind: "overview" | "drill";
  phase: Phase;
};
type State = { turns: Turn[]; status: "idle" | "streaming" };

const order: Phase[] = ["query", "text", "stats", "chart", "table", "done"];
const reached = (turn: Turn, phase: Phase) =>
  order.indexOf(turn.phase) >= order.indexOf(phase);

const Reveal = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.24, ease: EASE_OUT }}
    className="min-w-0"
  >
    {children}
  </motion.div>
);

function Answer({ turn, t }: { turn: Turn; t: Copy }) {
  const drill = turn.kind === "drill";
  const [selected, setSelected] = useState<string[]>(["a0", "a2"]);
  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <ToolCallBlock
        data={query(
          turn.phase === "query" ? "running" : "success",
          drill ? drillSql : overviewSql,
        )}
        labels={t.toolCall}
        className="max-w-none"
      />
      {turn.phase === "text" && (
        <StreamingMessage
          data={{ content: turn.text, status: "streaming" }}
          showHeader={false}
          labels={t.streaming}
          className="max-w-none"
        />
      )}
      {reached(turn, "stats") &&
        (drill ? (
          <p>{turn.text}</p>
        ) : (
          <SourceList
            data={{ sources: sourcesFor(t), text: turn.text }}
            variant="footnotes"
            labels={t.sourceList}
            className="max-w-none"
          />
        ))}
      <AnimatePresence initial={false}>
        {!drill && reached(turn, "stats") && (
          <Reveal key="stats">
            <FittedStats t={t} />
          </Reveal>
        )}
        {reached(turn, "chart") && (
          <Reveal key="chart">
            {drill ? (
              <ChartCard
                type="donut"
                title={t.donutTitle}
                subtitle={t.donutSubtitle}
                total="1,425"
                data={{
                  labels: [t.donutLabel],
                  series: [
                    { id: "team", label: "Team", values: [584] },
                    { id: "free", label: "Free", values: [512] },
                    { id: "business", label: "Business", values: [228] },
                    { id: "ent", label: "Enterprise", values: [101] },
                  ],
                }}
                labels={t.chart}
                className="max-w-none"
              />
            ) : (
              <ChartCard
                type="area"
                title={t.areaTitle}
                subtitle={t.areaSubtitle}
                total="41.8%"
                format={(v) => `${v}%`}
                data={{
                  labels: weeks,
                  series: [
                    {
                      id: "act",
                      label: t.areaSeries[0],
                      values: [33.4, 34.1, 35, 34.2, 35.2, 38.1, 40.3, 41.2, 42, 41.8],
                    },
                    {
                      id: "inv",
                      label: t.areaSeries[1],
                      values: [26, 26.8, 27.1, 26.3, 26.9, 27.8, 28.1, 28.9, 29.4, 29.1],
                    },
                  ],
                }}
                labels={t.chart}
                className="max-w-none"
              />
            )}
          </Reveal>
        )}
        {reached(turn, "table") && (
          <Reveal key="table">
            {drill ? (
              <FittedTable<Account>
                title={t.accountsTitle}
                subtitle={t.accountsCount(accounts.length)}
                data={accounts}
                columns={accountColumnsFor(t)}
                keep={["account", "days"]}
                selectable
                selected={selected}
                onSelectedChange={setSelected}
                labels={t.table}
                actions={() => (
                  <Button size="sm" icon={DownloadSimple}>
                    {t.exportLabel}
                  </Button>
                )}
              />
            ) : (
              <FittedTable<Cohort>
                title={t.cohortsTitle}
                subtitle={t.cohortsSubtitle}
                data={cohortsFor(t)}
                columns={cohortColumnsFor(t)}
                keep={["cohort", "rate", "change"]}
                labels={t.table}
              />
            )}
          </Reveal>
        )}
      </AnimatePresence>
    </div>
  );
}

const ask = (s: State, text: string, kind: Turn["kind"], minute: number): State => ({
  status: "streaming",
  turns: [
    ...s.turns,
    { id: `u${s.turns.length}`, role: "user", at: at(minute), text, kind, phase: "done" },
    {
      id: `a${s.turns.length}`,
      role: "assistant",
      at: at(minute),
      text: "",
      kind,
      phase: "query",
    },
  ],
});

const patchLast = (s: State, patch: Partial<Turn>): State => ({
  ...s,
  turns: s.turns.map((t, i) => (i === s.turns.length - 1 ? { ...t, ...patch } : t)),
});

const answerSteps = (full: string): MockStep<State>[] => [
  wait(1500),
  { delay: 0, apply: (s) => patchLast(s, { phase: "text" }) },
  ...streamText<State>(strip(full), (s, text) => patchLast(s, { text }), {
    interval: 22,
    startDelay: 200,
  }),
  { delay: 250, apply: (s) => patchLast(s, { text: full, phase: "stats" }) },
  { delay: 700, apply: (s) => patchLast(s, { phase: "chart" }) },
  { delay: 700, apply: (s) => patchLast(s, { phase: "table" }) },
  { delay: 400, apply: (s) => ({ ...patchLast(s, { phase: "done" }), status: "idle" }) },
];

const overviewDoneFor = (t: Copy): Turn[] => [
  {
    id: "u0",
    role: "user",
    at: at(2),
    text: t.firstQuestion,
    kind: "overview",
    phase: "done",
  },
  {
    id: "a0",
    role: "assistant",
    at: at(2),
    text: t.overviewText,
    kind: "overview",
    phase: "done",
  },
];
const drillDoneFor = (t: Copy): Turn[] => [
  ...overviewDoneFor(t),
  {
    id: "u2",
    role: "user",
    at: at(6),
    text: t.drillQuestion,
    kind: "drill",
    phase: "done",
  },
  {
    id: "a2",
    role: "assistant",
    at: at(6),
    text: t.drillText,
    kind: "drill",
    phase: "done",
  },
];

export default function DataAnswerDemo({
  variant,
  locale = "en",
  autoplay = true,
}: {
  variant?: string;
  locale?: DemoLocale;
  autoplay?: boolean;
}) {
  const t = copy[locale];
  const drill = variant === "Drill-down";
  const script: MockStep<State>[] = drill
    ? [
        wait(900),
        { delay: 0, apply: (s) => ask(s, t.drillQuestion, "drill", 6) },
        ...answerSteps(t.drillText),
      ]
    : [
        wait(800),
        { delay: 0, apply: (s) => ask(s, t.firstQuestion, "overview", 2) },
        ...answerSteps(t.overviewText),
      ];
  // Paused thumbnails show the finished answer; a live run starts from the question.
  const initial: State = autoplay
    ? { turns: drill ? overviewDoneFor(t) : [], status: "idle" }
    : { turns: drill ? drillDoneFor(t) : overviewDoneFor(t), status: "idle" };
  const { state, setState } = useMockRun<State>(initial, script, { autoplay });

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const play = (text: string) => {
    timers.current.forEach(clearTimeout);
    const kind = text === t.drillQuestion ? "drill" : "overview";
    setState((s) => ask(s, text, kind, 9));
    let ms = 0;
    timers.current = answerSteps(kind === "drill" ? t.drillText : t.overviewText).map(
      (step) => {
        ms += step.delay;
        return setTimeout(() => setState(step.apply), ms);
      },
    );
  };

  const followUps = [
    { id: "f1", title: t.drillQuestion },
    { id: "f2", title: t.followUps[0] },
    { id: "f3", title: t.followUps[1] },
  ];

  const last = state.turns.at(-1);
  const data: DataAnswerData = {
    title: t.title,
    model: "opus-5.5",
    user: { name: "Maya Chen" },
    sources: [
      { id: "wh", name: t.sources[0], detail: t.details[0], status: "synced" },
      { id: "crm", name: t.sources[1], detail: t.details[1], status: "syncing" },
      { id: "bill", name: t.sources[2], detail: t.details[2], status: "stale" },
    ],
    saved: [
      { id: "q1", title: t.saved[0] },
      { id: "q2", title: t.saved[1] },
      { id: "q3", title: t.saved[2] },
    ],
    followUps: last?.kind === "overview" && last.phase === "done" ? followUps : undefined,
    messages: state.turns.map((turn) => ({
      id: turn.id,
      role: turn.role,
      at: turn.at,
      content: turn.role === "user" ? turn.text : <Answer turn={turn} t={t} />,
    })),
  };

  return (
    <DataAnswer
      data={data}
      status={state.status}
      labels={t.labels}
      locale={t.intl}
      onSend={play}
      onStop={() => {
        timers.current.forEach(clearTimeout);
        setState((s) => ({ ...patchLast(s, { phase: "done" }), status: "idle" }));
      }}
    />
  );
}
