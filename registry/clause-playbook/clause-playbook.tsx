// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import {
  CaretUpDown,
  Check,
  Minus,
  Plus,
  Scales,
  Sparkle,
  type Icon,
} from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { Select as SelectPrimitive } from "radix-ui";
import { useId, useRef, useState } from "react";
import { Switch } from "@/components/ui/choice-controls";
import { RollingNumber } from "@/components/ui/rolling-number";
import { StatusPill } from "@/components/ui/status-pill";
import { Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { CSS_EASE_IN_OUT, EASE_OUT, enter, exit, instant } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

/** The two handles. Below `fallback` is walk-away; from `preferred` up is preferred. */
export type ClauseThresholds = { fallback: number; preferred: number };

/** One column of the market histogram: how many signed contracts landed on `value`. */
export type ClauseBucket = { value: number; count: number };

export type ClauseValue = number | string | boolean;

export type ClauseSelectOption = {
  value: string;
  label: string;
  /** Right-aligned in the menu, e.g. "below 12 mo". */
  hint?: string;
};

type SettingBase = {
  id: string;
  label: string;
  /** A node, or a function of the live thresholds, e.g. `(t) => \`agent signs off ${t.fallback}–${t.preferred} mo\``. */
  description?: React.ReactNode | ((thresholds: ClauseThresholds) => React.ReactNode);
};

export type ClauseSetting = SettingBase &
  (
    | {
        kind: "stepper";
        defaultValue: number;
        min?: number;
        max?: number;
        step?: number;
        format?: (value: number) => string;
      }
    | { kind: "select"; defaultValue: string; options: ClauseSelectOption[] }
    | { kind: "toggle"; defaultValue: boolean }
  );

export type ClauseZoneLabels = {
  walkAway?: string;
  fallback?: string;
  preferred?: string;
};

export type ClausePlaybookProps = {
  /** Clause name, e.g. "Liability cap". */
  clause: string;
  /** Clause number shown before the name, e.g. "9.2". */
  number?: string;
  /** Line under the title, e.g. "Playbook · Corvane MSA". */
  subtitle?: React.ReactNode;
  icon?: Icon;
  /** Market distribution, one bucket per value. */
  distribution: ClauseBucket[];
  /** `[min, max]` of the scale. */
  domain?: [number, number];
  step?: number;
  /** Shift+arrow and Page Up/Down move this far. */
  largeStep?: number;
  /** Axis ticks. Defaults to five evenly spaced values. */
  ticks?: number[];
  /** Unit after values, e.g. "mo". */
  unit?: string;
  /** Formats a value without the unit. */
  format?: (value: number) => string;
  thresholds?: ClauseThresholds;
  defaultThresholds?: ClauseThresholds;
  onThresholdsChange?: (thresholds: ClauseThresholds) => void;
  /** Smallest distance between the two handles. Defaults to `step`. */
  minGap?: number;
  zoneLabels?: ClauseZoneLabels;
  /** Rows under the chart: steppers, selects and toggles. */
  settings?: ClauseSetting[];
  /** Controlled setting values by id. Missing ids fall back to their `defaultValue`. */
  values?: Record<string, ClauseValue>;
  onValuesChange?: (values: Record<string, ClauseValue>, changedId?: string) => void;
  /** Agent line above the chart, e.g. "Agent suggests 15 mo · p62 of market". */
  note?: React.ReactNode;
  /** What a contract is called in the histogram caption, plural. */
  sampleNoun?: string;
  /** Shows Apply. Called with the edited values; they become the new baseline. */
  onApply?: (thresholds: ClauseThresholds, values: Record<string, ClauseValue>) => void;
  /** Shows Discard. Values go back to the baseline before this is called. */
  onDiscard?: () => void;
  className?: string;
};

const MAX_ROWS = 16;
const HATCH =
  "repeating-linear-gradient(-45deg, color-mix(in oklab, var(--foreground) 24%, transparent) 0 1.5px, transparent 1.5px 4.5px)";
const DOTTED =
  "linear-gradient(to bottom, currentColor 0 2px, transparent 2px 4px) 0 0 / 1px 4px repeat-y";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Percentile of `value` in the market: share of contracts below it, ties counted half. */
export function marketPercentile(distribution: ClauseBucket[], value: number) {
  let total = 0;
  let below = 0;
  for (const b of distribution) {
    total += b.count;
    if (b.value < value) below += b.count;
    else if (b.value === value) below += b.count / 2;
  }
  return total ? Math.round((below / total) * 100) : 0;
}

type Mode = "idle" | "press" | "drag" | "key";

export function ClausePlaybook({
  clause,
  number,
  subtitle,
  icon = Scales,
  distribution,
  domain = [0, 24],
  step = 1,
  largeStep,
  ticks,
  unit = "",
  format,
  thresholds: thresholdsProp,
  defaultThresholds,
  onThresholdsChange,
  minGap,
  zoneLabels,
  settings = [],
  values: valuesProp,
  onValuesChange,
  note,
  sampleNoun = "contracts",
  onApply,
  onDiscard,
  className,
}: ClausePlaybookProps) {
  const [min, max] = domain;
  const span = max - min || 1;
  const gap = minGap ?? step;
  const big = largeStep ?? Math.max(step, Math.round(span / 8 / step) * step);
  const fmt = (v: number) => (format ? format(v) : String(+v.toFixed(2)));
  const withUnit = (v: number) => (unit ? `${fmt(v)} ${unit}` : fmt(v));
  const pct = (v: number) => ((clamp(v, min, max) - min) / span) * 100;
  const labels = {
    walkAway: zoneLabels?.walkAway ?? "Walk-away",
    fallback: zoneLabels?.fallback ?? "Fallback",
    preferred: zoneLabels?.preferred ?? "Preferred",
  };

  // Thresholds: controlled or not, against a baseline that Apply moves forward.
  const [innerThresholds, setInnerThresholds] = useState<ClauseThresholds>(
    () =>
      defaultThresholds ??
      thresholdsProp ?? { fallback: min + span / 4, preferred: min + span / 2 },
  );
  const t = thresholdsProp ?? innerThresholds;
  const [baseThresholds, setBaseThresholds] = useState<ClauseThresholds>(
    () => defaultThresholds ?? thresholdsProp ?? innerThresholds,
  );

  const [innerValues, setInnerValues] = useState<Record<string, ClauseValue>>({});
  const [baseValues, setBaseValues] = useState<Record<string, ClauseValue>>({});
  const valueOf = (s: ClauseSetting) =>
    valuesProp?.[s.id] ?? innerValues[s.id] ?? s.defaultValue;
  const baseOf = (s: ClauseSetting) => baseValues[s.id] ?? s.defaultValue;
  const allValues = () => Object.fromEntries(settings.map((s) => [s.id, valueOf(s)]));

  const edits =
    Number(t.fallback !== baseThresholds.fallback) +
    Number(t.preferred !== baseThresholds.preferred) +
    settings.filter((s) => valueOf(s) !== baseOf(s)).length;

  const emitThresholds = (next: ClauseThresholds) => {
    if (thresholdsProp === undefined) setInnerThresholds(next);
    onThresholdsChange?.(next);
  };
  const emitValues = (next: Record<string, ClauseValue>, id?: string) => {
    if (valuesProp === undefined) setInnerValues(next);
    onValuesChange?.(next, id);
  };
  const setValue = (id: string, v: ClauseValue) =>
    emitValues({ ...allValues(), [id]: v }, id);

  const apply = () => {
    const current = allValues();
    setBaseThresholds(t);
    setBaseValues(current);
    onApply?.(t, current);
  };
  const discard = () => {
    emitThresholds(baseThresholds);
    emitValues(Object.fromEntries(settings.map((s) => [s.id, baseOf(s)])));
    onDiscard?.();
  };

  // Handles.
  const reduce = useReducedMotion();
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<0 | 1 | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const labelId = useId();

  const snap = (v: number) =>
    clamp(Number((Math.round((v - min) / step) * step + min).toFixed(6)), min, max);
  const setHandle = (i: 0 | 1, raw: number) => {
    const v = snap(raw);
    const next =
      i === 0
        ? { ...t, fallback: clamp(v, min, t.preferred - gap) }
        : { ...t, preferred: clamp(v, t.fallback + gap, max) };
    if (next.fallback !== t.fallback || next.preferred !== t.preferred)
      emitThresholds(next);
  };
  const fromPointer = (clientX: number) => {
    const rect = track.current!.getBoundingClientRect();
    return min + clamp((clientX - rect.left) / rect.width, 0, 1) * span;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const v = fromPointer(e.clientX);
    const i: 0 | 1 = Math.abs(v - t.fallback) < Math.abs(v - t.preferred) ? 0 : 1;
    setActive(i);
    setMode("press");
    setHandle(i, v);
    e.currentTarget.setPointerCapture(e.pointerId);
    track.current?.querySelectorAll<HTMLElement>("[role=slider]")[i]?.focus();
    e.preventDefault();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (active === null) return;
    if (mode !== "drag") setMode("drag");
    setHandle(active, fromPointer(e.clientX));
  };
  const onPointerUp = () => {
    setActive(null);
    setMode("idle");
  };

  const onKeyDown = (i: 0 | 1) => (e: React.KeyboardEvent) => {
    const v = i === 0 ? t.fallback : t.preferred;
    const d = e.shiftKey ? big : step;
    const moves: Record<string, number> = {
      ArrowRight: v + d,
      ArrowUp: v + d,
      ArrowLeft: v - d,
      ArrowDown: v - d,
      PageUp: v + big,
      PageDown: v - big,
      Home: min,
      End: max,
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    setMode("key");
    setHandle(i, moves[e.key]);
  };

  // Clicks and agent edits glide; drags and keys follow at once.
  const still = reduce || mode === "drag" || mode === "key";
  const glide = (...props: string[]) =>
    still ? "none" : props.map((p) => `${p} 260ms ${CSS_EASE_IN_OUT}`).join(", ");
  const fp = pct(t.fallback);
  const pp = pct(t.preferred);

  // Histogram.
  const maxCount = Math.max(1, ...distribution.map((b) => b.count));
  const perDot = Math.max(1, Math.ceil(maxCount / MAX_ROWS));
  const total = distribution.reduce((a, b) => a + b.count, 0);
  const percentile = marketPercentile(distribution, t.preferred);

  const tickValues =
    ticks ?? Array.from({ length: 5 }, (_, i) => +(min + (span * i) / 4).toFixed(6));
  const nearHandle = (v: number) =>
    Math.abs(v - t.fallback) < span * 0.07 || Math.abs(v - t.preferred) < span * 0.07;

  const noteKey =
    typeof note === "string" || typeof note === "number" ? String(note) : "note";

  return (
    <MotionConfig reducedMotion="user">
      <Shell className={cn("max-w-2xl", className)}>
        <ShellHeader
          icon={icon}
          title={
            <>
              {number && (
                <span className="mr-1.5 font-mono text-muted-foreground">§ {number}</span>
              )}
              {clause}
            </>
          }
          subtitle={subtitle}
          aside={
            <StatusPill tone={edits ? "brand" : "neutral"} className="font-mono">
              {edits ? (
                <>
                  <RollingNumber value={edits} />
                  {edits === 1 ? "edit" : "edits"}
                </>
              ) : (
                "No edits"
              )}
            </StatusPill>
          }
        />

        <Panel className="p-4 @max-sm:p-3 @lg:p-5">
          {note && (
            <div className="mb-4 flex min-h-5 items-start gap-2 text-[0.8125rem]">
              <Sparkle
                weight="fill"
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-brand"
              />
              <div aria-live="polite" className="relative min-w-0 flex-1 overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.p
                    key={noteKey}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0, transition: enter }}
                    exit={{ opacity: 0, y: -6, transition: exit }}
                    className="text-pretty"
                  >
                    {note}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          )}

          <div className="mb-2 flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
            <span>Market</span>
            <span className="font-mono tabular-nums">
              1 dot ≈ {perDot.toLocaleString("en-US")}{" "}
              {perDot === 1 ? sampleNoun.replace(/s$/, "") : sampleNoun}
            </span>
          </div>

          {/* Chart, track and axis share one inset so values line up. */}
          <div className="px-1.5">
            <div className="relative h-5">
              <span
                className="absolute bottom-1 font-mono text-[0.6875rem] whitespace-nowrap text-brand tabular-nums"
                style={{
                  left: `${pp}%`,
                  transform: `translateX(-${pp}%)`,
                  transition: glide("left", "transform"),
                }}
              >
                p<RollingNumber value={percentile} />
                <span className="text-muted-foreground"> of market</span>
              </span>
            </div>
            <div
              role="img"
              aria-label={`Market distribution of ${total.toLocaleString("en-US")} ${sampleNoun}. Preferred ${withUnit(t.preferred)} sits at p${percentile}.`}
              className="relative h-24 @md:h-[7.5rem]"
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-0 w-px -translate-x-1/2 text-brand"
                style={{ left: `${pp}%`, background: DOTTED, transition: glide("left") }}
              />
              {distribution.map((b) => {
                const dots = b.count > 0 ? Math.max(1, Math.round(b.count / perDot)) : 0;
                const tone =
                  b.value >= t.preferred
                    ? "bg-brand"
                    : b.value >= t.fallback
                      ? "bg-foreground/40"
                      : "bg-foreground/20";
                return (
                  <span
                    key={b.value}
                    aria-hidden="true"
                    className="absolute bottom-0 flex -translate-x-1/2 flex-col-reverse gap-0.5 @md:gap-[2.5px]"
                    style={{ left: `${pct(b.value)}%` }}
                  >
                    {/* Empty slots stay faintly visible, so the chart reads as a grid. */}
                    {Array.from({ length: MAX_ROWS }, (_, k) => (
                      <span
                        key={k}
                        className={cn(
                          "block size-1 rounded-full @md:size-[5px]",
                          k < dots ? tone : "bg-foreground/[0.06]",
                          mode !== "key" &&
                            "transition-[background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
                        )}
                      />
                    ))}
                  </span>
                );
              })}
            </div>

            <div
              ref={track}
              role="group"
              aria-labelledby={labelId}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="relative mt-2 h-8 cursor-pointer touch-none select-none"
            >
              <span id={labelId} className="sr-only">
                {clause} thresholds
              </span>
              <span
                className="absolute top-1/2 left-0 h-2 -translate-y-1/2 rounded-l-full bg-foreground/[0.05]"
                style={{
                  width: `${fp}%`,
                  backgroundImage: HATCH,
                  transition: glide("width"),
                }}
              />
              <span
                className="absolute top-1/2 h-2 -translate-y-1/2 bg-foreground/20"
                style={{
                  left: `${fp}%`,
                  right: `${100 - pp}%`,
                  transition: glide("left", "right"),
                }}
              />
              <span
                className="absolute top-1/2 right-0 h-2 -translate-y-1/2 rounded-r-full bg-brand"
                style={{ left: `${pp}%`, transition: glide("left") }}
              />
              {([0, 1] as const).map((i) => {
                const v = i === 0 ? t.fallback : t.preferred;
                return (
                  <div
                    key={i}
                    role="slider"
                    tabIndex={0}
                    aria-label={`${i === 0 ? labels.fallback : labels.preferred} from`}
                    aria-valuemin={i === 0 ? min : t.fallback + gap}
                    aria-valuemax={i === 0 ? t.preferred - gap : max}
                    aria-valuenow={v}
                    aria-valuetext={withUnit(v)}
                    onKeyDown={onKeyDown(i)}
                    onBlur={() => mode === "key" && setMode("idle")}
                    className="group absolute top-0 flex h-8 w-7 -translate-x-1/2 items-center justify-center outline-none"
                    style={{ left: `${i === 0 ? fp : pp}%`, transition: glide("left") }}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute size-7 rounded-full bg-brand/0 transition-[background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-focus-visible:bg-brand/20",
                        active === i && "bg-foreground/[0.08]",
                      )}
                    />
                    <span
                      aria-hidden="true"
                      className={cn(
                        "relative h-5 w-2.5 rounded-full transition-[height] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                        i === 0 ? "bg-foreground" : "bg-brand",
                        active === i && "h-6",
                      )}
                    />
                  </div>
                );
              })}
            </div>

            <div
              aria-hidden="true"
              className="relative mt-1 h-4 font-mono text-[0.6875rem] tabular-nums"
            >
              {tickValues.map((v, i) => (
                <span
                  key={v}
                  className={cn(
                    "absolute whitespace-nowrap text-muted-foreground transition-opacity duration-150",
                    nearHandle(v) && "opacity-0",
                  )}
                  style={{ left: `${pct(v)}%`, transform: `translateX(-${pct(v)}%)` }}
                >
                  {i === tickValues.length - 1 ? withUnit(v) : fmt(v)}
                </span>
              ))}
              {([0, 1] as const).map((i) => {
                const v = i === 0 ? t.fallback : t.preferred;
                const p = pct(v);
                return (
                  <span
                    key={i}
                    className={cn(
                      "absolute font-medium whitespace-nowrap",
                      i === 0 ? "text-foreground" : "text-brand",
                    )}
                    style={{
                      left: `${p}%`,
                      transform: `translateX(-${p}%)`,
                      transition: glide("left", "transform"),
                    }}
                  >
                    {v >= max ? withUnit(v) : fmt(v)}
                  </span>
                );
              })}
            </div>
          </div>

          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <Legend
              swatch={<Swatch hatched />}
              label={labels.walkAway}
              value={`<${fmt(t.fallback)}`}
            />
            <Legend
              swatch={<Swatch className="bg-foreground/20" />}
              label={labels.fallback}
              value={`${fmt(t.fallback)}–${fmt(t.preferred)}`}
            />
            <Legend
              swatch={<Swatch className="bg-brand" />}
              label={labels.preferred}
              value={`${fmt(t.preferred)}+`}
            />
          </ul>
        </Panel>

        {settings.length > 0 && (
          <Panel className="mt-1.5 p-1.5">
            {settings.map((s) => (
              <SettingRow
                key={s.id}
                setting={s}
                value={valueOf(s)}
                thresholds={t}
                onChange={(v) => setValue(s.id, v)}
              />
            ))}
          </Panel>
        )}

        {(onApply || onDiscard) && (
          <div className="flex items-center gap-2 pt-2 pr-1 pb-0.5 pl-3">
            <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {edits ? "Not live until applied" : "Live in the playbook"}
            </p>
            {onDiscard && (
              <button
                type="button"
                disabled={!edits}
                onClick={discard}
                className={cn(
                  pressable,
                  "px-3.5 text-foreground hover:bg-foreground/[0.06]",
                )}
              >
                Discard
              </button>
            )}
            {onApply && (
              <button
                type="button"
                disabled={!edits}
                onClick={apply}
                className={cn(
                  pressable,
                  "gap-1.5 bg-brand pr-3.5 pl-3 text-brand-foreground hover:bg-brand/90",
                )}
              >
                <Check weight="bold" aria-hidden="true" className="size-3.5" />
                Apply
              </button>
            )}
          </div>
        )}
      </Shell>
    </MotionConfig>
  );
}

