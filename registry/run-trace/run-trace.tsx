// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import { CaretRight } from "@phosphor-icons/react";
import { MotionConfig, motion } from "motion/react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { RollingNumber } from "@/components/ui/rolling-number";
import { Segmented } from "@/components/ui/segmented-control";
import { StatusPill } from "@/components/ui/status-pill";
import { Panel, Shell } from "@/components/ui/surface";
import { EASE_IN_OUT, instant } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/loader";

export type SpanKind = "llm" | "tool" | "agent" | "retrieval";

export type TraceSpan = {
  id: string;
  parentId?: string;
  name: string;
  kind: SpanKind;
  /** Offset from the start of the run. */
  startMs: number;
  /** Leave undefined while the span is still running. */
  endMs?: number;
  model?: string;
  tokens?: { input: number; output: number };
  costUsd?: number;
  status?: "ok" | "error";
};

export type RunTraceProps = {
  data: { spans: TraceSpan[]; elapsedMs: number };
  /** `flame` is a zoomable flame graph; `breakdown` totals time, tokens and cost by name. */
  view?: "flame" | "breakdown";
  /** Called when the flame graph zooms into a span, or back out (`null`). */
  onZoom?: (span: TraceSpan | null) => void;
  /** BCP 47 locale for costs and shares, e.g. `he-IL`. */
  locale?: string;
  /** UI strings, for translating the trace. */
  labels?: Partial<RunTraceLabels>;
  className?: string;
};

type Metric = "time" | "tokens" | "cost";

export type RunTraceLabels = {
  region: string;
  kinds: Record<SpanKind, string>;
  zoomPath: string;
  wholeRun: string;
  running: string;
  failed: string;
  /** Accessible name of a block; `duration` is already "running" while it runs. */
  block: (name: string, kind: string, duration: string, failed: boolean) => string;
  /** Token count in the hover tooltip, e.g. "19.5k tok". */
  tokensShort: (tokens: string) => string;
  /** Token count in the line under the graph, e.g. "19.5k tokens". */
  tokens: (tokens: string) => string;
  hint: string;
  excluded: string;
  metric: string;
  metrics: Record<Metric, string>;
  errors: (count: number) => string;
  share: (name: string, metric: string) => string;
  waiting: string;
  recording: string;
  finishedIn: string;
  /** Span count in the footer; `count` is the animated number. */
  spans: (count: ReactNode) => ReactNode;
  finished: (time: string) => string;
};

const defaultLabels: RunTraceLabels = {
  region: "Run trace",
  kinds: { llm: "LLM", tool: "Tool", agent: "Agent", retrieval: "Retrieval" },
  zoomPath: "Zoom path",
  wholeRun: "Whole run",
  running: "running",
  failed: "failed",
  block: (name, kind, duration, failed) =>
    `${name}, ${kind}, ${duration}${failed ? ", failed" : ""}. Zoom in`,
  tokensShort: (tokens) => `${tokens} tok`,
  tokens: (tokens) => `${tokens} tokens`,
  hint: "Click a block to zoom in, Esc to step back out",
  excluded: "Agent spans excluded — they wrap their children",
  metric: "Metric",
  metrics: { time: "Time", tokens: "Tokens", cost: "Cost" },
  errors: (count) => `${count} failed`,
  share: (name, metric) => `${name} share of ${metric}`,
  waiting: "Waiting for spans…",
  recording: "Recording",
  finishedIn: "Finished in",
  spans: (count) => <>{count} spans</>,
  finished: (time) => `Run finished in ${time}`,
};

const LabelsContext = createContext({ ...defaultLabels, locale: "en-US" });

const kinds = {
  llm: { color: "var(--brand)", ink: "#fff" },
  tool: { color: "#40b4ff", ink: "#04263d" },
  agent: { color: "#bf5af2", ink: "#26073a" },
  retrieval: { color: "#f5c000", ink: "#3d2e00" },
} as const;

// Movement on screen: a short spring with no bounce. Zoom is a spatial move, so it
// gets a strong ease-in-out and a little more time.
const zoomMove = { duration: 0.35, ease: EASE_IN_OUT } as const;

// Rough glyph widths at 11px, for deciding what fits in a block.
const NAME_PX = 6.3;
const MONO_PX = 6.7;
const PAD_PX = 16;

export const formatMs = (ms: number) =>
  ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
export const formatTokens = (n: number) =>
  n < 1000 ? `${Math.round(n)}` : `${(n / 1000).toFixed(1)}k`;
