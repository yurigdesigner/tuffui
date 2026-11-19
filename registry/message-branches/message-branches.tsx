// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import {
  ArrowCounterClockwise,
  CaretLeft,
  CaretRight,
  GitBranch,
  PencilSimple,
} from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { IconButton } from "@/components/ui/action-button";
import { Inset, Panel, Shell } from "@/components/ui/surface";
import { enter, exit, spring as morph } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type BranchKind = "original" | "regenerated" | "edited";

export type MessageVersion = {
  id: string;
  kind: BranchKind;
  content: ReactNode;
  /** Overrides the default label ("Original", "Regenerated", "Edited prompt"). */
  label?: string;
  /** Secondary text after the label, such as the model that wrote it. */
  meta?: string;
  /** For `edited` versions: the prompt the user sent instead. */
  prompt?: string;
  /** Turns that followed this version, drawn as extra dots in the map. */
  turnsAfter?: number;
};

export type MessageBranchesProps = {
  /** `turnsBefore` is how many turns precede the fork, drawn as dots in the map. */
  data: { versions: MessageVersion[]; turnsBefore?: number };
  /** Controlled version index. */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number, version: MessageVersion) => void;
  /** Shows a regenerate button next to the switcher. */
  onRegenerate?: () => void;
  /** `inline` puts a ‹ 2 / 3 › switcher under the message; `map` draws the branches. */
  variant?: "inline" | "map";
  /** UI strings, for translating. */
  labels?: Partial<MessageBranchesLabels>;
  className?: string;
};

export type MessageBranchesLabels = {
  /** Default version labels by kind. */
  kinds: Record<BranchKind, string>;
  /** Screen-reader prefix before an edited prompt. */
  editedPrompt: string;
  regenerate: string;
  /** Screen-reader name of the whole block. */
  region: string;
  switchVersion: string;
  previous: string;
  next: string;
  branches: string;
  /** Announced after a switch. */
  announce: (current: number, total: number, label: string) => string;
};

const defaultLabels: MessageBranchesLabels = {
  kinds: { original: "Original", regenerated: "Regenerated", edited: "Edited prompt" },
  editedPrompt: "Edited prompt: ",
  regenerate: "Regenerate response",
  region: "Response versions",
  switchVersion: "Switch version",
  previous: "Previous version",
  next: "Next version",
  branches: "Branches",
  announce: (current, total, label) => `Version ${current} of ${total}, ${label}`,
};

const Labels = createContext(defaultLabels);

const labelOf = (v: MessageVersion, labels: MessageBranchesLabels) =>
  v.label ?? labels.kinds[v.kind];

/** Left and right arrows swap meaning under `dir="rtl"`. */
const arrowStep = (key: string, rtl: boolean) =>
  ({
    ArrowLeft: rtl ? 1 : -1,
    ArrowUp: -1,
    ArrowRight: rtl ? -1 : 1,
    ArrowDown: 1,
  })[key];
// Arrow buttons inside the switcher track: smaller and on the foreground.
const step = "size-6 text-foreground hover:bg-surface-raised disabled:opacity-35";

export function MessageBranches({
  data,
  index,
  defaultIndex,
  onIndexChange,
  onRegenerate,
  variant = "inline",
  labels: labelOverrides,
  className,
}: MessageBranchesProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const root = useRef<HTMLElement>(null);
  const [rtl, setRtl] = useState(false);
  useLayoutEffect(() => {
    if (root.current) setRtl(getComputedStyle(root.current).direction === "rtl");
  }, []);
  const { versions, turnsBefore = 2 } = data;
  const [own, setOwn] = useState(defaultIndex ?? versions.length - 1);
  const current = Math.min(Math.max(index ?? own, 0), Math.max(versions.length - 1, 0));
  const version = versions[current];
  // Direction of the last switch (+1 newer, -1 older) and whether it came from keys.
  const [move, setMove] = useState({ dir: 1, instant: false });
  const [shown, setShown] = useState(current);
  if (shown !== current) {
    // Index changed from outside (e.g. a new version arrived): slide in its direction.
    setShown(current);
    setMove({ dir: current > shown ? 1 : -1, instant: false });
  }

  const go = (next: number, instant: boolean) => {
    if (next < 0 || next >= versions.length || next === current) return;
    setMove({ dir: next > current ? 1 : -1, instant });
    setShown(next);
    setOwn(next);
    onIndexChange?.(next, versions[next]);
  };
  const fromKeys = (e: MouseEvent) => e.detail === 0;

  const onKeyDown = (e: KeyboardEvent) => {
    const step = arrowStep(e.key, rtl);
    if (step === undefined) return;
    e.preventDefault();
    go(current + step, true);
  };

  if (!version) return null;
  // Newer versions enter from the end side: right in LTR, left in RTL.
  const d = move.dir * (rtl ? -1 : 1);
  const t = move.instant ? { duration: 0 } : enter;

  const body = (
    <motion.div
      layout="size"
      transition={move.instant ? { duration: 0 } : morph}
      className="relative overflow-hidden"
    >
      <AnimatePresence mode="popLayout" initial={false} custom={d}>
        <motion.div
          key={version.id}
          initial={{ opacity: 0, x: d * 24 }}
          animate={{ opacity: 1, x: 0, transition: t }}
          exit={{
            opacity: 0,
            x: d * -24,
            transition: move.instant ? { duration: 0 } : exit,
          }}
        >
          {version.kind === "edited" && version.prompt && (
            <Inset className="mb-2.5 flex items-start gap-2 px-3 py-2 text-[0.8125rem] text-muted-foreground">
              <PencilSimple
                weight="fill"
                className="mt-0.5 size-3.5 shrink-0"
                aria-hidden="true"
              />
              <span>
                <span className="sr-only">{labels.editedPrompt}</span>
                <bdi dir="auto">{version.prompt}</bdi>
              </span>
            </Inset>
          )}
          <div dir="auto" className="text-[0.9375rem] leading-relaxed">
            {version.content}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );

  const caption = (
    <span className="min-w-0 truncate text-[0.8125rem] text-muted-foreground">
      <span className="text-foreground">{labelOf(version, labels)}</span>
      {version.meta && ` · ${version.meta}`}
    </span>
  );

  const regenerate = onRegenerate && (
    <IconButton
      icon={ArrowCounterClockwise}
      iconWeight="bold"
      label={labels.regenerate}
      onClick={onRegenerate}
      className="size-7"
    />
  );

  const announcement = labels.announce(
    current + 1,
    versions.length,
    labelOf(version, labels),
  );

  return (
    <Labels.Provider value={labels}>
      <MotionConfig reducedMotion="user">
        <Shell
          ref={root}
          aria-label={labels.region}
          className={cn("max-w-xl", className)}
        >
          <Panel className="px-4 py-3.5">{body}</Panel>
          {variant === "inline" ? (
            <div className="flex items-center gap-2 px-2 pt-1.5 pb-0.5">
              <div
                role="group"
                aria-label={labels.switchVersion}
                onKeyDown={onKeyDown}
                className="flex items-center rounded-full bg-foreground/[0.05] p-0.5"
              >
                <IconButton
                  icon={CaretLeft}
                  iconWeight="bold"
                  label={labels.previous}
                  disabled={current === 0}
                  onClick={(e) => go(current - 1, fromKeys(e))}
                  className={cn(step, "rtl:[&_svg]:-scale-x-100")}
                />
                <span
                  dir="ltr"
                  className="min-w-10 text-center font-mono text-xs tabular-nums"
                >
                  {current + 1} / {versions.length}
                </span>
                <IconButton
                  icon={CaretRight}
                  iconWeight="bold"
                  label={labels.next}
                  disabled={current === versions.length - 1}
                  onClick={(e) => go(current + 1, fromKeys(e))}
                  className={cn(step, "rtl:[&_svg]:-scale-x-100")}
                />
              </div>
              {caption}
              <span className="ms-auto">{regenerate}</span>
            </div>
          ) : (
            <div className="flex items-start gap-3 px-3 pt-3 pb-2">
              <BranchMap
                versions={versions}
                turnsBefore={turnsBefore}
                current={current}
                onPick={go}
                rtl={rtl}
              />
              <span className="ms-auto">{regenerate}</span>
            </div>
          )}
          <p role="status" aria-live="polite" className="sr-only">
            {announcement}
          </p>
        </Shell>
      </MotionConfig>
    </Labels.Provider>
  );
}

