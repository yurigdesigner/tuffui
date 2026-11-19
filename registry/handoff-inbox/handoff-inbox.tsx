// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
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
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button, IconButton } from "@/components/ui/action-button";
import { AgentComposer, type AgentComposerLabels } from "@/components/ui/agent-composer";
import { Avatar, type AvatarLabels } from "@/components/ui/agent-avatar";
import {
  ChatThread,
  type ChatThreadLabels,
  type ThreadMessage,
} from "@/components/ui/chat-thread";
import {
  DataTable,
  type DataColumn,
  type DataRow,
  type DataTableLabels,
} from "@/components/ui/data-table";
import { Collapsible } from "@/components/ui/disclosure";
import { EmptyState } from "@/components/ui/empty-state";
import { KeyCombo } from "@/components/ui/key-hint";
import {
  MemoryPanel,
  type Memory,
  type MemoryPanelLabels,
} from "@/components/ui/memory-panel";
import {
  PromptSuggestions,
  type PromptSuggestion,
  type PromptSuggestionsLabels,
} from "@/components/ui/prompt-suggestions";
import { RollingNumber } from "@/components/ui/rolling-number";
import { Segmented } from "@/components/ui/segmented-control";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import {
  ToolCallBlock,
  type ToolCall,
  type ToolCallBlockLabels,
} from "@/components/ui/tool-call-block";
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

export type HandoffInboxLabels = {
  queue: string;
  openQueue: string;
  hideQueue: string;
  showQueue: string;
  details: string;
  hideDetails: string;
  showDetails: string;
  /** Header line under the customer's name, per status. */
  holding: (bot: string) => string;
  tookOver: (bot: string) => string;
  backWith: (bot: string) => string;
  handBack: string;
  takeOver: string;
  /** Author name of the operator's own messages. */
  you: (operator: string) => string;
  /** Author name of the handoff marker. */
  handoff: string;
  summary: (bot: string) => string;
  tried: (count: number) => string;
  wants: string;
  draftedBy: (bot: string) => string;
  replyTo: (firstName: string) => string;
  /** Pinned bar while the bot holds the chat. */
  onTheWay: (bot: string, firstName: string) => string;
  answeringAgain: (bot: string) => string;
  handoffs: string;
  /** Queue count; `count` is the animated number. */
  waitingCount: (count: ReactNode, total: number) => ReactNode;
  /** Wait time on a queue item; `count` is the animated number. */
  minutes: (count: ReactNode, minutes: number) => ReactNode;
  /** Read after the wait time. */
  waiting: string;
  filter: string;
  filters: Record<Filter, string>;
  conversations: string;
  urgent: string;
  nothingHere: string;
  noneMine: string;
  noneUrgent: string;
  customer: string;
  orders: string;
  notes: string;
  close: string;
  /** Backdrop button of a drawer. */
  closePane: (pane: string) => string;
  /** Passed to the child components. */
  thread?: Partial<ChatThreadLabels>;
  composer?: Partial<AgentComposerLabels>;
  suggestions?: Partial<PromptSuggestionsLabels>;
  toolCall?: Partial<ToolCallBlockLabels>;
  table?: Partial<DataTableLabels>;
  memory?: Partial<MemoryPanelLabels>;
  avatar?: Partial<AvatarLabels>;
};

