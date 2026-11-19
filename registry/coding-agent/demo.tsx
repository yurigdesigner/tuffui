"use client";

import { useState } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import type { AgentStatusData } from "@/components/ui/agent-status";
import type { Checkpoint } from "@/components/ui/checkpoint-timeline";
import type { FileChange } from "@/components/ui/file-changes";
import {
  StreamingMessage,
  type StreamingMessageLabels,
} from "@/components/ui/streaming-message";
import type { TerminalLine, TerminalRun } from "@/components/ui/terminal-output";
import {
  ToolApprovalQueue,
  type ToolApprovalQueueLabels,
  type ToolApprovalRequest,
} from "@/components/ui/tool-approval-queue";
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
import {
  CodingAgent,
  type CodingAgentData,
  type CodingAgentLabels,
  type WorkTab,
} from "./coding-agent";

/** Keeps a Latin name or a number run in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

const arCount = (n: number, one: string, two: string, few: string, many: string) =>
  n === 1 ? one : n === 2 ? two : n >= 3 && n <= 10 ? few : many;

type Copy = {
  /** Intl locale for message times. */
  locale?: string;
  title: string;
  task: string;
  note: string;
  summary: string;
  activity: Record<
    "reading" | "tokens" | "writing" | "switch" | "saving" | "waiting" | "testing",
    string
  >;
  approval: string;
  checkpoints: [string, string, string, string];
  ago: (minutes: number) => string;
  preview: {
    settings: string;
    appearance: string;
    theme: string;
    /** System, Light, Dark. */
    options: [string, string, string];
    darkOn: string;
    follows: string;
    reduceMotion: string;
    off: string;
    textSize: string;
    textDefault: string;
  };
  labels?: Partial<CodingAgentLabels>;
  toolCall?: Partial<ToolCallBlockLabels>;
  message?: Partial<StreamingMessageLabels>;
  approvals?: Partial<ToolApprovalQueueLabels>;
};

