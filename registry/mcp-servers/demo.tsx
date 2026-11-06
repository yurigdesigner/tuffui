"use client";

import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { McpServers, type McpServer } from "./mcp-servers";

const tool = (name: string, description: string, enabled = true) => ({
  name,
  description,
  enabled,
});

const servers: McpServer[] = [
  {
    id: "github",
    name: "github",
    transport: "http",
    status: "connected",
    tools: [
      tool("create_pull_request", "Open a PR from a branch"),
      tool("list_issues", "Search issues and filters"),
      tool("merge_pull_request", "Merge with a chosen strategy", false),
      tool("get_file_contents", "Read a file at a ref"),
    ],
  },
  {
    id: "linear",
    name: "linear",
    transport: "http",
    status: "needs-auth",
    tools: [
      tool("search_issues", "Find issues by text or label", false),
      tool("create_issue", "File a new issue", false),
      tool("update_status", "Move an issue between states", false),
    ],
  },
  {
    id: "postgres",
    name: "postgres-analytics",
    transport: "stdio",
    status: "error",
    error: "ECONNREFUSED 127.0.0.1:5432 — is the database running?",
    tools: [
      tool("query", "Run a read-only SQL query"),
      tool("describe_table", "Columns, types and indexes"),
    ],
  },
  {
    id: "fs",
    name: "filesystem",
    transport: "stdio",
    status: "connected",
    tools: [
      tool("read_file", "Read a file in the workspace"),
      tool("write_file", "Create or overwrite a file"),
      tool("search_files", "Glob and grep the workspace"),
      tool("delete_file", "Remove a file", false),
    ],
  },
];

type State = { servers: McpServer[] };

const patch =
  (id: string, change: Partial<McpServer> | ((s: McpServer) => Partial<McpServer>)) =>
  (state: State): State => ({
    servers: state.servers.map((s) =>
      s.id === id ? { ...s, ...(typeof change === "function" ? change(s) : change) } : s,
    ),
  });

const enableAll = (s: McpServer) => ({
  tools: s.tools.map((t) => ({ ...t, enabled: true })),
});

const script: MockStep<State>[] = [
  wait(1600),
  { delay: 0, apply: patch("linear", { status: "connecting" }) },
  {
    delay: 1200,
    apply: patch("linear", (s) => ({ status: "connected", ...enableAll(s) })),
  },
  wait(1200),
  { delay: 0, apply: patch("postgres", { status: "connecting" }) },
  { delay: 1400, apply: patch("postgres", { status: "connected", error: undefined }) },
];

export default function McpServersDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const { state, setState } = useMockRun<State>({ servers }, script, { autoplay });

  const reconnect = (id: string) => {
    setState(patch(id, { status: "connecting" }));
    setTimeout(
      () => setState(patch(id, { status: "connected", error: undefined })),
      1200,
    );
  };

  return (
    <McpServers
      data={state.servers}
      view={variant === "Tools" ? "tools" : "servers"}
      defaultExpanded="github"
      onToggleTool={(serverId, name, enabled) =>
        setState(
          patch(serverId, (s) => ({
            tools: s.tools.map((t) => (t.name === name ? { ...t, enabled } : t)),
          })),
        )
      }
      onToggleServer={(serverId, enabled) =>
        setState(
          patch(serverId, (s) => ({ tools: s.tools.map((t) => ({ ...t, enabled })) })),
        )
      }
      onAuthorize={(server) => reconnect(server.id)}
      onReconnect={(server) => reconnect(server.id)}
    />
  );
}
