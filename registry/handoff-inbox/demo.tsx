"use client";

import { ArrowsLeftRight } from "@phosphor-icons/react";
import type { DemoLocale } from "@/components/docs/demo";
import type { DataColumn, DataRow } from "@/components/ui/data-table";
import { StatusPill } from "@/components/ui/status-pill";
import type { ToolCall } from "@/components/ui/tool-call-block";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  HandoffInbox,
  type Escalation,
  type HandoffInboxData,
  type HandoffInboxLabels,
  type HandoffMessage,
  type HandoffStatus,
} from "./handoff-inbox";

/** Keeps Latin fragments next to numbers and punctuation in order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

const arabicPlural = (n: number, one: string, two: string, few: string, many: string) =>
  n === 1 ? one : n === 2 ? two : n % 100 >= 3 && n % 100 <= 10 ? few : many;

type Copy = {
  intl: string;
  handedOff: string;
  /** Customer, bot, customer, bot. */
  thread: [string, string, string, string];
  reasons: Record<"port" | "roaming" | "angry" | "unsure" | "lost", string>;
  snippets: Record<"luis" | "tom" | "priya" | "hannah", string>;
  reply: string;
  found: string;
  resubmitted: string;
  orderColumns: [string, string];
  orderStatus: Record<"Rejected" | "Active", string>;
  port: (id: string) => string;
  tempSim: string;
  team: string;
  wants: string;
  tried: [string, string, string];
  suggestions: [string, string][];
  since: string;
  notes: [string, string][];
  labels?: Partial<HandoffInboxLabels>;
};