// An agent adding dark mode to a settings page. Code, paths and terminal output stay
// as they are in every language.
const copy: Record<DemoLocale, Copy> = {
  en: {
    title: "Dark mode for Settings",
    task: "Add dark mode to Settings → Appearance. Follow the system theme by default and remember the choice.",
    note: "The page already reads colors from CSS variables, so dark mode is a second set of tokens plus a three-way switch. I'll keep System as the default and store the choice in localStorage.",
    summary:
      "Done. Appearance now has System, Light and Dark; System follows the OS and updates live, and the choice survives reloads. Six tests pass — review the three files in Changes and apply when you're happy.",
    activity: {
      reading: "Reading the settings page",
      tokens: "Finding color tokens",
      writing: "Writing dark tokens",
      switch: "Building the theme switch",
      saving: "Saving the choice",
      waiting: "Waiting for approval",
      testing: "Running the tests",
    },
    approval: "Run the settings tests",
    checkpoints: [
      "Read the settings page",
      "Add dark tokens",
      "Build the theme switch",
      "Remember the choice",
    ],
    ago: (minutes) => `${minutes}m ago`,
    preview: {
      settings: "Settings",
      appearance: "Appearance",
      theme: "Theme",
      options: ["System", "Light", "Dark"],
      darkOn: "Dark is on. Switch back any time.",
      follows: "Follows your system until you pick one.",
      reduceMotion: "Reduce motion",
      off: "Off",
      textSize: "Text size",
      textDefault: "Default",
    },
  },
  he: {
    locale: "he-IL",
    title: "מצב כהה להגדרות",
    task: "תוסיף מצב כהה למסך הגדרות ← מראה. כברירת מחדל שיעקוב אחרי ערכת הנושא של המערכת, ושיזכור את הבחירה.",
    note: "הדף כבר לוקח את הצבעים ממשתני CSS, אז מצב כהה הוא פשוט סט שני של טוקנים ומתג עם שלוש אפשרויות. אשאיר את ״מערכת״ כברירת מחדל ואשמור את הבחירה ב־localStorage.",
    summary:
      "סיימתי. במסך ״מראה״ יש עכשיו מערכת, בהיר וכהה: ״מערכת״ עוקב אחרי מערכת ההפעלה ומתעדכן מיד, והבחירה נשמרת גם אחרי רענון. שש בדיקות עוברות — עברו על שלושת הקבצים בלשונית ״שינויים״ והחילו כשנוח לכם.",
    activity: {
      reading: "קורא את דף ההגדרות",
      tokens: "מחפש את טוקני הצבע",
      writing: "כותב טוקנים למצב כהה",
      switch: "בונה את מתג ערכת הנושא",
      saving: "שומר את הבחירה",
      waiting: "ממתין לאישור",
      testing: "מריץ את הבדיקות",
    },
    approval: "הרצת הבדיקות של ההגדרות",
    checkpoints: [
      "קריאת דף ההגדרות",
      "הוספת טוקנים כהים",
      "בניית מתג ערכת הנושא",
      "שמירת הבחירה",
    ],
    ago: (minutes) => `לפני ${minutes} דק׳`,
    preview: {
      settings: "הגדרות",
      appearance: "מראה",
      theme: "ערכת נושא",
      options: ["מערכת", "בהיר", "כהה"],
      darkOn: "מצב כהה פעיל. אפשר לחזור בכל רגע.",
      follows: "עוקב אחרי המערכת עד שתבחרו אחרת.",
      reduceMotion: "הפחתת תנועה",
      off: "כבוי",
      textSize: "גודל טקסט",
      textDefault: "ברירת מחדל",
    },
    labels: {
      showChat: "הצגת הצ׳אט",
      hideChat: "הסתרת הצ׳אט",
      showWork: "הצגת פאנל העבודה",
      hideWork: "הסתרת פאנל העבודה",
      show: "תצוגה",
      panes: {
        chat: "צ׳אט",
        changes: "שינויים",
        terminal: "טרמינל",
        preview: "תצוגה מקדימה",
      },
      conversation: "שיחה",
      work: "עבודה",
      askForChange: "בקשו שינוי…",
      followUp: "הוסיפו המשך…",
      noChanges: "עוד אין שינויים. קבצים שהסוכן עורך יופיעו כאן.",
      thread: {
        conversation: "שיחה",
        today: "היום",
        yesterday: "אתמול",
        unread: "לא נקראו",
        jumpToLatest: "מעבר להודעה האחרונה",
        fresh: (count) => `${count} חדשות`,
      },
      activity: {
        region: "סטטוס הסוכן",
        steps: "שלבים שהסתיימו",
        stepDone: "הסתיים",
        done: "הסתיים",
        stopped: "נעצר",
        failed: "נכשל",
        stop: "עצירה",
        stopAgent: "עצירת הסוכן",
      },
      composer: {
        modes: {
          ask: { label: "שאלה", hint: "עונה על שאלות, לא משנה כלום" },
          plan: { label: "תכנון", hint: "מכין תוכנית לאישור שלך" },
          act: { label: "ביצוע", hint: "יכול לערוך קבצים ולהריץ פקודות" },
        },
        mode: "מצב",
        placeholder: "תארו את השינוי, @ להוספת קבצים, / לפקודות",
        followUp: "הוסיפו המשך — הוא ירוץ כשהסוכן יסיים",
        message: "הודעה",
        commands: "פקודות",
        files: "קבצים",
        switchModel: (model) => `מודל: ${model}. החלפת מודל`,
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
      checkpoints: {
        title: "נקודות שמירה",
        turns: (n) => `${n} סבבים`,
        files: (n) => (n === 1 ? "קובץ 1" : `${n} קבצים`),
        tick: (n, label, files, at) =>
          `נקודת שמירה ${n}: ${label}, ${files} קבצים שונו, ${at}`,
        panel: (n) => `נקודת שמירה ${n}`,
        heading: (n) => <>נקודת שמירה {n}</>,
        current: "נוכחית",
        noFiles: "בסבב הזה לא שונו קבצים",
        atCheckpoint: (n) => `בנקודת שמירה ${n}`,
        position: (n, total) => (
          <>
            נקודה {n} מתוך {total}
          </>
        ),
        previous: "נקודת השמירה הקודמת",
        next: "נקודת השמירה הבאה",
        drops: (n) =>
          n === 1 ? "נקודת שמירה אחת מאוחרת תימחק" : `${n} נקודות שמירה מאוחרות יימחקו`,
        cancel: "ביטול",
        restore: "שחזור",
        restoreHere: "שחזור לנקודה הזו",
        currentState: "המצב הנוכחי",
        restored: (n, label) => `שוחזר לנקודת שמירה ${n}: ${label}`,
      },
      files: {
        status: { added: "נוסף", modified: "שונה", deleted: "נמחק", renamed: "שונה שם" },
        line: (n) => `שורה ${n}`,
        reverted: "בוטל",
        hunk: (n) => `שורות החל מ־${n}`,
        keepOrRevert: "לשמור או לבטל את הקטע",
        keep: "לשמור",
        revert: "לבטל",
        added: "נוסף: ",
        removed: "הוסר: ",
        root: "תיקיית השורש",
        from: (path) => `לשעבר ${path}`,
        files: "קבצים ששונו",
        region: "שינויים בקבצים",
        empty: "אין שינויים לבדיקה",
        kept: "הקטע נשמר",
        revertedStatus: "הקטע בוטל",
        applyingStatus: (kept, total) => `מחילים ${kept} מתוך ${total} קטעים`,
        summary: (kept, total, files, roll) => (
          <>
            יוחלו {roll(String(kept), true)} מתוך {roll(String(total), true)} קטעים ב־
            {roll(String(files))} {files === 1 ? "קובץ" : "קבצים"}
          </>
        ),
        discard: "לבטל הכול",
        apply: "החלה",
        applying: "מחילים…",
      },
      terminal: {
        running: "רץ",
        exit: (code) => `קוד יציאה ${code}`,
        region: (command) => `טרמינל: ${command}`,
        output: (command) => `הפלט של ${command}`,
        waiting: "ממתין לפלט…",
        error: "שגיאה: ",
        jump: "לשורה האחרונה",
        lines: (n, count) => (count === 1 ? <>שורה {n}</> : <>{n} שורות</>),
        copy: "העתקה",
        copied: "הועתק",
        stop: "עצירה",
        finished: (command, success, code, time) =>
          `${command} ${success ? "הסתיים" : "נכשל"} עם קוד יציאה ${code} אחרי ${time}`,
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
    message: {
      messageFrom: (model) => `הודעה מ־${model}`,
      responding: "עונה…",
      thinking: "חושב…",
      thoughtFor: (seconds) => `חשב ${seconds} שניות`,
      sources: "מקורות",
      source: (index, title, site) => `מקור ${index}: ${title} (${site})`,
      interrupted: "התשובה נקטעה.",
      genericError: "משהו השתבש.",
      retry: "ניסיון חוזר",
      regenerate: "יצירת תשובה מחדש",
      copy: "העתקת ההודעה",
      copied: "הועתק",
      complete: "התשובה הושלמה",
      failed: "התשובה נכשלה",
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
  },
  ar: {
    locale: "ar",
    title: "الوضع الداكن للإعدادات",
    task: "أضف الوضع الداكن إلى الإعدادات ← المظهر. اجعله يتبع سمة النظام افتراضيًا، وتذكّر الاختيار.",
    note: "الصفحة تأخذ ألوانها من متغيرات CSS أصلًا، لذا فالوضع الداكن مجرد مجموعة ثانية من قيم الألوان ومفتاح بثلاثة خيارات. سأُبقي «النظام» خيارًا افتراضيًا وأحفظ الاختيار في localStorage.",
    summary:
      "تم. أصبح في «المظهر» ثلاثة خيارات: النظام والفاتح والداكن؛ «النظام» يتبع نظام التشغيل ويتحدّث فورًا، ويبقى الاختيار محفوظًا بعد إعادة التحميل. نجحت ستة اختبارات — راجع الملفات الثلاثة في «التغييرات» وطبّقها حين تكون جاهزًا.",
    activity: {
      reading: "يقرأ صفحة الإعدادات",
      tokens: "يبحث عن متغيرات الألوان",
      writing: "يكتب ألوان الوضع الداكن",
      switch: "يبني مفتاح السمة",
      saving: "يحفظ الاختيار",
      waiting: "بانتظار الموافقة",
      testing: "يشغّل الاختبارات",
    },
    approval: "تشغيل اختبارات الإعدادات",
    checkpoints: [
      "قراءة صفحة الإعدادات",
      "إضافة ألوان داكنة",
      "بناء مفتاح السمة",
      "تذكّر الاختيار",
    ],
    ago: (minutes) =>
      `قبل ${minutes} ${arCount(minutes, "دقيقة", "دقيقتين", "دقائق", "دقيقة")}`,
    preview: {
      settings: "الإعدادات",
      appearance: "المظهر",
      theme: "السمة",
      options: ["النظام", "فاتح", "داكن"],
      darkOn: "الوضع الداكن مفعّل. يمكنك العودة في أي وقت.",
      follows: "يتبع نظامك إلى أن تختار غيره.",
      reduceMotion: "تقليل الحركة",
      off: "متوقف",
      textSize: "حجم النص",
      textDefault: "افتراضي",
    },
    labels: {
      showChat: "إظهار المحادثة",
      hideChat: "إخفاء المحادثة",
      showWork: "إظهار لوحة العمل",
      hideWork: "إخفاء لوحة العمل",
      show: "عرض",
      panes: {
        chat: "المحادثة",
        changes: "التغييرات",
        terminal: "الطرفية",
        preview: "المعاينة",
      },
      conversation: "المحادثة",
      work: "العمل",
      askForChange: "اطلب تغييرًا…",
      followUp: "أضف متابعة…",
      noChanges: "لا تغييرات بعد. ستظهر هنا الملفات التي يعدّلها الوكيل.",
      thread: {
        conversation: "المحادثة",
        today: "اليوم",
        yesterday: "أمس",
        unread: "غير مقروءة",
        jumpToLatest: "الانتقال إلى الأحدث",
        fresh: (count) => `${count} جديدة`,
      },
      activity: {
        region: "حالة الوكيل",
        steps: "الخطوات المكتملة",
        stepDone: "اكتملت",
        done: "تم",
        stopped: "توقّف",
        failed: "فشل",
        stop: "إيقاف",
        stopAgent: "إيقاف الوكيل",
      },
      composer: {
        modes: {
          ask: { label: "سؤال", hint: "يجيب عن الأسئلة ولا يغيّر شيئًا" },
          plan: { label: "تخطيط", hint: "يُعدّ خطة لتوافق عليها" },
          act: { label: "تنفيذ", hint: "يستطيع تعديل الملفات وتشغيل الأوامر" },
        },
        mode: "الوضع",
        placeholder: "صِف التغيير، @ لإضافة ملفات، / للأوامر",
        followUp: "أضف متابعة، وستُنفَّذ عندما ينتهي الوكيل",
        message: "الرسالة",
        commands: "الأوامر",
        files: "الملفات",
        switchModel: (model) => `النموذج: ${model}. تبديل النموذج`,
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
      checkpoints: {
        title: "نقاط الاستعادة",
        turns: (n) => `${n} ${arCount(n, "دور", "أدوار", "أدوار", "دورًا")}`,
        files: (n) => `${n} ${arCount(n, "ملف", "ملفات", "ملفات", "ملفًا")}`,
        tick: (n, label, files, at) =>
          `نقطة ${n}: ${label}، ملفات معدّلة: ${files}، ${at}`,
        panel: (n) => `نقطة الاستعادة ${n}`,
        heading: (n) => <>نقطة الاستعادة {n}</>,
        current: "الحالية",
        noFiles: "لم تتغير أي ملفات في هذا الدور",
        atCheckpoint: (n) => `عند النقطة ${n}`,
        position: (n, total) => (
          <>
            النقطة {n} من {total}
          </>
        ),
        previous: "النقطة السابقة",
        next: "النقطة التالية",
        drops: (n) =>
          n === 1
            ? "ستُحذف نقطة لاحقة واحدة"
            : n === 2
              ? "ستُحذف نقطتان لاحقتان"
              : n <= 10
                ? `ستُحذف ${n} نقاط لاحقة`
                : `ستُحذف ${n} نقطة لاحقة`,
        cancel: "إلغاء",
        restore: "استعادة",
        restoreHere: "الاستعادة إلى هنا",
        currentState: "الحالة الحالية",
        restored: (n, label) => `تمت الاستعادة إلى النقطة ${n}: ${label}`,
      },
      files: {
        status: {
          added: "مُضاف",
          modified: "مُعدَّل",
          deleted: "محذوف",
          renamed: "مُعاد تسميته",
        },
        line: (n) => `السطر ${n}`,
        reverted: "تم التراجع",
        hunk: (n) => `الأسطر بدءًا من ${n}`,
        keepOrRevert: "الإبقاء على هذا المقطع أو التراجع عنه",
        keep: "إبقاء",
        revert: "تراجع",
        added: "مُضاف: ",
        removed: "محذوف: ",
        root: "الجذر",
        from: (path) => `سابقًا ${path}`,
        files: "الملفات المعدّلة",
        region: "تغييرات الملفات",
        empty: "لا توجد تغييرات للمراجعة",
        kept: "تم الإبقاء على المقطع",
        revertedStatus: "تم التراجع عن المقطع",
        applyingStatus: (kept, total) =>
          `جارٍ تطبيق ${kept} من ${total} ${arCount(total, "مقطع", "مقاطع", "مقاطع", "مقطعًا")}`,
        summary: (kept, total, files, roll) => (
          <>
            سيُطبَّق {roll(String(kept), true)} من {roll(String(total), true)}{" "}
            {arCount(total, "مقطع", "مقاطع", "مقاطع", "مقطعًا")} في {roll(String(files))}{" "}
            {arCount(files, "ملف", "ملفات", "ملفات", "ملفًا")}
          </>
        ),
        discard: "تجاهل الكل",
        apply: "تطبيق",
        applying: "جارٍ التطبيق…",
      },
      terminal: {
        running: "قيد التشغيل",
        exit: (code) => `رمز الخروج ${code}`,
        region: (command) => `الطرفية: ${command}`,
        output: (command) => `مخرجات ${command}`,
        waiting: "في انتظار المخرجات…",
        error: "خطأ: ",
        jump: "الانتقال إلى الأحدث",
        lines: (n, count) => (
          <>
            {n} {arCount(count, "سطر", "أسطر", "أسطر", "سطرًا")}
          </>
        ),
        copy: "نسخ",
        copied: "تم النسخ",
        stop: "إيقاف",
        finished: (command, success, code, time) =>
          `${success ? "اكتمل" : "فشل"} ${command} برمز الخروج ${code} بعد ${time}`,
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
    message: {
      messageFrom: (model) => `رسالة من ${model}`,
      responding: "يكتب الرد…",
      thinking: "يفكّر…",
      thoughtFor: (seconds) =>
        `فكّر ${seconds === 1 ? "ثانية واحدة" : seconds === 2 ? "ثانيتين" : seconds <= 10 ? `${seconds} ثوانٍ` : `${seconds} ثانية`}`,
      sources: "المصادر",
      source: (index, title, site) => `المصدر ${index}: ${title} (${site})`,
      interrupted: "انقطع الرد.",
      genericError: "حدث خطأ ما.",
      retry: "إعادة المحاولة",
      regenerate: "إعادة توليد الرد",
      copy: "نسخ الرسالة",
      copied: "تم النسخ",
      complete: "اكتمل الرد",
      failed: "تعذّر الرد",
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
  },
};

type Phase = "plan" | "note" | "approval" | "testing" | "summary" | "done";

type State = {
  calls: ToolCall[];
  note: string;
  approval?: ToolApprovalRequest;
  summary: string;
  files: FileChange[];
  lines: TerminalLine[];
  testStatus: TerminalRun["status"];
  dark: boolean;
  checkpoints: Checkpoint[];
  activity?: Omit<AgentStatusData, "startedAt">;
  tab: WorkTab;
  phase: Phase;
};

const call = (
  id: string,
  name: string,
  args: Record<string, unknown>,
  done: boolean,
  result?: ToolCall["result"],
  durationMs?: number,
): ToolCall => ({
  id,
  name,
  args,
  status: done ? "success" : "running",
  result: done ? result : undefined,
  durationMs: done ? durationMs : undefined,
});

const themeFile: FileChange = {
  id: "theme",
  path: "src/theme.ts",
  status: "added",
  hunks: [
    {
      id: "type",
      oldStart: 0,
      newStart: 1,
      lines: [
        { type: "add", text: "export type Theme =" },
        { type: "add", text: '  "system" | "light" | "dark";' },
        { type: "add", text: "" },
        { type: "add", text: "export function apply(t: Theme) {" },
        { type: "add", text: '  const dark = t === "dark" ||' },
        { type: "add", text: '    (t === "system" && osDark());' },
        { type: "add", text: "  root.classList.toggle(" },
        { type: "add", text: '    "dark", dark);' },
        { type: "add", text: "}" },
      ],
    },
  ],
};

const appearanceFile: FileChange = {
  id: "appearance",
  path: "src/settings/appearance.tsx",
  status: "modified",
  hunks: [
    {
      id: "import",
      oldStart: 1,
      newStart: 1,
      lines: [
        { type: "context", text: 'import { Row } from "./row";' },
        { type: "add", text: 'import { apply } from "../theme";' },
      ],
    },
    {
      id: "switch",
      oldStart: 14,
      newStart: 15,
      lines: [
        { type: "remove", text: '<Row label="Theme">Light</Row>' },
        { type: "add", text: '<Row label="Theme">' },
        { type: "add", text: "  <ThemeSwitch" },
        { type: "add", text: "    value={theme}" },
        { type: "add", text: "    onChange={save} />" },
        { type: "add", text: "</Row>" },
      ],
    },
  ],
};

const testFile: FileChange = {
  id: "test",
  path: "src/settings/theme.test.ts",
  status: "added",
  hunks: [
    {
      id: "cases",
      oldStart: 0,
      newStart: 1,
      lines: [
        { type: "add", text: 'test("follows the OS", () => {' },
        { type: "add", text: '  mockOS("dark");' },
        { type: "add", text: '  apply("system");' },
        { type: "add", text: "  expect(isDark()).toBe(true);" },
        { type: "add", text: "});" },
      ],
    },
  ],
};

const testOutput: TerminalLine[] = [
  { text: "> web@3.2.0 test settings", stream: "info" },
  { text: "" },
  { text: " RUN  v3.2.4 /repo/apps/web", stream: "info" },
  { text: " ✓ theme.test.ts > follows the OS" },
  { text: " ✓ theme.test.ts > light overrides OS" },
  { text: " ✓ theme.test.ts > dark overrides OS" },
  { text: " ✓ theme.test.ts > updates on OS change" },
  { text: " ✓ appearance.test.tsx > saves choice" },
  { text: " ✓ appearance.test.tsx > restores choice" },
  { text: "" },
  { text: " Test Files  2 passed (2)" },
  { text: "      Tests  6 passed (6)" },
];

const checkpoint = (text: Copy, n: number, files: Checkpoint["files"]): Checkpoint => ({
  id: `cp${n}`,
  label: text.checkpoints[n - 1],
  at: text.ago(12 - n),
  files,
});

const approval = (
  text: Copy,
  status: ToolApprovalRequest["status"],
): ToolApprovalRequest => ({
  id: "tests",
  tool: "bash",
  title: text.approval,
  risk: "low",
  agent: "coding-agent",
  status,
  scope: status === "approved" ? "once" : undefined,
  payload: { kind: "shell", command: "pnpm test settings", cwd: "~/web" },
});

const initial = (text: Copy): State => ({
  calls: [],
  note: "",
  summary: "",
  files: [],
  lines: [],
  testStatus: "running",
  dark: false,
  checkpoints: [],
  activity: {
    label: text.activity.reading,
    detail: "src/settings/",
    status: "working",
  },
  tab: "changes",
  phase: "plan",
});

const set = (
  patch: Partial<State> | ((s: State) => Partial<State>),
): MockStep<State> => ({
  delay: 0,
  apply: (s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }),
});

const activity = (label: string, detail?: string) =>
  set({ activity: { label, detail, status: "working" } });

const readCalls = [
  call("read", "fs.read", { path: "src/settings/appearance.tsx" }, true, "54 lines", 180),
  call(
    "grep",
    "code.search",
    { query: "var(--color-", in: "src/" },
    true,
    { matches: 38 },
    420,
  ),
];

const script = (text: Copy): MockStep<State>[] => [
  wait(700),
  set({
    calls: [call("read", "fs.read", { path: "src/settings/appearance.tsx" }, false)],
  }),
  wait(900),
  set({ calls: [readCalls[0]] }),
  activity(text.activity.tokens, "var(--color-*)"),
  set((s) => ({
    calls: [
      ...s.calls,
      call("grep", "code.search", { query: "var(--color-", in: "src/" }, false),
    ],
  })),
  wait(1000),
  set({ calls: readCalls, phase: "note" }),
  ...streamText<State>(text.note, (s, note) => ({ ...s, note }), { interval: 18 }),
  activity(text.activity.writing, "src/theme.ts"),
  wait(500),
  set((s) => ({
    files: [themeFile],
    checkpoints: [
      checkpoint(text, 1, []),
      checkpoint(text, 2, [{ path: "src/theme.ts", additions: 9, deletions: 0 }]),
    ],
    tab: "changes",
    dark: s.dark,
  })),
  activity(text.activity.switch, "appearance.tsx"),
  wait(1300),
  set((s) => ({
    files: [themeFile, appearanceFile],
    checkpoints: [
      ...s.checkpoints,
      checkpoint(text, 3, [
        { path: "src/settings/appearance.tsx", additions: 6, deletions: 1 },
      ]),
    ],
    tab: "preview",
    dark: true,
  })),
  activity(text.activity.saving, "localStorage · theme"),
  wait(1300),
  set((s) => ({
    files: [themeFile, appearanceFile, testFile],
    approval: approval(text, "pending"),
    phase: "approval",
    activity: {
      label: text.activity.waiting,
      detail: "pnpm test settings",
      status: "working",
    },
    checkpoints: [
      ...s.checkpoints,
      checkpoint(text, 4, [
        { path: "src/settings/theme.test.ts", additions: 5, deletions: 0 },
      ]),
    ],
  })),
  wait(2400),
  set({ approval: approval(text, "approved"), phase: "testing", tab: "terminal" }),
  activity(text.activity.testing, "vitest · settings"),
  ...testOutput.map((line) => ({
    delay: 260,
    apply: (s: State) => ({ ...s, lines: [...s.lines, line] }),
  })),
  set({
    testStatus: "success",
    phase: "summary",
    activity: undefined,
  }),
  wait(400),
  ...streamText<State>(text.summary, (s, summary) => ({ ...s, summary }), {
    interval: 18,
  }),
  set({ phase: "done", tab: "changes" }),
];

// The finished run, for the Review variant.
const finished = Object.fromEntries(
  Object.entries(copy).map(([locale, text]) => [
    locale,
    script(text).reduce((s, step) => step.apply(s), initial(text)),
  ]),
) as Record<DemoLocale, State>;

function WorkTurn({
  state,
  text,
  onDecide,
}: {
  state: State;
  text: Copy;
  onDecide: () => void;
}) {
  return (
    <div className="flex w-full flex-col gap-3">
      {state.calls.map((c) => (
        <ToolCallBlock
          key={c.id}
          data={c}
          labels={text.toolCall}
          className="max-w-none"
        />
      ))}
      {state.note && (
        <StreamingMessage
          data={{
            content: state.note,
            status: state.phase === "note" ? "streaming" : "done",
          }}
          showHeader={false}
          labels={text.message}
          className="max-w-none"
        />
      )}
      {state.approval?.status === "pending" && (
        <ToolApprovalQueue
          data={[state.approval]}
          layout="flat"
          defaultExpanded="tests"
          onDecide={onDecide}
          labels={text.approvals}
          className="max-w-none"
        />
      )}
      {/* Once approved, the request becomes the command it ran. */}
      {state.approval?.status === "approved" && (
        <ToolCallBlock
          data={call(
            "tests",
            "bash",
            { command: "pnpm test settings", approved: "once" },
            state.testStatus === "success",
            "6 passed (6)",
            3_120,
          )}
          labels={text.toolCall}
          className="max-w-none"
        />
      )}
    </div>
  );
}

export default function CodingAgentDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  // Review, and paused thumbnails, show the finished run.
  const review = variant === "Review" || !autoplay;
  const { state, setState } = useMockRun<State>(
    review ? finished[locale] : initial(text),
    review ? [] : script(text),
    { autoplay },
  );
  // No clock during prerender; the timer shows 0s until it ticks.
  const [startedAt] = useState(() => (typeof window === "undefined" ? 0 : Date.now()));
  const [applying, setApplying] = useState(false);

  const at = (minutes: number) =>
    new Date(Date.UTC(2026, 10, 3, 14, minutes)).toISOString();
  const running = state.phase !== "done";

  const data: CodingAgentData = {
    title: text.title,
    repo: "acme/web",
    branch: "feat/settings-dark-mode",
    model: "opus-5.5",
    user: { name: "Maya Chen" },
    messages: [
      { id: "task", role: "user", at: at(2), content: text.task },
      {
        id: "work",
        role: "assistant",
        at: at(3),
        content: (
          <WorkTurn
            state={state}
            text={text}
            onDecide={() =>
              setState((s) =>
                s.approval ? { ...s, approval: approval(text, "approved") } : s,
              )
            }
          />
        ),
      },
      ...(state.summary
        ? [
            {
              id: "summary",
              role: "assistant" as const,
              at: at(9),
              content: (
                <StreamingMessage
                  data={{
                    content: state.summary,
                    status:
                      state.phase === "summary"
                        ? ("streaming" as const)
                        : ("done" as const),
                  }}
                  showHeader={false}
                  labels={text.message}
                  className="max-w-none"
                />
              ),
            },
          ]
        : []),
    ],
    activity: state.activity ? { ...state.activity, startedAt } : undefined,
    files: state.files,
    terminal: {
      command: "pnpm test settings",
      cwd: "~/web",
      lines: state.lines,
      status: state.lines.length ? state.testStatus : "running",
      exitCode: state.testStatus === "success" ? 0 : undefined,
      durationMs: state.testStatus === "success" ? 3_120 : undefined,
    },
    checkpoints: state.checkpoints,
    preview: {
      url: "localhost:3000/settings/appearance",
      content: <SettingsPreview dark={state.dark} text={text.preview} />,
    },
  };

  return (
    <CodingAgent
      data={data}
      status={running ? "streaming" : "idle"}
      tab={state.tab}
      onTabChange={(tab) => setState((s) => ({ ...s, tab }))}
      onStop={() => setState((s) => ({ ...s, activity: undefined, phase: "done" }))}
      applying={applying}
      onApply={() => {
        setApplying(true);
        setTimeout(() => setApplying(false), 1200);
      }}
      locale={text.locale}
      labels={text.labels}
    />
  );
}

/** A rendered page for the Preview tab: the settings screen the agent is editing. */
function SettingsPreview({ dark, text }: { dark: boolean; text: Copy["preview"] }) {
  const page = dark ? "#1c1c1e" : "#f5f5f7";
  const card = dark ? "#2c2c2e" : "#ffffff";
  const fg = dark ? "#f5f5f7" : "#1d1d1f";
  const muted = dark ? "#98989d" : "#6e6e73";
  return (
    <div
      className="rounded-xl p-4 transition-colors duration-300"
      style={{ background: page, color: fg }}
    >
      <p className="text-[0.8125rem]" style={{ color: muted }}>
        {text.settings}
      </p>
      <h3 className="mt-0.5 text-base font-semibold">{text.appearance}</h3>
      <div
        className="mt-3 flex flex-col gap-2 rounded-xl p-3"
        style={{ background: card }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm">{text.theme}</span>
          <span
            className="flex rounded-full p-0.5 text-xs"
            style={{ background: dark ? "#3a3a3c" : "#e8e8ed" }}
          >
            {text.options.map((o, i) => {
              // System, Light, Dark: the preview shows Light, then Dark.
              const active = i === (dark ? 2 : 1);
              return (
                <span
                  key={o}
                  className="rounded-full px-2.5 py-1"
                  style={{
                    background: active ? (dark ? "#636366" : "#ffffff") : "transparent",
                    color: active ? fg : muted,
                  }}
                >
                  {o}
                </span>
              );
            })}
          </span>
        </div>
        <p className="text-xs" style={{ color: muted }}>
          {dark ? text.darkOn : text.follows}
        </p>
      </div>
      <div
        className="mt-2 flex flex-col gap-2 rounded-xl p-3"
        style={{ background: card }}
      >
        <div className="flex items-center justify-between text-sm">
          <span>{text.reduceMotion}</span>
          <span className="text-xs" style={{ color: muted }}>
            {text.off}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>{text.textSize}</span>
          <span className="text-xs" style={{ color: muted }}>
            {text.textDefault}
          </span>
        </div>
      </div>
    </div>
  );
}
