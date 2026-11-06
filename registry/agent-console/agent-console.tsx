// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import {
  ChartBar,
  Flask,
  GearSix,
  List,
  Pulse,
  Robot,
  SidebarSimple,
  WarningCircle,
  X,
  type Icon,
} from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button, IconButton } from "@/components/ui/action-button";
import { Avatar, type AvatarStatus } from "@/components/ui/agent-avatar";
import {
  BackgroundAgents,
  type BackgroundAgent,
} from "@/components/ui/background-agents";
import {
  ContextWindowMeter,
  type ContextSegment,
} from "@/components/ui/context-window-meter";
import { EvalResults, type EvalResultsProps } from "@/components/ui/eval-results";
import { RateLimits, type RateLimitsProps } from "@/components/ui/rate-limits";
import { RunTrace, type TraceSpan } from "@/components/ui/run-trace";
import { StatGrid, type Stat } from "@/components/ui/stat-grid";
import { StatusPill, Tag } from "@/components/ui/status-pill";
import { Toaster } from "@/components/ui/toast-stack";
import {
  ToolApprovalQueue,
  type ToolApprovalQueueProps,
  type ToolApprovalRequest,
} from "@/components/ui/tool-approval-queue";
import { Tooltip } from "@/components/ui/tooltip-hint";
import { UsageSummary, type UsageSummaryProps } from "@/components/ui/usage-summary";
import { EASE_OUT } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type ConsoleSection = "agents" | "runs" | "evals" | "usage" | "settings";

export type AgentConsoleData = {
  title: string;
  /** Environment tag next to the title, e.g. "prod". */
  environment?: string;
  /** Agents listed in the nav, with their presence. */
  team: { id: string; name: string; status?: AvatarStatus }[];
  stats: Stat[];
  agents: BackgroundAgent[];
  /** The selected run, shown as a flame graph. */
  run: { name: string; spans: TraceSpan[]; elapsedMs: number; failed?: boolean };
  evals: EvalResultsProps["data"];
  usage: UsageSummaryProps["data"];
  limits: RateLimitsProps["data"];
  context: { limit: number; segments: ContextSegment[]; model?: string };
  /** An active incident shows a banner and its pending approvals. */
  incident?: { title: string; description: string; approvals: ToolApprovalRequest[] };
};

export type AgentConsoleProps = {
  data: AgentConsoleData;
  section?: ConsoleSection;
  onSectionChange?: (section: ConsoleSection) => void;
  onSelectAgent?: (agent: BackgroundAgent) => void;
  onDecide?: ToolApprovalQueueProps["onDecide"];
  onRetryLimits?: () => void;
  onAcknowledge?: () => void;
  className?: string;
};

const sections: { id: ConsoleSection; label: string; icon: Icon }[] = [
  { id: "agents", label: "Agents", icon: Robot },
  { id: "runs", label: "Runs", icon: Pulse },
  { id: "evals", label: "Evals", icon: Flask },
  { id: "usage", label: "Usage", icon: ChartBar },
  { id: "settings", label: "Settings", icon: GearSix },
];

/**
 * A team console for agents in production. Lays out against its own width: from
 * 56rem the nav is a collapsible sidebar, below that it opens as an in-place
 * drawer; from 64rem usage and limits move into a side column. The dashboard is one
 * vertical scroll.
 */
