"use client";

import { Cube } from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { EASE_OUT, enter, exit, instant } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type IsoSeries = {
  id: string;
  label: string;
  /** One value per period. Series stack upward in order. */
  values: number[];
  /** Any CSS color. Faces are shaded from it, so it works in both themes. */
  color?: string;
};

export type IsoRow = "back" | "front";

export type IsoBarsProps = {
  /** One label per period, drawn along the front edge of the floor. */
  labels: string[];
  /** The main stack, drawn in the back row. */
  back: IsoSeries[];
  /** A smaller stack in front of it, e.g. rework or failures. */
  front?: IsoSeries[];
  title: string;
  subtitle?: string;
  /** Headline in the header, with an optional flag in warning or negative color. */
  aside?: {
    value: string;
    caption?: string;
    flag?: string;
    tone?: "warning" | "negative";
  };
  /** Formats values in the tooltip and the table. */
  format?: (value: number) => string;
  onSelect?: (point: { row: IsoRow; index: number }) => void;
  className?: string;
};

// Validated for both themes. The front row defaults to the alert colors.
const backPalette = [
  "var(--brand)",
  "#1a9e8c",
  "#bf5af2",
  "#b8862b",
  "#5e5ce6",
  "#30b0c7",
];
const frontPalette = ["var(--warning)", "var(--negative)", "#b8862b", "#5e5ce6"];

/** Screen units per floor cell. The svg scales to its container. */
const K = 40;
/** Gap around a prism inside its cell, as a share of the cell. */
const INSET = 0.18;
/** Where each row starts in depth, in cells. */
const ROW_V = { back: 0, front: 1.05 };
const PLATE = 0.35;
const THICK = 5;

const round = (n: number) => Math.round(n * 100) / 100;

/** Isometric projection: u runs along periods, v toward the viewer, h up. */
const iso = (u: number, v: number, h: number) =>
  [round((u - v) * K), round(((u + v) * K) / 2 - h)] as const;

const path = (points: (readonly [number, number])[]) =>
  `M${points.map(([x, y]) => `${x} ${y}`).join("L")}Z`;

const compact = (n: number) =>
  Math.abs(n) >= 1_000_000
    ? `${+(n / 1_000_000).toFixed(1)}M`
    : Math.abs(n) >= 1000
      ? `${+(n / 1000).toFixed(1)}k`
      : `${+n.toFixed(1)}`;

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  // null until measured: the chart draws once at its real width, so entrance
  // animations don't tween from a guessed size.
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

type Colored = IsoSeries & { color: string };

type Prism = {
  row: IsoRow;
  index: number;
  u0: number;
  u1: number;
  v0: number;
  v1: number;
  segments: { series: Colored; h0: number; h1: number }[];
  total: number;
  height: number;
};

/** The three visible faces of one segment, at a share of its full height. */
function faces(p: Prism, h0: number, h1: number, top: boolean, grow: number) {
  const a = h0 * grow;
  const b = h1 * grow;
  return {
    left: path([
      iso(p.u0, p.v1, a),
      iso(p.u1, p.v1, a),
      iso(p.u1, p.v1, b),
      iso(p.u0, p.v1, b),
    ]),
    right: path([
      iso(p.u1, p.v1, a),
      iso(p.u1, p.v0, a),
      iso(p.u1, p.v0, b),
      iso(p.u1, p.v1, b),
    ]),
    top: top
      ? path([
          iso(p.u0, p.v0, b),
          iso(p.u1, p.v0, b),
          iso(p.u1, p.v1, b),
          iso(p.u0, p.v1, b),
        ])
      : null,
  };
}

/**
 * Stacked bars as isometric prisms on a floor plate. The back row holds the
 * main stack per period, the front row a smaller one, like rework or scrap, so
 * the cost of a period sits right next to its output.
 */
