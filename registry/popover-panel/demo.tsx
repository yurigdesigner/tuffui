"use client";

import { Info, PencilSimple } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/action-button";
import { Popover, PopoverClose, type PopoverLabels } from "@/components/ui/popover-panel";
import { TextField } from "@/components/ui/text-field";
import type { DemoLocale } from "@/components/docs/demo";

/** Keeps a Latin size like 200k in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

const copy: Record<
  DemoLocale,
  {
    chat: string;
    rename: string;
    renameChat: string;
    title: string;
    cancel: string;
    save: string;
    details: string;
    context: string;
    output: string;
    tokens: (n: string) => string;
    bestFor: string;
    bestForValue: string;
    labels?: Partial<PopoverLabels>;
  }
> = {
  en: {
    chat: "German onboarding emails",
    rename: "Rename",
    renameChat: "Rename chat",
    title: "Title",
    cancel: "Cancel",
    save: "Save",
    details: "Model details",
    context: "Context",
    output: "Output",
    tokens: (n) => `${n} tokens`,
    bestFor: "Best for",
    bestForValue: "Long agentic tasks, careful edits",
  },
  he: {
    chat: "מיילי אונבורדינג בגרמנית",
    rename: "שינוי שם",
    renameChat: "שינוי שם הצ׳אט",
    title: "כותרת",
    cancel: "ביטול",
    save: "שמירה",
    details: "פרטי המודל",
    context: "הקשר",
    output: "פלט",
    tokens: (n) => `${ltr(n)} טוקנים`,
    bestFor: "שימוש מומלץ",
    bestForValue: "משימות סוכן ארוכות ועריכות מדויקות",
    labels: { close: "סגירה" },
  },
  ar: {
    chat: "رسائل الإعداد الأولي بالألمانية",
    rename: "إعادة تسمية",
    renameChat: "إعادة تسمية المحادثة",
    title: "العنوان",
    cancel: "إلغاء",
    save: "حفظ",
    details: "تفاصيل النموذج",
    context: "السياق",
    output: "الإخراج",
    tokens: (n) => `${ltr(n)} رمز`,
    bestFor: "الاستخدام الأمثل",
    bestForValue: "مهام الوكلاء الطويلة والتعديلات الدقيقة",
    labels: { close: "إغلاق" },
  },
};

export default function PopoverPanelDemo({
  variant,
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const [title, setTitle] = useState(text.chat);

  if (variant === "Form") {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm">{title}</p>
        <Popover
          title={text.renameChat}
          showClose
          labels={text.labels}
          trigger={<Button icon={PencilSimple}>{text.rename}</Button>}
        >
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const value = new FormData(event.currentTarget).get("title");
              if (typeof value === "string" && value.trim()) setTitle(value.trim());
            }}
          >
            <TextField name="title" label={text.title} defaultValue={title} autoFocus />
            <div className="flex justify-end gap-2">
              <PopoverClose asChild>
                <Button variant="quiet">{text.cancel}</Button>
              </PopoverClose>
              <Button type="submit" variant="primary">
                {text.save}
              </Button>
            </div>
          </form>
        </Popover>
      </div>
    );
  }

  return (
    <Popover
      title="opus-5.5"
      labels={text.labels}
      trigger={<Button icon={Info}>{text.details}</Button>}
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 px-1 text-[0.8125rem]">
        <dt className="text-muted-foreground">{text.context}</dt>
        <dd className="font-mono">{text.tokens("200k")}</dd>
        <dt className="text-muted-foreground">{text.output}</dt>
        <dd className="font-mono">{text.tokens("64k")}</dd>
        <dt className="text-muted-foreground">{text.bestFor}</dt>
        <dd>{text.bestForValue}</dd>
      </dl>
    </Popover>
  );
}
