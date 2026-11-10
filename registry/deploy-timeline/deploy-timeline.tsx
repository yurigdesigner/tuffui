// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import {
  ArrowCounterClockwise,
  ArrowsLeftRight,
  RocketLaunch,
} from "@phosphor-icons/react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
  animate,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
} from "motion/react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/action-button";
import { RollingNumber } from "@/components/ui/rolling-number";
import { Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { enter, exit } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type DeployKind = "prompt" | "model";

export type Deploy = {
  id: string;
  /** Short name on the rail: a prompt version ("v13") or a model id ("o4-mini"). */
  version: string;
  /** Prompt deploys draw as dots, model swaps as diamonds. */
  kind: DeployKind;
  /** What changed, shown in the callout, e.g. "stricter escalation rules". */
  label?: string;
  /** When it shipped. Strings are parsed with `new Date()`. */
  at: Date | string | number;
  /** Eval score it shipped with, 0–1. Deltas read in points (×100). */
  score: number;
  /** Minutes until it was rolled back. Marks the deploy as a regression. */
  rolledBackAfter?: number;
  /** Share of traffic, 0–1, while the deploy runs as a canary next to the live version. */
  canary?: number;
};

export type DeployStat = {
  label: string;
  value: string;
  tone?: "neutral" | "brand" | "negative";
};

export type DeployTimelineProps = {
  /** Deploys in any order; they are sorted by `at`. */
  deploys: Deploy[];
  /** Minimum eval score. Drawn as a dashed line; deploys under it count as regressions. */
  threshold?: number;
  /** Right end of the score line. Defaults to the end of `range`. */
  now?: Date | string | number;
  /** Time window of the axis. Defaults to a little around the first deploy and `now`. */
  range?: [Date | string | number, Date | string | number];
  /** Pulses the end of the line while traffic is still being scored. */
  live?: boolean;
  title?: string;
  subtitle?: string;
  /** Chips under the chart. Defaults to live version, canary, eval and deploy count; `[]` hides them. */
  stats?: DeployStat[];
  /** Controlled selection. Defaults to internal state. */
  selectedId?: string | null;
  /** Called when a marker is clicked; `null` when the selection is cleared. */
  onSelect?: (deploy: Deploy | null) => void;
  /** Shows a Compare button: the selected deploy (or the last good one before live) against live. */
  onCompare?: (deploy: Deploy, live: Deploy) => void;
  /** Shows a Roll back button for the selected deploy (or the last good one before live). */
  onRollback?: (deploy: Deploy) => void;
  /** Extra content in the header, before the buttons. */
  aside?: React.ReactNode;
  /** Draws the line in from the left on mount. Off renders the finished chart. */
  intro?: boolean;
  formatScore?: (score: number) => string;
  /** Formats dates on the axis and in the callout. Defaults to "Nov 2" in UTC. */
  formatDate?: (date: Date) => string;
  className?: string;
};

type Status = "live" | "canary" | "rolled-back" | "below" | "shipped";

type Item = {
  d: Deploy;
  at: number;
  status: Status;
  /** Score of the version it replaced (or of live, for a canary). */
  before: number | null;
  regression: boolean;
};

type Segment = {
  owner: string;
  from: number;
  to: number;
  score: number;
  regression: boolean;
};

const DAY = 86_400_000;
const PAD_X = 10;
const MIN_DIP = 12; // a 38-minute rollback on a two-week axis still needs to be seen
const REVEAL = 1.5;
const REVEAL_EASE = [0.3, 0.1, 0.2, 1] as const;

const round = (n: number) => Math.round(n * 100) / 100;
const ms = (v: Date | string | number) =>
  typeof v === "number" ? v : v instanceof Date ? v.getTime() : new Date(v).getTime();

const utcDay = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const defaultDate = (date: Date) => utcDay.format(date);
const defaultScore = (score: number) => score.toFixed(3);

/** Delta in points with a real minus sign: "−4.4 pts". */
function points(delta: number) {
  const p = Math.round(delta * 1000) / 10;
  if (p === 0) return "±0 pts";
  return `${p < 0 ? "−" : "+"}${Math.abs(p).toFixed(1)} pts`;
}

function duration(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m ? `${h} h ${m} min` : `${h} h`;
}

const percent = (share: number) => `${Math.round(share * 100)}%`;

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  // null until measured: the chart draws once at its real width.
  const [width, setWidth] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width ?? 560, width !== null] as const;
}