export const formatCost = (usd: number, locale = "en-US") => {
  const digits = usd < 0.1 ? 4 : 3;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(usd);
};

const tokensOf = (s: TraceSpan) => (s.tokens ? s.tokens.input + s.tokens.output : 0);

/** Row per span: one below its parent, pushed further down while it overlaps a sibling. */
function lanes(spans: TraceSpan[], elapsedMs: number) {
  const row = new Map<string, number>();
  const taken: { row: number; from: number; to: number }[] = [];
  const place = (parentId: string | undefined, min: number) => {
    for (const s of spans
      .filter((x) => x.parentId === parentId)
      .sort((a, b) => a.startMs - b.startMs)) {
      const to = s.endMs ?? elapsedMs;
      let r = min;
      while (taken.some((t) => t.row === r && t.from < to && s.startMs < t.to)) r++;
      taken.push({ row: r, from: s.startMs, to });
      row.set(s.id, r);
      place(s.id, r + 1);
    }
  };
  place(undefined, 0);
  return row;
}

function Flame({
  spans,
  elapsedMs,
  zoomId,
  onZoom,
}: {
  spans: TraceSpan[];
  elapsedMs: number;
  zoomId: string | null;
  onZoom: (id: string | null) => void;
}) {
  const labels = useContext(LabelsContext);
  const [hoverId, setHoverId] = useState<string | null>(null);
  // The plot runs left to right in every direction; only the tooltip text follows it.
  const [rtl, setRtl] = useState(false);
  // Zooms from the keyboard (Enter, Esc) jump instantly; clicks animate.
  const [keyboard, setKeyboard] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const [boxWidth, setBoxWidth] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    setRtl(!!el.parentElement && getComputedStyle(el.parentElement).direction === "rtl");
    const observer = new ResizeObserver(([entry]) =>
      setBoxWidth(entry.contentRect.width),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const byId = new Map(spans.map((s) => [s.id, s]));
  const endOf = (s: TraceSpan) => s.endMs ?? elapsedMs;
  const inside = (s: TraceSpan, root: string): boolean =>
    s.id === root ||
    (!!s.parentId && byId.has(s.parentId) && inside(byId.get(s.parentId)!, root));

  const zoom = zoomId ? byId.get(zoomId) : undefined;
  const from = zoom?.startMs ?? 0;
  const to = Math.max(zoom ? endOf(zoom) : elapsedMs, from + 1);
  const lane = lanes(spans, elapsedMs);
  const visible = spans.filter((s) => !zoom || inside(s, zoom.id));
  const top = zoom ? lane.get(zoom.id)! : 0;
  const rows = Math.max(1, ...visible.map((s) => lane.get(s.id)! - top + 1));
  const hover = hoverId ? byId.get(hoverId) : undefined;
  const pct = (ms: number) => ((ms - from) / (to - from)) * 100;

  const trail: TraceSpan[] = [];
  for (let s = zoom; s; s = s.parentId ? byId.get(s.parentId) : undefined)
    trail.unshift(s);
  const focus = hover ?? zoom;

  return (
    <>
      <nav
        aria-label={labels.zoomPath}
        className="mb-2 flex flex-wrap items-center gap-0.5 text-xs"
      >
        {[null, ...trail].map((s, i) => (
          <span key={`crumb-${s?.id ?? ""}`} className="flex items-center gap-0.5">
            {i > 0 && (
              <CaretRight
                weight="bold"
                className="size-3 text-muted-foreground rtl:-scale-x-100"
                aria-hidden="true"
              />
            )}
            <button
              type="button"
              onClick={(e) => {
                setKeyboard(e.detail === 0);
                onZoom(s?.id ?? null);
              }}
              aria-current={i === trail.length ? "location" : undefined}
              className={cn(
                "rounded-full px-2 py-0.5 font-mono transition-[color,scale] duration-150 ease-out active:scale-[0.97]",
                i === trail.length
                  ? "bg-foreground/[0.06] text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s?.name ?? labels.wholeRun}
            </button>
          </span>
        ))}
      </nav>
      <div
        dir="ltr"
        className="mb-1 flex justify-between font-mono text-[0.625rem] text-muted-foreground tabular-nums"
      >
        <span>{formatMs(from)}</span>
        <span>{formatMs((from + to) / 2)}</span>
        <span>{formatMs(to)}</span>
      </div>
      <div
        ref={box}
        dir="ltr"
        className="relative overflow-hidden rounded-xl"
        style={{ height: rows * 30 }}
        onPointerLeave={() => setHoverId(null)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && zoom) {
            setKeyboard(true);
            onZoom(zoom.parentId ?? null);
          }
        }}
      >
        {visible.map((s) => {
          const left = Math.max(pct(s.startMs), 0);
          const width = Math.min(pct(endOf(s)), 100) - left;
          const error = s.status === "error";
          const running = s.endMs === undefined;
          // Show the name only when it fits whole, the duration only when both fit.
          const px = (width / 100) * boxWidth;
          const duration = running ? "…" : formatMs(endOf(s) - s.startMs);
          const nameWidth = PAD_PX + (error ? 8 : 0) + s.name.length * NAME_PX;
          const showName = px >= nameWidth;
          const showDuration = px >= nameWidth + 4 + duration.length * MONO_PX;
          return (
            <motion.button
              key={s.id}
              type="button"
              initial={false}
              animate={{
                left: `${left}%`,
                width: `${width}%`,
                top: (lane.get(s.id)! - top) * 30,
              }}
              transition={keyboard ? instant : zoomMove}
              onClick={(e) => {
                setKeyboard(e.detail === 0);
                onZoom(s.id === zoom?.id ? (zoom.parentId ?? null) : s.id);
              }}
              onPointerEnter={() => setHoverId(s.id)}
              onFocus={() => setHoverId(s.id)}
              onBlur={() => setHoverId(null)}
              aria-label={labels.block(
                s.name,
                labels.kinds[s.kind],
                running ? labels.running : formatMs(endOf(s) - s.startMs),
                error,
              )}
              className={cn(
                "absolute flex h-7 items-center gap-1 overflow-hidden rounded-lg px-2 text-start text-[0.6875rem] font-medium whitespace-nowrap outline-offset-1 transition-opacity duration-150",
                hoverId && hoverId !== s.id && "opacity-70",
                running && "animate-pulse",
              )}
              style={{
                minWidth: 4,
                background: error ? "var(--negative)" : kinds[s.kind].color,
                color: error ? "#fff" : kinds[s.kind].ink,
              }}
            >
              {error && px >= PAD_PX + 6 && <span aria-hidden="true">!</span>}
              {showName && <span className="min-w-0 truncate">{s.name}</span>}
              {showDuration && (
                <span className="shrink-0 font-mono opacity-75">{duration}</span>
              )}
            </motion.button>
          );
        })}
        {hover && (
          <div
            role="tooltip"
            dir={rtl ? "rtl" : undefined}
            className="pointer-events-none absolute z-10 rounded-lg bg-surface-raised px-2 py-1 font-mono text-[0.6875rem] whitespace-nowrap"
            style={{
              top: Math.max((lane.get(hover.id)! - top) * 30 - 26, 0),
              left: `${Math.min(Math.max(pct(hover.startMs), 0), 70)}%`,
            }}
          >
            {hover.name} · {formatMs(endOf(hover) - hover.startMs)}
            {tokensOf(hover) > 0 &&
              ` · ${labels.tokensShort(formatTokens(tokensOf(hover)))}`}
          </div>
        )}
      </div>
      <p className="mt-3 truncate text-xs text-muted-foreground">
        {focus ? (
          <>
            <span className="text-foreground">{focus.name}</span> ·{" "}
            {labels.kinds[focus.kind]}
            {focus.model && ` · ${focus.model}`} ·{" "}
            {formatMs(endOf(focus) - focus.startMs)}
            {tokensOf(focus) > 0 && ` · ${labels.tokens(formatTokens(tokensOf(focus)))}`}
            {focus.costUsd !== undefined &&
              ` · ${formatCost(focus.costUsd, labels.locale)}`}
            {focus.status === "error" && (
              <span className="text-negative"> · {labels.failed}</span>
            )}
          </>
        ) : (
          labels.hint
        )}
      </p>
    </>
  );
}

function Breakdown({ spans, elapsedMs }: { spans: TraceSpan[]; elapsedMs: number }) {
  const labels = useContext(LabelsContext);
  const [metric, setMetric] = useState<Metric>("time");
  const groups = new Map<
    string,
    {
      name: string;
      kind: SpanKind;
      calls: number;
      errors: number;
      time: number;
      tokens: number;
      cost: number;
    }
  >();
  // Agent spans only wrap their children, so they would count time twice.
  for (const s of spans.filter((s) => s.kind !== "agent")) {
    const name = s.kind === "llm" ? (s.model ?? s.name) : s.name;
    const g = groups.get(name) ?? {
      name,
      kind: s.kind,
      calls: 0,
      errors: 0,
      time: 0,
      tokens: 0,
      cost: 0,
    };
    g.calls++;
    if (s.status === "error") g.errors++;
    g.time += (s.endMs ?? elapsedMs) - s.startMs;
    g.tokens += tokensOf(s);
    g.cost += s.costUsd ?? 0;
    groups.set(name, g);
  }
  const list = [...groups.values()].sort((a, b) => b[metric] - a[metric]);
  const total = list.reduce((n, g) => n + g[metric], 0) || 1;
  const show = (n: number) =>
    metric === "time"
      ? formatMs(n)
      : metric === "tokens"
        ? formatTokens(n)
        : formatCost(n, labels.locale);

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{labels.excluded}</p>
        <Segmented
          label={labels.metric}
          value={metric}
          onValueChange={setMetric}
          options={(["time", "tokens", "cost"] as const).map((value) => ({
            value,
            label: labels.metrics[value],
          }))}
        />
      </div>
      <ol className="flex flex-col gap-1">
        {list.map((g) => (
          <motion.li
            layout
            key={g.name}
            transition={{ layout: zoomMove }}
            className="grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-x-3 rounded-xl px-2 py-2 hover:bg-foreground/[0.03] @md:grid-cols-[minmax(0,1fr)_3rem_4.5rem]"
          >
            <div className="min-w-0">
              <p className="flex items-center gap-2 truncate font-mono text-xs">
                {g.name}
                <span className="font-sans text-[0.6875rem] text-muted-foreground">
                  {labels.kinds[g.kind]}
                </span>
                {g.errors > 0 && (
                  <StatusPill
                    size="sm"
                    tone="negative"
                    className="h-4 px-1.5 font-sans text-[0.625rem]"
                  >
                    {labels.errors(g.errors)}
                  </StatusPill>
                )}
              </p>
              <ProgressBar
                kind="meter"
                striped
                color={kinds[g.kind].color}
                value={g[metric]}
                max={total}
                label={labels.share(g.name, labels.metrics[metric].toLowerCase())}
                className="mt-1.5 bg-foreground/[0.06]"
              />
            </div>
            <span className="hidden text-end font-mono text-[0.6875rem] text-muted-foreground tabular-nums @md:block">
              <bdi dir="ltr">{g.calls}×</bdi>
            </span>
            <span className="text-end font-mono text-xs tabular-nums">
              {show(g[metric])}
              <span className="block text-[0.625rem] text-muted-foreground">
                {new Intl.NumberFormat(labels.locale, { style: "percent" }).format(
                  Math.round((g[metric] / total) * 100) / 100,
                )}
              </span>
            </span>
          </motion.li>
        ))}
      </ol>
    </>
  );
}