const pressable =
  "inline-flex h-8 shrink-0 items-center rounded-full text-[0.8125rem] font-medium outline-none transition-[background-color,scale,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:bg-foreground/[0.1] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40";

function Swatch({ hatched, className }: { hatched?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "size-2.5 shrink-0 rounded-[3px]",
        hatched && "bg-foreground/[0.05]",
        className,
      )}
      style={hatched ? { backgroundImage: HATCH } : undefined}
    />
  );
}

function Legend({
  swatch,
  label,
  value,
}: {
  swatch: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-center gap-1.5">
      {swatch}
      {label}
      <span className="font-mono text-foreground tabular-nums">{value}</span>
    </li>
  );
}

function SettingRow({
  setting: s,
  value,
  thresholds,
  onChange,
}: {
  setting: ClauseSetting;
  value: ClauseValue;
  thresholds: ClauseThresholds;
  onChange: (value: ClauseValue) => void;
}) {
  const id = useId();
  const description =
    typeof s.description === "function" ? s.description(thresholds) : s.description;
  const text = (
    <span className="min-w-0 flex-1">
      <span id={`${id}-label`} className="block text-[0.8125rem] font-medium">
        {s.label}
      </span>
      {description && (
        <span
          id={`${id}-description`}
          className="block text-xs text-pretty text-muted-foreground"
        >
          {description}
        </span>
      )}
    </span>
  );
  const row = "flex items-center gap-3 rounded-xl px-3 py-2.5";

  if (s.kind === "toggle")
    return (
      <label
        htmlFor={id}
        className={cn(
          row,
          "cursor-pointer transition-[background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] select-none hover:bg-foreground/[0.03]",
        )}
      >
        {text}
        <Switch
          id={id}
          checked={value === true}
          onCheckedChange={onChange}
          aria-describedby={description ? `${id}-description` : undefined}
        />
      </label>
    );

  return (
    <div className={row}>
      {text}
      {s.kind === "stepper" ? (
        <Stepper
          setting={s}
          value={Number(value)}
          labelId={`${id}-label`}
          onChange={onChange}
        />
      ) : (
        <Menu
          options={s.options}
          value={String(value)}
          labelId={`${id}-label`}
          onChange={onChange}
        />
      )}
    </div>
  );
}

