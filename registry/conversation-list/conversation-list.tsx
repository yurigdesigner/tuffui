// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import {
  Archive,
  ArrowUUpLeft,
  ChatsCircle,
  DotsThree,
  NotePencil,
  PencilSimple,
  PushPin,
  PushPinSlash,
  Trash,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { IconButton } from "@/components/ui/action-button";
import { Menu, type MenuGroup, type MenuItem } from "@/components/ui/action-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/loader";
import { Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { SearchField } from "@/components/ui/text-field";
import { enter, exit } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type Conversation = {
  id: string;
  title: string;
  /** ISO timestamp of the last message; drives the date groups. */
  updatedAt: string;
  pinned?: boolean;
  /** The agent is still working in this chat. */
  running?: boolean;
};

export type ConversationListProps = {
  data: Conversation[];
  activeId?: string;
  onSelect?: (conversation: Conversation) => void;
  onNew?: () => void;
  onRename?: (conversation: Conversation, title: string) => void;
  onPin?: (conversation: Conversation, pinned: boolean) => void;
  /** Called once the undo window closes. */
  onArchive?: (conversation: Conversation) => void;
  onDelete?: (conversation: Conversation) => void;
  undoMs?: number;
  /** `compact` lists titles only, without search or group labels. */
  variant?: "sidebar" | "compact";
  /** Reference time for the date groups (ISO). Defaults to now. */
  now?: string;
  /** Extra control in the header next to New chat, e.g. a hide-sidebar toggle. */
  headerAction?: React.ReactNode;
  /** UI strings, for translating. */
  labels?: Partial<ConversationListLabels>;
  className?: string;
};

export type ConversationGroup =
  "pinned" | "today" | "yesterday" | "week" | "older" | "recent";

export type ConversationListLabels = {
  chats: string;
  newChat: string;
  search: string;
  clearSearch: string;
  noResults: string;
  tryAnother: string;
  empty: string;
  /** Date group headings. "recent" shows only before hydration. */
  groups: Record<ConversationGroup, string>;
  /** Screen-reader name of the spinner on a running chat. */
  agentWorking: string;
  archived: (title: string) => string;
  deleted: (title: string) => string;
  undo: string;
  /** Announced to screen readers after a removal. */
  archivedStatus: (title: string) => string;
  deletedStatus: (title: string) => string;
  /** Screen-reader name of the rename field. */
  chatTitle: string;
  /** Screen-reader name of a row's menu button. */
  actionsFor: (title: string) => string;
  pin: string;
  unpin: string;
  rename: string;
  archive: string;
  delete: string;
};

const defaultLabels: ConversationListLabels = {
  chats: "Chats",
  newChat: "New chat",
  search: "Search chats",
  clearSearch: "Clear search",
  noResults: "No chats found",
  tryAnother: "Try a different search.",
  empty: "No chats yet",
  groups: {
    pinned: "Pinned",
    today: "Today",
    yesterday: "Yesterday",
    week: "Previous 7 days",
    older: "Older",
    recent: "Recent",
  },
  agentWorking: "Agent working",
  archived: (title) => `Archived “${title}”`,
  deleted: (title) => `Deleted “${title}”`,
  undo: "Undo",
  archivedStatus: (title) => `Archived ${title}. Undo available.`,
  deletedStatus: (title) => `Deleted ${title}. Undo available.`,
  chatTitle: "Chat title",
  actionsFor: (title) => `Actions for ${title}`,
  pin: "Pin",
  unpin: "Unpin",
  rename: "Rename",
  archive: "Archive",
  delete: "Delete",
};

const Labels = createContext(defaultLabels);

type Removal = { conversation: Conversation; action: "archive" | "delete" };

const DAY = 86_400_000;

function groupOf(c: Conversation, now: Date): ConversationGroup {
  if (c.pinned) return "pinned";
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const t = new Date(c.updatedAt).getTime();
  if (t >= start.getTime()) return "today";
  if (t >= start.getTime() - DAY) return "yesterday";
  if (t >= start.getTime() - 7 * DAY) return "week";
  return "older";
}
const ORDER: ConversationGroup[] = [
  "pinned",
  "today",
  "yesterday",
  "week",
  "older",
  "recent",
];

// Day groups depend on the viewer's time zone, which prerendered HTML can't know.
// Until hydration finishes everything unpinned sits under "Recent", so server and
// first client render match; the real groups appear right after.
const noop = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

export function ConversationList({
  data,
  activeId,
  onSelect,
  onNew,
  onRename,
  onPin,
  onArchive,
  onDelete,
  undoMs = 5000,
  variant = "sidebar",
  headerAction,
  now,
  labels: labelOverrides,
  className,
}: ConversationListProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const compact = variant === "compact";
  const [query, setQuery] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Removal | null>(null);
  const list = useRef<HTMLDivElement>(null);

  // Commit a removal once its undo window closes.
  useEffect(() => {
    if (!removed) return;
    const timer = setTimeout(() => {
      (removed.action === "archive" ? onArchive : onDelete)?.(removed.conversation);
      setRemoved(null);
    }, undoMs);
    return () => clearTimeout(timer);
  }, [removed, undoMs, onArchive, onDelete]);

  const remove = (conversation: Conversation, action: Removal["action"]) => {
    // A pending removal commits right away when another one starts.
    if (removed)
      (removed.action === "archive" ? onArchive : onDelete)?.(removed.conversation);
    setRemoved({ conversation, action });
    setMenu(null);
  };

  const hydrated = useHydrated();
  const ref = now ? new Date(now) : new Date();
  const visible = data
    .filter((c) => c.id !== removed?.conversation.id)
    .filter((c) => !query || c.title.toLowerCase().includes(query.toLowerCase()));
  const groups = compact
    ? [{ key: "all", name: "", items: visible }]
    : ORDER.map((key) => ({
        key,
        name: labels.groups[key],
        items: visible.filter(
          (c) => (hydrated || c.pinned ? groupOf(c, ref) : "recent") === key,
        ),
      })).filter((g) => g.items.length);

  // Arrow keys move between rows; Enter opens the focused one (native button).
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const rows = [...(list.current?.querySelectorAll<HTMLElement>("[data-row]") ?? [])];
    const i = rows.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? rows.length - 1
          : i + (e.key === "ArrowDown" ? 1 : -1);
    if (rows[next]) {
      e.preventDefault();
      rows[next].focus();
    }
  };

  return (
    <Labels.Provider value={labels}>
      <MotionConfig reducedMotion="user">
        <Shell className={cn("w-full", compact ? "max-w-60" : "max-w-72", className)}>
          <ShellHeader
            icon={ChatsCircle}
            title={labels.chats}
            aside={
              (onNew || headerAction) && (
                <span className="flex items-center gap-1">
                  {headerAction}
                  {onNew && (
                    <IconButton
                      icon={NotePencil}
                      label={labels.newChat}
                      variant="secondary"
                      onClick={onNew}
                    />
                  )}
                </span>
              )
            }
          />
          {!compact && (
            <div className="px-1.5 pb-2.5">
              <SearchField
                placeholder={labels.search}
                labels={{ clear: labels.clearSearch }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClear={() => setQuery("")}
              />
            </div>
          )}
          <Panel ref={list} onKeyDown={onKeyDown} className="flex flex-col gap-3 p-1.5">
            {groups.length === 0 && (
              <EmptyState
                compact
                icon={query ? MagnifyingGlass : ChatsCircle}
                title={query ? labels.noResults : labels.empty}
                description={query ? labels.tryAnother : undefined}
              />
            )}
            {groups.map((group) => (
              <section key={group.key} aria-label={group.name || labels.chats}>
                {group.name && (
                  <h4 className="px-2.5 pt-1 pb-1 text-xs font-medium text-muted-foreground">
                    {group.name}
                  </h4>
                )}
                <ul className="flex flex-col gap-px">
                  <AnimatePresence initial={false}>
                    {group.items.map((c) => (
                      <motion.li
                        key={c.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto", transition: enter }}
                        exit={{ opacity: 0, height: 0, transition: exit }}
                        className="group relative"
                      >
                        {renaming === c.id ? (
                          <RenameField
                            initial={c.title}
                            onDone={(title) => {
                              setRenaming(null);
                              if (title && title !== c.title) onRename?.(c, title);
                            }}
                          />
                        ) : (
                          <button
                            type="button"
                            data-row
                            aria-current={c.id === activeId ? "page" : undefined}
                            onClick={() => onSelect?.(c)}
                            className={cn(
                              "flex h-9 w-full items-center gap-2 rounded-xl ps-2.5 pe-9 text-start text-[0.8125rem] transition-[background-color,scale] duration-150 ease-out active:scale-[0.99]",
                              c.id === activeId
                                ? "bg-surface-raised font-medium"
                                : "text-foreground/80 hover:bg-foreground/[0.04]",
                            )}
                          >
                            <span className="min-w-0 flex-1 truncate">{c.title}</span>
                            {c.running && (
                              <Spinner
                                size="sm"
                                label={labels.agentWorking}
                                className="text-brand"
                              />
                            )}
                          </button>
                        )}
                        {renaming !== c.id && (
                          <RowMenu
                            conversation={c}
                            open={menu === c.id}
                            onOpenChange={(open) => setMenu(open ? c.id : null)}
                            onPin={onPin && (() => (onPin(c, !c.pinned), setMenu(null)))}
                            onRename={
                              onRename && (() => (setRenaming(c.id), setMenu(null)))
                            }
                            onArchive={onArchive && (() => remove(c, "archive"))}
                            onDelete={onDelete && (() => remove(c, "delete"))}
                          />
                        )}
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </section>
            ))}
          </Panel>
          <AnimatePresence>
            {removed && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0, transition: enter }}
                exit={{ opacity: 0, transition: exit }}
                className="flex items-center gap-2 px-3 pt-2.5 pb-1.5 text-[0.8125rem]"
              >
                <span className="min-w-0 flex-1 truncate text-muted-foreground">
                  {(removed.action === "archive" ? labels.archived : labels.deleted)(
                    removed.conversation.title,
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setRemoved(null)}
                  className="flex h-7 shrink-0 items-center gap-1 rounded-full bg-surface-raised px-2.5 font-medium transition-[background-color,scale] duration-150 ease-out active:scale-[0.97]"
                >
                  <ArrowUUpLeft
                    weight="bold"
                    className="size-3.5 rtl:-scale-x-100"
                    aria-hidden="true"
                  />
                  {labels.undo}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <p role="status" aria-live="polite" className="sr-only">
            {removed
              ? (removed.action === "archive"
                  ? labels.archivedStatus
                  : labels.deletedStatus)(removed.conversation.title)
              : ""}
          </p>
        </Shell>
      </MotionConfig>
    </Labels.Provider>
  );
}

function RenameField({
  initial,
  onDone,
}: {
  initial: string;
  onDone: (title: string | null) => void;
}) {
  const labels = useContext(Labels);
  const [value, setValue] = useState(initial);
  return (
    <input
      aria-label={labels.chatTitle}
      autoFocus
      dir="auto"
      value={value}
      onFocus={(e) => e.target.select()}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onDone(value.trim())}
      onKeyDown={(e) => {
        if (e.key === "Enter") onDone(value.trim());
        if (e.key === "Escape") onDone(null);
      }}
      className="h-9 w-full rounded-xl bg-foreground/[0.06] px-2.5 text-[0.8125rem] outline-none"
    />
  );
}

function RowMenu({
  conversation,
  open,
  onOpenChange,
  onPin,
  onRename,
  onArchive,
  onDelete,
}: {
  conversation: Conversation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPin?: () => void;
  onRename?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}) {
  const labels = useContext(Labels);
  const main: MenuItem[] = [
    onPin && {
      id: "pin",
      label: conversation.pinned ? labels.unpin : labels.pin,
      icon: conversation.pinned ? PushPinSlash : PushPin,
      onSelect: onPin,
    },
    onRename && {
      id: "rename",
      label: labels.rename,
      icon: PencilSimple,
      onSelect: onRename,
    },
    onArchive && {
      id: "archive",
      label: labels.archive,
      icon: Archive,
      onSelect: onArchive,
    },
  ].filter((item): item is Exclude<typeof item, undefined> => !!item);
  const groups: MenuGroup[] = [
    { id: "main", items: main },
    ...(onDelete
      ? [
          {
            id: "danger",
            items: [
              {
                id: "delete",
                label: labels.delete,
                icon: Trash,
                destructive: true,
                onSelect: onDelete,
              },
            ],
          },
        ]
      : []),
  ].filter((group) => group.items.length);

  if (!groups.length) return null;
  return (
    <div className="absolute end-1 top-1/2 -translate-y-1/2">
      <Menu
        open={open}
        onOpenChange={onOpenChange}
        align="end"
        groups={groups}
        trigger={
          <IconButton
            icon={DotsThree}
            iconWeight="bold"
            label={labels.actionsFor(conversation.title)}
            className={cn(
              "size-7 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100",
              open && "opacity-100",
            )}
          />
        }
      />
    </div>
  );
}