/** Walks the deploys in order and works out what was live when. */
function analyze(deploys: Deploy[], threshold: number | undefined, now: number) {
  const sorted = [...deploys]
    .map((d) => ({ d, at: ms(d.at) }))
    .sort((a, b) => a.at - b.at);
  const main = sorted.filter((x) => x.d.canary === undefined);
  const canary = sorted.filter((x) => x.d.canary !== undefined).at(-1);

  const segments: Segment[] = [];
  const before = new Map<string, number | null>();
  let good: (typeof main)[number] | undefined;
  main.forEach((x, i) => {
    const next = Math.min(main[i + 1]?.at ?? now, now);
    before.set(x.d.id, good?.d.score ?? null);
    if (x.d.rolledBackAfter !== undefined) {
      const back = x.at + x.d.rolledBackAfter * 60_000;
      segments.push({
        owner: x.d.id,
        from: x.at,
        to: Math.min(back, next),
        score: x.d.score,
        regression: true,
      });
      // The previous version takes the traffic back.
      if (good && back < next)
        segments.push({
          owner: good.d.id,
          from: back,
          to: next,
          score: good.d.score,
          regression: false,
        });
    } else {
      segments.push({
        owner: x.d.id,
        from: x.at,
        to: next,
        score: x.d.score,
        regression: threshold !== undefined && x.d.score < threshold,
      });
      good = x;
    }
  });
  const live = good?.d;
  if (canary) before.set(canary.d.id, live?.score ?? null);

  const items: Item[] = sorted.map(({ d, at }) => {
    const rolled = d.rolledBackAfter !== undefined;
    const below = threshold !== undefined && d.score < threshold;
    const status: Status =
      d.id === canary?.d.id
        ? "canary"
        : d.id === live?.id
          ? "live"
          : rolled
            ? "rolled-back"
            : below
              ? "below"
              : "shipped";
    return {
      d,
      at,
      status,
      before: before.get(d.id) ?? null,
      regression: rolled || below,
    };
  });

  // The last good deploy before live: the default target for compare and roll back.
  const goodOnes = items.filter(
    (x) => x.d.canary === undefined && !x.regression && x.d.id !== live?.id,
  );
  const previous = goodOnes.filter((x) => !live || x.at < ms(live.at)).at(-1)?.d;

  return { items, segments, live, canary: canary?.d, previous };
}

/**
 * Prompt and model versions on a rail over the eval score they shipped with.
 * The score steps at every deploy, regressions dip under the minimum and come
 * back when rolled back, and a canary runs as a dashed line beside live.
 */
