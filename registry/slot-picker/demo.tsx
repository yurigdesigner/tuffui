"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait } from "@/registry/use-mock-run/use-mock-run";
import { SlotPicker, type Slot, type SlotPickerLabels } from "./slot-picker";

const day = (d: number) => `2026-11-${String(9 + d).padStart(2, "0")}`;
const times = ["09:30", "11:00", "14:30", "16:00"];
const end = (t: string) => {
  const m = Number(t.slice(0, 2)) * 60 + Number(t.slice(3)) + 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

// Mon–Fri, four 30-minute slots a day, a few already taken.
const busy = new Set(["0-0", "1-2", "2-1", "2-3", "3-0", "4-2"]);
const slots: Slot[] = Array.from({ length: 5 }, (_, d) =>
  times.map((t, i) => ({
    id: `${d}-${i}`,
    day: day(d),
    start: t,
    end: end(t),
    busy: busy.has(`${d}-${i}`),
    suggested: `${d}-${i}` === "1-3",
  })),
).flat();

/** Keeps a time range or UTC offset in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

/** The same meeting in each demo language; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    locale: string;
    title: string;
    zone: string;
    attendeeZone: string;
    labels?: Partial<SlotPickerLabels>;
  }
> = {
  en: {
    locale: "en-US",
    title: "Design review with Ana",
    zone: "Lisbon (UTC+0)",
    attendeeZone: "New York (UTC−5)",
  },
  he: {
    locale: "he-IL",
    title: "סקירת עיצוב עם Ana",
    zone: `ליסבון (${ltr("UTC+0")})`,
    attendeeZone: `ניו יורק (${ltr("UTC−5")})`,
    labels: {
      pickTime: "בחירת מועד",
      timesIn: (zone) => `השעות לפי ${zone}`,
      theirTime: "השעה אצלם",
      day: "יום",
      availableTimes: "מועדים פנויים",
      slot: (day, time, { busy, suggested }) =>
        `${day} ${ltr(time)}${busy ? ", תפוס" : ""}${suggested ? ", מומלץ" : ""}`,
      duration: (minutes) => `${minutes} דק׳`,
      suggested: "מומלץ",
      busy: "תפוס",
      confirm: "אישור",
      selected: (day, time) => `נבחר ${day} ${ltr(time)}`,
      meetingTime: "מועד הפגישה",
      inviteSent: "ההזמנה נשלחה",
      pickAnother: "בחירת מועד אחר",
      confirmed: (day, time) => `אושר ${day} ${ltr(time)}`,
    },
  },
  ar: {
    locale: "ar",
    title: "مراجعة التصميم مع Ana",
    zone: `لشبونة (${ltr("UTC+0")})`,
    attendeeZone: `نيويورك (${ltr("UTC−5")})`,
    labels: {
      pickTime: "اختر موعدًا",
      timesIn: (zone) => `الأوقات بتوقيت ${zone}`,
      theirTime: "توقيتهم",
      day: "اليوم",
      availableTimes: "المواعيد المتاحة",
      slot: (day, time, { busy, suggested }) =>
        `${day} ${ltr(time)}${busy ? "، محجوز" : ""}${suggested ? "، مقترح" : ""}`,
      duration: (minutes) => `${minutes} د`,
      suggested: "مقترح",
      busy: "محجوز",
      confirm: "تأكيد",
      selected: (day, time) => `تم اختيار ${day} ${ltr(time)}`,
      meetingTime: "موعد الاجتماع",
      inviteSent: "أُرسلت الدعوة",
      pickAnother: "اختيار موعد آخر",
      confirmed: (day, time) => `تم تأكيد ${day} ${ltr(time)}`,
    },
  },
};

type State = { selectedId: string | null; confirmedId: string | null };

export default function SlotPickerDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const { state, setState } = useMockRun<State>(
    { selectedId: null, confirmedId: null },
    [
      wait(1400),
      { delay: 0, apply: (s) => ({ ...s, selectedId: "1-1" }) },
      { delay: 900, apply: (s) => ({ ...s, selectedId: "1-3" }) },
      { delay: 1500, apply: (s) => ({ ...s, confirmedId: "1-3" }) },
    ],
    { autoplay },
  );

  return (
    <SlotPicker
      variant={variant === "Day" ? "day" : "week"}
      data={{
        title: text.title,
        slots,
        timeZone: { label: text.zone, offset: 0 },
        attendeeZone: { label: text.attendeeZone, offset: -5 },
      }}
      locale={text.locale}
      labels={text.labels}
      selectedId={state.selectedId}
      onSelect={(slot) => setState((s) => ({ ...s, selectedId: slot?.id ?? null }))}
      confirmedId={state.confirmedId}
      onConfirm={(slot) => setState((s) => ({ ...s, confirmedId: slot.id }))}
      onChange={() => setState({ selectedId: null, confirmedId: null })}
    />
  );
}
