// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import {
  ArrowClockwise,
  Check,
  CheckCircle,
  Code,
  Copy,
  MagnifyingGlass,
  WebhooksLogo,
  X,
  XCircle,
} from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button, IconButton } from "@/components/ui/action-button";
import { CodeBlock, type CodeLanguage } from "@/components/ui/code-block";
import { EmptyState } from "@/components/ui/empty-state";
import { Kbd } from "@/components/ui/key-hint";
import { Segmented } from "@/components/ui/segmented-control";
import { StatusPill } from "@/components/ui/status-pill";
import { Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { SearchField } from "@/components/ui/text-field";
import { EASE_IN_OUT, enter, exit, instant, spring } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

type Time = Date | string | number;

export type MessageAttemptStatus = "delivered" | "failed" | "scheduled" | "sending";

export type MessageAttempt = {
  /** `scheduled` is the next try, waiting; `sending` is a try in flight. */
  status: MessageAttemptStatus;
  /** HTTP status the endpoint answered with. */
  code?: number;
  /** Reason phrase, e.g. "Service unavailable". */
  label?: string;
  /** When the try ran, or is due for `scheduled`. */
  at: Time;
  /** How long the endpoint took to answer. */
  ms?: number;
  /** Response body of this try. Falls back to the event's `body`. */
  body?: string;
};

export type MessageEvent = {
  id: string;
  /** Event type, e.g. `order.created`. */
  type: string;
  /** Receiving endpoint, e.g. `billing-svc`. */
  endpoint: string;
  /** When the event was sent. The window and the Time column use it. */
  at: Time;
  /** Every try in order. The last one decides the status. */
  attempts: MessageAttempt[];
  /** Latency bar value. Defaults to the last finished try's `ms`. */
  latencyMs?: number;
  /** Response body shown when a try has none of its own. */
  body?: string;
  bodyLanguage?: CodeLanguage;
};

export type MessageBucket = {
  /** Start of the bucket; buckets are evenly spaced, oldest first. */
  at: Time;
  delivered: number;
  failed: number;
};

export type MessageFilter = "all" | "failed" | "retrying";

/** Epoch ms, start inclusive and end exclusive. */
export type MessageWindow = [number, number];

export type MessageAnnotation = {
  /** Where the flag stands on the timeline. */
  at: Time;
  label: string;
  detail?: string;
};

export type MessageLogProps = {
  /** Events in any order; the log lists them newest first. */
  events: MessageEvent[];
  /** Delivery counts per bucket (usually a minute) for the dot timeline. */
  buckets: MessageBucket[];
  /** Events per dot. Defaults to a round number that keeps columns at most 8 dots tall. */
  perDot?: number;
  /** Controlled brush window. `null` shows every event. */
  window?: MessageWindow | null;
  /** Starting brush when uncontrolled. A window touching the live edge follows it. */
  defaultWindow?: [Time, Time] | null;
  onWindowChange?: (window: MessageWindow | null) => void;
  filter?: MessageFilter;
  defaultFilter?: MessageFilter;
  onFilterChange?: (filter: MessageFilter) => void;
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  /** Controlled expanded row. */
  selectedId?: string | null;
  defaultSelectedId?: string | null;
  onSelect?: (event: MessageEvent | null) => void;
  /** Shows a Replay button in the expanded row. */
  onReplay?: (event: MessageEvent) => void;
  /** Shows a Copy cURL button. Return the command and it is copied for you. */
  onCopyCurl?: (event: MessageEvent) => string | void;
  /** Dots in the Attempts column, tries plus empty slots. */
  maxAttempts?: number;
  /** Flag on the timeline. Defaults to the start of a failure run reaching now; `null` hides it. */
  annotation?: MessageAnnotation | null;
  /** First part of the breadcrumb. */
  section?: string;
  title?: string;
  /** All events in the period, for the footer count. Defaults to `events.length`. */
  total?: number;
  /** Words after the footer count, e.g. "today". */
  totalLabel?: string;
  /** Times on the axis, rows and attempts. Defaults to UTC `11:04` / `11:04:09`. */
  formatTime?: (date: Date, precision: "minute" | "second") => string;
  className?: string;
};

type Status = "delivered" | "failed" | "retrying";

const FILTERS: { value: MessageFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "failed", label: "Failed" },
  { value: "retrying", label: "Retrying" },
];

const LANE = 30; // flag lane above the dots
const PITCH = 9; // vertical distance between dots
const MIN_ROWS = 6; // room to grow, so a burst never pushes the log down
const MAX_ROWS = 8;

const ms = (v: Time) =>
  typeof v === "number" ? v : v instanceof Date ? v.getTime() : new Date(v).getTime();

const utc = {
  minute: new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }),
  second: new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  }),
};
const defaultTime = (date: Date, precision: "minute" | "second") =>
  utc[precision].format(date);

const duration = (value: number) =>
  value < 1000 ? `${Math.round(value)} ms` : `${(value / 1000).toFixed(1)} s`;

const count = (n: number) => n.toLocaleString("en-US");

function niceStep(raw: number) {
  const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
  return steps.find((s) => s >= raw) ?? Math.ceil(raw / 1000) * 1000;
}

