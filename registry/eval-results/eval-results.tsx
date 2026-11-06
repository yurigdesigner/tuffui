// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import { ArrowDown, ArrowUp, Check, CircleNotch, Flask, X } from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useRef, useState, type KeyboardEvent } from "react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { RollingNumber } from "@/components/ui/rolling-number";
import { Segmented } from "@/components/ui/segmented-control";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { Inset, Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { enter } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type EvalStatus =
  "pending" | "running" | "pass" | "fail" | "regressed" | "improved";

export type EvalCase = {
  id: string;
  name: string;
  status: EvalStatus;
  /** Grader score from 0 to 1. */
  score?: number;
  input?: string;
  expected?: string;
  actual?: string;
  /** Why the grader scored it this way. */
  reason?: string;
};

export type EvalMetric = {
  id: string;
  label: string;
  baseline: number;
  candidate: number;
  /** Which direction counts as an improvement. */
  better: "higher" | "lower";
  format?: (value: number) => string;
};

export type EvalFilter = "all" | "failed" | "regressed" | "improved";

export type EvalResultsProps = {
  data: {
    suite: string;
    /** e.g. "opus-5.5 vs sonnet-5.5". */
    label?: string;
    cases: EvalCase[];
    /** Baseline pass rate (0–1) for the delta next to the big number. */
    baselinePassRate?: number;
    metrics?: EvalMetric[];
  };
  /** `grid` shows every case; `compare` shows metrics and regressions. */
  view?: "grid" | "compare";
  filter?: EvalFilter;
  onFilterChange?: (filter: EvalFilter) => void;
  selectedId?: string | null;
  onSelectCase?: (testCase: EvalCase) => void;
  className?: string;
};

const COLS = 12;

const statuses: Record<
  EvalStatus,
  { label: string; cell: string; icon?: typeof Check; tone: StatusTone }
> = {
  pending: {
    label: "Pending",
    cell: "bg-foreground/[0.07]",
    tone: "neutral",
  },
  running: {
    label: "Running",
    cell: "bg-brand/20 text-brand",
    icon: CircleNotch,
    tone: "brand",
  },
  pass: {
    label: "Pass",
    cell: "bg-positive/15 text-positive",
    icon: Check,
    tone: "positive",
  },
  fail: {
    label: "Fail",
    cell: "bg-negative/80 text-white",
    icon: X,
    tone: "negative",
  },
  regressed: {
    label: "Regressed",
    cell: "bg-warning/85 text-white",
    icon: ArrowDown,
    tone: "warning",
  },
  improved: {
    label: "Improved",
    cell: "bg-brand/20 text-brand",
    icon: ArrowUp,
    tone: "brand",
  },
};

const filters: { id: EvalFilter; label: string; match: (s: EvalStatus) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "failed", label: "Failed", match: (s) => s === "fail" || s === "regressed" },
  { id: "regressed", label: "Regressed", match: (s) => s === "regressed" },
  { id: "improved", label: "Improved", match: (s) => s === "improved" },
];

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export function EvalResults({
  data,
  view = "grid",
  filter: filterProp,
  onFilterChange,
  selectedId: selectedProp,
  onSelectCase,
  className,
}: EvalResultsProps) {
  const { cases } = data;
  const [filterState, setFilter] = useState<EvalFilter>("all");
  const [selectedState, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState(0);
  const [animateDetail, setAnimateDetail] = useState(true);
  const cells = useRef<(HTMLButtonElement | null)[]>([]);
  const filter = filterProp ?? filterState;
  const selectedId = selectedProp !== undefined ? selectedProp : selectedState;
  const selected = cases.find((c) => c.id === selectedId);
  const match = filters.find((f) => f.id === filter)!.match;

  const finished = cases.filter((c) => c.status !== "pending" && c.status !== "running");
  const passed = finished.filter((c) => c.status === "pass" || c.status === "improved");
  const rate = finished.length ? passed.length / finished.length : 0;
  const delta = data.baselinePassRate !== undefined ? rate - data.baselinePassRate : null;
  const inFlight = cases.length - finished.length;
  const regressed = cases.filter((c) => c.status === "regressed");

  const select = (c: EvalCase, viaKeyboard: boolean) => {
    setAnimateDetail(!viaKeyboard);
    setSelected(c.id);
    onSelectCase?.(c);
  };

  const onGridKey = (e: KeyboardEvent) => {
    const moves: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: COLS,
      ArrowUp: -COLS,
    };
    let next = focus;
    if (e.key in moves) next = focus + moves[e.key];
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = cases.length - 1;
    else return;
    e.preventDefault();
    next = Math.max(0, Math.min(cases.length - 1, next));
    setFocus(next);
    cells.current[next]?.focus();
  };

  return (
    <MotionConfig reducedMotion="user">
      <Shell
        aria-label={`Eval results: ${data.suite}`}
        className={cn("max-w-lg", className)}
      >
        <ShellHeader
          icon={Flask}
          title={<span className="font-mono">{data.suite}</span>}
          subtitle={
            <>
              {data.label ? `${data.label} · ` : ""}
              {inFlight ? (
                <>
                  <RollingNumber value={String(inFlight)} /> of {cases.length} running
                </>
              ) : (
                `${cases.length} cases`
              )}
            </>
          }
          aside={
            <div className="text-right">
              <p className="font-mono text-2xl leading-tight font-medium tracking-tight tabular-nums">
                <RollingNumber value={pct(rate)} />
              </p>
              {delta !== null && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 font-mono text-xs tabular-nums",
                    delta >= 0 ? "text-positive" : "text-negative",
                  )}
                >
                  {delta >= 0 ? (
                    <ArrowUp weight="bold" className="size-3" aria-hidden="true" />
                  ) : (
                    <ArrowDown weight="bold" className="size-3" aria-hidden="true" />
                  )}
                  <span className="sr-only">{delta >= 0 ? "Up" : "Down"}</span>
                  <RollingNumber value={Math.abs(delta * 100).toFixed(1)} /> pts vs
                  baseline
                </span>
              )}
            </div>
          }
        />

        <Panel className="p-3">
          {view === "grid" ? (
            <>
              <Segmented
                label="Filter cases"
                className="mb-3"
                value={filter}
                onValueChange={(next) => {
                  setFilter(next);
                  onFilterChange?.(next);
                }}
                options={filters.map((f) => ({
                  value: f.id,
                  label: (
                    <>
                      {f.label}
                      <RollingNumber
                        className="ml-1.5 font-mono text-xs opacity-60"
                        value={String(cases.filter((c) => f.match(c.status)).length)}
                      />
                    </>
                  ),
                }))}
              />
              <div
                role="grid"
                aria-label="Cases"
                onKeyDown={onGridKey}
                className="grid grid-cols-12 gap-1"
              >
                {cases.map((c, i) => {
                  const s = statuses[c.status];
                  const Icon = s.icon;
                  const dim = !match(c.status);
                  return (
                    <button
                      key={c.id}
                      ref={(el) => {
                        cells.current[i] = el;
                      }}
                      type="button"
                      role="gridcell"
                      tabIndex={i === focus ? 0 : -1}
                      aria-selected={c.id === selectedId}
                      aria-label={`${c.name}: ${s.label}`}
                      title={`${c.name} · ${s.label}`}
                      onFocus={() => setFocus(i)}
                      onClick={(e) => select(c, e.detail === 0)}
                      className={cn(
                        "flex aspect-square items-center justify-center rounded-[5px] transition-[background-color,opacity,scale] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.92] motion-reduce:transition-none",
                        s.cell,
                        dim && "opacity-20",
                        // Selection changes the shape, not an outline.
                        c.id === selectedId && "scale-90 rounded-full",
                      )}
                    >
                      {Icon && (
                        <Icon
                          weight="bold"
                          className={cn(
                            "size-3",
                            c.status === "running" &&
                              "animate-spin motion-reduce:animate-none",
                          )}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <Compare
              metrics={data.metrics ?? []}
              regressed={regressed}
              onSelect={(c, kb) => select(c, kb)}
            />
          )}

          <AnimatePresence mode="wait" initial={false}>
            {selected && (
              <motion.div
                key={selected.id}
                initial={animateDetail ? { opacity: 0, y: 4 } : false}
                animate={{ opacity: 1, y: 0, transition: enter }}
                exit={{ opacity: 0, transition: { duration: animateDetail ? 0.12 : 0 } }}
                className="mt-3"
              >
                <Inset className="p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate font-mono text-[0.8125rem]">
                      {selected.name}
                    </p>
                    <StatusPill
                      size="sm"
                      tone={statuses[selected.status].tone}
                      className="text-xs"
                    >
                      {statuses[selected.status].label}
                    </StatusPill>
                    {selected.score !== undefined && (
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">
                        score {selected.score.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <dl className="grid gap-2 @lg:grid-cols-3">
                    {(
                      [
                        ["Input", selected.input],
                        ["Expected", selected.expected],
                        ["Actual", selected.actual],
                      ] as const
                    ).map(([label, value]) => (
                      <div
                        key={label}
                        className="min-w-0 rounded-lg bg-surface-inset p-2"
                      >
                        <dt className="mb-1 text-xs text-muted-foreground">{label}</dt>
                        <dd className="font-mono text-xs break-words whitespace-pre-wrap">
                          {value ?? "—"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {selected.reason && (
                    <p className="mt-2 text-[0.8125rem] text-muted-foreground">
                      {selected.reason}
                    </p>
                  )}
                </Inset>
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>

        <p role="status" aria-live="polite" className="sr-only">
          {cases.length > 0 && !inFlight
            ? `Eval finished: ${passed.length} of ${cases.length} passed`
            : ""}
        </p>
      </Shell>
    </MotionConfig>
  );
}

function Compare({
  metrics,
  regressed,
  onSelect,
}: {
  metrics: EvalMetric[];
  regressed: EvalCase[];
  onSelect: (c: EvalCase, viaKeyboard: boolean) => void;
}) {
  return (
    <div>
      <ul className="space-y-3">
        {metrics.map((m) => {
          const max = Math.max(m.baseline, m.candidate, Number.EPSILON);
          const fmt = m.format ?? ((v: number) => v.toLocaleString("en-US"));
          const diff = m.candidate - m.baseline;
          const improved = m.better === "higher" ? diff > 0 : diff < 0;
          const same = Math.abs(diff) < Number.EPSILON;
          return (
            <li key={m.id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[0.8125rem]">
                <span>{m.label}</span>
                <StatusPill
                  size="sm"
                  tone={same ? "neutral" : improved ? "positive" : "negative"}
                  className="text-xs"
                >
                  {same
                    ? "No change"
                    : `${improved ? "Better" : "Worse"} · ${fmt(Math.abs(diff))}`}
                </StatusPill>
              </div>
              {(
                [
                  ["Baseline", m.baseline, "neutral"],
                  ["Candidate", m.candidate, "brand"],
                ] as const
              ).map(([label, value, color]) => (
                <div key={label} className="flex items-center gap-2 py-0.5">
                  <span className="w-16 shrink-0 text-xs text-muted-foreground">
                    {label}
                  </span>
                  <ProgressBar
                    kind="meter"
                    striped
                    tone={color}
                    value={value}
                    max={max}
                    label={`${m.label}, ${label.toLowerCase()}`}
                    valueText={fmt(value)}
                    className="flex-1"
                  />
                  <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums">
                    {fmt(value)}
                  </span>
                </div>
              ))}
            </li>
          );
        })}
      </ul>
      <h4 className="mt-4 mb-1 text-[0.8125rem] text-muted-foreground">
        Regressed cases · {regressed.length}
      </h4>
      {regressed.length === 0 ? (
        <p className="py-2 text-[0.8125rem] text-muted-foreground">Nothing regressed.</p>
      ) : (
        <ul>
          {regressed.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={(e) => onSelect(c, e.detail === 0)}
                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-[background-color,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-foreground/[0.04] active:scale-[0.99]"
              >
                <ArrowDown
                  weight="bold"
                  className="size-3.5 shrink-0 text-warning"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate font-mono text-[0.8125rem]">
                  {c.name}
                </span>
                {c.score !== undefined && (
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {c.score.toFixed(2)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
