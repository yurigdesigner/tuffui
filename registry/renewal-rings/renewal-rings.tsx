// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import { ClockCountdown, type Icon } from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/action-button";
import { RollingNumber } from "@/components/ui/rolling-number";
import { StatusPill } from "@/components/ui/status-pill";
import { Inset, Panel, Shell, ShellHeader } from "@/components/ui/surface";
import {
  CSS_EASE_OUT,
  EASE_OUT,
  enter,
  exit,
  instant,
  spring,
} from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type RenewalContract = {
  id: string;
  /** Account or vendor name, shown next to its ring. */
  name: string;
  /** Last day of the current term, `"2027-03-14"` or a `Date`. */
  endDate: string | Date;
  /** Days before the end date by which notice must be given. 0 hides the notice window. */
  noticeDays?: number;
  /** Annual contract value, summed in the footer. */
  value: number;
  autoRenew?: boolean;
  /** Short annotation shown with the contract's details, e.g. an agent's note. */
  note?: React.ReactNode;
};

export type RenewalAction = {
  label: string;
  icon?: Icon;
  onSelect: (contract: RenewalContract) => void;
  /** Hide the action for some contracts, e.g. "Draft notice" once notice has passed. */
  hidden?: (contract: RenewalContract) => boolean;
};

export type RenewalRingsProps = {
  contracts: RenewalContract[];
  /** Start of the clock face. Pass a fixed date when rendering on the server. */
  today?: string | Date;
  /** Months around the clock face. */
  horizonMonths?: number;
  /** Days counted as "up for renewal": the pill, the dotted radius and the footer. */
  windowDays?: number;
  /** Notice deadlines within this many days count as "due" in the footer. */
  noticeSoonDays?: number;
  /** Rings drawn at most; the soonest ends are kept. */
  maxRings?: number;
  /** Controlled selection. `null` selects nothing. */
  selectedId?: string | null;
  defaultSelectedId?: string | null;
  onSelectedChange?: (id: string | null) => void;
  /** Buttons under the selected contract's details. */
  actions?: RenewalAction[];
  title?: string;
  subtitle?: string;
  /** Heading above the chart, also its accessible name. */
  heading?: string;
  /** Shows the details block. Off keeps only the chart and the footer. */
  details?: boolean;
  /** Shows the footer stats. */
  stats?: boolean;
  /** Sweeps the arcs in from Today on mount. Skipped with reduced motion. */
  intro?: boolean;
  formatValue?: (value: number) => string;
  formatDate?: (date: Date) => string;
  /** One or two letters for the month labels around the face. */
  formatMonth?: (date: Date) => string;
  className?: string;
};

const DAY = 86_400_000;
const SIZE = 320;
const C = SIZE / 2;
/** Month labels, outermost ring, innermost ring. */
const R_LABEL = 151;
const R_OUTER = 127;
const R_INNER = 58;

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});
const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const monthFormat = new Intl.DateTimeFormat("en-US", {
  month: "narrow",
  timeZone: "UTC",
});

const defaultValue = (n: number) => usd.format(n);
const defaultDate = (d: Date) => dateFormat.format(d);
const defaultMonth = (d: Date) => monthFormat.format(d);

