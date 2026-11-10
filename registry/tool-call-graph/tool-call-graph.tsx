// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import { Robot, TreeStructure } from "@phosphor-icons/react";
import { MotionConfig, motion, useReducedMotion } from "motion/react";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { Segmented } from "@/components/ui/segmented-control";
import { Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { EASE_OUT, spring } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type ToolCallMetric = "calls" | "latency" | "errors";

export type ToolCallNode = {
  id: string;
  /** Tool name, e.g. `refund.create`. */
  label: string;
  /** Calls in the window. */
  calls: number;
  /** Median latency in milliseconds. */
  p50Ms: number;
  /** Share of calls that failed, `0…1`. */
  errorRate: number;
  /** Retried calls in the window. */
  retries?: number;
};

export type ToolCallStat = {
  label: string;
  value: React.ReactNode;
  /** Draws the value in the accent colour. */
  accent?: boolean;
};

export type ToolCallGraphProps = {
  /** The caller on the left. `meta` is a short second line, e.g. "agent · 3.1k runs". */
  agent: { label: string; meta?: string };
  /** Tools in the order they are drawn, top to bottom. */
  tools: ToolCallNode[];
  /** Controlled metric. Pair with `onMetricChange`. */
  metric?: ToolCallMetric;
  defaultMetric?: ToolCallMetric;
  onMetricChange?: (metric: ToolCallMetric) => void;
  /** Tool to pick out. Defaults to the highest value of the current metric; `null` for none. */
  highlight?: string | null;
  /** Error rate from which a tool reads as failing, `0…1`. */
  errorThreshold?: number;
  title?: string;
  subtitle?: string;
  /** Footer row. Defaults to total calls, error rate and retries. */
  stats?: ToolCallStat[];
  formatLatency?: (ms: number) => string;
  /** Called when a tool node is clicked or pressed. */
  onSelect?: (id: string) => void;
  className?: string;
};

const METRICS: { value: ToolCallMetric; label: string; noun: string }[] = [
  { value: "calls", label: "Calls", noun: "call volume" },
  { value: "latency", label: "Latency", noun: "p50 latency" },
  { value: "errors", label: "Errors", noun: "error rate" },
];

const ROW = 58;
const GAP = 8;
const round = (n: number) => Math.round(n * 100) / 100;
const count = (n: number) => Math.round(n).toLocaleString("en-US");
const percent = (r: number) => `${(r * 100).toFixed(1)}%`;
const seconds = (ms: number) =>
  ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;

const valueOf = (t: ToolCallNode, metric: ToolCallMetric) =>
  metric === "calls" ? t.calls : metric === "latency" ? t.p50Ms : t.errorRate;

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  // null until measured, so the edges draw once at their real size.
  const [width, setWidth] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width ?? 80, width !== null] as const;
}

/**
 * One agent fanned out to the tools it calls. Each edge is as heavy as the
 * chosen metric — call volume, p50 latency or error rate — and the tool with
 * the most of it is picked out with a flowing edge.
 */
