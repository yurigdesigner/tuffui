// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import {
  CaretDown,
  Check,
  HandPalm,
  Microphone,
  MicrophoneSlash,
  Pause,
  PhoneDisconnect,
  Play,
  UserSound,
  Waveform,
} from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { Select as SelectPrimitive } from "radix-ui";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/action-button";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { Inset, Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { EASE_OUT, instant } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

/** Who has the floor right now. */
export type VoiceActivity = "connecting" | "listening" | "user" | "thinking" | "agent";

export type VoiceTurn = {
  id: string;
  speaker: "user" | "agent";
  /** The whole line. Only the first `spoken` words are shown. */
  text: string;
  /**
   * Words heard so far. While set, the line is live: words appear as the count
   * grows and the newest one is highlighted. Omit once the line is finished.
   */
  spoken?: number;
  /** The user talked over this agent line: it ends where it was cut, with a mark. */
  interrupted?: boolean;
};

export type VoiceOption = {
  value: string;
  label: string;
  /** Short description after the name, e.g. "warm". */
  hint?: string;
};

export type VoiceSessionProps = {
  /** Who is speaking. Sets the look of the level bars and the status pill. */
  activity: VoiceActivity;
  /**
   * Loudness of whoever is speaking, 0–1, read once per animation frame. Wire it
   * to an `AnalyserNode` on the mic or the playback. Without it the bars move at
   * a steady half level.
   */
  getLevel?: () => number;
  turns: VoiceTurn[];
  /** Shown on agent lines, in the legend and in the status pill. */
  agentName?: string;
  title?: string;
  subtitle?: string;
  /** Start of the call. The timer counts up from here every second. */
  startedAt?: number | Date | null;
  muted?: boolean;
  defaultMuted?: boolean;
  onMutedChange?: (muted: boolean) => void;
  held?: boolean;
  defaultHeld?: boolean;
  onHeldChange?: (held: boolean) => void;
  /** Voices for the selector. Empty hides it. */
  voices?: VoiceOption[];
  voice?: string;
  defaultVoice?: string;
  onVoiceChange?: (voice: string) => void;
  onEnd?: () => void;
  /** UI strings, for translating. */
  labels?: Partial<VoiceSessionLabels>;
  className?: string;
};

export type VoiceSessionLabels = {
  /** The user, on transcript lines, in the legend and in the status pill. */
  you: string;
  thinking: string;
  listening: string;
  connecting: string;
  muted: string;
  onHold: string;
  /** Status pill while the agent talks. */
  speaking: (agentName: string) => string;
  /** Default subtitle suffix for the chosen voice. */
  voice: (voiceLabel: string) => string;
  /** Screen-reader name of the voice selector. */
  voicePicker: (voiceLabel: string) => string;
  callTime: (time: string) => string;
  emptyTranscript: string;
  interrupted: string;
  /** Added to a finished line read to screen readers when it was cut off. */
  interruptedNote: string;
  mute: string;
  unmute: string;
  hold: string;
  resume: string;
  end: string;
};

const defaultLabels: VoiceSessionLabels = {
  you: "You",
  thinking: "Thinking",
  listening: "Listening",
  connecting: "Connecting",
  muted: "Muted",
  onHold: "On hold",
  speaking: (agentName) => `${agentName} speaking`,
  voice: (voiceLabel) => `${voiceLabel} voice`,
  voicePicker: (voiceLabel) => `Voice: ${voiceLabel}`,
  callTime: (time) => `Call time ${time}`,
  emptyTranscript: "The transcript shows up here as you talk.",
  interrupted: "Interrupted",
  interruptedNote: " (interrupted)",
  mute: "Mute",
  unmute: "Unmute",
  hold: "Hold",
  resume: "Resume",
  end: "End",
};

const Labels = createContext(defaultLabels);

type Mode = "idle" | "muted" | "user" | "agent" | "thinking" | "hold";

/** Dots per side of the center line, and spacing in px. */
const HALF = 5;
const ROW = 8;
const COL = 10;
const DOT = 4;
const HEIGHT = HALF * 2 * ROW + DOT * 2;
const CY = HEIGHT / 2;

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