export function DeployTimeline({
  deploys,
  threshold,
  now: nowProp,
  range,
  live: running = true,
  title = "Deployments",
  subtitle,
  stats: statsProp,
  selectedId,
  onSelect,
  onCompare,
  onRollback,
  aside,
  intro = true,
  formatScore = defaultScore,
  formatDate = defaultDate,
  className,
}: DeployTimelineProps) {
  const uid = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const [ref, width, measured] = useWidth();
  const [hovered, setHovered] = useState<string | null>(null);
  const [ownSelected, setOwnSelected] = useState<string | null>(null);
  const playIntro = intro && !reduce;
  // 0→1 as the line draws in; markers, labels and the callout follow it.
  const progress = useMotionValue(playIntro ? 0 : 1);
  const [revealed, setRevealed] = useState(playIntro ? 0 : 1);
  useMotionValueEvent(progress, "change", setRevealed);
  const introDone = revealed >= 1;
  useEffect(() => {
    if (!measured) return;
    if (!playIntro) return progress.jump(1);
    const controls = animate(progress, 1, { duration: REVEAL, ease: REVEAL_EASE });
    return () => controls.stop();
  }, [measured, playIntro, progress]);

  // Time axis
  const times = deploys.map((d) => ms(d.at));
  const first = times.length ? Math.min(...times) : 0;
  const last = times.length ? Math.max(...times) : DAY;
  const span = Math.max(last - first, DAY);
  const now =
    nowProp !== undefined ? ms(nowProp) : range ? ms(range[1]) : last + span * 0.12;
  const start = range ? ms(range[0]) : first - span * 0.05;
  const end = range ? ms(range[1]) : Math.max(now, last);
  const { items, segments, live, canary, previous } = analyze(deploys, threshold, now);

  const narrow = width < 400;
  const plotH = narrow ? 92 : 112;
  const x = (t: number) =>
    round(PAD_X + ((t - start) / Math.max(end - start, 1)) * (width - 2 * PAD_X));

  // Rail labels: two lines each (one when narrow), staggered onto a second
  // row when neighbours would collide.
  const charW = 6.6;
  const second = (it: Item) =>
    it.status === "live"
      ? "live"
      : it.status === "canary"
        ? `canary ${percent(it.d.canary ?? 0)}`
        : it.status === "rolled-back"
          ? "rolled back"
          : it.status === "below"
            ? "below min"
            : it.d.kind;
  const rowEnds: number[] = [];
  const labels = items.map((it) => {
    const w = Math.ceil(
      Math.max(
        it.d.version.length + (it.d.kind === "model" ? 1 : 0),
        narrow ? 0 : second(it).length,
      ) *
        charW +
        10,
    );
    const left = Math.min(Math.max(x(it.at) - w / 2, 0), Math.max(width - w, 0));
    let row = rowEnds.findIndex((e) => left >= e + 4);
    if (row < 0) row = rowEnds.length < 2 ? rowEnds.length : 1;
    rowEnds[row] = left + w;
    return { id: it.d.id, left, w, row };
  });
  const ROW = narrow ? 18 : 32;
  const rows = Math.max(rowEnds.length, 1);
  const railY = rows * ROW + 12;
  const calloutTop = railY + 16;
  const plotTop = railY + 62;
  const plotBottom = plotTop + plotH;
  const H = plotBottom + 26;

  // Score axis
  // The canary stays out of the scale, so its settling score never rescales the chart.
  const values = [
    ...deploys.filter((d) => d.canary === undefined).map((d) => d.score),
    ...(threshold !== undefined ? [threshold] : []),
  ];
  const lo = values.length ? Math.min(...values) : 0;
  const hi = values.length ? Math.max(...values) : 1;
  const pad = Math.max((hi - lo) * 0.22, 0.005);
  const [y0, y1] = [lo - pad, hi + pad * 0.5];
  const y = (v: number) =>
    round(plotBottom - ((Math.min(Math.max(v, y0), y1) - y0) / (y1 - y0)) * plotH);

  // Segments in pixels. A rollback gets a minimum width so the dip shows.
  const px = segments.reduce<(Segment & { a: number; b: number })[]>((out, s) => {
    const a = Math.max(x(s.from), out.at(-1)?.b ?? -Infinity);
    const b = Math.max(x(s.to), s.regression && s.owner !== live?.id ? a + MIN_DIP : a);
    return [...out, { ...s, a, b }];
  }, []);
  const lineEnd = px.at(-1)?.b ?? x(now);
  const path = px
    .map((s, i) => `${i ? `V${y(s.score)}` : `M${s.a} ${y(s.score)}`}H${s.b}`)
    .join("");
  const area = px.length ? `${path}V${plotBottom}H${px[0].a}Z` : "";

  const canaryX = canary ? x(ms(canary.at)) : 0;
  const canaryEnd = Math.max(x(now), canaryX);
  const canaryY = useSpring(canary ? y(canary.score) : 0, {
    stiffness: 90,
    damping: 22,
  });
  const canaryTarget = canary ? y(canary.score) : 0;
  useEffect(() => {
    if (reduce || !introDone) canaryY.jump(canaryTarget);
    else canaryY.set(canaryTarget);
  }, [canaryTarget, canaryY, reduce, introDone]);

  // Selection, hover and the callout
  const selected = selectedId !== undefined ? selectedId : ownSelected;
  const select = (id: string | null) => {
    if (selectedId === undefined) setOwnSelected(id);
    onSelect?.(id ? (items.find((it) => it.d.id === id)?.d ?? null) : null);
  };
  const emphasis = hovered ?? selected;
  const regression = [...items].reverse().find((it) => it.regression);
  const calloutId = emphasis ?? regression?.d.id ?? null;
  const callout = items.find((it) => it.d.id === calloutId);
  const target = items.find((it) => it.d.id === selected)?.d ?? previous;

  const calloutRef = useRef<HTMLDivElement>(null);
  const [calloutW, setCalloutW] = useState(220);
  useLayoutEffect(() => {
    if (calloutRef.current) setCalloutW(calloutRef.current.offsetWidth);
  }, [calloutId, width, measured, deploys]);

  const pick = (event: React.PointerEvent) => {
    const box = event.currentTarget.getBoundingClientRect();
    const px0 = event.clientX - box.left;
    const py = event.clientY - box.top;
    if (py > plotBottom + 6) return setHovered(null);
    const nearest = items
      .map((it) => ({ id: it.d.id, dx: Math.abs(x(it.at) - px0) }))
      .sort((a, b) => a.dx - b.dx)[0];
    if (py < railY + 14)
      return setHovered(nearest && nearest.dx < 24 ? nearest.id : null);
    if (canary && px0 >= canaryX && px0 <= canaryEnd + 8 && live) {
      const toCanary = Math.abs(py - canaryY.get());
      const toLive = Math.abs(py - y(live.score));
      return setHovered(toCanary < toLive ? canary.id : live.id);
    }
    const seg = px.find((s) => px0 >= s.a - 2 && px0 <= s.b + 2);
    setHovered(seg ? seg.owner : null);
  };

  const shown = (t: number) => x(t) <= revealed * width + 2;

  // Axis: whole days, as many as fit.
  const days = (end - start) / DAY;
  const fit = Math.max(Math.floor(width / (narrow ? 48 : 84)), 2);
  const every = [1, 2, 3, 4, 7, 14, 30, 61, 91].find((n) => days / n <= fit) ?? 182;
  const ticks: number[] = [];
  for (let t = Math.ceil(start / DAY) * DAY; t <= end; t += DAY) {
    if (Math.round((t - Math.ceil(start / DAY) * DAY) / DAY) % every === 0) ticks.push(t);
  }

  // Labels stay inside the chart and drop out rather than collide.
  const axis = ticks.reduce<{ t: number; x: number; text: string; right: number }[]>(
    (out, t) => {
      const text = formatDate(new Date(t));
      const half = (text.length * 6 + 4) / 2;
      const cx = Math.min(Math.max(x(t), half), width - half);
      if (out.length && cx - half < (out.at(-1)?.right ?? 0) + 8) return out;
      return [...out, { t, x: cx, text, right: cx + half }];
    },
    [],
  );

  // Stats
  const model = live
    ? items
        .filter((it) => it.d.kind === "model" && !it.regression && it.at <= ms(live.at))
        .at(-1)
    : undefined;
  const rolled = items.filter((it) => it.regression).length;
  const stats: DeployStat[] = statsProp ?? [
    ...(live
      ? [
          {
            label: "live",
            value:
              model && model.d.id !== live.id
                ? `${live.version} · ${model.d.version}`
                : live.version,
            tone: "brand" as const,
          },
        ]
      : []),
    ...(canary
      ? [{ label: `canary ${percent(canary.canary ?? 0)}`, value: canary.version }]
      : []),
    ...(live ? [{ label: "eval", value: formatScore(live.score) }] : []),
    {
      label: "deploys",
      value: `${items.length}${rolled ? ` · ${rolled} regr` : ""}`,
      tone: rolled ? ("negative" as const) : undefined,
    },
  ];

  const describe = (it: Item) =>
    [
      `${it.d.version}, ${it.d.kind} deploy${it.d.label ? `: ${it.d.label}` : ""}`,
      formatDate(new Date(it.at)),
      `eval ${formatScore(it.d.score)}`,
      it.before !== null ? points(it.d.score - it.before) : null,
      it.status === "rolled-back"
        ? `rolled back after ${duration(it.d.rolledBackAfter ?? 0)}`
        : it.status === "below"
          ? "below the minimum"
          : it.status === "canary"
            ? `canary at ${percent(it.d.canary ?? 0)} of traffic`
            : it.status === "live"
              ? "live"
              : null,
    ]
      .filter(Boolean)
      .join(", ");

  const summary = [
    `${items.length} deploys`,
    live ? `live ${live.version} at ${formatScore(live.score)}` : null,
    regression
      ? `${regression.d.version} regressed ${regression.before !== null ? points(regression.d.score - regression.before) : ""}${regression.d.rolledBackAfter !== undefined ? ` and was rolled back after ${duration(regression.d.rolledBackAfter)}` : ""}`
      : null,
    canary ? `${canary.version} in canary at ${percent(canary.canary ?? 0)}` : null,
  ]
    .filter(Boolean)
    .join("; ");

  return (
    <MotionConfig reducedMotion="user">
      <Shell className={cn("max-w-2xl", className)}>
        <ShellHeader
          icon={RocketLaunch}
          title={title}
          subtitle={subtitle}
          aside={
            (aside || onCompare || onRollback) && (
              <>
                {aside}
                {onCompare && live && target && (
                  <Button
                    icon={ArrowsLeftRight}
                    iconWeight="bold"
                    aria-label={`Compare ${target.version} with ${live.version}`}
                    disabled={target.id === live.id}
                    onClick={() => onCompare(target, live)}
                    className="@max-sm:w-8 @max-sm:px-0"
                  >
                    <span className="@max-sm:sr-only">Compare</span>
                  </Button>
                )}
                {onRollback && target && (
                  <Button
                    variant="primary"
                    icon={ArrowCounterClockwise}
                    iconWeight="bold"
                    aria-label={`Roll back to ${target.version}`}
                    disabled={
                      target.id === live?.id ||
                      target.canary !== undefined ||
                      items.find((it) => it.d.id === target.id)?.regression
                    }
                    onClick={() => onRollback(target)}
                    className="@max-sm:w-8 @max-sm:px-0"
                  >
                    <span className="@max-sm:sr-only">Roll back</span>
                  </Button>
                )}
              </>
            )
          }
        />
        <Panel className="p-4 @max-sm:p-3">
          <div
            ref={ref}
            className="relative"
            style={{ height: H }}
            onPointerMove={pick}
            onPointerLeave={() => setHovered(null)}
            onKeyDown={(e) => e.key === "Escape" && select(null)}
          >
            <svg
              key={measured ? "measured" : "guess"}
              visibility={measured ? undefined : "hidden"}
              aria-hidden="true"
              width={width}
              height={H}
              className="absolute inset-0 block overflow-visible"
              onClick={() => hovered && select(hovered === selected ? null : hovered)}
            >
              <defs>
                <clipPath id={`${uid}-reveal`}>
                  <rect x={0} y={0} height={H} width={round(revealed * width)} />
                </clipPath>
                <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* Rail */}
              <line
                x1={0}
                x2={width}
                y1={railY}
                y2={railY}
                className="stroke-foreground/10"
              />

              {/* Guides from each deploy down to the axis */}
              {items.map((it) => {
                const on = it.d.id === emphasis;
                return (
                  <line
                    key={it.d.id}
                    x1={x(it.at)}
                    x2={x(it.at)}
                    y1={railY + 8}
                    y2={plotBottom}
                    strokeDasharray={on ? undefined : "2 4"}
                    className={cn(
                      "transition-[stroke] duration-150",
                      on ? "stroke-foreground/35" : "stroke-foreground/[0.12]",
                    )}
                  />
                );
              })}

              {/* Baseline and day labels */}
              <line
                x1={0}
                x2={width}
                y1={plotBottom}
                y2={plotBottom}
                className="stroke-foreground/10"
              />
              {measured &&
                axis.map((a) => (
                  <text
                    key={a.t}
                    x={a.x}
                    y={plotBottom + 18}
                    textAnchor="middle"
                    fontSize={10}
                    className="fill-muted-foreground font-mono"
                  >
                    {a.text}
                  </text>
                ))}

              {/* The segment the emphasized deploy shipped */}
              {px
                .filter((s) => s.owner === emphasis)
                .map((s) => (
                  <rect
                    key={`band-${s.from}`}
                    x={s.a}
                    y={plotTop - 8}
                    width={Math.max(s.b - s.a, 1)}
                    height={plotBottom - plotTop + 8}
                    className="fill-foreground/[0.04]"
                  />
                ))}
              {canary && emphasis === canary.id && (
                <rect
                  x={canaryX}
                  y={plotTop - 8}
                  width={Math.max(canaryEnd - canaryX, 1)}
                  height={plotBottom - plotTop + 8}
                  className="fill-foreground/[0.04]"
                />
              )}

              <g clipPath={`url(#${uid}-reveal)`}>
                {area && <path d={area} fill={`url(#${uid}-fill)`} />}

                {/* Regressions: the gap under the minimum */}
                {threshold !== undefined &&
                  px
                    .filter((s) => s.regression && s.score < threshold)
                    .map((s) => (
                      <rect
                        key={`gap-${s.from}`}
                        x={s.a}
                        y={y(threshold)}
                        width={Math.max(s.b - s.a, 1)}
                        height={Math.max(y(s.score) - y(threshold), 0)}
                        className="fill-negative/20"
                      />
                    ))}

                <path
                  d={path}
                  fill="none"
                  strokeWidth={1.75}
                  strokeLinejoin="round"
                  className={cn(
                    "stroke-brand transition-opacity duration-200 ease-ui-out",
                    emphasis && "opacity-35",
                  )}
                />
                {px.map((s, i) => {
                  const prev = px[i - 1];
                  const nextSeg = px[i + 1];
                  const on = s.owner === emphasis;
                  if (!on && !s.regression) return null;
                  // Regressions carry their drop and recovery in the danger tone.
                  const d = s.regression
                    ? `M${s.a} ${prev ? y(prev.score) : y(s.score)}V${y(s.score)}H${s.b}${nextSeg ? `V${y(nextSeg.score)}` : ""}`
                    : `M${s.a} ${y(s.score)}H${s.b}`;
                  return (
                    <path
                      key={`seg-${s.from}`}
                      d={d}
                      fill="none"
                      strokeWidth={on ? 2.5 : 1.75}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      className={cn(
                        "transition-opacity duration-200 ease-ui-out",
                        s.regression ? "stroke-negative" : "stroke-brand",
                        emphasis && !on && "opacity-35",
                      )}
                    />
                  );
                })}

                {/* Canary: a dashed line beside live, growing with the clock */}
                {canary && (
                  <>
                    <motion.line
                      x1={canaryX}
                      x2={canaryX}
                      y1={y(live?.score ?? canary.score)}
                      y2={canaryY}
                      strokeWidth={1}
                      strokeDasharray="2 2"
                      className={cn(
                        "stroke-brand/60 transition-opacity duration-200 ease-ui-out",
                        emphasis && emphasis !== canary.id && "opacity-35",
                      )}
                    />
                    <motion.line
                      x1={canaryX}
                      x2={canaryEnd}
                      y1={canaryY}
                      y2={canaryY}
                      strokeWidth={emphasis === canary.id ? 2.5 : 1.75}
                      strokeDasharray="4 3"
                      strokeLinecap="round"
                      className={cn(
                        "stroke-brand transition-opacity duration-200 ease-ui-out",
                        emphasis && emphasis !== canary.id && "opacity-35",
                      )}
                    />
                  </>
                )}
              </g>

              {/* Minimum */}
              {threshold !== undefined && (
                <g>
                  <line
                    x1={0}
                    x2={width}
                    y1={y(threshold)}
                    y2={y(threshold)}
                    strokeDasharray="3 3"
                    className="stroke-foreground/30"
                  />
                  <text
                    x={width}
                    y={y(threshold) - 5}
                    textAnchor="end"
                    fontSize={10}
                    className="fill-muted-foreground font-mono"
                  >
                    min {formatScore(threshold).replace(/0+$/, "").replace(/\.$/, "")}
                  </text>
                </g>
              )}

              {/* Ends of the line, once drawn */}
              {introDone && live && !canary && (
                <circle
                  cx={lineEnd}
                  cy={y(live.score)}
                  r={3}
                  className={cn("fill-brand", running && "motion-safe:animate-pulse")}
                />
              )}
              {introDone && canary && (
                <motion.circle
                  cx={canaryEnd}
                  cy={canaryY}
                  r={3.5}
                  className={cn("fill-brand", running && "motion-safe:animate-pulse")}
                />
              )}
            </svg>

            {measured && (
              <div className="pointer-events-none absolute inset-0">
                {/* Rail labels */}
                {items.map((it, i) => {
                  const l = labels[i];
                  const tone =
                    it.status === "live" || it.status === "canary"
                      ? "text-brand"
                      : it.regression
                        ? "text-negative"
                        : "text-muted-foreground";
                  return (
                    <motion.div
                      key={it.d.id}
                      aria-hidden="true"
                      initial={false}
                      animate={shown(it.at) ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
                      transition={enter}
                      className={cn(
                        "absolute flex flex-col items-center justify-center rounded-md font-mono leading-[15px] whitespace-nowrap transition-[background-color,opacity] duration-150",
                        selected === it.d.id && "bg-foreground/[0.07]",
                        emphasis && emphasis !== it.d.id && "opacity-60",
                      )}
                      style={{
                        left: l.left,
                        top: l.row * ROW + 2,
                        width: l.w,
                        height: ROW - 4,
                      }}
                    >
                      <span className="text-[0.6875rem] text-foreground">
                        {it.d.kind === "model" && (
                          <span className="text-muted-foreground">→</span>
                        )}
                        {it.d.version}
                      </span>
                      {!narrow && (
                        <span className={cn("text-[0.625rem]", tone)}>{second(it)}</span>
                      )}
                    </motion.div>
                  );
                })}

                {/* Markers: real buttons, one per deploy */}
                {items.map((it) => {
                  const on = it.d.id === emphasis;
                  const isSelected = it.d.id === selected;
                  return (
                    <motion.button
                      key={it.d.id}
                      type="button"
                      aria-label={describe(it)}
                      aria-pressed={isSelected}
                      initial={false}
                      animate={
                        shown(it.at)
                          ? { opacity: 1, scale: 1 }
                          : { opacity: 0, scale: 0.5 }
                      }
                      transition={enter}
                      onFocus={() => setHovered(it.d.id)}
                      onBlur={() => setHovered(null)}
                      onClick={() => select(isSelected ? null : it.d.id)}
                      className={cn(
                        "pointer-events-auto absolute flex size-6 items-center justify-center rounded-full transition-colors duration-150",
                        isSelected ? "bg-foreground/[0.1]" : "hover:bg-foreground/[0.06]",
                      )}
                      style={{ left: x(it.at) - 12, top: railY - 12 }}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "block transition-transform duration-150 ease-ui-out",
                          it.d.kind === "model"
                            ? "size-2.5 rotate-45 rounded-[2px]"
                            : "size-2.5 rounded-full",
                          on && (it.d.kind === "model" ? "scale-125" : "scale-[1.3]"),
                          it.status === "live"
                            ? "bg-brand"
                            : it.status === "canary"
                              ? cn("bg-brand", running && "motion-safe:animate-pulse")
                              : it.regression
                                ? "bg-negative"
                                : "bg-foreground/40",
                        )}
                      />
                    </motion.button>
                  );
                })}

                {/* Callout: the emphasized deploy, or the latest regression */}
                <AnimatePresence>
                  {callout && shown(callout.at) && (
                    <motion.div
                      key="callout"
                      ref={calloutRef}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: { ...enter, delay: introDone ? 0 : 0.15 },
                      }}
                      exit={{ opacity: 0, transition: exit }}
                      className="absolute rounded-lg bg-surface-raised px-2.5 py-1.5 text-[0.75rem] leading-4 whitespace-nowrap"
                      style={{
                        top: calloutTop,
                        left: Math.min(
                          Math.max(x(callout.at) - calloutW / 2, 0),
                          Math.max(width - calloutW, 0),
                        ),
                      }}
                    >
                      <Callout
                        item={callout}
                        threshold={threshold}
                        formatScore={formatScore}
                        formatDate={formatDate}
                        compact={narrow}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {stats.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {stats.map((s) => (
                <span
                  key={s.label.replace(/[\d.%]+/g, "")}
                  className={cn(
                    "inline-flex h-6 items-center gap-1.5 rounded-lg px-2 font-mono text-[0.6875rem] whitespace-nowrap",
                    s.tone === "brand"
                      ? "bg-brand/[0.12] text-brand"
                      : s.tone === "negative"
                        ? "bg-foreground/[0.05] text-negative"
                        : "bg-foreground/[0.05] text-foreground",
                  )}
                >
                  <RollingNumber
                    value={s.label}
                    className={
                      s.tone === "brand" ? "opacity-70" : "text-muted-foreground"
                    }
                  />
                  <RollingNumber value={s.value} />
                </span>
              ))}
            </div>
          )}

          <table className="sr-only">
            <caption>{`${title}: ${summary}.`}</caption>
            <thead>
              <tr>
                <th scope="col">Version</th>
                <th scope="col">Kind</th>
                <th scope="col">Deployed</th>
                <th scope="col">Eval score</th>
                <th scope="col">Change</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.d.id}>
                  <th scope="row">
                    {it.d.label ? `${it.d.version}: ${it.d.label}` : it.d.version}
                  </th>
                  <td>{it.d.kind}</td>
                  <td>{formatDate(new Date(it.at))}</td>
                  <td>{formatScore(it.d.score)}</td>
                  <td>{it.before !== null ? points(it.d.score - it.before) : "First"}</td>
                  <td>
                    {it.status === "rolled-back"
                      ? `Rolled back after ${duration(it.d.rolledBackAfter ?? 0)}`
                      : it.status === "below"
                        ? "Below minimum"
                        : it.status === "canary"
                          ? `Canary, ${percent(it.d.canary ?? 0)} of traffic`
                          : it.status === "live"
                            ? "Live"
                            : "Replaced"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p role="status" aria-live="polite" className="sr-only">
            {selected
              ? `Selected ${items.find((it) => it.d.id === selected)?.d.version ?? ""}`
              : ""}
          </p>
        </Panel>
      </Shell>
    </MotionConfig>
  );
}

