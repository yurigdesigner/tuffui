"use client";

import { useEffect } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import { Button } from "@/components/ui/action-button";
import { Toaster, toast, type ToasterLabels } from "@/components/ui/toast-stack";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Keeps a Latin name in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

const copy: Record<
  DemoLocale,
  {
    copied: string;
    archived: string;
    chatName: string;
    undo: string;
    restored: string;
    exporting: string;
    exported: string;
    exportFailed: string;
    unreachable: string;
    timedOut: string;
    memory: string;
    memoryHint: string;
    couldntSend: string;
    checkConnection: string;
    saving: string;
    saved: string;
    failed: string;
    deleted: string;
    buttons: { success: string; error: string; promise: string; action: string };
    labels?: Partial<ToasterLabels>;
  }
> = {
  en: {
    copied: "Link copied",
    archived: "Chat archived",
    chatName: "German onboarding emails",
    undo: "Undo",
    restored: "Restored",
    exporting: "Exporting conversation…",
    exported: "Exported to Markdown",
    exportFailed: "Export failed",
    unreachable: "Couldn't reach linear",
    timedOut: "The MCP server timed out.",
    memory: "Memory updated",
    memoryHint: "Prefers PRs opened as drafts",
    couldntSend: "Couldn't send",
    checkConnection: "Check your connection.",
    saving: "Saving…",
    saved: "Saved",
    failed: "Failed",
    deleted: "Message deleted",
    buttons: {
      success: "Success",
      error: "Error",
      promise: "Promise",
      action: "With action",
    },
  },
  he: {
    copied: "הקישור הועתק",
    archived: "השיחה הועברה לארכיון",
    chatName: "מיילים לקליטת משתמשים בגרמנית",
    undo: "ביטול",
    restored: "שוחזר",
    exporting: "מייצא את השיחה…",
    exported: `יוצא לקובץ ${ltr("Markdown")}`,
    exportFailed: "הייצוא נכשל",
    unreachable: `אין חיבור ל־${ltr("linear")}`,
    timedOut: `תם הזמן לחיבור לשרת ה־${ltr("MCP")}.`,
    memory: "הזיכרון עודכן",
    memoryHint: `מעדיף לפתוח ${ltr("PR")} כטיוטה`,
    couldntSend: "השליחה נכשלה",
    checkConnection: "כדאי לבדוק את החיבור לאינטרנט.",
    saving: "שומר…",
    saved: "נשמר",
    failed: "נכשל",
    deleted: "ההודעה נמחקה",
    buttons: { success: "הצלחה", error: "שגיאה", promise: "טעינה", action: "עם פעולה" },
    labels: { region: "התראות", fallback: "התראה", dismiss: "סגירה" },
  },
  ar: {
    copied: "تم نسخ الرابط",
    archived: "تمت أرشفة المحادثة",
    chatName: "رسائل الترحيب بالمستخدمين بالألمانية",
    undo: "تراجع",
    restored: "تمت الاستعادة",
    exporting: "جارٍ تصدير المحادثة…",
    exported: `تم التصدير بصيغة ${ltr("Markdown")}`,
    exportFailed: "فشل التصدير",
    unreachable: `تعذّر الوصول إلى ${ltr("linear")}`,
    timedOut: `انتهت مهلة خادم ${ltr("MCP")}.`,
    memory: "تم تحديث الذاكرة",
    memoryHint: "يفضّل فتح طلبات الدمج كمسودات",
    couldntSend: "تعذّر الإرسال",
    checkConnection: "تحقّق من اتصالك بالإنترنت.",
    saving: "جارٍ الحفظ…",
    saved: "تم الحفظ",
    failed: "فشل",
    deleted: "تم حذف الرسالة",
    buttons: { success: "نجاح", error: "خطأ", promise: "تحميل", action: "مع إجراء" },
    labels: { region: "الإشعارات", fallback: "إشعار", dismiss: "إغلاق" },
  },
};

export default function ToastStackDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const actions = variant === "Actions";

  // Play a few toasts so the stack is visible without clicking.
  useEffect(() => {
    if (!autoplay) return;
    const timers = [
      setTimeout(() => toast.success(text.copied), 400),
      setTimeout(
        () =>
          actions
            ? toast(text.archived, {
                description: text.chatName,
                action: { label: text.undo, onClick: () => toast(text.restored) },
              })
            : toast.promise(wait(1800), {
                loading: text.exporting,
                success: text.exported,
                error: text.exportFailed,
              }),
        1200,
      ),
      setTimeout(
        () =>
          actions
            ? toast.error(text.unreachable, { description: text.timedOut })
            : toast(text.memory, { description: text.memoryHint }),
        2200,
      ),
    ];
    return () => timers.forEach(clearTimeout);
  }, [autoplay, actions, text]);

  return (
    <div className="relative flex min-h-80 w-full max-w-xl items-start justify-center pt-6">
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => toast.success(text.copied)}>{text.buttons.success}</Button>
        <Button
          onClick={() =>
            toast.error(text.couldntSend, { description: text.checkConnection })
          }
        >
          {text.buttons.error}
        </Button>
        <Button
          onClick={() =>
            toast.promise(wait(1500), {
              loading: text.saving,
              success: text.saved,
              error: text.failed,
            })
          }
        >
          {text.buttons.promise}
        </Button>
        <Button
          onClick={() =>
            toast(text.deleted, {
              action: { label: text.undo, onClick: () => toast(text.restored) },
            })
          }
        >
          {text.buttons.action}
        </Button>
      </div>
      {/* Contained to the preview here; in an app it sits fixed to the viewport. */}
      <Toaster
        labels={text.labels}
        className="absolute end-0 bottom-0 w-[min(22rem,100%)]"
      />
    </div>
  );
}
