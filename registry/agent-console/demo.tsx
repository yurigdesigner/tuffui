"use client";

import { useEffect, useRef } from "react";
import type { BackgroundAgent } from "@/components/ui/background-agents";
import type { EvalCase, EvalMetric } from "@/components/ui/eval-results";
import type { RateLimit } from "@/components/ui/rate-limits";
import type { TraceSpan } from "@/components/ui/run-trace";
import type { Stat } from "@/components/ui/stat-grid";
import { toast } from "@/components/ui/toast-stack";
import type { ToolApprovalRequest } from "@/components/ui/tool-approval-queue";
import type { UsageDay } from "@/components/ui/usage-summary";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { AgentConsole, type AgentConsoleData } from "./agent-console";

const team: AgentConsoleData["team"] = [
  { id: "invoice", name: "invoice-agent", status: "working" },
  { id: "triage", name: "triage-agent", status: "online" },
  { id: "docs", name: "docs-agent", status: "away" },
];

const stats = (runs: number, failing: boolean): Stat[] => [
  {
    id: "runs",
    label: "Runs today",
    value: runs.toLocaleString("en-US"),
    delta: 12,
    trend: [32, 41, 38, 52, 47, 58, 61],
    goal: { ratio: runs / 1500, label: "of 1,500 daily quota" },
  },
  {
    id: "success",
    label: "Success rate",
    value: failing ? "91.4%" : "98.2%",
    delta: failing ? -6.8 : 0.4,
    trend: failing ? [98, 98, 97, 98, 96, 93, 91] : [97, 98, 97, 98, 98, 98, 98],
    goal: { ratio: (failing ? 91.4 : 98.2) / 99, label: "SLO 99%" },
  },
  {
    id: "p95",
    label: "p95 latency",
    value: failing ? "14.8s" : "6.2s",
    delta: failing ? 139 : -8,
    higherIsBetter: false,
    trend: [7, 6.8, 6.5, 6.6, 6.3, failing ? 11 : 6.2, failing ? 14.8 : 6.2],
    // Under target reads as a full bar; over it shrinks.
    goal: { ratio: Math.min(8 / (failing ? 14.8 : 6.2), 1), label: "Target 8s" },
  },
  {
    id: "spend",
    label: "Spend today",
    value: "$184.20",
    delta: 5,
    goal: { ratio: 0.61, label: "of $300 daily cap" },
  },
];

const agents = (progress: number, failing: boolean): BackgroundAgent[] => [
  {
    id: "a1",
    name: "invoice-agent",
    task: "Backfill March invoice PDFs",
    status: failing ? "failed" : progress >= 1 ? "done" : "running",
    progress: failing ? 0.48 : Math.min(progress, 1),
    action: failing
      ? "pdf.render timed out after 3 retries"
      : progress >= 1
        ? "1,204 PDFs written"
        : "Rendering batch 7 of 12",
    elapsedMs: 412_000 + progress * 90_000,
  },
  {
    id: "a2",
    name: "triage-agent",
    task: "Label new support tickets",
    status: "running",
    progress: 0.72,
    action: "Classifying ticket #48213",
    elapsedMs: 1_820_000,
  },
  {
    id: "a3",
    name: "docs-agent",
    task: "Translate API reference to Japanese",
    status: "waiting",
    progress: 0.4,
    action: "Needs a glossary decision",
    elapsedMs: 960_000,
  },
  {
    id: "a4",
    name: "triage-agent",
    task: "Merge duplicate tickets",
    status: "queued",
    progress: 0,
    action: "Waits for a free worker",
    elapsedMs: 0,
  },
];

const spans = (elapsed: number, failing: boolean): TraceSpan[] => {
  const all: TraceSpan[] = [
    { id: "root", name: "invoice-backfill", kind: "agent", startMs: 0, endMs: 7400 },
    {
      id: "plan",
      parentId: "root",
      name: "plan",
      kind: "llm",
      startMs: 120,
      endMs: 1050,
      model: "opus-5.5",
      tokens: { input: 1840, output: 260 },
      costUsd: 0.014,
    },
    {
      id: "list",
      parentId: "root",
      name: "billing.list",
      kind: "tool",
      startMs: 1100,
      endMs: 1900,
    },
    {
      id: "vat",
      parentId: "root",
      name: "vat.lookup",
      kind: "retrieval",
      startMs: 1950,
      endMs: 2600,
    },
    {
      id: "render",
      parentId: "root",
      name: "pdf.render",
      kind: "tool",
      startMs: 2650,
      endMs: failing ? 6100 : 5200,
      status: failing ? "error" : "ok",
    },
    {
      id: "write",
      parentId: "root",
      name: "storage.put",
      kind: "tool",
      startMs: failing ? 6150 : 5250,
      endMs: failing ? 6600 : 5900,
      status: failing ? "error" : "ok",
    },
    {
      id: "sum",
      parentId: "root",
      name: "summarize",
      kind: "llm",
      startMs: 6000,
      endMs: 7300,
      model: "sonnet-5.5",
      tokens: { input: 3200, output: 410 },
      costUsd: 0.006,
    },
  ];
  return all
    .filter((s) => s.startMs <= elapsed && !(failing && s.id === "sum"))
    .map((s) => (s.endMs && s.endMs > elapsed ? { ...s, endMs: undefined } : s));
};

const finalCase = (i: number): EvalCase["status"] =>
  [5, 19].includes(i)
    ? "regressed"
    : [11].includes(i)
      ? "fail"
      : [8, 27].includes(i)
        ? "improved"
        : "pass";