function Callout({
  item,
  threshold,
  formatScore,
  formatDate,
  compact,
}: {
  item: Item;
  threshold?: number;
  formatScore: (score: number) => string;
  formatDate: (date: Date) => string;
  compact: boolean;
}) {
  const { d, before, status } = item;
  const delta = before !== null ? d.score - before : null;
  return (
    <>
      <p className="flex items-center gap-1.5">
        <span className="font-mono font-medium">{d.version}</span>
        <span className="max-w-56 truncate text-muted-foreground">
          {(!compact && d.label) || d.kind} · {formatDate(new Date(item.at))}
        </span>
      </p>
      <p className="mt-0.5 flex items-center gap-1.5">
        <span className="font-mono tabular-nums">{formatScore(d.score)}</span>
        {delta !== null && (
          <span
            className={cn(
              "font-mono tabular-nums",
              item.regression || (threshold !== undefined && d.score < threshold)
                ? "text-negative"
                : delta > 0
                  ? "text-positive"
                  : "text-muted-foreground",
            )}
          >
            {points(delta)}
          </span>
        )}
        {status !== "shipped" && (
          <span
            className={cn(
              status === "rolled-back" || status === "below"
                ? "text-negative"
                : "text-brand",
            )}
          >
            ·{" "}
            {status === "rolled-back"
              ? `${compact ? "back in" : "rolled back in"} ${duration(d.rolledBackAfter ?? 0)}`
              : status === "below"
                ? "below min"
                : status === "canary"
                  ? `canary ${percent(d.canary ?? 0)}`
                  : "live"}
          </span>
        )}
      </p>
    </>
  );
}
