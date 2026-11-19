"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait } from "@/registry/use-mock-run/use-mock-run";
import {
  ConfirmationCard,
  type ConfirmationCardLabels,
  type ConfirmationItem,
  type ConfirmationStatus,
} from "./confirmation-card";

/** Keeps a Latin name or code in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

/** The same booking in each demo language; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    locale: string;
    title: string;
    subtitle: string;
    items: Record<"rooms" | "venue" | "dinner" | "transfer", [string, string]>;
    fees: [string, string];
    warning: string;
    doneAt: string;
    confirm: string;
    done: string;
    labels?: Partial<ConfirmationCardLabels>;
  }
> = {
  en: {
    locale: "en-US",
    title: "Book the Porto offsite",
    subtitle: "Mar 12–14 · 6 people",
    items: {
      rooms: ["Hotel rooms", "Casa do Rio, Porto · 2 nights"],
      venue: ["Meeting room", "Full day, Mar 13"],
      dinner: ["Team dinner", "Mar 13, 20:00 · 7 people"],
      transfer: ["Airport transfer", "Van, both ways"],
    },
    fees: ["Service fee", "City tax"],
    warning: "Rooms become non-refundable on Mar 1.",
    doneAt: "Booked today, 14:32",
    confirm: "Book",
    done: "Booked",
  },
  he: {
    locale: "he-IL",
    title: "הזמנת כנס הצוות בפורטו",
    subtitle: `${ltr("12–14")} במרץ · 6 אנשים`,
    items: {
      rooms: ["חדרים במלון", `${ltr("Casa do Rio, Porto")} · 2 לילות`],
      venue: ["חדר ישיבות", "יום מלא, 13 במרץ"],
      dinner: ["ארוחת צוות", "13 במרץ, 20:00 · 7 אנשים"],
      transfer: ["הסעה משדה התעופה", "ואן, הלוך ושוב"],
    },
    fees: ["דמי שירות", "מס עירוני"],
    warning: "מ־1 במרץ אי אפשר לקבל החזר על החדרים.",
    doneAt: "הוזמן היום, 14:32",
    confirm: "להזמין",
    done: "הוזמן",
    labels: {
      quantity: (item) => `כמות: ${item}`,
      decrease: "הפחתה",
      increase: "הוספה",
      remove: (item) => `הסרת ${item}`,
      subtotal: "סכום ביניים",
      total: "סה״כ",
      warning: "אזהרה: ",
      cancel: "ביטול",
      edit: "עריכה",
      confirming: "מאשרים…",
      confirmingStatus: "מאשרים",
      undo: "ביטול פעולה",
      undoTimeLeft: "הזמן שנותר לביטול",
      seconds: (n) => `${n} שניות`,
      secondsShort: (n) => String(n),
    },
  },
  ar: {
    locale: "ar",
    title: "حجز ملتقى الفريق في بورتو",
    subtitle: `${ltr("12–14")} مارس · 6 أشخاص`,
    items: {
      rooms: ["غرف الفندق", `${ltr("Casa do Rio, Porto")} · ليلتان`],
      venue: ["قاعة اجتماعات", "يوم كامل، 13 مارس"],
      dinner: ["عشاء الفريق", "13 مارس، 20:00 · 7 أشخاص"],
      transfer: ["نقل من المطار وإليه", "حافلة صغيرة، ذهابًا وإيابًا"],
    },
    fees: ["رسوم الخدمة", "ضريبة المدينة"],
    warning: "تصبح الغرف غير قابلة للاسترداد في 1 مارس.",
    doneAt: "حُجز اليوم، 14:32",
    confirm: "احجز",
    done: "تم الحجز",
    labels: {
      quantity: (item) => `الكمية: ${item}`,
      decrease: "إنقاص",
      increase: "زيادة",
      remove: (item) => `إزالة ${item}`,
      subtotal: "المجموع الفرعي",
      total: "الإجمالي",
      warning: "تنبيه: ",
      cancel: "إلغاء",
      edit: "تعديل",
      confirming: "جارٍ التأكيد…",
      confirmingStatus: "جارٍ التأكيد",
      undo: "تراجع",
      undoTimeLeft: "الوقت المتبقي للتراجع",
      seconds: (n) =>
        n === 1
          ? "ثانية واحدة"
          : n === 2
            ? "ثانيتان"
            : n >= 3 && n <= 10
              ? `${n} ثوانٍ`
              : `${n} ثانية`,
      secondsShort: (n) => String(n),
    },
  },
};

function itemsFor(text: (typeof copy)[DemoLocale]): ConfirmationItem[] {
  const { rooms, venue, dinner, transfer } = text.items;
  return [
    {
      id: "rooms",
      label: rooms[0],
      detail: rooms[1],
      amount: 360,
      quantity: 7,
      editable: true,
    },
    { id: "venue", label: venue[0], detail: venue[1], amount: 640, removable: true },
    { id: "dinner", label: dinner[0], detail: dinner[1], amount: 455, removable: true },
    {
      id: "transfer",
      label: transfer[0],
      detail: transfer[1],
      amount: 180,
      removable: true,
    },
  ];
}

type State = { items: ConfirmationItem[]; status: ConfirmationStatus };

export default function ConfirmationCardDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const items = itemsFor(text);
  const done = variant === "Done";
  const { state, setState } = useMockRun<State>(
    { items, status: done ? "done" : "review" },
    done
      ? []
      : [
          wait(1500),
          {
            delay: 0,
            apply: (s) => ({
              ...s,
              items: s.items.map((i) => (i.id === "rooms" ? { ...i, quantity: 6 } : i)),
            }),
          },
          {
            delay: 1300,
            apply: (s) => ({ ...s, items: s.items.filter((i) => i.id !== "transfer") }),
          },
          { delay: 1500, apply: (s) => ({ ...s, status: "confirming" }) },
          { delay: 1300, apply: (s) => ({ ...s, status: "done" }) },
        ],
    { autoplay },
  );

  return (
    <ConfirmationCard
      data={{
        title: text.title,
        subtitle: text.subtitle,
        items: state.items,
        fees: [
          { label: text.fees[0], amount: 48 },
          { label: text.fees[1], amount: 36 },
        ],
        warnings: [text.warning],
        reference: "BK-48213",
        doneAt: text.doneAt,
      }}
      status={state.status}
      onItemsChange={(next) => setState((s) => ({ ...s, items: next }))}
      onConfirm={() => {
        setState((s) => ({ ...s, status: "confirming" }));
        setTimeout(() => setState((s) => ({ ...s, status: "done" })), 1200);
      }}
      onEdit={() => {}}
      onCancel={() => setState({ items, status: "review" })}
      onUndo={() => setState((s) => ({ ...s, status: "review" }))}
      confirmLabel={text.confirm}
      doneLabel={text.done}
      locale={text.locale}
      labels={text.labels}
    />
  );
}
