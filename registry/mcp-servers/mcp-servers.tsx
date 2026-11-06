"use client";

import {
  ArrowClockwise,
  CaretDown,
  CheckCircle,
  CircleNotch,
  HardDrives,
  Key,
  WarningCircle,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/action-button";
import { Switch } from "@/components/ui/choice-controls";
import { RollingNumber } from "@/components/ui/rolling-number";
import { Tag } from "@/components/ui/status-pill";
import { Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { SearchField } from "@/components/ui/text-field";
import {
  CSS_EASE_OUT,
  enter,
  exit,
  instant as noMotion,
  spring,
} from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

export type McpServerStatus = "connected" | "connecting" | "needs-auth" | "error";

export type McpTool = { name: string; description?: string; enabled: boolean };

export type McpServer = {
  id: string;
  name: string;
  transport: "stdio" | "http";
  status: McpServerStatus;
  /** Shown on error rows, e.g. "ECONNREFUSED 127.0.0.1:5432". */
  error?: string;
  tools: McpTool[];
};

export type McpServersProps = {
  data: McpServer[];
  /** `servers` groups tools under expandable servers; `tools` is one searchable list. */
  view?: "servers" | "tools";
  onToggleTool?: (serverId: string, tool: string, enabled: boolean) => void;
  /** Turns every tool of a server on or off. */
  onToggleServer?: (serverId: string, enabled: boolean) => void;
  onAuthorize?: (server: McpServer) => void;
  onReconnect?: (server: McpServer) => void;
  defaultExpanded?: string;
  className?: string;
};

const statuses: Record<
  McpServerStatus,
  { label: string; icon: typeof CheckCircle; className: string }
> = {
  connected: { label: "Connected", icon: CheckCircle, className: "text-positive" },
  connecting: {
    label: "Connecting",
    icon: CircleNotch,
    className: "text-muted-foreground",
  },
  "needs-auth": { label: "Needs auth", icon: Key, className: "text-warning" },
  error: { label: "Error", icon: WarningCircle, className: "text-negative" },
};

function StatusTag({ status }: { status: McpServerStatus }) {
  const { label, icon: Icon, className } = statuses[status];
  return (
    <span className={cn("flex items-center gap-1 text-xs", className)}>
      <Icon
        // The spinner is a line glyph; the status shapes are filled.
        weight={status === "connecting" ? "bold" : "fill"}
        className={cn(
          "size-3.5",
          status === "connecting" && "animate-spin motion-reduce:animate-none",
        )}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

function ToolRow({
  tool,
  server,
  onToggle,
}: {
  tool: McpTool;
  server: McpServer;
  onToggle?: McpServersProps["onToggleTool"];
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-foreground/[0.03]">
      <span className="min-w-0 flex-1">
        <span className="block truncate font-mono text-[0.8125rem]">{tool.name}</span>
        {tool.description && (
          <span className="block truncate text-xs text-muted-foreground">
            {tool.description}
          </span>
        )}
      </span>
      <Switch
        checked={tool.enabled}
        disabled={server.status !== "connected"}
        aria-label={`${tool.name} on ${server.name}`}
        onCheckedChange={(next) => onToggle?.(server.id, tool.name, next)}
      />
    </li>
  );
}

export function McpServers({
  data,
  view = "servers",
  onToggleTool,
  onToggleServer,
  onAuthorize,
  onReconnect,
  defaultExpanded,
  className,
}: McpServersProps) {
  const [open, setOpen] = useState<string | null>(defaultExpanded ?? null);
  const [query, setQuery] = useState("");
  const [instant, setInstant] = useState(false);
  const reduce = useReducedMotion();
  const all = data.flatMap((s) => s.tools);
  const enabled = all.filter((t) => t.enabled).length;
  const connected = data.filter((s) => s.status === "connected").length;
  const q = query.trim().toLowerCase();

  const header = (
    <ShellHeader
      icon={HardDrives}
      title="MCP servers"
      aside={
        <span className="text-[0.8125rem] text-muted-foreground tabular-nums">
          {view === "tools" ? (
            <>
              <RollingNumber value={String(enabled)} /> of {all.length} tools enabled
            </>
          ) : (
            <>
              <RollingNumber value={String(connected)} /> of {data.length} connected
            </>
          )}
        </span>
      }
    />
  );

  const serverAction = (server: McpServer) =>
    server.status === "needs-auth" ? (
      <Button
        variant="primary"
        onClick={() => onAuthorize?.(server)}
        className="h-7 px-3 text-xs"
      >
        Authorize
      </Button>
    ) : server.status === "error" ? (
      <Button
        icon={ArrowClockwise}
        iconWeight="bold"
        onClick={() => onReconnect?.(server)}
        className="h-7 px-3 text-xs"
      >
        Reconnect
      </Button>
    ) : null;

  return (
    <MotionConfig reducedMotion="user">
      <Shell aria-label="MCP servers" className={cn("max-w-lg", className)}>
        {header}
        {view === "tools" ? (
          <Panel className="p-2">
            <SearchField
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClear={() => setQuery("")}
              placeholder="Search tools"
              className="mb-1"
            />
            {data.map((server) => {
              const tools = server.tools.filter(
                (t) => !q || t.name.toLowerCase().includes(q),
              );
              if (!tools.length) return null;
              return (
                <div key={server.id} className="mt-2">
                  <p className="flex items-center justify-between px-3 py-1.5 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{server.name}</span>
                    {server.status !== "connected" && (
                      <StatusTag status={server.status} />
                    )}
                  </p>
                  <ul>
                    {tools.map((tool) => (
                      <ToolRow
                        key={tool.name}
                        tool={tool}
                        server={server}
                        onToggle={onToggleTool}
                      />
                    ))}
                  </ul>
                </div>
              );
            })}
            {q &&
              !data.some((s) =>
                s.tools.some((t) => t.name.toLowerCase().includes(q)),
              ) && (
                <EmptyState
                  compact
                  icon={MagnifyingGlass}
                  title="No tools match"
                  description={`Nothing matches “${query}”.`}
                />
              )}
          </Panel>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {data.map((server) => {
              const expanded = open === server.id;
              const on = server.tools.filter((t) => t.enabled).length;
              const panelId = `mcp-${server.id}`;
              return (
                <motion.li
                  key={server.id}
                  layout="position"
                  transition={spring}
                  className="rounded-2xl bg-surface-inset"
                >
                  <div className="flex items-center gap-3 py-2.5 pr-2.5 pl-3.5">
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={panelId}
                      onClick={(e) => {
                        setInstant(e.detail === 0);
                        setOpen(expanded ? null : server.id);
                      }}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <CaretDown
                        weight="bold"
                        className={cn(
                          "size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
                          !expanded && "-rotate-90",
                        )}
                        style={{ transitionTimingFunction: CSS_EASE_OUT }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {server.name}
                          </span>
                          <Tag className="rounded-full">{server.transport}</Tag>
                        </span>
                        <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <StatusTag status={server.status} />
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">
                            {on}/{server.tools.length} tools
                          </span>
                        </span>
                      </span>
                    </button>
                    {serverAction(server)}
                  </div>
                  <AnimatePresence initial={false}>
                    {server.status === "error" && server.error && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0, transition: exit }}
                        transition={enter}
                        className="overflow-hidden"
                      >
                        <span className="mx-3.5 mb-3 block rounded-xl bg-negative/10 px-3 py-2 font-mono text-xs text-negative">
                          {server.error}
                        </span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.div
                        id={panelId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{
                          height: 0,
                          opacity: 0,
                          transition: instant || reduce ? noMotion : exit,
                        }}
                        transition={instant || reduce ? noMotion : spring}
                        className="overflow-hidden"
                      >
                        <div className="mx-1.5 mb-1.5 rounded-xl bg-foreground/[0.04] p-1">
                          <div className="flex items-center justify-between px-3 py-1.5 text-xs text-muted-foreground">
                            <span>All tools</span>
                            <Switch
                              checked={on === server.tools.length}
                              disabled={server.status !== "connected"}
                              aria-label={`All tools on ${server.name}`}
                              onCheckedChange={(next) =>
                                onToggleServer?.(server.id, next)
                              }
                            />
                          </div>
                          <ul>
                            {server.tools.map((tool) => (
                              <ToolRow
                                key={tool.name}
                                tool={tool}
                                server={server}
                                onToggle={onToggleTool}
                              />
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </ul>
        )}
        <p role="status" aria-live="polite" className="sr-only">
          {data
            .filter((s) => s.status !== "connected")
            .map((s) => `${s.name}: ${statuses[s.status].label}`)
            .join(". ")}
        </p>
      </Shell>
    </MotionConfig>
  );
}
