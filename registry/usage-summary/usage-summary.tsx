// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import { ArrowDownRight, ArrowUpRight, ChartBar, Warning } from "@phosphor-icons/react";
import { MotionConfig, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { RollingNumber } from "@/components/ui/rolling-number";
import { StatusPill } from "@/components/ui/status-pill";
import { Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { EASE_OUT } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type UsageModel = {
  id: string;
  name: string;
  /** Any CSS color. Defaults to the built-in palette by position. */
  color?: string;
};

export type UsageDay = {
  /** ISO date, such as "2026-11-03". */
  date: string;
  /** Tokens and cost per model id. Missing models count as zero. */
  byModel: Record<string, { tokens: number; cost: number }>;
};

export type UsageSummaryProps = {
  data: {
    days: UsageDay[];
    models: UsageModel[];
    /** Total cost of the previous period of the same length, for the delta. */
    previousCost?: number;
    budget?: { limit: number; label?: string };
  };
  /** ISO 4217 code used to format costs. */
  currency?: string;
  /** Share of the budget (0–1) past which the budget bar warns. */
  warnAt?: number;
  title?: string;
  onSelectDay?: (day: UsageDay) => void;
  /** BCP 47 locale for dates, costs and percentages, e.g. `he-IL`. */
  locale?: string;
  /** UI strings, for translating the card. */
  labels?: Partial<UsageSummaryLabels>;
  className?: string;
};

export type UsageSummaryLabels = {
  /** Used when `title` is left out. */
  title: string;
  /** `tokens` is the animated number. */
  subtitle: (days: number, tokens: ReactNode) => ReactNode;
  up: string;
  down: string;
  /** `percent` is the animated number. */
  vsPrevious: (percent: ReactNode) => ReactNode;
  chart: string;
  /** Token count in a bar's accessible name. */
  tokens: (tokens: string) => string;
  overBudget: string;
  closeToBudget: string;
  /** Used when the budget has no `label`. */
  budget: string;
  budgetUsed: string;
  budgetValue: (spent: string, limit: string, percent: string) => string;
  /** Announced past `warnAt`. */
  budgetWarning: (percent: string) => string;
};

const defaultLabels: UsageSummaryLabels = {
  title: "Usage",
  subtitle: (days, tokens) => (
    <>
      Last {days} days · {tokens} tokens
    </>
  ),
  up: "Up",
  down: "Down",
  vsPrevious: (percent) => <>{percent} vs previous</>,
  chart: "Daily cost by model. Use arrow keys to move between days.",
  tokens: (tokens) => `${tokens} tokens`,
  overBudget: "Over budget",
  closeToBudget: "Close to the budget",
  budget: "Monthly budget",
  budgetUsed: "Budget used",
  budgetValue: (spent, limit, percent) => `${spent} of ${limit} (${percent})`,
  budgetWarning: (percent) => `${percent} of the budget used`,
};

const stripes =
  "bg-[image:repeating-linear-gradient(-45deg,rgb(255_255_255/0.16)_0_3px,transparent_3px_7px)]";
// Series colors: the brand, purple, cyan, yellow, green, gray.
const palette = ["var(--brand)", "#bf5af2", "#40b4ff", "#f5c000", "#30c05a", "#8e8e93"];

const spring = { type: "spring", duration: 0.5, bounce: 0 } as const;

const formatTokens = (n: number) =>
  n < 1000
    ? `${Math.round(n)}`
    : n < 1_000_000
      ? `${(n / 1000).toFixed(n < 100_000 ? 1 : 0)}k`
      : `${(n / 1_000_000).toFixed(1)}M`;

const dayLabel = (date: string, locale: string, format: Intl.DateTimeFormatOptions) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString(locale, {
    timeZone: "UTC",
    ...format,
  });

const sum = (day: UsageDay, key: "tokens" | "cost") =>
  Object.values(day.byModel).reduce((n, m) => n + m[key], 0);

export function UsageSummary({
  data,
  currency = "USD",
  warnAt = 0.8,
  title: titleProp,
  onSelectDay,
  locale = "en-US",
  labels: labelOverrides,
  className,
}: UsageSummaryProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const title = titleProp ?? labels.title;
  const { days, budget, previousCost } = data;
  const money = (n: number) =>
    n.toLocaleString(locale, { style: "currency", currency, maximumFractionDigits: 2 });
  const percent = (n: number) =>
    new Intl.NumberFormat(locale, { style: "percent" }).format(n / 100);
  const longDay = (date: string) =>
    dayLabel(date, locale, { weekday: "short", month: "short", day: "numeric" });
  // The plot runs left to right in every direction; only the tooltip text follows the page.
  const plot = useRef<HTMLDivElement>(null);
  const [rtl, setRtl] = useState(false);
  useEffect(() => {
    const outer = plot.current?.parentElement;
    setRtl(!!outer && getComputedStyle(outer).direction === "rtl");
  }, []);
  const models = data.models.map((m, i) => ({
    ...m,
    color: m.color ?? palette[i % palette.length],
  }));
  const [active, setActive] = useState<number | null>(null);
  // Only the first tooltip of a hover session animates; moving between bars or
  // stepping with the keyboard swaps it instantly.
  const [instantTip, setInstantTip] = useState(false);
  const [focusIndex, setFocusIndex] = useState(days.length - 1);
  const bars = useRef<(HTMLButtonElement | null)[]>([]);

  const totalCost = days.reduce((n, d) => n + sum(d, "cost"), 0);
  const totalTokens = days.reduce((n, d) => n + sum(d, "tokens"), 0);
  const max = Math.max(...days.map((d) => sum(d, "cost")), 0.0001);
  const delta = previousCost ? (totalCost - previousCost) / previousCost : null;
  const dense = days.length > 14;

  const perModel = models.map((m) => ({
    ...m,
    tokens: days.reduce((n, d) => n + (d.byModel[m.id]?.tokens ?? 0), 0),
    cost: days.reduce((n, d) => n + (d.byModel[m.id]?.cost ?? 0), 0),
  }));

  const spent = budget ? totalCost / budget.limit : 0;
  const overWarn = budget && spent >= warnAt;
  const over = budget && spent >= 1;

  const move = (index: number) => {
    const next = Math.max(0, Math.min(days.length - 1, index));
    setFocusIndex(next);
    setInstantTip(true);
    setActive(next);
    bars.current[next]?.focus();
  };

  const describe = (day: UsageDay) =>
    `${longDay(day.date)}: ${money(sum(day, "cost"))}, ${labels.tokens(formatTokens(sum(day, "tokens")))}. ` +
    models
      .filter((m) => day.byModel[m.id])
      .map((m) => `${m.name} ${money(day.byModel[m.id].cost)}`)
      .join(", ");

  return (
    <MotionConfig reducedMotion="user">
      <Shell aria-label={title} className={cn("max-w-lg", className)}>
        <ShellHeader
          icon={ChartBar}
          title={title}
          subtitle={labels.subtitle(
            days.length,
            <RollingNumber value={formatTokens(totalTokens)} />,
          )}
          aside={
            <div className="text-end">
              <p className="text-2xl font-medium tracking-tight tabular-nums">
                <RollingNumber value={money(totalCost)} />
              </p>
              {delta !== null && (
                <StatusPill
                  size="sm"
                  tone={delta > 0 ? "warning" : "positive"}
                  icon={delta > 0 ? ArrowUpRight : ArrowDownRight}
                  iconWeight="bold"
                  className="mt-0.5 h-auto gap-0.5 px-1.5 text-xs tabular-nums"
                >
                  <span className="sr-only">{delta > 0 ? labels.up : labels.down}</span>
                  {labels.vsPrevious(
                    <RollingNumber value={percent(Math.abs(Math.round(delta * 100)))} />,
                  )}
                </StatusPill>
              )}
            </div>
          }
        />

        <Panel>
          <div
            ref={plot}
            role="group"
            aria-label={labels.chart}
            dir="ltr"
            className={cn(
              "relative flex h-44 items-end px-4 pt-14 pb-2",
              dense ? "gap-[3px]" : "gap-2",
            )}
            onMouseLeave={() => setActive(null)}
          >
            {days.map((day, i) => {
              const cost = sum(day, "cost");
              const align =
                i < 2
                  ? "left-0"
                  : i > days.length - 3
                    ? "right-0"
                    : "left-1/2 -translate-x-1/2";
              return (
                <div
                  key={day.date}
                  className="relative flex h-full flex-1 flex-col justify-end"
                >
                  <button
                    ref={(el) => {
                      bars.current[i] = el;
                    }}
                    type="button"
                    tabIndex={i === focusIndex ? 0 : -1}
                    aria-label={describe(day)}
                    onMouseEnter={() => {
                      setInstantTip(active !== null);
                      setActive(i);
                    }}
                    onFocus={() => {
                      setActive(i);
                      setFocusIndex(i);
                    }}
                    onBlur={() => setActive(null)}
                    onClick={() => onSelectDay?.(day)}
                    onKeyDown={(e) => {
                      const keys: Record<string, number> = {
                        ArrowLeft: i - 1,
                        ArrowRight: i + 1,
                        Home: 0,
                        End: days.length - 1,
                      };
                      if (e.key in keys) {
                        e.preventDefault();
                        move(keys[e.key]);
                      }
                    }}
                    className="flex h-full w-full flex-col justify-end rounded-md outline-offset-2"
                  >
                    <motion.span
                      initial={false}
                      animate={{ height: `${(cost / max) * 100}%` }}
                      transition={spring}
                      className={cn(
                        "flex min-h-1 w-full flex-col-reverse transition-opacity",
                        dense ? "gap-px" : "gap-[3px]",
                        active !== null && active !== i && "opacity-45",
                      )}
                    >
                      {models.map((m) => {
                        const share =
                          (day.byModel[m.id]?.cost ?? 0) / Math.max(cost, 0.0001);
                        return share > 0 ? (
                          <span
                            key={m.id}
                            className={cn(
                              "w-full shrink-0",
                              dense ? "rounded-[2px]" : "rounded-[5px]",
                              // Today is still counting up.
                              i === days.length - 1 && stripes,
                            )}
                            style={{
                              height: `${share * 100}%`,
                              backgroundColor: m.color,
                            }}
                          />
                        ) : null;
                      })}
                    </motion.span>
                  </button>
                  {active === i && (
                    <motion.div
                      initial={instantTip ? false : { opacity: 0, scale: 0.97, y: 2 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.125, ease: EASE_OUT }}
                      style={{
                        transformOrigin:
                          i < 2
                            ? "bottom left"
                            : i > days.length - 3
                              ? "bottom right"
                              : "bottom",
                      }}
                      aria-hidden="true"
                      dir={rtl ? "rtl" : undefined}
                      className={cn(
                        "pointer-events-none absolute bottom-full z-10 mb-2 w-max min-w-36 rounded-xl bg-surface-raised px-3 py-2 text-xs",
                        align,
                      )}
                    >
                      <p className="mb-1 flex justify-between gap-4 font-medium">
                        {longDay(day.date)}
                        <bdi dir="ltr" className="tabular-nums">
                          {money(cost)}
                        </bdi>
                      </p>
                      {models
                        .filter((m) => day.byModel[m.id])
                        .map((m) => (
                          <p
                            key={m.id}
                            className="flex items-center gap-1.5 text-muted-foreground"
                          >
                            <span
                              className="size-1.5 rounded-full"
                              style={{ background: m.color }}
                            />
                            <span className="flex-1">{m.name}</span>
                            <span className="tabular-nums">
                              <bdi dir="ltr">{money(day.byModel[m.id].cost)}</bdi>
                            </span>
                          </p>
                        ))}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
          <div
            aria-hidden="true"
            dir="ltr"
            className="flex justify-between px-4 pb-3 font-mono text-[0.6875rem] text-muted-foreground"
          >
            {days
              .filter((_, i) => !dense || i % 5 === 0 || i === days.length - 1)
              .map((d) => (
                <span
                  key={d.date}
                  // Labels sit on an LTR axis but read in their own script's direction.
                  dir="auto"
                  className={cn(!dense && "flex-1 text-center")}
                >
                  {dense
                    ? dayLabel(d.date, locale, { month: "short", day: "numeric" })
                    : dayLabel(d.date, locale, { weekday: "short" })}
                </span>
              ))}
          </div>

          <ul className="px-2 pb-2">
            {perModel.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm"
              >
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: m.color }}
                />
                <span className="min-w-0 flex-1 truncate">{m.name}</span>
                <span className="font-mono text-[0.8125rem] text-muted-foreground tabular-nums">
                  {formatTokens(m.tokens)}
                </span>
                <span className="w-20 text-end font-mono text-[0.8125rem] tabular-nums">
                  <bdi dir="ltr">{money(m.cost)}</bdi>
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        {budget && (
          <footer className="px-3.5 pt-3 pb-2.5 text-[0.8125rem]">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p
                className={cn(
                  "flex items-center gap-1.5",
                  over
                    ? "text-negative"
                    : overWarn
                      ? "text-warning"
                      : "text-muted-foreground",
                )}
              >
                {overWarn && (
                  <Warning weight="fill" className="size-3.5" aria-hidden="true" />
                )}
                {over
                  ? labels.overBudget
                  : overWarn
                    ? labels.closeToBudget
                    : (budget.label ?? labels.budget)}
              </p>
              <p dir="ltr" className="font-mono text-muted-foreground tabular-nums">
                <RollingNumber className="text-foreground" value={money(totalCost)} /> /{" "}
                {money(budget.limit)}
              </p>
            </div>
            <ProgressBar
              kind="meter"
              size="sm"
              striped
              tone={over ? "negative" : overWarn ? "warning" : "positive"}
              value={Math.min(Math.round(totalCost * 100) / 100, budget.limit)}
              max={budget.limit}
              label={labels.budgetUsed}
              valueText={labels.budgetValue(
                money(totalCost),
                money(budget.limit),
                percent(Math.round(spent * 100)),
              )}
            />
          </footer>
        )}
        <p role="status" aria-live="polite" className="sr-only">
          {over
            ? labels.overBudget
            : overWarn
              ? labels.budgetWarning(percent(Math.round(spent * 100)))
              : ""}
        </p>
      </Shell>
    </MotionConfig>
  );
}