const pad = (n: number) => String(n).padStart(2, "0");
function clock(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Seconds since `startedAt`, ticking once a second. 0 until mounted, so SSR matches. */
function useElapsed(startedAt: number | Date | null | undefined) {
  const start = startedAt == null ? null : +startedAt;
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (start === null) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [start]);
  if (start === null || now === null) return 0;
  return Math.max(0, Math.floor((now - start) / 1000));
}

const words = (text: string) => text.split(/\s+/).filter(Boolean);

/**
 * Voice mode of a chat with an agent: level bars drawn as dot columns that
 * change look with who has the floor, a live transcript that fills word by
 * word, barge-in marks, and the call controls.
 */
export function VoiceSession({
  activity,
  getLevel,
  turns,
  agentName = "Agent",
  title = "Voice",
  subtitle,
  startedAt,
  muted: mutedProp,
  defaultMuted = false,
  onMutedChange,
  held: heldProp,
  defaultHeld = false,
  onHeldChange,
  voices = [],
  voice: voiceProp,
  defaultVoice,
  onVoiceChange,
  onEnd,
  labels: labelOverrides,
  className,
}: VoiceSessionProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const reduce = useReducedMotion();
  const [muted, setMuted] = useControllable(mutedProp, onMutedChange, defaultMuted);
  const [held, setHeld] = useControllable(heldProp, onHeldChange, defaultHeld);
  const [voice, setVoice] = useControllable(
    voiceProp,
    onVoiceChange,
    defaultVoice ?? voices[0]?.value ?? "",
  );
  const elapsed = useElapsed(startedAt);
  const currentVoice = voices.find((v) => v.value === voice);

  const mode: Mode = held
    ? "hold"
    : activity === "agent"
      ? "agent"
      : activity === "thinking"
        ? "thinking"
        : muted
          ? "muted"
          : activity === "user"
            ? "user"
            : "idle";

  const status: { label: string; tone: StatusTone } = held
    ? { label: labels.onHold, tone: "warning" }
    : activity === "connecting"
      ? { label: labels.connecting, tone: "neutral" }
      : activity === "user"
        ? { label: muted ? labels.muted : labels.you, tone: muted ? "warning" : "brand" }
        : activity === "thinking"
          ? { label: labels.thinking, tone: "neutral" }
          : activity === "agent"
            ? { label: labels.speaking(agentName), tone: "neutral" }
            : {
                label: muted ? labels.muted : labels.listening,
                tone: muted ? "warning" : "positive",
              };

  // Keep the newest line in view unless the reader scrolled up.
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const spokenKey = turns.map((t) => `${t.id}:${t.spoken ?? "-"}`).join(",");
  useEffect(() => {
    const el = scroller.current;
    if (!el || !stick.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [spokenKey, reduce]);

  // Screen readers hear finished lines, not every word.
  const lastDone = [...turns].reverse().find((t) => t.spoken === undefined);
  const announce = lastDone
    ? `${lastDone.speaker === "user" ? labels.you : agentName}: ${lastDone.text}${lastDone.interrupted ? labels.interruptedNote : ""}`
    : "";

  return (
    <Labels.Provider value={labels}>
      <MotionConfig reducedMotion="user">
        <Shell className={cn("max-w-xl", className)}>
          <ShellHeader
            icon={Waveform}
            title={title}
            subtitle={
              subtitle ??
              `${agentName}${currentVoice ? ` · ${labels.voice(currentVoice.label)}` : ""}`
            }
            aside={
              <>
                <StatusPill tone={status.tone} size="sm" aria-live="polite">
                  {status.label}
                </StatusPill>
                {/* The call timer reads left to right in every language, like media time. */}
                <span
                  dir="ltr"
                  className="w-10 text-right font-mono text-xs text-muted-foreground tabular-nums"
                  aria-label={labels.callTime(clock(elapsed))}
                >
                  {clock(elapsed)}
                </span>
              </>
            }
          />
          <Panel className="p-4 @max-sm:p-3">
            <Levels mode={mode} getLevel={getLevel} />
            <ul
              aria-hidden="true"
              className="mt-2.5 flex items-center gap-4 text-xs text-muted-foreground"
            >
              <Legend dot="bg-brand" on={mode === "user"}>
                {labels.you}
              </Legend>
              <Legend dot="bg-foreground" on={mode === "agent"}>
                {agentName}
              </Legend>
              <Legend dot="bg-foreground/45" on={mode === "thinking"}>
                {labels.thinking}
              </Legend>
            </ul>

            <Inset className="relative mt-4">
              <div
                ref={scroller}
                onScroll={(event) => {
                  const el = event.currentTarget;
                  stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
                }}
                className="flex h-[12rem] [scrollbar-width:none] flex-col overflow-y-auto [mask-image:linear-gradient(transparent,black_1.5rem)] px-3.5 py-3"
              >
                <ol className="mt-auto flex flex-col gap-3 pt-2">
                  {turns.map((turn) => (
                    <Line key={turn.id} turn={turn} agentName={agentName} />
                  ))}
                </ol>
                {turns.length === 0 && (
                  <p className="m-auto text-center text-xs text-muted-foreground">
                    {labels.emptyTranscript}
                  </p>
                )}
              </div>
            </Inset>
            <p role="status" className="sr-only">
              {announce}
            </p>
          </Panel>

          <div className="flex items-center gap-1.5 px-1.5 pt-1.5 pb-0.5">
            <Button
              icon={muted ? MicrophoneSlash : Microphone}
              aria-pressed={muted}
              aria-label={muted ? labels.unmute : labels.mute}
              onClick={() => setMuted(!muted)}
              className={cn(
                "@max-sm:w-8 @max-sm:px-0",
                muted &&
                  "bg-warning/15 bg-none text-warning hover:bg-warning/25 hover:bg-none",
              )}
            >
              <span className="@max-sm:hidden">
                {muted ? labels.unmute : labels.mute}
              </span>
            </Button>
            <Button
              icon={held ? Play : Pause}
              aria-pressed={held}
              aria-label={held ? labels.resume : labels.hold}
              onClick={() => setHeld(!held)}
              className="@max-sm:w-8 @max-sm:px-0"
            >
              <span className="@max-sm:hidden">{held ? labels.resume : labels.hold}</span>
            </Button>
            {voices.length > 0 && (
              <VoiceSelect options={voices} value={voice} onChange={setVoice} />
            )}
            <Button
              variant="danger"
              icon={PhoneDisconnect}
              onClick={onEnd}
              className="ms-auto"
            >
              {labels.end}
            </Button>
          </div>
        </Shell>
      </MotionConfig>
    </Labels.Provider>
  );
}

function Legend({
  dot,
  on,
  children,
}: {
  dot: string;
  on: boolean;
  children: React.ReactNode;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-1.5 transition-colors duration-200",
        on && "text-foreground",
      )}
    >
      <span className={cn("size-1.5 rounded-full", dot)} />
      {children}
    </li>
  );
}

