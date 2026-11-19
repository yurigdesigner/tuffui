// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
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
import { createContext, useContext, useState, type ReactNode } from "react";
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
  /** UI strings, for translating the panel. */
  labels?: Partial<McpServersLabels>;
  className?: string;
};

export type McpServersLabels = {
  status: Record<McpServerStatus, string>;
  title: string;
  /** Header count; `enabled` and `connected` are animated numbers. */
  toolsEnabled: (enabled: ReactNode, total: number) => ReactNode;
  connected: (connected: ReactNode, total: number) => ReactNode;
  /** Under a server name, e.g. "3/4 tools". */
  toolCount: (on: number, total: number) => string;
  allTools: string;
  /** Screen-reader names of the switches. */
  allToolsOn: (server: string) => string;
  toolOn: (tool: string, server: string) => string;
  authorize: string;
  reconnect: string;
  search: string;
  noMatch: string;
  noMatchQuery: (query: string) => string;
  /** Search field clear button. */
  clear: string;
};

const defaultLabels: McpServersLabels = {
  status: {
    connected: "Connected",
    connecting: "Connecting",
    "needs-auth": "Needs auth",
    error: "Error",
  },
  title: "MCP servers",
  toolsEnabled: (enabled, total) => (
    <>
      {enabled} of {total} tools enabled
    </>
  ),
  connected: (connected, total) => (
    <>
      {connected} of {total} connected
    </>
  ),
  toolCount: (on, total) => `${on}/${total} tools`,
  allTools: "All tools",
  allToolsOn: (server) => `All tools on ${server}`,
  toolOn: (tool, server) => `${tool} on ${server}`,
  authorize: "Authorize",
  reconnect: "Reconnect",
  search: "Search tools",
  noMatch: "No tools match",
  noMatchQuery: (query) => `Nothing matches “${query}”.`,
  clear: "Clear search",
};

const Labels = createContext(defaultLabels);

const statuses: Record<McpServerStatus, { icon: typeof CheckCircle; className: string }> =
  {
    connected: { icon: CheckCircle, className: "text-positive" },
    connecting: { icon: CircleNotch, className: "text-muted-foreground" },
    "needs-auth": { icon: Key, className: "text-warning" },
    error: { icon: WarningCircle, className: "text-negative" },
  };

function StatusTag({ status }: { status: McpServerStatus }) {
  const { icon: Icon, className } = statuses[status];
  const label = useContext(Labels).status[status];
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
  const labels = useContext(Labels);
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
        aria-label={labels.toolOn(tool.name, server.name)}
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
  labels: labelOverrides,
  className,
}: McpServersProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
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
      title={labels.title}
      aside={
        <span className="text-[0.8125rem] text-muted-foreground tabular-nums">
          {view === "tools"
            ? labels.toolsEnabled(<RollingNumber value={String(enabled)} />, all.length)
            : labels.connected(<RollingNumber value={String(connected)} />, data.length)}
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
        {labels.authorize}
      </Button>
    ) : server.status === "error" ? (
      <Button
        icon={ArrowClockwise}
        iconWeight="bold"
        onClick={() => onReconnect?.(server)}
        className="h-7 px-3 text-xs"
      >
        {labels.reconnect}
      </Button>
    ) : null;

  return (
    <Labels.Provider value={labels}>
      <MotionConfig reducedMotion="user">
        <Shell aria-label={labels.title} className={cn("max-w-lg", className)}>
          {header}
          {view === "tools" ? (
            <Panel className="p-2">
              <SearchField
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClear={() => setQuery("")}
                placeholder={labels.search}
                labels={{ clear: labels.clear }}
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
                    title={labels.noMatch}
                    description={labels.noMatchQuery(query)}
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
                    <div className="flex items-center gap-3 py-2.5 ps-3.5 pe-2.5">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={panelId}
                        onClick={(e) => {
                          setInstant(e.detail === 0);
                          setOpen(expanded ? null : server.id);
                        }}
                        className="flex min-w-0 flex-1 items-center gap-3 text-start"
                      >
                        <CaretDown
                          weight="bold"
                          className={cn(
                            "size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
                            // Collapsed, the caret points to the end side.
                            !expanded && "-rotate-90 rtl:rotate-90",
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
                              {labels.toolCount(on, server.tools.length)}
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
                          <span
                            dir="ltr"
                            className="mx-3.5 mb-3 block rounded-xl bg-negative/10 px-3 py-2 text-start font-mono text-xs text-negative"
                          >
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
                              <span>{labels.allTools}</span>
                              <Switch
                                checked={on === server.tools.length}
                                disabled={server.status !== "connected"}
                                aria-label={labels.allToolsOn(server.name)}
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
              .map((s) => `${s.name}: ${labels.status[s.status]}`)
              .join(". ")}
          </p>
        </Shell>
      </MotionConfig>
    </Labels.Provider>
  );
}