export function RunTrace({
  data,
  view = "flame",
  onZoom,
  locale = "en-US",
  labels: labelOverrides,
  className,
}: RunTraceProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const { spans, elapsedMs } = data;
  const [zoomId, setZoomId] = useState<string | null>(null);
  const running = spans.some((s) => s.endMs === undefined);
  const zoom = (id: string | null) => {
    setZoomId(id);
    onZoom?.(id ? (spans.find((s) => s.id === id) ?? null) : null);
  };

  let body: ReactNode = (
    <p className="py-8 text-center text-[0.8125rem] text-muted-foreground">
      {labels.waiting}
    </p>
  );
  if (spans.length > 0)
    body =
      view === "flame" ? (
        <Flame spans={spans} elapsedMs={elapsedMs} zoomId={zoomId} onZoom={zoom} />
      ) : (
        <Breakdown spans={spans} elapsedMs={elapsedMs} />
      );

  return (
    <LabelsContext.Provider value={{ ...labels, locale }}>
      <MotionConfig reducedMotion="user">
        <Shell aria-label={labels.region} className={cn("max-w-2xl", className)}>
          <Panel className="p-4">{body}</Panel>
          <p className="flex items-center gap-1.5 px-3.5 py-2.5 text-[0.8125rem] text-muted-foreground">
            {running && (
              <Spinner size="sm" label={labels.recording} className="text-brand" />
            )}
            {running ? labels.recording : labels.finishedIn}{" "}
            <RollingNumber
              className="font-mono text-foreground"
              value={formatMs(elapsedMs)}
            />
            <span className="ms-auto">
              {labels.spans(<RollingNumber value={String(spans.length)} />)}
            </span>
          </p>
          <p role="status" aria-live="polite" className="sr-only">
            {running ? "" : labels.finished(formatMs(elapsedMs))}
          </p>
        </Shell>
      </MotionConfig>
    </LabelsContext.Provider>
  );
}
