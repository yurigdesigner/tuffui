// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import { Database, SidebarSimple, Star, X, type Icon } from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "@/components/ui/action-button";
import { AgentComposer, type AgentComposerLabels } from "@/components/ui/agent-composer";
import { Avatar } from "@/components/ui/agent-avatar";
import {
  ChatThread,
  type ChatThreadLabels,
  type ThreadMessage,
} from "@/components/ui/chat-thread";
import {
  PromptSuggestions,
  type PromptSuggestion,
  type PromptSuggestionsLabels,
} from "@/components/ui/prompt-suggestions";
import { StatusPill, Tag } from "@/components/ui/status-pill";
import { Tooltip } from "@/components/ui/tooltip-hint";
import { EASE_OUT, spring } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type DataSource = {
  id: string;
  name: string;
  /** Short line under the name, e.g. "events · 48M rows". */
  detail?: string;
  status: "synced" | "syncing" | "stale";
};

export type SavedQuestion = { id: string; title: string; prompt?: string };

export type DataAnswerData = {
  title: string;
  model: string;
  sources: DataSource[];
  saved: SavedQuestion[];
  /** Thread turns; assistant `content` holds the answer (stats, charts, tables…). */
  messages: ThreadMessage[];
  followUps?: PromptSuggestion[];
  user: { name: string; avatar?: string };
};

export type DataAnswerLabels = {
  /** Sidebar and drawer name. */
  sidebar: string;
  hideSidebar: string;
  showSidebar: string;
  /** Toggle tooltip and name below 56rem, where it opens the drawer. */
  drawerHint: string;
  openDrawer: string;
  dataSources: string;
  savedQuestions: string;
  sourceStatus: Record<DataSource["status"], string>;
  placeholder: string;
  close: string;
  /** Passed to the child components. */
  thread?: Partial<ChatThreadLabels>;
  composer?: Partial<AgentComposerLabels>;
  suggestions?: Partial<PromptSuggestionsLabels>;
};

const defaultLabels: DataAnswerLabels = {
  sidebar: "Data and saved questions",
  hideSidebar: "Hide sidebar",
  showSidebar: "Show sidebar",
  drawerHint: "Data and questions",
  openDrawer: "Open data and questions",
  dataSources: "Data sources",
  savedQuestions: "Saved questions",
  sourceStatus: { synced: "Synced", syncing: "Syncing", stale: "Stale" },
  placeholder: "Ask about your data…",
  close: "Close",
};

export type DataAnswerProps = {
  data: DataAnswerData;
  status?: "idle" | "streaming";
  onSend?: (text: string) => void;
  onStop?: () => void;
  /** Sidebar visibility on wide screens. Uncontrolled by default (open). */
  sidebarOpen?: boolean;
  onSidebarOpenChange?: (open: boolean) => void;
  /** Your own UI strings, plus `thread`, `composer` and `suggestions` for the children. */
  labels?: Partial<DataAnswerLabels>;
  /** Intl locale for message times. */
  locale?: string;
  className?: string;
};

const WIDE = 896; // 56rem: from here the sidebar sits beside the thread

const sourceTone: Record<DataSource["status"], "positive" | "brand" | "warning"> = {
  synced: "positive",
  syncing: "brand",
  stale: "warning",
};

/**
 * An analytics assistant: data sources and saved questions at the start side, a thread
 * whose answers are stats, charts and tables, and a composer pinned at the bottom.
 * Lays out against its own width, so the same screen works full screen and in a
 * preview frame. The sidebar collapses on wide screens and becomes a drawer below.
 */
