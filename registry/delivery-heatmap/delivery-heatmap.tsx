// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import { WebhooksLogo } from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { RollingNumber } from "@/components/ui/rolling-number";
import { Segmented } from "@/components/ui/segmented-control";
import { Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { EASE_OUT, enter, exit, spring } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type DeliveryRange = "1h" | "24h" | "7d";

export type DeliveryBucket = {
  /** Delivery attempts in the bucket, retries included. */
  attempts: number;
  /** Attempts that got an error or timed out. */
  failed: number;
  /** Response status of the failures, e.g. 503. Shown in the tooltip. */
  status?: number | string;
  /** Forces the bucket to read as failing (or not), whatever `failThreshold` says. */
  failing?: boolean;
};

export type DeliveryEndpoint = {
  id: string;
  /** Endpoint name, e.g. `billing-svc`. */
  label: string;
  /** One bucket per column, in the same order as `labels`. */
  buckets: DeliveryBucket[];
};

export type DeliveryStat = {
  label: string;
  /** Numbers roll to their new value; strings are shown as given. */
  value: number | string;
  /** Swatch before the value: a slot, an accent dash or a failure dash. */
  tone?: "neutral" | "brand" | "negative";
};

export type DeliveryHeatmapProps = {
  /** One row per endpoint, top to bottom. */
  endpoints: DeliveryEndpoint[];
  /** Column labels, e.g. "11:00" or "Nov 4". Used on the axis and in the tooltip. */
  labels: string[];
  /** Column indexes to label on the axis. Defaults to an even spread that fits the width. */
  ticks?: number[];
  /** Controlled range. Pair with `onRangeChange` and swap `endpoints` and `labels`. */
  range?: DeliveryRange;
  defaultRange?: DeliveryRange;
  /** Shows the 1h / 24h / 7d switch. Pass the data for the new range back in. */
  onRangeChange?: (range: DeliveryRange) => void;
  /** Share of failed attempts from which a bucket reads as failing, `0…1`. */
  failThreshold?: number;
  /** Header title. */
  title?: string;
  /** Breadcrumb before the title. */
  section?: string;
  subtitle?: string;
  /** Heading above the chart. */
  heading?: string;
  /** Window shown next to the heading, e.g. "Nov 4 · UTC". */
  date?: string;
  /** Footer row. Defaults to attempts, delivered and failed; `[]` hides it. */
  stats?: DeliveryStat[];
  /** Fills the cells in on mount. Off renders the finished chart. */
  intro?: boolean;
  formatCount?: (n: number) => string;
  /** Called when a cell is clicked or picked with Enter. */
  onSelect?: (endpoint: DeliveryEndpoint, bucketIndex: number) => void;
  className?: string;
};

const RANGES: { value: DeliveryRange; label: string }[] = [
  { value: "1h", label: "1h" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
];

const FAILING: Record<DeliveryRange, string> = {
  "1h": "Failing 5 min",
  "24h": "Failing hour",
  "7d": "Failing day",
};

/** Bar height per volume level; level 0 is an empty slot. */
const LEVELS = [0, 0.14, 0.32, 0.52, 0.75, 1];
const DOT_ROWS = 9;
const GAP = 6; // px between a cell and its tooltip
const STEPS = [1, 2, 3, 4, 6, 8, 12, 24, 48];
const EMPTY: DeliveryBucket = { attempts: 0, failed: 0 };

const count = (n: number) => Math.round(n).toLocaleString("en-US");

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  // null until measured, so ticks and the tooltip use the real size.
  const [width, setWidth] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width ?? 560] as const;
}

type Active = {
  r: number;
  c: number;
  /** Cell box relative to the chart. */
  box: { x: number; y: number; w: number; h: number };
  /** Top of the cell grid relative to the chart: the tooltip sits above it. */
  top: number;
  keyboard: boolean;
};

/**
 * Webhook deliveries as a grid: one row per endpoint, one column per time
 * bucket. Each cell is a slot filled as high as its attempt volume, failing
 * buckets turn red, and a dot column on top counts every bucket's total.
 */
