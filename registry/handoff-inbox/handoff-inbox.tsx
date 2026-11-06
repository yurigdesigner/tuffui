"use client";

import {
  ArrowsLeftRight,
  IdentificationCard,
  List,
  Robot,
  SidebarSimple,
  Tray,
  UserCircle,
  Warning,
  X,
} from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { Button, IconButton } from "@/components/ui/action-button";
import { AgentComposer } from "@/components/ui/agent-composer";
import { Avatar } from "@/components/ui/agent-avatar";
import { ChatThread, type ThreadMessage } from "@/components/ui/chat-thread";
import { DataTable, type DataColumn, type DataRow } from "@/components/ui/data-table";
import { Collapsible } from "@/components/ui/disclosure";
import { EmptyState } from "@/components/ui/empty-state";
import { KeyCombo } from "@/components/ui/key-hint";
import { MemoryPanel, type Memory } from "@/components/ui/memory-panel";
import {
  PromptSuggestions,
  type PromptSuggestion,
} from "@/components/ui/prompt-suggestions";
import { RollingNumber } from "@/components/ui/rolling-number";
import { Segmented } from "@/components/ui/segmented-control";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { ToolCallBlock, type ToolCall } from "@/components/ui/tool-call-block";
import { Tooltip } from "@/components/ui/tooltip-hint";
import { EASE_OUT, instant as instantTransition, spring } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type Escalation = {
  id: string;
  customer: { name: string; avatar?: string };
  /** Last thing the customer said. */
  snippet: string;
  /** Why the bot handed off, e.g. "Port failed twice". */
  reason: string;
  tone?: StatusTone;
  urgent?: boolean;
  /** Minutes the customer has been waiting for a person. */
  waiting: number;
  /** Operator id of whoever took it, if anyone. */
  assignee?: string;
};

export type HandoffMessage = {
  id: string;
  /** `handoff` renders the "bot handed off" marker between turns. */
  from: "customer" | "bot" | "operator" | "handoff";
  at: string;
  content: React.ReactNode;
};

export type HandoffInboxData = {
  team: string;
  operator: { id: string; name: string; avatar?: string };
  bot: { name: string };
  queue: Escalation[];
  activeId?: string;
  messages: HandoffMessage[];
  /** What the bot learned and did before handing off. */
  summary: { wants: string; tried: string[]; calls?: ToolCall[] };
  /** Replies the bot drafted for the operator. */
  suggestions?: PromptSuggestion[];
  customer: {
    name: string;
    avatar?: string;
    plan: string;
    planTone?: StatusTone;
    since: string;
    orders: DataRow[];
    orderColumns: DataColumn[];
    notes: Memory[];
  };
};

export type HandoffStatus = "waiting" | "active" | "returned";

export type HandoffInboxProps = {
  data: HandoffInboxData;
  /** `waiting`: the bot holds the chat; `active`: the operator has taken over; `returned`: handed back. */
  status?: HandoffStatus;
  onTakeOver?: () => void;
  onHandBack?: () => void;
  onSend?: (text: string) => void;
  onSelect?: (escalation: Escalation) => void;
  draft?: string;
  onDraftChange?: (draft: string) => void;
  queueOpen?: boolean;
  defaultQueueOpen?: boolean;
  onQueueOpenChange?: (open: boolean) => void;
  detailsOpen?: boolean;
  defaultDetailsOpen?: boolean;
  onDetailsOpenChange?: (open: boolean) => void;
  className?: string;
};

type Filter = "all" | "urgent" | "mine";

/** Open/close state that can be controlled, with keyboard toggles skipping the animation. */
function usePane(
  prop: boolean | undefined,
  initial: boolean,
  onChange?: (open: boolean) => void,
) {
  const [own, setOwn] = useState(initial);
  const [instant, setInstant] = useState(false);
  const reduce = useReducedMotion();
  const open = prop ?? own;
  const toggle = (fromKeyboard: boolean) => {
    setInstant(fromKeyboard || !!reduce);
    setOwn(!open);
    onChange?.(!open);
  };
  return { open, instant, toggle };
}