function Stepper({
  setting,
  value,
  labelId,
  onChange,
}: {
  setting: Extract<ClauseSetting, { kind: "stepper" }>;
  value: number;
  labelId: string;
  onChange: (value: number) => void;
}) {
  const { min = -Infinity, max = Infinity, step = 1, format = String } = setting;
  const button =
    "flex size-7 items-center justify-center rounded-full text-muted-foreground outline-none transition-[background-color,color,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-foreground/[0.07] hover:text-foreground focus-visible:bg-foreground/[0.1] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-35";
  const next = (d: number) => +clamp(value + d, min, max).toFixed(6);
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className="flex shrink-0 items-center rounded-full bg-foreground/[0.06] p-0.5"
    >
      <button
        type="button"
        aria-label="Decrease"
        disabled={value <= min}
        onClick={() => onChange(next(-step))}
        className={button}
      >
        <Minus weight="bold" className="size-3" />
      </button>
      <span className="min-w-9 text-center font-mono text-[0.8125rem] tabular-nums">
        <RollingNumber value={format(value)} />
      </span>
      <button
        type="button"
        aria-label="Increase"
        disabled={value >= max}
        onClick={() => onChange(next(step))}
        className={button}
      >
        <Plus weight="bold" className="size-3" />
      </button>
    </div>
  );
}

