"use client";

import { useMockRun, wait } from "@/registry/use-mock-run/use-mock-run";
import { SlotPicker, type Slot } from "./slot-picker";

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

type State = { selectedId: string | null; confirmedId: string | null };

export default function SlotPickerDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
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
        title: "Design review with Ana",
        slots,
        timeZone: { label: "Lisbon (UTC+0)", offset: 0 },
        attendeeZone: { label: "New York (UTC−5)", offset: -5 },
      }}
      selectedId={state.selectedId}
      onSelect={(slot) => setState((s) => ({ ...s, selectedId: slot?.id ?? null }))}
      confirmedId={state.confirmedId}
      onConfirm={(slot) => setState((s) => ({ ...s, confirmedId: slot.id }))}
      onChange={() => setState({ selectedId: null, confirmedId: null })}
    />
  );
}