const copy: Record<DemoLocale, Copy> = {
  en: {
    intl: "en-US",
    handedOff: "Bot handed off",
    thread: [
      "Hi, I'm moving my number 07700 900123 from Vireo to you. It's been two days and it still says pending.",
      "The port was rejected by Vireo: the account PIN didn't match. I've resubmitted it with the PIN you gave me.",
      "It says rejected again. I need this number for work tomorrow!",
      "I'm sorry, it was rejected a second time. I'm bringing in a teammate who can sort this out with Vireo. Your temporary number keeps working meanwhile.",
    ],
    reasons: {
      port: "Port rejected twice",
      roaming: "Roaming dispute",
      angry: "Angry customer",
      unsure: "Bot unsure",
      lost: "Lost device",
    },
    snippets: {
      luis: "Why was I charged €38 for roaming in Norway? I had the travel pass.",
      tom: "This is the third time I'm asking about my contract end date.",
      priya: "Can I keep my eSIM if I switch to a new phone this weekend?",
      hannah: "I lost my phone at the airport, please block my SIM now.",
    },
    reply:
      "Hi Dana, I'm Ari from Northline. Vireo has your number on a business account, so it needs the 6-digit port-out code from your last Vireo bill, not your PIN. Could you check?",
    found: "Found it on the bill: 482913.",
    resubmitted:
      "Thanks! Resubmitted with that code. It usually completes within 2 hours.",
    orderColumns: ["Order", "Status"],
    orderStatus: { Rejected: "Rejected", Active: "Active" },
    port: (id) => `Port ${id}`,
    tempSim: "Temporary SIM",
    team: "Northline Mobile · Support",
    wants: "Move 07700 900123 from Vireo before work tomorrow.",
    tried: [
      "Checked the port: rejected, PIN mismatch",
      "Resubmitted with the customer's PIN: rejected again",
      "Kept the temporary number active",
    ],
    suggestions: [
      [
        "Ask for the port-out code",
        "Could you check your last Vireo bill for a 6-digit port-out code? Business accounts need it instead of the PIN.",
      ],
      [
        "Offer to call Vireo together",
        "If it's easier, I can call Vireo with you on the line right now.",
      ],
      [
        "Extend the temporary number",
        "I've extended your temporary number for 7 days, so nothing breaks tomorrow.",
      ],
    ],
    since: "Customer since March 2023",
    notes: [
      ["Needs the number for work by 09:00 tomorrow.", "from chat · today"],
      ["Prefers chat over phone calls.", "from profile"],
      ["Number sits on a Vireo business account.", "from bot · today"],
    ],
  },
  he: {
    intl: "he-IL",
    handedOff: "הבוט העביר הלאה",
    thread: [
      `היי, אני מעבירה אליכם את המספר ${ltr("07700 900123")} מ־Vireo. עברו יומיים וזה עדיין מופיע בהמתנה.`,
      "הניוד נדחה על ידי Vireo: קוד ה־PIN של החשבון לא תאם. שלחתי אותו מחדש עם ה־PIN שמסרת.",
      "שוב כתוב שנדחה. אני צריכה את המספר הזה לעבודה מחר!",
      "מצטערת, הבקשה נדחתה בפעם השנייה. אני מצרפת נציג שיסדר את זה מול Vireo. המספר הזמני שלך ממשיך לעבוד בינתיים.",
    ],
    reasons: {
      port: "הניוד נדחה פעמיים",
      roaming: "מחלוקת על נדידה",
      angry: "לקוח כועס",
      unsure: "הבוט לא בטוח",
      lost: "מכשיר אבד",
    },
    snippets: {
      luis: `למה חויבתי ב־${ltr("€38")} על נדידה בנורווגיה? הייתה לי חבילת חו״ל.`,
      tom: "זו הפעם השלישית שאני שואל מתי החוזה שלי נגמר.",
      priya: "אפשר לשמור את ה־eSIM אם אני עוברת לטלפון חדש בסוף השבוע?",
      hannah: "איבדתי את הטלפון בשדה התעופה, תחסמו לי את ה־SIM עכשיו בבקשה.",
    },
    reply:
      "היי Dana, אני Ari מ־Northline. המספר שלך רשום ב־Vireo על חשבון עסקי, אז צריך את קוד הניוד בן 6 הספרות מהחשבונית האחרונה של Vireo, ולא את ה־PIN. אפשר לבדוק?",
    found: "מצאתי בחשבונית: 482913.",
    resubmitted: "תודה! שלחתי מחדש עם הקוד הזה. בדרך כלל זה מסתיים תוך שעתיים.",
    orderColumns: ["הזמנה", "סטטוס"],
    orderStatus: { Rejected: "נדחה", Active: "פעיל" },
    port: (id) => `ניוד ${ltr(id)}`,
    tempSim: "SIM זמני",
    team: "Northline Mobile · תמיכה",
    wants: `להעביר את ${ltr("07700 900123")} מ־Vireo לפני העבודה מחר.`,
    tried: [
      "בדיקת הניוד: נדחה, PIN לא תואם",
      "שליחה מחדש עם ה־PIN של הלקוחה: נדחה שוב",
      "המספר הזמני נשאר פעיל",
    ],
    suggestions: [
      [
        "לבקש את קוד הניוד",
        "אפשר לבדוק בחשבונית האחרונה של Vireo אם יש קוד ניוד בן 6 ספרות? בחשבונות עסקיים צריך אותו במקום ה־PIN.",
      ],
      [
        "להציע שיחה משותפת מול Vireo",
        "אם נוח לך, אפשר להתקשר עכשיו ל־Vireo יחד, כשאת על הקו.",
      ],
      [
        "להאריך את המספר הזמני",
        "הארכתי את המספר הזמני שלך ב־7 ימים, כך ששום דבר לא ייתקע מחר.",
      ],
    ],
    since: "לקוחה מאז מרץ 2023",
    notes: [
      ["צריכה את המספר לעבודה עד 09:00 מחר.", "מהצ׳אט · היום"],
      ["מעדיפה צ׳אט על פני שיחות טלפון.", "מהפרופיל"],
      ["המספר רשום על חשבון עסקי ב־Vireo.", "מהבוט · היום"],
    ],
    labels: {
      queue: "תור ההעברות",
      openQueue: "פתיחת התור",
      hideQueue: "הסתרת התור",
      showQueue: "הצגת התור",
      details: "פרטי הלקוח",
      hideDetails: "הסתרת הפרטים",
      showDetails: "הצגת הפרטים",
      holding: (bot) => `השיחה אצל ${bot}`,
      tookOver: (bot) => `לקחת את השיחה מ־${bot}`,
      backWith: (bot) => `השיחה חזרה אל ${bot}`,
      handBack: "החזרה לבוט",
      takeOver: "לקיחת השיחה",
      you: (operator) => `${operator} (אני)`,
      handoff: "העברה",
      summary: (bot) => `הסיכום של ${bot}`,
      tried: (count) => (count === 1 ? "ניסיון אחד" : `${count} ניסיונות`),
      wants: "הבקשה: ",
      draftedBy: (bot) => `טיוטות של ${bot}`,
      replyTo: (firstName) => `תשובה ל־${firstName}…`,
      onTheWay: (_, firstName) => `נמסר ל־${firstName} שנציג בדרך.`,
      answeringAgain: (bot) => `${bot} עונה שוב. אפשר לקחת את השיחה בכל רגע.`,
      handoffs: "העברות",
      waitingCount: (count) => <>{count} ממתינים</>,
      minutes: (count) => <>{count} דק׳</>,
      waiting: "בהמתנה",
      filter: "סינון העברות",
      filters: { all: "הכול", urgent: "דחוף", mine: "שלי" },
      conversations: "שיחות שהועברו",
      urgent: "דחוף",
      nothingHere: "אין כאן כלום",
      noneMine: "עוד לא לקחת שיחות.",
      noneUrgent: "אין שיחות דחופות.",
      customer: "לקוח",
      orders: "הזמנות",
      notes: "הערות",
      close: "סגירה",
      closePane: (pane) => `סגירת ${pane}`,
      thread: {
        conversation: "שיחה",
        today: "היום",
        yesterday: "אתמול",
        unread: "לא נקראו",
        jumpToLatest: "מעבר להודעה האחרונה",
        fresh: (count) => `${count} חדשות`,
      },
      composer: {
        message: "הודעה",
        commands: "פקודות",
        files: "קבצים",
        tokens: (count) => `${ltr(count)} טוקנים`,
        totalTokens: (count) => `+ ${ltr(count)} טוקנים`,
        context: "הקשר",
        remove: (name) => `הסרת ${name}`,
        add: "הוספה",
        addContext: "הוספת הקשר",
        shortcuts: "קבצים · / פקודות",
        stop: "עצירה",
        send: "שליחה",
      },
      suggestions: {
        suggestedPrompts: "הצעות לבקשות",
        suggestedFollowUps: "הצעות להמשך",
        moreSuggestions: "הצעות נוספות",
        loadingSuggestions: "טוען הצעות חדשות",
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
      table: {
        rows: (count) => (count === 1 ? "שורה" : "שורות"),
        copyCsv: "העתקה כ־CSV",
        copiedCsv: "הועתק כ־CSV",
        filter: "סינון שורות",
        clearFilter: "ניקוי החיפוש",
        noMatch: "אין שורות תואמות",
        noMatchDescription: (query) => `אין תוצאות עבור „${query}”.`,
        range: (from, to, total) => `${ltr(`${from}–${to}`)} מתוך ${total}`,
        previousPage: "העמוד הקודם",
        nextPage: "העמוד הבא",
        status: (count, sort) =>
          `${count} שורות${sort ? `, ממוינות לפי ${sort.label} בסדר ${sort.dir === "asc" ? "עולה" : "יורד"}` : ""}`,
      },
      memory: {
        count: (count, total) => (
          <>
            {count} {total === 1 ? "הערה" : "הערות"}
          </>
        ),
        search: "חיפוש",
        searchMemories: "חיפוש בהערות",
        clearSearch: "ניקוי החיפוש",
        scope: "היקף",
        scopes: { all: "הכול", user: "לקוח", project: "פרויקט", session: "שיחה" },
        noMatch: "אין הערות תואמות",
        noMatchHint: "נסו חיפוש או היקף אחר.",
        empty: "עוד לא נשמר כלום",
        emptyHint: "הערות יופיעו ככל שהבוט לומד.",
        footer: "הבוט קורא אותן בתחילת כל שיחה.",
        undo: "ביטול המחיקה",
        forgot: (text) => `"${text}" נמחקה. אפשר לבטל.`,
        restored: "ההערה שוחזרה",
        updated: "ההערה עודכנה",
        editField: "עריכת הערה",
        new: "חדש",
        pinned: "מוצמד",
        editHint: "Enter לשמירה · Esc לביטול",
        edit: (text) => `עריכת "${text}"`,
        forget: (text) => `מחיקת "${text}"`,
      },
      avatar: {
        status: { online: "מחובר", away: "לא ליד המחשב", busy: "עסוק", working: "עובד" },
      },
    },
  },
  ar: {
    intl: "ar",
    handedOff: "حوّل البوت المحادثة",
    thread: [
      `مرحبًا، أنقل رقمي ${ltr("07700 900123")} من Vireo إليكم. مرّ يومان وما زال يظهر قيد الانتظار.`,
      "رفضت Vireo النقل: رمز PIN للحساب لم يتطابق. أعدت إرساله برمز PIN الذي أعطيتني إياه.",
      "يظهر مرفوضًا مرة أخرى. أحتاج هذا الرقم للعمل غدًا!",
      "آسفة، رُفض الطلب للمرة الثانية. سأُدخل زميلًا يستطيع حل الأمر مع Vireo. رقمك المؤقت يبقى فعّالًا في الأثناء.",
    ],
    reasons: {
      port: "رُفض النقل مرتين",
      roaming: "نزاع على التجوال",
      angry: "عميل غاضب",
      unsure: "البوت غير متأكد",
      lost: "جهاز مفقود",
    },
    snippets: {
      luis: `لماذا خُصم مني ${ltr("€38")} للتجوال في النرويج؟ كانت لدي باقة السفر.`,
      tom: "هذه ثالث مرة أسأل فيها عن تاريخ انتهاء عقدي.",
      priya: "هل أحتفظ بشريحة eSIM إذا انتقلت إلى هاتف جديد في عطلة نهاية الأسبوع؟",
      hannah: "أضعت هاتفي في المطار، أرجو إيقاف شريحتي الآن.",
    },
    reply:
      "مرحبًا Dana، أنا Ari من Northline. رقمك مسجّل لدى Vireo على حساب أعمال، لذا يلزم رمز النقل المكوّن من 6 أرقام من آخر فاتورة Vireo، لا رمز PIN. هل يمكنك التحقق؟",
    found: "وجدته في الفاتورة: 482913.",
    resubmitted: "شكرًا! أعدت الإرسال بهذا الرمز. عادةً يكتمل خلال ساعتين.",
    orderColumns: ["الطلب", "الحالة"],
    orderStatus: { Rejected: "مرفوض", Active: "فعّال" },
    port: (id) => `نقل ${ltr(id)}`,
    tempSim: "شريحة مؤقتة",
    team: "Northline Mobile · الدعم",
    wants: `نقل ${ltr("07700 900123")} من Vireo قبل العمل غدًا.`,
    tried: [
      "فحص النقل: مرفوض، رمز PIN غير مطابق",
      "إعادة الإرسال برمز PIN الخاص بالعميلة: رُفض مجددًا",
      "إبقاء الرقم المؤقت فعّالًا",
    ],
    suggestions: [
      [
        "اطلب رمز النقل",
        "هل يمكنك البحث في آخر فاتورة من Vireo عن رمز نقل من 6 أرقام؟ حسابات الأعمال تحتاجه بدل رمز PIN.",
      ],
      [
        "اقترح الاتصال بـVireo معًا",
        "إن كان أسهل لكِ، يمكنني الاتصال بـVireo الآن وأنتِ على الخط.",
      ],
      ["مدّد الرقم المؤقت", "مدّدت رقمك المؤقت 7 أيام، فلن يتوقف شيء غدًا."],
    ],
    since: "عميلة منذ مارس 2023",
    notes: [
      ["تحتاج الرقم للعمل بحلول 09:00 غدًا.", "من المحادثة · اليوم"],
      ["تفضّل المحادثة على المكالمات الهاتفية.", "من الملف الشخصي"],
      ["الرقم مسجّل على حساب أعمال لدى Vireo.", "من البوت · اليوم"],
    ],
    labels: {
      queue: "قائمة التحويلات",
      openQueue: "فتح القائمة",
      hideQueue: "إخفاء القائمة",
      showQueue: "إظهار القائمة",
      details: "تفاصيل العميل",
      hideDetails: "إخفاء التفاصيل",
      showDetails: "إظهار التفاصيل",
      holding: (bot) => `المحادثة مع ${bot}`,
      tookOver: (bot) => `استلمت المحادثة من ${bot}`,
      backWith: (bot) => `عادت المحادثة إلى ${bot}`,
      handBack: "إعادة إلى البوت",
      takeOver: "استلام المحادثة",
      you: (operator) => `${operator} (أنت)`,
      handoff: "تحويل",
      summary: (bot) => `ملخص ${bot}`,
      tried: (count) =>
        arabicPlural(
          count,
          "محاولة واحدة",
          "محاولتان",
          `${count} محاولات`,
          `${count} محاولة`,
        ),
      wants: "الطلب: ",
      draftedBy: (bot) => `مسودات من ${bot}`,
      replyTo: (firstName) => `الرد على ${firstName}…`,
      onTheWay: (_, firstName) => `تم إبلاغ ${firstName} بأن موظفًا في الطريق.`,
      answeringAgain: (bot) => `الردود الآن من ${bot}. يمكنك استلام المحادثة في أي وقت.`,
      handoffs: "التحويلات",
      waitingCount: (count) => <>{count} في الانتظار</>,
      minutes: (count) => <>{count} د</>,
      waiting: "في الانتظار",
      filter: "تصفية التحويلات",
      filters: { all: "الكل", urgent: "عاجلة", mine: "لي" },
      conversations: "المحادثات المحوّلة",
      urgent: "عاجل",
      nothingHere: "لا شيء هنا",
      noneMine: "لم تستلم أي محادثة بعد.",
      noneUrgent: "لا محادثات عاجلة.",
      customer: "العميل",
      orders: "الطلبات",
      notes: "الملاحظات",
      close: "إغلاق",
      closePane: (pane) => `إغلاق ${pane}`,
      thread: {
        conversation: "المحادثة",
        today: "اليوم",
        yesterday: "أمس",
        unread: "غير مقروءة",
        jumpToLatest: "الانتقال إلى الأحدث",
        fresh: (count) => `${count} جديدة`,
      },
      composer: {
        message: "الرسالة",
        commands: "الأوامر",
        files: "الملفات",
        tokens: (count) => `${ltr(count)} رمز`,
        totalTokens: (count) => `+ ${ltr(count)} رمز`,
        context: "السياق",
        remove: (name) => `إزالة ${name}`,
        add: "إضافة",
        addContext: "إضافة سياق",
        shortcuts: "الملفات · / الأوامر",
        stop: "إيقاف",
        send: "إرسال",
      },
      suggestions: {
        suggestedPrompts: "اقتراحات للطلبات",
        suggestedFollowUps: "اقتراحات للمتابعة",
        moreSuggestions: "مزيد من الاقتراحات",
        loadingSuggestions: "جارٍ تحميل اقتراحات جديدة",
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
      table: {
        rows: (count) => arabicPlural(count, "صف", "صفوف", "صفوف", "صفًا"),
        copyCsv: "نسخ بصيغة CSV",
        copiedCsv: "تم النسخ بصيغة CSV",
        filter: "تصفية الصفوف",
        clearFilter: "مسح البحث",
        noMatch: "لا توجد صفوف مطابقة",
        noMatchDescription: (query) => `لا شيء يطابق «${query}».`,
        range: (from, to, total) => `${ltr(`${from}–${to}`)} من ${total}`,
        previousPage: "الصفحة السابقة",
        nextPage: "الصفحة التالية",
        status: (count, sort) =>
          `${count} ${arabicPlural(count, "صف", "صفوف", "صفوف", "صفًا")}${sort ? `، مرتبة حسب ${sort.label} ${sort.dir === "asc" ? "تصاعديًا" : "تنازليًا"}` : ""}`,
      },
      memory: {
        count: (count, total) => (
          <>
            {count} {arabicPlural(total, "ملاحظة", "ملاحظتان", "ملاحظات", "ملاحظة")}
          </>
        ),
        search: "بحث",
        searchMemories: "البحث في الملاحظات",
        clearSearch: "مسح البحث",
        scope: "النطاق",
        scopes: { all: "الكل", user: "العميل", project: "المشروع", session: "المحادثة" },
        noMatch: "لا ملاحظات مطابقة",
        noMatchHint: "جرّب بحثًا أو نطاقًا آخر.",
        empty: "لا شيء محفوظ بعد",
        emptyHint: "تظهر الملاحظات كلما تعلّم البوت.",
        footer: "يقرأ البوت هذه الملاحظات في بداية كل محادثة.",
        undo: "تراجع عن الحذف",
        forgot: (text) => `حُذفت «${text}». يمكنك التراجع.`,
        restored: "استُعيدت الملاحظة",
        updated: "حُدّثت الملاحظة",
        editField: "تعديل الملاحظة",
        new: "جديدة",
        pinned: "مثبّتة",
        editHint: "Enter للحفظ · Esc للإلغاء",
        edit: (text) => `تعديل «${text}»`,
        forget: (text) => `حذف «${text}»`,
      },
      avatar: {
        status: { online: "متصل", away: "بعيد", busy: "مشغول", working: "يعمل" },
      },
    },
  },
};

// Fixed times so the prerendered thread matches the browser.
const at = (minute: number) => `2026-11-03T13:${String(minute).padStart(2, "0")}:00Z`;

const handoff = (t: Copy, reason: string): React.ReactNode => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning">
    <ArrowsLeftRight weight="bold" aria-hidden="true" className="size-3.5" />
    {t.handedOff} · {reason}
  </span>
);

const threadFor = (t: Copy): HandoffMessage[] => [
  { id: "m1", from: "customer", at: at(41), content: t.thread[0] },
  { id: "m2", from: "bot", at: at(41), content: t.thread[1] },
  { id: "m3", from: "customer", at: at(46), content: t.thread[2] },
  { id: "m4", from: "bot", at: at(47), content: t.thread[3] },
  { id: "h1", from: "handoff", at: at(47), content: handoff(t, t.reasons.port) },
];

const queueFor = (t: Copy): Escalation[] => [
  {
    id: "dana",
    customer: { name: "Dana Okafor" },
    snippet: t.thread[2],
    reason: t.reasons.port,
    tone: "warning",
    urgent: true,
    waiting: 6,
  },
  {
    id: "luis",
    customer: { name: "Luis Ortega" },
    snippet: t.snippets.luis,
    reason: t.reasons.roaming,
    tone: "warning",
    waiting: 11,
  },
  {
    id: "tom",
    customer: { name: "Tom Becker" },
    snippet: t.snippets.tom,
    reason: t.reasons.angry,
    tone: "negative",
    urgent: true,
    waiting: 14,
    assignee: "ari",
  },
  {
    id: "priya",
    customer: { name: "Priya Raman" },
    snippet: t.snippets.priya,
    reason: t.reasons.unsure,
    tone: "brand",
    waiting: 3,
  },
];

const arrivalFor = (t: Copy): Escalation => ({
  id: "hannah",
  customer: { name: "Hannah Weiss" },
  snippet: t.snippets.hannah,
  reason: t.reasons.lost,
  tone: "negative",
  urgent: true,
  waiting: 0,
});

const calls: ToolCall[] = [
  {
    id: "c1",
    name: "telco.port_status",
    args: { msisdn: "07700900123", donor: "vireo" },
    status: "success",
    durationMs: 640,
    result: { status: "rejected", reason: "PIN_MISMATCH", attempts: 2 },
  },
  {
    id: "c2",
    name: "telco.port_submit",
    args: { msisdn: "07700900123", pin: "••••" },
    status: "error",
    durationMs: 1_210,
    error: "Rejected by donor carrier: PIN_MISMATCH",
  },
];

const orderColumnsFor = (t: Copy): DataColumn[] => [
  { key: "item", label: t.orderColumns[0] },
  {
    key: "status",
    label: t.orderColumns[1],
    format: (value) => (
      <StatusPill
        size="sm"
        tone={
          value === "Rejected" ? "negative" : value === "Active" ? "positive" : "neutral"
        }
      >
        {t.orderStatus[value as keyof Copy["orderStatus"]] ?? String(value)}
      </StatusPill>
    ),
  },
];

const ordersFor = (t: Copy): DataRow[] => [
  { id: "o1", item: t.port("P-2291"), status: "Rejected" },
  { id: "o2", item: t.port("P-2287"), status: "Rejected" },
  { id: "o3", item: t.tempSim, status: "Active" },
  { id: "o4", item: "Business Unlimited", status: "Active" },
];

type State = {
  queue: Escalation[];
  messages: HandoffMessage[];
  status: HandoffStatus;
  draft: string;
};

const tick = (s: State): State => ({
  ...s,
  queue: s.queue.map((e) => ({ ...e, waiting: e.waiting + 1 })),
});

const type = (text: string): MockStep<State>[] =>
  Array.from({ length: Math.ceil(text.length / 4) }, (_, i) => ({
    delay: 40,
    apply: (s: State) => ({ ...s, draft: text.slice(0, (i + 1) * 4) }),
  }));

const add = (message: HandoffMessage) => (s: State) => ({
  ...s,
  messages: [...s.messages, message],
});

// A new escalation lands on top while the queue keeps counting.
const inboxScript = (t: Copy): MockStep<State>[] => [
  wait(1800),
  { delay: 0, apply: (s) => ({ ...s, queue: [arrivalFor(t), ...s.queue] }) },
  { delay: 2600, apply: tick },
  { delay: 3000, apply: tick },
];

// Ari has taken over: types a reply, the customer answers, Ari hands back.
const takeoverScript = (t: Copy): MockStep<State>[] => [
  wait(1200),
  ...type(t.reply),
  wait(500),
  {
    delay: 0,
    apply: (s) => ({
      ...add({ id: "r1", from: "operator", at: at(55), content: t.reply })(s),
      draft: "",
    }),
  },
  {
    delay: 2200,
    apply: add({ id: "r2", from: "customer", at: at(57), content: t.found }),
  },
  { delay: 1400, apply: tick },
  ...type(t.resubmitted),
  wait(400),
  {
    delay: 0,
    apply: (s) => ({
      ...add({ id: "r3", from: "operator", at: at(58), content: t.resubmitted })(s),
      draft: "",
    }),
  },
  { delay: 1600, apply: (s) => ({ ...s, status: "returned" }) },
];

export default function HandoffInboxDemo({
  variant,
  locale = "en",
  autoplay = true,
}: {
  variant?: string;
  locale?: DemoLocale;
  autoplay?: boolean;
}) {
  const t = copy[locale];
  const takeover = variant === "Takeover";
  const queue = queueFor(t);
  const { state, setState } = useMockRun<State>(
    {
      queue: takeover
        ? queue.map((e) => (e.id === "dana" ? { ...e, assignee: "ari" } : e))
        : queue,
      messages: threadFor(t),
      status: takeover ? "active" : "waiting",
      draft: "",
    },
    takeover ? takeoverScript(t) : inboxScript(t),
    { autoplay },
  );

  const data: HandoffInboxData = {
    team: t.team,
    operator: { id: "ari", name: "Ari Novak" },
    bot: { name: "Nora" },
    queue: state.queue,
    activeId: "dana",
    messages: state.messages,
    summary: { wants: t.wants, tried: t.tried, calls },
    suggestions: t.suggestions.map(([title, prompt], i) => ({
      id: `s${i + 1}`,
      title,
      prompt,
    })),
    customer: {
      name: "Dana Okafor",
      plan: "Business Unlimited",
      since: t.since,
      orders: ordersFor(t),
      orderColumns: orderColumnsFor(t),
      notes: [
        { id: "n1", text: t.notes[0][0], scope: "session", source: t.notes[0][1] },
        {
          id: "n2",
          text: t.notes[1][0],
          scope: "user",
          source: t.notes[1][1],
          pinned: true,
        },
        {
          id: "n3",
          text: t.notes[2][0],
          scope: "user",
          source: t.notes[2][1],
          isNew: true,
        },
      ],
    },
  };

  return (
    <HandoffInbox
      data={data}
      status={state.status}
      draft={state.draft}
      labels={t.labels}
      locale={t.intl}
      onDraftChange={(draft) => setState((s) => ({ ...s, draft }))}
      onTakeOver={() =>
        setState((s) => ({
          ...s,
          status: "active",
          queue: s.queue.map((e) => (e.id === "dana" ? { ...e, assignee: "ari" } : e)),
        }))
      }
      onHandBack={() => setState((s) => ({ ...s, status: "returned" }))}
      onSend={(text) =>
        setState((s) =>
          add({
            id: `o${s.messages.length}`,
            from: "operator",
            at: at(59),
            content: text,
          })(s),
        )
      }
    />
  );
}
