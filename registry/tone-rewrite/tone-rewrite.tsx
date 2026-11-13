// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import {
  ArrowUp,
  CaretDown,
  Check,
  CheckCircle,
  Copy,
  FileText,
  Microphone,
  Plus,
  Sparkle,
  Stop,
  X,
  type Icon,
} from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { Select as SelectPrimitive } from "radix-ui";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Kbd, KeyCombo } from "@/components/ui/key-hint";
import { RollingNumber } from "@/components/ui/rolling-number";
import { Panel, Shell } from "@/components/ui/surface";
import { CSS_EASE_IN_OUT, EASE_OUT, enter, exit, instant } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

/**
 * A point on the tone pad. `x` runs from -1 (formal, left) to 1 (casual,
 * right), `y` from -1 (brief, top) to 1 (detailed, bottom). 0, 0 is neutral.
 */
export type ToneValue = { x: number; y: number };

export type ToneRewriteStatus = "idle" | "writing" | "done";

export type ToneRewriteAttachment = {
  name: string;
  /** Word count of the whole document, shown muted in the chip. */
  words?: number;
  /** Where the selection came from, right-aligned, e.g. "Docs". */
  origin?: string;
};

export type ToneRewriteOption = {
  value: string;
  label: string;
  /** Right-aligned in the menu, e.g. "fastest". */
  hint?: string;
};

export type ToneRewriteFollowUp = {
  id: string;
  label: string;
  /** Moves the tone handle before the rerun, e.g. `{ y: -0.3 }` for "Shorter". */
  nudge?: Partial<ToneValue>;
};

export type ToneRewriteRequest = {
  prompt: string;
  tone: ToneValue;
  /** Target length from the tone pad. */
  words: number;
  model?: string;
  length?: string;
};

export type ToneRewriteLabels = {
  formal?: string;
  casual?: string;
  brief?: string;
  detailed?: string;
};

export type ToneRewriteProps = {
  /** The selected text being rewritten, shown as a quote. */
  source: string;
  attachment?: ToneRewriteAttachment;
  /** Shows × on the attachment chip. */
  onRemoveAttachment?: () => void;
  /** Words in the original, the left side of "142 → 46". Defaults to `attachment.words`, then to the words in `source`. */
  sourceWords?: number;

  prompt?: string;
  defaultPrompt?: string;
  onPromptChange?: (prompt: string) => void;
  placeholder?: string;

  models?: ToneRewriteOption[];
  model?: string;
  defaultModel?: string;
  onModelChange?: (model: string) => void;
  lengths?: ToneRewriteOption[];
  length?: string;
  defaultLength?: string;
  onLengthChange?: (length: string) => void;

  tone?: ToneValue;
  defaultTone?: ToneValue;
  /** Called while the handle is dragged or moved with the keyboard, and on follow-ups. */
  onToneChange?: (tone: ToneValue) => void;
  /** Words at the brief and detailed ends of the pad. */
  wordRange?: [number, number];
  /** Target length for a tone. Defaults to `wordRange` along `y`, rounded to 5. */
  estimateWords?: (tone: ToneValue) => number;
  /** Text right of "Tone". Defaults to "≈ 45 words". */
  formatEstimate?: (words: number) => string;
  /** Name for a point on the formal–casual axis, e.g. "Fairly formal". */
  describeRegister?: (x: number) => string;
  labels?: ToneRewriteLabels;

  status?: ToneRewriteStatus;
  /** The rewrite as the parent streams it: bullets, or one block of text. */
  output?: string[] | string;
  /** "2 of 3" in the status row while writing. */
  progress?: { current: number; total: number };
  /** Status row label while writing. */
  writingLabel?: string;
  doneLabel?: string;

  onSend?: (request: ToneRewriteRequest) => void;
  /** Shows Stop and listens for Esc while writing. */
  onStop?: () => void;
  onReplace?: (output: string) => void;
  onInsert?: (output: string) => void;
  onCopy?: (output: string) => void;
  /** Chips under the result; each one reruns the rewrite. */
  followUps?: ToneRewriteFollowUp[];
  onFollowUp?: (followUp: ToneRewriteFollowUp, tone: ToneValue) => void;
  /** Shows the round + button. */
  onAttach?: () => void;
  /** Shows the mic button. */
  onVoice?: () => void;
  className?: string;
};

