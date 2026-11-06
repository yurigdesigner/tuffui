// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import {
  ArrowsInSimple,
  ArrowsOutSimple,
  BracketsCurly,
  CaretRight,
  Check,
  Copy,
} from "@phosphor-icons/react";
import { MotionConfig } from "motion/react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { IconButton } from "@/components/ui/action-button";
import { CodeBlock } from "@/components/ui/code-block";
import { Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { SearchField } from "@/components/ui/text-field";
import { cn } from "@/lib/utils";

export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type JsonViewerProps = {
  data: JsonValue;
  title?: string;
  view?: "tree" | "raw";
  /** Levels expanded on first render. */
  defaultDepth?: number;
  onCopy?: (kind: "path" | "value", text: string) => void;
  className?: string;
};

type Node = {
  path: string;
  key: string | number | null;
  value: JsonValue;
  depth: number;
  parent: string | null;
};

const isBranch = (v: JsonValue): v is JsonValue[] | { [k: string]: JsonValue } =>
  v !== null && typeof v === "object";

const childPath = (parent: string, key: string | number) =>
  typeof key === "number"
    ? `${parent}[${key}]`
    : /^[A-Za-z_$][\w$]*$/.test(key)
      ? `${parent}.${key}`
      : `${parent}[${JSON.stringify(key)}]`;

function walk(
  value: JsonValue,
  path = "$",
  key: Node["key"] = null,
  depth = 0,
  parent: string | null = null,
): Node[] {
  const node: Node = { path, key, value, depth, parent };
  if (!isBranch(value)) return [node];
  const entries: [string | number, JsonValue][] = Array.isArray(value)
    ? value.map((v, i) => [i, v])
    : Object.entries(value);
  return [
    node,
    ...entries.flatMap(([k, v]) => walk(v, childPath(path, k), k, depth + 1, path)),
  ];
}

const valueClass = (v: JsonValue) =>
  typeof v === "string"
    ? "text-[#1a7f37] dark:text-[#7ee787]"
    : typeof v === "number"
      ? "text-[#b45309] dark:text-[#ffb757]"
      : typeof v === "boolean"
        ? "text-[#a626a4] dark:text-[#ff7ab2]"
        : "text-muted-foreground";

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-warning/30 text-inherit">
        {text.slice(i, i + query.length)}
      </mark>
      {text.slice(i + query.length)}
    </>
  );
}