const defaultLabels: HandoffInboxLabels = {
  queue: "Handoff queue",
  openQueue: "Open queue",
  hideQueue: "Hide queue",
  showQueue: "Show queue",
  details: "Customer details",
  hideDetails: "Hide details",
  showDetails: "Show details",
  holding: (bot) => `${bot} is holding the chat`,
  tookOver: (bot) => `You took over from ${bot}`,
  backWith: (bot) => `Back with ${bot}`,
  handBack: "Hand back",
  takeOver: "Take over",
  you: (operator) => `${operator} (you)`,
  handoff: "Handoff",
  summary: (bot) => `${bot}'s summary`,
  tried: (count) => `${count} tried`,
  wants: "Wants: ",
  draftedBy: (bot) => `Drafted by ${bot}`,
  replyTo: (firstName) => `Reply to ${firstName}…`,
  onTheWay: (bot, firstName) => `${bot} told ${firstName} a person is on the way.`,
  answeringAgain: (bot) => `${bot} is answering again. Take over any time.`,
  handoffs: "Handoffs",
  waitingCount: (count) => <>{count} waiting</>,
  minutes: (count) => <>{count}m</>,
  waiting: "waiting",
  filter: "Filter handoffs",
  filters: { all: "All", urgent: "Urgent", mine: "Mine" },
  conversations: "Escalated conversations",
  urgent: "Urgent",
  nothingHere: "Nothing here",
  noneMine: "You haven't taken any chats.",
  noneUrgent: "No urgent chats.",
  customer: "Customer",
  orders: "Orders",
  notes: "Notes",
  close: "Close",
  closePane: (pane) => `Close ${pane.toLowerCase()}`,
};

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
  /** Your own UI strings, plus labels for the child components (`thread`, `composer`…). */
  labels?: Partial<HandoffInboxLabels>;
  /** Intl locale for message times. */
  locale?: string;
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
 * Where people take over from a support bot. Escalations queue at the start side,
 * the conversation with the bot's summary in the middle, customer details at the
 * end side. Lays out against its own width: panes collapse into drawers below 56rem
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
  labels: labelOverrides,
  locale,
  className,
}: HandoffInboxProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const { operator, bot, customer } = data;
  const root = useRef<HTMLDivElement>(null);
  const [rtl, setRtl] = useState(false);
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
      if (root.current) setRtl(getComputedStyle(root.current).direction === "rtl");
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
    // People on this side (bot and operator) sit at the end; the customer at the start.
    role: m.from === "bot" || m.from === "operator" ? "user" : "assistant",
    at: m.at,
    author:
      m.from === "bot"
        ? bot.name
        : m.from === "operator"
          ? labels.you(operator.name)
          : m.from === "handoff"
            ? labels.handoff
            : customer.name,
    // The thread picks each message's direction from its text; rich content follows
    // the screen's direction instead.
    content:
      typeof m.content === "string" ? (
        m.content
      ) : (
        <div dir={rtl ? "rtl" : "ltr"}>{m.content}</div>
      ),
  }));
  const byId = new Map(data.messages.map((m) => [m.id, m.from]));

  const queueList = (
    <QueueList
      data={data}
      labels={labels}
      onSelect={(escalation) => {
        setDrawer(null);
        onSelect?.(escalation);
      }}
    />
  );
  const detailsPanel = <CustomerDetails customer={customer} labels={labels} />;

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={root}
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
          label={labels.queue}
          side="start"
          rtl={rtl}
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
              label={labels.openQueue}
              title={undefined}
              onClick={() => setDrawer("queue")}
              className="@4xl:hidden"
            />
            <PaneToggle
              open={queue.open}
              what="queue"
              label={queue.open ? labels.hideQueue : labels.showQueue}
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
                  ? labels.holding(bot.name)
                  : status === "active"
                    ? labels.tookOver(bot.name)
                    : labels.backWith(bot.name)}
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
            <div className="ms-auto flex shrink-0 items-center gap-1.5">
              {/* Take over lives in the pinned bar; once in, hand back from here. */}
              {active && (
                <Button size="sm" icon={Robot} onClick={onHandBack}>
                  {labels.handBack}
                </Button>
              )}
              <IconButton
                icon={IdentificationCard}
                label={labels.details}
                title={undefined}
                onClick={() => setDrawer("details")}
                className="@6xl:hidden"
              />
              <PaneToggle
                open={details.open}
                what="details"
                label={details.open ? labels.hideDetails : labels.showDetails}
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
              locale={locale}
              labels={labels.thread}
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
                      labels={labels.avatar}
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
                  title={labels.summary(bot.name)}
                  icon={Robot}
                  meta={labels.tried(data.summary.tried.length)}
                  open={summaryOpen}
                  onOpenChange={setSummaryOpen}
                >
                  <Summary summary={data.summary} labels={labels} />
                </Collapsible>

                {active ? (
                  <>
                    {data.suggestions && data.suggestions.length > 0 && !draft && (
                      <PromptSuggestions
                        data={data.suggestions}
                        variant="chips"
                        heading={labels.draftedBy(bot.name)}
                        onSelect={(_, prompt) => setDraft(prompt)}
                        labels={labels.suggestions}
                        className="max-w-none"
                      />
                    )}
                    <AgentComposer
                      value={draft}
                      onValueChange={setDraft}
                      showModes={false}
                      allowAttachments={false}
                      onSubmit={(message) => send(message.text)}
                      placeholder={labels.replyTo(customer.name.split(" ")[0])}
                      labels={labels.composer}
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
                        ? labels.onTheWay(bot.name, customer.name.split(" ")[0])
                        : labels.answeringAgain(bot.name)}
                    </p>
                    <Button
                      size="sm"
                      variant="primary"
                      icon={UserCircle}
                      onClick={onTakeOver}
                    >
                      {labels.takeOver}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Pane
          id={detailsId}
          label={labels.details}
          side="end"
          rtl={rtl}
          {...details}
          breakpoint="@6xl:block"
        >
          {detailsPanel}
        </Pane>

        <Drawer
          open={drawer !== null}
          side={drawer === "details" ? "end" : "start"}
          rtl={rtl}
          label={drawer === "details" ? labels.details : labels.queue}
          labels={labels}
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
  label,
  controls,
  shortcut,
  onToggle,
  className,
}: {
  open: boolean;
  what: "queue" | "details";
  label: string;
  controls: string;
  shortcut?: boolean;
  onToggle: (fromKeyboard: boolean) => void;
  className?: string;
}) {
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
        // The icon's panel points at the pane it toggles, so it mirrors with the layout.
        className={cn(
          what === "details" ? "-scale-x-100 rtl:scale-x-100" : "rtl:-scale-x-100",
          className,
        )}
      />
    </Tooltip>
  );
}