function Dot({ on, size = "sm" }: { on: boolean; size?: "sm" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "shrink-0 rounded-full transition-colors duration-200 ease-out",
        size === "lg" ? "size-2.5" : "size-1.5",
        on ? "bg-foreground" : "bg-foreground/20",
      )}
    />
  );
}

const Link = ({ on }: { on: boolean }) => (
  <span
    aria-hidden="true"
    className={cn(
      "h-px w-2.5 shrink-0 transition-colors duration-200 ease-out",
      on ? "bg-foreground/60" : "bg-foreground/15",
    )}
  />
);

function BranchMap({
  versions,
  turnsBefore,
  current,
  onPick,
  rtl,
}: {
  versions: MessageVersion[];
  turnsBefore: number;
  current: number;
  onPick: (index: number, instant: boolean) => void;
  rtl: boolean;
}) {
  const labels = useContext(Labels);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  // Roving focus: arrow keys move the checked radio and the focus together.
  const onKeyDown = (e: KeyboardEvent) => {
    const step = arrowStep(e.key, rtl);
    if (step === undefined) return;
    e.preventDefault();
    const next = Math.min(Math.max(current + step, 0), versions.length - 1);
    onPick(next, true);
    buttons.current[next]?.focus();
  };

  return (
    <div className="flex min-w-0 items-start">
      {/* Shared turns before the fork; always on the current path. */}
      <div aria-hidden="true" className="flex h-7 items-center">
        <GitBranch weight="fill" className="me-2 size-3.5 text-muted-foreground" />
        {Array.from({ length: turnsBefore }, (_, i) => (
          <span key={i} className="flex items-center">
            <Dot on />
            <Link on />
          </span>
        ))}
      </div>
      <div
        role="radiogroup"
        aria-label={labels.branches}
        onKeyDown={onKeyDown}
        className="relative flex min-w-0 flex-col"
      >
        {/* The fork: a vertical stem from the first branch to the last. */}
        {versions.length > 1 && (
          <span
            aria-hidden="true"
            className="absolute start-0 top-3.5 w-px bg-foreground/15"
            style={{ height: `calc(${versions.length - 1} * 1.75rem)` }}
          />
        )}
        {versions.map((v, i) => {
          const on = i === current;
          return (
            <motion.button
              key={v.id}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={enter}
              onClick={(e) => onPick(i, e.detail === 0)}
              className="group flex h-7 min-w-0 items-center rounded-full pe-2.5 text-start transition-[background-color,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-foreground/[0.04] active:scale-[0.97]"
            >
              <Link on={on} />
              <Dot on={on} size="lg" />
              {Array.from({ length: v.turnsAfter ?? 0 }, (_, j) => (
                <span key={j} className="flex items-center">
                  <Link on={on} />
                  <Dot on={on} />
                </span>
              ))}
              <span
                className={cn(
                  "ms-2.5 truncate text-[0.8125rem] transition-colors duration-150",
                  on
                    ? "text-foreground"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              >
                {labelOf(v, labels)}
                {v.meta && <span className="text-muted-foreground"> · {v.meta}</span>}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
