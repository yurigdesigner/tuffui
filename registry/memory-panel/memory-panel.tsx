// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import {
  ArrowUUpLeft,
  Brain,
  PencilSimple,
  PushPin,
  Trash,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button, IconButton } from "@/components/ui/action-button";
import { RollingNumber } from "@/components/ui/rolling-number";
import { Segmented } from "@/components/ui/segmented-control";
import { StatusPill } from "@/components/ui/status-pill";
import { Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { SearchField } from "@/components/ui/text-field";
import { exit as quickExit } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

export type MemoryScope = "user" | "project" | "session";

export type Memory = {
  id: string;
  text: string;
  scope: MemoryScope;
  /** Where it came from, such as "from chat · 2d ago". */
  source?: string;
  pinned?: boolean;
  /** Shows a "New" pill, for memories added during this session. */
  isNew?: boolean;
};

export type MemoryPanelProps = {
  data: Memory[];
  onEdit?: (memory: Memory, text: string) => void;
  onForget?: (memory: Memory) => void;
  /** Called when the user undoes a Forget within the undo window. */
  onUndo?: (memory: Memory) => void;
  /** How long the Undo pill stays, in ms. */
  undoMs?: number;
  /** `panel` has search and scope filters; `compact` is a dense list. */
  variant?: "panel" | "compact";
  title?: string;
  className?: string;
};

const scopes: { value: MemoryScope | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "user", label: "User" },
  { value: "project", label: "Project" },
  { value: "session", label: "Session" },
];

const scopeTone = { user: "brand", project: "neutral", session: "neutral" } as const;
// Project has no status tone of its own: a purple tint on the neutral pill.
const projectTint = "bg-[#bf5af2]/15 text-[#a347d6] dark:text-[#d08cf5]";

const spring = { type: "spring", duration: 0.35, bounce: 0 } as const;
// Exits are quicker than entrances: the user asked for it, the UI just confirms.
const exit = { ...quickExit, duration: 0.18 } as const;

