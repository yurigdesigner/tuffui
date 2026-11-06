// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import {
  CheckCircle,
  Circle,
  ListChecks,
  SidebarSimple,
  X,
  type Icon,
} from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "@/components/ui/action-button";
import { AgentComposer } from "@/components/ui/agent-composer";
import { Avatar } from "@/components/ui/agent-avatar";
import { ChatThread, type ThreadMessage } from "@/components/ui/chat-thread";
import { ProgressBar } from "@/components/ui/progress-bar";
import { RollingNumber } from "@/components/ui/rolling-number";
import { Tag } from "@/components/ui/status-pill";
import { Tooltip } from "@/components/ui/tooltip-hint";
import { EASE_OUT, spring } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type SummaryItem = {
  id: string;
  label: string;
  /** What's been decided; empty while it's still open. */
  value?: string;
  icon?: Icon;
};

export type BookingAssistantData = {
  title: string;
  model: string;
  /** Thread turns; `content` holds the interactive answers (questions, pickers, forms). */
  messages: ThreadMessage[];
  /** The side panel: one row per decision, filled in as the chat goes. */
  summary: { title: string; items: SummaryItem[]; estimate?: string };
  user: { name: string; avatar?: string };
};

export type BookingAssistantProps = {
  data: BookingAssistantData;
  status?: "idle" | "streaming";
  onSend?: (text: string) => void;
  onStop?: () => void;
  /** Controls the summary panel; uncontrolled by default (open). */
  summaryOpen?: boolean;
  onSummaryOpenChange?: (open: boolean) => void;
  className?: string;
};

const PANEL = 288;

/**
 * An assistant that acts: the thread carries interactive answers and a summary
 * panel tracks what's decided. From 64rem the summary is a collapsible side panel;
 * below it opens as an in-place drawer. One vertical scroll, composer pinned.
 */
