"use client";

import { CalendarBlank, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { IconButton } from "@/components/ui/action-button";
import { Popover } from "@/components/ui/popover-panel";
import { EASE_OUT, instant } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type DateRange = { from: Date | null; to: Date | null };

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const sameDay = (a?: Date | null, b?: Date | null) =>
  !!a && !!b && a.toDateString() === b.toDateString();
const key = (d: Date) => d.toDateString();

/** Weeks of the month, Monday first, padded with the neighbouring months' days. */
function monthGrid(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = addDays(first, -((first.getDay() + 6) % 7));
  return Array.from({ length: 6 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)),
  );
}

// Today is only known in the browser; null during prerender keeps markup stable.
const noop = () => () => {};
function useToday() {
  const stamp = useSyncExternalStore(
    noop,
    () => new Date().toDateString(),
    () => null,
  );
  return stamp ? new Date(stamp) : null;
}

type Common = {
  min?: Date;
  max?: Date;
  /** Return true for days that can't be picked, e.g. weekends. */
  isDisabled?: (date: Date) => boolean;
  /** BCP 47 locale for month and weekday names. */
  locale?: string;
  className?: string;
};

export type CalendarProps = Common &
  (
    | { mode?: "single"; value?: Date | null; onValueChange?: (date: Date) => void }
    | { mode: "range"; value?: DateRange; onValueChange?: (range: DateRange) => void }
  );

