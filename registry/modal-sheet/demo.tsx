"use client";

import { ChatsCircle, Link, ShareNetwork } from "@phosphor-icons/react";
import { useState } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import { Button } from "@/components/ui/action-button";
import { Switch } from "@/components/ui/choice-controls";
import {
  Dialog,
  DialogClose,
  Sheet,
  type ModalLabels,
} from "@/components/ui/modal-sheet";
import { TextField } from "@/components/ui/text-field";

/** Keeps a Latin name or number in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

const copy: Record<
  DemoLocale,
  {
    chats: string[];
    chatsTitle: string;
    chatsHint: string;
    openHistory: string;
    shareTitle: string;
    shareHint: string;
    share: string;
    cancel: string;
    copyLink: string;
    link: string;
    include: string;
    includeHint: string;
    labels?: Partial<ModalLabels>;
  }
> = {
  en: {
    chats: [
      "German onboarding emails",
      "Pricing page copy review",
      "npm license audit",
      "Migrate the CLI to commander",
      "Release notes for 2.4",
    ],
    chatsTitle: "Chats",
    chatsHint: "Your recent conversations",
    openHistory: "Open history",
    shareTitle: "Share chat",
    shareHint: "Anyone with the link can read this conversation.",
    share: "Share",
    cancel: "Cancel",
    copyLink: "Copy link",
    link: "Link",
    include: "Include files and tool output",
    includeHint: "Shared readers see attachments too.",
  },
  he: {
    chats: [
      "מיילים לקליטת משתמשים בגרמנית",
      "סקירת הטקסטים בדף התמחור",
      `בדיקת רישיונות ${ltr("npm")}`,
      `העברת ה־CLI ל־${ltr("commander")}`,
      `הערות שחרור לגרסה ${ltr("2.4")}`,
    ],
    chatsTitle: "שיחות",
    chatsHint: "השיחות האחרונות שלך",
    openHistory: "פתיחת ההיסטוריה",
    shareTitle: "שיתוף השיחה",
    shareHint: "כל מי שיש לו את הקישור יכול לקרוא את השיחה.",
    share: "שיתוף",
    cancel: "ביטול",
    copyLink: "העתקת הקישור",
    link: "קישור",
    include: "לכלול קבצים ופלט של כלים",
    includeHint: "מי שמקבל את הקישור יראה גם את הקבצים המצורפים.",
    labels: { close: "סגירה" },
  },
  ar: {
    chats: [
      "رسائل الترحيب بالمستخدمين بالألمانية",
      "مراجعة نصوص صفحة الأسعار",
      `تدقيق تراخيص ${ltr("npm")}`,
      `ترحيل واجهة الأوامر إلى ${ltr("commander")}`,
      `ملاحظات الإصدار ${ltr("2.4")}`,
    ],
    chatsTitle: "المحادثات",
    chatsHint: "محادثاتك الأخيرة",
    openHistory: "فتح السجل",
    shareTitle: "مشاركة المحادثة",
    shareHint: "يمكن لأي شخص لديه الرابط قراءة هذه المحادثة.",
    share: "مشاركة",
    cancel: "إلغاء",
    copyLink: "نسخ الرابط",
    link: "الرابط",
    include: "تضمين الملفات ومخرجات الأدوات",
    includeHint: "سيرى من يفتح الرابط المرفقات أيضًا.",
    labels: { close: "إغلاق" },
  },
};

export default function ModalSheetDemo({
  variant,
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const [shared, setShared] = useState(true);

  if (variant === "Sheet") {
    return (
      <Sheet
        title={text.chatsTitle}
        description={text.chatsHint}
        labels={text.labels}
        trigger={<Button icon={ChatsCircle}>{text.openHistory}</Button>}
      >
        <ul className="flex flex-col gap-0.5">
          {text.chats.map((chat) => (
            <li key={chat}>
              <DialogClose asChild>
                <button
                  type="button"
                  className="w-full truncate rounded-xl px-3 py-2 text-start text-sm transition-colors hover:bg-foreground/[0.05]"
                >
                  {chat}
                </button>
              </DialogClose>
            </li>
          ))}
        </ul>
      </Sheet>
    );
  }

  return (
    <Dialog
      title={text.shareTitle}
      description={text.shareHint}
      labels={text.labels}
      trigger={<Button icon={ShareNetwork}>{text.share}</Button>}
      footer={
        <>
          <DialogClose asChild>
            <Button variant="quiet">{text.cancel}</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="primary" icon={Link}>
              {text.copyLink}
            </Button>
          </DialogClose>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TextField label={text.link} readOnly value="https://acme.chat/s/8f3k2p" />
        <Switch
          label={text.include}
          description={text.includeHint}
          checked={shared}
          onCheckedChange={setShared}
        />
      </div>
    </Dialog>
  );
}
