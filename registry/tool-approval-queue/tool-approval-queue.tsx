"use client";

import {
  ArrowUUpLeft,
  CaretDown,
  Check,
  Envelope,
  GitDiff,
  ShieldCheck,
  ShieldSlash,
  ShieldWarning,
  TerminalWindow,
  Wrench,
  X,
} from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/action-button";
import { Checkbox } from "@/components/ui/choice-controls";
import { RollingNumber } from "@/components/ui/rolling-number";
import { Segmented } from "@/components/ui/segmented-control";
import { IconTile, Inset, Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { EASE_OUT, exit as exitFast, instant } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

export type ToolRisk = "low" | "medium" | "high";
export type GrantScope = "once" | "session" | "always";
export type ToolDecision = "approved" | "denied";
export type DiffLine = { type: "add" | "remove" | "context"; text: string };

export type ToolApprovalRequest = {
  id: string;
  /** Tool identifier, shown in mono — e.g. `bash`, `fs.write`, `slack.post`. */
  tool: string;
  /** Human summary of what the agent wants to do. */
  title: string;
  risk: ToolRisk;
  agent?: string;
  /** Resolve from your own data to move the request into the resolved log. */
  status?: "pending" | ToolDecision;
  /** Scope of an already resolved request, for the log. */
  scope?: GrantScope;
  payload:
    | { kind: "shell"; command: string; cwd?: string }
    | { kind: "diff"; path: string; lines: DiffLine[] }
    | { kind: "email"; to: string; subject: string; body: string }
    | { kind: "json"; args: Record<string, unknown> };
};

export type ToolApprovalQueueProps = {
  data: ToolApprovalRequest[];
  /** `grouped` sections requests by risk; `flat` keeps arrival order. */
  layout?: "grouped" | "flat";
  /** Called for one request (row actions) or several (bulk bar). */
  onDecide?: (
    requests: ToolApprovalRequest[],
    decision: ToolDecision,
    scope: GrantScope,
  ) => void;
  /** Shows Undo in the resolved log for `undoMs` after a decision made here. */
  onUndo?: (request: ToolApprovalRequest) => void;
  undoMs?: number;
  /** Controlled selection of request ids. */
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  /** Request id to open on mount. */
  defaultExpanded?: string;
  className?: string;
};

type Resolution = { decision: ToolDecision; scope: GrantScope; undoable: boolean };

const risks = {
  high: { label: "High risk", short: "High", icon: ShieldSlash, text: "text-negative" },
  medium: {
    label: "Medium risk",
    short: "Medium",
    icon: ShieldWarning,
    text: "text-warning",
  },
  low: { label: "Low risk", short: "Low", icon: ShieldCheck, text: "text-positive" },
} as const;
const scopes: { id: GrantScope; label: string }[] = [
  { id: "once", label: "Once" },
  { id: "session", label: "This session" },
  { id: "always", label: "Always" },
];
const kindIcons = { shell: TerminalWindow, diff: GitDiff, email: Envelope, json: Wrench };
// Height morphs on a damped spring; opacity leads on enter and exits faster.
const reveal = {
  height: { type: "spring", duration: 0.35, bounce: 0 },
  opacity: { duration: 0.2, ease: EASE_OUT },
} as const;
const scopeText = (s: GrantScope) => scopes.find((x) => x.id === s)!.label.toLowerCase();

const targetOf = (p: ToolApprovalRequest["payload"]) =>
  p.kind === "shell"
    ? p.command
    : p.kind === "diff"
      ? p.path
      : p.kind === "email"
        ? p.to
        : "";

export function ToolApprovalQueue({
  data,
  layout = "grouped",
  onDecide,
  onUndo,
  undoMs = 5000,
  selected: selectedProp,
  onSelectedChange,
  defaultExpanded,
  className,
}: ToolApprovalQueueProps) {
  const [local, setLocal] = useState<Record<string, Resolution>>({});
  const [ownSelected, setOwnSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(defaultExpanded ?? null);
  const [scopeById, setScopeById] = useState<Record<string, GrantScope>>({});
  const [announcement, setAnnouncement] = useState("");
  const rows = useRef<Map<string, HTMLDivElement>>(new Map());
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Keyboard-driven changes (Enter, Space) and reduced motion skip the animation.
  const [viaKeys, setViaKeys] = useState(false);
  const reduce = useReducedMotion();
  const still = viaKeys || !!reduce;

  useEffect(() => {
    const pendingTimers = timers.current;
    return () => pendingTimers.forEach(clearTimeout);
  }, []);

  const resolutionOf = (r: ToolApprovalRequest): Resolution | undefined =>
    local[r.id] ??
    (r.status && r.status !== "pending"
      ? { decision: r.status, scope: r.scope ?? "once", undoable: false }
      : undefined);
  const pending = data.filter((r) => !resolutionOf(r));
  const resolved = data.filter((r) => resolutionOf(r));
  const selectedIds = (selectedProp ?? ownSelected).filter((id) =>
    pending.some((r) => r.id === id),
  );
  const setSelected = (ids: string[]) => {
    setOwnSelected(ids);
    onSelectedChange?.(ids);
  };
  const toggle = (id: string) =>
    setSelected(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );

  const decide = (
    requests: ToolApprovalRequest[],
    decision: ToolDecision,
    scope: GrantScope,
  ) => {
    setLocal((l) => ({
      ...l,
      ...Object.fromEntries(
        requests.map((r) => [r.id, { decision, scope, undoable: true }]),
      ),
    }));
    for (const r of requests) {
      timers.current.set(
        r.id,
        setTimeout(
          () =>
            setLocal((l) =>
              l[r.id] ? { ...l, [r.id]: { ...l[r.id], undoable: false } } : l,
            ),
          undoMs,
        ),
      );
    }
    setSelected(selectedIds.filter((id) => !requests.some((r) => r.id === id)));
    setAnnouncement(
      `${requests.length === 1 ? requests[0].title : `${requests.length} requests`} ${decision}${decision === "approved" ? ` ${scopeText(scope)}` : ""}`,
    );
    onDecide?.(requests, decision, scope);
  };

  const undo = (r: ToolApprovalRequest) => {
    clearTimeout(timers.current.get(r.id));
    setLocal((l) => {
      const next = { ...l };
      delete next[r.id];
      return next;
    });
    setAnnouncement(`${r.title} back in the queue`);
    onUndo?.(r);
  };

  const groups =
    layout === "grouped"
      ? (["high", "medium", "low"] as const)
          .map((risk) => ({ risk, items: pending.filter((r) => r.risk === risk) }))
          .filter((g) => g.items.length)
      : [{ risk: null, items: pending }];
  const bulk = pending.filter((r) => selectedIds.includes(r.id));

  const onRowKey = (e: KeyboardEvent, r: ToolApprovalRequest) => {
    const order = groups.flatMap((g) => g.items);
    const i = order.findIndex((x) => x.id === r.id);
    const move = (to: number) => rows.current.get(order[to]?.id)?.focus();
    if (e.key === "ArrowDown") move(Math.min(i + 1, order.length - 1));
    else if (e.key === "ArrowUp") move(Math.max(i - 1, 0));
    else if (e.key === " ") toggle(r.id);
    else if (e.key === "Enter") setExpanded(expanded === r.id ? null : r.id);
    else return;
    setViaKeys(true);
    e.preventDefault();
  };

  return (
    <MotionConfig reducedMotion="user">
      <Shell aria-label="Permission requests" className={cn("max-w-xl", className)}>
        <ShellHeader
          icon={ShieldCheck}
          title="Permission requests"
          aside={
            <span className="text-[0.8125rem] text-muted-foreground tabular-nums">
              {pending.length ? (
                <>
                  <RollingNumber value={String(pending.length)} /> waiting on you
                </>
              ) : (
                "All clear"
              )}
            </span>
          }
        />
        <Panel className="overflow-hidden">
          <AnimatePresence initial={false}>
            {bulk.length > 0 && (
              <motion.div
                key="bulk"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0, transition: still ? instant : exitFast }}
                transition={still ? instant : reveal}
                className="overflow-hidden"
              >
                <div className="m-1.5 mb-0 flex items-center gap-2 rounded-xl bg-brand/10 py-1.5 pr-1.5 pl-3 text-[0.8125rem]">
                  <span className="font-medium text-brand tabular-nums">
                    <RollingNumber value={String(bulk.length)} /> selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelected([])}
                    className="text-muted-foreground transition-colors duration-150 hover:text-foreground"
                  >
                    Clear
                  </button>
                  <Button
                    className="ml-auto"
                    onClick={() => decide(bulk, "denied", "once")}
                  >
                    Deny
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => decide(bulk, "approved", "once")}
                  >
                    Approve
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {pending.length === 0 && (
            <EmptyState
              compact
              icon={ShieldCheck}
              title="Nothing to review"
              description="New requests appear here."
            />
          )}
          <div className={cn("p-1.5", pending.length === 0 && "hidden")}>
            {/* Groups grow and shrink with their rows, so a label never pops in or out
                and the last row of a group can play its exit. */}
            <AnimatePresence initial={false}>
              {groups.map((g) => (
                <motion.div
                  key={g.risk ?? "all"}
                  role="group"
                  aria-label={g.risk ? risks[g.risk].label : "Requests"}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{
                    height: 0,
                    opacity: 0,
                    transition: reduce ? instant : exitFast,
                  }}
                  transition={reduce ? instant : reveal}
                  className="overflow-hidden"
                >
                  {g.risk && <GroupLabel risk={g.risk} count={g.items.length} />}
                  <AnimatePresence initial={false}>
                    {g.items.map((r) => {
                      const Kind = kindIcons[r.payload.kind];
                      const Risk = risks[r.risk].icon;
                      const open = expanded === r.id;
                      const checked = selectedIds.includes(r.id);
                      const scope = scopeById[r.id] ?? "once";
                      return (
                        <motion.div
                          key={r.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{
                            opacity: 0,
                            height: 0,
                            transition: reduce ? instant : exitFast,
                          }}
                          transition={reduce ? instant : reveal}
                          className="overflow-hidden"
                        >
                          <div
                            className={cn(
                              "rounded-xl transition-colors",
                              (open || checked) && "bg-foreground/[0.035]",
                            )}
                          >
                            <div
                              ref={(el) => {
                                if (el) rows.current.set(r.id, el);
                                else rows.current.delete(r.id);
                              }}
                              role="button"
                              tabIndex={0}
                              aria-expanded={open}
                              aria-keyshortcuts="Space Enter ArrowUp ArrowDown"
                              onClick={() => {
                                setViaKeys(false);
                                setExpanded(open ? null : r.id);
                              }}
                              onKeyDown={(e) => onRowKey(e, r)}
                              className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2.5 hover:bg-foreground/[0.03]"
                            >
                              <Checkbox
                                tabIndex={-1}
                                checked={checked}
                                aria-label={`Select ${r.title}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViaKeys(false);
                                  toggle(r.id);
                                }}
                              />
                              <IconTile
                                icon={Kind}
                                className="size-8 rounded-lg bg-foreground/[0.05]"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm">{r.title}</span>
                                <span className="block truncate font-mono text-xs text-muted-foreground">
                                  {r.tool}
                                  {targetOf(r.payload) && ` · ${targetOf(r.payload)}`}
                                </span>
                              </span>
                              {layout === "flat" && (
                                <span
                                  className={cn(
                                    "flex shrink-0 items-center gap-1 text-xs",
                                    risks[r.risk].text,
                                  )}
                                >
                                  <Risk
                                    weight="fill"
                                    className="size-3.5"
                                    aria-hidden="true"
                                  />
                                  {risks[r.risk].short}
                                </span>
                              )}
                              <CaretDown
                                weight="bold"
                                className={cn(
                                  "size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
                                  open && "rotate-180",
                                )}
                                aria-hidden="true"
                              />
                            </div>
                            <AnimatePresence initial={false}>
                              {open && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{
                                    height: 0,
                                    opacity: 0,
                                    transition: still ? instant : exitFast,
                                  }}
                                  transition={still ? instant : reveal}
                                  className="overflow-hidden"
                                >
                                  <div className="px-2.5 pb-2.5">
                                    <Inset>
                                      <Payload payload={r.payload} />
                                    </Inset>
                                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                      <Segmented
                                        label="Grant for"
                                        className="mr-auto"
                                        options={scopes.map((x) => ({
                                          value: x.id,
                                          label: x.label,
                                        }))}
                                        value={scope}
                                        onValueChange={(v) =>
                                          setScopeById((m) => ({ ...m, [r.id]: v }))
                                        }
                                      />
                                      <Button
                                        onClick={() => decide([r], "denied", scope)}
                                      >
                                        Deny
                                      </Button>
                                      <Button
                                        variant="primary"
                                        onClick={() => decide([r], "approved", scope)}
                                      >
                                        Approve {scopeText(scope)}
                                      </Button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Panel>
        <AnimatePresence initial={false}>
          {resolved.length > 0 && (
            <motion.div
              key="resolved"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0, transition: reduce ? instant : exitFast }}
              transition={reduce ? instant : reveal}
              className="overflow-hidden"
            >
              <div className="px-2 pt-2.5 pb-1">
                <p className="px-1.5 pb-1 text-xs text-muted-foreground">
                  Resolved · {resolved.length}
                </p>
                <ul>
                  <AnimatePresence initial={false}>
                    {resolved.map((r) => (
                      <ResolvedRow
                        key={r.id}
                        request={r}
                        resolution={resolutionOf(r)!}
                        onUndo={undo}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </Shell>
    </MotionConfig>
  );
}

function GroupLabel({ risk, count }: { risk: ToolRisk; count: number }) {
  const Icon = risks[risk].icon;
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 px-2.5 pt-2 pb-1 text-xs font-medium",
        risks[risk].text,
      )}
    >
      <Icon weight="fill" className="size-3.5" aria-hidden="true" />
      {risks[risk].label}
      <span className="text-muted-foreground">
        · <RollingNumber value={String(count)} />
      </span>
    </p>
  );
}

function ResolvedRow({
  request,
  resolution,
  onUndo,
}: {
  request: ToolApprovalRequest;
  resolution: Resolution;
  onUndo: (request: ToolApprovalRequest) => void;
}) {
  const ok = resolution.decision === "approved";
  const Icon = ok ? Check : X;
  return (
    <motion.li
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0, transition: exitFast }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      className="overflow-hidden"
    >
      <div className="flex min-h-9 items-center gap-2.5 px-1.5 text-[0.8125rem]">
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full",
            ok ? "bg-positive/15 text-positive" : "bg-negative/15 text-negative",
          )}
        >
          <Icon weight="fill" className="size-3" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1 truncate text-muted-foreground">
          <span className="text-foreground">{request.title}</span>
          {" · "}
          {ok ? `approved ${scopeText(resolution.scope)}` : "denied"}
        </span>
        {resolution.undoable && (
          <Button
            icon={ArrowUUpLeft}
            iconWeight="bold"
            onClick={() => onUndo(request)}
            className="h-7 gap-1 px-2.5 text-xs"
          >
            Undo
          </Button>
        )}
      </div>
    </motion.li>
  );
}

function Payload({ payload }: { payload: ToolApprovalRequest["payload"] }) {
  const box = "font-mono text-[0.75rem] leading-5";
  switch (payload.kind) {
    case "shell":
      return (
        <div className={cn(box, "px-3.5 py-3")}>
          {payload.cwd && <p className="text-muted-foreground">{payload.cwd}</p>}
          <p className="break-all whitespace-pre-wrap">
            <span className="text-muted-foreground select-none">$ </span>
            {payload.command}
          </p>
        </div>
      );
    case "diff":
      return (
        <div className={cn(box, "max-h-40 overflow-x-hidden overflow-y-auto py-2")}>
          {payload.lines.map((line, i) => (
            <p
              key={i}
              className={cn(
                "flex px-3.5 [overflow-wrap:anywhere] whitespace-pre-wrap",
                line.type === "add" && "bg-positive/10 text-positive",
                line.type === "remove" && "bg-negative/10 text-negative",
              )}
            >
              <span className="shrink-0 select-none">
                {line.type === "add" ? "+ " : line.type === "remove" ? "- " : "  "}
              </span>
              <span className="min-w-0">{line.text}</span>
            </p>
          ))}
        </div>
      );
    case "email":
      return (
        <div className="px-3.5 py-3 text-[0.8125rem]">
          <p className="font-medium">{payload.subject}</p>
          <p className="mt-1 line-clamp-3 text-muted-foreground">{payload.body}</p>
        </div>
      );
    case "json":
      return (
        <pre
          className={cn(
            box,
            "max-h-40 overflow-x-hidden overflow-y-auto px-3.5 py-3 [overflow-wrap:anywhere] whitespace-pre-wrap",
          )}
        >
          {JSON.stringify(payload.args, null, 2)}
        </pre>
      );
  }
}
