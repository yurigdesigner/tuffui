// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import {
  ArrowRight,
  Brain,
  CaretDown,
  Check,
  Eye,
  MagnifyingGlass,
  Sparkle,
  WarningCircle,
  Wrench,
  type Icon,
} from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { tintFor } from "@/components/ui/agent-avatar";
import { Kbd } from "@/components/ui/key-hint";
import { RollingNumber } from "@/components/ui/rolling-number";
import { EASE_OUT, instant } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type ModelCapability = "vision" | "tools" | "reasoning";

export type PickerModel = {
  id: string;
  name: string;
  /** Groups the list; its first letter is the monogram. */
  provider: string;
  /** Output speed in tokens per second. */
  speed: number;
  /** USD per 1M tokens. */
  price: { input: number; output: number };
  /** Context window in tokens. */
  context: number;
  capabilities?: ModelCapability[];
};

export type ModelRequirement = {
  capability: ModelCapability;
  /** Why this chat needs it, e.g. "3 screenshots in this chat". */
  reason: string;
};

export type ModelPickerProps = {
  models: PickerModel[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Controlled highlight (the row the cost preview is for). */
  highlighted?: string | null;
  onHighlightChange?: (id: string | null) => void;
  /** Pinned above the list with a short reason. */
  recommended?: { id: string; reason: string };
  /** Tokens this conversation has used so far; prices it per model. */
  usage?: { input: number; output: number };
  /** What this chat needs. Models without it are flagged. */
  requires?: ModelRequirement[];
  /** Where the panel opens. A composer at the bottom of a chat opens upward. */
  side?: "top" | "bottom";
  formatCost?: (usd: number) => string;
  /** UI strings, for translating the picker. */
  labels?: Partial<ModelPickerLabels>;
  className?: string;
};

export type ModelPickerLabels = {
  capabilities: Record<ModelCapability, string>;
  /** A model without a capability, e.g. "No vision". */
  lacks: (capability: string) => string;
  choose: string;
  /** Screen-reader name of the trigger. */
  trigger: (model: string | null) => string;
  search: string;
  searchPlaceholder: string;
  models: string;
  count: (count: number) => string;
  recommended: string;
  noMatch: (query: string) => string;
  columns: { speed: string; price: string; context: string };
  /** Column heads in a narrow panel. */
  columnsShort: { speed: string; price: string; context: string };
  thisChat: string;
  usage: (input: string, output: string) => string;
  /** One line about the highlighted model; numbers come formatted. */
  summary: (m: {
    name: string;
    speed: number;
    input: string;
    output: string;
    context: string;
  }) => string;
  pick: string;
  wouldCost: (next: string, current: string) => string;
  /** Screen-reader description of a row. */
  option: (m: {
    name: string;
    provider: string;
    reason?: string;
    speed: number;
    input: number;
    output: number;
    context: string;
    capabilities: string[];
    missing: string[];
  }) => string;
};

const defaultLabels: ModelPickerLabels = {
  capabilities: { vision: "Vision", tools: "Tools", reasoning: "Reasoning" },
  lacks: (capability) => `No ${capability.toLowerCase()}`,
  choose: "Choose a model",
  trigger: (model) => `Model: ${model ?? "none"}. Change model`,
  search: "Search models",
  searchPlaceholder: "Search models or capabilities",
  models: "Models",
  count: (count) => (count === 1 ? "1 model" : `${count} models`),
  recommended: "Recommended for this task",
  noMatch: (query) => `No models match “${query}”.`,
  columns: { speed: "Speed", price: "$ / 1M", context: "Context" },
  columnsShort: { speed: "Speed", price: "$/1M", context: "Ctx" },
  thisChat: "This chat",
  usage: (input, output) => `${input} in · ${output} out`,
  summary: (m) =>
    `${m.name} · ${m.speed} tok/s · ${m.input} / ${m.output} per 1M · ${m.context} ctx`,
  pick: "Pick a model to compare.",
  wouldCost: (next, current) => `This chat would cost ${next} instead of ${current}.`,
  option: (m) =>
    [
      m.name,
      m.provider,
      m.reason ? `recommended: ${m.reason}` : "",
      `${m.speed} tokens per second`,
      `$${m.input} input, $${m.output} output per million tokens`,
      `${m.context} context`,
      m.capabilities.join(", "),
      m.missing.length ? `missing ${m.missing.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join(", "),
};

const Labels = createContext(defaultLabels);

const capabilityIcons: Record<ModelCapability, Icon> = {
  vision: Eye,
  tools: Wrench,
  reasoning: Brain,
};
const CAPABILITIES: ModelCapability[] = ["vision", "tools", "reasoning"];
const SEGMENTS = 5;

function useControllable<T>(
  value: T | undefined,
  onChange: ((v: T) => void) | undefined,
  initial: T,
) {
  const [inner, setInner] = useState(initial);
  const set = (next: T) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };
  return [value === undefined ? inner : value, set] as const;
}

const defaultCost = (usd: number) =>
  usd > 0 && usd < 0.01 ? "<$0.01" : `$${usd.toFixed(2)}`;

const compact = (n: number) =>
  n >= 1_000_000
    ? `${+(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
      ? `${+(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}k`
      : String(n);

const money = (n: number) => `$${n < 1 ? n.toFixed(2) : +n.toFixed(2)}`;

/** Price of input and output, weighted 3:1 the way chat traffic usually is. */
const blended = (m: PickerModel) => (3 * m.price.input + m.price.output) / 4;

/** 1–5 filled segments; log scale for prices and context windows. */
function segments(value: number, min: number, max: number, log: boolean) {
  if (max <= min) return SEGMENTS;
  const f = log
    ? (Math.log(value) - Math.log(min)) / (Math.log(max) - Math.log(min))
    : (value - min) / (max - min);
  return 1 + Math.round(Math.min(Math.max(f, 0), 1) * (SEGMENTS - 1));
}

type Option = { model: PickerModel; key: string; recommended: boolean };

/**
 * Model choice from a composer pill, as a real comparison: search, models
 * grouped by provider with speed, price and context bars and capability
 * badges, a recommended pick for the task, and what this chat would have cost
 * on the highlighted model.
 */
export function ModelPicker({
  models,
  value: valueProp,
  defaultValue,
  onValueChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  highlighted: highlightedProp,
  onHighlightChange,
  recommended,
  usage,
  requires = [],
  side = "top",
  formatCost = defaultCost,
  labels: labelOverrides,
  className,
}: ModelPickerProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const reduce = useReducedMotion();
  const listId = useId();
  const [value, setValue] = useControllable(
    valueProp,
    onValueChange,
    defaultValue ?? models[0]?.id ?? "",
  );
  const [open, setOpen] = useControllable(openProp, onOpenChange, defaultOpen);
  const [highlighted, setHighlighted] = useControllable<string | null>(
    highlightedProp,
    onHighlightChange,
    null,
  );
  const [query, setQuery] = useState("");
  const [keyboard, setKeyboard] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  // Focus moves into the panel only when a person opened it.
  const userOpened = useRef(false);

  const selected = models.find((m) => m.id === value);
  const q = query.trim().toLowerCase();
  const matches = (m: PickerModel) =>
    !q ||
    m.name.toLowerCase().includes(q) ||
    m.provider.toLowerCase().includes(q) ||
    (m.capabilities ?? []).some((c) => c.startsWith(q));
  const shown = models.filter(matches);
  const rec = recommended && models.find((m) => m.id === recommended.id);
  const showRec = !!rec && matches(rec);

  const providers: { name: string; models: PickerModel[] }[] = [];
  for (const m of shown) {
    const group = providers.find((p) => p.name === m.provider);
    if (group) group.models.push(m);
    else providers.push({ name: m.provider, models: [m] });
  }
  const options: Option[] = [
    ...(showRec && rec ? [{ model: rec, key: `rec-${rec.id}`, recommended: true }] : []),
    ...providers.flatMap((p) =>
      p.models.map((m) => ({ model: m, key: m.id, recommended: false })),
    ),
  ];
  // The highlight is a model id; the recommended row wins when both show it.
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.model.id === highlighted),
  );
  const active = options.length ? options[activeIndex] : undefined;

  // Scales for the bars, across every model so filtering doesn't rescale them.
  const speeds = models.map((m) => m.speed);
  const prices = models.map(blended);
  const contexts = models.map((m) => m.context);
  const scale = {
    speed: (m: PickerModel) =>
      segments(m.speed, Math.min(...speeds), Math.max(...speeds), false),
    price: (m: PickerModel) =>
      segments(blended(m), Math.min(...prices), Math.max(...prices), true),
    context: (m: PickerModel) =>
      segments(m.context, Math.min(...contexts), Math.max(...contexts), true),
  };

  const cost = (m: PickerModel | undefined) =>
    m && usage
      ? (usage.input * m.price.input + usage.output * m.price.output) / 1_000_000
      : 0;
  const missing = (m: PickerModel) =>
    requires.filter((r) => !(m.capabilities ?? []).includes(r.capability));

  const setOpenTo = (next: boolean, byUser: boolean) => {
    userOpened.current = byUser && next;
    if (!next) setQuery("");
    setOpen(next);
    if (next && highlighted === null) setHighlighted(value || null);
  };

  const choose = (m: PickerModel) => {
    setValue(m.id);
    setOpenTo(false, true);
    trigger.current?.focus();
  };

  // Close on a press outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpenTo(false, true);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  });

  useEffect(() => {
    if (open && userOpened.current) input.current?.focus();
  }, [open]);

  // Keep the active row inside the list without scrolling the page.
  const activeKey = active?.key;
  useLayoutEffect(() => {
    const box = list.current;
    if (!open || !box || !activeKey) return;
    const row = box.querySelector<HTMLElement>(`[data-key="${activeKey}"]`);
    if (!row) return;
    // Bring a group or "Recommended" label along with the first row under it.
    const lead = row.previousElementSibling as HTMLElement | null;
    const anchor = lead?.getAttribute("aria-hidden") === "true" ? lead : row;
    const top = Math.max(0, anchor.offsetTop - 30);
    const bottom = row.offsetTop + row.offsetHeight + 6;
    if (top < box.scrollTop)
      box.scrollTo({ top, behavior: reduce || keyboard ? "auto" : "smooth" });
    else if (bottom > box.scrollTop + box.clientHeight)
      box.scrollTo({
        top: bottom - box.clientHeight,
        behavior: reduce || keyboard ? "auto" : "smooth",
      });
  }, [open, activeKey, reduce, keyboard]);

  const move = (to: number) => {
    if (!options.length) return;
    const i = (to + options.length) % options.length;
    setHighlighted(options[i].model.id);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    setKeyboard(true);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      move(activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      move(activeIndex - 1);
    } else if (event.key === "Home" && !query) {
      event.preventDefault();
      move(0);
    } else if (event.key === "End" && !query) {
      event.preventDefault();
      move(options.length - 1);
    } else if (event.key === "Enter" && active) {
      event.preventDefault();
      choose(active.model);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpenTo(false, true);
      trigger.current?.focus();
    }
  };

  const current = cost(selected);
  const next = active ? cost(active.model) : current;
  const delta = current > 0 ? (next - current) / current : 0;
  const same = !active || active.model.id === selected?.id;
  const gaps = active ? missing(active.model) : [];

  // Fit the panel inside the nearest container (the composer card), not the pill.
  const [place, setPlace] = useState<{
    left: number;
    width: number;
    origin: number;
  } | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const fit = () => {
      const el = root.current;
      if (!el) return;
      const bounds = (
        el.parentElement?.closest(".\\@container") ?? document.body
      ).getBoundingClientRect();
      const at = el.getBoundingClientRect();
      const width = Math.min(464, bounds.width - 12);
      // The panel opens from the pill's start edge: left in LTR, right in RTL.
      const rtl = getComputedStyle(el).direction === "rtl";
      const left = Math.max(
        bounds.left + 6 - at.left,
        Math.min(rtl ? at.width - width : 0, bounds.right - 6 - at.left - width),
      );
      const origin = rtl ? at.width - 24 - left : 24 - left;
      setPlace((p) =>
        p && p.left === left && p.width === width && p.origin === origin
          ? p
          : { left, width, origin },
      );
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [open]);

  const panelIn = { opacity: 1, scale: 1, y: 0 };
  const panelOut = {
    opacity: 0,
    scale: reduce ? 1 : 0.97,
    y: reduce ? 0 : side === "top" ? 6 : -6,
  };

  return (
    <Labels.Provider value={labels}>
      <MotionConfig reducedMotion="user">
        <div ref={root} className={cn("relative inline-flex", className)}>
          <button
            ref={trigger}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={open ? listId : undefined}
            aria-label={labels.trigger(selected?.name ?? null)}
            onPointerDown={() => setKeyboard(false)}
            onKeyDown={(event) => {
              if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                event.preventDefault();
                setKeyboard(true);
                setOpenTo(true, true);
              }
            }}
            onClick={(event) => {
              setKeyboard(event.detail === 0);
              setOpenTo(!open, true);
            }}
            className="inline-flex h-8 max-w-[14rem] min-w-0 items-center gap-1.5 rounded-full bg-foreground/[0.06] ps-1.5 pe-2.5 text-[0.8125rem] font-medium text-foreground transition-colors duration-150 outline-none select-none hover:bg-foreground/[0.1] focus-visible:bg-foreground/[0.14] aria-expanded:bg-foreground/[0.12]"
          >
            {selected && <Monogram provider={selected.provider} />}
            <span className="min-w-0 truncate">{selected?.name ?? labels.choose}</span>
            <CaretDown
              weight="bold"
              aria-hidden="true"
              className={cn(
                "size-3 shrink-0 text-muted-foreground transition-transform duration-200",
                open && side === "top" && "rotate-180",
              )}
            />
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                key="panel"
                initial={panelOut}
                animate={{
                  ...panelIn,
                  transition:
                    keyboard || reduce ? instant : { duration: 0.2, ease: EASE_OUT },
                }}
                exit={{
                  ...panelOut,
                  transition:
                    keyboard || reduce ? instant : { duration: 0.14, ease: EASE_OUT },
                }}
                style={{
                  transformOrigin: `${place?.origin ?? 24}px ${side === "top" ? "100%" : "0%"}`,
                  ...(place ? { left: place.left, width: place.width } : {}),
                }}
                className={cn(
                  "@container absolute left-0 z-30 flex w-[min(29rem,calc(100cqw-0.75rem))] flex-col rounded-[1.25rem] bg-surface-raised p-1.5 text-foreground",
                  side === "top" ? "bottom-full mb-2" : "top-full mt-2",
                )}
              >
                <div className="flex items-center gap-2 px-2.5 pt-1 pb-2">
                  <MagnifyingGlass
                    weight="bold"
                    aria-hidden="true"
                    className="size-3.5 shrink-0 text-muted-foreground"
                  />
                  <input
                    ref={input}
                    role="combobox"
                    aria-expanded
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={active ? `${listId}-${active.key}` : undefined}
                    aria-label={labels.search}
                    placeholder={labels.searchPlaceholder}
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setHighlighted(null);
                    }}
                    onKeyDown={onKeyDown}
                    className="h-7 min-w-0 flex-1 bg-transparent text-[0.8125rem] outline-none placeholder:text-muted-foreground"
                  />
                  <span aria-hidden="true" className="hidden items-center gap-1 @sm:flex">
                    <Kbd>↑</Kbd>
                    <Kbd>↓</Kbd>
                    <Kbd>↵</Kbd>
                  </span>
                </div>

                {/* The list fades into its own background at the bottom edge. */}
                <div className="relative">
                  <div
                    ref={list}
                    id={listId}
                    role="listbox"
                    aria-label={labels.models}
                    tabIndex={-1}
                    onKeyDown={onKeyDown}
                    onPointerMove={() => setKeyboard(false)}
                    className="relative max-h-[17.5rem] [scrollbar-width:thin] overflow-y-auto rounded-2xl bg-surface-inset px-1 pb-4"
                  >
                    {/* Column heads stay put while the list scrolls. */}
                    <div
                      aria-hidden="true"
                      className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_auto] items-end bg-surface-inset px-2 pt-2 pb-1 text-[0.625rem] text-muted-foreground"
                    >
                      <span>{labels.count(shown.length)}</span>
                      <Bars header />
                    </div>

                    {showRec && rec && (
                      <p
                        aria-hidden="true"
                        className="flex items-center gap-1.5 px-2 pt-1 pb-1 text-[0.6875rem] font-medium text-brand"
                      >
                        <Sparkle weight="fill" className="size-3" />
                        {labels.recommended}
                      </p>
                    )}
                    {showRec && rec && (
                      <Row
                        layoutId={`${listId}-hl`}
                        id={`${listId}-rec-${rec.id}`}
                        dataKey={`rec-${rec.id}`}
                        model={rec}
                        active={active?.key === `rec-${rec.id}`}
                        selected={rec.id === value}
                        keyboard={keyboard}
                        scale={scale}
                        missing={missing(rec).map((r) => r.capability)}
                        reason={recommended?.reason}
                        onHover={() => setHighlighted(rec.id)}
                        onChoose={() => choose(rec)}
                      />
                    )}

                    {providers.map((p) => (
                      <div
                        key={p.name}
                        role="group"
                        aria-label={p.name}
                        className="mt-1.5"
                      >
                        <div
                          aria-hidden="true"
                          className="flex items-center gap-1.5 px-2 pt-1.5 pb-1 text-[0.6875rem] font-medium text-muted-foreground"
                        >
                          <Monogram provider={p.name} small />
                          {p.name}
                        </div>
                        {p.models.map((m) => (
                          <Row
                            key={m.id}
                            layoutId={`${listId}-hl`}
                            id={`${listId}-${m.id}`}
                            dataKey={m.id}
                            model={m}
                            active={active?.key === m.id}
                            selected={m.id === value}
                            keyboard={keyboard}
                            scale={scale}
                            missing={missing(m).map((r) => r.capability)}
                            onHover={() => setHighlighted(m.id)}
                            onChoose={() => choose(m)}
                          />
                        ))}
                      </div>
                    ))}

                    {options.length === 0 && (
                      <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                        {labels.noMatch(query)}
                      </p>
                    )}
                  </div>
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-6 rounded-b-2xl bg-linear-to-b from-transparent to-surface-inset"
                  />
                </div>

                {usage && (
                  <div className="px-2.5 pt-2.5 pb-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-xs text-muted-foreground">
                        {labels.thisChat}
                        <span className="tabular-nums @max-xs:hidden">
                          {" "}
                          · {labels.usage(compact(usage.input), compact(usage.output))}
                        </span>
                      </p>
                      <p className="flex shrink-0 items-center gap-1.5 text-sm font-medium tabular-nums">
                        <span className={cn(!same && "text-muted-foreground")}>
                          {formatCost(current)}
                        </span>
                        <span
                          aria-hidden="true"
                          className={cn(
                            "flex items-center gap-1.5 transition-opacity duration-150",
                            same && "opacity-0",
                          )}
                        >
                          <ArrowRight
                            weight="bold"
                            className="size-3 text-muted-foreground rtl:-scale-x-100"
                          />
                          <RollingNumber
                            value={next}
                            format={formatCost}
                            className={cn(
                              "transition-colors duration-150",
                              delta < -0.005
                                ? "text-positive"
                                : delta > 0.005
                                  ? "text-warning"
                                  : "text-foreground",
                            )}
                          />
                          <span
                            dir="ltr"
                            className={cn(
                              "rounded-full px-1.5 py-px text-[0.6875rem] transition-colors duration-150",
                              delta < -0.005
                                ? "bg-positive/15 text-positive"
                                : delta > 0.005
                                  ? "bg-warning/15 text-warning"
                                  : "bg-foreground/[0.07] text-muted-foreground",
                            )}
                          >
                            {delta > 0 ? "+" : delta < 0 ? "−" : "±"}
                            {Math.abs(Math.round(delta * 100))}%
                          </span>
                        </span>
                      </p>
                    </div>
                    <p
                      aria-live="polite"
                      className={cn(
                        "mt-1 text-xs leading-snug",
                        gaps.length ? "text-warning" : "text-muted-foreground",
                      )}
                    >
                      {active ? (
                        gaps.length ? (
                          <span className="inline-flex items-center gap-1">
                            <WarningCircle
                              weight="fill"
                              aria-hidden="true"
                              className="size-3.5"
                            />
                            {labels.lacks(labels.capabilities[gaps[0].capability])}:{" "}
                            {gaps[0].reason}
                          </span>
                        ) : (
                          <span className="tabular-nums">
                            {labels.summary({
                              name: active.model.name,
                              speed: active.model.speed,
                              input: money(active.model.price.input),
                              output: money(active.model.price.output),
                              context: compact(active.model.context),
                            })}
                          </span>
                        )
                      ) : (
                        labels.pick
                      )}
                      <span className="sr-only">
                        {active && !same
                          ? ` ${labels.wouldCost(formatCost(next), formatCost(current))}`
                          : ""}
                      </span>
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </MotionConfig>
    </Labels.Provider>
  );
}

function Monogram({ provider, small = false }: { provider: string; small?: boolean }) {
  const tint = tintFor(provider);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-semibold",
        small
          ? "size-4 rounded-[5px] text-[0.5625rem]"
          : "size-5 rounded-full text-[0.625rem]",
      )}
      style={{ background: `color-mix(in oklab, ${tint} 22%, transparent)`, color: tint }}
    >
      {provider.slice(0, 1).toUpperCase()}
    </span>
  );
}