const cases = (done: number): EvalCase[] =>
  Array.from({ length: 32 }, (_, i) => ({
    id: `c${i}`,
    name: `invoice/case-${String(i + 1).padStart(2, "0")}`,
    status: i < done ? finalCase(i) : i < done + 4 ? "running" : "pending",
    score: finalCase(i) === "pass" || finalCase(i) === "improved" ? 0.94 : 0.31,
  }));

const metrics: EvalMetric[] = [
  {
    id: "acc",
    label: "Accuracy",
    baseline: 0.89,
    candidate: 0.93,
    better: "higher",
    format: (v) => `${Math.round(v * 100)}%`,
  },
  {
    id: "lat",
    label: "Latency p50",
    baseline: 4.1,
    candidate: 3.6,
    better: "lower",
    format: (v) => `${v.toFixed(1)}s`,
  },
  {
    id: "cost",
    label: "Cost per run",
    baseline: 0.031,
    candidate: 0.024,
    better: "lower",
    format: (v) => `$${v.toFixed(3)}`,
  },
];

const dates = ["10-28", "10-29", "10-30", "10-31", "11-01", "11-02", "11-03"];
const days: UsageDay[] = [42, 51, 47, 63, 58, 71, 66].map((k, i) => ({
  date: `2026-${dates[i]}`,
  byModel: {
    opus: { tokens: k * 90_000, cost: k * 1.4 },
    sonnet: { tokens: k * 160_000, cost: k * 0.9 },
  },
}));

const limits = (throttled: boolean): RateLimit[] => [
  {
    id: "req",
    label: "Requests",
    limit: 4000,
    remaining: throttled ? 1210 : 3120,
    resetsInMs: 14_000,
  },
  {
    id: "in",
    label: "Input tokens",
    limit: 2_000_000,
    remaining: throttled ? 240_000 : 1_310_000,
    resetsInMs: 14_000,
  },
  {
    id: "out",
    label: "Output tokens",
    limit: 400_000,
    remaining: throttled ? 0 : 228_000,
    resetsInMs: 14_000,
  },
];

const rollback: ToolApprovalRequest = {
  id: "rollback",
  tool: "deploy.rollback",
  title: "Roll invoice-agent back to v41",
  risk: "high",
  agent: "ops-agent",
  status: "pending",
  payload: {
    kind: "shell",
    command: "agentctl rollback invoice-agent --to v41 --drain 60s",
    cwd: "prod",
  },
};

type State = {
  runs: number;
  progress: number;
  elapsed: number;
  evalDone: number;
  incident: boolean;
};

const build = (s: State, failing: boolean): AgentConsoleData => ({
  title: "Agents",
  environment: "prod",
  team,
  stats: stats(s.runs, failing),
  agents: agents(s.progress, failing),
  run: {
    name: "invoice-backfill",
    spans: spans(s.elapsed, failing),
    elapsedMs: s.elapsed,
    failed: failing,
  },
  evals: {
    suite: "invoice-agent v42",
    label: "v42 vs v41",
    cases: cases(s.evalDone),
    baselinePassRate: 0.89,
    metrics,
  },
  usage: {
    days,
    models: [
      { id: "opus", name: "opus-5.5" },
      { id: "sonnet", name: "sonnet-5.5" },
    ],
    previousCost: 690,
    budget: { limit: 1200, label: "November" },
  },
  limits: {
    model: "opus-5.5 · Tier 3",
    limits: limits(failing),
    queued: failing
      ? [
          { id: "q1", label: "summarize batch 7", tokens: 41_000 },
          { id: "q2", label: "triage #48214", tokens: 6_000 },
        ]
      : [],
    retryAfterMs: failing ? 18_000 : undefined,
  },
  context: {
    limit: 200_000,
    model: "opus-5.5",
    segments: [
      { id: "history", label: "Run history", tokens: 61_000 },
      { id: "files", label: "Invoices batch", tokens: 38_000 },
      { id: "tools", label: "Tools", detail: "9 tools", tokens: 12_400, pinned: true },
      { id: "system", label: "Instructions", tokens: 3_100, pinned: true },
    ],
  },
  incident:
    failing && s.incident
      ? {
          title: "invoice-agent v42 is failing renders",
          description:
            "pdf.render times out on 52% of runs since 14:05 and output tokens are throttled.",
          approvals: [rollback],
        }
      : undefined,
});

export default function AgentConsoleDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const failing = variant === "Incident";
  const script: MockStep<State>[] = [
    wait(600),
    ...Array.from({ length: 10 }, (_, i): MockStep<State> => ({
      delay: 450,
      apply: (s) => ({
        ...s,
        runs: s.runs + 3,
        elapsed: Math.min(7400, s.elapsed + 800),
        progress: s.progress + 0.05,
        evalDone: Math.min(32, s.evalDone + 3 + (i % 2)),
      }),
    })),
    { delay: 400, apply: (s) => ({ ...s, progress: 1, elapsed: 7400, evalDone: 32 }) },
  ];
  const { state } = useMockRun<State>(
    {
      runs: 1_284,
      progress: 0.62,
      elapsed: failing ? 7400 : 2000,
      evalDone: failing ? 32 : 4,
      incident: true,
    },
    failing ? [] : script,
    { autoplay },
  );

  // A toast when the run finishes — only while the demo is playing.
  const told = useRef(false);
  useEffect(() => {
    if (!autoplay || failing || state.progress < 1 || told.current) return;
    told.current = true;
    toast.success("invoice-backfill finished", {
      description: "1,204 PDFs written in 8m 32s",
    });
  }, [autoplay, failing, state.progress]);

  return (
    <AgentConsole
      data={build(state, failing)}
      onDecide={(_, decision) =>
        toast(decision === "approved" ? "Rollback started" : "Rollback dismissed")
      }
      onAcknowledge={() => toast("Incident acknowledged")}
    />
  );
}