export function AgentConsole({
  data,
  section: sectionProp,
  onSectionChange,
  onSelectAgent,
  onDecide,
  onRetryLimits,
  onAcknowledge,
  className,
}: AgentConsoleProps) {
  const [inner, setInner] = useState<ConsoleSection>("agents");
  const section = sectionProp ?? inner;
  const [collapsed, setCollapsed] = useState(false);
  const [instant, setInstant] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const reduce = useReducedMotion();

  const select = (id: ConsoleSection) => {
    setInner(id);
    onSectionChange?.(id);
    setDrawer(false);
  };

  const nav = (compact: boolean) => (
    <nav aria-label="Console" className="flex flex-col gap-4">
      <ul className="flex flex-col gap-0.5">
        {sections.map((item) => {
          const active = item.id === section;
          const link = (
            <button
              type="button"
              aria-current={active ? "page" : undefined}
              aria-label={compact ? item.label : undefined}
              onClick={() => select(item.id)}
              className={cn(
                "flex h-9 w-full items-center gap-3 rounded-xl px-2.5 text-[0.8125rem] font-medium transition-[background-color,color,scale] duration-150 ease-out active:scale-[0.98]",
                active
                  ? "bg-surface-raised text-foreground"
                  : "text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground",
              )}
            >
              <item.icon weight="fill" className="size-4 shrink-0" aria-hidden="true" />
              {!compact && <span className="truncate">{item.label}</span>}
            </button>
          );
          return (
            <li key={item.id}>
              {compact ? <Tooltip content={item.label}>{link}</Tooltip> : link}
            </li>
          );
        })}
      </ul>
      <div className="flex flex-col gap-1">
        {!compact && (
          <p className="px-2.5 text-[0.75rem] font-medium text-foreground/40">Team</p>
        )}
        {data.team.map((member) => (
          <div key={member.id} className="flex h-9 items-center gap-2.5 px-2">
            <Avatar name={member.name} kind="agent" size="sm" status={member.status} />
            {!compact && (
              <span className="truncate text-[0.8125rem] text-foreground/75">
                {member.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </nav>
  );

  const side = (
    <>
      <UsageSummary data={data.usage} className="max-w-none" />
      <RateLimits data={data.limits} onRetry={onRetryLimits} className="max-w-none" />
      <ContextWindowMeter data={data.context} className="max-w-none" />
    </>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={cn(
          "@container relative flex h-full w-full overflow-hidden bg-background text-foreground",
          className,
        )}
      >
        <motion.aside
          aria-label="Navigation"
          initial={false}
          animate={{ width: collapsed ? 64 : 232 }}
          transition={
            instant || reduce ? { duration: 0 } : { duration: 0.25, ease: EASE_OUT }
          }
          className="hidden shrink-0 flex-col gap-4 overflow-x-hidden overflow-y-auto p-3 pr-0 @4xl:flex"
        >
          <div className="flex h-9 items-center justify-between gap-2 px-1">
            {!collapsed && (
              <span className="truncate pl-1.5 text-[0.9375rem] font-medium">
                Console
              </span>
            )}
            <Tooltip
              content={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              side="bottom"
            >
              <IconButton
                icon={SidebarSimple}
                label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-expanded={!collapsed}
                onClick={(event) => {
                  setInstant(event.detail === 0);
                  setCollapsed((c) => !c);
                }}
              />
            </Tooltip>
          </div>
          {nav(collapsed)}
        </motion.aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="mx-auto flex h-14 w-full max-w-[75rem] shrink-0 items-center gap-2 px-3 @md:px-5">
            <IconButton
              icon={List}
              iconWeight="bold"
              label="Open navigation"
              onClick={() => setDrawer(true)}
              className="@4xl:hidden"
            />
            <h2 className="min-w-0 truncate text-[0.9375rem] font-medium">
              {data.title}
            </h2>
            {data.environment && <Tag className="shrink-0">{data.environment}</Tag>}
            {data.incident && (
              <StatusPill tone="negative" icon={WarningCircle} className="ml-auto">
                Incident
              </StatusPill>
            )}
          </header>

          {/* One vertical scroll for the whole dashboard. */}
          <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
            <div className="mx-auto flex w-full max-w-[75rem] flex-col gap-3 px-3 pb-6 @md:px-5 @5xl:grid @5xl:grid-cols-[minmax(0,1fr)_21rem] @5xl:items-start">
              <div className="flex min-w-0 flex-col gap-3">
                <AnimatePresence initial={false}>
                  {data.incident && (
                    <motion.section
                      key="incident"
                      role="alert"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.22, ease: EASE_OUT },
                      }}
                      exit={{ opacity: 0, transition: { duration: 0.15 } }}
                      className="flex flex-col gap-3 rounded-[1.375rem] bg-negative/10 p-4 @md:flex-row @md:items-center"
                    >
                      <WarningCircle
                        weight="fill"
                        className="size-5 shrink-0 text-negative"
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.9375rem] font-medium">
                          {data.incident.title}
                        </p>
                        <p className="text-[0.8125rem] text-muted-foreground">
                          {data.incident.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={onAcknowledge}
                        className="self-start @md:self-auto"
                      >
                        Acknowledge
                      </Button>
                    </motion.section>
                  )}
                </AnimatePresence>
                {data.incident && data.incident.approvals.length > 0 && (
                  <ToolApprovalQueue
                    data={data.incident.approvals}
                    layout="flat"
                    defaultExpanded={data.incident.approvals[0]?.id}
                    onDecide={onDecide}
                    className="max-w-none"
                  />
                )}
                <StatGrid data={data.stats} sparklines className="max-w-none" />
                <BackgroundAgents
                  data={data.agents}
                  layout="grid"
                  onOpen={onSelectAgent}
                  className="max-w-none"
                />
                <section
                  aria-label={`Trace for ${data.run.name}`}
                  // Flame labels can run past the last block; keep them inside the screen.
                  className="min-w-0 overflow-hidden rounded-[1.375rem]"
                >
                  <RunTrace
                    data={{ spans: data.run.spans, elapsedMs: data.run.elapsedMs }}
                    view="flame"
                    className="max-w-none"
                  />
                </section>
                <EvalResults data={data.evals} view="compare" className="max-w-none" />
              </div>
              <div className="flex min-w-0 flex-col gap-3">{side}</div>
            </div>
          </main>
        </div>

        <NavDrawer open={drawer} onClose={() => setDrawer(false)}>
          {nav(false)}
        </NavDrawer>

        {/* Toasts stay inside the screen instead of the page corner. */}
        <Toaster position="bottom-right" className="absolute" />
      </div>
    </MotionConfig>
  );
}

/** The nav as a drawer inside the screen (not a page portal), for narrow widths. */
function NavDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
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
        <div className="absolute inset-0 z-20 @4xl:hidden">
          <motion.button
            type="button"
            aria-label="Close navigation"
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
            aria-label="Navigation"
            tabIndex={-1}
            initial={reduce ? { opacity: 0 } : { x: "-105%" }}
            animate={{
              x: 0,
              opacity: 1,
              transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] },
            }}
            exit={
              reduce
                ? { opacity: 0, transition: { duration: 0.15 } }
                : { x: "-105%", transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] } }
            }
            className="absolute inset-y-2 left-2 flex w-[min(17rem,calc(100%-3rem))] flex-col gap-2 overflow-y-auto rounded-[1.5rem] bg-surface p-3 outline-none"
          >
            <div className="flex items-center justify-between pl-1.5">
              <span className="text-[0.9375rem] font-medium">Console</span>
              <IconButton icon={X} iconWeight="bold" label="Close" onClick={onClose} />
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