export function DataAnswer({
  data,
  status = "idle",
  onSend,
  onStop,
  sidebarOpen,
  onSidebarOpenChange,
  labels: labelOverrides,
  locale,
  className,
}: DataAnswerProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const root = useRef<HTMLDivElement>(null);
  const dock = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(true);
  const [inset, setInset] = useState(120);
  const [draft, setDraft] = useState("");
  const [ownOpen, setOwnOpen] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [instant, setInstant] = useState(false);
  const [rtl, setRtl] = useState(false);
  const open = sidebarOpen ?? ownOpen;
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = root.current;
    const composer = dock.current;
    if (!el || !composer) return;
    const observer = new ResizeObserver(() => {
      setWide(el.clientWidth >= WIDE);
      setRtl(getComputedStyle(el).direction === "rtl");
      setInset(composer.offsetHeight);
    });
    observer.observe(el);
    observer.observe(composer);
    return () => observer.disconnect();
  }, []);

  const toggle = (event: React.MouseEvent) => {
    // A keyboard click (detail 0) collapses instantly; a pointer click animates.
    setInstant(event.detail === 0 || !!reduce);
    if (!wide) return setDrawer(true);
    setOwnOpen(!open);
    onSidebarOpenChange?.(!open);
  };

  const send = (text: string) => {
    if (!text.trim()) return;
    onSend?.(text.trim());
    setDraft("");
    setDrawer(false);
  };

  // The thread picks each message's direction from its text; rich answers often open
  // with Latin (a query, a table name), so they follow the screen's direction instead.
  const messages = data.messages.map((m) =>
    typeof m.content === "string"
      ? m
      : { ...m, content: <div dir={rtl ? "rtl" : "ltr"}>{m.content}</div> },
  );

  const sidebar = <Sidebar data={data} labels={labels} onAsk={send} />;

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={root}
        className={cn(
          "@container relative flex h-full w-full overflow-hidden bg-background text-foreground",
          className,
        )}
      >
        <motion.aside
          aria-label={labels.sidebar}
          initial={false}
          animate={{ width: open ? 288 : 0, opacity: open ? 1 : 0 }}
          transition={instant ? { duration: 0 } : spring}
          className="hidden shrink-0 overflow-hidden @4xl:block"
          inert={!open}
        >
          <div className="h-full w-72 overflow-y-auto p-3 pe-0">{sidebar}</div>
        </motion.aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-2 px-3 @md:px-5">
            <Tooltip
              content={
                wide
                  ? open
                    ? labels.hideSidebar
                    : labels.showSidebar
                  : labels.drawerHint
              }
              side="bottom"
              align="start"
            >
              <IconButton
                icon={SidebarSimple}
                label={
                  wide
                    ? open
                      ? labels.hideSidebar
                      : labels.showSidebar
                    : labels.openDrawer
                }
                aria-expanded={wide ? open : drawer}
                onClick={toggle}
                className="rtl:[&_svg]:-scale-x-100"
              />
            </Tooltip>
            <h2 className="min-w-0 truncate text-[0.9375rem] font-medium">
              {data.title}
            </h2>
            <Tag className="hidden shrink-0 @md:inline-flex">{data.model}</Tag>
            <Avatar
              name={data.user.name}
              src={data.user.avatar}
              size="sm"
              className="ms-auto"
            />
          </header>

          <div className="relative min-h-0 flex-1">
            <ChatThread
              bare
              data={{ messages }}
              agentName={data.model}
              userName={data.user.name}
              locale={locale}
              labels={labels.thread}
              bottomInset={inset}
              contentClassName="mx-auto w-full max-w-3xl @md:px-5"
              footer={
                data.followUps &&
                data.followUps.length > 0 &&
                status === "idle" && (
                  <PromptSuggestions
                    data={data.followUps}
                    variant="chips"
                    onSelect={(_, prompt) => send(prompt)}
                    labels={labels.suggestions}
                    className="mt-3 max-w-none ps-9"
                  />
                )
              }
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
                  onSubmit={(message) => send(message.text)}
                  onStop={onStop}
                  placeholder={labels.placeholder}
                  labels={labels.composer}
                  className="max-w-none"
                />
              </div>
            </div>
          </div>
        </div>

        <Drawer
          open={drawer && !wide}
          rtl={rtl}
          labels={labels}
          onClose={() => setDrawer(false)}
        >
          {sidebar}
        </Drawer>
      </div>
    </MotionConfig>
  );
}

function Sidebar({
  data,
  labels,
  onAsk,
}: {
  data: DataAnswerData;
  labels: DataAnswerLabels;
  onAsk: (text: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Section icon={Database} title={labels.dataSources}>
        {data.sources.map((s) => (
          <li key={s.id} className="flex items-center gap-2 rounded-xl px-2.5 py-2">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.8125rem] font-medium">
                {s.name}
              </span>
              {s.detail && (
                <span className="block truncate font-mono text-[0.6875rem] text-muted-foreground">
                  {s.detail}
                </span>
              )}
            </span>
            <StatusPill tone={sourceTone[s.status]} size="sm">
              {labels.sourceStatus[s.status]}
            </StatusPill>
          </li>
        ))}
      </Section>
      <Section icon={Star} title={labels.savedQuestions}>
        {data.saved.map((q) => (
          <li key={q.id}>
            <button
              type="button"
              onClick={() => onAsk(q.prompt ?? q.title)}
              className="w-full rounded-xl px-2.5 py-2 text-start text-[0.8125rem] transition-[background-color,scale] duration-150 ease-out hover:bg-foreground/[0.05] active:scale-[0.98]"
            >
              {q.title}
            </button>
          </li>
        ))}
      </Section>
    </div>
  );
}

function Section({
  icon: SectionIcon,
  title,
  children,
}: {
  icon: Icon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.375rem] bg-surface p-1.5">
      <h3 className="flex items-center gap-2 px-2.5 pt-1.5 pb-2 text-[0.8125rem] font-medium text-muted-foreground">
        <SectionIcon weight="fill" className="size-4" aria-hidden="true" />
        {title}
      </h3>
      <ul className="flex flex-col gap-px rounded-2xl bg-surface-inset p-1">
        {children}
      </ul>
    </section>
  );
}

/** The sidebar as a drawer inside the screen, so it works full screen and in a frame. */
function Drawer({
  open,
  rtl,
  labels,
  onClose,
  children,
}: {
  open: boolean;
  /** Slides in from the start edge: the right one in right-to-left layouts. */
  rtl: boolean;
  labels: DataAnswerLabels;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const off = rtl ? "105%" : "-105%";

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
        <div className="absolute inset-0 z-20">
          <motion.button
            type="button"
            aria-label={labels.close}
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
            aria-label={labels.sidebar}
            tabIndex={-1}
            initial={reduce ? { opacity: 0 } : { x: off }}
            animate={{
              x: 0,
              opacity: 1,
              transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] },
            }}
            exit={
              reduce
                ? { opacity: 0, transition: { duration: 0.15 } }
                : { x: off, transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] } }
            }
            className="absolute inset-y-2 start-2 flex w-[min(20rem,calc(100%-3rem))] flex-col overflow-y-auto rounded-[1.5rem] bg-background p-1.5 outline-none"
          >
            <div className="flex justify-end px-1.5 pt-1.5">
              <IconButton
                icon={X}
                iconWeight="bold"
                label={labels.close}
                onClick={onClose}
              />
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
