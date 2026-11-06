"use client";

import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { ToolCallBlock, type ToolCall } from "./tool-call-block";

type State = ToolCall[];

const search: ToolCall = {
  id: "search",
  name: "web.search",
  args: { query: "postgres 17 logical replication failover slots", limit: 5 },
  status: "pending",
  result: {
    hits: 5,
    top: "PostgreSQL 17 release notes — Logical replication failover",
    url: "https://www.postgresql.org/docs/17/release-17.html",
  },
};

const read: ToolCall = {
  id: "read",
  name: "fs.read",
  args: { path: "infra/db/replication.tf", lines: "1-80" },
  status: "pending",
  result:
    'resource "aws_db_instance" "replica" {\n  replicate_source_db = aws_db_instance.primary.id\n  instance_class      = "db.r6g.large"\n  # failover slots not enabled\n}',
};

const query: ToolCall = {
  id: "query",
  name: "db.query",
  args: {
    sql: "SELECT slot_name, failover FROM pg_replication_slots;",
    database: "billing",
  },
  status: "pending",
  error: "connection timed out after 5000ms (replica-2.internal:5432)",
  result: { rows: [{ slot_name: "billing_sub", failover: false }], rowCount: 1 },
};

const set = (id: string, patch: Partial<ToolCall>, delay: number): MockStep<State> => ({
  delay,
  apply: (s) => s.map((c) => (c.id === id ? { ...c, ...patch } : c)),
});

const inlineScript: MockStep<State>[] = [
  wait(900),
  set("search", { status: "running" }, 0),
  set("search", { status: "success", durationMs: 1840 }, 1840),
  wait(2500),
];

const chatScript: MockStep<State>[] = [
  set("read", { status: "running" }, 900),
  set("read", { status: "success", durationMs: 380 }, 380),
  set("query", { status: "running" }, 300),
  set("query", { status: "error", durationMs: 5000 }, 2400),
  set("query", { status: "running", durationMs: undefined }, 1400),
  set("query", { status: "success", durationMs: 620 }, 620),
];

export default function ToolCallBlockDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const chat = variant === "In chat";
  const { state, setState } = useMockRun<State>(
    chat ? [{ ...search, status: "success", durationMs: 1210 }, read, query] : [search],
    chat ? chatScript : inlineScript,
    { autoplay },
  );
  const retry = (call: ToolCall) =>
    setState((s) =>
      s.map((c) => (c.id === call.id ? { ...c, status: "success", durationMs: 540 } : c)),
    );

  if (!chat) {
    return <ToolCallBlock key={state[0].id} data={state[0]} defaultOpen />;
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-2">
      <p className="mb-1 text-sm leading-6">
        I&apos;ll check whether failover slots are enabled on the billing replica before
        changing anything.
      </p>
      {state.map((call) => (
        <ToolCallBlock
          key={call.id}
          data={call}
          defaultOpen={call.id === "query"}
          onRetry={retry}
        />
      ))}
    </div>
  );
}