/** A side pane at wide widths: its width animates to 0 when hidden. */
function Pane({
  id,
  label,
  side,
  rtl,
  open,
  instant,
  breakpoint,
  children,
}: {
  id: string;
  label: string;
  side: "start" | "end";
  rtl: boolean;
  open: boolean;
  instant: boolean;
  breakpoint: string;
  children: React.ReactNode;
}) {
  const transition = instant ? instantTransition : spring;
  // Slides toward its own edge: the start edge is the right one in right-to-left layouts.
  const off = (side === "start") !== rtl ? -24 : 24;
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
        animate={{ x: open ? 0 : off, opacity: open ? 1 : 0 }}
        transition={transition}
        className={cn(
          "h-full w-76 overflow-y-auto p-3",
          side === "start" ? "pe-0" : "ps-0",
        )}
      >
        {children}
      </motion.div>
    </motion.aside>
  );
}

function QueueList({
  data,
  labels,
  onSelect,
}: {
  data: HandoffInboxData;
  labels: HandoffInboxLabels;
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
      aria-label={labels.queue}
      className="flex flex-col rounded-[1.375rem] bg-surface p-1.5"
    >
      <header className="flex items-center gap-3 ps-1.5 pe-3.5 pt-1.5 pb-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground/[0.06] text-muted-foreground">
          <Tray weight="fill" aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[0.9375rem] font-medium">{labels.handoffs}</h3>
          <p className="truncate text-xs text-muted-foreground">{data.team}</p>
        </div>
        <span className="text-[0.8125rem] text-muted-foreground tabular-nums">
          {labels.waitingCount(
            <RollingNumber value={String(data.queue.length)} />,
            data.queue.length,
          )}
        </span>
      </header>
      <Segmented
        label={labels.filter}
        size="sm"
        value={filter}
        onValueChange={setFilter}
        options={[
          { value: "all", label: labels.filters.all },
          { value: "urgent", label: labels.filters.urgent },
          { value: "mine", label: labels.filters.mine },
        ]}
        className="mx-1.5 mb-2 self-start"
      />
      <div
        ref={list}
        role="listbox"
        aria-label={labels.conversations}
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
                      {labels.minutes(
                        <RollingNumber value={String(e.waiting)} />,
                        e.waiting,
                      )}
                      <span className="sr-only"> {labels.waiting}</span>
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{e.snippet}</p>
                  <div className="flex flex-wrap gap-1">
                    <StatusPill tone={e.tone ?? "warning"} size="sm">
                      {e.reason}
                    </StatusPill>
                    {e.urgent && (
                      <StatusPill tone="negative" size="sm" icon={Warning}>
                        {labels.urgent}
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
            title={labels.nothingHere}
            description={filter === "mine" ? labels.noneMine : labels.noneUrgent}
          />
        )}
      </div>
    </section>
  );
}

function Summary({
  summary,
  labels,
}: {
  summary: HandoffInboxData["summary"];
  labels: HandoffInboxLabels;
}) {
  return (
    <div className="flex flex-col gap-3 text-[0.8125rem]">
      <p>
        <span className="text-muted-foreground">{labels.wants}</span>
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
            <ToolCallBlock
              key={call.id}
              data={call}
              labels={labels.toolCall}
              className="max-w-none"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CustomerDetails({
  customer,
  labels,
}: {
  customer: HandoffInboxData["customer"];
  labels: HandoffInboxLabels;
}) {
  return (
    <div className="flex flex-col gap-3">
      <section
        aria-label={labels.customer}
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
        title={labels.orders}
        pageSize={4}
        searchable={false}
        labels={labels.table}
        className="max-w-none"
      />
      <MemoryPanel
        data={customer.notes}
        variant="compact"
        title={labels.notes}
        labels={labels.memory}
        className="max-w-none"
      />
    </div>
  );
}

/** Pane as a drawer inside the screen, for widths where it doesn't fit beside the chat. */
function Drawer({
  open,
  side,
  rtl,
  label,
  labels,
  onClose,
  children,
}: {
  open: boolean;
  side: "start" | "end";
  rtl: boolean;
  label: string;
  labels: HandoffInboxLabels;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  // Enters from its own edge: the start edge is the right one in right-to-left layouts.
  const off = (side === "start") !== rtl ? "-105%" : "105%";

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
            aria-label={labels.closePane(label)}
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
              side === "start" ? "start-2" : "end-2",
            )}
          >
            <div className="flex justify-end px-1.5 pt-1.5">
              <IconButton
                icon={X}
                iconWeight="bold"
                label={labels.close}
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