type Scale = Record<"speed" | "price" | "context", (m: PickerModel) => number>;

function Bars({
  header = false,
  model,
  scale,
  on = false,
}: {
  header?: boolean;
  model?: PickerModel;
  scale?: Scale;
  on?: boolean;
}) {
  const metrics = ["speed", "price", "context"] as const;
  const { columns: labels, columnsShort: short } = useContext(Labels);
  return (
    <span className="grid grid-cols-3 gap-2.5 @max-[24rem]:gap-1.5" aria-hidden="true">
      {metrics.map((k) =>
        header || !model || !scale ? (
          <span key={k} className="w-[2.375rem] whitespace-nowrap @max-[24rem]:w-8">
            <span className="@max-[24rem]:hidden">{labels[k]}</span>
            <span className="hidden @max-[24rem]:inline">{short[k]}</span>
          </span>
        ) : (
          <span
            key={k}
            className="flex w-[2.375rem] items-center gap-0.5 @max-[24rem]:w-8"
          >
            {Array.from({ length: SEGMENTS }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-[2px] transition-colors duration-150",
                  i < scale[k](model)
                    ? on
                      ? "bg-brand"
                      : "bg-foreground/55"
                    : "bg-foreground/[0.08]",
                )}
              />
            ))}
          </span>
        ),
      )}
    </span>
  );
}

