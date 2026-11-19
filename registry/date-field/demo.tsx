"use client";

import { useState } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import { Calendar, DatePicker, type CalendarLabels, type DateRange } from "./date-field";

// Fixed dates so the prerendered demo matches the browser.
const base = new Date(2026, 10, 3);
const weekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

const copy: Record<
  DemoLocale,
  {
    intl?: string;
    ship: string;
    report: string;
    pickStart: string;
    labels?: Partial<CalendarLabels>;
  }
> = {
  en: {
    ship: "Ship the release on",
    report: "Report starts",
    pickStart: "Pick a start date",
  },
  he: {
    intl: "he-IL",
    ship: "תאריך השחרור",
    report: "תחילת הדוח",
    pickStart: "בחירת תאריך התחלה",
    labels: { previousMonth: "החודש הקודם", nextMonth: "החודש הבא" },
  },
  ar: {
    intl: "ar",
    ship: "موعد إطلاق الإصدار",
    report: "بداية التقرير",
    pickStart: "اختر تاريخ البدء",
    labels: { previousMonth: "الشهر السابق", nextMonth: "الشهر التالي" },
  },
};

export default function DateFieldDemo({
  variant,
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const [day, setDay] = useState<Date | null>(new Date(2026, 10, 12));
  const [trip, setTrip] = useState<DateRange>({
    from: new Date(2026, 10, 16),
    to: new Date(2026, 10, 19),
  });

  if (variant === "Picker") {
    return (
      <div className="flex w-full max-w-xs flex-col gap-4">
        <DatePicker
          label={text.ship}
          defaultValue={new Date(2026, 10, 12)}
          min={base}
          isDisabled={weekend}
          formatOptions={{ weekday: "short", month: "short", day: "numeric" }}
          locale={text.intl}
          labels={text.labels}
        />
        <DatePicker
          label={text.report}
          placeholder={text.pickStart}
          max={base}
          locale={text.intl}
          labels={text.labels}
        />
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-start justify-center gap-8">
      <Calendar
        value={day}
        onValueChange={setDay}
        min={base}
        isDisabled={weekend}
        locale={text.intl}
        labels={text.labels}
      />
      <Calendar
        mode="range"
        value={trip}
        onValueChange={setTrip}
        locale={text.intl}
        labels={text.labels}
      />
    </div>
  );
}