function Line({ turn, agentName }: { turn: VoiceTurn; agentName: string }) {
  const all = words(turn.text);
  const live = turn.spoken !== undefined;
  const count = live ? Math.min(Math.max(turn.spoken ?? 0, 0), all.length) : all.length;
  const shown = all.slice(0, count);
  const user = turn.speaker === "user";
  const cut = !!turn.interrupted;
  const labels = useContext(Labels);

  return (
    <motion.li
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-3 @max-sm:grid-cols-1 @max-sm:gap-y-0.5"
    >
      <span
        className={cn(
          "pt-px text-xs font-medium",
          user ? "text-brand" : "text-muted-foreground",
        )}
      >
        {user ? labels.you : agentName}
      </span>
      <p
        dir="auto"
        className={cn(
          "text-sm leading-relaxed",
          user ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {shown.map((word, i) => {
          const current = live && !cut && i === shown.length - 1;
          const last = cut && i === shown.length - 1;
          return (
            <span key={i}>
              <motion.span
                initial={live ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.18, ease: EASE_OUT }}
                className={cn(
                  "transition-colors duration-200",
                  current && "text-brand",
                  last &&
                    "[mask-image:linear-gradient(to_right,black_35%,transparent_105%)] rtl:[mask-image:linear-gradient(to_left,black_35%,transparent_105%)]",
                )}
              >
                {word}
              </motion.span>
              {i < shown.length - 1 && " "}
            </span>
          );
        })}
        {live && count === 0 && (
          <span className="text-muted-foreground" aria-hidden="true">
            …
          </span>
        )}
        <AnimatePresence>
          {cut && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="ms-1.5 inline-flex translate-y-[-1px] align-middle"
            >
              <StatusPill tone="warning" size="sm" icon={HandPalm}>
                {labels.interrupted}
              </StatusPill>
            </motion.span>
          )}
        </AnimatePresence>
      </p>
    </motion.li>
  );
}