export function ToolCallGraph({
  agent,
  tools,
  metric: metricProp,
  defaultMetric = "calls",
  onMetricChange,
  highlight,
  errorThreshold = 0.02,
  title = "Tool call graph",
  subtitle,
  stats,
  formatLatency = seconds,
  onSelect,
  className,
}: ToolCallGraphProps) {
  const uid = useId();
  const reduce = useReducedMotion();
  const [inner, setInner] = useState<ToolCallMetric>(defaultMetric);
  const metric = metricProp ?? inner;
  const [active, setActive] = useState<string | null>(null);
  const [ref, width, measured] = useWidth();

  const setMetric = (next: ToolCallMetric) => {
    if (metricProp === undefined) setInner(next);
    onMetricChange?.(next);
  };

  const max = Math.max(0, ...tools.map((t) => valueOf(t, metric)));
  const hotId =
    highlight !== undefined
      ? highlight
      : max > 0
        ? (tools.find((t) => valueOf(t, metric) === max)?.id ?? null)
        : null;
  const hot = tools.find((t) => t.id === hotId);
  const failing = (t: ToolCallNode) => t.errorRate >= errorThreshold;
  // Errors view paints a failing hot tool red; every other pick uses the accent.
  const hotTone = hot && metric === "errors" && failing(hot) ? "negative" : "brand";
  const noun = METRICS.find((m) => m.value === metric)!.noun;

  const total = tools.reduce((a, t) => a + t.calls, 0);
  const errors = tools.reduce((a, t) => a + t.calls * t.errorRate, 0);
  const retries = tools.some((t) => t.retries !== undefined)
    ? tools.reduce((a, t) => a + (t.retries ?? 0), 0)
    : null;
  const footer: ToolCallStat[] = stats ?? [
    { label: "Calls", value: count(total) },
    { label: "Error rate", value: total ? percent(errors / total) : "–" },
    ...(retries === null ? [] : [{ label: "Retries", value: count(retries) }]),
  ];

  const n = tools.length;
  const height = Math.max(n * ROW + (n - 1) * GAP, ROW);
  const edges = tools.map((t, i) => {
    const norm = max > 0 ? valueOf(t, metric) / max : 0;
    // Edges leave the agent a hair apart, so heavy ones never merge into a blob.
    const y0 = height / 2 + (i - (n - 1) / 2) * 2;
    const y1 = i * (ROW + GAP) + ROW / 2;
    const w = width;
    return {
      t,
      norm,
      d: `M0 ${round(y0)}C${round(w * 0.55)} ${round(y0)} ${round(w * 0.45)} ${round(y1)} ${round(w)} ${round(y1)}`,
    };
  });
  const hotEdge = edges.find((e) => e.t.id === hotId);
  const segmented = (
    <Segmented
      label="Edge metric"
      options={METRICS}
      value={metric}
      onValueChange={setMetric}
    />
  );

  return (
    <MotionConfig reducedMotion="user">
      <Shell className={cn("max-w-2xl", className)}>
        <ShellHeader
          icon={TreeStructure}
          title={title}
          subtitle={subtitle ?? `${agent.label} · ${count(total)} calls`}
          aside={<div className="hidden @lg:block">{segmented}</div>}
        />
        <Panel className="p-4 @max-sm:p-3 @lg:p-5">
          <div className="mb-4 @lg:hidden">{segmented}</div>
          <div
            className="-mx-2 grid grid-cols-[2.25rem_minmax(1.25rem,1fr)_minmax(0,7fr)] items-center rounded-xl px-2 py-4 @md:grid-cols-[8.5rem_minmax(2.5rem,1fr)_minmax(0,2.2fr)] @xl:grid-cols-[9.5rem_minmax(4rem,1fr)_minmax(0,20rem)] @lg:py-7"
            style={{
              backgroundImage:
                "radial-gradient(color-mix(in oklab, var(--foreground) 11%, transparent) 0.8px, transparent 1.2px)",
              backgroundSize: "12px 12px",
              backgroundPosition: "center",
            }}
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--foreground)_5%,var(--surface-inset))] @md:block @md:size-auto @md:p-3">
              <span className="flex size-9 items-center justify-center rounded-lg text-brand @md:size-7 @md:bg-brand/15">
                <Robot weight="fill" aria-hidden="true" className="size-4" />
              </span>
              <div className="sr-only @md:not-sr-only @md:mt-2.5">
                <p className="font-mono text-[0.8125rem] leading-5 text-pretty break-words text-foreground">
                  {agent.label}
                </p>
                {agent.meta && (
                  <p className="mt-0.5 text-xs text-pretty break-words text-muted-foreground">
                    {agent.meta}
                  </p>
                )}
              </div>
            </div>

            <div ref={ref} className="h-full">
              <svg
                key={measured ? "measured" : "guess"}
                visibility={measured ? undefined : "hidden"}
                aria-hidden="true"
                width={width}
                height={height}
                className="block overflow-visible"
              >
                {edges.map(({ t, norm, d }) => {
                  const dim = active !== null && active !== t.id;
                  const focus = active === t.id;
                  const isHot = t.id === hotId;
                  return (
                    <motion.path
                      key={t.id}
                      d={d}
                      fill="none"
                      initial={false}
                      animate={{
                        strokeWidth: 1.25 + norm * 5,
                        opacity: dim ? 0.12 : isHot ? 0.4 : focus ? 1 : 0.3 + norm * 0.5,
                      }}
                      transition={spring}
                      className={cn(
                        "transition-[stroke] duration-200",
                        isHot
                          ? hotTone === "negative"
                            ? "stroke-negative"
                            : "stroke-brand"
                          : focus
                            ? "stroke-foreground/70"
                            : "stroke-foreground/45",
                      )}
                    />
                  );
                })}
                {hotEdge && (
                  // Dashes flow from the agent to the tool, over its own tinted edge.
                  <motion.path
                    key={`${hotEdge.t.id}-${hotTone}`}
                    d={hotEdge.d}
                    fill="none"
                    strokeDasharray="4 8"
                    strokeLinecap="round"
                    strokeWidth={2}
                    initial={{ opacity: 0, strokeDashoffset: 0 }}
                    animate={{
                      opacity: active !== null && active !== hotEdge.t.id ? 0.15 : 1,
                      strokeDashoffset: reduce ? 0 : -24,
                    }}
                    transition={{
                      opacity: { duration: 0.2, ease: EASE_OUT },
                      strokeDashoffset: {
                        duration: 1.6,
                        ease: "linear",
                        repeat: Infinity,
                      },
                    }}
                    className={
                      hotTone === "negative" ? "stroke-negative" : "stroke-brand"
                    }
                  />
                )}
              </svg>
            </div>

            <ul className="flex min-w-0 flex-col" style={{ gap: GAP }}>
              {tools.map((t) => {
                const isHot = t.id === hotId;
                const bad = failing(t);
                const tone = isHot ? hotTone : null;
                const em = (m: ToolCallMetric) =>
                  m === metric
                    ? tone === "brand"
                      ? "text-brand"
                      : "text-foreground"
                    : "text-muted-foreground";
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      aria-label={`${t.label}: ${count(t.calls)} calls, p50 ${formatLatency(t.p50Ms)}, ${percent(t.errorRate)} errors${isHot ? `, highest ${noun}` : ""}`}
                      onPointerEnter={() => setActive(t.id)}
                      onPointerLeave={() => setActive(null)}
                      onFocus={() => setActive(t.id)}
                      onBlur={() => setActive(null)}
                      onClick={() => onSelect?.(t.id)}
                      className="relative flex w-full items-center gap-2.5 rounded-xl bg-[color-mix(in_oklab,var(--foreground)_4%,var(--surface-inset))] pr-2.5 pl-3 text-left transition-[background-color,scale] duration-150 ease-ui-out outline-none hover:bg-[color-mix(in_oklab,var(--foreground)_7%,var(--surface-inset))] focus-visible:bg-[color-mix(in_oklab,var(--foreground)_8%,var(--surface-inset))] active:scale-[0.98] @max-md:pl-2.5"
                      style={{ height: ROW }}
                    >
                      {isHot && (
                        <motion.span
                          layoutId={`${uid}-hot`}
                          transition={spring}
                          aria-hidden="true"
                          className="absolute inset-0 rounded-xl transition-[background-color] duration-200"
                          style={{
                            backgroundColor: `color-mix(in oklab, var(--${hotTone}) 13%, transparent)`,
                          }}
                        />
                      )}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "relative size-1.5 shrink-0 rounded-full transition-colors duration-200",
                          bad ? "bg-negative" : isHot ? "bg-brand" : "bg-foreground/25",
                        )}
                      />
                      <span className="relative min-w-0 flex-1">
                        <span className="block truncate font-mono text-[0.8125rem] text-foreground">
                          {t.label}
                        </span>
                        <span className="mt-0.5 block truncate font-mono text-xs tabular-nums @max-sm:hidden">
                          <span
                            className={cn("transition-colors duration-200", em("calls"))}
                          >
                            {count(t.calls)}
                          </span>
                          <span className="text-muted-foreground/60"> · </span>
                          <span
                            className={cn(
                              "transition-colors duration-200",
                              em("latency"),
                            )}
                          >
                            <span className="@max-md:hidden">p50 </span>
                            {formatLatency(t.p50Ms)}
                          </span>
                        </span>
                        {/* Narrow cards drop the chip and keep only the chosen metric. */}
                        <span
                          className={cn(
                            "mt-0.5 block truncate font-mono text-xs tabular-nums @sm:hidden",
                            metric === "errors" && bad
                              ? "text-negative"
                              : tone === "brand"
                                ? "text-brand"
                                : "text-muted-foreground",
                          )}
                        >
                          {metric === "calls"
                            ? `${count(t.calls)} calls`
                            : metric === "latency"
                              ? `p50 ${formatLatency(t.p50Ms)}`
                              : `${percent(t.errorRate)} err`}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "relative inline-flex h-6 shrink-0 items-center rounded-md px-2 font-mono text-[0.6875rem] tabular-nums transition-colors duration-200 @max-sm:hidden",
                          metric === "errors"
                            ? bad
                              ? "bg-negative/15 text-negative"
                              : tone === "brand"
                                ? "bg-brand/15 text-brand"
                                : "bg-foreground/[0.08] text-foreground"
                            : bad
                              ? "bg-foreground/[0.05] text-negative"
                              : "bg-foreground/[0.05] text-muted-foreground",
                        )}
                      >
                        {percent(t.errorRate)}
                        <span className="@max-md:hidden">&nbsp;err</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {footer.length > 0 && (
            <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-3 px-1 @md:grid @md:grid-cols-2 @2xl:flex @2xl:gap-x-8">
              {footer.map((s) => (
                <div key={s.label} className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{s.label}</dt>
                  <dd
                    className={cn(
                      "mt-1 font-mono text-[0.8125rem] break-words tabular-nums",
                      s.accent ? "text-brand" : "text-foreground",
                    )}
                  >
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <p role="status" aria-live="polite" className="sr-only">
            {hot ? `Highest ${noun}: ${hot.label}` : ""}
          </p>
        </Panel>
      </Shell>
    </MotionConfig>
  );
}
