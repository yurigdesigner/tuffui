"use client";

import { ChartPolar } from "@phosphor-icons/react";
import { MotionConfig, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { EASE_OUT } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type RadialSeries = {
  id: string;
  label: string;
  /** One value per sector. Series stack outward in order. */
  values: number[];
  /** Any CSS color. Defaults to blue, then foreground, then muted. */
  color?: string;
};

export type RadialDotsProps = {
  /** One label per sector, clockwise from the top: hours, weekdays, months. */
  labels: string[];
  series: RadialSeries[];
  title: string;
  subtitle?: string;
  /** Big number in the middle and the line under it. */
  center: { value: string; caption?: string };
  /** Which sector labels to draw around the edge. Defaults to the four quarters. */
  axis?: number[];
  format?: (value: number) => string;
  onSelect?: (index: number) => void;
  className?: string;
};

const SIZE = 300;
const C = SIZE / 2;
const INNER = 70;
const RINGS = 8;
const RING = 8;
const LANES = 3;
const palette = [
  "var(--brand)",
  "var(--foreground)",
  "color-mix(in oklab, var(--foreground) 45%, transparent)",
];

const round = (n: number) => Math.round(n * 100) / 100;

const polar = (turn: number, r: number) => {
  const a = turn * 2 * Math.PI - Math.PI / 2;
  // Rounded so server and client trig agree and hydration matches.
  return [round(C + r * Math.cos(a)), round(C + r * Math.sin(a))] as const;
};

/**
 * A cycle drawn as rings of dots: each sector is a slot in the cycle (an hour
 * of the day, a day of the week), and its dots stack outward, series by
 * series. Shows when things happen, not just how many.
 */
export function RadialDots({
  labels,
  series,
  title,
  subtitle,
  center,
  axis,
  format = (v) => v.toLocaleString("en-US"),
  onSelect,
  className,
}: RadialDotsProps) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);
  const [fromKeyboard, setFromKeyboard] = useState(false);

  const n = labels.length;
  const colored = series.map((s, i) => ({
    ...s,
    color: s.color ?? palette[i % palette.length],
  }));
  const totals = labels.map((_, i) =>
    colored.reduce((sum, s) => sum + (s.values[i] ?? 0), 0),
  );
  const peak = Math.max(1, ...totals);
  // The busiest sector fills every ring.
  const per = peak / (RINGS * LANES);
  const quarters = axis ?? [0, n / 4, n / 2, (3 * n) / 4].filter(Number.isInteger);

  const select = (index: number | null, keyboard: boolean) => {
    setFromKeyboard(keyboard);
    setActive(index);
    if (index !== null) onSelect?.(index);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!n) return;
    const keys: Record<string, number> = {
      ArrowRight: (active ?? -1) + 1,
      ArrowDown: (active ?? -1) + 1,
      ArrowLeft: (active ?? n) - 1,
      ArrowUp: (active ?? n) - 1,
      Home: 0,
      End: n - 1,
    };
    if (event.key === "Escape") return select(null, true);
    if (!(event.key in keys)) return;
    event.preventDefault();
    select((keys[event.key] + n) % n, true);
  };

  const wedge = (i: number) => {
    const [x1, y1] = polar(i / n, INNER);
    const [x2, y2] = polar(i / n, C);
    const [x3, y3] = polar((i + 1) / n, C);
    const [x4, y4] = polar((i + 1) / n, INNER);
    return `M${x1} ${y1}L${x2} ${y2}A${C} ${C} 0 0 1 ${x3} ${y3}L${x4} ${y4}A${INNER} ${INNER} 0 0 0 ${x1} ${y1}Z`;
  };

  return (
    <MotionConfig reducedMotion="user">
      <Shell className={cn("max-w-sm", className)}>
        <ShellHeader icon={ChartPolar} title={title} subtitle={subtitle} />
        <Panel className="p-4">
          <div
            tabIndex={0}
            role="group"
            aria-label={`${title}. Use arrow keys to read each ${n === 24 ? "hour" : "slot"}.`}
            onKeyDown={onKeyDown}
            onBlur={() => fromKeyboard && setActive(null)}
            className="relative mx-auto w-full max-w-72 rounded-full outline-offset-4"
          >
            <svg
              viewBox={`-20 -20 ${SIZE + 40} ${SIZE + 40}`}
              role="img"
              aria-label={`${title}: busiest ${labels[totals.indexOf(peak)]} with ${format(peak)}`}
              className="block w-full overflow-visible"
              onPointerLeave={() => select(null, false)}
            >
              {labels.map((label, i) => {
                const [x1, y1] = polar(i / n, C - 2);
                const [x2, y2] = polar(i / n, C + 4);
                const labeled = quarters.includes(i);
                const [tx, ty] = polar(i / n, C + 16);
                return (
                  <g key={i} className="text-muted-foreground">
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="currentColor"
                      strokeOpacity={labeled ? 0.7 : 0.3}
                      strokeWidth={1.25}
                    />
                    {labeled && (
                      <text
                        x={tx}
                        y={ty}
                        dy="0.32em"
                        textAnchor="middle"
                        fontSize="13"
                        fill="currentColor"
                        className="font-mono"
                      >
                        {label}
                      </text>
                    )}
                  </g>
                );
              })}

              <circle
                cx={C}
                cy={C}
                r={INNER - 6}
                fill="none"
                className="stroke-foreground/10"
              />

              {labels.map((_, i) => {
                // Fill lanes ring by ring, inner series first.
                const slots: (string | null)[] = Array(RINGS * LANES).fill(null);
                let at = 0;
                for (const s of colored) {
                  const dots = Math.round((s.values[i] ?? 0) / per);
                  for (let k = 0; k < dots && at < slots.length; k++)
                    slots[at++] = s.color;
                }
                const dim = active !== null && active !== i;
                return (
                  <motion.g
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      duration: 0.3,
                      ease: EASE_OUT,
                      delay: reduce ? 0 : i * 0.02,
                    }}
                  >
                    <g
                      className={cn(
                        "transition-opacity duration-150",
                        dim && "opacity-40",
                        fromKeyboard && "duration-0",
                      )}
                    >
                      {slots.map((color, k) => {
                        const ring = Math.floor(k / LANES);
                        const lane = k % LANES;
                        const [x, y] = polar(
                          (i + (lane + 0.5) / LANES) / n,
                          INNER + 6 + ring * RING,
                        );
                        return color ? (
                          <circle key={k} cx={x} cy={y} r={2.6} style={{ fill: color }} />
                        ) : (
                          <circle
                            key={k}
                            cx={x}
                            cy={y}
                            r={1.1}
                            className="fill-foreground/15"
                          />
                        );
                      })}
                    </g>
                  </motion.g>
                );
              })}

              {labels.map((_, i) => (
                <path
                  key={i}
                  d={wedge(i)}
                  fill="transparent"
                  onPointerEnter={() => select(i, false)}
                />
              ))}
            </svg>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              {active === null ? (
                <>
                  <p className="text-2xl font-medium tracking-tight">{center.value}</p>
                  {center.caption && (
                    <p className="text-xs text-muted-foreground">{center.caption}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-mono text-xs text-muted-foreground">
                    {labels[active]}
                  </p>
                  <p className="text-xl font-medium tracking-tight tabular-nums">
                    {format(totals[active])}
                  </p>
                </>
              )}
            </div>
          </div>

          {colored.length > 1 && (
            <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {colored.map((s) => (
                <span key={s.id} className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full"
                    style={{ background: s.color }}
                  />
                  {s.label}
                  {/* The hovered sector's numbers live here, so the centre stays two lines. */}
                  {active !== null && (
                    <span className="font-mono text-foreground tabular-nums">
                      {format(s.values[active] ?? 0)}
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}

          <p role="status" aria-live="polite" className="sr-only">
            {fromKeyboard && active !== null
              ? `${labels[active]}: ${colored.map((s) => `${s.label} ${format(s.values[active] ?? 0)}`).join(", ")}`
              : ""}
          </p>
        </Panel>
      </Shell>
    </MotionConfig>
  );
}
