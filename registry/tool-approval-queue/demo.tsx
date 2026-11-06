"use client";

import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { ToolApprovalQueue, type ToolApprovalRequest } from "./tool-approval-queue";

const requests: ToolApprovalRequest[] = [
  {
    id: "changelog",
    tool: "fs.write",
    title: "Add the 2.4.0 section to the changelog",
    risk: "low",
    agent: "release-agent",
    payload: {
      kind: "diff",
      path: "docs/changelog.md",
      lines: [
        { type: "context", text: "# Changelog" },
        { type: "add", text: "## 2.4.0 — 3 Nov 2026" },
        { type: "add", text: "- Offline mode for the desktop app" },
        { type: "add", text: "- Faster cold start on Windows (−38%)" },
        { type: "context", text: "## 2.3.2 — 14 Oct 2026" },
      ],
    },
  },
  {
    id: "release",
    tool: "bash",
    title: "Create the GitHub release",
    risk: "medium",
    agent: "release-agent",
    payload: {
      kind: "shell",
      cwd: "~/src/desktop",
      command: "gh release create v2.4.0 --notes-file docs/changelog.md --verify-tag",
    },
  },
  {
    id: "slack",
    tool: "slack.post",
    title: "Announce the release in #releases",
    risk: "medium",
    agent: "release-agent",
    payload: {
      kind: "json",
      args: {
        channel: "#releases",
        text: "Desktop 2.4.0 is out — offline mode and a faster Windows start.",
      },
    },
  },
  {
    id: "publish",
    tool: "bash",
    title: "Publish the SDK to npm",
    risk: "high",
    agent: "release-agent",
    payload: {
      kind: "shell",
      cwd: "~/src/desktop/packages/sdk",
      command: "npm publish --access public --tag latest",
    },
  },
];

type State = { data: ToolApprovalRequest[]; selected: string[] };

const resolve = (ids: string[], status: "approved" | "denied") => (s: State) => ({
  data: s.data.map((r) => (ids.includes(r.id) ? { ...r, status } : r)),
  selected: s.selected.filter((id) => !ids.includes(id)),
});

const script: MockStep<State>[] = [
  // Requests arrive while the agent works.
  ...requests.map((r, i) => ({
    delay: i ? 700 : 400,
    apply: (s: State) => ({ ...s, data: [...s.data, r] }),
  })),
  wait(1100),
  { delay: 0, apply: (s) => ({ ...s, selected: ["changelog"] }) },
  { delay: 600, apply: (s) => ({ ...s, selected: ["changelog", "release"] }) },
  { delay: 1400, apply: resolve(["changelog", "release"], "approved") },
  { delay: 1600, apply: resolve(["slack"], "denied") },
];

export default function ToolApprovalQueueDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const { state, setState } = useMockRun<State>(
    // Paused thumbnails show the full queue.
    { data: autoplay ? [] : requests, selected: [] },
    script,
    { autoplay },
  );

  return (
    <ToolApprovalQueue
      data={state.data}
      layout={variant === "Flat" ? "flat" : "grouped"}
      defaultExpanded="publish"
      selected={state.selected}
      onSelectedChange={(selected) => setState((s) => ({ ...s, selected }))}
      onUndo={(request) =>
        setState((s) => ({
          ...s,
          data: s.data.map((r) =>
            r.id === request.id ? { ...r, status: "pending" } : r,
          ),
        }))
      }
    />
  );
}