function Menu({
  options,
  value,
  labelId,
  onChange,
}: {
  options: ClauseSelectOption[];
  value: string;
  labelId: string;
  onChange: (value: string) => void;
}) {
  const reduce = useReducedMotion();
  // Opened from the keyboard, the menu shows at once.
  const [viaKeyboard, setViaKeyboard] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <SelectPrimitive.Root value={value} onValueChange={onChange}>
      <SelectPrimitive.Trigger
        aria-labelledby={labelId}
        onPointerDown={() => setViaKeyboard(false)}
        onKeyDown={() => setViaKeyboard(true)}
        className="flex h-8 max-w-[11rem] shrink-0 items-center gap-1.5 rounded-full bg-foreground/[0.06] pr-2.5 pl-3.5 text-[0.8125rem] transition-[background-color,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] outline-none hover:bg-foreground/[0.09] focus-visible:bg-foreground/[0.12] active:scale-[0.97] data-[state=open]:bg-foreground/[0.12]"
      >
        <span className="relative min-w-0 flex-1 overflow-hidden">
          <SelectPrimitive.Value>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={value}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: enter }}
                exit={{ opacity: 0, y: -8, transition: exit }}
                className="block truncate"
              >
                {selected?.label ?? value}
              </motion.span>
            </AnimatePresence>
          </SelectPrimitive.Value>
        </span>
        <CaretUpDown
          weight="bold"
          aria-hidden="true"
          className="size-3.5 text-muted-foreground"
        />
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          side="bottom"
          align="end"
          sideOffset={6}
          collisionPadding={12}
          className="z-50 min-w-60"
        >
          <motion.div
            initial={{ opacity: 0, scale: reduce ? 1 : 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={
              viaKeyboard || reduce ? instant : { duration: 0.16, ease: EASE_OUT }
            }
            style={{ transformOrigin: "var(--radix-select-content-transform-origin)" }}
            className="rounded-2xl bg-surface-raised p-1 text-foreground"
          >
            <SelectPrimitive.Viewport>
              {options.map((o) => (
                <SelectPrimitive.Item
                  key={o.value}
                  value={o.value}
                  className="flex cursor-default items-center gap-2 rounded-xl py-1.5 pr-3 pl-2 text-[0.8125rem] outline-none select-none data-[highlighted]:bg-foreground/[0.07]"
                >
                  <span className="flex w-4 shrink-0 justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check weight="bold" className="size-3.5 text-brand" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                  {o.hint && (
                    <span className="ml-auto pl-4 text-xs whitespace-nowrap text-muted-foreground">
                      {o.hint}
                    </span>
                  )}
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </motion.div>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