function statusOf(e: MessageEvent): Status {
  const last = e.attempts.at(-1);
  if (!last || last.status === "scheduled" || last.status === "sending")
    return "retrying";
  return last.status;
}

const finished = (a: MessageAttempt) => a.status === "delivered" || a.status === "failed";

function latencyOf(e: MessageEvent) {
  return e.latencyMs ?? e.attempts.findLast((a) => finished(a) && a.ms !== undefined)?.ms;
}

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  // null until measured, so the dots draw once at their real size.
  const [width, setWidth] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width ?? 600, width !== null] as const;
}

/** Start of the newest run of failing buckets that reaches the live edge. */
function failureRun(buckets: { at: number; failed: number }[]) {
  let i = buckets.length - 1;
  // A quiet last minute still belongs to the run.
  if (i > 0 && buckets[i].failed === 0) i--;
  if (i < 0 || buckets[i].failed === 0) return null;
  while (i > 0 && buckets[i - 1].failed > 0) i--;
  return buckets[i].at;
}

/**
 * A webhook message log: an hour of deliveries as dot columns you can brush,
 * the events in that window below, filterable by outcome and text, and each
 * event's tries with their response bodies.
 */
export function MessageLog({
  events,
  buckets: rawBuckets,
  perDot: perDotProp,
  window: windowProp,
  defaultWindow = null,
  onWindowChange,
  filter: filterProp,
  defaultFilter = "all",
  onFilterChange,
  query: queryProp,
  defaultQuery = "",
  onQueryChange,
  selectedId: selectedProp,
  defaultSelectedId = null,
  onSelect,
  onReplay,
  onCopyCurl,
  maxAttempts = 8,
  annotation: annotationProp,
  section = "Webhooks",
  title = "Message log",
  total,
  totalLabel,
  formatTime = defaultTime,
  className,
}: MessageLogProps) {
  const uid = useId();
  const [chart, width, measured] = useWidth();
  // Narrow cards keep dots apart by showing fewer buckets, in steps of 15.
  const fit = Math.max(Math.floor(width / 6 / 15) * 15, 15);
  const buckets = useMemo(
    () => rawBuckets.slice(-fit).map((b) => ({ ...b, at: ms(b.at) })),
    [rawBuckets, fit],
  );
  const step = buckets.length > 1 ? buckets[1].at - buckets[0].at : 60_000;
  const start = buckets[0]?.at ?? 0;
  const end = (buckets.at(-1)?.at ?? 0) + step;
  const span = Math.max(end - start, step);

  // --- Brush window. Uncontrolled windows touching the live edge follow it.
  const [ownWindow, setOwnWindow] = useState<MessageWindow | null>(
    defaultWindow ? [ms(defaultWindow[0]), ms(defaultWindow[1])] : null,
  );
  const [lastEnd, setLastEnd] = useState(end);
  if (lastEnd !== end) {
    setLastEnd(end);
    if (ownWindow && ownWindow[1] === lastEnd)
      setOwnWindow([ownWindow[0] + end - lastEnd, end]);
  }
  const win = windowProp !== undefined ? windowProp : ownWindow;
  const setWindow = (next: MessageWindow | null) => {
    if (next && win && next[0] === win[0] && next[1] === win[1]) return;
    if (!next && !win) return;
    if (windowProp === undefined) setOwnWindow(next);
    onWindowChange?.(next);
  };

  const [ownFilter, setOwnFilter] = useState(defaultFilter);
  const filter = filterProp ?? ownFilter;
  const setFilter = (next: MessageFilter) => {
    if (filterProp === undefined) setOwnFilter(next);
    onFilterChange?.(next);
  };

  const [ownQuery, setOwnQuery] = useState(defaultQuery);
  const query = queryProp ?? ownQuery;
  const setQuery = (next: string) => {
    if (queryProp === undefined) setOwnQuery(next);
    onQueryChange?.(next);
  };

  const [ownSelected, setOwnSelected] = useState(defaultSelectedId);
  const selectedId = selectedProp !== undefined ? selectedProp : ownSelected;
  const select = (e: MessageEvent | null) => {
    if (selectedProp === undefined) setOwnSelected(e?.id ?? null);
    onSelect?.(e);
  };

  // --- Rows.
  const sorted = useMemo(() => [...events].sort((a, b) => ms(b.at) - ms(a.at)), [events]);
  const latencyMax = Math.max(1, ...events.map((e) => latencyOf(e) ?? 0));
  const q = query.trim().toLowerCase();
  const rows = sorted.filter((e) => {
    const t = ms(e.at);
    if (win && (t < win[0] || t >= win[1])) return false;
    if (filter !== "all" && statusOf(e) !== filter) return false;
    if (!q) return true;
    return [e.type, e.id, e.endpoint, ...e.attempts.map((a) => String(a.code ?? ""))]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  // --- Search: "/" focuses it; narrow cards fold it into an icon.
  const [searchOpen, setSearchOpen] = useState(false);
  const wideSearch = useRef<HTMLInputElement>(null);
  const narrowSearch = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable='true']")) return;
      const wide = wideSearch.current;
      e.preventDefault();
      if (wide && wide.offsetParent !== null) wide.focus();
      else {
        setSearchOpen(true);
        requestAnimationFrame(() => narrowSearch.current?.focus());
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // --- Timeline geometry.
  const maxTotal = Math.max(1, ...buckets.map((b) => b.delivered + b.failed));
  const perDot = perDotProp ?? niceStep(maxTotal / MAX_ROWS);
  const dotRows = Math.min(Math.max(Math.ceil(maxTotal / perDot), MIN_ROWS), MAX_ROWS);
  const colW = width / Math.max(buckets.length, 1);
  const r = Math.min(Math.max(colW * 0.3, 1.25), 2.75);
  const dotsH = dotRows * PITCH + 4;
  const xOf = (t: number) => ((t - start) / span) * width;

  const derived = useMemo<MessageAnnotation | null>(() => {
    const from = failureRun(buckets);
    if (from === null) return null;
    const tally = new Map<string, number>();
    for (const e of events)
      for (const a of e.attempts)
        if (a.status === "failed" && ms(a.at) >= from) {
          const key = `${e.endpoint} · ${a.code ?? "error"}`;
          tally.set(key, (tally.get(key) ?? 0) + 1);
        }
    const top = [...tally].sort((a, b) => b[1] - a[1])[0]?.[0];
    return {
      at: from,
      label: `failing since ${defaultTime(new Date(from), "minute")}`,
      detail: top,
    };
  }, [buckets, events]);
  const annotation = annotationProp !== undefined ? annotationProp : derived;
  // The derived label uses the default clock; re-label it with formatTime.
  const flag = annotation && {
    ...annotation,
    label:
      annotationProp === undefined
        ? `failing since ${formatTime(new Date(ms(annotation.at)), "minute")}`
        : annotation.label,
  };
  const flagX = flag ? xOf(ms(flag.at)) : 0;
  const flagLeft = flagX > width * 0.5;

  const ticks: number[] = [];
  const tickStep = 15 * 60_000;
  for (let t = Math.ceil(start / tickStep) * tickStep; t < end; t += tickStep)
    if (xOf(t) > 56 && width - xOf(t) > 72) ticks.push(t);

  // --- Brush interaction.
  const drag = useRef<{
    mode: "move" | "start" | "end" | "new";
    x: number;
    t: number;
    from: number;
    to: number;
    moved: boolean;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [keyed, setKeyed] = useState(false);
  const floorStep = (t: number) => start + Math.floor((t - start) / step) * step;
  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
  const timeAt = (clientX: number) => {
    const rect = chart.current!.getBoundingClientRect();
    return start + ((clientX - rect.left) / rect.width) * span;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const handle = (e.target as HTMLElement).closest<HTMLElement>("[data-brush]")?.dataset
      .brush as "move" | "start" | "end" | undefined;
    const t = timeAt(e.clientX);
    drag.current = {
      mode: handle && win ? handle : "new",
      x: e.clientX,
      t,
      from: win?.[0] ?? t,
      to: win?.[1] ?? t,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    setKeyed(false);
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    if (Math.abs(e.clientX - d.x) > 3) d.moved = true;
    if (!d.moved) return;
    const t = timeAt(e.clientX);
    if (d.mode === "move") {
      const len = d.to - d.from;
      const from = clamp(d.from + Math.round((t - d.t) / step) * step, start, end - len);
      setWindow([from, from + len]);
    } else if (d.mode === "start") {
      setWindow([
        clamp(start + Math.round((t - start) / step) * step, start, d.to - step),
        d.to,
      ]);
    } else if (d.mode === "end") {
      setWindow([
        d.from,
        clamp(start + Math.round((t - start) / step) * step, d.from + step, end),
      ]);
    } else {
      const a = floorStep(clamp(d.t, start, end - 1));
      const b = floorStep(clamp(t, start, end - 1));
      setWindow([Math.min(a, b), Math.max(a, b) + step]);
    }
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    // A click without a drag clears the brush.
    if (d && !d.moved && d.mode === "new") setWindow(null);
  };

  const onBrushKey = (e: React.KeyboardEvent) => {
    const dir = { ArrowLeft: -1, ArrowRight: 1, ArrowDown: -1, ArrowUp: 1 }[e.key];
    if (e.key === "Escape" || e.key === "Backspace" || e.key === "Delete") {
      if (!win) return;
      e.preventDefault();
      setKeyed(true);
      setWindow(null);
      return;
    }
    const base = win ?? [Math.max(end - 5 * step, start), end];
    let next: MessageWindow | null = null;
    if (e.key === "Home") next = [start, start + base[1] - base[0]];
    else if (e.key === "End") next = [end - (base[1] - base[0]), end];
    else if (dir && !win) next = base as MessageWindow;
    else if (dir && e.shiftKey)
      next = [base[0], clamp(base[1] + dir * step, base[0] + step, end)];
    else if (dir) {
      const len = base[1] - base[0];
      const from = clamp(base[0] + dir * step, start, end - len);
      next = [from, from + len];
    }
    if (!next) return;
    e.preventDefault();
    setKeyed(true);
    setWindow(next);
  };

  const bandMotion = dragging || keyed ? instant : spring;
  const range = win
    ? `${formatTime(new Date(win[0]), "minute")}–${formatTime(new Date(win[1]), "minute")}`
    : null;
  const minutes = Math.round(span / 60_000);
  const delivered = buckets.reduce((a, b) => a + b.delivered, 0);
  const failed = buckets.reduce((a, b) => a + b.failed, 0);

  // --- Row keyboard: arrows walk the rows.
  const list = useRef<HTMLDivElement>(null);
  const onRowKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const dir = { ArrowDown: 1, ArrowUp: -1 }[e.key];
    if (!dir) return;
    const all = [
      ...(list.current?.querySelectorAll<HTMLButtonElement>("[data-row]") ?? []),
    ];
    const next = all[all.indexOf(e.currentTarget) + dir];
    if (!next) return;
    e.preventDefault();
    next.focus();
  };

  const segmented = (
    <Segmented
      label="Show events"
      options={FILTERS}
      value={filter}
      onValueChange={setFilter}
    />
  );
  const searchProps = {
    value: query,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value),
    onClear: () => setQuery(""),
    placeholder: "Search events",
  };

  return (
    <MotionConfig reducedMotion="user">
      <Shell className={cn("max-w-3xl", className)} aria-label={title}>
        <ShellHeader
          icon={WebhooksLogo}
          title={
            <>
              <span className="text-muted-foreground @max-sm:hidden">
                {section}
                <span aria-hidden="true" className="px-1.5 text-muted-foreground/50">
                  /
                </span>
              </span>
              {title}
            </>
          }
          aside={
            <div className="flex items-center gap-2 @max-xl:hidden">
              <div className="relative w-40 @3xl:w-48">
                <SearchField ref={wideSearch} {...searchProps} />
                {!query && (
                  <Kbd
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2"
                  >
                    /
                  </Kbd>
                )}
              </div>
              <div className="@max-2xl:hidden">{segmented}</div>
            </div>
          }
        />

        <Panel className="p-2">
          {/* Narrow cards: filters and a folded search in one row. */}
          <div className="flex h-10 items-center gap-2 px-1 pb-1 @2xl:hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              {searchOpen ? (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1, transition: enter }}
                  exit={{ opacity: 0, transition: exit }}
                  className="flex min-w-0 flex-1 items-center gap-1"
                >
                  <SearchField
                    ref={narrowSearch}
                    {...searchProps}
                    className="min-w-0 flex-1"
                    onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
                  />
                  <IconButton
                    icon={X}
                    iconWeight="bold"
                    label="Close search"
                    onClick={() => {
                      setQuery("");
                      setSearchOpen(false);
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="filters"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: enter }}
                  exit={{ opacity: 0, transition: exit }}
                  className="flex min-w-0 flex-1 items-center justify-between gap-2"
                >
                  {segmented}
                  <IconButton
                    icon={MagnifyingGlass}
                    iconWeight="bold"
                    label={query ? `Search: ${query}` : "Search events"}
                    onClick={() => {
                      setSearchOpen(true);
                      requestAnimationFrame(() => narrowSearch.current?.focus());
                    }}
                    className={cn("@xl:hidden", query && "bg-brand/15 text-brand")}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* --- Timeline */}
          <div className="px-2 pt-2 pb-1 @2xl:px-3 @2xl:pt-3">
            <div className="flex min-h-6 items-center gap-x-3 gap-y-1 text-[0.8125rem]">
              <span className="font-medium whitespace-nowrap">
                Last {minutes} min<span className="@max-xs:hidden">utes</span>
              </span>
              <span className="text-muted-foreground @max-sm:hidden">
                1 dot = {count(perDot)} events
              </span>
              <span className="flex-1" />
              <AnimatePresence mode="popLayout" initial={false}>
                {range ? (
                  <motion.span
                    key="range"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1, transition: enter }}
                    exit={{ opacity: 0, scale: 0.96, transition: exit }}
                    className="inline-flex h-6 items-center gap-1 rounded-full bg-brand/15 pr-0.5 pl-2.5 font-mono text-xs text-brand tabular-nums"
                  >
                    <span className="whitespace-nowrap">{range}</span>
                    <button
                      type="button"
                      aria-label="Clear time window"
                      onClick={() => setWindow(null)}
                      className="flex size-5 items-center justify-center rounded-full transition-[background-color,scale] duration-150 ease-ui-out hover:bg-brand/20 active:scale-[0.9]"
                    >
                      <X weight="bold" aria-hidden="true" className="size-3" />
                    </button>
                  </motion.span>
                ) : (
                  <motion.span
                    key="hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: enter }}
                    exit={{ opacity: 0, transition: exit }}
                    className="text-xs text-muted-foreground @max-sm:hidden"
                  >
                    Drag to pick a window
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <div
              ref={chart}
              className="relative mt-1 touch-none select-none"
              style={{ height: LANE + dotsH }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <svg
                key={measured ? "measured" : "guess"}
                visibility={measured ? undefined : "hidden"}
                aria-hidden="true"
                width={width}
                height={LANE + dotsH}
                className="absolute inset-0 block overflow-visible"
              >
                {flag && (
                  <motion.line
                    initial={false}
                    animate={{ x1: flagX, x2: flagX }}
                    transition={spring}
                    y1={LANE - 6}
                    y2={LANE + dotsH}
                    strokeWidth={1.25}
                    strokeDasharray="1 3"
                    strokeLinecap="round"
                    className="stroke-negative/70"
                  />
                )}
                <AnimatePresence initial={false}>
                  {buckets.map((b, i) => {
                    const fail =
                      b.failed > 0 ? Math.max(1, Math.round(b.failed / perDot)) : 0;
                    const ok = Math.min(Math.round(b.delivered / perDot), dotRows - fail);
                    const inside = !win || (b.at >= win[0] && b.at < win[1]);
                    return (
                      <motion.g
                        key={b.at}
                        initial={{ opacity: 0, x: (i + 1) * colW }}
                        animate={{ opacity: 1, x: i * colW }}
                        exit={{ opacity: 0, x: (i - 1) * colW }}
                        transition={spring}
                      >
                        {Array.from({ length: dotRows }, (_, k) => {
                          const tone = k < ok ? "ok" : k < ok + fail ? "fail" : "empty";
                          return (
                            <circle
                              key={k}
                              cx={colW / 2}
                              cy={LANE + dotsH - 2 - PITCH / 2 - k * PITCH}
                              r={tone === "empty" ? r * 0.55 : r}
                              className={cn(
                                "transition-[fill,opacity] duration-200 ease-ui-out",
                                tone === "ok"
                                  ? "fill-brand"
                                  : tone === "fail"
                                    ? "fill-negative"
                                    : "fill-foreground/15",
                                tone !== "empty" && !inside && "opacity-45",
                              )}
                            />
                          );
                        })}
                      </motion.g>
                    );
                  })}
                </AnimatePresence>
              </svg>

              {flag && measured && (
                <motion.div
                  initial={false}
                  animate={{ left: flagX }}
                  transition={spring}
                  className={cn(
                    "pointer-events-none absolute top-0 flex h-6 max-w-[70%] items-center gap-1.5 rounded-md bg-negative/12 px-2 text-xs whitespace-nowrap",
                    flagLeft ? "-translate-x-full" : "",
                  )}
                >
                  <span className="text-negative">{flag.label}</span>
                  {flag.detail && (
                    <span className="truncate font-mono text-foreground/80 @max-md:hidden">
                      {flag.detail}
                    </span>
                  )}
                </motion.div>
              )}

              {/* Brush: one tab stop for the whole timeline. */}
              <div
                role="slider"
                tabIndex={0}
                aria-label="Time window"
                aria-valuemin={start}
                aria-valuemax={end}
                aria-valuenow={win?.[0] ?? start}
                aria-valuetext={
                  range
                    ? `${range}. Arrows move it, Shift with arrows resizes, Escape clears.`
                    : `All ${minutes} minutes. Press an arrow key to pick a window.`
                }
                onKeyDown={onBrushKey}
                onBlur={() => setKeyed(false)}
                className="group/brush absolute inset-x-0 rounded-lg outline-none focus-visible:bg-foreground/[0.04]"
                style={{ top: LANE - 2, height: dotsH + 2 }}
              >
                <AnimatePresence initial={false}>
                  {win && measured && (
                    <motion.div
                      key="band"
                      data-brush="move"
                      initial={{
                        opacity: 0,
                        left: xOf(win[0]),
                        width: xOf(win[1]) - xOf(win[0]),
                      }}
                      animate={{
                        opacity: 1,
                        left: Math.max(xOf(win[0]), 0),
                        width: Math.max(
                          Math.min(xOf(win[1]), width) - Math.max(xOf(win[0]), 0),
                          2,
                        ),
                      }}
                      exit={{ opacity: 0, transition: exit }}
                      transition={{ ...bandMotion, opacity: enter }}
                      className="absolute inset-y-0 cursor-grab rounded-lg bg-brand/12 transition-[background-color] duration-150 group-focus-visible/brush:bg-brand/20 hover:bg-brand/16 active:cursor-grabbing"
                    >
                      {(["start", "end"] as const).map((side) => (
                        <span
                          key={side}
                          data-brush={side}
                          className={cn(
                            "absolute inset-y-0 flex w-4 cursor-ew-resize items-center justify-center",
                            side === "start" ? "-left-2" : "-right-2",
                          )}
                        >
                          <span className="h-4 w-1 rounded-full bg-brand" />
                        </span>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div
              aria-hidden="true"
              className="relative mt-2 h-4 font-mono text-[0.6875rem] text-muted-foreground tabular-nums"
            >
              <span className="absolute left-0">
                {formatTime(new Date(start), "minute")}
              </span>
              <AnimatePresence initial={false}>
                {measured &&
                  ticks.map((t) => (
                    <motion.span
                      key={t}
                      initial={{ opacity: 0, left: xOf(t) }}
                      animate={{ opacity: 1, left: xOf(t) }}
                      exit={{ opacity: 0, transition: exit }}
                      transition={spring}
                      className="absolute -translate-x-1/2"
                    >
                      {formatTime(new Date(t), "minute")}
                    </motion.span>
                  ))}
              </AnimatePresence>
              <span className="absolute right-0 text-foreground">
                {formatTime(new Date(end), "minute")}
              </span>
            </div>

            <p className="sr-only">
              {`Last ${minutes} minutes: ${count(delivered)} delivered, ${count(failed)} failed.`}
              {flag
                ? ` ${flag.label}${flag.detail ? `, mostly ${flag.detail}` : ""}.`
                : ""}
            </p>
          </div>

          {/* --- Log */}
          <div
            role="table"
            aria-label={`${section} ${title}`}
            aria-rowcount={rows.length + 1}
            className="mt-3"
          >
            <div
              role="rowgroup"
              className={cn("@max-lg:sr-only", rows.length === 0 && "hidden")}
            >
              <div
                role="row"
                className={cn(
                  "grid gap-x-3 px-3 pb-1.5 text-xs text-muted-foreground",
                  COLUMNS,
                )}
              >
                {["Event", "Status", "Attempts", "Latency"].map((h) => (
                  <span key={h} role="columnheader">
                    {h}
                  </span>
                ))}
                <span role="columnheader" className="text-right">
                  Time
                </span>
              </div>
            </div>

            <div ref={list} role="rowgroup" className="relative flex flex-col gap-0.5">
              <AnimatePresence initial={false}>
                {rows.map((e) => (
                  <Row
                    key={e.id}
                    uid={uid}
                    event={e}
                    open={selectedId === e.id}
                    maxAttempts={maxAttempts}
                    latencyMax={latencyMax}
                    formatTime={formatTime}
                    onToggle={() => select(selectedId === e.id ? null : e)}
                    onKeyDown={onRowKey}
                    onReplay={onReplay}
                    onCopyCurl={onCopyCurl}
                  />
                ))}
              </AnimatePresence>
            </div>

            <AnimatePresence initial={false}>
              {rows.length === 0 && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { ...enter, delay: 0.1 } }}
                  exit={{ opacity: 0, transition: exit }}
                >
                  <EmptyState
                    compact
                    icon={MagnifyingGlass}
                    title="No events match"
                    description={
                      q
                        ? `Nothing matches “${query}”${range ? ` between ${range}` : ""}.`
                        : `No ${filter === "all" ? "" : `${filter} `}events${range ? ` between ${range}` : ""}.`
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Panel>

        <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 pr-3.5 pl-3.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-brand" /> Delivered
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-negative" /> Failed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Ring spin={false} /> Scheduled
          </span>
          <span className="ml-auto tabular-nums">
            {count(rows.length)} of {count(total ?? events.length)}
            {totalLabel ? ` · ${totalLabel}` : ""}
          </span>
        </footer>
        <p role="status" aria-live="polite" className="sr-only">
          {`${rows.length} ${rows.length === 1 ? "event" : "events"}${range ? ` between ${range}` : ""}`}
        </p>
      </Shell>
    </MotionConfig>
  );
}

/** Height changes: one eased move instead of a spring, so the rows below glide with it. */
const smooth = { duration: 0.28, ease: EASE_IN_OUT } as const;

const COLUMNS =
  "@lg:grid-cols-[minmax(0,1.5fr)_5rem_5.75rem_minmax(0,1fr)_4rem] @2xl:grid-cols-[minmax(0,1.6fr)_5.5rem_6.5rem_minmax(0,1fr)_4.5rem]";
// Narrow rows stack: event and status, then attempts and latency.
const CELL_AREAS = `grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 gap-y-2 [grid-template-areas:'ev_ev_st'_'ev_ev_tm'_'at_lt_lt'] @lg:items-center @lg:gap-y-0 @lg:[grid-template-areas:'ev_st_at_lt_tm'] ${COLUMNS}`;

function Row({
  uid,
  event: e,
  open,
  maxAttempts,
  latencyMax,
  formatTime,
  onToggle,
  onKeyDown,
  onReplay,
  onCopyCurl,
}: {
  uid: string;
  event: MessageEvent;
  open: boolean;
  maxAttempts: number;
  latencyMax: number;
  formatTime: (date: Date, precision: "minute" | "second") => string;
  onToggle: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  onReplay?: (event: MessageEvent) => void;
  onCopyCurl?: (event: MessageEvent) => string | void;
}) {
  const status = statusOf(e);
  const latency = latencyOf(e);
  const last = e.attempts.findLast(finished);
  const detailId = `${uid}-${e.id}`;
  const pill =
    status === "delivered" ? (
      <StatusPill size="sm" className="font-mono">
        {last?.code ?? 200} OK
      </StatusPill>
    ) : status === "retrying" ? (
      <StatusPill size="sm" tone="brand">
        Retrying
      </StatusPill>
    ) : (
      <StatusPill size="sm" tone="negative" icon={XCircle} className="font-mono">
        {last?.code ?? "Failed"}
      </StatusPill>
    );

  return (
    // Rows enter and leave by height, in the normal flow: everything below
    // moves with them on the same curve, so nothing slides on its own and
    // catches up. (Layout animations fought the detail's height change.)
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{
        height: "auto",
        opacity: 1,
        transition: { height: smooth, opacity: enter },
      }}
      exit={{ height: 0, opacity: 0, transition: { height: smooth, opacity: exit } }}
      className={cn(
        "overflow-hidden rounded-xl transition-[background-color] duration-200 ease-ui-out",
        open && "bg-foreground/[0.045]",
      )}
    >
      <div
        role="row"
        className={cn(
          CELL_AREAS,
          "relative rounded-xl px-3 py-2.5 text-[0.8125rem] transition-[background-color] duration-150 ease-ui-out has-[[data-row]:focus-visible]:bg-foreground/[0.06]",
          !open && "hover:bg-foreground/[0.035]",
        )}
      >
        <div role="cell" className="min-w-0 [grid-area:ev]">
          <button
            type="button"
            data-row
            aria-expanded={open}
            aria-controls={detailId}
            onClick={onToggle}
            onKeyDown={onKeyDown}
            className="block max-w-full text-left outline-none after:absolute after:inset-0 after:rounded-xl"
          >
            <span className="block truncate font-mono text-foreground">{e.type}</span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {e.endpoint}
              <span className="text-muted-foreground/60"> · </span>
              <span className="font-mono">{e.id}</span>
            </span>
          </button>
        </div>
        <div
          role="cell"
          className="justify-self-end [grid-area:st] @lg:justify-self-start"
        >
          {pill}
        </div>
        <div role="cell" className="flex items-center [grid-area:at]">
          <AttemptDots attempts={e.attempts} max={maxAttempts} />
        </div>
        <div
          role="cell"
          className="flex items-center gap-2 [grid-area:lt] @max-lg:justify-end"
        >
          <span className="h-1.5 max-w-16 min-w-0 flex-1 overflow-hidden rounded-full bg-foreground/[0.07] @lg:max-w-none">
            <motion.span
              initial={false}
              animate={{
                width: `${latency === undefined ? 0 : Math.max((latency / latencyMax) * 100, 4)}%`,
              }}
              transition={spring}
              className={cn(
                "block h-full rounded-full transition-[background-color] duration-200",
                status === "delivered" ? "bg-brand" : "bg-negative",
              )}
            />
          </span>
          <span className="w-12 shrink-0 text-right font-mono text-xs text-foreground/85 tabular-nums">
            {latency === undefined ? "–" : duration(latency)}
          </span>
        </div>
        <div
          role="cell"
          className="text-right font-mono text-xs text-muted-foreground tabular-nums [grid-area:tm]"
        >
          {formatTime(new Date(ms(e.at)), "second")}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: { height: smooth, opacity: enter },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: { height: smooth, opacity: exit },
            }}
            className="overflow-hidden"
          >
            <div role="row" id={detailId}>
              <div role="cell" className="px-3 pt-1 pb-3">
                <Detail
                  event={e}
                  formatTime={formatTime}
                  onReplay={onReplay}
                  onCopyCurl={onCopyCurl}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Detail({
  event: e,
  formatTime,
  onReplay,
  onCopyCurl,
}: {
  event: MessageEvent;
  formatTime: (date: Date, precision: "minute" | "second") => string;
  onReplay?: (event: MessageEvent) => void;
  onCopyCurl?: (event: MessageEvent) => string | void;
}) {
  const lastDone = e.attempts.findLastIndex(finished);
  const [picked, setPicked] = useState<number | null>(null);
  const shown = picked !== null && picked < e.attempts.length ? picked : lastDone;
  const body = e.attempts[shown]?.body ?? e.body;
  const pickable = e.attempts.some((a) => a.body !== undefined);
  const sending = e.attempts.at(-1)?.status === "sending";

  const [copied, setCopied] = useState<"body" | "curl" | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const flash = (what: "body" | "curl") => {
    setCopied(what);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1600);
  };
  const write = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  return (
    <div>
      <div className="grid gap-4 @xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] @xl:gap-5">
        <section aria-label="Attempts" className="min-w-0">
          <h4 className="mb-2 text-xs text-muted-foreground">Attempts</h4>
          <ol className="flex flex-col">
            {e.attempts.map((a, i) => {
              const active = pickable && i === shown;
              const inner = (
                <>
                  <span className="relative flex h-5 w-4 shrink-0 items-center justify-center">
                    <AttemptIcon status={a.status} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block font-mono text-[0.8125rem] text-pretty break-words",
                        a.status === "failed"
                          ? "text-negative"
                          : a.status === "delivered"
                            ? "text-foreground"
                            : "text-brand",
                      )}
                    >
                      {a.status === "scheduled"
                        ? "Scheduled"
                        : a.status === "sending"
                          ? "Sending…"
                          : [a.code, a.label].filter(Boolean).join(" ")}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      Try {i + 1} · {formatTime(new Date(ms(a.at)), "second")}
                    </span>
                  </span>
                  <span className="shrink-0 pt-px font-mono text-xs text-foreground/85 tabular-nums">
                    {a.ms !== undefined && finished(a) ? duration(a.ms) : ""}
                  </span>
                </>
              );
              return (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0, transition: enter }}
                  className="relative"
                >
                  {i < e.attempts.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute top-6 bottom-0 left-[1.0625rem] w-px bg-foreground/12"
                    />
                  )}
                  {pickable && a.body !== undefined ? (
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => setPicked(i)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg px-2.5 py-1.5 text-left transition-[background-color] duration-150 ease-ui-out outline-none hover:bg-foreground/[0.04] focus-visible:bg-foreground/[0.07]",
                        active && "bg-foreground/[0.06] hover:bg-foreground/[0.06]",
                      )}
                    >
                      {inner}
                    </button>
                  ) : (
                    <div className="flex items-start gap-3 px-2.5 py-1.5">{inner}</div>
                  )}
                </motion.li>
              );
            })}
          </ol>
        </section>

        <section aria-label="Response body" className="min-w-0">
          <div className="mb-2 flex h-5 items-center justify-between gap-2">
            <h4 className="text-xs text-muted-foreground">
              Response body
              {pickable && shown >= 0 && (
                <span className="text-muted-foreground/70"> · try {shown + 1}</span>
              )}
            </h4>
            {body && (
              <IconButton
                icon={copied === "body" ? Check : Copy}
                iconWeight={copied === "body" ? "bold" : "fill"}
                label={copied === "body" ? "Copied" : "Copy response body"}
                className="-mr-1.5 size-7"
                onClick={() => {
                  write(body);
                  flash("body");
                }}
              />
            )}
          </div>
          {body ? (
            <CodeBlock
              bare
              data={{ code: body, language: e.bodyLanguage ?? "json" }}
              collapseAfter={8}
            />
          ) : (
            <p className="rounded-2xl bg-surface-inset px-4 py-3 text-[0.8125rem] text-muted-foreground">
              {lastDone < 0 ? "No response yet." : "Empty response body."}
            </p>
          )}
        </section>
      </div>

      {(onCopyCurl || onReplay) && (
        <div className="mt-3 flex flex-wrap justify-end gap-2 @max-sm:[&>button]:flex-1">
          {onCopyCurl && (
            <Button
              icon={copied === "curl" ? Check : Code}
              iconWeight="bold"
              onClick={() => {
                const curl = onCopyCurl(e);
                if (typeof curl === "string") write(curl);
                flash("curl");
              }}
            >
              {copied === "curl" ? "Copied" : "Copy cURL"}
            </Button>
          )}
          {onReplay && (
            <Button
              variant="primary"
              icon={ArrowClockwise}
              iconWeight="bold"
              loading={sending}
              onClick={() => onReplay(e)}
            >
              {sending ? "Sending" : "Replay"}
            </Button>
          )}
        </div>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {copied === "body"
          ? "Response body copied"
          : copied === "curl"
            ? "cURL copied"
            : ""}
      </p>
    </div>
  );
}

