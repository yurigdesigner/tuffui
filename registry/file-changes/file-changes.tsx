"use client";

import { CaretRight, Check, Folder } from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/action-button";
import { RollingNumber } from "@/components/ui/rolling-number";
import { Segmented } from "@/components/ui/segmented-control";
import { Inset, Panel, Shell } from "@/components/ui/surface";
import { enter } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type FileStatus = "added" | "modified" | "deleted" | "renamed";

export type DiffLine = { type: "add" | "remove" | "context"; text: string };

export type DiffHunk = {
  id: string;
  oldStart: number;
  newStart: number;
  lines: DiffLine[];
};

export type FileChange = {
  id: string;
  path: string;
  /** Previous path for renamed files. */
  from?: string;
  status: FileStatus;
  hunks: DiffHunk[];
};

/** Hunk ids to keep, per file id. Hunks left out are reverted. */
export type HunkSelection = Record<string, string[]>;

export type FileChangesProps = {
  data: FileChange[];
  /** `split` shows a file tree beside the hunks; `stacked` puts file tabs on top. */
  view?: "split" | "stacked";
  defaultSelectedId?: string;
  /** Controls the open file. */
  selectedId?: string;
  onSelectedChange?: (fileId: string) => void;
  onHunkChange?: (fileId: string, hunkId: string, keep: boolean) => void;
  onApply: (selection: HunkSelection) => void;
  onDiscard?: () => void;
  /** Puts the Apply button in its loading state. */
  applying?: boolean;
  className?: string;
};

const statuses = {
  added: { letter: "A", label: "Added", className: "bg-positive/15 text-positive" },
  modified: { letter: "M", label: "Modified", className: "bg-brand/15 text-brand" },
  deleted: { letter: "D", label: "Deleted", className: "bg-negative/15 text-negative" },
  renamed: { letter: "R", label: "Renamed", className: "bg-[#bf5af2]/15 text-[#bf5af2]" },
} as const;

const key = (fileId: string, hunkId: string) => `${fileId}:${hunkId}`;
const split = (path: string) => {
  const i = path.lastIndexOf("/");
  return { dir: i < 0 ? "." : path.slice(0, i), name: path.slice(i + 1) };
};
const counts = (hunks: DiffHunk[]) =>
  hunks.reduce(
    (n, h) => {
      for (const l of h.lines) {
        if (l.type === "add") n.add++;
        if (l.type === "remove") n.remove++;
      }
      return n;
    },
    { add: 0, remove: 0 },
  );

function StatusBadge({ status }: { status: FileStatus }) {
  const s = statuses[status];
  return (
    <span
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded-[5px] font-mono text-[0.625rem] font-semibold",
        s.className,
      )}
    >
      <span aria-hidden="true">{s.letter}</span>
      <span className="sr-only">{s.label}</span>
    </span>
  );
}

function Counts({ hunks }: { hunks: DiffHunk[] }) {
  const { add, remove } = counts(hunks);
  return (
    <span className="shrink-0 font-mono text-[0.6875rem] tabular-nums">
      {add > 0 && <span className="text-positive">+{add}</span>}
      {add > 0 && remove > 0 && " "}
      {remove > 0 && <span className="text-negative">−{remove}</span>}
    </span>
  );
}

function Hunk({
  hunk,
  keep,
  onChange,
}: {
  hunk: DiffHunk;
  keep: boolean;
  onChange: (keep: boolean) => void;
}) {
  let oldNo = hunk.oldStart;
  let newNo = hunk.newStart;
  return (
    <Inset
      role="group"
      aria-label={`Lines from ${hunk.newStart}`}
      className="overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 py-1.5 pr-1.5 pl-3">
        <span className="font-mono text-[0.6875rem] text-muted-foreground">
          Line {hunk.newStart}
          {!keep && <span className="ml-2 text-warning">· Reverted</span>}
        </span>
        <Segmented
          label="Keep or revert this hunk"
          className="h-7 text-xs"
          options={[
            { value: "keep", label: "Keep" },
            { value: "revert", label: "Revert" },
          ]}
          value={keep ? "keep" : "revert"}
          onValueChange={(v) => onChange(v === "keep")}
        />
      </div>
      <div
        className={cn(
          "overflow-hidden pb-1.5 font-mono text-xs leading-5 transition-opacity duration-200 ease-out",
          !keep && "opacity-40",
        )}
      >
        {hunk.lines.map((line, i) => {
          const o = line.type !== "add" ? oldNo++ : null;
          const n = line.type !== "remove" ? newNo++ : null;
          return (
            <div
              key={i}
              className={cn(
                "grid grid-cols-[2.25rem_2.25rem_1rem_minmax(0,1fr)] pr-4",
                line.type === "add" && "bg-positive/10",
                line.type === "remove" && "bg-negative/10",
              )}
            >
              <span className="pr-2 text-right text-muted-foreground/70 select-none">
                {o}
              </span>
              <span className="pr-2 text-right text-muted-foreground/70 select-none">
                {n}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "select-none",
                  line.type === "add" && "text-positive",
                  line.type === "remove" && "text-negative",
                )}
              >
                {line.type === "add" ? "+" : line.type === "remove" ? "−" : " "}
              </span>
              {/* Long lines wrap under the code column, so the numbers act as a hanging indent. */}
              <span className="[overflow-wrap:anywhere] whitespace-pre-wrap">
                <span className="sr-only">
                  {line.type === "add"
                    ? "Added: "
                    : line.type === "remove"
                      ? "Removed: "
                      : ""}
                </span>
                {line.text}
              </span>
            </div>
          );
        })}
      </div>
    </Inset>
  );
}

