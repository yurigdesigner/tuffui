// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const STRIPES =
  "repeating-linear-gradient(-45deg, rgb(255 255 255 / 0.16) 0 3px, transparent 3px 7px)";
const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";

export type SliderMark = { value: number; label?: string };

type Value = number | [number, number];

export type SliderProps<V extends Value> = {
  /** A number for one thumb, a `[low, high]` pair for a range. */
  value?: V;
  defaultValue: V;
  onValueChange?: (value: V) => void;
  /** Fires once when a drag or key press ends. */
  onValueCommit?: (value: V) => void;
  min?: number;
  max?: number;
  step?: number;
  marks?: SliderMark[];
  /** Diagonal stripes on the filled part of the track. */
  striped?: boolean;
  /** Accessible name; also shown above the track. */
  label: string;
  /** Formats the bubble and aria-valuetext, e.g. `(v) => v.toFixed(1)`. */
  format?: (value: number) => string;
  disabled?: boolean;
  className?: string;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** One or two thumbs on a track. The thumb is the same silver knob as the Switch. */
export function Slider<V extends Value>({
  value: valueProp,
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  marks,
  striped,
  label,
  format = (v) => String(v),
  disabled,
  className,
}: SliderProps<V>) {
  const [inner, setInner] = useState<V>(defaultValue);
  const value = valueProp ?? inner;
  const range = Array.isArray(value);
  const values: number[] = range ? [...(value as [number, number])] : [value as number];
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const labelId = useId();

  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const snap = (v: number) => {
    const snapped = Math.round((v - min) / step) * step + min;
    return clamp(Number(snapped.toFixed(6)), min, max);
  };

  const emit = (next: number[], commit = false) => {
    const out = (range ? [next[0], next[1]] : next[0]) as V;
    if (valueProp === undefined) setInner(out);
    onValueChange?.(out);
    if (commit) onValueCommit?.(out);
  };

  const setThumb = (i: number, v: number, commit = false) => {
    const next = [...values];
    // Range thumbs can't cross each other.
    next[i] = range
      ? i === 0
        ? Math.min(snap(v), values[1])
        : Math.max(snap(v), values[0])
      : snap(v);
    if (next[i] !== values[i] || commit) emit(next, commit);
  };

  const fromPointer = (clientX: number) => {
    const rect = track.current!.getBoundingClientRect();
    return min + clamp((clientX - rect.left) / rect.width, 0, 1) * (max - min);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || e.button !== 0) return;
    const v = fromPointer(e.clientX);
    // Grab the nearer thumb in a range.
    const i = range ? (Math.abs(v - values[0]) <= Math.abs(v - values[1]) ? 0 : 1) : 0;
    setActive(i);
    setDragging(true);
    setThumb(i, v);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    track.current?.querySelectorAll<HTMLElement>("[role=slider]")[i]?.focus();
  };

  const onKeyDown = (i: number) => (e: React.KeyboardEvent) => {
    const big = Math.max(step, (max - min) / 10);
    const moves: Record<string, number> = {
      ArrowRight: values[i] + step,
      ArrowUp: values[i] + step,
      ArrowLeft: values[i] - step,
      ArrowDown: values[i] - step,
      PageUp: values[i] + big,
      PageDown: values[i] - big,
      Home: min,
      End: max,
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    setThumb(i, moves[e.key], true);
  };

  const lo = range ? pct(values[0]) : 0;
  const hi = pct(range ? values[1] : values[0]);
  // Pointer moves follow the finger exactly; clicks and keys glide a little.
  const glide = dragging ? "none" : `left 150ms ${EASE}, right 150ms ${EASE}`;

  return (
    <div className={cn("w-full", disabled && "opacity-40", className)}>
      <div className="mb-2 flex items-baseline justify-between px-1 text-[0.8125rem]">
        <span id={labelId} className="font-medium">
          {label}
        </span>
        <span className="text-muted-foreground tabular-nums">
          {values.map(format).join(" – ")}
        </span>
      </div>
      <div
        ref={track}
        onPointerDown={onPointerDown}
        onPointerMove={(e) =>
          dragging && active !== null && setThumb(active, fromPointer(e.clientX))
        }
        onPointerUp={() => {
          if (dragging && active !== null) setThumb(active, values[active], true);
          setDragging(false);
        }}
        className={cn(
          "relative flex h-7 touch-none items-center select-none",
          disabled ? "pointer-events-none" : "cursor-pointer",
        )}
      >
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-foreground/[0.08]" />
        <div
          className="absolute h-1.5 rounded-full bg-brand"
          style={{
            left: `${lo}%`,
            right: `${100 - hi}%`,
            backgroundImage: striped ? STRIPES : undefined,
            transition: glide,
          }}
        />
        {values.map((v, i) => (
          <div
            key={i}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-labelledby={labelId}
            aria-label={range ? (i === 0 ? "Minimum" : "Maximum") : undefined}
            aria-valuemin={range && i === 1 ? values[0] : min}
            aria-valuemax={range && i === 0 ? values[1] : max}
            aria-valuenow={v}
            aria-valuetext={format(v)}
            aria-disabled={disabled || undefined}
            onKeyDown={onKeyDown(i)}
            onFocus={() => setActive(i)}
            onBlur={() => !dragging && setActive(null)}
            className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2 outline-none"
            style={{
              left: `${pct(v)}%`,
              transition: dragging ? "none" : `left 150ms ${EASE}`,
            }}
          >
            <span
              className={cn(
                "block size-5 rounded-full bg-[linear-gradient(180deg,#ffffff,#e2e2e2)] shadow-[0_2px_3px_rgba(0,0,0,0.18)] transition-[scale] duration-150 group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-ring",
                active === i && dragging && "scale-110",
              )}
              style={{ transitionTimingFunction: EASE }}
            />
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute bottom-full left-1/2 mb-2 origin-bottom -translate-x-1/2 rounded-lg bg-surface-raised px-2 py-0.5 text-xs font-medium whitespace-nowrap tabular-nums transition-[opacity,scale] duration-150",
                active === i ? "scale-100 opacity-100" : "scale-95 opacity-0",
              )}
              style={{ transitionTimingFunction: EASE }}
            >
              {format(v)}
            </span>
          </div>
        ))}
      </div>
      {marks && (
        <div className="relative mt-1 h-4 text-[0.6875rem] text-muted-foreground">
          {marks.map((m) => (
            <span
              key={m.value}
              // Edge labels hug the track ends instead of hanging past them.
              className={cn(
                "absolute tabular-nums",
                m.value <= min
                  ? ""
                  : m.value >= max
                    ? "-translate-x-full"
                    : "-translate-x-1/2",
              )}
              style={{ left: `${pct(m.value)}%` }}
            >
              {m.label ?? format(m.value)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
