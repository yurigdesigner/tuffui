"use client";

import { useState } from "react";
import { Calendar, DatePicker, type DateRange } from "./date-field";

// Fixed dates so the prerendered demo matches the browser.
const base = new Date(2026, 10, 3);
const weekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

export default function DateFieldDemo({ variant }: { variant?: string }) {
  const [day, setDay] = useState<Date | null>(new Date(2026, 10, 12));
  const [trip, setTrip] = useState<DateRange>({
    from: new Date(2026, 10, 16),
    to: new Date(2026, 10, 19),
  });

  if (variant === "Picker") {
    return (
      <div className="flex w-full max-w-xs flex-col gap-4">
        <DatePicker
          label="Ship the release on"
          defaultValue={new Date(2026, 10, 12)}
          min={base}
          isDisabled={weekend}
          formatOptions={{ weekday: "short", month: "short", day: "numeric" }}
        />
        <DatePicker label="Report starts" placeholder="Pick a start date" max={base} />
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-start justify-center gap-8">
      <Calendar value={day} onValueChange={setDay} min={base} isDisabled={weekend} />
      <Calendar mode="range" value={trip} onValueChange={setTrip} />
    </div>
  );
}