const CENTER: ToneValue = { x: 0, y: 0 };
const STEP = 0.05;
const BIG = 0.25;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const clampTone = (t: ToneValue): ToneValue => ({
  x: +clamp(t.x, -1, 1).toFixed(3),
  y: +clamp(t.y, -1, 1).toFixed(3),
});
const countWords = (text: string) => text.match(/\S+/g)?.length ?? 0;

export function defaultRegister(x: number) {
  if (x <= -0.6) return "Formal";
  if (x <= -0.2) return "Fairly formal";
  if (x < 0.2) return "Neutral";
  if (x < 0.6) return "Fairly casual";
  return "Casual";
}

/** Controlled when `value` is passed, otherwise keeps its own state. */
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
  return [value ?? inner, set] as const;
}

type Mode = "idle" | "press" | "drag" | "key";

const press =
  "transition-[background-color,color,scale,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] outline-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40";
const round = cn(
  press,
  "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
);
const quietRound = cn(
  round,
  "bg-foreground/[0.06] text-muted-foreground hover:bg-foreground/[0.1] hover:text-foreground focus-visible:bg-foreground/[0.14]",
);
const pill = cn(
  press,
  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full text-[0.8125rem] font-medium whitespace-nowrap",
);

export function ToneRewrite({
  source,
  attachment,
  onRemoveAttachment,
  sourceWords,
  prompt: promptProp,
  defaultPrompt = "",
  onPromptChange,
  placeholder = "Tell the model how to rewrite it",
  models = [],
  model: modelProp,
  defaultModel,
  onModelChange,
  lengths = [],
  length: lengthProp,
  defaultLength,
  onLengthChange,
  tone: toneProp,
  defaultTone = CENTER,
  onToneChange,
  wordRange = [20, 120],
  estimateWords,
  formatEstimate,
  describeRegister = defaultRegister,
  labels,
  status = "idle",
  output,
  progress,
  writingLabel = "Writing",
  doneLabel = "Done",
  onSend,
  onStop,
  onReplace,
  onInsert,
  onCopy,
  followUps = [],
  onFollowUp,
  onAttach,
  onVoice,
  className,
}: ToneRewriteProps) {
  const id = useId();
  const reduce = useReducedMotion();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const pad = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [dragging, setDragging] = useState(false);

  const [prompt, setPrompt] = useControllable(promptProp, onPromptChange, defaultPrompt);
  const [model, setModel] = useControllable(
    modelProp,
    onModelChange,
    defaultModel ?? models[0]?.value ?? "",
  );
  const [length, setLength] = useControllable(
    lengthProp,
    onLengthChange,
    defaultLength ?? lengths[0]?.value ?? "",
  );
  const [tone, setTone] = useControllable(toneProp, onToneChange, defaultTone);

  const text = {
    formal: labels?.formal ?? "Formal",
    casual: labels?.casual ?? "Casual",
    brief: labels?.brief ?? "Brief",
    detailed: labels?.detailed ?? "Detailed",
  };

  const estimate = estimateWords
    ? estimateWords(tone)
    : Math.round(
        (wordRange[0] + ((tone.y + 1) / 2) * (wordRange[1] - wordRange[0])) / 5,
      ) * 5;
  const register = describeRegister(tone.x);

  const writing = status === "writing";
  const done = status === "done";
  const bullets = output === undefined ? [] : Array.isArray(output) ? output : [output];
  const outputText = Array.isArray(output)
    ? output.map((b) => `• ${b}`).join("\n")
    : (output ?? "");
  const outputWords = countWords(bullets.join(" "));
  const fromWords = sourceWords ?? attachment?.words ?? countWords(source);
  const showResult = status !== "idle" || bullets.length > 0;

  // The prompt as last sent: Enter replaces until the prompt changes, then sends again.
  const [sent, setSent] = useState<string | null>(null);
  const dirty = sent === null || prompt.trim() !== sent;

  useLayoutEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [prompt]);

  const send = () => {
    if (writing || !prompt.trim()) return;
    setSent(prompt.trim());
    onSend?.({ prompt: prompt.trim(), tone, words: estimate, model, length });
  };

  const followUp = (f: ToneRewriteFollowUp) => {
    let next = tone;
    if (f.nudge) {
      next = clampTone({ x: tone.x + (f.nudge.x ?? 0), y: tone.y + (f.nudge.y ?? 0) });
      setMode("idle");
      setTone(next);
    }
    // The chips leave while the rerun writes; keep focus in the card so Esc still stops it.
    textarea.current?.focus();
    onFollowUp?.(f, next);
  };

  const onPromptKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    if (done && (e.metaKey || e.ctrlKey)) {
      if (onInsert) onInsert(outputText);
      return;
    }
    if (done && !dirty && onReplace) onReplace(outputText);
    else send();
  };

  // Copy feedback.
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(copyTimer.current), []);
  const copy = () => {
    if (onCopy) onCopy(outputText);
    else void navigator.clipboard?.writeText(outputText).catch(() => {});
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1400);
  };

  // Tone pad.

  const moveTo = (next: ToneValue) => {
    const t = clampTone(next);
    if (t.x !== tone.x || t.y !== tone.y) setTone(t);
  };
  const fromPointer = (e: React.PointerEvent) => {
    const r = pad.current!.getBoundingClientRect();
    return {
      x: clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1),
      y: clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1),
    };
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    setMode("press");
    moveTo(fromPointer(e));
    handle.current?.focus();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    if (mode !== "drag") setMode("drag");
    moveTo(fromPointer(e));
  };
  const onPointerUp = () => {
    setDragging(false);
    setMode("idle");
  };
  const onHandleKeyDown = (e: React.KeyboardEvent) => {
    const d = e.shiftKey ? BIG : STEP;
    const moves: Record<string, ToneValue> = {
      ArrowLeft: { x: tone.x - d, y: tone.y },
      ArrowRight: { x: tone.x + d, y: tone.y },
      ArrowUp: { x: tone.x, y: tone.y - d },
      ArrowDown: { x: tone.x, y: tone.y + d },
      PageUp: { x: tone.x, y: tone.y - BIG },
      PageDown: { x: tone.x, y: tone.y + BIG },
      Home: CENTER,
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    setMode("key");
    moveTo(moves[e.key]);
  };

  // Presses and outside changes (an agent, a follow-up) glide; drags and keys follow at once.
  const still = reduce || mode === "drag" || mode === "key";
  const glide = (...props: string[]) =>
    still ? "none" : props.map((p) => `${p} 260ms ${CSS_EASE_IN_OUT}`).join(", ");
  const left = `${((tone.x + 1) / 2) * 100}%`;
  const top = `${((tone.y + 1) / 2) * 100}%`;

  const estimateText = formatEstimate ? formatEstimate(estimate) : null;
  const valueText = `${register}, ${estimateText ?? `about ${estimate} words`}`;

  return (
    <MotionConfig reducedMotion="user">
      <Shell
        className={cn("max-w-xl", className)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && writing && onStop) {
            e.preventDefault();
            onStop();
          }
        }}
      >
        <Panel className="px-3 pt-3 pb-2 @sm:px-4 @sm:pt-3.5">
          {attachment && (
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 min-w-0 items-center gap-1.5 rounded-lg bg-foreground/[0.05] pl-2 text-xs">
                <FileText
                  weight="fill"
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-muted-foreground"
                />
                <span className="min-w-0 truncate font-medium">{attachment.name}</span>
                {attachment.words !== undefined && (
                  <span className="shrink-0 font-mono text-muted-foreground tabular-nums">
                    · {attachment.words.toLocaleString("en-US")} words
                  </span>
                )}
                {onRemoveAttachment ? (
                  <button
                    type="button"
                    aria-label={`Remove ${attachment.name}`}
                    onClick={onRemoveAttachment}
                    className={cn(
                      press,
                      "ml-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/[0.07] hover:text-foreground focus-visible:bg-foreground/[0.1]",
                    )}
                  >
                    <X weight="bold" className="size-3" />
                  </button>
                ) : (
                  <span className="w-1.5" />
                )}
              </span>
              {attachment.origin && (
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  from {attachment.origin}
                </span>
              )}
            </div>
          )}

          <blockquote className="flex gap-2.5">
            <span aria-hidden="true" className="w-[3px] shrink-0 rounded-full bg-brand" />
            <p className="line-clamp-4 text-[0.8125rem] leading-5 text-pretty text-muted-foreground">
              {source}
            </p>
          </blockquote>

          <label htmlFor={`${id}-prompt`} className="sr-only">
            Rewrite instructions
          </label>
          <textarea
            ref={textarea}
            id={`${id}-prompt`}
            rows={1}
            value={prompt}
            placeholder={placeholder}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={onPromptKeyDown}
            className="mt-3 block min-h-6 w-full resize-none bg-transparent text-sm leading-6 caret-brand outline-none placeholder:text-muted-foreground"
          />

          <div className="mt-2.5 flex items-center gap-1.5">
            {onAttach && (
              <button
                type="button"
                aria-label="Add context"
                title="Add context"
                onClick={onAttach}
                className={quietRound}
              >
                <Plus weight="bold" className="size-3.5" />
              </button>
            )}
            {models.length > 0 && (
              <PillSelect
                label="Model"
                icon={Sparkle}
                options={models}
                value={model}
                onChange={setModel}
              />
            )}
            {lengths.length > 0 && (
              <PillSelect
                label="Length"
                options={lengths}
                value={length}
                onChange={setLength}
              />
            )}
            <span className="flex-1" />
            {onVoice && (
              <button
                type="button"
                aria-label="Dictate"
                title="Dictate"
                onClick={onVoice}
                className={cn(quietRound, "@max-[22rem]:hidden")}
              >
                <Microphone weight="fill" className="size-3.5" />
              </button>
            )}
            <button
              type="button"
              aria-label={writing ? "Stop writing" : "Rewrite"}
              title={writing ? "Stop" : "Rewrite"}
              disabled={writing ? !onStop : !prompt.trim()}
              onClick={writing ? onStop : send}
              className={cn(
                round,
                "relative overflow-hidden bg-foreground text-background hover:bg-foreground/90",
              )}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={writing ? "stop" : "send"}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1, transition: enter }}
                  exit={{ opacity: 0, scale: 0.6, transition: exit }}
                  className="flex"
                >
                  {writing ? (
                    <Stop weight="fill" className="size-3" />
                  ) : (
                    <ArrowUp weight="bold" className="size-3.5" />
                  )}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </Panel>

        <Panel className="mt-1.5 p-3 @sm:p-4">
          <div className="mb-2.5 flex items-baseline gap-2 text-[0.8125rem]">
            <h4 id={`${id}-tone`} className="font-medium">
              Tone
            </h4>
            <span className="min-w-0 truncate text-xs text-muted-foreground">
              {register}
            </span>
            <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
              {estimateText ?? (
                <>
                  ≈ <RollingNumber value={estimate} className="text-foreground" /> words
                </>
              )}
            </span>
          </div>

          <div
            ref={pad}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="relative h-36 cursor-crosshair touch-none overflow-hidden rounded-xl bg-foreground/[0.04] select-none @md:h-44"
            style={{
              backgroundImage:
                "radial-gradient(circle, color-mix(in oklab, var(--foreground) 16%, transparent) 1px, transparent 1.25px)",
              backgroundSize: "14px 14px",
              backgroundPosition: "center",
            }}
          >
            {/* Axes. */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-foreground/[0.1]"
            />
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-foreground/[0.1]"
            />
            <AxisLabel className="top-1/2 left-2.5 -translate-y-1/2">
              {text.formal}
            </AxisLabel>
            <AxisLabel className="top-1/2 right-2.5 -translate-y-1/2">
              {text.casual}
            </AxisLabel>
            <AxisLabel className="top-2 left-1/2 -translate-x-1/2">
              {text.brief}
            </AxisLabel>
            <AxisLabel className="bottom-2 left-1/2 -translate-x-1/2">
              {text.detailed}
            </AxisLabel>

            {/* Dashed guides through the handle. */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 h-px -translate-y-1/2 text-brand/60"
              style={{
                top,
                background:
                  "linear-gradient(to right, currentColor 0 4px, transparent 4px 8px) 0 0 / 8px 1px repeat-x",
                transition: glide("top"),
              }}
            />
            <span
              aria-hidden="true"
              className="absolute inset-y-0 w-px -translate-x-1/2 text-brand/60"
              style={{
                left,
                background:
                  "linear-gradient(to bottom, currentColor 0 4px, transparent 4px 8px) 0 0 / 1px 8px repeat-y",
                transition: glide("left"),
              }}
            />

            <div
              ref={handle}
              role="slider"
              tabIndex={0}
              aria-labelledby={`${id}-tone`}
              aria-roledescription="2D slider"
              aria-describedby={`${id}-tone-help`}
              aria-orientation="vertical"
              aria-valuemin={Math.min(...wordRange)}
              aria-valuemax={Math.max(...wordRange)}
              aria-valuenow={estimate}
              aria-valuetext={valueText}
              onKeyDown={onHandleKeyDown}
              onBlur={() => mode === "key" && setMode("idle")}
              className="group absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none"
              style={{ left, top, transition: glide("left", "top") }}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute size-11 rounded-full bg-brand/15 transition-[background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-focus-visible:bg-brand/30",
                  dragging && "bg-brand/25",
                )}
              />
              <span
                aria-hidden="true"
                className={cn(
                  "relative flex size-[1.125rem] items-center justify-center rounded-full bg-white transition-[scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                  dragging && "scale-110",
                )}
              >
                <span className="size-2 rounded-full bg-brand" />
              </span>
            </div>
          </div>
          <p id={`${id}-tone-help`} className="sr-only">
            Left and right move from {text.formal.toLowerCase()} to{" "}
            {text.casual.toLowerCase()}, up and down from {text.brief.toLowerCase()} to{" "}
            {text.detailed.toLowerCase()}. Home resets to neutral.
          </p>
        </Panel>

        <AnimatePresence initial={false}>
          {showResult && (
            <motion.div
              key="result"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1, transition: enter }}
              exit={{ height: 0, opacity: 0, transition: exit }}
              className="overflow-hidden"
            >
              <Panel className="mt-1.5 p-3 @sm:p-4">
                <StatusRow
                  writing={writing}
                  done={done}
                  label={writing ? writingLabel : done ? doneLabel : "Ready"}
                  progress={progress}
                  fill={done ? 1 : Math.min(outputWords / Math.max(estimate, 1), 0.96)}
                  from={fromWords}
                  to={outputWords}
                  onStop={onStop}
                />

                <Output
                  bullets={bullets}
                  list={Array.isArray(output)}
                  writing={writing}
                />

                <AnimatePresence initial={false}>
                  {done && (onReplace || onInsert || bullets.length > 0) && (
                    <motion.div
                      key="actions"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1, transition: enter }}
                      exit={{ height: 0, opacity: 0, transition: exit }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-1.5 pt-4">
                        {onReplace && (
                          <button
                            type="button"
                            onClick={() => onReplace(outputText)}
                            className={cn(
                              pill,
                              "bg-foreground pr-1.5 pl-3.5 text-background hover:bg-foreground/90",
                            )}
                          >
                            Replace selection
                            <Kbd
                              aria-hidden="true"
                              className="bg-background/15 text-background/80"
                            >
                              ↵
                            </Kbd>
                          </button>
                        )}
                        {onInsert && (
                          <button
                            type="button"
                            onClick={() => onInsert(outputText)}
                            className={cn(
                              pill,
                              "bg-foreground/[0.07] pr-1.5 pl-3.5 text-foreground hover:bg-foreground/[0.11] focus-visible:bg-foreground/[0.14]",
                            )}
                          >
                            Insert below
                            <KeyCombo keys="mod+enter" className="@max-[24rem]:hidden" />
                          </button>
                        )}
                        <span className="flex-1" />
                        <button
                          type="button"
                          aria-label={copied ? "Copied" : "Copy rewrite"}
                          title="Copy"
                          onClick={copy}
                          className={quietRound}
                        >
                          <AnimatePresence mode="popLayout" initial={false}>
                            <motion.span
                              key={copied ? "done" : "copy"}
                              initial={{ opacity: 0, scale: 0.6 }}
                              animate={{ opacity: 1, scale: 1, transition: enter }}
                              exit={{ opacity: 0, scale: 0.6, transition: exit }}
                              className="flex"
                            >
                              {copied ? (
                                <Check weight="bold" className="size-3.5 text-brand" />
                              ) : (
                                <Copy weight="fill" className="size-3.5" />
                              )}
                            </motion.span>
                          </AnimatePresence>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {done && followUps.length > 0 && (
            <motion.div
              key="then"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1, transition: enter }}
              exit={{ height: 0, opacity: 0, transition: exit }}
              className="overflow-hidden"
            >
              <div
                role="group"
                aria-label="Follow-ups"
                className="flex flex-wrap items-center gap-1.5 px-2 pt-2.5 pb-1"
              >
                <span className="mr-1 text-xs text-muted-foreground">Then</span>
                {followUps.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => followUp(f)}
                    className={cn(
                      press,
                      "inline-flex h-7 items-center gap-1.5 rounded-full bg-foreground/[0.06] pr-3 pl-2.5 text-xs font-medium hover:bg-foreground/[0.1] focus-visible:bg-foreground/[0.14]",
                    )}
                  >
                    <Sparkle
                      weight="fill"
                      aria-hidden="true"
                      className="size-3 text-brand"
                    />
                    {f.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p role="status" aria-live="polite" className="sr-only">
          {writing
            ? `${writingLabel}…`
            : done
              ? `Rewrite ready, ${outputWords} words`
              : ""}
        </p>
      </Shell>
    </MotionConfig>
  );
}

function AxisLabel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute text-[0.6875rem] text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

function StatusRow({
  writing,
  done,
  label,
  progress,
  fill,
  from,
  to,
  onStop,
}: {
  writing: boolean;
  done: boolean;
  label: string;
  progress?: { current: number; total: number };
  fill: number;
  from: number;
  to: number;
  onStop?: () => void;
}) {
  return (
    <div className="flex h-7 items-center gap-2.5 text-xs">
      <span className="flex shrink-0 items-center gap-1.5 font-medium">
        {done ? (
          <CheckCircle weight="fill" aria-hidden="true" className="size-3.5 text-brand" />
        ) : (
          <motion.span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-brand"
            animate={writing ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
            transition={
              writing ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : instant
            }
          />
        )}
        {label}
      </span>
      {progress && (
        <span className="shrink-0 font-mono text-muted-foreground tabular-nums">
          <RollingNumber value={progress.current} className="text-foreground" /> of{" "}
          {progress.total}
        </span>
      )}
      <span
        aria-hidden="true"
        className="relative h-1 w-10 shrink-0 overflow-hidden rounded-full bg-foreground/[0.1] @sm:w-14"
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-brand transition-[width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ width: `${fill * 100}%` }}
        />
      </span>
      <span className="min-w-0 truncate font-mono text-muted-foreground tabular-nums">
        {from.toLocaleString("en-US")} →{" "}
        <RollingNumber value={to} className="text-foreground" />
      </span>
      <span className="flex-1" />
      <AnimatePresence initial={false}>
        {writing && onStop && (
          <motion.button
            key="stop"
            type="button"
            onClick={onStop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: enter }}
            exit={{ opacity: 0, transition: exit }}
            className={cn(
              pill,
              "h-7 gap-1.5 pr-1 pl-2.5 text-xs text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground focus-visible:bg-foreground/[0.1]",
            )}
          >
            Stop
            <Kbd aria-hidden="true">esc</Kbd>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function Output({
  bullets,
  list,
  writing,
}: {
  bullets: string[];
  list: boolean;
  writing: boolean;
}) {
  if (!bullets.length) return null;
  const last = bullets.length - 1;
  const caret = (
    <motion.span
      aria-hidden="true"
      className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.18em] rounded-full bg-brand"
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{
        duration: 1,
        repeat: Infinity,
        times: [0, 0.5, 0.5, 1],
        ease: "linear",
      }}
    />
  );
  if (!list)
    return (
      <p className="mt-3 text-sm leading-6 text-pretty whitespace-pre-line">
        <Words text={bullets[0]} />
        {writing && caret}
      </p>
    );
  return (
    <ul className="mt-3 space-y-2">
      <AnimatePresence initial={false}>
        {bullets.map((b, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: enter }}
            exit={{ opacity: 0, transition: exit }}
            className="flex gap-2.5 text-sm leading-6 text-pretty"
          >
            <span
              aria-hidden="true"
              className="mt-[0.6875rem] size-1.5 shrink-0 rounded-full bg-foreground/35"
            />
            <span className="min-w-0">
              <Words text={b} />
              {writing && i === last && caret}
            </span>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

/** Each streamed word fades in as it arrives; words already there stay put. */
function Words({ text }: { text: string }) {
  const words = text.match(/\S+\s*/g) ?? [];
  return (
    <AnimatePresence initial={false}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.24, ease: EASE_OUT } }}
          className="whitespace-pre-wrap"
        >
          {w}
        </motion.span>
      ))}
    </AnimatePresence>
  );
}

