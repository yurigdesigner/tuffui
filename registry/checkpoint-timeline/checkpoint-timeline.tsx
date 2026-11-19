// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import {
  ArrowCounterClockwise,
  CaretLeft,
  CaretRight,
  ClockCounterClockwise,
} from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Button, IconButton } from "@/components/ui/action-button";
import { RollingNumber } from "@/components/ui/rolling-number";
import { StatusPill } from "@/components/ui/status-pill";
import { Inset, Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { CSS_EASE_IN_OUT, enter, exit, spring } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type CheckpointFile = { path: string; additions: number; deletions: number };

export type Checkpoint = {
  id: string;
  /** What the turn did, usually a summary of the prompt. */
  label: string;
  /** Display time, e.g. "4m ago" or "14:02". */
  at: string;
  files: CheckpointFile[];
};

export type CheckpointTimelineProps = {
  /** Checkpoints oldest first; the last one is the current state. */
  data: Checkpoint[];
  /** `timeline` is a scrubber with a preview panel; `compact` is a single row. */
  variant?: "timeline" | "compact";
  /** Controlled selection; defaults to the latest checkpoint. */
  selectedId?: string;
  onSelect?: (checkpoint: Checkpoint) => void;
  /** Called after the user confirms. Drop the later checkpoints from `data`. */
  onRestore?: (checkpoint: Checkpoint) => void;
  /** Controlled confirmation step before restoring. */
  confirming?: boolean;
  onConfirmingChange?: (confirming: boolean) => void;
  /** UI strings, for translating the timeline. */
  labels?: Partial<CheckpointTimelineLabels>;
  className?: string;
};

export type CheckpointTimelineLabels = {
  title: string;
  turns: (n: number) => string;
  /** Under each tick. */
  files: (n: number) => string;
  /** Screen-reader name of a tick. */
  tick: (n: number, label: string, files: number, at: string) => string;
  /** Screen-reader name of the preview panel. */
  panel: (n: number) => string;
  /** Preview heading; `n` is an animated number. */
  heading: (n: ReactNode) => ReactNode;
  current: string;
  noFiles: string;
  /** Footer after the line counts. */
  atCheckpoint: (n: number) => string;
  /** Compact row; `n` and `total` are animated numbers. */
  position: (n: ReactNode, total: ReactNode) => ReactNode;
  previous: string;
  next: string;
  drops: (n: number) => string;
  cancel: string;
  restore: string;
  restoreHere: string;
  currentState: string;
  restored: (n: number, label: string) => string;
};

const defaultLabels: CheckpointTimelineLabels = {
  title: "Checkpoints",
  turns: (n) => `${n} turns`,
  files: (n) => `${n} file${n === 1 ? "" : "s"}`,
  tick: (n, label, files, at) =>
    `Checkpoint ${n}: ${label}, ${files} files changed, ${at}`,
  panel: (n) => `Checkpoint ${n}`,
  heading: (n) => <>Checkpoint {n}</>,
  current: "current",
  noFiles: "No files changed in this turn",
  atCheckpoint: (n) => `at checkpoint ${n}`,
  position: (n, total) => (
    <>
      Checkpoint {n} of {total}
    </>
  ),
  previous: "Previous checkpoint",
  next: "Next checkpoint",
  drops: (n) => `Drops ${n} later checkpoint${n === 1 ? "" : "s"}`,
  cancel: "Cancel",
  restore: "Restore",
  restoreHere: "Restore to here",
  currentState: "Current state",
  restored: (n, label) => `Restored to checkpoint ${n}: ${label}`,
};

const sum = (files: CheckpointFile[], key: "additions" | "deletions") =>
  files.reduce((n, f) => n + f[key], 0);

export function CheckpointTimeline({
  data,
  variant = "timeline",
  selectedId,
  onSelect,
  onRestore,
  confirming: confirmingProp,
  onConfirmingChange,
  labels: labelOverrides,
  className,
}: CheckpointTimelineProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  // Set from the first tick or button the user touches; flips motion and arrow keys.
  const [rtl, setRtl] = useState(false);
  const readDir = (el: Element | null) => {
    if (!el) return;
    const next = getComputedStyle(el).direction === "rtl";
    if (next !== rtl) setRtl(next);
  };
  const [ownSelected, setOwnSelected] = useState<string>();
  const [hovered, setHovered] = useState<string>();
  const [ownConfirming, setOwnConfirming] = useState(false);
  const confirming = confirmingProp ?? ownConfirming;
  const setConfirming = (next: boolean) => {
    setOwnConfirming(next);
    onConfirmingChange?.(next);
  };
  const [announcement, setAnnouncement] = useState("");
  const ticks = useRef<(HTMLButtonElement | null)[]>([]);

  const latest = data.length - 1;
  const chosen = selectedId ?? ownSelected;
  const index = Math.max(
    0,
    data.findIndex((c) => c.id === chosen),
  );
  const selectedIndex = chosen && data.some((c) => c.id === chosen) ? index : latest;
  const shownIndex = hovered
    ? Math.max(
        0,
        data.findIndex((c) => c.id === hovered),
      )
    : selectedIndex;
  const shown = data[shownIndex];
  const selected = data[selectedIndex];
  const dropped = latest - selectedIndex;

  const select = (i: number, focus = false) => {
    const next = data[Math.min(Math.max(i, 0), latest)];
    if (!next) return;
    setConfirming(false);
    setOwnSelected(next.id);
    onSelect?.(next);
    if (focus) ticks.current[data.indexOf(next)]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    // Checkpoints run from the start side: in RTL the left arrow moves forward.
    const step = getComputedStyle(e.currentTarget).direction === "rtl" ? -1 : 1;
    const to = {
      ArrowLeft: selectedIndex - step,
      ArrowRight: selectedIndex + step,
      Home: 0,
      End: latest,
    }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    select(to, true);
  };

  const restore = () => {
    setConfirming(false);
    setOwnSelected(undefined);
    setAnnouncement(labels.restored(selectedIndex + 1, selected.label));
    onRestore?.(selected);
  };

  if (!selected) return null;

  const restoreControls = (
    <AnimatePresence mode="popLayout" initial={false}>
      {confirming ? (
        <motion.div
          key="confirm"
          initial={{ opacity: 0, x: rtl ? -8 : 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, transition: exit }}
          transition={enter}
          className="flex items-center gap-2"
        >
          <span className="text-[0.8125rem] text-muted-foreground">
            {labels.drops(dropped)}
          </span>
          <Button onClick={() => setConfirming(false)} className="px-3">
            {labels.cancel}
          </Button>
          <Button variant="primary" onClick={restore}>
            {labels.restore}
          </Button>
        </motion.div>
      ) : dropped > 0 ? (
        <motion.div
          key="restore"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: exit }}
          transition={enter}
        >
          <Button
            variant="primary"
            icon={ArrowCounterClockwise}
            iconWeight="bold"
            onClick={(e) => {
              readDir(e.currentTarget);
              setConfirming(true);
            }}
          >
            {labels.restoreHere}
          </Button>
        </motion.div>
      ) : (
        <motion.span key="current" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <StatusPill tone="positive">{labels.currentState}</StatusPill>
        </motion.span>
      )}
    </AnimatePresence>
  );

  const live = (
    <p role="status" aria-live="polite" className="sr-only">
      {announcement}
    </p>
  );

  if (variant === "compact") {
    return (
      <MotionConfig reducedMotion="user">
        <div
          ref={readDir}
          className={cn(
            "flex w-full max-w-xl items-center gap-2 rounded-full bg-surface py-1.5 ps-2 pe-1.5",
            className,
          )}
        >
          {[
            { dir: -1, icon: CaretLeft, label: labels.previous },
            { dir: 1, icon: CaretRight, label: labels.next },
          ].map(({ dir, icon: Icon, label }) => (
            <IconButton
              key={dir}
              variant="secondary"
              icon={Icon}
              iconWeight="bold"
              label={label}
              disabled={dir < 0 ? selectedIndex === 0 : selectedIndex === latest}
              onClick={() => select(selectedIndex + dir)}
              className="disabled:opacity-30 [&_svg]:size-4 rtl:[&_svg]:-scale-x-100"
            />
          ))}
          <p className="min-w-0 flex-1 truncate px-1 text-[0.8125rem]">
            <span className="text-muted-foreground tabular-nums">
              {labels.position(
                <RollingNumber value={String(selectedIndex + 1)} />,
                <RollingNumber value={String(data.length)} />,
              )}
            </span>
            {!confirming && ` · ${selected.label}`}
          </p>
          {restoreControls}
          {live}
        </div>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <Shell
        ref={readDir}
        aria-label={labels.title}
        className={cn("max-w-xl", className)}
      >
        <ShellHeader
          icon={ClockCounterClockwise}
          title={labels.title}
          aside={
            <span className="text-[0.8125rem] text-muted-foreground tabular-nums">
              {labels.turns(data.length)}
            </span>
          }
        />
        <Panel className="p-4">
          <div
            role="tablist"
            aria-label={labels.title}
            onKeyDown={onKeyDown}
            onMouseLeave={() => setHovered(undefined)}
            className="relative flex items-start justify-between"
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-6 top-3 h-2 -translate-y-1/2 rounded-full bg-foreground/[0.07]"
            />
            <span
              aria-hidden="true"
              className="absolute inset-x-6 top-3 h-2 -translate-y-1/2 rounded-full bg-foreground/30 bg-[image:repeating-linear-gradient(-45deg,rgb(255_255_255/0.16)_0_3px,transparent_3px_7px)] transition-[clip-path] duration-300 motion-reduce:transition-none rtl:-scale-x-100"
              // Clip instead of scaleX, so the stripes keep their angle. Mirrored in RTL.
              style={{
                transitionTimingFunction: CSS_EASE_IN_OUT,
                clipPath: `inset(0 ${latest ? 100 - (selectedIndex / latest) * 100 : 100}% 0 0 round 9999px)`,
              }}
            />
            <AnimatePresence initial={false}>
              {data.map((checkpoint, i) => {
                const active = i === selectedIndex;
                const changed = checkpoint.files.length;
                return (
                  <motion.button
                    key={checkpoint.id}
                    ref={(el) => {
                      ticks.current[i] = el;
                    }}
                    layout="position"
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-label={labels.tick(
                      i + 1,
                      checkpoint.label,
                      changed,
                      checkpoint.at,
                    )}
                    tabIndex={active ? 0 : -1}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{
                      opacity: confirming && i > selectedIndex ? 0.35 : 1,
                      scale: 1,
                    }}
                    exit={{ opacity: 0, scale: 0.9, transition: exit }}
                    transition={{ layout: spring, default: enter }}
                    onClick={() => select(i)}
                    onMouseEnter={() => setHovered(checkpoint.id)}
                    className="group relative flex w-12 flex-col items-center gap-1.5"
                  >
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full font-mono text-[0.6875rem] tabular-nums transition-[background-color,color,scale] duration-150 group-active:scale-[0.94]",
                        active
                          ? "bg-foreground text-background"
                          : "bg-surface-raised text-muted-foreground group-hover:text-foreground",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="font-mono text-[0.625rem] text-muted-foreground tabular-nums">
                      {changed > 0 ? labels.files(changed) : "—"}
                    </span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
          <div role="tabpanel" aria-label={labels.panel(shownIndex + 1)} className="mt-4">
            <p className="flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
              <span>
                {labels.heading(<RollingNumber value={String(shownIndex + 1)} />)}
                {shownIndex === latest && ` · ${labels.current}`}
              </span>
              <span>{shown.at}</span>
            </p>
            <p className="mt-1 text-sm">{shown.label}</p>
            {shown.files.length > 0 ? (
              <Inset className="mt-3 p-1">
                <ul>
                  {shown.files.map((f) => (
                    <li
                      key={f.path}
                      className="flex items-center gap-3 rounded-lg px-2.5 py-1.5 font-mono text-xs"
                    >
                      <span className="min-w-0 flex-1 truncate">{f.path}</span>
                      <span dir="ltr" className="text-positive tabular-nums">
                        +{f.additions}
                      </span>
                      <span dir="ltr" className="w-8 text-end text-negative tabular-nums">
                        −{f.deletions}
                      </span>
                    </li>
                  ))}
                </ul>
              </Inset>
            ) : (
              <Inset className="mt-3 px-3 py-2.5 text-xs text-muted-foreground">
                {labels.noFiles}
              </Inset>
            )}
          </div>
        </Panel>
        <footer className="flex min-h-12 items-center justify-between gap-3 py-1.5 ps-3.5 pe-1.5 text-[0.8125rem] text-muted-foreground">
          <span className="font-mono text-xs tabular-nums">
            <span dir="ltr">
              <span className="text-positive">+{sum(selected.files, "additions")}</span>{" "}
              <span className="text-negative">−{sum(selected.files, "deletions")}</span>
            </span>{" "}
            {labels.atCheckpoint(selectedIndex + 1)}
          </span>
          {restoreControls}
        </footer>
        {live}
      </Shell>
    </MotionConfig>
  );
}
