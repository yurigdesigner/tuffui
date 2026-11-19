"use client";

import {
  ArrowClockwise,
  Copy,
  DotsThree,
  GitBranch,
  PencilSimple,
  PushPin,
  Share,
  Trash,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Button, IconButton } from "@/components/ui/action-button";
import { ContextMenu, Menu, type MenuGroup } from "@/components/ui/action-menu";
import type { DemoLocale } from "@/components/docs/demo";

const copy: Record<
  DemoLocale,
  {
    copy: string;
    edit: string;
    regenerate: string;
    branch: string;
    view: string;
    reasoning: string;
    pin: string;
    pinHint: string;
    share: string;
    delete: string;
    actions: string;
    messageActions: string;
    rightClick: string;
    answer: [string, string];
  }
> = {
  en: {
    copy: "Copy",
    edit: "Edit prompt",
    regenerate: "Regenerate with",
    branch: "Branch from here",
    view: "View",
    reasoning: "Show reasoning",
    pin: "Pin message",
    pinHint: "Keeps it in context",
    share: "Share",
    delete: "Delete",
    actions: "Actions",
    messageActions: "Message actions",
    rightClick: "Right-click this answer",
    answer: ["Cache resized images by content hash in", "so repeat builds skip sharp."],
  },
  he: {
    copy: "העתקה",
    edit: "עריכת הפרומפט",
    regenerate: "יצירה מחדש עם",
    branch: "פיצול מכאן",
    view: "תצוגה",
    reasoning: "הצגת שלבי החשיבה",
    pin: "הצמדת ההודעה",
    pinHint: "נשארת בהקשר",
    share: "שיתוף",
    delete: "מחיקה",
    actions: "פעולות",
    messageActions: "פעולות על ההודעה",
    rightClick: "לחיצה ימנית על התשובה",
    answer: [
      "לשמור תמונות אחרי שינוי גודל לפי hash של התוכן בתיקייה",
      "כדי שבנייה חוזרת תדלג על sharp.",
    ],
  },
  ar: {
    copy: "نسخ",
    edit: "تعديل الطلب",
    regenerate: "إعادة الإنشاء باستخدام",
    branch: "التفرّع من هنا",
    view: "العرض",
    reasoning: "إظهار خطوات التفكير",
    pin: "تثبيت الرسالة",
    pinHint: "تبقى ضمن السياق",
    share: "مشاركة",
    delete: "حذف",
    actions: "إجراءات",
    messageActions: "إجراءات الرسالة",
    rightClick: "انقر بزر الفأرة الأيمن على هذه الإجابة",
    answer: [
      "خزِّن الصور بعد تغيير حجمها حسب بصمة المحتوى في المجلد",
      "كي تتخطى عمليات البناء المتكررة sharp.",
    ],
  },
};

function useGroups(text: (typeof copy)[DemoLocale]): MenuGroup[] {
  const [reasoning, setReasoning] = useState(true);
  const [model, setModel] = useState("opus");
  return [
    {
      items: [
        { id: "copy", label: text.copy, icon: Copy, shortcut: "⌘C" },
        { id: "edit", label: text.edit, icon: PencilSimple, shortcut: "E" },
        {
          id: "regenerate",
          type: "submenu",
          label: text.regenerate,
          icon: ArrowClockwise,
          items: [
            {
              id: "model",
              type: "radio",
              value: model,
              onValueChange: setModel,
              options: [
                { value: "opus", label: "opus-5.5" },
                { value: "sonnet", label: "sonnet-5.5" },
                { value: "haiku", label: "haiku-5.5" },
              ],
            },
          ],
        },
        { id: "branch", label: text.branch, icon: GitBranch },
      ],
    },
    {
      label: text.view,
      items: [
        {
          id: "reasoning",
          type: "checkbox",
          label: text.reasoning,
          checked: reasoning,
          onCheckedChange: setReasoning,
        },
        {
          id: "pin",
          label: text.pin,
          icon: PushPin,
          description: text.pinHint,
        },
        { id: "share", label: text.share, icon: Share, disabled: true },
      ],
    },
    {
      items: [
        {
          id: "delete",
          label: text.delete,
          icon: Trash,
          destructive: true,
          shortcut: "⌫",
        },
      ],
    },
  ];
}

export default function ActionMenuDemo({
  variant,
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const groups = useGroups(text);

  if (variant === "Context") {
    return (
      <ContextMenu groups={groups}>
        <div
          tabIndex={0}
          className="w-full max-w-sm cursor-context-menu rounded-2xl bg-surface p-4 text-sm outline-none"
        >
          <p className="mb-1 text-[0.8125rem] text-muted-foreground">{text.rightClick}</p>
          {text.answer[0]}{" "}
          <code dir="ltr" className="font-mono">
            .pressd/cache
          </code>{" "}
          {text.answer[1]}
        </div>
      </ContextMenu>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Menu
        groups={groups}
        trigger={
          <IconButton
            icon={DotsThree}
            iconWeight="bold"
            label={text.messageActions}
            variant="secondary"
          />
        }
      />
      <Menu groups={groups} align="end" trigger={<Button>{text.actions}</Button>} />
    </div>
  );
}