export function MemoryPanel({
  data,
  onEdit,
  onForget,
  onUndo,
  undoMs = 5000,
  variant = "panel",
  title = "Memory",
  className,
}: MemoryPanelProps) {
  const compact = variant === "compact";
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<MemoryScope | "all">("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [undo, setUndo] = useState<Memory | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // The Forget is committed (onForget) only after the undo window closes.
  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => {
      onForget?.(undo);
      setUndo(null);
    }, undoMs);
    return () => clearTimeout(timer);
  }, [undo, undoMs, onForget]);

  const forget = (memory: Memory) => {
    if (undo) onForget?.(undo);
    setHidden((h) => [...h, memory.id]);
    setUndo(memory);
    setAnnouncement(`Forgot “${memory.text}”. Undo available.`);
  };

  const restore = () => {
    if (!undo) return;
    setHidden((h) => h.filter((id) => id !== undo.id));
    onUndo?.(undo);
    setAnnouncement("Memory restored");
    setUndo(null);
  };

  const q = query.trim().toLowerCase();
  const visible = data.filter(
    (m) =>
      !hidden.includes(m.id) &&
      (scope === "all" || m.scope === scope) &&
      (!q || m.text.toLowerCase().includes(q)),
  );
  const total = data.filter((m) => !hidden.includes(m.id)).length;

  return (
    <MotionConfig reducedMotion="user">
      <Shell
        aria-label={title}
        className={cn(compact ? "max-w-md" : "max-w-lg", className)}
      >
        <ShellHeader
          icon={Brain}
          title={title}
          aside={
            <span className="text-[0.8125rem] text-muted-foreground tabular-nums">
              <RollingNumber value={String(total)} />{" "}
              {total === 1 ? "memory" : "memories"}
            </span>
          }
        />

        {!compact && (
          <div className="flex flex-col gap-2 px-1.5 pb-2.5 @md:flex-row @md:items-center">
            <SearchField
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClear={() => setQuery("")}
              placeholder="Search"
              aria-label="Search memories"
              className="flex-1"
            />
            <Segmented
              label="Scope"
              options={scopes}
              value={scope}
              onValueChange={setScope}
            />
          </div>
        )}

        <Panel className="p-1.5">
          <ul className="flex flex-col">
            <AnimatePresence>
              {visible.map((memory, i) => (
                <motion.li
                  key={memory.id}
                  layout
                  // First paint cascades the rows in 40ms apart; later additions grow in.
                  initial={
                    mounted
                      ? { opacity: 0, height: 0 }
                      : { opacity: 0, y: 6, height: "auto" }
                  }
                  animate={{
                    opacity: 1,
                    height: "auto",
                    y: 0,
                    transition: { ...spring, delay: mounted ? 0 : i * 0.04 },
                  }}
                  exit={{ opacity: 0, height: 0, x: -16, transition: exit }}
                  className="overflow-hidden"
                >
                  <MemoryRow
                    memory={memory}
                    compact={compact}
                    editing={editing === memory.id}
                    onStartEdit={() => setEditing(memory.id)}
                    onCancel={() => setEditing(null)}
                    onSave={(text) => {
                      setEditing(null);
                      if (text !== memory.text) {
                        onEdit?.(memory, text);
                        setAnnouncement("Memory updated");
                      }
                    }}
                    onForget={() => forget(memory)}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          {visible.length === 0 && (
            <EmptyState
              compact
              icon={q || scope !== "all" ? MagnifyingGlass : Brain}
              title={
                q || scope !== "all" ? "No memories match" : "Nothing remembered yet"
              }
              description={
                q || scope !== "all"
                  ? "Try another search or scope."
                  : "Memories appear as the agent learns."
              }
            />
          )}
        </Panel>

        <footer className="flex min-h-11 items-center justify-between gap-3 py-1.5 pr-1.5 pl-3.5 text-[0.8125rem] text-muted-foreground">
          <p>The agent reads these at the start of every run.</p>
          <AnimatePresence>
            {undo && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6, transition: exit }}
                transition={spring}
              >
                <Button icon={ArrowUUpLeft} iconWeight="bold" onClick={restore}>
                  Undo forget
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </footer>
        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </Shell>
    </MotionConfig>
  );
}

function MemoryRow({
  memory,
  compact,
  editing,
  onStartEdit,
  onCancel,
  onSave,
  onForget,
}: {
  memory: Memory;
  compact: boolean;
  editing: boolean;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: (text: string) => void;
  onForget: () => void;
}) {
  const [draft, setDraft] = useState(memory.text);
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) return;
    const el = field.current;
    el?.focus();
    el?.setSelectionRange(el.value.length, el.value.length);
  }, [editing]);

  return (
    <div
      className={cn(
        "group flex gap-3 rounded-xl px-2.5 transition-colors focus-within:bg-foreground/[0.03] hover:bg-foreground/[0.03]",
        compact ? "py-2" : "py-2.5",
      )}
    >
      <div className="min-w-0 flex-1">
        {editing ? (
          <textarea
            ref={field}
            value={draft}
            rows={2}
            aria-label="Edit memory"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (draft.trim()) onSave(draft.trim());
              } else if (e.key === "Escape") {
                e.preventDefault();
                onCancel();
              }
            }}
            onBlur={onCancel}
            className="w-full resize-none rounded-lg bg-foreground/[0.05] px-2.5 py-1.5 text-sm outline-none"
          />
        ) : (
          <p className={cn("text-pretty", compact ? "text-[0.8125rem]" : "text-sm")}>
            {memory.text}
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <StatusPill
            size="sm"
            tone={scopeTone[memory.scope]}
            className={cn("text-xs", memory.scope === "project" && projectTint)}
          >
            {memory.scope[0].toUpperCase() + memory.scope.slice(1)}
          </StatusPill>
          {memory.isNew && (
            <StatusPill size="sm" tone="positive" className="text-xs">
              New
            </StatusPill>
          )}
          {memory.pinned && (
            <span className="inline-flex items-center gap-1">
              <PushPin weight="fill" className="size-3" aria-hidden="true" />
              Pinned
            </span>
          )}
          {memory.source && !compact && <span>{memory.source}</span>}
          {editing && <span className="ml-auto">Enter to save · Esc to cancel</span>}
        </div>
      </div>
      {!editing && (
        <div className="flex shrink-0 items-start gap-0.5 opacity-100 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
          <IconButton
            icon={PencilSimple}
            label={`Edit “${memory.text}”`}
            onClick={() => {
              setDraft(memory.text);
              onStartEdit();
            }}
            className="size-7"
          />
          <IconButton
            icon={Trash}
            label={`Forget “${memory.text}”`}
            onClick={onForget}
            className="size-7 hover:bg-negative/15 hover:text-negative"
          />
        </div>
      )}
    </div>
  );
}
