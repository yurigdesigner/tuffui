// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import { CalendarCheck, CalendarDots, CheckCircle, Sparkle } from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/action-button";
import { Switch } from "@/components/ui/choice-controls";
import { Segmented } from "@/components/ui/segmented-control";
import { StatusPill } from "@/components/ui/status-pill";
import { IconTile, Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { EASE_OUT, enter, exit } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type Slot = {
  id: string;
  /** ISO date, e.g. "2026-11-10". */
  day: string;
  /** 24h "HH:MM" in `timeZone`. */
  start: string;
  end: string;
  busy?: boolean;
  /** The slot the agent recommends. */
  suggested?: boolean;
};

export type SlotZone = { label: string; /** Hours from UTC. */ offset: number };

export type SlotPickerProps = {
  data: { title?: string; slots: Slot[]; timeZone: SlotZone; attendeeZone?: SlotZone };
  variant?: "week" | "day";
  selectedId?: string | null;
  onSelect?: (slot: Slot | null) => void;
  onConfirm?: (slot: Slot) => void;
  /** Set to show the confirmed summary from outside. */
  confirmedId?: string | null;
  onChange?: () => void;
  className?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");
const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const shift = (t: string, hours: number) => {
  const m = (minutes(t) + hours * 60 + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};
const dayDate = (day: string) => new Date(`${day}T00:00:00`);
const weekday = (day: string) =>
  dayDate(day).toLocaleDateString("en-US", { weekday: "short" });
const dayLabel = (day: string) =>
  dayDate(day).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const striped =
  "bg-[image:repeating-linear-gradient(-45deg,rgb(128_128_128/0.14)_0_3px,transparent_3px_7px)]";

export function SlotPicker({
  data,
  variant = "week",
  selectedId: selectedProp,
  onSelect,
  onConfirm,
  confirmedId: confirmedProp,
  onChange,
  className,
}: SlotPickerProps) {
  const [innerSelected, setInnerSelected] = useState<string | null>(null);
  const selectedId = selectedProp !== undefined ? selectedProp : innerSelected;
  const [innerConfirmed, setInnerConfirmed] = useState<string | null>(null);
  const confirmedId = confirmedProp !== undefined ? confirmedProp : innerConfirmed;
  const [theirs, setTheirs] = useState(false);
  const days = [...new Set(data.slots.map((s) => s.day))].sort();
  // The day tab follows the selected slot until the viewer picks a day.
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const grid = useRef<HTMLDivElement>(null);

  const zone = theirs && data.attendeeZone ? data.attendeeZone : data.timeZone;
  const delta = zone.offset - data.timeZone.offset;
  const time = (s: Slot) => `${shift(s.start, delta)}–${shift(s.end, delta)}`;
  const selected = data.slots.find((s) => s.id === selectedId);
  const activeDay = pickedDay ?? selected?.day ?? days[0];
  const confirmed = data.slots.find((s) => s.id === confirmedId);

  const select = (slot: Slot | null) => {
    setInnerSelected(slot?.id ?? null);
    onSelect?.(slot);
  };

  const columns = (variant === "week" ? days.slice(0, 5) : [activeDay]).map((day) =>
    data.slots
      .filter((s) => s.day === day)
      .sort((a, b) => minutes(a.start) - minutes(b.start)),
  );

  // Arrow keys move between slots like a grid: up/down within a day, left/right across days.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const move = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    }[e.key];
    const at = (document.activeElement as HTMLElement | null)?.dataset.cell
      ?.split(":")
      .map(Number);
    if (!move || !at) return;
    e.preventDefault();
    const col = Math.min(Math.max(at[0] + move[0], 0), columns.length - 1);
    const row = Math.min(Math.max(at[1] + move[1], 0), columns[col].length - 1);
    grid.current?.querySelector<HTMLElement>(`[data-cell="${col}:${row}"]`)?.focus();
  };

  if (confirmed) {
    return (
      <MotionConfig reducedMotion="user">
        <Shell aria-label="Meeting time" className={cn("max-w-md", className)}>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: enter }}
          >
            <Panel className="flex items-center gap-3 p-3">
              <IconTile icon={CalendarCheck} className="bg-positive/15 text-positive" />
              <div className="min-w-0 flex-1">
                <p className="text-[0.9375rem] font-medium">{dayLabel(confirmed.day)}</p>
                <p className="font-mono text-[0.8125rem] text-muted-foreground tabular-nums">
                  {time(confirmed)} · {zone.label}
                </p>
              </div>
              <StatusPill tone="positive" icon={CheckCircle}>
                Invite sent
              </StatusPill>
            </Panel>
          </motion.div>
          <div className="flex justify-end pt-1.5">
            <Button
              variant="quiet"
              size="sm"
              onClick={() => {
                setInnerConfirmed(null);
                onChange?.();
              }}
            >
              Pick another time
            </Button>
          </div>
          <p role="status" aria-live="polite" className="sr-only">
            Confirmed {dayLabel(confirmed.day)} {time(confirmed)}
          </p>
        </Shell>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <Shell
        aria-label={data.title ?? "Pick a time"}
        className={cn("max-w-xl", className)}
      >
        <ShellHeader
          icon={CalendarDots}
          title={data.title ?? "Pick a time"}
          subtitle={`Times in ${zone.label}`}
          aside={
            data.attendeeZone && (
              <Switch
                label={
                  <span className="text-[0.8125rem] text-muted-foreground">
                    Their time
                  </span>
                }
                checked={theirs}
                onCheckedChange={setTheirs}
              />
            )
          }
        />
        <Panel className="p-3">
          {variant === "day" && (
            <Segmented
              label="Day"
              size="sm"
              className="mb-3"
              value={activeDay}
              onValueChange={(d) => setPickedDay(d)}
              options={days.map((d) => ({
                value: d,
                label: dayLabel(d).replace(/,.*/, ""),
              }))}
            />
          )}
          <div
            ref={grid}
            role="group"
            aria-label="Available times"
            onKeyDown={onKeyDown}
            className={cn(
              "grid gap-2",
              variant === "week" ? "grid-cols-5" : "grid-cols-1",
            )}
          >
            {columns.map((slots, col) => (
              <div
                key={col}
                role="group"
                aria-label={dayLabel(slots[0]?.day ?? days[col])}
                className="flex min-w-0 flex-col gap-1.5"
              >
                {variant === "week" && (
                  <p
                    aria-hidden="true"
                    className="pb-1 text-center text-xs text-muted-foreground"
                  >
                    <span className="block font-medium text-foreground">
                      {weekday(slots[0]?.day ?? days[col])}
                    </span>
                    {dayDate(slots[0]?.day ?? days[col]).getDate()}
                  </p>
                )}
                {slots.map((slot, row) => {
                  const active = slot.id === selectedId;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      data-cell={`${col}:${row}`}
                      aria-pressed={active}
                      aria-disabled={slot.busy}
                      aria-label={`${dayLabel(slot.day)} ${time(slot)}${slot.busy ? ", busy" : ""}${slot.suggested ? ", suggested" : ""}`}
                      tabIndex={
                        active || (!selectedId && col === 0 && row === 0) ? 0 : -1
                      }
                      onClick={() => !slot.busy && select(active ? null : slot)}
                      className={cn(
                        "relative flex h-9 items-center justify-center gap-1.5 rounded-full px-2 font-mono text-xs tabular-nums transition-[background-color,color,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                        variant === "day" && "justify-between px-3.5",
                        slot.busy
                          ? cn(
                              "cursor-not-allowed text-muted-foreground/60 line-through",
                              striped,
                            )
                          : active
                            ? "bg-brand text-white active:scale-[0.97]"
                            : "bg-foreground/[0.06] hover:bg-foreground/[0.1] active:scale-[0.97]",
                      )}
                    >
                      <span className="truncate">
                        {variant === "week" ? shift(slot.start, delta) : time(slot)}
                      </span>
                      {variant === "day" && (
                        <span className="font-sans text-[0.6875rem] opacity-70">
                          {minutes(slot.end) - minutes(slot.start)} min
                        </span>
                      )}
                      {slot.suggested && !slot.busy && (
                        <Sparkle
                          weight="fill"
                          aria-hidden="true"
                          className={cn(
                            "absolute top-1 right-1 size-2.5",
                            active ? "text-white" : "text-brand",
                          )}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-3 px-1 text-[0.6875rem] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Sparkle weight="fill" aria-hidden="true" className="size-3 text-brand" />{" "}
              Suggested
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className={cn("h-2 w-3 rounded-sm", striped)} />{" "}
              Busy
            </span>
          </p>
        </Panel>
        <AnimatePresence initial={false}>
          {selected && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: "auto",
                opacity: 1,
                transition: { duration: 0.22, ease: EASE_OUT },
              }}
              exit={{ height: 0, opacity: 0, transition: exit }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between gap-3 pt-1.5 pr-px pb-px pl-3">
                <p className="min-w-0 truncate text-[0.8125rem]">
                  <span className="font-medium">{dayLabel(selected.day)}</span>{" "}
                  <span className="font-mono text-muted-foreground tabular-nums">
                    {time(selected)}
                  </span>
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setInnerConfirmed(selected.id);
                    onConfirm?.(selected);
                  }}
                >
                  Confirm
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <p role="status" aria-live="polite" className="sr-only">
          {selected ? `Selected ${dayLabel(selected.day)} ${time(selected)}` : ""}
        </p>
      </Shell>
    </MotionConfig>
  );
}
