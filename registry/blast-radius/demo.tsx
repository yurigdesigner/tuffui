"use client";

import { Key } from "@phosphor-icons/react";
import { StatusPill } from "@/components/ui/status-pill";
import { useMockRun, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { BlastRadius, type BlastKind, type BlastNode } from "./blast-radius";

const kinds: Record<string, BlastKind> = {
  service: { label: "Service", color: "var(--brand)" },
  database: { label: "Database", color: "#1a9e8c" },
  bucket: { label: "Bucket", color: "#bf5af2" },
  key: { label: "Secret", color: "#b8862b" },
  person: { label: "Person", color: "#30b0c7" },
};

// Everything a freshly issued API key can read, and what that read opens up.
// `hop` marks when the scan in the demo flags each node.
const leaked: (BlastNode & { hop?: number })[] = [
  {
    id: "warehouse",
    label: "analytics-warehouse",
    kind: "service",
    affected: true,
    hop: 1,
    note: "Granted read on every schema",
  },
  {
    id: "billing",
    label: "billing-exports",
    parent: "warehouse",
    kind: "bucket",
    affected: true,
    hop: 2,
    note: "Read by the new key",
  },
  {
    id: "events",
    label: "events-raw",
    parent: "warehouse",
    kind: "bucket",
    affected: true,
    indirect: true,
    hop: 2,
    note: "Readable through a warehouse view",
  },
  {
    id: "payments",
    label: "payments-api",
    kind: "service",
    affected: true,
    hop: 1,
    note: "Key has the payments:read scope",
  },
  {
    id: "stripe",
    label: "stripe-secret",
    parent: "payments",
    kind: "key",
    affected: true,
    indirect: true,
    hop: 2,
    note: "Mounted as an env var in payments-api",
  },
  {
    id: "ledger",
    label: "ledger-db",
    parent: "payments",
    kind: "database",
    note: "Row-level policy blocks the key",
  },
  { id: "support", label: "support-db", kind: "database", note: "No grant for this key" },
  { id: "attachments", label: "ticket-attachments", parent: "support", kind: "bucket" },
  { id: "zendesk", label: "zendesk-sync", parent: "support", kind: "service" },
  { id: "ci", label: "ci-runner", kind: "service", note: "Separate project" },
  { id: "deploy", label: "deploy-key", parent: "ci", kind: "key" },
  {
    id: "crm",
    label: "crm-api",
    kind: "service",
    affected: true,
    hop: 1,
    note: "Key has the contacts:read scope",
  },
  {
    id: "contacts",
    label: "customer-contacts",
    parent: "crm",
    kind: "database",
    affected: true,
    hop: 2,
    note: "Read by the new key",
  },
  {
    id: "sales",
    label: "sales-team",
    parent: "crm",
    kind: "person",
    note: "Owners of crm-api",
  },
  { id: "docs", label: "docs-site", kind: "service" },
  { id: "search", label: "search-index", parent: "docs", kind: "database" },
  {
    id: "maya",
    label: "maya.rios",
    parent: "docs",
    kind: "person",
    note: "Created the key",
  },
];

const toolKinds: Record<string, BlastKind> = {
  tool: { label: "MCP tool", color: "#5e5ce6" },
  database: { label: "Database", color: "#1a9e8c" },
  bucket: { label: "Bucket", color: "#bf5af2" },
  service: { label: "Service", color: "var(--brand)" },
  key: { label: "Secret", color: "#b8862b" },
};

// What a support agent's MCP tools can reach. Write and exec tools are the risk.
const tools: BlastNode[] = [
  { id: "gh", label: "github.read_file", kind: "tool", note: "Read-only, two repos" },
  { id: "repo-app", label: "acme/support-app", parent: "gh", kind: "service" },
  { id: "repo-docs", label: "acme/help-center", parent: "gh", kind: "service" },
  {
    id: "pg",
    label: "postgres.query",
    kind: "tool",
    affected: true,
    note: "Accepts raw SQL, not just SELECT",
  },
  {
    id: "users",
    label: "users",
    parent: "pg",
    kind: "database",
    affected: true,
    note: "Writable by the agent's role",
  },
  {
    id: "orders",
    label: "orders",
    parent: "pg",
    kind: "database",
    affected: true,
    indirect: true,
    note: "Reachable through a foreign key cascade",
  },
  { id: "slack", label: "slack.post_message", kind: "tool", note: "Limited to #support" },
  { id: "support-channel", label: "#support", parent: "slack", kind: "service" },
  {
    id: "s3",
    label: "s3.put_object",
    kind: "tool",
    affected: true,
    note: "Bucket policy allows overwrite",
  },
  {
    id: "backups",
    label: "nightly-backups",
    parent: "s3",
    kind: "bucket",
    affected: true,
    note: "Agent can overwrite backups",
  },
  { id: "uploads", label: "customer-uploads", parent: "s3", kind: "bucket" },
  {
    id: "shell",
    label: "shell.exec",
    kind: "tool",
    affected: true,
    note: "Runs on the worker host",
  },
  {
    id: "worker",
    label: "agent-worker-01",
    parent: "shell",
    kind: "service",
    affected: true,
    note: "Full shell as the app user",
  },
  {
    id: "env",
    label: "OPENAI_API_KEY",
    parent: "shell",
    kind: "key",
    affected: true,
    indirect: true,
    note: "Readable from the process env",
  },
  { id: "fetch", label: "web.fetch", kind: "tool", note: "Outbound only" },
  { id: "kb", label: "kb.search", kind: "tool", note: "Read-only index" },
  { id: "kb-index", label: "help-articles", parent: "kb", kind: "database" },
];

// The scan flags the first hop, then follows the grants one hop further.
const script: MockStep<number>[] = [
  { delay: 900, apply: () => 1 },
  { delay: 700, apply: () => 2 },
];

export default function BlastRadiusDemo({
  variant = "Leaked key",
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const { state: scanned } = useMockRun<number>(autoplay ? 0 : 2, script, { autoplay });

  if (variant === "Tool permissions") {
    const risky = tools.filter((t) => t.affected).length;
    return (
      <BlastRadius
        title="Tool permissions"
        subtitle="support-agent · 6 MCP tools"
        center={{ label: "support-agent", initials: "SA" }}
        nodes={tools}
        kinds={toolKinds}
        aside={<StatusPill tone="negative">{risky} at risk</StatusPill>}
      />
    );
  }

  const nodes = leaked.map(({ hop, ...node }) => ({
    ...node,
    affected: node.affected && (hop ?? 0) <= scanned,
  }));
  const count = nodes.filter((n) => n.affected).length;
  return (
    <BlastRadius
      title="Blast radius"
      subtitle="sk-live-…7f2a · issued 14 min ago"
      center={{ label: "sk-live-…7f2a", icon: Key }}
      nodes={nodes}
      kinds={kinds}
      aside={
        <StatusPill tone={count ? "negative" : "neutral"}>
          {count ? `${count} exposed` : "Scanning"}
        </StatusPill>
      }
    />
  );
}