/** Stable pseudo-random 0–1 per column, so server and client agree. */
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const modeStroke: Record<Mode, string> = {
  user: "stroke-brand",
  agent: "stroke-foreground",
  thinking: "stroke-foreground/60",
  idle: "stroke-foreground/35",
  muted: "stroke-foreground/20",
  hold: "stroke-foreground/20",
};

/**
 * Columns of dots mirrored around a center line. The user's voice scrolls in
 * from the right in the brand color; the agent's is a centered spectrum in the
 * foreground color; thinking is a small hump sweeping along the line.
 */
function Levels({ mode, getLevel }: { mode: Mode; getLevel?: () => number }) {
  const reduce = useReducedMotion();
  const maskId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const lines = useRef<(SVGLineElement | null)[]>([]);
  const [width, setWidth] = useState<number | null>(null);
  const modeRef = useRef(mode);
  const levelRef = useRef(getLevel);
  useLayoutEffect(() => {
    modeRef.current = mode;
    levelRef.current = getLevel;
  });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const cols = width === null ? 0 : Math.max(12, Math.floor(width / COL));
  const x0 = width === null ? 0 : (width - cols * COL) / 2 + COL / 2;

  useEffect(() => {
    if (!cols) return;
    const shown = new Int8Array(cols).fill(-1);
    const draw = (c: number, n: number) => {
      if (shown[c] === n) return;
      shown[c] = n;
      const line = lines.current[c];
      line?.setAttribute("y1", String(CY - n * ROW));
      line?.setAttribute("y2", String(CY + n * ROW + 0.5));
    };
    // Centered spectrum shape for the agent: tallest in the middle.
    const env = (c: number) => {
      const d = (c + 0.5) / cols - 0.5;
      return 0.06 + 0.94 * Math.exp(-(d * d) / 0.05);
    };

    if (reduce) {
      // A still frame per mode instead of motion.
      for (let c = 0; c < cols; c++) {
        const m = modeRef.current;
        const h =
          m === "agent" ? env(c) * 0.7 : m === "user" ? (0.25 + 0.5 * hash(c)) * 0.8 : 0;
        draw(c, Math.round(h * HALF));
      }
      return;
    }

    const shownH = new Float32Array(cols);
    const history = new Float32Array(cols);
    let level = 0;
    let lastPush = 0;
    let frame = 0;
    let seed = 1;
    const tick = (t: number) => {
      const m = modeRef.current;
      const raw = levelRef.current ? levelRef.current() : 0.5;
      const target = m === "user" || m === "agent" || m === "idle" ? raw : 0;
      level +=
        (Math.min(Math.max(target, 0), 1) - level) * (target > level ? 0.45 : 0.12);

      // Scrolling history for the user's voice and the open mic.
      if (t - lastPush > 55) {
        lastPush = t;
        history.copyWithin(0, 1);
        seed++;
        const grain = 0.55 + 0.45 * hash(seed);
        history[cols - 1] =
          m === "user" ? level * grain : m === "idle" ? level * grain * 0.35 : 0;
      }

      for (let c = 0; c < cols; c++) {
        let h = 0;
        if (m === "user" || m === "idle") h = history[c];
        else if (m === "agent") {
          const speed = 0.004 + 0.006 * hash(c);
          const wobble = 0.45 + 0.55 * Math.abs(Math.sin(t * speed + hash(c + 99) * 6));
          h = env(c) * level * wobble * 1.6;
        } else if (m === "thinking") {
          const span = cols + 10;
          const pos = ((t / 1500) % 1) * span - 5;
          const d = Math.abs(c - pos);
          h = Math.max(0, 1 - d / 3.2) * 0.42;
        }
        const ease = m === "user" || m === "idle" ? 0.6 : 0.3;
        shownH[c] += (h - shownH[c]) * ease;
        draw(c, Math.min(HALF, Math.round(shownH[c] * HALF)));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [cols, reduce]);

  return (
    // Like other media, the level strip runs left to right in every language.
    <div
      ref={ref}
      dir="ltr"
      aria-hidden="true"
      className="w-full"
      style={{ height: HEIGHT }}
    >
      {width !== null && (
        <svg width={width} height={HEIGHT} className="block">
          <defs>
            <linearGradient
              id={`${maskId}-g`}
              x1="0"
              y1="0"
              x2="0"
              y2={HEIGHT}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="white" stopOpacity="0.35" />
              <stop offset="0.5" stopColor="white" stopOpacity="1" />
              <stop offset="1" stopColor="white" stopOpacity="0.35" />
            </linearGradient>
            <mask
              id={maskId}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width={width}
              height={HEIGHT}
            >
              <rect width={width} height={HEIGHT} fill={`url(#${maskId}-g)`} />
            </mask>
          </defs>
          {/* Empty slots keep the scale readable when it's quiet. */}
          <g
            strokeLinecap="round"
            strokeDasharray={`0 ${ROW}`}
            strokeWidth={DOT - 1.5}
            className="stroke-foreground/[0.08]"
          >
            {Array.from({ length: cols }, (_, c) => (
              <line
                key={c}
                x1={x0 + c * COL}
                x2={x0 + c * COL}
                y1={CY - HALF * ROW}
                y2={CY + HALF * ROW + 0.5}
              />
            ))}
          </g>
          <g
            mask={`url(#${maskId})`}
            strokeLinecap="round"
            strokeDasharray={`0 ${ROW}`}
            strokeWidth={DOT}
            className={cn("transition-[stroke] duration-200", modeStroke[mode])}
          >
            {Array.from({ length: cols }, (_, c) => (
              <line
                key={c}
                ref={(el) => {
                  lines.current[c] = el;
                }}
                x1={x0 + c * COL}
                x2={x0 + c * COL}
                y1={CY}
                y2={CY + 0.5}
              />
            ))}
          </g>
        </svg>
      )}
    </div>
  );
}

function VoiceSelect({
  options,
  value,
  onChange,
}: {
  options: VoiceOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const reduce = useReducedMotion();
  // Opened from the keyboard, the menu shows at once.
  const [viaKeyboard, setViaKeyboard] = useState(false);
  const selected = options.find((o) => o.value === value);
  const labels = useContext(Labels);
  return (
    <SelectPrimitive.Root value={value} onValueChange={onChange}>
      <SelectPrimitive.Trigger
        aria-label={labels.voicePicker(selected?.label ?? value)}
        onPointerDown={() => setViaKeyboard(false)}
        onKeyDown={() => setViaKeyboard(true)}
        className="inline-flex h-8 min-w-0 shrink items-center gap-1.5 rounded-full bg-foreground/[0.06] pr-2.5 pl-2.5 text-[0.8125rem] font-medium text-foreground transition-colors duration-150 outline-none select-none hover:bg-foreground/[0.1] focus-visible:bg-foreground/[0.14] data-[state=open]:bg-foreground/[0.12]"
      >
        <UserSound
          weight="fill"
          aria-hidden="true"
          className="size-3.5 shrink-0 text-brand"
        />
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
          side="top"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-50 min-w-48"
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
                  className="flex cursor-default items-center gap-2 rounded-xl py-1.5 ps-2 pe-3 text-[0.8125rem] outline-none select-none data-[highlighted]:bg-foreground/[0.07]"
                >
                  <span className="flex w-4 shrink-0 justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check weight="bold" className="size-3.5 text-brand" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                  {o.hint && (
                    <span className="ms-auto ps-4 text-xs whitespace-nowrap text-muted-foreground">
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