function Row({
  layoutId,
  id,
  dataKey,
  model,
  active,
  selected,
  keyboard,
  scale,
  missing,
  reason,
  onHover,
  onChoose,
}: {
  layoutId: string;
  id: string;
  dataKey: string;
  model: PickerModel;
  active: boolean;
  selected: boolean;
  keyboard: boolean;
  scale: Scale;
  missing: ModelCapability[];
  reason?: string;
  onHover: () => void;
  onChoose: () => void;
}) {
  const labels = useContext(Labels);
  const caps = model.capabilities ?? [];
  const label = labels.option({
    name: model.name,
    provider: model.provider,
    reason,
    speed: model.speed,
    input: model.price.input,
    output: model.price.output,
    context: compact(model.context),
    capabilities: caps.map((c) => labels.capabilities[c]),
    missing: missing.map((c) => labels.capabilities[c]),
  });

  return (
    <div
      id={id}
      data-key={dataKey}
      role="option"
      aria-selected={active}
      aria-current={selected || undefined}
      aria-label={label}
      onPointerMove={() => !active && onHover()}
      onPointerDown={(event) => event.preventDefault()}
      onClick={onChoose}
      className={cn(
        "relative grid cursor-default grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-xl px-2 py-1.5",
        reason && "bg-brand/[0.07] py-2",
      )}
    >
      {active && (
        <motion.span
          layoutId={keyboard ? undefined : layoutId}
          aria-hidden="true"
          transition={{ type: "spring", duration: 0.25, bounce: 0 }}
          className={cn(
            "absolute inset-0 rounded-xl",
            reason ? "bg-brand/[0.1]" : "bg-foreground/[0.06]",
          )}
        />
      )}
      <span className="relative flex min-w-0 flex-col">
        <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
          <span
            className={cn(
              "truncate text-[0.8125rem]",
              active || selected ? "text-foreground" : "text-foreground/85",
              selected && "font-medium",
            )}
          >
            {model.name}
          </span>
          {selected && (
            <Check
              weight="bold"
              aria-hidden="true"
              className="size-3 shrink-0 text-brand"
            />
          )}
          <span className="ms-0.5 flex shrink-0 items-center gap-0.5">
            {CAPABILITIES.filter((c) => caps.includes(c) || missing.includes(c)).map(
              (c) => {
                const CapIcon = capabilityIcons[c];
                const capLabel = labels.capabilities[c];
                const lacks = missing.includes(c);
                return (
                  <span
                    key={c}
                    title={lacks ? labels.lacks(capLabel) : capLabel}
                    className={cn(
                      "relative inline-flex size-[1.125rem] items-center justify-center rounded-[5px]",
                      lacks
                        ? "bg-warning/15 text-warning"
                        : "bg-foreground/[0.06] text-muted-foreground",
                    )}
                  >
                    <CapIcon weight="fill" aria-hidden="true" className="size-2.5" />
                    {lacks && (
                      <span
                        aria-hidden="true"
                        className="absolute h-px w-3 -rotate-45 rounded-full bg-current"
                      />
                    )}
                  </span>
                );
              },
            )}
          </span>
        </span>
        {reason && (
          <span className="mt-0.5 truncate text-[0.6875rem] text-muted-foreground">
            {model.provider} · {reason}
          </span>
        )}
      </span>
      <span className="relative">
        <Bars model={model} scale={scale} on={active} />
      </span>
    </div>
  );
}
