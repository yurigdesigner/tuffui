"use client";

import { Paperclip } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import { DropOverlay, DropZone, type DropZoneLabels } from "./drop-zone";

// Fakes a drop so the preview shows accepted and rejected files without a real drag.
function simulateDrop(target: HTMLElement | null, files: File[]) {
  if (!target || typeof DataTransfer === "undefined") return;
  const data = new DataTransfer();
  files.forEach((f) => data.items.add(f));
  for (const type of ["dragenter", "drop"])
    target.dispatchEvent(
      new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: data }),
    );
}

const fake = (name: string, type: string, bytes: number) =>
  new File([new Uint8Array(bytes)], name, { type });

/** Keeps a Latin size like "10.0 MB" in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

const copy: Record<
  DemoLocale,
  {
    title?: string;
    overlay?: string;
    question: string;
    dragHint: string;
    none: string;
    attached: (files: string) => string;
    labels?: Partial<DropZoneLabels>;
  }
> = {
  en: {
    question: "Can you compare these numbers with last quarter?",
    dragHint: "Drag a file anywhere over this chat.",
    none: "No attachments",
    attached: (files) => `Attached: ${files}`,
  },
  he: {
    title: "גררו קבצים לכאן",
    overlay: "שחררו כדי לצרף לשיחה",
    question: "אפשר להשוות את המספרים האלה לרבעון הקודם?",
    dragHint: "אפשר לגרור קובץ לכל מקום בשיחה.",
    none: "אין קבצים מצורפים",
    attached: (files) => `צורפו: ${files}`,
    labels: {
      release: "שחררו כדי לצרף",
      browse: "בחירת קבצים",
      unsupported: "סוג קובץ לא נתמך",
      tooLarge: (max) => `גדול מ־${ltr(max)}`,
      tooMany: "יותר מדי קבצים",
      type: (rule) =>
        rule === "image/*"
          ? "תמונות"
          : rule.replace(/^\./, "").split("/").pop()!.toUpperCase(),
      upTo: (max) => `עד ${ltr(max)}`,
    },
  },
  ar: {
    title: "أفلت الملفات هنا",
    overlay: "أفلت الملف لإرفاقه بهذه المحادثة",
    question: "هل يمكنك مقارنة هذه الأرقام بالربع السابق؟",
    dragHint: "اسحب ملفًا إلى أي مكان في هذه المحادثة.",
    none: "لا توجد مرفقات",
    attached: (files) => `المرفقات: ${files}`,
    labels: {
      release: "أفلت للإرفاق",
      browse: "تصفّح الملفات",
      unsupported: "نوع غير مدعوم",
      tooLarge: (max) => `أكبر من ${ltr(max)}`,
      tooMany: "عدد الملفات كبير جدًا",
      type: (rule) =>
        rule === "image/*"
          ? "الصور"
          : rule.replace(/^\./, "").split("/").pop()!.toUpperCase(),
      upTo: (max) => `حتى ${ltr(max)}`,
    },
  },
};

export default function DropZoneDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const zone = useRef<HTMLDivElement>(null);
  const [attached, setAttached] = useState<string[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!autoplay) return;
    if (variant === "Overlay") {
      const timers = [
        setTimeout(() => setShow(true), 900),
        setTimeout(() => {
          setShow(false);
          setAttached(["q3-metrics.csv"]);
        }, 2600),
      ];
      return () => timers.forEach(clearTimeout);
    }
    const timer = setTimeout(
      () =>
        simulateDrop(
          (zone.current?.firstElementChild?.firstElementChild as HTMLElement) ?? null,
          [
            fake("roadmap.pdf", "application/pdf", 240_000),
            fake("screen-recording.mov", "video/quicktime", 4_000),
            fake("dataset.csv", "text/csv", 30 * 1024 * 1024),
          ],
        ),
      1200,
    );
    return () => clearTimeout(timer);
  }, [autoplay, variant]);

  if (variant === "Overlay") {
    return (
      <DropOverlay
        show={show || undefined}
        title={text.overlay}
        labels={text.labels}
        onFiles={(files) => setAttached((a) => [...a, ...files.map((f) => f.name)])}
        className="w-full max-w-md rounded-[1.375rem] bg-surface p-1.5"
      >
        <div className="flex h-56 flex-col justify-end gap-2 rounded-2xl bg-surface-inset p-4">
          <p className="max-w-[80%] self-end rounded-2xl bg-surface-raised px-3.5 py-2 text-sm">
            {text.question}
          </p>
          <p className="text-[0.8125rem] text-muted-foreground">{text.dragHint}</p>
        </div>
        <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5 text-[0.8125rem] text-muted-foreground">
          <Paperclip weight="fill" aria-hidden="true" className="size-4" />
          {attached.length ? attached.join(", ") : text.none}
        </div>
      </DropOverlay>
    );
  }

  return (
    <div ref={zone} className="w-full max-w-md">
      <DropZone
        accept="application/pdf,image/*,.csv"
        maxSize={10 * 1024 * 1024}
        title={text.title}
        labels={text.labels}
        onFiles={(files) => setAttached((a) => [...a, ...files.map((f) => f.name)])}
      />
      {attached.length > 0 && (
        <p className="mt-2 px-1 text-[0.8125rem] text-muted-foreground">
          {text.attached(attached.join(", "))}
        </p>
      )}
    </div>
  );
}