export function DeliveryHeatmap({
  endpoints,
  labels,
  ticks: ticksProp,
  range: rangeProp,
  defaultRange = "24h",
  onRangeChange,
  failThreshold = 0.05,
  title = "Deliveries",
  section = "Webhooks",
  subtitle,
  heading = "Attempts by endpoint",
  date,
  stats,
  intro = true,
  formatCount = count,
  onSelect,
  className,
}: DeliveryHeatmapProps) {
  const reduce = useReducedMotion();
  const summaryId = useId();
  const [inner, setInner] = useState<DeliveryRange>(defaultRange);
  const range = rangeProp ?? inner;
  const [wrapRef, width] = useWidth();
  const gridRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState({ w: 150, h: 46 });
  const [active, setActive] = useState<Active | null>(null);
  const [focus, setFocus] = useState({ r: 0, c: 0 });
  // Cells fill in with a stagger on mount (with `intro`) and on every range switch.
  const [settled, setSettled] = useState<DeliveryRange | null>(intro ? null : range);
  const appear = !reduce && settled !== range;

  const n = labels.length;
  const rows = endpoints.length;
  const bucket = (e: DeliveryEndpoint, c: number) => e.buckets[c] ?? EMPTY;
  const isFailing = (b: DeliveryBucket) =>
    b.failing ?? (b.attempts > 0 && b.failed / b.attempts >= failThreshold);

  const peak = Math.max(1, ...endpoints.flatMap((e) => e.buckets.map((b) => b.attempts)));
  const level = (attempts: number) =>
    attempts <= 0 ? 0 : Math.min(5, Math.ceil((attempts / peak) * 5));

  const columns = Array.from({ length: n }, (_, c) => {
    let attempts = 0;
    let failed = 0;
    for (const e of endpoints) {
      attempts += bucket(e, c).attempts;
      failed += bucket(e, c).failed;
    }
    return { attempts, failed, failing: endpoints.some((e) => isFailing(bucket(e, c))) };
  });
  const columnPeak = Math.max(1, ...columns.map((col) => col.attempts));
  const totals = endpoints.map((e) => ({
    attempts: e.buckets.reduce((a, b) => a + b.attempts, 0),
    failed: e.buckets.reduce((a, b) => a + b.failed, 0),
    failing: e.buckets.some(isFailing),
  }));
  const attempts = totals.reduce((a, t) => a + t.attempts, 0);
  const failed = totals.reduce((a, t) => a + t.failed, 0);
  const sharePeak = Math.max(1, ...totals.map((t) => t.attempts));

  const footer: DeliveryStat[] = stats ?? [
    { label: "Attempts", value: attempts, tone: "neutral" },
    { label: "Delivered", value: attempts - failed, tone: "brand" },
    { label: "Failed", value: failed, tone: "negative" },
  ];

  // Dot columns get wider when there are fewer, wider columns.
  const dotCols = n <= 7 ? 3 : n <= 12 ? 2 : 1;
  const dotCap = DOT_ROWS * dotCols;

  const maxTicks = Math.max(2, Math.floor(width / 60));
  const step = STEPS.find((s) => Math.ceil(n / s) <= maxTicks) ?? n;
  const ticks = ticksProp ?? labels.flatMap((_, i) => (i % step === 0 ? [i] : []));

  const failingCells = endpoints.flatMap((e) =>
    e.buckets.flatMap((b, c) => (isFailing(b) ? [`${e.label} at ${labels[c]}`] : [])),
  );
  const summary = `${heading}${date ? `, ${date}` : ""}: ${rows} endpoints over ${n} columns, ${formatCount(attempts)} attempts, ${formatCount(failed)} failed.${failingCells.length ? ` Failing: ${failingCells.join(", ")}.` : " Nothing failing."}`;

  useEffect(() => {
    if (settled === range) return;
    // Long enough for the last column to finish, then updates stop staggering.
    const wait = (intro && settled === null ? 1.1 : 0.6) * 1000;
    const timer = setTimeout(() => setSettled(range), wait);
    return () => clearTimeout(timer);
  }, [range, settled, intro]);

  // A new range has other columns: drop the hover, keep the focus in bounds.
  const [shownRange, setShownRange] = useState(range);
  if (shownRange !== range) {
    setShownRange(range);
    setActive(null);
    setFocus((f) => ({ r: Math.min(f.r, rows - 1), c: Math.min(f.c, n - 1) }));
  }

  useLayoutEffect(() => {
    const el = tipRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w !== tip.w || h !== tip.h) setTip({ w, h });
  }, [active, endpoints, tip.w, tip.h]);

  const setRange = (next: DeliveryRange) => {
    if (rangeProp === undefined) setInner(next);
    onRangeChange?.(next);
  };

  const activate = (r: number, c: number, el: HTMLElement, keyboard: boolean) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const a = wrap.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    const g = gridRef.current?.getBoundingClientRect();
    setActive({
      r,
      c,
      keyboard,
      top: (g?.top ?? b.top) - a.top,
      box: { x: b.left - a.left, y: b.top - a.top, w: b.width, h: b.height },
    });
  };

  const cellAt = (r: number, c: number) =>
    gridRef.current?.querySelector<HTMLElement>(`[data-cell="${r}-${c}"]`);

  const onKeyDown = (event: React.KeyboardEvent) => {
    const { r, c } = focus;
    if (event.key === "Escape") return setActive(null);
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (endpoints[r]) onSelect?.(endpoints[r], c);
      return;
    }
    const moves: Record<string, [number, number]> = {
      ArrowRight: [r, c + 1],
      ArrowLeft: [r, c - 1],
      ArrowDown: [r + 1, c],
      ArrowUp: [r - 1, c],
      Home: [event.ctrlKey ? 0 : r, 0],
      End: [event.ctrlKey ? rows - 1 : r, n - 1],
    };
    const to = moves[event.key];
    if (!to) return;
    event.preventDefault();
    const nr = Math.min(Math.max(to[0], 0), rows - 1);
    const nc = Math.min(Math.max(to[1], 0), n - 1);
    setFocus({ r: nr, c: nc });
    cellAt(nr, nc)?.focus();
  };

  // Over the dot chart, centered on the active column, so no cell is ever hidden.
  let tipX = 0;
  let tipY = 0;
  if (active) {
    const { x, w } = active.box;
    tipX = Math.min(Math.max(x + w / 2 - tip.w / 2, 0), Math.max(width - tip.w, 0));
    tipY = active.top - GAP - tip.h;
  }
  const tipEndpoint = active ? endpoints[active.r] : undefined;
  const tipBucket = active && tipEndpoint ? bucket(tipEndpoint, active.c) : undefined;

  const rangeControl = onRangeChange && (
    <Segmented label="Range" options={RANGES} value={range} onValueChange={setRange} />
  );

  return (
    <MotionConfig reducedMotion="user">
      <Shell className={cn("max-w-2xl", className)}>
        <ShellHeader
          icon={WebhooksLogo}
          title={
            <>
              {section && (
                <span className="text-muted-foreground @max-[17rem]:sr-only">
                  {section}
                  <span aria-hidden="true" className="px-1.5 text-muted-foreground/50">
                    /
                  </span>
                  <span className="sr-only">: </span>
                </span>
              )}
              {title}
            </>
          }
          subtitle={subtitle}
          aside={rangeControl && <div className="hidden @md:block">{rangeControl}</div>}
        />
        <Panel className="p-4 @max-sm:p-3 @lg:p-5">
          {rangeControl && <div className="mb-4 @md:hidden">{rangeControl}</div>}
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <h4 className="text-sm font-medium">{heading}</h4>
            {date && (
              <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {date}
              </p>
            )}
          </div>

          <div
            ref={wrapRef}
            onPointerLeave={() => active && !active.keyboard && setActive(null)}
            className="relative [--dot:3px] [--gap:2px] [--label:4.25rem] [--r:2px] [--row:1.125rem] [--share:0px] @sm:[--dot:4px] @sm:[--gap:3px] @sm:[--label:6.5rem] @sm:[--r:4px] @sm:[--row:1.5rem] @sm:[--share:3rem] @lg:[--dot:5px] @lg:[--label:7.5rem] @lg:[--row:1.625rem] @lg:[--share:3.75rem]"
          >
            <motion.div
              key={range}
              initial={appear ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="relative"
            >
              {/* Column guide behind the dots and the cells of the hovered bucket. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-(--share) left-(--label) grid gap-x-(--gap)"
                style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
              >
                <AnimatePresence>
                  {active && (
                    <motion.div
                      key="guide"
                      layout="position"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: enter }}
                      exit={{ opacity: 0, transition: exit }}
                      transition={{ layout: active.keyboard ? { duration: 0 } : spring }}
                      className="-mx-px rounded-[calc(var(--r)+2px)] bg-foreground/[0.05]"
                      style={{ gridColumn: active.c + 1, gridRow: 1 }}
                    />
                  )}
                </AnimatePresence>
              </div>

              <div aria-hidden="true" className="relative flex pt-1 pb-2.5">
                <div className="w-(--label) shrink-0" />
                <div
                  className="grid min-w-0 flex-1 gap-x-(--gap)"
                  style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
                >
                  {columns.map((col, c) => {
                    const dots = Math.round((col.attempts / columnPeak) * dotCap);
                    // Stray failures round away; a failing bucket always shows a red dot.
                    const bad = Math.max(
                      col.failing ? 1 : 0,
                      Math.round((col.failed / columnPeak) * dotCap),
                    );
                    const dim = active !== null && active.c !== c;
                    return (
                      <motion.div
                        key={c}
                        initial={appear ? { opacity: 0 } : false}
                        animate={{ opacity: 1 }}
                        transition={{
                          duration: 0.3,
                          ease: EASE_OUT,
                          delay: appear ? c * (settled === null ? 0.03 : 0.012) : 0,
                        }}
                        className="grid content-end justify-center gap-(--gap)"
                        style={{ gridTemplateColumns: `repeat(${dotCols}, var(--dot))` }}
                      >
                        {Array.from({ length: dotCap }, (_, i) => {
                          // Grid fills top-down; count from the bottom so stacks grow up.
                          const k = dotCap - 1 - i;
                          const kk =
                            Math.floor(k / dotCols) * dotCols +
                            (dotCols - 1 - (k % dotCols));
                          return (
                            <span
                              key={i}
                              className={cn(
                                "size-(--dot) rounded-full transition-[background-color,opacity] duration-300 ease-ui-out",
                                kk >= dots
                                  ? "bg-foreground/[0.07]"
                                  : kk >= dots - bad
                                    ? "bg-negative"
                                    : "bg-brand",
                                dim && kk < dots && "opacity-60",
                              )}
                            />
                          );
                        })}
                      </motion.div>
                    );
                  })}
                </div>
                <div className="w-(--share) shrink-0" />
              </div>

              <div
                ref={gridRef}
                role="grid"
                aria-label={`${heading}. Arrow keys move between cells.`}
                aria-describedby={summaryId}
                onKeyDown={onKeyDown}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                    setActive((a) => (a?.keyboard ? null : a));
                }}
                className="relative flex flex-col gap-(--gap) @sm:gap-1.5"
              >
                {endpoints.map((e, r) => {
                  const total = totals[r];
                  const rowActive = active?.r === r;
                  return (
                    <div key={e.id} role="row" className="flex h-(--row) items-stretch">
                      <div
                        role="rowheader"
                        className={cn(
                          "flex w-(--label) shrink-0 items-center pr-1.5 text-[0.6875rem] transition-colors duration-150 @sm:pr-2 @sm:font-mono @sm:text-xs",
                          rowActive ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        <span className="truncate">{e.label}</span>
                      </div>
                      <div
                        className="grid min-w-0 flex-1 gap-x-(--gap)"
                        style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
                      >
                        {labels.map((label, c) => {
                          const b = bucket(e, c);
                          const bad = isFailing(b);
                          const lv = level(b.attempts);
                          const on = rowActive && active?.c === c;
                          return (
                            <div
                              key={c}
                              role="gridcell"
                              data-cell={`${r}-${c}`}
                              tabIndex={focus.r === r && focus.c === c ? 0 : -1}
                              aria-label={`${e.label}, ${label}: ${formatCount(b.attempts)} attempts, ${formatCount(b.failed)} failed${b.status !== undefined && b.failed > 0 ? `, status ${b.status}` : ""}${bad ? ", failing" : ""}`}
                              onPointerEnter={(event) =>
                                activate(r, c, event.currentTarget, false)
                              }
                              onFocus={(event) => {
                                setFocus({ r, c });
                                activate(r, c, event.currentTarget, true);
                              }}
                              onClick={() => onSelect?.(e, c)}
                              className={cn(
                                "relative overflow-hidden rounded-(--r) transition-colors duration-150 ease-ui-out outline-none",
                                onSelect && "cursor-pointer",
                                bad
                                  ? on
                                    ? "bg-negative/45"
                                    : "bg-negative/25"
                                  : on
                                    ? "bg-foreground/[0.18]"
                                    : "bg-foreground/[0.06]",
                              )}
                            >
                              <motion.span
                                aria-hidden="true"
                                initial={appear ? { height: "0%" } : false}
                                animate={{ height: `${LEVELS[lv] * 100}%` }}
                                transition={{
                                  ...spring,
                                  duration: appear ? 0.5 : spring.duration,
                                  delay: appear
                                    ? settled === null
                                      ? c * 0.025 + r * 0.03
                                      : c * 0.01 + r * 0.012
                                    : 0,
                                }}
                                className={cn(
                                  "absolute inset-x-0 bottom-0 rounded-(--r) transition-colors duration-200 ease-ui-out",
                                  bad ? "bg-negative" : "bg-brand",
                                )}
                              />
                            </div>
                          );
                        })}
                      </div>
                      <div
                        aria-hidden="true"
                        className="hidden w-(--share) shrink-0 items-center pl-2.5 @sm:flex"
                      >
                        <span className="h-1 w-full overflow-hidden rounded-full bg-foreground/[0.07]">
                          <motion.span
                            initial={appear ? { width: "0%" } : false}
                            animate={{ width: `${(total.attempts / sharePeak) * 100}%` }}
                            transition={{ ...spring, delay: appear ? 0.25 : 0 }}
                            className={cn(
                              "block h-full rounded-full transition-colors duration-200",
                              total.failing ? "bg-negative" : "bg-brand",
                            )}
                          />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div aria-hidden="true" className="flex pt-2.5">
                <div className="w-(--label) shrink-0" />
                <div className="relative h-4 min-w-0 flex-1">
                  {ticks.map((i) => (
                    <span
                      key={i}
                      className={cn(
                        // Centered on its column; narrow columns let the label spill over.
                        "absolute top-0 -translate-x-1/2 font-mono text-[0.6875rem] leading-4 whitespace-nowrap text-muted-foreground tabular-nums transition-colors duration-150",
                        active?.c === i && "text-foreground",
                      )}
                      style={{
                        left: `calc(${((i + 0.5) / n) * 100}% + ${(i - (n - 1) / 2) / n} * var(--gap))`,
                      }}
                    >
                      {labels[i]}
                    </span>
                  ))}
                </div>
                <div className="w-(--share) shrink-0" />
              </div>
            </motion.div>

            <AnimatePresence>
              {active && tipEndpoint && tipBucket && (
                <motion.div
                  key="tip"
                  ref={tipRef}
                  aria-hidden="true"
                  initial={
                    active.keyboard
                      ? false
                      : { opacity: 0, scale: 0.97, x: tipX, y: tipY }
                  }
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: tipX,
                    y: tipY,
                    transition: {
                      opacity: enter,
                      scale: enter,
                      x: active.keyboard ? { duration: 0 } : spring,
                      y: active.keyboard ? { duration: 0 } : spring,
                    },
                  }}
                  exit={{ opacity: 0, transition: exit }}
                  className="pointer-events-none absolute top-0 left-0 z-10 rounded-xl bg-surface-raised px-3 py-2 text-xs whitespace-nowrap"
                >
                  <p className="text-muted-foreground">
                    <span className="font-mono">{tipEndpoint.label}</span> ·{" "}
                    {labels[active.c]}
                  </p>
                  <p className="mt-0.5 text-foreground tabular-nums">
                    {tipBucket.failed > 0 ? (
                      <>
                        <span className={cn(isFailing(tipBucket) && "text-negative")}>
                          {formatCount(tipBucket.failed)} failed
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          of {formatCount(tipBucket.attempts)}
                        </span>
                        {tipBucket.status !== undefined && (
                          <span className="font-mono"> · {tipBucket.status}</span>
                        )}
                      </>
                    ) : (
                      `${formatCount(tipBucket.attempts)} delivered`
                    )}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              Fewer
              <span aria-hidden="true" className="flex items-end gap-[3px]">
                {LEVELS.map((h, i) => (
                  <Swatch key={i} height={h} />
                ))}
              </span>
              More
            </div>
            <div className="flex items-center gap-2">
              <Swatch height={0.52} failing />
              {FAILING[range]}
            </div>
          </div>

          {footer.length > 0 && (
            <dl className="mt-5 grid grid-cols-3 gap-x-3 px-1 @sm:flex @sm:gap-x-8">
              {footer.map((s) => (
                <div key={s.label} className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{s.label}</dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-[0.9375rem] font-medium text-foreground tabular-nums @sm:gap-2 @sm:text-lg">
                    {s.tone && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "shrink-0 rounded-[3px] @max-[18rem]:hidden",
                          s.tone === "neutral"
                            ? "size-2.5 bg-foreground/[0.14]"
                            : s.tone === "brand"
                              ? "h-[3px] w-3 rounded-full bg-brand"
                              : "h-[3px] w-3 rounded-full bg-negative",
                        )}
                      />
                    )}
                    {typeof s.value === "number" ? (
                      <RollingNumber value={s.value} format={formatCount} />
                    ) : (
                      s.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <p id={summaryId} className="sr-only">
            {summary}
          </p>
        </Panel>
      </Shell>
    </MotionConfig>
  );
}

function Swatch({ height, failing }: { height: number; failing?: boolean }) {
  return (
    <span
      className={cn(
        "relative block h-3.5 w-2.5 overflow-hidden rounded-[3px]",
        failing ? "bg-negative/25" : "bg-foreground/[0.06]",
      )}
    >
      <span
        className={cn(
          "absolute inset-x-0 bottom-0 rounded-[3px]",
          failing ? "bg-negative" : "bg-brand",
        )}
        style={{ height: `${height * 100}%` }}
      />
    </span>
  );
}