export function IsoBars({
  labels,
  back,
  front = [],
  title,
  subtitle,
  aside,
  format = compact,
  onSelect,
  className,
}: IsoBarsProps) {
  const uid = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const [ref, width, measured] = useWidth();
  const [active, setActive] = useState<{ row: IsoRow; index: number } | null>(null);
  const [fromKeyboard, setFromKeyboard] = useState(false);

  const n = labels.length;
  const rows: { row: IsoRow; series: Colored[] }[] = [
    {
      row: "back" as const,
      series: back.map((s, i) => ({
        ...s,
        color: s.color ?? backPalette[i % backPalette.length],
      })),
    },
    {
      row: "front" as const,
      series: front.map((s, i) => ({
        ...s,
        color: s.color ?? frontPalette[i % frontPalette.length],
      })),
    },
  ].filter((r) => r.series.length);
  const rowNames = rows.map((r) => r.row);
  const depth = (rowNames.includes("front") ? ROW_V.front : 0) + 1;

  const totalOf = (series: Colored[], i: number) =>
    series.reduce((sum, s) => sum + Math.max(0, s.values[i] ?? 0), 0);
  const peak = Math.max(
    1,
    ...rows.flatMap((r) => labels.map((_, i) => totalOf(r.series, i))),
  );
  // Taller plots for longer floors, so prisms keep their proportions.
  const maxH = Math.min(Math.max((n + depth) * K * 0.4, 140), 280);

  const prisms: Prism[] = rows.flatMap(({ row, series }) =>
    labels.map((_, index) => {
      let h = 0;
      const segments = series.map((s) => {
        const h0 = h;
        h += (Math.max(0, s.values[index] ?? 0) / peak) * maxH;
        return { series: s, h0, h1: h };
      });
      return {
        row,
        index,
        u0: index + INSET,
        u1: index + 1 - INSET,
        v0: ROW_V[row] + INSET,
        v1: ROW_V[row] + 1 - INSET,
        segments,
        total: totalOf(series, index),
        height: h,
      };
    }),
  );
  // Painter's order: farther from the viewer first.
  const drawOrder = [...prisms].sort((a, b) => a.u0 + a.v0 - (b.u0 + b.v0));

  // Fit the viewBox around the plate, the tallest prism tops and the labels.
  const plate = [
    iso(-PLATE, -PLATE, 0),
    iso(n + PLATE, -PLATE, 0),
    iso(n + PLATE, depth + PLATE, 0),
    iso(-PLATE, depth + PLATE, 0),
  ] as const;
  const tops = prisms.map((p) => iso(p.u0, p.v0, p.height)[1]);
  const minY = Math.min(plate[0][1], ...tops) - 8;
  const maxX = plate[1][0] + 4;
  // Labels keep their screen size, so the room they need left of the first
  // one depends on the scale, which depends on that room. Solve for it.
  const labelX = iso(0.5, depth + PLATE + 0.2, 0)[0];
  const labelPx = Math.max(0, ...labels.map((l) => l.length)) * 6.2 + 4;
  const fitW = Math.max(width, labelPx + 120);
  const minX = Math.min(
    plate[3][0] - 4,
    (labelX * fitW - labelPx * maxX) / (fitW - labelPx),
  );
  const vbW = round(maxX - minX);
  const scale = fitW / vbW;
  // Keep text at 10px on screen and thin labels out when periods get close.
  const fontSize = round(10 / scale);
  const maxY = plate[2][1] + THICK + fontSize * 1.6;
  const vbH = round(maxY - minY);
  const labelEvery = Math.max(1, Math.ceil(24 / (K * scale)));

  const find = (row: IsoRow, index: number) =>
    prisms.find((p) => p.row === row && p.index === index);
  const current = active ? find(active.row, active.index) : undefined;

  const select = (next: { row: IsoRow; index: number } | null, keyboard: boolean) => {
    setFromKeyboard(keyboard);
    setActive(next);
    if (next) onSelect?.(next);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!n || !rowNames.length) return;
    if (event.key === "Escape") return select(null, true);
    const row = active?.row ?? rowNames[0];
    const index = active?.index;
    const at = rowNames.indexOf(row);
    const moves: Record<string, { row: IsoRow; index: number }> = {
      ArrowRight: { row, index: index === undefined ? 0 : (index + 1) % n },
      ArrowLeft: { row, index: index === undefined ? n - 1 : (index - 1 + n) % n },
      ArrowUp: { row: rowNames[Math.max(at - 1, 0)], index: index ?? 0 },
      ArrowDown: {
        row: rowNames[Math.min(at + 1, rowNames.length - 1)],
        index: index ?? 0,
      },
      Home: { row, index: 0 },
      End: { row, index: n - 1 },
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    select(moves[event.key], true);
  };

  const mainTotals = labels.map((_, i) => totalOf(rows[0]?.series ?? [], i));
  const peakIndex = mainTotals.indexOf(Math.max(...mainTotals));
  const summary = `${title}: ${rows
    .flatMap((r) => r.series.map((s) => s.label))
    .join(
      ", ",
    )} from ${labels[0]} to ${labels.at(-1)}${peakIndex >= 0 ? `, highest ${labels[peakIndex]}` : ""}`;

  const all = rows.flatMap((r) => r.series);
  const tip = current && {
    x:
      ((iso((current.u0 + current.u1) / 2, (current.v0 + current.v1) / 2, 0)[0] - minX) /
        vbW) *
      100,
    y: ((iso(current.u0, current.v0, current.height)[1] - minY) / vbH) * 100,
  };

  return (
    <MotionConfig reducedMotion="user">
      <Shell className={cn("max-w-xl", className)}>
        <ShellHeader
          icon={Cube}
          title={title}
          subtitle={subtitle}
          aside={
            aside && (
              <div className="text-right">
                <p className="text-xl font-medium tracking-tight tabular-nums">
                  {aside.value}
                  {aside.caption && (
                    <span className="ml-1 text-xs font-normal tracking-normal text-muted-foreground">
                      {aside.caption}
                    </span>
                  )}
                </p>
                {aside.flag && (
                  <p
                    className={cn(
                      "font-mono text-xs tabular-nums",
                      aside.tone === "negative" ? "text-negative" : "text-warning",
                    )}
                  >
                    {aside.flag}
                  </p>
                )}
              </div>
            )
          }
        />
        <Panel className="p-4">
          <div
            ref={ref}
            tabIndex={0}
            role="group"
            aria-label={`${title}. Use left and right arrows to read periods, up and down to switch rows.`}
            onKeyDown={onKeyDown}
            onBlur={() => fromKeyboard && setActive(null)}
            className="relative rounded-xl outline-offset-4"
          >
            <svg
              key={measured ? "measured" : "guess"}
              visibility={measured ? undefined : "hidden"}
              role="img"
              aria-label={summary}
              viewBox={`${round(minX)} ${round(minY)} ${vbW} ${vbH}`}
              className="block h-auto w-full"
              onPointerLeave={() => select(null, false)}
            >
              <defs>
                <pattern
                  id={`${uid}-stripe`}
                  width="6"
                  height="6"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect width="2" height="6" fill="white" opacity="0.14" />
                </pattern>
                <pattern
                  id={`${uid}-dots`}
                  width="5"
                  height="5"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="2.5" cy="2.5" r="0.9" fill="white" opacity="0.28" />
                </pattern>
              </defs>

              {/* Floor plate with a thin front edge. */}
              <path
                d={path([
                  plate[3],
                  plate[2],
                  iso(n + PLATE, depth + PLATE, -THICK),
                  iso(-PLATE, depth + PLATE, -THICK),
                ])}
                className="fill-foreground/[0.08]"
              />
              <path
                d={path([
                  plate[2],
                  plate[1],
                  iso(n + PLATE, -PLATE, -THICK),
                  iso(n + PLATE, depth + PLATE, -THICK),
                ])}
                className="fill-foreground/[0.11]"
              />
              <path d={path([...plate])} className="fill-foreground/[0.05]" />

              {labels.map((label, i) => {
                if (i % labelEvery) return null;
                const [x, y] = iso(i + 0.5, depth + PLATE + 0.2, -THICK);
                const on = active?.index === i;
                return (
                  <text
                    key={i}
                    x={x}
                    y={y}
                    dy="0.9em"
                    textAnchor="end"
                    fontSize={fontSize}
                    className={cn(
                      "font-mono transition-colors duration-150",
                      on ? "fill-foreground" : "fill-muted-foreground",
                      fromKeyboard && "duration-0",
                    )}
                  >
                    {label}
                  </text>
                );
              })}

              {drawOrder.map((p) => {
                const dim =
                  active !== null && (active.row !== p.row || active.index !== p.index);
                const last = p.segments.findLastIndex((s) => s.h1 > s.h0);
                return (
                  <g
                    key={`${p.row}-${p.index}`}
                    className={cn(
                      "transition-opacity duration-150",
                      dim && "opacity-35",
                      fromKeyboard && "duration-0",
                    )}
                    onPointerEnter={() => select({ row: p.row, index: p.index }, false)}
                    onClick={() => select({ row: p.row, index: p.index }, false)}
                  >
                    {p.segments.map((s, k) => {
                      if (s.h1 <= s.h0) return null;
                      const full = faces(p, s.h0, s.h1, k === last, 1);
                      // Rise from a sliver, not from nothing.
                      const from = faces(p, s.h0, s.h1, k === last, 0.04);
                      const transition = reduce
                        ? instant
                        : {
                            duration: 0.5,
                            ease: EASE_OUT,
                            delay: p.index * 0.03 + (p.row === "front" ? 0.08 : 0),
                          };
                      const c = s.series.color;
                      const shades = [
                        { d: full.left, from: from.left, fill: c, tex: "stripe" },
                        {
                          d: full.right,
                          from: from.right,
                          fill: `color-mix(in oklab, ${c}, black 28%)`,
                          tex: "stripe",
                        },
                        {
                          d: full.top,
                          from: from.top,
                          fill: `color-mix(in oklab, ${c}, white 30%)`,
                          tex: "dots",
                        },
                      ];
                      return shades.map((f, j) =>
                        f.d && f.from ? (
                          <g key={`${s.series.id}-${j}`}>
                            <motion.path
                              initial={reduce ? false : { d: f.from }}
                              animate={{ d: f.d }}
                              transition={transition}
                              style={{ fill: f.fill }}
                            />
                            <motion.path
                              initial={reduce ? false : { d: f.from }}
                              animate={{ d: f.d }}
                              transition={transition}
                              fill={`url(#${uid}-${f.tex})`}
                            />
                          </g>
                        ) : null,
                      );
                    })}
                  </g>
                );
              })}
            </svg>

            <AnimatePresence>
              {current && tip && (
                <div
                  key="tip"
                  className="pointer-events-none absolute z-10"
                  style={{
                    left: `clamp(0px, calc(${round(tip.x)}% + 14px), calc(100% - 9.5rem))`,
                    top: `max(0px, calc(${round(tip.y)}% - 1.5rem))`,
                  }}
                >
                  <motion.div
                    initial={fromKeyboard ? false : { opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1, transition: enter }}
                    exit={{ opacity: 0, transition: exit }}
                    className="w-max max-w-[9.5rem] min-w-28 origin-top-left rounded-xl bg-surface-raised px-3 py-2 text-xs"
                  >
                    <p className="text-muted-foreground">{labels[current.index]}</p>
                    {current.segments.length === 1 ? (
                      <p className="font-mono text-foreground tabular-nums">
                        {format(current.total)} ·{" "}
                        {current.segments[0].series.label.toLowerCase()}
                      </p>
                    ) : (
                      <>
                        {[...current.segments].reverse().map(({ series: s }) => (
                          <p
                            key={s.id}
                            className="flex items-center gap-2 text-muted-foreground"
                          >
                            <span
                              aria-hidden="true"
                              className="size-2 rounded-[2px]"
                              style={{ background: s.color }}
                            />
                            <span className="flex-1 truncate">{s.label}</span>
                            <span className="font-mono text-foreground tabular-nums">
                              {format(s.values[current.index] ?? 0)}
                            </span>
                          </p>
                        ))}
                        <p className="mt-1 flex justify-between gap-2 font-medium">
                          Total
                          <span className="font-mono tabular-nums">
                            {format(current.total)}
                          </span>
                        </p>
                      </>
                    )}
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {rows.map((r, i) => (
              <span key={r.row} className="contents">
                {i > 0 && (
                  <span aria-hidden="true" className="h-3 w-px bg-foreground/15" />
                )}
                {r.series.map((s) => (
                  <span key={s.id} className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="size-2.5 rounded-[3px]"
                      style={{ background: s.color }}
                    />
                    {s.label}
                  </span>
                ))}
              </span>
            ))}
          </div>

          <table className="sr-only">
            <caption>{title}</caption>
            <thead>
              <tr>
                <th scope="col">Period</th>
                {all.map((s) => (
                  <th key={s.id} scope="col">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((label, i) => (
                <tr key={i}>
                  <th scope="row">{label}</th>
                  {all.map((s) => (
                    <td key={s.id}>{format(s.values[i] ?? 0)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p role="status" aria-live="polite" className="sr-only">
            {fromKeyboard && current
              ? `${labels[current.index]}, ${current.row} row: ${current.segments
                  .map(
                    ({ series: s }) =>
                      `${s.label} ${format(s.values[current.index] ?? 0)}`,
                  )
                  .join(", ")}`
              : ""}
          </p>
        </Panel>
      </Shell>
    </MotionConfig>
  );
}