function PillSelect({
  label,
  icon: IconComponent,
  options,
  value,
  onChange,
}: {
  label: string;
  icon?: Icon;
  options: ToneRewriteOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const reduce = useReducedMotion();
  // Opened from the keyboard, the menu shows at once.
  const [viaKeyboard, setViaKeyboard] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <SelectPrimitive.Root value={value} onValueChange={onChange}>
      <SelectPrimitive.Trigger
        aria-label={`${label}: ${selected?.label ?? value}`}
        onPointerDown={() => setViaKeyboard(false)}
        onKeyDown={() => setViaKeyboard(true)}
        className={cn(
          pill,
          "max-w-[10rem] min-w-0 shrink bg-foreground/[0.06] pr-2.5 text-foreground hover:bg-foreground/[0.1] focus-visible:bg-foreground/[0.14] data-[state=open]:bg-foreground/[0.12]",
          IconComponent ? "pl-2.5" : "pl-3",
        )}
      >
        {IconComponent && (
          <IconComponent
            weight="fill"
            aria-hidden="true"
            className="size-3.5 shrink-0 text-brand"
          />
        )}
        <span className="min-w-0 truncate">
          <SelectPrimitive.Value>{selected?.label ?? value}</SelectPrimitive.Value>
        </span>
        <CaretDown
          weight="bold"
          aria-hidden="true"
          className="size-3 shrink-0 text-muted-foreground"
        />
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-50 min-w-52"
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
