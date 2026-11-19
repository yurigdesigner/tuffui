"use client";

import { ArrowClockwise, Check, PaperPlaneTilt, Trash, X } from "@phosphor-icons/react";
import { Button, IconButton } from "@/components/ui/action-button";
import type { DemoLocale } from "@/components/docs/demo";

const copy: Record<
  DemoLocale,
  {
    applying: string;
    disabled: string;
    approve: string;
    retry: string;
    delete: string;
    dismiss: string;
    send: string;
    deny: string;
    cancel: string;
    discard: string;
    secondaryMd: string;
  }
> = {
  en: {
    applying: "Applying",
    disabled: "Disabled",
    approve: "Approve",
    retry: "Retry",
    delete: "Delete",
    dismiss: "Dismiss",
    send: "Send",
    deny: "Deny",
    cancel: "Cancel",
    discard: "Discard",
    secondaryMd: "Secondary md",
  },
  he: {
    applying: "מחיל",
    disabled: "מושבת",
    approve: "אישור",
    retry: "ניסיון חוזר",
    delete: "מחיקה",
    dismiss: "סגירה",
    send: "שליחה",
    deny: "דחייה",
    cancel: "ביטול",
    discard: "מחיקה",
    secondaryMd: "משני md",
  },
  ar: {
    applying: "جارٍ التطبيق",
    disabled: "معطّل",
    approve: "موافقة",
    retry: "إعادة المحاولة",
    delete: "حذف",
    dismiss: "إغلاق",
    send: "إرسال",
    deny: "رفض",
    cancel: "إلغاء",
    discard: "حذف",
    secondaryMd: "ثانوي md",
  },
};

export default function ActionButtonDemo({
  variant,
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  if (variant === "States") {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="primary" loading>
            {text.applying}
          </Button>
          <Button variant="secondary" disabled>
            {text.disabled}
          </Button>
          <Button variant="primary" size="md" icon={Check} iconWeight="bold">
            {text.approve}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <IconButton
            icon={ArrowClockwise}
            iconWeight="bold"
            label={text.retry}
            variant="secondary"
          />
          <IconButton icon={Trash} label={text.delete} variant="danger" />
          <IconButton icon={X} iconWeight="bold" label={text.dismiss} />
          <IconButton
            icon={PaperPlaneTilt}
            label={text.send}
            variant="primary"
            size="md"
            className="rtl:[&_svg]:-scale-x-100"
          />
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="primary">{text.approve}</Button>
        <Button variant="secondary">{text.deny}</Button>
        <Button variant="quiet">{text.cancel}</Button>
        <Button variant="danger" icon={Trash}>
          {text.discard}
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="primary"
          size="md"
          icon={PaperPlaneTilt}
          className="rtl:[&_svg]:-scale-x-100"
        >
          {text.send}
        </Button>
        <Button variant="secondary" size="md">
          {text.secondaryMd}
        </Button>
      </div>
    </div>
  );
}