export function FileChanges({
  data,
  view = "split",
  defaultSelectedId,
  selectedId: controlledId,
  onSelectedChange,
  onHunkChange,
  onApply,
  onDiscard,
  applying = false,
  className,
}: FileChangesProps) {
  const [ownId, setOwnId] = useState(defaultSelectedId ?? data[0]?.id);
  const selectedId = controlledId ?? ownId;
  const setSelectedId = (id: string) => {
    setOwnId(id);
    onSelectedChange?.(id);
  };
  const [reverted, setReverted] = useState<string[]>([]);
  // Files opened from the keyboard swap in instantly; clicks animate.
  const [keyboard, setKeyboard] = useState(false);
  const [closed, setClosed] = useState<string[]>([]);
  const [focusKey, setFocusKey] = useState<string>();
  const [message, setMessage] = useState("");
  const tree = useRef<HTMLUListElement>(null);

  const selected = data.find((f) => f.id === selectedId) ?? data[0];
  const total = data.reduce((n, f) => n + f.hunks.length, 0);
  const kept = total - reverted.length;
  const keptFiles = data.filter((f) =>
    f.hunks.some((h) => !reverted.includes(key(f.id, h.id))),
  );

  const folders = useMemo(() => {
    const map = new Map<string, FileChange[]>();
    for (const f of data)
      map.set(split(f.path).dir, [...(map.get(split(f.path).dir) ?? []), f]);
    return [...map.entries()];
  }, [data]);

  // Visible tree rows in order, for arrow-key navigation.
  const rows = folders.flatMap(([dir, files]) => [
    `dir:${dir}`,
    ...(closed.includes(dir) ? [] : files.map((f) => `file:${f.id}`)),
  ]);
  const active = focusKey && rows.includes(focusKey) ? focusKey : `file:${selected?.id}`;

  const setKeep = (fileId: string, hunkId: string, keep: boolean) => {
    const k = key(fileId, hunkId);
    setReverted((r) => (keep ? r.filter((x) => x !== k) : r.includes(k) ? r : [...r, k]));
    setMessage(keep ? "Hunk kept" : "Hunk reverted");
    onHunkChange?.(fileId, hunkId, keep);
  };

  const apply = () => {
    const selection: HunkSelection = {};
    for (const f of data)
      selection[f.id] = f.hunks
        .filter((h) => !reverted.includes(key(f.id, h.id)))
        .map((h) => h.id);
    setMessage(`Applying ${kept} of ${total} hunks`);
    onApply(selection);
  };

  const onTreeKey = (e: KeyboardEvent) => {
    const i = rows.indexOf(active);
    const move = (to: number) => {
      const next = rows[Math.max(0, Math.min(rows.length - 1, to))];
      setFocusKey(next);
      tree.current?.querySelector<HTMLElement>(`[data-key="${next}"]`)?.focus();
    };
    const sep = active.indexOf(":");
    const type = active.slice(0, sep);
    const id = active.slice(sep + 1);
    if (e.key === "ArrowDown") move(i + 1);
    else if (e.key === "ArrowUp") move(i - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(rows.length - 1);
    else if (type === "dir" && (e.key === "ArrowLeft" || e.key === "ArrowRight"))
      setClosed((c) => (e.key === "ArrowLeft" ? [...c, id] : c.filter((d) => d !== id)));
    else if (type === "file" && (e.key === "Enter" || e.key === " ")) {
      setKeyboard(true);
      setSelectedId(id);
    } else return;
    e.preventDefault();
  };

  const fileTree = (
    <ul
      ref={tree}
      role="tree"
      aria-label="Changed files"
      onKeyDown={onTreeKey}
      className="flex flex-col gap-0.5 p-1.5 text-[0.8125rem]"
    >
      {folders.map(([dir, files]) => {
        const open = !closed.includes(dir);
        return (
          <li
            key={dir}
            role="treeitem"
            aria-expanded={open}
            aria-selected={false}
            data-key={`dir:${dir}`}
            tabIndex={active === `dir:${dir}` ? 0 : -1}
            onFocus={(e) => e.target === e.currentTarget && setFocusKey(`dir:${dir}`)}
            className="rounded-xl outline-offset-[-2px]"
          >
            <span
              onClick={() =>
                setClosed((c) => (open ? [...c, dir] : c.filter((d) => d !== dir)))
              }
              className="flex cursor-pointer items-center gap-1.5 rounded-xl px-2 py-1.5 text-muted-foreground hover:bg-foreground/[0.04]"
            >
              <CaretRight
                weight="bold"
                aria-hidden="true"
                className={cn(
                  "size-3.5 transition-transform duration-150 ease-out",
                  open && "rotate-90",
                )}
              />
              <Folder weight="fill" aria-hidden="true" className="size-3.5" />
              <span className="truncate font-mono text-xs">
                {dir === "." ? "root" : dir}
              </span>
            </span>
            {open && (
              <ul role="group" className="flex flex-col gap-0.5 pl-4">
                {files.map((f) => (
                  <li
                    key={f.id}
                    role="treeitem"
                    aria-selected={f.id === selected?.id}
                    data-key={`file:${f.id}`}
                    tabIndex={active === `file:${f.id}` ? 0 : -1}
                    onFocus={(e) => {
                      e.stopPropagation();
                      setFocusKey(`file:${f.id}`);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setKeyboard(false);
                      setSelectedId(f.id);
                    }}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 outline-offset-[-2px] transition-colors duration-150",
                      f.id === selected?.id
                        ? "bg-surface-raised"
                        : "hover:bg-foreground/[0.04]",
                    )}
                  >
                    <StatusBadge status={f.status} />
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate",
                        f.status === "deleted" && "line-through decoration-foreground/30",
                      )}
                    >
                      {split(f.path).name}
                    </span>
                    <Counts hunks={f.hunks} />
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );

  const fileTabs = (
    <div
      role="tablist"
      aria-label="Changed files"
      className="flex [scrollbar-width:none] gap-1 overflow-x-auto px-1 pb-1.5 [&::-webkit-scrollbar]:hidden"
    >
      {data.map((f) => (
        <button
          key={f.id}
          type="button"
          role="tab"
          aria-selected={f.id === selected?.id}
          onClick={() => {
            setKeyboard(false);
            setSelectedId(f.id);
          }}
          className={cn(
            "flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] transition-[background-color,color,scale] duration-150 ease-out active:scale-[0.97]",
            f.id === selected?.id
              ? "bg-surface-raised"
              : "text-muted-foreground hover:bg-foreground/[0.04]",
          )}
        >
          <StatusBadge status={f.status} />
          {split(f.path).name}
          <Counts hunks={f.hunks} />
        </button>
      ))}
    </div>
  );

  const hunks = selected && (
    <Panel className="min-w-0 p-2">
      <p className="flex items-center gap-2 px-2 pt-1 pb-2.5 font-mono text-xs text-muted-foreground">
        <span className="truncate text-foreground">{selected.path}</span>
        {selected.from && <span className="truncate">from {selected.from}</span>}
      </p>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={selected.id}
          initial={keyboard ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0, transition: enter }}
          exit={{ opacity: 0, transition: { duration: keyboard ? 0 : 0.12 } }}
          className="flex flex-col gap-2"
        >
          {selected.hunks.map((h) => (
            <Hunk
              key={h.id}
              hunk={h}
              keep={!reverted.includes(key(selected.id, h.id))}
              onChange={(keep) => setKeep(selected.id, h.id, keep)}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </Panel>
  );

  return (
    <MotionConfig reducedMotion="user">
      <Shell
        aria-label="File changes"
        className={cn(view === "split" ? "max-w-3xl" : "max-w-xl", className)}
      >
        {data.length === 0 ? (
          <Panel className="px-4 py-10 text-center text-[0.8125rem] text-muted-foreground">
            No changes to review
          </Panel>
        ) : view === "split" ? (
          <div className="grid gap-1.5 @2xl:grid-cols-[13rem_minmax(0,1fr)]">
            {fileTree}
            {hunks}
          </div>
        ) : (
          <>
            {fileTabs}
            {hunks}
          </>
        )}
        <div className="flex flex-wrap items-center gap-3 py-1.5 pr-0.5 pl-3 text-[0.8125rem]">
          <p className="mr-auto text-muted-foreground">
            Applying{" "}
            <RollingNumber
              className="font-mono text-foreground"
              value={`${kept} of ${total}`}
            />{" "}
            hunks across <RollingNumber value={String(keptFiles.length)} />{" "}
            {keptFiles.length === 1 ? "file" : "files"}
          </p>
          {onDiscard && (
            <Button variant="quiet" onClick={onDiscard} disabled={applying}>
              Discard all
            </Button>
          )}
          <Button
            variant="primary"
            icon={Check}
            iconWeight="bold"
            loading={applying}
            onClick={apply}
            disabled={kept === 0}
            className="px-4"
          >
            {applying ? "Applying…" : "Apply"}
          </Button>
        </div>
        <p role="status" aria-live="polite" className="sr-only">
          {message}
        </p>
      </Shell>
    </MotionConfig>
  );
}
