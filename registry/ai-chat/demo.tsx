"use client";

import {
  ChartBar,
  EnvelopeSimple,
  Lightbulb,
  MagnifyingGlass,
  Users,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import {
  ResponseFeedback,
  type ResponseFeedbackLabels,
} from "@/components/ui/response-feedback";
import {
  SourceList,
  type Source,
  type SourceListLabels,
} from "@/components/ui/source-list";
import {
  StreamingMessage,
  type StreamingMessageLabels,
} from "@/components/ui/streaming-message";
import {
  ToolCallBlock,
  type ToolCall,
  type ToolCallBlockLabels,
} from "@/components/ui/tool-call-block";
import {
  streamText,
  useMockRun,
  wait,
  type MockStep,
} from "@/registry/use-mock-run/use-mock-run";
import { AIChat, type AIChatData, type AIChatLabels } from "./ai-chat";

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

type Turn = {
  id: string;
  role: "user" | "assistant";
  at: string;
  text: string;
  call?: ToolCall;
  phase?: "tool" | "streaming" | "done";
  sources?: Source[];
};

type State = { turns: Turn[]; status: "idle" | "streaming"; followUps: boolean };

const ltr = (text: string) => `⁦${text}⁩`;

type Copy = {
  locale?: string;
  /**
   * Set on assistant turns: the thread picks each message's direction from its
   * first letter, and here that's the Latin tool name.
   */
  dir?: "rtl";
  title: string;
  sources: [title: string, snippet: string, date: string][];
  answer: string;
  prompt: string;
  history: [string, string];
  followUps: [string, string, string];
  starters: [title: string, hint: string][];
  conversations: [string, string, string, string, string, string];
  segments: [conversation: string, notes: string, instructions: string];
  searching: string;
  labels?: Partial<AIChatLabels>;
  feedback?: Partial<ResponseFeedbackLabels>;
  feedbackReasons?: string[];
  sourceList?: Partial<SourceListLabels>;
  streaming?: Partial<StreamingMessageLabels>;
  toolCall?: Partial<ToolCallBlockLabels>;
};

const copy: Record<DemoLocale, Copy> = {
  en: {
    title: "Onboarding interview notes",
    sources: [
      [
        "Interview — Northwind Labs, ops lead",
        "“The checklist made it obvious what to do next. I set up billing on day one.”",
        "Oct 28",
      ],
      [
        "Interview — Halcyon Health, admin",
        "“Inviting the team was buried. I only found it after asking support.”",
        "Oct 29",
      ],
      [
        "Onboarding funnel — week 44",
        "Checklist completion 61% → 74%; invite step drop-off unchanged at 38%.",
        "Nov 1",
      ],
    ],
    answer:
      "Across the six interviews, people liked the new setup checklist — it made the next step obvious and two teams set up billing on day one [1]. The weak spot is inviting teammates: four of six couldn't find it without help [2]. The funnel agrees: checklist completion rose from 61% to 74%, but drop-off at the invite step is still 38% [3]. I'd move invites into the checklist as step two.",
    prompt: "What did customers say about the new onboarding in last week's interviews?",
    history: [
      "Draft five interview questions about the new onboarding.",
      "Here are five: what did you expect to do first, what made you pause, how did you invite your team, what did you skip, and what would you change first? I kept them open-ended so people describe what they did rather than rate it.",
    ],
    followUps: [
      "Draft the checklist change",
      "Which teams struggled most?",
      "Chart invite drop-off by plan",
    ],
    starters: [
      ["Summarize customer interviews", "From last week's notes"],
      ["Chart onboarding drop-off", "By step and by plan"],
      ["Draft the release email", "From merged pull requests"],
      ["Find quick wins", "In open support tickets"],
    ],
    conversations: [
      "Onboarding interview notes",
      "Q4 pricing page copy",
      "Churn reasons by plan",
      "Support macros in German",
      "Release notes for 2.4",
      "Hiring plan — design",
    ],
    segments: ["Conversation", "Research notes", "Instructions"],
    searching: "Searching your research notes…",
  },
  he: {
    locale: "he-IL",
    dir: "rtl",
    title: "סיכומי ראיונות ההצטרפות",
    sources: [
      [
        `ראיון — ${ltr("Northwind Labs")}, מנהלת תפעול`,
        "„מהרשימה היה ברור מה עושים עכשיו. הגדרתי חיוב כבר ביום הראשון.”",
        "28 באוק׳",
      ],
      [
        `ראיון — ${ltr("Halcyon Health")}, מנהל מערכת`,
        "„ההזמנה של הצוות הייתה קבורה. מצאתי אותה רק אחרי שפניתי לתמיכה.”",
        "29 באוק׳",
      ],
      [
        "משפך ההצטרפות — שבוע 44",
        "השלמת הרשימה עלתה מ־61% ל־74%; הנטישה בשלב ההזמנה נשארה 38%.",
        "1 בנוב׳",
      ],
    ],
    answer:
      "בכל ששת הראיונות אהבו את רשימת ההגדרה החדשה — ברור ממנה מה הצעד הבא, ושני צוותים הגדירו חיוב כבר ביום הראשון [1]. החולשה היא הזמנת חברי צוות: ארבעה מתוך שישה לא מצאו אותה בלי עזרה [2]. גם המשפך מראה את זה: השלמת הרשימה עלתה מ־61% ל־74%, אבל הנטישה בשלב ההזמנה עדיין 38% [3]. הייתי מעביר את ההזמנות לרשימה כשלב השני.",
    prompt: "מה לקוחות אמרו על תהליך ההצטרפות החדש בראיונות של השבוע שעבר?",
    history: [
      "תנסח חמש שאלות לראיון על תהליך ההצטרפות החדש.",
      "הנה חמש: מה ציפית לעשות קודם, איפה נעצרת, איך הזמנת את הצוות, על מה דילגת, ומה היית משנה קודם? השארתי אותן פתוחות, כדי שאנשים יתארו מה עשו ולא רק ייתנו ציון.",
    ],
    followUps: [
      "תנסח את השינוי ברשימה",
      "לאילו צוותים היה הכי קשה?",
      "גרף נטישה בהזמנה לפי חבילה",
    ],
    starters: [
      ["סיכום ראיונות לקוחות", "מהסיכומים של השבוע שעבר"],
      ["גרף נטישה בהצטרפות", "לפי שלב ולפי חבילה"],
      ["טיוטת מייל הגרסה", "מתוך ה־pull requests שמוזגו"],
      ["איתור שיפורים מהירים", "בפניות תמיכה פתוחות"],
    ],
    conversations: [
      "סיכומי ראיונות ההצטרפות",
      `טקסטים לעמוד המחירים ל־${ltr("Q4")}`,
      "סיבות נטישה לפי חבילה",
      "תבניות תמיכה בגרמנית",
      `הערות גרסה ל־${ltr("2.4")}`,
      "תוכנית גיוס — עיצוב",
    ],
    segments: ["שיחה", "סיכומי מחקר", "הנחיות"],
    searching: "מחפש בסיכומי המחקר שלך…",
    labels: {
      chatHistory: "היסטוריית שיחות",
      openHistory: "פתיחת היסטוריית השיחות",
      closeHistory: "סגירת היסטוריית השיחות",
      close: "סגירה",
      showSidebar: "הצגת סרגל הצד",
      hideSidebar: "הסתרת סרגל הצד",
      newChat: "שיחה חדשה",
      share: "שיתוף השיחה",
      startersHeading: "על מה נעבוד?",
      placeholder: "אפשר לשאול הכול",
      replyPlaceholder: "תשובה…",
      conversationList: {
        chats: "שיחות",
        newChat: "שיחה חדשה",
        search: "חיפוש בשיחות",
        clearSearch: "ניקוי החיפוש",
        noResults: "לא נמצאו שיחות",
        tryAnother: "אפשר לנסות חיפוש אחר.",
        empty: "עדיין אין שיחות",
        groups: {
          pinned: "מוצמדות",
          today: "היום",
          yesterday: "אתמול",
          week: "7 הימים האחרונים",
          older: "ישנות יותר",
          recent: "אחרונות",
        },
        agentWorking: "הסוכן עובד",
        archived: (title) => `„${title}” הועברה לארכיון`,
        deleted: (title) => `„${title}” נמחקה`,
        undo: "ביטול",
        archivedStatus: (title) => `${title} הועברה לארכיון. אפשר לבטל.`,
        deletedStatus: (title) => `${title} נמחקה. אפשר לבטל.`,
        chatTitle: "שם השיחה",
        actionsFor: (title) => `פעולות עבור ${title}`,
        pin: "הצמדה",
        unpin: "ביטול הצמדה",
        rename: "שינוי שם",
        archive: "העברה לארכיון",
        delete: "מחיקה",
      },
      chatThread: {
        conversation: "שיחה",
        today: "היום",
        yesterday: "אתמול",
        unread: "לא נקראו",
        jumpToLatest: "מעבר להודעה האחרונה",
        fresh: (count) => `${count} חדשות`,
      },
      composer: {
        followUp: "הוסיפו המשך — הוא ירוץ כשהסוכן יסיים",
        message: "הודעה",
        commands: "פקודות",
        files: "קבצים",
        switchModel: (model) => `מודל: ${model}. החלפת מודל`,
        tokens: (count) => `${ltr(count)} טוקנים`,
        totalTokens: (count) => `+ ${ltr(count)} טוקנים`,
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
        queued: (count) => `בתור · ${count}`,
        queuedMessages: "הודעות בתור",
        removeQueued: (text) => `הסרת ההודעה מהתור: ${text}`,
        workingStatus: (queued) => `הסוכן עובד${queued ? `, ${queued} בתור` : ""}`,
      },
      contextMeter: {
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
        warningZone: (left) => `באזור האזהרה — נשארו ${ltr(left)} טוקנים`,
        tinted: (percent) => `התאים הצבועים מסמנים את ה־${percent} האחרונים`,
        pinned: "מוצמד",
      },
      suggestions: {
        suggestedPrompts: "הצעות לבקשות",
        suggestedFollowUps: "הצעות להמשך",
        moreSuggestions: "הצעות נוספות",
        loadingSuggestions: "טוען הצעות חדשות",
      },
    },
    feedbackReasons: ["לא מדויק", "לא עזר", "ארוך מדי", "לא בטוח", "אחר"],
    feedback: {
      helpful: "עזר לי",
      notHelpful: "לא עזר",
      copy: "העתקה",
      copied: "הועתק",
      regenerate: "תשובה חדשה",
      thanks: "תודה",
      whatWentWrong: "מה השתבש?",
      whatStoodOut: "מה בלט?",
      reasons: "סיבות",
      note: "הוספת הערה",
      notePlaceholder: "הוספת הערה (לא חובה)",
      cancel: "ביטול",
      send: "שליחת משוב",
      sentThanks: "תודה — נשתמש בזה כדי להשתפר.",
      undo: "בטל",
      announceSent: "המשוב נשלח",
      announceHelpful: "סומן כמועיל",
      announceOpen: "ספרו לנו מה השתבש",
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
    streaming: {
      messageFrom: (model) => `הודעה מ־${model}`,
      responding: "עונה…",
      complete: "התשובה הושלמה",
      failed: "התשובה נכשלה",
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
  },
  ar: {
    locale: "ar",
    dir: "rtl",
    title: "ملاحظات مقابلات التسجيل",
    sources: [
      [
        `مقابلة — ${ltr("Northwind Labs")}، مديرة العمليات`,
        "«أوضحت القائمة ما عليّ فعله بعد ذلك. فعّلتُ الفوترة في اليوم الأول.»",
        "28 أكتوبر",
      ],
      [
        `مقابلة — ${ltr("Halcyon Health")}، مسؤول النظام`,
        "«كانت دعوة الفريق مخفية. لم أجدها إلا بعد أن سألت الدعم.»",
        "29 أكتوبر",
      ],
      [
        "مسار التسجيل — الأسبوع 44",
        "ارتفع إكمال القائمة من 61% إلى 74%؛ وبقي التسرّب عند خطوة الدعوة 38%.",
        "1 نوفمبر",
      ],
    ],
    answer:
      "في المقابلات الست، أحبّ المستخدمون قائمة الإعداد الجديدة — فقد أوضحت الخطوة التالية، وفعّل فريقان الفوترة في اليوم الأول [1]. نقطة الضعف هي دعوة الزملاء: أربعة من ستة لم يجدوها دون مساعدة [2]. ومسار التسجيل يؤكد ذلك: ارتفع إكمال القائمة من 61% إلى 74%، لكن التسرّب عند خطوة الدعوة ما زال 38% [3]. أقترح نقل الدعوات إلى القائمة لتكون الخطوة الثانية.",
    prompt: "ماذا قال العملاء عن تجربة التسجيل الجديدة في مقابلات الأسبوع الماضي؟",
    history: [
      "صُغ خمسة أسئلة للمقابلات عن تجربة التسجيل الجديدة.",
      "إليك خمسة: ماذا توقعت أن تفعل أولًا، وما الذي جعلك تتوقف، وكيف دعوت فريقك، وما الذي تخطيته، وما أول شيء ستغيّره؟ تركتها مفتوحة ليصف الناس ما فعلوه بدل أن يقيّموه.",
    ],
    followUps: [
      "صُغ التعديل على القائمة",
      "أي الفرق واجهت أكبر صعوبة؟",
      "رسم بياني للتسرّب عند الدعوة حسب الباقة",
    ],
    starters: [
      ["تلخيص مقابلات العملاء", "من ملاحظات الأسبوع الماضي"],
      ["رسم بياني للتسرّب في التسجيل", "حسب الخطوة والباقة"],
      ["مسودة رسالة الإصدار", "من طلبات الدمج المقبولة"],
      ["ابحث عن مكاسب سريعة", "في تذاكر الدعم المفتوحة"],
    ],
    conversations: [
      "ملاحظات مقابلات التسجيل",
      "نصوص صفحة الأسعار للربع الرابع",
      "أسباب إلغاء الاشتراك حسب الباقة",
      "ردود الدعم الجاهزة بالألمانية",
      `ملاحظات إصدار ${ltr("2.4")}`,
      "خطة التوظيف — التصميم",
    ],
    segments: ["المحادثة", "ملاحظات البحث", "التعليمات"],
    searching: "جارٍ البحث في ملاحظات بحثك…",
    labels: {
      chatHistory: "سجل المحادثات",
      openHistory: "فتح سجل المحادثات",
      closeHistory: "إغلاق سجل المحادثات",
      close: "إغلاق",
      showSidebar: "إظهار الشريط الجانبي",
      hideSidebar: "إخفاء الشريط الجانبي",
      newChat: "محادثة جديدة",
      share: "مشاركة المحادثة",
      startersHeading: "على ماذا نعمل؟",
      placeholder: "اسأل عن أي شيء",
      replyPlaceholder: "اكتب ردك…",
      conversationList: {
        chats: "المحادثات",
        newChat: "محادثة جديدة",
        search: "ابحث في المحادثات",
        clearSearch: "مسح البحث",
        noResults: "لا توجد محادثات مطابقة",
        tryAnother: "جرّب بحثًا آخر.",
        empty: "لا توجد محادثات بعد",
        groups: {
          pinned: "المثبّتة",
          today: "اليوم",
          yesterday: "أمس",
          week: "آخر 7 أيام",
          older: "الأقدم",
          recent: "الأخيرة",
        },
        agentWorking: "الوكيل يعمل",
        archived: (title) => `نُقلت «${title}» إلى الأرشيف`,
        deleted: (title) => `حُذفت «${title}»`,
        undo: "تراجع",
        archivedStatus: (title) => `نُقلت ${title} إلى الأرشيف. يمكنك التراجع.`,
        deletedStatus: (title) => `حُذفت ${title}. يمكنك التراجع.`,
        chatTitle: "عنوان المحادثة",
        actionsFor: (title) => `إجراءات ${title}`,
        pin: "تثبيت",
        unpin: "إلغاء التثبيت",
        rename: "إعادة التسمية",
        archive: "أرشفة",
        delete: "حذف",
      },
      chatThread: {
        conversation: "المحادثة",
        today: "اليوم",
        yesterday: "أمس",
        unread: "غير مقروءة",
        jumpToLatest: "الانتقال إلى الأحدث",
        fresh: (count) => `${count} جديدة`,
      },
      composer: {
        followUp: "أضف متابعة، وستُنفَّذ عندما ينتهي الوكيل",
        message: "الرسالة",
        commands: "الأوامر",
        files: "الملفات",
        switchModel: (model) => `النموذج: ${model}. تبديل النموذج`,
        tokens: (count) => `${ltr(count)} رمز`,
        totalTokens: (count) => `+ ${ltr(count)} رمز`,
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
        queued: (count) => `في الانتظار · ${count}`,
        queuedMessages: "الرسائل المنتظرة",
        removeQueued: (text) => `إزالة الرسالة المنتظرة: ${text}`,
        workingStatus: (queued) =>
          `الوكيل يعمل${queued ? `، ${queued} في الانتظار` : ""}`,
      },
      contextMeter: {
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
        warningZone: (left) => `في منطقة التحذير — يتبقى ${ltr(left)} رمز`,
        tinted: (percent) => `الخلايا الملوّنة تمثّل آخر ${percent}`,
        pinned: "مثبّت",
      },
      suggestions: {
        suggestedPrompts: "اقتراحات للطلبات",
        suggestedFollowUps: "اقتراحات للمتابعة",
        moreSuggestions: "مزيد من الاقتراحات",
        loadingSuggestions: "جارٍ تحميل اقتراحات جديدة",
      },
    },
    feedbackReasons: ["غير دقيقة", "غير مفيدة", "طويلة جدًا", "غير آمنة", "أخرى"],
    feedback: {
      helpful: "مفيدة",
      notHelpful: "غير مفيدة",
      copy: "نسخ",
      copied: "تم النسخ",
      regenerate: "إعادة التوليد",
      thanks: "شكرًا",
      whatWentWrong: "ما الخطأ؟",
      whatStoodOut: "ما الذي لفت انتباهك؟",
      reasons: "الأسباب",
      note: "إضافة ملاحظة",
      notePlaceholder: "إضافة ملاحظة (اختياري)",
      cancel: "إلغاء",
      send: "إرسال الملاحظات",
      sentThanks: "شكرًا — سنستفيد من ذلك في التحسين.",
      undo: "تراجع",
      announceSent: "تم إرسال الملاحظات",
      announceHelpful: "تم وضع علامة مفيدة",
      announceOpen: "أخبرنا بما حدث من خطأ",
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
    streaming: {
      messageFrom: (model) => `رسالة من ${model}`,
      responding: "يكتب الرد…",
      complete: "اكتمل الرد",
      failed: "تعذّر الرد",
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
  },
};

const urls = [
  "https://research.acme.app/interviews/northwind",
  "https://research.acme.app/interviews/halcyon",
  "https://metrics.acme.app/funnels/onboarding",
];

const stripMarkers = (text: string) => text.replace(/\s?\[\d+(?:,\s?\d+)*\]/g, "");

const search = (status: ToolCall["status"]): ToolCall => ({
  id: "search",
  name: "docs.search",
  args: { query: "onboarding interview notes", since: "7d", limit: 10 },
  status,
  durationMs: status === "success" ? 1_420 : undefined,
  result:
    status === "success"
      ? { matches: 6, top: ["northwind", "halcyon", "brightline"] }
      : undefined,
});

const ask = (s: State, text: string): State => ({
  ...s,
  followUps: false,
  status: "streaming",
  turns: [
    ...s.turns,
    { id: `u${s.turns.length}`, role: "user", at: new Date().toISOString(), text },
    {
      id: `a${s.turns.length}`,
      role: "assistant",
      at: new Date().toISOString(),
      text: "",
      phase: "tool",
      call: search("running"),
    },
  ],
});

const updateLast = (s: State, patch: Partial<Turn>): State => ({
  ...s,
  turns: s.turns.map((t, i) => (i === s.turns.length - 1 ? { ...t, ...patch } : t)),
});

/** Everything the run says, in one language. */
function script(t: Copy) {
  const sources: Source[] = t.sources.map(([title, snippet, date], i) => ({
    id: `s${i + 1}`,
    title,
    url: urls[i],
    snippet,
    date,
  }));

  const history: Turn[] = [
    { id: "h1", role: "user", at: ago(42), text: t.history[0] },
    { id: "h2", role: "assistant", at: ago(41), phase: "done", text: t.history[1] },
  ];

  const answerSteps: MockStep<State>[] = [
    wait(1400),
    {
      delay: 0,
      apply: (s) => updateLast(s, { call: search("success"), phase: "streaming" }),
    },
    ...streamText<State>(stripMarkers(t.answer), (s, text) => updateLast(s, { text }), {
      interval: 26,
      startDelay: 300,
    }),
    {
      delay: 200,
      apply: (s) => ({
        ...updateLast(s, { text: t.answer, phase: "done", sources }),
        status: "idle",
        followUps: true,
      }),
    },
  ];

  const conversationScript: MockStep<State>[] = [
    wait(900),
    { delay: 0, apply: (s) => ask(s, t.prompt) },
    ...answerSteps,
  ];

  // In "New chat" the starter card is picked, then the same run plays.
  const newChatScript: MockStep<State>[] = [wait(1600), ...conversationScript.slice(1)];

  const followUps = t.followUps.map((title, i) => ({ id: `f${i + 1}`, title }));

  const icons = [Users, ChartBar, EnvelopeSimple, Lightbulb];
  const starters = t.starters.map(([title, hint], i) => ({
    id: `st${i + 1}`,
    icon: icons[i],
    title,
    hint,
    prompt: i === 0 ? t.prompt : undefined,
  }));

  const [c1, c2, c3, c4, c5, c6] = t.conversations;
  const conversations: AIChatData["conversations"] = [
    { id: "c1", title: c1, updatedAt: ago(1), running: false },
    { id: "c2", title: c2, updatedAt: ago(90), pinned: true },
    { id: "c3", title: c3, updatedAt: ago(60 * 5) },
    { id: "c4", title: c4, updatedAt: ago(60 * 26) },
    { id: "c5", title: c5, updatedAt: ago(60 * 30) },
    { id: "c6", title: c6, updatedAt: ago(60 * 24 * 4) },
  ];

  return {
    history,
    answerSteps,
    conversationScript,
    newChatScript,
    followUps,
    starters,
    conversations,
  };
}

function AssistantTurn({ turn, last, t }: { turn: Turn; last: boolean; t: Copy }) {
  return (
    <div dir={t.dir} className="flex w-full flex-col gap-3">
      {turn.call && (
        <ToolCallBlock data={turn.call} labels={t.toolCall} className="max-w-none" />
      )}
      {turn.phase === "tool" && (
        <p className="flex items-center gap-2 text-[0.8125rem] text-muted-foreground">
          <MagnifyingGlass weight="bold" className="size-3.5" aria-hidden="true" />
          {t.searching}
        </p>
      )}
      {turn.phase === "streaming" && (
        <StreamingMessage
          data={{ content: turn.text, status: "streaming" }}
          showHeader={false}
          labels={t.streaming}
          className="max-w-none"
        />
      )}
      {turn.phase === "done" &&
        (turn.sources ? (
          <SourceList
            data={{ sources: turn.sources, text: turn.text }}
            variant="footnotes"
            labels={t.sourceList}
            className="max-w-none"
          />
        ) : (
          <p>{turn.text}</p>
        ))}
      {turn.phase === "done" && last && (
        <ResponseFeedback labels={t.feedback} reasons={t.feedbackReasons} />
      )}
    </div>
  );
}

export default function AIChatDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const t = copy[locale];
  const {
    history,
    answerSteps,
    conversationScript,
    newChatScript,
    followUps,
    starters,
    conversations,
  } = useMemo(() => script(t), [t]);
  const fresh = variant === "New chat";
  const { state, setState } = useMockRun<State>(
    { turns: fresh ? [] : history, status: "idle", followUps: false },
    fresh ? newChatScript : conversationScript,
    { autoplay },
  );

  // Messages the viewer sends get the same scripted answer.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const play = (text: string) => {
    timers.current.forEach(clearTimeout);
    setState((s) => ask(s, text));
    let at = 0;
    timers.current = answerSteps.map((step) => {
      at += step.delay;
      return setTimeout(() => setState(step.apply), at);
    });
  };

  const data: AIChatData = {
    conversations,
    activeId: state.turns.length ? "c1" : undefined,
    title: t.title,
    model: "opus-5.5",
    user: { name: "Maya Chen" },
    starters,
    followUps: state.followUps ? followUps : undefined,
    context: {
      limit: 200_000,
      segments: [
        {
          id: "history",
          label: t.segments[0],
          tokens: 4_200 + state.turns.length * 2_900,
        },
        {
          id: "files",
          label: t.segments[1],
          tokens: state.turns.length > 2 ? 18_400 : 0,
        },
        { id: "system", label: t.segments[2], tokens: 3_100, pinned: true },
      ],
    },
    messages: state.turns.map((turn, i) => ({
      id: turn.id,
      role: turn.role,
      at: turn.at,
      content:
        turn.role === "user" ? (
          turn.text
        ) : (
          <AssistantTurn turn={turn} last={i === state.turns.length - 1} t={t} />
        ),
    })),
  };

  return (
    <AIChat
      data={data}
      labels={t.labels}
      locale={t.locale}
      status={state.status}
      onSend={play}
      onStop={() => {
        timers.current.forEach(clearTimeout);
        setState((s) => ({ ...updateLast(s, { phase: "done" }), status: "idle" }));
      }}
      onNewChat={() => {
        timers.current.forEach(clearTimeout);
        setState({ turns: [], status: "idle", followUps: false });
      }}
    />
  );
}