/**
 * Where people take over from a support bot. Escalations queue on the left, the
 * conversation with the bot's summary in the middle, customer details on the
 * right. Lays out against its own width: panes collapse into drawers below 56rem
 * (queue) and 72rem (details).
 */
export function HandoffInbox({
  data,
  status = "waiting",
  onTakeOver,
  onHandBack,
  onSend,
  onSelect,
  draft: draftProp,
  onDraftChange,
  queueOpen,
  defaultQueueOpen = true,
  onQueueOpenChange,
  detailsOpen,
  defaultDetailsOpen = true,
  onDetailsOpenChange,
  className,
}: HandoffInboxProps) {
  const { operator, bot, customer } = data;
  const queue = usePane(queueOpen, defaultQueueOpen, onQueueOpenChange);
  const details = usePane(detailsOpen, defaultDetailsOpen, onDetailsOpenChange);
  const [drawer, setDrawer] = useState<"queue" | "details" | null>(null);
  const [ownDraft, setOwnDraft] = useState("");
  const draft = draftProp ?? ownDraft;
  const setDraft = (value: string) => {
    setOwnDraft(value);
    onDraftChange?.(value);
  };
  const [summaryOpen, setSummaryOpen] = useState(status === "waiting");
  const queueId = useId();
  const detailsId = useId();
  const dock = useRef<HTMLDivElement>(null);
  const [inset, setInset] = useState(160);
  const active = status === "active";
  const current = data.queue.find((e) => e.id === data.activeId);

  // The bot summary folds away once a person is in the conversation.
  const [lastStatus, setLastStatus] = useState(status);
  if (lastStatus !== status) {
    setLastStatus(status);
    setSummaryOpen(status === "waiting");
  }

  useEffect(() => {
    const el = dock.current;
    if (!el) return;
    let first = true;
    const observer = new ResizeObserver(() => {
      setInset(el.offsetHeight);
      // On a narrow conversation the summary starts folded so the thread stays visible.
      if (first && el.offsetWidth < 560) setSummaryOpen(false);
      first = false;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const send = (text: string) => {
    if (!text.trim()) return;
    onSend?.(text.trim());
    setDraft("");
  };

  const messages: ThreadMessage[] = data.messages.map((m) => ({
    id: m.id,
    // People on this side (bot and operator) sit on the right; the customer on the left.
    role: m.from === "bot" || m.from === "operator" ? "user" : "assistant",
    at: m.at,
    author:
      m.from === "bot"
        ? bot.name
        : m.from === "operator"
          ? `${operator.name} (you)`
          : m.from === "handoff"
            ? "Handoff"
            : customer.name,
    content: m.content,
  }));
  const byId = new Map(data.messages.map((m) => [m.id, m.from]));

  const queueList = (
    <QueueList
      data={data}
      onSelect={(escalation) => {
        setDrawer(null);
        onSelect?.(escalation);
      }}
    />
  );
  const detailsPanel = <CustomerDetails customer={customer} />;

  return (
    <MotionConfig reducedMotion="user">
      <div
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "\\") {
            event.preventDefault();
            queue.toggle(true);
          }
        }}
        className={cn(
          "@container relative flex h-full w-full overflow-hidden bg-background text-foreground",
          className,
        )}
      >
        <Pane
          id={queueId}
          label="Handoff queue"
          side="left"
          {...queue}
          breakpoint="@4xl:block"
        >
          {queueList}
        </Pane>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-2 px-3 @md:px-5">
            <IconButton
              icon={List}
              iconWeight="bold"
              label="Open queue"
              title={undefined}
              onClick={() => setDrawer("queue")}
              className="@4xl:hidden"
            />
            <PaneToggle
              open={queue.open}
              what="queue"
              controls={queueId}
              shortcut
              onToggle={queue.toggle}
              className="hidden @4xl:inline-flex"
            />
            <Avatar name={customer.name} src={customer.avatar} size="sm" kind="person" />
            <div className="min-w-0">
              <h2 className="truncate text-[0.9375rem] font-medium">{customer.name}</h2>
              <p className="truncate text-xs text-muted-foreground">
                {status === "waiting"
                  ? `${bot.name} is holding the chat`
                  : status === "active"
                    ? `You took over from ${bot.name}`
                    : `Back with ${bot.name}`}
              </p>
            </div>
            {current && (
              <StatusPill
                tone={current.tone ?? "warning"}
                size="sm"
                className="hidden @2xl:inline-flex"
              >
                {current.reason}
              </StatusPill>
            )}
            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              {/* Take over lives in the pinned bar; once in, hand back from here. */}
              {active && (
                <Button size="sm" icon={Robot} onClick={onHandBack}>
                  Hand back
                </Button>
              )}
              <IconButton
                icon={IdentificationCard}
                label="Customer details"
                title={undefined}
                onClick={() => setDrawer("details")}
                className="@6xl:hidden"
              />
              <PaneToggle
                open={details.open}
                what="details"
                controls={detailsId}
                onToggle={details.toggle}
                className="hidden @6xl:inline-flex"
              />
            </div>
          </header>

          {/* One scroll for the conversation; the summary and composer are pinned under it. */}
          <div className="relative min-h-0 flex-1">
            <ChatThread
              bare
              data={{ messages }}
              agentName={customer.name}
              userName={operator.name}
              bottomInset={inset}
              contentClassName="mx-auto w-full max-w-3xl @md:px-5"
              renderAvatar={(message) => {
                const from = byId.get(message.id);
                if (from === "handoff")
                  return <span aria-hidden="true" className="w-7 shrink-0" />;
                if (from === "bot")
                  return <Avatar name={bot.name} size="sm" kind="agent" />;
                if (from === "operator")
                  return (
                    <Avatar
                      name={operator.name}
                      src={operator.avatar}
                      size="sm"
                      kind="person"
                      status="online"
                    />
                  );
                return (
                  <Avatar
                    name={customer.name}
                    src={customer.avatar}
                    size="sm"
                    kind="person"
                  />
                );
              }}
            />

            <div
              ref={dock}
              className="absolute inset-x-0 bottom-0 bg-background before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-gradient-to-t before:from-background before:to-transparent"
            >
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-3 pt-1 pb-3 @md:px-5 @md:pb-5">
                <Collapsible
                  title={`${bot.name}'s summary`}
                  icon={Robot}
                  meta={`${data.summary.tried.length} tried`}
                  open={summaryOpen}
                  onOpenChange={setSummaryOpen}
                >
                  <Summary summary={data.summary} />
                </Collapsible>

                {active ? (
                  <>
                    {data.suggestions && data.suggestions.length > 0 && !draft && (
                      <PromptSuggestions
                        data={data.suggestions}
                        variant="chips"
                        heading={`Drafted by ${bot.name}`}
                        onSelect={(_, prompt) => setDraft(prompt)}
                        className="max-w-none"
                      />
                    )}
                    <AgentComposer
                      value={draft}
                      onValueChange={setDraft}
                      showModes={false}
                      allowAttachments={false}
                      onSubmit={(message) => send(message.text)}
                      placeholder={`Reply to ${customer.name.split(" ")[0]}…`}
                      className="max-w-none"
                    />
                  </>
                ) : (
                  <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface px-4 py-3">
                    <Robot
                      weight="fill"
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                    <p className="min-w-0 flex-1 text-[0.8125rem] text-muted-foreground">
                      {status === "waiting"
                        ? `${bot.name} told ${customer.name.split(" ")[0]} a person is on the way.`
                        : `${bot.name} is answering again. Take over any time.`}
                    </p>
                    <Button
                      size="sm"
                      variant="primary"
                      icon={UserCircle}
                      onClick={onTakeOver}
                    >
                      Take over
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Pane
          id={detailsId}
          label="Customer details"
          side="right"
          {...details}
          breakpoint="@6xl:block"
        >
          {detailsPanel}
        </Pane>

        <Drawer
          open={drawer !== null}
          side={drawer === "details" ? "right" : "left"}
          label={drawer === "details" ? "Customer details" : "Handoff queue"}
          onClose={() => setDrawer(null)}
        >
          {drawer === "details" ? detailsPanel : queueList}
        </Drawer>
      </div>
    </MotionConfig>
  );
}

function PaneToggle({
  open,
  what,
  controls,
  shortcut,
  onToggle,
  className,
}: {
  open: boolean;
  what: string;
  controls: string;
  shortcut?: boolean;
  onToggle: (fromKeyboard: boolean) => void;
  className?: string;
}) {
  const label = `${open ? "Hide" : "Show"} ${what}`;
  return (
    <Tooltip
      side="bottom"
      align={what === "details" ? "end" : "start"}
      content={
        <span className="flex items-center gap-2">
          {label}
          {shortcut && <KeyCombo keys={"mod+\\"} />}
        </span>
      }
    >
      <IconButton
        icon={SidebarSimple}
        label={label}
        title={undefined}
        aria-expanded={open}
        aria-controls={controls}
        aria-keyshortcuts={shortcut ? "Meta+\\ Control+\\" : undefined}
        onClick={(event) => onToggle(event.detail === 0)}
        className={cn(what === "details" && "-scale-x-100", className)}
      />
    </Tooltip>
  );
}

/** A side pane at wide widths: its width animates to 0 when hidden. */
function Pane({
  id,
  label,
  side,
  open,
  instant,
  breakpoint,
  children,
}: {
  id: string;
  label: string;
  side: "left" | "right";
  open: boolean;
  instant: boolean;
  breakpoint: string;
  children: React.ReactNode;
}) {
  const transition = instant ? instantTransition : spring;
  return (
    <motion.aside
      id={id}
      aria-label={label}
      aria-hidden={!open || undefined}
      inert={!open}
      initial={false}
      animate={{ width: open ? 304 : 0 }}
      transition={transition}
      className={cn("hidden shrink-0 overflow-hidden", breakpoint)}
    >
      <motion.div
        initial={false}
        animate={{ x: open ? 0 : side === "left" ? -24 : 24, opacity: open ? 1 : 0 }}
        transition={transition}
        className={cn(
          "h-full w-76 overflow-y-auto p-3",
          side === "left" ? "pr-0" : "pl-0",
        )}
      >
        {children}
      </motion.div>
    </motion.aside>
  );
}

function QueueList({
  data,
  onSelect,
}: {
  data: HandoffInboxData;
  onSelect: (escalation: Escalation) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const items = data.queue.filter((e) =>
    filter === "urgent"
      ? e.urgent
      : filter === "mine"
        ? e.assignee === data.operator.id
        : true,
  );
  const list = useRef<HTMLDivElement>(null);
  const focus = (index: number) =>
    list.current?.querySelectorAll<HTMLElement>('[role="option"]')[index]?.focus();
  const activeIndex = Math.max(
    0,
    items.findIndex((e) => e.id === data.activeId),
  );

  return (
    <section
      aria-label="Handoff queue"
      className="flex flex-col rounded-[1.375rem] bg-surface p-1.5"
    >
      <header className="flex items-center gap-3 pt-1.5 pr-3.5 pb-3 pl-1.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground/[0.06] text-muted-foreground">
          <Tray weight="fill" aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[0.9375rem] font-medium">Handoffs</h3>
          <p className="truncate text-xs text-muted-foreground">{data.team}</p>
        </div>
        <span className="text-[0.8125rem] text-muted-foreground tabular-nums">
          <RollingNumber value={String(data.queue.length)} /> waiting
        </span>
      </header>
      <Segmented
        label="Filter handoffs"
        size="sm"
        value={filter}
        onValueChange={setFilter}
        options={[
          { value: "all", label: "All" },
          { value: "urgent", label: "Urgent" },
          { value: "mine", label: "Mine" },
        ]}
        className="mx-1.5 mb-2 self-start"
      />
      <div
        ref={list}
        role="listbox"
        aria-label="Escalated conversations"
        className="flex flex-col gap-0.5 rounded-2xl bg-surface-inset p-1.5"
        onKeyDown={(event) => {
          const options = [
            ...(list.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []),
          ];
          const index = options.indexOf(document.activeElement as HTMLElement);
          const next =
            event.key === "ArrowDown"
              ? index + 1
              : event.key === "ArrowUp"
                ? index - 1
                : event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? options.length - 1
                    : null;
          if (next === null) return;
          event.preventDefault();
          focus(Math.min(Math.max(next, 0), options.length - 1));
        }}
      >
        <AnimatePresence initial={false}>
          {items.map((e, i) => {
            const selected = e.id === data.activeId;
            return (
              <motion.div
                key={e.id}
                layout="position"
                role="option"
                aria-selected={selected}
                tabIndex={i === activeIndex ? 0 : -1}
                onClick={() => onSelect(e)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(e);
                  }
                }}
                initial={{ opacity: 0, y: -8 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.24, ease: EASE_OUT },
                }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={spring}
                className={cn(
                  "flex cursor-default gap-2.5 rounded-xl px-2.5 py-2.5 transition-colors duration-150 outline-none focus-visible:bg-foreground/[0.06]",
                  selected ? "bg-surface-raised" : "hover:bg-foreground/[0.04]",
                )}
              >
                <Avatar
                  name={e.customer.name}
                  src={e.customer.avatar}
                  size="sm"
                  kind="person"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <p className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium">
                      {e.customer.name}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      <RollingNumber value={`${e.waiting}m`} />
                      <span className="sr-only"> waiting</span>
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{e.snippet}</p>
                  <div className="flex flex-wrap gap-1">
                    <StatusPill tone={e.tone ?? "warning"} size="sm">
                      {e.reason}
                    </StatusPill>
                    {e.urgent && (
                      <StatusPill tone="negative" size="sm" icon={Warning}>
                        Urgent
                      </StatusPill>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {items.length === 0 && (
          <EmptyState
            compact
            icon={Tray}
            title="Nothing here"
            description={
              filter === "mine" ? "You haven't taken any chats." : "No urgent chats."
            }
          />
        )}
      </div>
    </section>
  );
}

function Summary({ summary }: { summary: HandoffInboxData["summary"] }) {
  return (
    <div className="flex flex-col gap-3 text-[0.8125rem]">
      <p>
        <span className="text-muted-foreground">Wants: </span>
        {summary.wants}
      </p>
      <ul className="flex flex-col gap-1">
        {summary.tried.map((step) => (
          <li key={step} className="flex gap-2 text-muted-foreground">
            <ArrowsLeftRight
              weight="bold"
              aria-hidden="true"
              className="mt-0.5 size-3.5 shrink-0"
            />
            <span className="min-w-0">{step}</span>
          </li>
        ))}
      </ul>
      {summary.calls && summary.calls.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {summary.calls.map((call) => (
            <ToolCallBlock key={call.id} data={call} className="max-w-none" />
          ))}
        </div>
      )}
    </div>
  );
}

function CustomerDetails({ customer }: { customer: HandoffInboxData["customer"] }) {
  return (
    <div className="flex flex-col gap-3">
      <section
        aria-label="Customer"
        className="flex items-center gap-3 rounded-[1.375rem] bg-surface p-3"
      >
        <Avatar name={customer.name} src={customer.avatar} size="lg" kind="person" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.9375rem] font-medium">{customer.name}</p>
          <p className="truncate text-xs text-muted-foreground">{customer.since}</p>
          <StatusPill tone={customer.planTone ?? "brand"} size="sm" className="mt-1.5">
            {customer.plan}
          </StatusPill>
        </div>
      </section>
      <DataTable
        data={customer.orders}
        columns={customer.orderColumns}
        title="Orders"
        pageSize={4}
        searchable={false}
        className="max-w-none"
      />
      <MemoryPanel
        data={customer.notes}
        variant="compact"
        title="Notes"
        className="max-w-none"
      />
    </div>
  );
}

/** Pane as a drawer inside the screen, for widths where it doesn't fit beside the chat. */
function Drawer({
  open,
  side,
  label,
  onClose,
  children,
}: {
  open: boolean;
  side: "left" | "right";
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const off = side === "left" ? "-105%" : "105%";

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
            className={cn(
              "absolute inset-y-2 flex w-[min(20rem,calc(100%-3rem))] flex-col overflow-y-auto rounded-[1.5rem] bg-background p-1.5 outline-none",
              side === "left" ? "left-2" : "right-2",
            )}
          >
            <div className="flex justify-end px-1.5 pt-1.5">
              <IconButton
                icon={X}
                iconWeight="bold"
                label="Close"
                title={undefined}
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