export function JsonViewer({
  data,
  title = "Output",
  view = "tree",
  defaultDepth = 1,
  onCopy,
  className,
}: JsonViewerProps) {
  const nodes = useMemo(() => walk(data), [data]);
  const byPath = useMemo(() => new Map(nodes.map((n) => [n.path, n])), [nodes]);
  const [expanded, setExpanded] = useState<Set<string>>(
    () =>
      new Set(
        nodes
          .filter((n) => isBranch(n.value) && n.depth < defaultDepth)
          .map((n) => n.path),
      ),
  );
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState("$");
  const [copied, setCopied] = useState<string | null>(null);
  const rows = useRef(new Map<string, HTMLDivElement>());
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const matches = useMemo(() => {
    if (!query) return new Set<string>();
    const q = query.toLowerCase();
    return new Set(
      nodes
        .filter(
          (n) =>
            String(n.key ?? "")
              .toLowerCase()
              .includes(q) ||
            (!isBranch(n.value) && String(n.value).toLowerCase().includes(q)),
        )
        .map((n) => n.path),
    );
  }, [nodes, query]);

  // While searching, every ancestor of a match is open.
  const open = useMemo(() => {
    if (!query) return expanded;
    const next = new Set(expanded);
    for (const path of matches) {
      let p = byPath.get(path)?.parent;
      while (p) {
        next.add(p);
        p = byPath.get(p)?.parent ?? null;
      }
    }
    return next;
  }, [expanded, matches, query, byPath]);

  const visible = nodes.filter((n) => {
    let p = n.parent;
    while (p) {
      if (!open.has(p)) return false;
      p = byPath.get(p)?.parent ?? null;
    }
    return true;
  });

  const toggle = (path: string, force?: boolean) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (force ?? !next.has(path)) next.add(path);
      else next.delete(path);
      return next;
    });

  const copy = async (kind: "path" | "value", text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
    onCopy?.(kind, text);
    setCopied(id);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1400);
  };

  const move = (path: string) => {
    setFocused(path);
    rows.current.get(path)?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, n: Node) => {
    const i = visible.findIndex((v) => v.path === n.path);
    const branch = isBranch(n.value);
    const keys: Record<string, () => void> = {
      ArrowDown: () => visible[i + 1] && move(visible[i + 1].path),
      ArrowUp: () => visible[i - 1] && move(visible[i - 1].path),
      Home: () => move(visible[0].path),
      End: () => move(visible[visible.length - 1].path),
      ArrowRight: () =>
        branch &&
        (open.has(n.path)
          ? visible[i + 1] && move(visible[i + 1].path)
          : toggle(n.path, true)),
      ArrowLeft: () =>
        branch && open.has(n.path) ? toggle(n.path, false) : n.parent && move(n.parent),
      Enter: () =>
        branch ? toggle(n.path) : copy("value", JSON.stringify(n.value), n.path),
    };
    if (keys[e.key]) {
      e.preventDefault();
      keys[e.key]();
    }
  };

  const branches = nodes.filter((n) => isBranch(n.value));
  const leaves = nodes.length - branches.length;

  return (
    <MotionConfig reducedMotion="user">
      <Shell className={cn("max-w-xl", className)} aria-label={title}>
        <ShellHeader
          icon={BracketsCurly}
          title={title}
          subtitle={`${leaves} values · ${branches.length} objects and arrays`}
          aside={
            view === "raw" ? (
              <IconButton
                icon={copied === "$raw" ? Check : Copy}
                iconWeight={copied === "$raw" ? "bold" : "fill"}
                label={copied === "$raw" ? "Copied" : "Copy JSON"}
                onClick={() => copy("value", JSON.stringify(data, null, 2), "$raw")}
              />
            ) : (
              <>
                <IconButton
                  icon={ArrowsOutSimple}
                  iconWeight="bold"
                  label="Expand all"
                  onClick={() => setExpanded(new Set(branches.map((n) => n.path)))}
                />
                <IconButton
                  icon={ArrowsInSimple}
                  iconWeight="bold"
                  label="Collapse all"
                  onClick={() => setExpanded(new Set(["$"]))}
                />
              </>
            )
          }
        />
        {view === "raw" ? (
          <CodeBlock
            bare
            data={{ code: JSON.stringify(data, null, 2), language: "json" }}
            collapseAfter={18}
          />
        ) : (
          <>
            <div className="px-1.5 pb-2">
              <SearchField
                aria-label="Search keys and values"
                placeholder="Search keys and values"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClear={() => setQuery("")}
              />
            </div>
            <Panel
              role="tree"
              aria-label={title}
              className="max-h-96 overflow-x-hidden overflow-y-auto py-2 font-mono text-[0.8125rem] leading-6"
            >
              {visible.map((n) => {
                const branch = isBranch(n.value);
                const isOpen = open.has(n.path);
                const count = branch
                  ? Array.isArray(n.value)
                    ? n.value.length
                    : Object.keys(n.value as object).length
                  : 0;
                const label = n.key === null ? title : String(n.key);
                const valueText = branch
                  ? Array.isArray(n.value)
                    ? `[${count}]`
                    : `{${count}}`
                  : JSON.stringify(n.value);
                return (
                  <div
                    key={n.path}
                    ref={(el) => {
                      if (el) rows.current.set(n.path, el);
                      else rows.current.delete(n.path);
                    }}
                    role="treeitem"
                    aria-level={n.depth + 1}
                    aria-expanded={branch ? isOpen : undefined}
                    aria-selected={focused === n.path}
                    tabIndex={focused === n.path ? 0 : -1}
                    onFocus={() => setFocused(n.path)}
                    onKeyDown={(e) => onKeyDown(e, n)}
                    onClick={() => branch && toggle(n.path)}
                    className={cn(
                      "group flex items-center gap-1 pr-2 outline-none hover:bg-foreground/[0.03] focus-visible:bg-foreground/[0.06]",
                      matches.has(n.path) && "bg-warning/[0.08]",
                    )}
                    style={{ paddingLeft: `${0.75 + n.depth * 1.1}rem` }}
                  >
                    <CaretRight
                      weight="bold"
                      aria-hidden="true"
                      className={cn(
                        "size-3 shrink-0 text-muted-foreground transition-transform duration-150 ease-out motion-reduce:transition-none",
                        isOpen && "rotate-90",
                        !branch && "invisible",
                      )}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      title={`Copy path ${n.path}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        copy("path", n.path, `p:${n.path}`);
                      }}
                      className="max-w-[45%] shrink-0 truncate rounded px-0.5 text-[#0550ae] transition-colors hover:bg-foreground/[0.06] dark:text-[#79c0ff]"
                    >
                      <Highlight text={label} query={query} />
                    </button>
                    <span className="text-muted-foreground">:</span>
                    <span
                      className={cn(
                        "min-w-0 truncate",
                        branch ? "text-muted-foreground" : valueClass(n.value),
                      )}
                    >
                      {branch ? valueText : <Highlight text={valueText} query={query} />}
                    </span>
                    {(copied === n.path || copied === `p:${n.path}`) && (
                      <span className="ml-1 inline-flex items-center gap-1 font-sans text-xs text-positive">
                        <Check weight="bold" className="size-3" aria-hidden="true" />
                        {copied.startsWith("p:") ? "Path copied" : "Copied"}
                      </span>
                    )}
                    <span className="flex-1" />
                    {!branch && (
                      <IconButton
                        icon={Copy}
                        label={`Copy value of ${n.path}`}
                        tabIndex={-1}
                        onClick={(e) => {
                          e.stopPropagation();
                          copy("value", valueText, n.path);
                        }}
                        className="size-6 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
                      />
                    )}
                  </div>
                );
              })}
              {query && matches.size === 0 && (
                <p className="px-4 py-2 font-sans text-muted-foreground">
                  Nothing matches “{query}”.
                </p>
              )}
            </Panel>
            <p className="px-3 pt-2 pb-1 text-xs text-muted-foreground">
              {query ? (
                <Fragment>
                  {matches.size} match{matches.size === 1 ? "" : "es"}
                </Fragment>
              ) : (
                "Click a key to copy its path · ↑↓ to move, → ← to open and close"
              )}
            </p>
          </>
        )}
        <p role="status" aria-live="polite" className="sr-only">
          {copied
            ? copied.startsWith("p:")
              ? `Copied ${copied.slice(2)}`
              : "Value copied"
            : ""}
        </p>
      </Shell>
    </MotionConfig>
  );
}