/** Month grid with single or range selection and full keyboard navigation. */
export function Calendar(props: CalendarProps) {
  const { min, max, isDisabled, locale, className } = props;
  const range = props.mode === "range";
  const reduce = useReducedMotion();
  const selected = range ? (props.value as DateRange | undefined) : undefined;
  const single = range ? undefined : (props.value as Date | null | undefined);
  const anchor = (range ? selected?.from : single) ?? new Date();

  const [month, setMonth] = useState(() => addMonths(anchor, 0));
  const [focus, setFocus] = useState(() => startOfDay(anchor));
  const [direction, setDirection] = useState(0);
  // Keyboard navigation changes months instantly.
  const [viaKeys, setViaKeys] = useState(false);
  const [hover, setHover] = useState<Date | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const today = useToday();

  const blocked = (d: Date) =>
    (min && d < startOfDay(min)) || (max && d > startOfDay(max)) || !!isDisabled?.(d);

  const showMonth = (next: Date, keys: boolean) => {
    setDirection(next > month ? 1 : -1);
    setViaKeys(keys);
    setMonth(addMonths(next, 0));
  };

  const pick = (d: Date) => {
    if (blocked(d)) return;
    setFocus(d);
    if (!range) return (props.onValueChange as ((d: Date) => void) | undefined)?.(d);
    const from = selected?.from ?? null;
    const to = selected?.to ?? null;
    const next: DateRange =
      !from || to || d < from ? { from: d, to: null } : { from, to: d };
    (props.onValueChange as ((r: DateRange) => void) | undefined)?.(next);
  };

  // Set by keyboard moves so focus follows the roving day, even into a new month grid.
  const keepFocus = useRef(false);
  const moveFocus = (d: Date) => {
    keepFocus.current = true;
    setFocus(d);
    if (d.getMonth() !== month.getMonth() || d.getFullYear() !== month.getFullYear())
      showMonth(d, true);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      Home: () => addDays(focus, -((focus.getDay() + 6) % 7)),
      End: () => addDays(focus, 6 - ((focus.getDay() + 6) % 7)),
      PageUp: () => new Date(focus.getFullYear(), focus.getMonth() - 1, focus.getDate()),
      PageDown: () =>
        new Date(focus.getFullYear(), focus.getMonth() + 1, focus.getDate()),
    };
    if (moves[e.key]) {
      e.preventDefault();
      moveFocus(moves[e.key]());
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(focus);
    }
  };

  // Keep DOM focus on the roving day after keyboard moves.
  useEffect(() => {
    if (!keepFocus.current) return;
    keepFocus.current = false;
    // Query the live grid by month: during the slide the old grid is still mounted.
    frame.current
      ?.querySelector<HTMLElement>(
        `[data-month="${month.toISOString()}"] [data-day="${key(focus)}"]`,
      )
      ?.focus();
  }, [focus, month]);

  const inRange = (d: Date) => {
    if (!range) return false;
    const from = selected?.from;
    const end = selected?.to ?? (from && hover && hover > from ? hover : null);
    return !!from && !!end && d > from && d < end;
  };

  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(
      new Date(2024, 0, 1 + i),
    ),
  );
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(month);
  const still = viaKeys || !!reduce;

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("w-[17.5rem] select-none", className)}>
        <div className="mb-2 flex items-center gap-1 pl-2">
          <p id={titleId} aria-live="polite" className="flex-1 text-sm font-medium">
            {monthLabel}
          </p>
          <IconButton
            icon={CaretLeft}
            iconWeight="bold"
            label="Previous month"
            size="sm"
            onClick={(e) => showMonth(addMonths(month, -1), e.detail === 0)}
          />
          <IconButton
            icon={CaretRight}
            iconWeight="bold"
            label="Next month"
            size="sm"
            onClick={(e) => showMonth(addMonths(month, 1), e.detail === 0)}
          />
        </div>
        <div className="grid grid-cols-7 pb-1 text-center text-[0.6875rem] text-muted-foreground">
          {weekdays.map((w, i) => (
            <span key={i} aria-hidden="true">
              {w}
            </span>
          ))}
        </div>
        <div ref={frame} className="relative overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div
              key={month.toISOString()}
              data-month={month.toISOString()}
              role="grid"
              aria-labelledby={titleId}
              onKeyDown={onKeyDown}
              onMouseLeave={() => setHover(null)}
              custom={direction}
              initial={{ x: still ? 0 : direction * 24, opacity: still ? 1 : 0 }}
              animate={{
                x: 0,
                opacity: 1,
                transition: still ? instant : { duration: 0.22, ease: EASE_OUT },
              }}
              exit={{
                x: still ? 0 : direction * -24,
                opacity: 0,
                transition: still ? instant : { duration: 0.14, ease: EASE_OUT },
              }}
              className="flex flex-col gap-0.5"
            >
              {monthGrid(month).map((week, w) => (
                <div key={w} role="row" className="grid grid-cols-7">
                  {week.map((d) => {
                    const outside = d.getMonth() !== month.getMonth();
                    const isStart = sameDay(d, range ? selected?.from : single);
                    const isEnd = range && sameDay(d, selected?.to);
                    const chosen = isStart || isEnd;
                    const between = inRange(d);
                    const off = blocked(d);
                    return (
                      <div
                        key={key(d)}
                        role="gridcell"
                        aria-selected={chosen || between || undefined}
                        className={cn(
                          "flex justify-center",
                          between && "bg-brand/12",
                          range &&
                            isStart &&
                            (selected?.to || hover) &&
                            "rounded-l-full bg-brand/12",
                          isEnd && "rounded-r-full bg-brand/12",
                        )}
                      >
                        <button
                          type="button"
                          data-day={key(d)}
                          tabIndex={sameDay(d, focus) ? 0 : -1}
                          // Disabled days stay focusable so arrow keys can pass over them.
                          aria-disabled={off || undefined}
                          aria-label={new Intl.DateTimeFormat(locale, {
                            dateStyle: "full",
                          }).format(d)}
                          aria-current={sameDay(d, today) ? "date" : undefined}
                          onClick={() => pick(d)}
                          onMouseEnter={() => setHover(d)}
                          className={cn(
                            "relative flex size-9 items-center justify-center rounded-full text-[0.8125rem] tabular-nums transition-[background-color,color,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.94]",
                            chosen
                              ? "bg-brand font-medium text-white"
                              : "hover:bg-foreground/[0.07]",
                            outside && !chosen && "text-muted-foreground/50",
                            off &&
                              "cursor-default line-through opacity-35 hover:bg-transparent active:scale-100",
                          )}
                        >
                          {d.getDate()}
                          {sameDay(d, today) && (
                            <span
                              aria-hidden="true"
                              className={cn(
                                "absolute bottom-1 h-0.5 w-3 rounded-full",
                                chosen ? "bg-white" : "bg-brand",
                              )}
                            />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}

export type DatePickerProps = Common & {
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (date: Date) => void;
  label?: string;
  placeholder?: string;
  /** Intl options for the trigger text. */
  formatOptions?: Intl.DateTimeFormatOptions;
};

/** A field-like trigger that opens the calendar in a popover and closes on pick. */
export function DatePicker({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  label,
  placeholder = "Pick a date",
  formatOptions = { dateStyle: "medium" },
  locale,
  className,
  ...calendar
}: DatePickerProps) {
  const [inner, setInner] = useState<Date | null>(defaultValue);
  const value = valueProp === undefined ? inner : valueProp;
  const [open, setOpen] = useState(false);
  const labelId = useId();

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <span id={labelId} className="px-1 text-[0.8125rem] font-medium">
          {label}
        </span>
      )}
      <Popover
        open={open}
        onOpenChange={setOpen}
        align="start"
        className="w-auto"
        trigger={
          <button
            type="button"
            aria-labelledby={label ? labelId : undefined}
            aria-haspopup="dialog"
            className="flex h-10 w-full items-center gap-2 rounded-full bg-foreground/[0.06] px-4 text-left text-sm transition-[background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-foreground/[0.08] focus-visible:bg-foreground/[0.1]"
          >
            <CalendarBlank
              weight="fill"
              aria-hidden="true"
              className="size-4 text-muted-foreground"
            />
            <span className={cn("flex-1 truncate", !value && "text-muted-foreground")}>
              {value
                ? new Intl.DateTimeFormat(locale, formatOptions).format(value)
                : placeholder}
            </span>
          </button>
        }
      >
        <Calendar
          {...calendar}
          locale={locale}
          value={value}
          onValueChange={(d) => {
            if (valueProp === undefined) setInner(d);
            onValueChange?.(d);
            setOpen(false);
          }}
        />
      </Popover>
    </div>
  );
}
