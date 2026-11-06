"use client";

import {
  ArrowDown,
  Check,
  CheckCircle,
  CircleNotch,
  Copy,
  Stop,
  TerminalWindow,
  XCircle,
} from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/action-button";
import { RollingNumber } from "@/components/ui/rolling-number";
import { StatusPill } from "@/components/ui/status-pill";
import { Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { enter } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type TerminalLine = {
  text: string;
  /** `stderr` lines are tinted and marked; `info` lines are muted. */
  stream?: "stdout" | "stderr" | "info";
};

export type TerminalRun = {
  command: string;
  cwd?: string;
  lines: TerminalLine[];
  status: "running" | "success" | "failed";
  exitCode?: number;
  /** Final duration; while running the header counts up on its own. */
  durationMs?: number;
};

export type TerminalOutputProps = {
  data: TerminalRun;
  /** Shows a Stop button while the command runs. */
  onStop?: () => void;
  /** Called with the full output after it is copied to the clipboard. */
  onCopy?: (text: string) => void;
  /** Height in px after which the output scrolls. */
  maxHeight?: number;
  className?: string;
};

const statuses = {
  running: { icon: CircleNotch, tone: "brand" },
  success: { icon: CheckCircle, tone: "positive" },
  failed: { icon: XCircle, tone: "negative" },
} as const;

const formatDuration = (ms: number) =>
  ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;

function useElapsed(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running) return;
    const start = performance.now();
    const timer = setInterval(() => setElapsed(performance.now() - start), 100);
    return () => clearInterval(timer);
  }, [running]);
  return elapsed;
}

export function TerminalOutput({
  data,
  onStop,
  onCopy,
  maxHeight = 280,
  className,
}: TerminalOutputProps) {
  const { command, cwd, lines, status, exitCode, durationMs } = data;
  const running = status === "running";
  const elapsed = useElapsed(running);
  const scroller = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState(true);
  // Line count when the reader scrolled away; anything after it is unseen.
  const [seen, setSeen] = useState(0);
  const [copied, setCopied] = useState(false);
  const StatusIcon = statuses[status].icon;
  const reduce = useReducedMotion();

  const time = formatDuration(running ? elapsed : (durationMs ?? 0));
  const statusText = running
    ? "Running"
    : `Exit ${exitCode ?? (status === "success" ? 0 : 1)}`;

  // Follow new output unless the reader has scrolled up.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stick) el.scrollTop = el.scrollHeight;
  }, [lines.length, stick]);
  const unseen = !stick && lines.length > seen;

  const onScroll = () => {
    const el = scroller.current!;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    if (stick && !atBottom) setSeen(lines.length);
    setStick(atBottom);
  };

  const jump = () => {
    const el = scroller.current!;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
    setStick(true);
  };

  const copy = async () => {
    const text = lines.map((l) => l.text).join("\n");
    await navigator.clipboard?.writeText(text).catch(() => {});
    onCopy?.(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <MotionConfig reducedMotion="user">
      <Shell aria-label={`Terminal: ${command}`} className={cn("max-w-xl", className)}>
        <ShellHeader
          icon={TerminalWindow}
          title={
            <span className="font-mono text-[0.8125rem] font-normal">
              <span className="text-muted-foreground select-none">$ </span>
              {command}
            </span>
          }
          subtitle={cwd && <span className="font-mono text-xs">{cwd}</span>}
          aside={
            <StatusPill tone={statuses[status].tone} className="h-7">
              <StatusIcon
                weight={running ? "bold" : "fill"}
                className={cn(
                  "size-3.5",
                  running && "animate-spin motion-reduce:animate-none",
                )}
                aria-hidden="true"
              />
              {statusText}
              <span className="font-mono tabular-nums opacity-70">· {time}</span>
            </StatusPill>
          }
        />
        <Panel className="relative">
          <div
            ref={scroller}
            onScroll={onScroll}
            role="log"
            aria-live="polite"
            aria-label={`Output of ${command}`}
            tabIndex={0}
            style={{ maxHeight }}
            className="overflow-x-hidden overflow-y-auto rounded-2xl py-3 font-mono text-xs leading-5"
          >
            {lines.length === 0 && (
              <p className="px-4 text-muted-foreground">Waiting for output…</p>
            )}
            {lines.map((line, i) => (
              <p
                key={i}
                className={cn(
                  "flex gap-2 px-4 whitespace-pre-wrap",
                  line.stream === "stderr" && "bg-negative/10 text-negative",
                  line.stream === "info" && "text-muted-foreground",
                )}
              >
                <span aria-hidden="true" className="w-2 shrink-0 select-none">
                  {line.stream === "stderr" ? "!" : ""}
                </span>
                <span className="min-w-0 break-words">
                  {line.stream === "stderr" && <span className="sr-only">Error: </span>}
                  {line.text || " "}
                </span>
              </p>
            ))}
          </div>
          <AnimatePresence>
            {unseen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, transition: { duration: 0.12 } }}
                transition={enter}
                className="absolute right-3 bottom-3"
              >
                <Button
                  icon={ArrowDown}
                  iconWeight="bold"
                  onClick={jump}
                  className="h-7 px-3 text-xs"
                >
                  Jump to latest
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>
        <footer className="flex min-h-11 items-center justify-between gap-3 py-1.5 pr-1.5 pl-3.5">
          <p className="font-mono text-xs text-muted-foreground tabular-nums">
            <RollingNumber value={String(lines.length)} />{" "}
            {lines.length === 1 ? "line" : "lines"}
          </p>
          <div className="flex gap-1.5">
            <Button
              icon={copied ? Check : Copy}
              iconWeight={copied ? "bold" : "fill"}
              onClick={copy}
              disabled={!lines.length}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
            {running && onStop && (
              <Button variant="danger" icon={Stop} onClick={onStop}>
                Stop
              </Button>
            )}
          </div>
        </footer>
        <p role="status" aria-live="polite" className="sr-only">
          {running
            ? ""
            : `${command} ${status === "success" ? "finished" : "failed"} with exit code ${exitCode ?? (status === "success" ? 0 : 1)} after ${time}`}
        </p>
      </Shell>
    </MotionConfig>
  );
}