/** Dashed ring for a try that is waiting. An SVG mark, not a CSS border. */
function Ring({ spin = true, className }: { spin?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 10 10"
      aria-hidden="true"
      className={cn(
        "size-2.5 shrink-0 text-brand",
        spin && "animate-[spin_6s_linear_infinite] motion-reduce:animate-none",
        className,
      )}
    >
      <circle
        cx="5"
        cy="5"
        r="3.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="2.2 1.73"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AttemptIcon({ status }: { status: MessageAttemptStatus }) {
  if (status === "failed")
    return <XCircle weight="fill" aria-hidden="true" className="size-4 text-negative" />;
  if (status === "delivered")
    return <CheckCircle weight="fill" aria-hidden="true" className="size-4 text-brand" />;
  if (status === "sending")
    return (
      <span
        aria-hidden="true"
        className="size-2.5 animate-pulse rounded-full bg-brand motion-reduce:animate-none"
      />
    );
  return <Ring className="size-3.5" />;
}

function AttemptDots({ attempts, max }: { attempts: MessageAttempt[]; max: number }) {
  const shown = attempts.slice(-max);
  const label = shown
    .map((a) =>
      a.status === "failed" ? `failed${a.code ? ` ${a.code}` : ""}` : a.status,
    )
    .join(", ");
  return (
    <span
      role="img"
      aria-label={`${attempts.length} of ${max} tries: ${label}`}
      className="inline-flex items-center gap-1"
    >
      {Array.from({ length: max }, (_, i) => {
        const a = shown[i];
        return (
          <span key={i} className="relative flex size-2 items-center justify-center">
            <span
              className={cn(
                "rounded-full transition-[background-color,width,height] duration-200 ease-ui-out",
                !a
                  ? "size-1 bg-foreground/15"
                  : a.status === "failed"
                    ? "size-2 bg-negative"
                    : a.status === "delivered"
                      ? "size-2 bg-brand"
                      : a.status === "sending"
                        ? "size-2 animate-pulse bg-brand motion-reduce:animate-none"
                        : "size-2 bg-transparent",
              )}
            />
            <AnimatePresence initial={false}>
              {a?.status === "scheduled" && (
                <motion.span
                  key="ring"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1, transition: enter }}
                  exit={{ opacity: 0, transition: exit }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Ring className="size-2.5" />
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        );
      })}
    </span>
  );
}