/** Calendar day as UTC midnight, so arithmetic ignores time zones and DST. */
function toDay(d: string | Date): number {
  if (typeof d === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
    if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
    d = new Date(d);
  }
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

function addMonths(t: number, n: number) {
  const d = new Date(t);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + n;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return Date.UTC(y, m, Math.min(d.getUTCDate(), last));
}

/** Months from `a` to `b`, with the remainder as a share of that month. */
function monthsBetween(a: number, b: number) {
  const da = new Date(a);
  const db = new Date(b);
  let whole =
    (db.getUTCFullYear() - da.getUTCFullYear()) * 12 +
    db.getUTCMonth() -
    da.getUTCMonth();
  if (addMonths(a, whole) > b) whole--;
  const from = addMonths(a, whole);
  const to = addMonths(a, whole + 1);
  return whole + (b - from) / (to - from);
}

/** Point on a circle, angle in degrees clockwise from 12 o'clock. */
function point(r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return [C + r * Math.sin(a), C - r * Math.cos(a)] as const;
}

const n2 = (v: number) => Math.round(v * 100) / 100;

function arc(r: number, from: number, to: number) {
  const sweep = Math.min(to - from, 359.99);
  const [x0, y0] = point(r, from);
  const [x1, y1] = point(r, from + sweep);
  return `M ${n2(x0)} ${n2(y0)} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${n2(x1)} ${n2(y1)}`;
}

function radial(r0: number, r1: number, deg: number) {
  const [x0, y0] = point(r0, deg);
  const [x1, y1] = point(r1, deg);
  return `M ${n2(x0)} ${n2(y0)} L ${n2(x1)} ${n2(y1)}`;
}

function sector(r0: number, r1: number, to: number) {
  const [ax, ay] = point(r1, 0);
  const [bx, by] = point(r1, to);
  const [cx, cy] = point(r0, to);
  const [dx, dy] = point(r0, 0);
  const large = to > 180 ? 1 : 0;
  return `M ${n2(ax)} ${n2(ay)} A ${r1} ${r1} 0 ${large} 1 ${n2(bx)} ${n2(by)} L ${n2(cx)} ${n2(cy)} A ${r0} ${r0} 0 ${large} 0 ${n2(dx)} ${n2(dy)} Z`;
}

const short = (name: string) => (name.length > 13 ? `${name.slice(0, 12)}…` : name);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

type Row = {
  contract: RenewalContract;
  end: number;
  days: number;
  noticeAt: number;
  noticeDays: number;
  angle: number;
  noticeAngle: number;
  inWindow: boolean;
};

/**
 * Upcoming contract renewals on a 12-month clock face. Each contract is a ring
 * that sweeps clockwise from Today to its end date, with its notice window
 * hatched near the end and a dotted radius marking the renewal window.
 */
export function RenewalRings({
  contracts,
  today: todayProp,
  horizonMonths = 12,
  windowDays = 90,
  noticeSoonDays = 30,
  maxRings = 6,
  selectedId: selectedProp,
  defaultSelectedId = null,
  onSelectedChange,
  actions,
  title = "Renewals",
  subtitle,
  heading = "Term left",
  details = true,
  stats = true,
  intro = true,
  formatValue = defaultValue,
  formatDate = defaultDate,
  formatMonth = defaultMonth,
  className,
}: RenewalRingsProps) {
  const reduce = useReducedMotion();
  const summaryId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [innerSelected, setInnerSelected] = useState<string | null>(defaultSelectedId);
  const selectedId = selectedProp !== undefined ? selectedProp : innerSelected;
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [keyboard, setKeyboard] = useState(false);

  const today = toDay(todayProp ?? new Date());
  const horizonEnd = addMonths(today, horizonMonths);
  const toAngle = (t: number) =>
    Math.min(359.99, Math.max(0, (monthsBetween(today, t) / horizonMonths) * 360));

  const rows: Row[] = contracts
    .map((contract) => {
      const end = toDay(contract.endDate);
      const noticeDays = Math.max(0, contract.noticeDays ?? 0);
      const noticeAt = end - noticeDays * DAY;
      const days = Math.round((end - today) / DAY);
      return {
        contract,
        end,
        days,
        noticeAt,
        noticeDays,
        angle: end > today ? toAngle(end) : 0,
        noticeAngle: noticeAt > today ? toAngle(noticeAt) : 0,
        inWindow: days <= windowDays,
      };
    })
    .filter((r) => r.end > today && r.end <= horizonEnd)
    .sort((a, b) => a.end - b.end || a.contract.name.localeCompare(b.contract.name));

  const shown = rows.slice(0, Math.max(0, maxRings));
  const inWindow = rows.filter((r) => r.inWindow);
  const noticeSoon = rows.filter(
    (r) =>
      r.noticeDays > 0 &&
      r.noticeAt >= today &&
      r.noticeAt - today <= noticeSoonDays * DAY,
  ).length;
  const autoRenew = inWindow.filter((r) => r.contract.autoRenew).length;
  const acv = inWindow.reduce((a, r) => a + r.contract.value, 0);

  // Outer ring is the soonest end; rings tighten when there are many.
  const n = shown.length;
  const step = n > 1 ? Math.min(15, (R_OUTER - R_INNER) / (n - 1)) : 15;
  const width = Math.min(8, step * 0.56);
  const radius = (i: number) => R_OUTER - i * step;
  const innermost = n ? radius(n - 1) : R_OUTER;
  const windowAngle = toAngle(today + windowDays * DAY);

  const activeId = hoverId ?? selectedId;
  const active = shown.find((r) => r.contract.id === activeId) ?? null;
  const tabId =
    shown.find((r) => r.contract.id === focusId)?.contract.id ??
    shown.find((r) => r.contract.id === selectedId)?.contract.id ??
    shown[0]?.contract.id;

  const select = (id: string | null) => {
    if (selectedProp === undefined) setInnerSelected(id);
    onSelectedChange?.(id);
  };
  const toggle = (id: string) => select(selectedId === id ? null : id);

  const focusRing = (i: number) =>
    svgRef.current?.querySelector<SVGGElement>(`[data-ring="${i}"]`)?.focus();

  const onKeyDown = (event: React.KeyboardEvent) => {
    const i = shown.findIndex((r) => r.contract.id === tabId);
    if (event.key === "Escape") {
      setHoverId(null);
      if (selectedId !== null) select(null);
      return;
    }
    const moves: Record<string, number> = {
      ArrowUp: i - 1,
      ArrowLeft: i - 1,
      ArrowDown: i + 1,
      ArrowRight: i + 1,
      Home: 0,
      End: n - 1,
    };
    const to = moves[event.key];
    if (to === undefined) return;
    event.preventDefault();
    focusRing(Math.min(Math.max(to, 0), n - 1));
  };

  const monthStep = Math.max(1, Math.ceil(horizonMonths / 12));
  const months = Array.from({ length: Math.floor(horizonMonths / monthStep) }, (_, k) => {
    const m = k * monthStep;
    return {
      m,
      deg: (m / horizonMonths) * 360,
      label: formatMonth(new Date(addMonths(today, m))),
    };
  });
  const activeMonth = active
    ? Math.round(monthsBetween(today, active.end) / monthStep) * monthStep
    : -1;

  const noticeText = (r: Row) => {
    if (!r.noticeDays) return "None";
    const date = formatDate(new Date(r.noticeAt));
    const d = Math.round((r.noticeAt - today) / DAY);
    return d < 0 ? `${date}, passed` : d === 0 ? `${date}, today` : `${date}, in ${d} d`;
  };
  const describe = (r: Row) =>
    `${r.contract.name}: ends ${formatDate(new Date(r.end))}, ${plural(r.days, "day")} left, ${formatValue(r.contract.value)} ACV, ${r.contract.autoRenew ? "auto-renews" : "does not auto-renew"}, notice ${noticeText(r)}.`;

  const summary = `${heading}: ${plural(rows.length, "contract")} end in the next ${horizonMonths} months, ${inWindow.length} within ${windowDays} days. ${shown.map(describe).join(" ")}`;

  const sweepIn = intro && !reduce;
  const fast = keyboard || reduce ? instant : enter;

  return (
    <MotionConfig reducedMotion="user">
      <Shell className={cn("max-w-2xl", className)}>
        <ShellHeader
          icon={ClockCountdown}
          title={title}
          subtitle={subtitle ?? `Next ${horizonMonths} months · from today`}
          aside={
            <StatusPill
              tone={inWindow.length ? "warning" : "neutral"}
              size="sm"
              className="tabular-nums"
            >
              {inWindow.length} in {windowDays} d
            </StatusPill>
          }
        />
        <Panel className="p-4 @max-sm:p-3 @lg:p-5">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <h4 className="text-sm font-medium">{heading}</h4>
            <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {n} of {rows.length} shown
            </p>
          </div>

          <div
            className={cn(
              "grid gap-4",
              details &&
                "@lg:grid-cols-[minmax(0,1fr)_13.5rem] @lg:items-center @lg:gap-5",
            )}
          >
            <div className="min-w-0">
              <div className="relative mx-auto aspect-square w-full max-w-[21rem]">
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${SIZE} ${SIZE}`}
                  role="group"
                  aria-label={`${heading}. Arrow keys move between contracts, Enter selects.`}
                  aria-describedby={summaryId}
                  onKeyDown={onKeyDown}
                  onPointerLeave={() => setHoverId(null)}
                  className="block size-full overflow-visible select-none"
                >
                  {/* Renewal window as a faint wedge behind the rings. */}
                  {n > 0 && windowAngle > 0 && (
                    <path
                      d={sector(innermost - step / 2, R_OUTER + step / 2, windowAngle)}
                      className="fill-foreground/[0.03]"
                    />
                  )}

                  {months.map(({ m, deg, label }) => {
                    const [x, y] = point(R_LABEL, deg);
                    const [tx, ty] = point(
                      R_LABEL,
                      deg + (monthStep / horizonMonths) * 180,
                    );
                    return (
                      <g key={m} aria-hidden="true">
                        <text
                          x={n2(x)}
                          y={n2(y)}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className={cn(
                            "font-mono text-[10px] tabular-nums transition-[fill] duration-150",
                            m === activeMonth
                              ? "fill-foreground"
                              : "fill-muted-foreground",
                          )}
                        >
                          {label}
                        </text>
                        <circle
                          cx={n2(tx)}
                          cy={n2(ty)}
                          r={1.1}
                          className="fill-foreground/25"
                        />
                      </g>
                    );
                  })}

                  <AnimatePresence initial={sweepIn}>
                    {shown.map((r, i) => {
                      const id = r.contract.id;
                      const rr = radius(i);
                      const on = active?.contract.id === id;
                      const dim = active !== null && !on;
                      const termTo = r.noticeDays ? r.noticeAngle : r.angle;
                      const duration = 0.25 + 0.35 * (r.angle / 360);
                      const delay = i * 0.08;
                      const landed = delay + duration * 0.9;
                      return (
                        <motion.g
                          key={id}
                          data-ring={i}
                          role="button"
                          tabIndex={id === tabId ? 0 : -1}
                          aria-pressed={selectedId === id}
                          aria-label={describe(r)}
                          initial={{ opacity: 1 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, transition: exit }}
                          onPointerEnter={() => {
                            setKeyboard(false);
                            setHoverId(id);
                          }}
                          onFocus={() => {
                            setFocusId(id);
                            setKeyboard(true);
                            setHoverId(id);
                          }}
                          onBlur={() => setHoverId((h) => (h === id ? null : h))}
                          onClick={() => toggle(id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              toggle(id);
                            }
                          }}
                          className="cursor-pointer outline-none"
                        >
                          <g
                            className="transition-opacity duration-150"
                            style={{
                              opacity: dim ? 0.32 : 1,
                              transitionTimingFunction: CSS_EASE_OUT,
                            }}
                          >
                            <motion.circle
                              cx={C}
                              cy={C}
                              initial={false}
                              animate={{ r: rr }}
                              transition={spring}
                              fill="none"
                              strokeWidth={width}
                              className={cn(
                                "transition-[stroke] duration-150",
                                on ? "stroke-brand/15" : "stroke-foreground/[0.06]",
                              )}
                            />
                            {termTo > 0.2 && (
                              <motion.path
                                initial={{ pathLength: 0, d: arc(rr, 0, termTo) }}
                                animate={{ pathLength: 1, d: arc(rr, 0, termTo) }}
                                transition={{
                                  d: spring,
                                  pathLength: { duration, delay, ease: EASE_OUT },
                                }}
                                fill="none"
                                strokeWidth={width}
                                className={cn(
                                  "transition-[stroke] duration-150",
                                  on
                                    ? "stroke-brand"
                                    : r.inWindow
                                      ? "stroke-foreground/55"
                                      : "stroke-foreground/30",
                                )}
                              />
                            )}
                            {r.noticeDays > 0 && r.angle - r.noticeAngle > 0.3 && (
                              <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{
                                  duration: 0.2,
                                  delay: landed,
                                  ease: EASE_OUT,
                                }}
                              >
                                <motion.path
                                  initial={false}
                                  animate={{ d: arc(rr, r.noticeAngle, r.angle) }}
                                  transition={spring}
                                  fill="none"
                                  strokeWidth={width}
                                  className="stroke-warning/20"
                                />
                                <motion.path
                                  initial={false}
                                  animate={{ d: arc(rr, r.noticeAngle, r.angle) }}
                                  transition={spring}
                                  fill="none"
                                  strokeWidth={width}
                                  strokeDasharray="1.3 1.7"
                                  className="stroke-warning"
                                />
                              </motion.g>
                            )}
                            <motion.path
                              initial={{
                                opacity: 0,
                                d: radial(
                                  rr - width / 2 - 2.5,
                                  rr + width / 2 + 2.5,
                                  r.angle,
                                ),
                              }}
                              animate={{
                                opacity: 1,
                                d: radial(
                                  rr - width / 2 - 2.5,
                                  rr + width / 2 + 2.5,
                                  r.angle,
                                ),
                              }}
                              transition={{
                                d: spring,
                                opacity: {
                                  duration: 0.15,
                                  delay: landed,
                                  ease: EASE_OUT,
                                },
                              }}
                              strokeWidth={1.5}
                              strokeLinecap="round"
                              className={cn(
                                "transition-[stroke] duration-150",
                                on ? "stroke-brand" : "stroke-foreground/80",
                              )}
                            />
                            {/* Hit area: the whole ring, not only the arc. */}
                            <motion.circle
                              cx={C}
                              cy={C}
                              initial={false}
                              animate={{ r: rr }}
                              transition={spring}
                              fill="none"
                              stroke="transparent"
                              strokeWidth={step}
                              pointerEvents="stroke"
                            />
                          </g>
                          <g
                            style={{
                              transform: `translateY(${-rr}px)`,
                              transition: `transform 300ms ${CSS_EASE_OUT}`,
                            }}
                          >
                            <motion.text
                              x={C - 7}
                              y={C}
                              textAnchor="end"
                              dominantBaseline="central"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: dim ? 0.5 : 1 }}
                              transition={{
                                duration: 0.2,
                                delay: sweepIn && !active ? delay : 0,
                                ease: EASE_OUT,
                              }}
                              style={{
                                stroke: "var(--surface-inset)",
                                strokeWidth: 3,
                                strokeLinejoin: "round",
                                paintOrder: "stroke",
                              }}
                              className={cn(
                                "text-[10px] font-medium transition-[fill] duration-150",
                                on ? "fill-brand" : "fill-muted-foreground",
                              )}
                            >
                              {short(r.contract.name)}
                            </motion.text>
                          </g>
                        </motion.g>
                      );
                    })}
                  </AnimatePresence>

                  {n > 0 && (
                    <g aria-hidden="true" pointerEvents="none">
                      {/* Renewal window boundary. */}
                      <path
                        d={radial(
                          innermost - step / 2,
                          R_OUTER + step / 2 + 4,
                          windowAngle,
                        )}
                        strokeWidth={1.5}
                        strokeDasharray="0 3.5"
                        strokeLinecap="round"
                        className="stroke-foreground/45"
                      />
                      {/* Today: every ring starts here. */}
                      <line
                        x1={C}
                        x2={C}
                        y1={C - innermost + step / 2 + 2}
                        y2={C - R_OUTER - 10}
                        strokeWidth={1.5}
                        className="stroke-brand"
                      />
                      <circle
                        cx={C}
                        cy={C - R_OUTER - 10}
                        r={2.75}
                        className="fill-brand"
                      />
                      <text
                        x={C + 7}
                        y={C - R_OUTER - 10}
                        dominantBaseline="central"
                        className="fill-brand text-[9.5px] font-medium"
                      >
                        Today
                      </text>
                    </g>
                  )}
                </svg>

                {/* Center summary: the window count, or the active contract's days left. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
                >
                  <span className="text-[1.375rem] leading-none font-medium tracking-tight tabular-nums @sm:text-2xl">
                    <RollingNumber value={active ? active.days : inWindow.length} />
                  </span>
                  <span className="mt-1 text-[0.6875rem] leading-tight text-muted-foreground">
                    {active
                      ? active.days === 1
                        ? "day left"
                        : "days left"
                      : `in ${windowDays} days`}
                  </span>
                </div>
              </div>

              <ul
                aria-hidden="true"
                className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground"
              >
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-3.5 rounded-full bg-foreground/55" />
                  Term
                </li>
                <li className="flex items-center gap-1.5">
                  <svg
                    viewBox="0 0 14 6"
                    className="h-1.5 w-3.5 overflow-hidden rounded-full"
                  >
                    <rect width="14" height="6" className="fill-warning/20" />
                    <path
                      d="M0 3 H14"
                      strokeWidth={6}
                      strokeDasharray="1.3 1.7"
                      className="stroke-warning"
                    />
                  </svg>
                  Notice
                </li>
                <li className="flex items-center gap-1.5">
                  <svg viewBox="0 0 14 6" className="h-1.5 w-3.5">
                    <path
                      d="M1.5 3 H13"
                      strokeWidth={2}
                      strokeDasharray="0 3.5"
                      strokeLinecap="round"
                      className="stroke-foreground/60"
                    />
                  </svg>
                  {windowDays} days
                </li>
              </ul>
            </div>

            {details && (
              <Inset className="flex flex-col px-3.5 py-3 @lg:min-h-[15rem]">
                <AnimatePresence mode="wait" initial={false}>
                  {active ? (
                    <motion.div
                      key={active.contract.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: fast }}
                      exit={{ opacity: 0, transition: keyboard ? instant : exit }}
                      className="flex flex-1 flex-col"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-medium">
                          {active.contract.name}
                        </p>
                        <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {active.days} d left
                        </p>
                      </div>
                      <dl className="mt-2.5 grid gap-1.5 text-xs">
                        <Detail label="Ends">{formatDate(new Date(active.end))}</Detail>
                        <Detail label="ACV">{formatValue(active.contract.value)}</Detail>
                        <Detail label="Auto-renew">
                          {active.contract.autoRenew ? "Yes" : "No"}
                        </Detail>
                        <Detail
                          label="Notice due"
                          className={cn(
                            active.noticeDays > 0 &&
                              active.noticeAt - today <= noticeSoonDays * DAY &&
                              (active.noticeAt < today
                                ? "text-negative"
                                : "text-warning"),
                          )}
                        >
                          {noticeText(active)}
                        </Detail>
                      </dl>
                      {active.contract.note && (
                        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                          {active.contract.note}
                        </p>
                      )}
                      {actions && actions.length > 0 && (
                        <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                          {actions
                            .filter((a) => !a.hidden?.(active.contract))
                            .map((a) => (
                              <Button
                                key={a.label}
                                icon={a.icon}
                                className="h-7 px-3 text-xs"
                                onClick={() => a.onSelect(active.contract)}
                              >
                                {a.label}
                              </Button>
                            ))}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.p
                      key="hint"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: fast }}
                      exit={{ opacity: 0, transition: keyboard ? instant : exit }}
                      className="m-auto max-w-[15rem] py-1 text-center text-xs text-muted-foreground"
                    >
                      {n
                        ? "Point at a ring, or tab to it, to see the contract."
                        : "Nothing renews in this window."}
                    </motion.p>
                  )}
                </AnimatePresence>
              </Inset>
            )}
          </div>

          <p id={summaryId} className="sr-only">
            {summary}
          </p>
        </Panel>

        {stats && (
          <dl className="grid grid-cols-3 gap-x-3 px-3.5 pt-3.5 pb-2 @sm:flex @sm:gap-x-10">
            <Stat
              label="Notice due"
              value={noticeSoon}
              unit={`in ${noticeSoonDays} d`}
              tone="warning"
            />
            <Stat
              label="Auto-renew"
              value={autoRenew}
              unit={`of ${inWindow.length}`}
              tone="brand"
            />
            <Stat label="Up for renewal" value={acv} unit="ACV" format={formatValue} />
          </dl>
        )}
      </Shell>
    </MotionConfig>
  );
}

function Detail({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-right text-foreground tabular-nums", className)}>
        {children}
      </dd>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  tone,
  format,
}: {
  label: string;
  value: number;
  unit: string;
  tone?: "warning" | "brand";
  format?: (n: number) => string;
}) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 flex items-center gap-1.5 whitespace-nowrap">
        {tone && (
          <span
            aria-hidden="true"
            className={cn(
              "h-[3px] w-3 shrink-0 rounded-full @max-[20rem]:hidden",
              tone === "warning" ? "bg-warning" : "bg-brand",
            )}
          />
        )}
        <span className="text-[0.9375rem] font-medium text-foreground tabular-nums @sm:text-lg">
          <RollingNumber value={value} format={format} />
        </span>
        <span className="truncate text-xs text-muted-foreground">{unit}</span>
      </dd>
    </div>
  );
}