export function BookingAssistant({
  data,
  status = "idle",
  onSend,
  onStop,
  summaryOpen: openProp,
  onSummaryOpenChange,
  className,
}: BookingAssistantProps) {
  const reduce = useReducedMotion();
  const [draft, setDraft] = useState("");
  const [openState, setOpenState] = useState(true);
  const open = openProp ?? openState;
  const [drawer, setDrawer] = useState(false);
  // Toggling from the keyboard is instant; a click animates the width.
  const [instant, setInstant] = useState(false);
  const dock = useRef<HTMLDivElement>(null);
  const [inset, setInset] = useState(140);

  useEffect(() => {
    const el = dock.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setInset(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const setOpen = (next: boolean) => {
    setOpenState(next);
    onSummaryOpenChange?.(next);
  };

  const toggle = (event: React.MouseEvent) => {
    setInstant(event.detail === 0 || !!reduce);
    // The same button opens the side panel when there's room, the drawer otherwise.
    const wide = (event.currentTarget.closest("[data-screen]") as HTMLElement | null)
      ?.offsetWidth;
    if (wide && wide >= 1024) setOpen(!open);
    else setDrawer(true);
  };

  const { items } = data.summary;
  const decided = items.filter((item) => item.value).length;
  const summary = <Summary data={data.summary} decided={decided} />;

  return (
    <MotionConfig reducedMotion="user">
      <div
        data-screen
        className={cn(
          "@container relative flex h-full w-full overflow-hidden bg-background text-foreground",
          className,
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-2 px-3 @md:px-5">
            <h2 className="min-w-0 truncate text-[0.9375rem] font-medium">
              {data.title}
            </h2>
            <Tag className="hidden shrink-0 @md:inline-flex">{data.model}</Tag>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="hidden text-[0.8125rem] text-muted-foreground tabular-nums @md:inline @5xl:hidden">
                <RollingNumber value={`${decided}/${items.length}`} /> decided
              </span>
              <Tooltip
                content={open ? "Hide summary" : "Show summary"}
                align="end"
                side="bottom"
              >
                <IconButton
                  icon={SidebarSimple}
                  label={`${open ? "Hide" : "Show"} ${data.summary.title.toLowerCase()}`}
                  aria-expanded={open}
                  onClick={toggle}
                  className="-scale-x-100"
                />
              </Tooltip>
              <Avatar name={data.user.name} src={data.user.avatar} size="sm" />
            </div>
          </header>

          {/* One scroll for the conversation; the composer is pinned over its bottom. */}
          <div className="relative min-h-0 flex-1">
            <ChatThread
              bare
              data={{ messages: data.messages }}
              agentName={data.model}
              userName={data.user.name}
              bottomInset={inset}
              contentClassName="mx-auto w-full max-w-3xl @md:px-5"
            />
            <div
              ref={dock}
              className="absolute inset-x-0 bottom-0 bg-background before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-gradient-to-t before:from-background before:to-transparent"
            >
              <div className="mx-auto w-full max-w-3xl px-3 pt-1 pb-3 @md:px-5 @md:pb-5">
                <AgentComposer
                  value={draft}
                  onValueChange={setDraft}
                  showModes={false}
                  status={status}
                  onSubmit={(message) => {
                    if (!message.text.trim()) return;
                    onSend?.(message.text.trim());
                    setDraft("");
                  }}
                  onStop={onStop}
                  placeholder="Ask for changes…"
                  className="max-w-none"
                />
              </div>
            </div>
          </div>
        </div>

        <motion.aside
          aria-label={data.summary.title}
          initial={false}
          animate={{ width: open ? PANEL : 0 }}
          transition={instant ? { duration: 0 } : spring}
          className="hidden shrink-0 overflow-hidden @5xl:block"
        >
          <div
            className="h-full overflow-y-auto py-3 pr-3"
            style={{ width: PANEL }}
            inert={!open}
          >
            {summary}
          </div>
        </motion.aside>

        <SummaryDrawer
          open={drawer}
          onClose={() => setDrawer(false)}
          label={data.summary.title}
        >
          {summary}
        </SummaryDrawer>
      </div>
    </MotionConfig>
  );
}

function Summary({
  data,
  decided,
}: {
  data: BookingAssistantData["summary"];
  decided: number;
}) {
  return (
    <section className="flex flex-col gap-1.5 rounded-[1.375rem] bg-surface p-1.5">
      <div className="flex items-center gap-3 pt-1.5 pr-3.5 pb-2 pl-1.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground/[0.06] text-muted-foreground">
          <ListChecks weight="fill" className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[0.9375rem] font-medium">{data.title}</h3>
          <p className="text-[0.8125rem] text-muted-foreground tabular-nums">
            <RollingNumber value={`${decided} of ${data.items.length}`} /> decided
          </p>
        </div>
      </div>
      <ProgressBar
        value={decided}
        max={data.items.length}
        tone="positive"
        striped
        size="sm"
        label="Decisions made"
        className="mx-1.5 mb-1.5"
      />
      <ul className="flex flex-col gap-1 rounded-2xl bg-surface-inset p-1.5">
        {data.items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 rounded-xl px-2.5 py-2">
            {item.value ? (
              <CheckCircle
                weight="fill"
                className="mt-0.5 size-4 shrink-0 text-positive"
                aria-hidden="true"
              />
            ) : (
              <Circle
                weight="bold"
                className="mt-0.5 size-4 shrink-0 text-muted-foreground/50"
                aria-hidden="true"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[0.8125rem] text-muted-foreground">{item.label}</p>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.p
                  key={item.value ?? "open"}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.22, ease: EASE_OUT },
                  }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  className={cn(
                    "text-sm break-words",
                    !item.value && "text-muted-foreground/70",
                  )}
                >
                  {item.value ?? "Not decided yet"}
                  <span className="sr-only">{item.value ? ", decided" : ""}</span>
                </motion.p>
              </AnimatePresence>
            </div>
          </li>
        ))}
      </ul>
      {data.estimate && (
        <div className="flex items-baseline justify-between px-3.5 py-2.5 text-[0.8125rem]">
          <span className="text-muted-foreground">Estimate</span>
          <RollingNumber value={data.estimate} className="text-base font-medium" />
        </div>
      )}
    </section>
  );
}

/** The summary as a drawer from the right that stays inside the screen. */
function SummaryDrawer({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-20 @5xl:hidden">
          <motion.button
            type="button"
            aria-label={`Close ${label.toLowerCase()}`}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2, ease: EASE_OUT } }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="absolute inset-0 bg-black/40"
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            initial={reduce ? { opacity: 0 } : { x: "105%" }}
            animate={{
              x: 0,
              opacity: 1,
              transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] },
            }}
            exit={
              reduce
                ? { opacity: 0, transition: { duration: 0.15 } }
                : { x: "105%", transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] } }
            }
            className="absolute inset-y-2 right-2 flex w-[min(20rem,calc(100%-3rem))] flex-col overflow-y-auto rounded-[1.5rem] bg-background outline-none"
          >
            <div className="flex justify-end px-1.5 pt-1.5">
              <IconButton icon={X} iconWeight="bold" label="Close" onClick={onClose} />
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
