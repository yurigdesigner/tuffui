"use client";

import { useState } from "react";
import type { AgentStatusData } from "@/components/ui/agent-status";
import type { Checkpoint } from "@/components/ui/checkpoint-timeline";
import type { FileChange } from "@/components/ui/file-changes";
import { StreamingMessage } from "@/components/ui/streaming-message";
import type { TerminalLine, TerminalRun } from "@/components/ui/terminal-output";
import {
  ToolApprovalQueue,
  type ToolApprovalRequest,
} from "@/components/ui/tool-approval-queue";
import { ToolCallBlock, type ToolCall } from "@/components/ui/tool-call-block";
import {
  streamText,
  useMockRun,
  wait,
  type MockStep,
} from "@/registry/use-mock-run/use-mock-run";
import { CodingAgent, type CodingAgentData, type WorkTab } from "./coding-agent";

// An agent adding dark mode to a settings page.
const task =
  "Add dark mode to Settings → Appearance. Follow the system theme by default and remember the choice.";

const note =
  "The page already reads colors from CSS variables, so dark mode is a second set of tokens plus a three-way switch. I'll keep System as the default and store the choice in localStorage.";

const summary =
  "Done. Appearance now has System, Light and Dark; System follows the OS and updates live, and the choice survives reloads. Six tests pass — review the three files in Changes and apply when you're happy.";

type Phase = "plan" | "note" | "approval" | "testing" | "summary" | "done";

type State = {
  calls: ToolCall[];
  note: string;
  approval?: ToolApprovalRequest;
  summary: string;
  files: FileChange[];
  lines: TerminalLine[];
  testStatus: TerminalRun["status"];
  dark: boolean;
  checkpoints: Checkpoint[];
  activity?: Omit<AgentStatusData, "startedAt">;
  tab: WorkTab;
  phase: Phase;
};

const call = (
  id: string,
  name: string,
  args: Record<string, unknown>,
  done: boolean,
  result?: ToolCall["result"],
  durationMs?: number,
): ToolCall => ({
  id,
  name,
  args,
  status: done ? "success" : "running",
  result: done ? result : undefined,
  durationMs: done ? durationMs : undefined,
});

const themeFile: FileChange = {
  id: "theme",
  path: "src/theme.ts",
  status: "added",
  hunks: [
    {
      id: "type",
      oldStart: 0,
      newStart: 1,
      lines: [
        { type: "add", text: "export type Theme =" },
        { type: "add", text: '  "system" | "light" | "dark";' },
        { type: "add", text: "" },
        { type: "add", text: "export function apply(t: Theme) {" },
        { type: "add", text: '  const dark = t === "dark" ||' },
        { type: "add", text: '    (t === "system" && osDark());' },
        { type: "add", text: "  root.classList.toggle(" },
        { type: "add", text: '    "dark", dark);' },
        { type: "add", text: "}" },
      ],
    },
  ],
};

const appearanceFile: FileChange = {
  id: "appearance",
  path: "src/settings/appearance.tsx",
  status: "modified",
  hunks: [
    {
      id: "import",
      oldStart: 1,
      newStart: 1,
      lines: [
        { type: "context", text: 'import { Row } from "./row";' },
        { type: "add", text: 'import { apply } from "../theme";' },
      ],
    },
    {
      id: "switch",
      oldStart: 14,
      newStart: 15,
      lines: [
        { type: "remove", text: '<Row label="Theme">Light</Row>' },
        { type: "add", text: '<Row label="Theme">' },
        { type: "add", text: "  <ThemeSwitch" },
        { type: "add", text: "    value={theme}" },
        { type: "add", text: "    onChange={save} />" },
        { type: "add", text: "</Row>" },
      ],
    },
  ],
};

const testFile: FileChange = {
  id: "test",
  path: "src/settings/theme.test.ts",
  status: "added",
  hunks: [
    {
      id: "cases",
      oldStart: 0,
      newStart: 1,
      lines: [
        { type: "add", text: 'test("follows the OS", () => {' },
        { type: "add", text: '  mockOS("dark");' },
        { type: "add", text: '  apply("system");' },
        { type: "add", text: "  expect(isDark()).toBe(true);" },
        { type: "add", text: "});" },
      ],
    },
  ],
};

const testOutput: TerminalLine[] = [
  { text: "> web@3.2.0 test settings", stream: "info" },
  { text: "" },
  { text: " RUN  v3.2.4 /repo/apps/web", stream: "info" },
  { text: " ✓ theme.test.ts > follows the OS" },
  { text: " ✓ theme.test.ts > light overrides OS" },
  { text: " ✓ theme.test.ts > dark overrides OS" },
  { text: " ✓ theme.test.ts > updates on OS change" },
  { text: " ✓ appearance.test.tsx > saves choice" },
  { text: " ✓ appearance.test.tsx > restores choice" },
  { text: "" },
  { text: " Test Files  2 passed (2)" },
  { text: "      Tests  6 passed (6)" },
];

const checkpoint = (
  n: number,
  label: string,
  files: Checkpoint["files"],
): Checkpoint => ({
  id: `cp${n}`,
  label,
  at: `${12 - n}m ago`,
  files,
});

const approval = (status: ToolApprovalRequest["status"]): ToolApprovalRequest => ({
  id: "tests",
  tool: "bash",
  title: "Run the settings tests",
  risk: "low",
  agent: "coding-agent",
  status,
  scope: status === "approved" ? "once" : undefined,
  payload: { kind: "shell", command: "pnpm test settings", cwd: "~/web" },
});

const initial: State = {
  calls: [],
  note: "",
  summary: "",
  files: [],
  lines: [],
  testStatus: "running",
  dark: false,
  checkpoints: [],
  activity: {
    label: "Reading the settings page",
    detail: "src/settings/",
    status: "working",
  },
  tab: "changes",
  phase: "plan",
};

const set = (
  patch: Partial<State> | ((s: State) => Partial<State>),
): MockStep<State> => ({
  delay: 0,
  apply: (s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }),
});

const activity = (label: string, detail?: string) =>
  set({ activity: { label, detail, status: "working" } });

const readCalls = [
  call("read", "fs.read", { path: "src/settings/appearance.tsx" }, true, "54 lines", 180),
  call(
    "grep",
    "code.search",
    { query: "var(--color-", in: "src/" },
    true,
    { matches: 38 },
    420,
  ),
];

const script: MockStep<State>[] = [
  wait(700),
  set({
    calls: [call("read", "fs.read", { path: "src/settings/appearance.tsx" }, false)],
  }),
  wait(900),
  set({ calls: [readCalls[0]] }),
  activity("Finding color tokens", "var(--color-*)"),
  set((s) => ({
    calls: [
      ...s.calls,
      call("grep", "code.search", { query: "var(--color-", in: "src/" }, false),
    ],
  })),
  wait(1000),
  set({ calls: readCalls, phase: "note" }),
  ...streamText<State>(note, (s, text) => ({ ...s, note: text }), { interval: 18 }),
  activity("Writing dark tokens", "src/theme.ts"),
  wait(500),
  set((s) => ({
    files: [themeFile],
    checkpoints: [
      checkpoint(1, "Read the settings page", []),
      checkpoint(2, "Add dark tokens", [
        { path: "src/theme.ts", additions: 9, deletions: 0 },
      ]),
    ],
    tab: "changes",
    dark: s.dark,
  })),
  activity("Building the theme switch", "appearance.tsx"),
  wait(1300),
  set((s) => ({
    files: [themeFile, appearanceFile],
    checkpoints: [
      ...s.checkpoints,
      checkpoint(3, "Build the theme switch", [
        { path: "src/settings/appearance.tsx", additions: 6, deletions: 1 },
      ]),
    ],
    tab: "preview",
    dark: true,
  })),
  activity("Saving the choice", "localStorage · theme"),
  wait(1300),
  set((s) => ({
    files: [themeFile, appearanceFile, testFile],
    approval: approval("pending"),
    phase: "approval",
    activity: {
      label: "Waiting for approval",
      detail: "pnpm test settings",
      status: "working",
    },
    checkpoints: [
      ...s.checkpoints,
      checkpoint(4, "Remember the choice", [
        { path: "src/settings/theme.test.ts", additions: 5, deletions: 0 },
      ]),
    ],
  })),
  wait(2400),
  set({ approval: approval("approved"), phase: "testing", tab: "terminal" }),
  activity("Running the tests", "vitest · settings"),
  ...testOutput.map((line) => ({
    delay: 260,
    apply: (s: State) => ({ ...s, lines: [...s.lines, line] }),
  })),
  set({
    testStatus: "success",
    phase: "summary",
    activity: undefined,
  }),
  wait(400),
  ...streamText<State>(summary, (s, text) => ({ ...s, summary: text }), { interval: 18 }),
  set({ phase: "done", tab: "changes" }),
];

// The finished run, for the Review variant.
const finished: State = script.reduce((s, step) => step.apply(s), initial);

function WorkTurn({ state, onDecide }: { state: State; onDecide: () => void }) {
  return (
    <div className="flex w-full flex-col gap-3">
      {state.calls.map((c) => (
        <ToolCallBlock key={c.id} data={c} className="max-w-none" />
      ))}
      {state.note && (
        <StreamingMessage
          data={{
            content: state.note,
            status: state.phase === "note" ? "streaming" : "done",
          }}
          showHeader={false}
          className="max-w-none"
        />
      )}
      {state.approval?.status === "pending" && (
        <ToolApprovalQueue
          data={[state.approval]}
          layout="flat"
          defaultExpanded="tests"
          onDecide={onDecide}
          className="max-w-none"
        />
      )}
      {/* Once approved, the request becomes the command it ran. */}
      {state.approval?.status === "approved" && (
        <ToolCallBlock
          data={call(
            "tests",
            "bash",
            { command: "pnpm test settings", approved: "once" },
            state.testStatus === "success",
            "6 passed (6)",
            3_120,
          )}
          className="max-w-none"
        />
      )}
    </div>
  );
}

export default function CodingAgentDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  // Review, and paused thumbnails, show the finished run.
  const review = variant === "Review" || !autoplay;
  const { state, setState } = useMockRun<State>(
    review ? finished : initial,
    review ? [] : script,
    { autoplay },
  );
  // No clock during prerender; the timer shows 0s until it ticks.
  const [startedAt] = useState(() => (typeof window === "undefined" ? 0 : Date.now()));
  const [applying, setApplying] = useState(false);

  const at = (minutes: number) =>
    new Date(Date.UTC(2026, 10, 3, 14, minutes)).toISOString();
  const running = state.phase !== "done";

  const data: CodingAgentData = {
    title: "Dark mode for Settings",
    repo: "acme/web",
    branch: "feat/settings-dark-mode",
    model: "opus-5.5",
    user: { name: "Maya Chen" },
    messages: [
      { id: "task", role: "user", at: at(2), content: task },
      {
        id: "work",
        role: "assistant",
        at: at(3),
        content: (
          <WorkTurn
            state={state}
            onDecide={() =>
              setState((s) => (s.approval ? { ...s, approval: approval("approved") } : s))
            }
          />
        ),
      },
      ...(state.summary
        ? [
            {
              id: "summary",
              role: "assistant" as const,
              at: at(9),
              content: (
                <StreamingMessage
                  data={{
                    content: state.summary,
                    status:
                      state.phase === "summary"
                        ? ("streaming" as const)
                        : ("done" as const),
                  }}
                  showHeader={false}
                  className="max-w-none"
                />
              ),
            },
          ]
        : []),
    ],
    activity: state.activity ? { ...state.activity, startedAt } : undefined,
    files: state.files,
    terminal: {
      command: "pnpm test settings",
      cwd: "~/web",
      lines: state.lines,
      status: state.lines.length ? state.testStatus : "running",
      exitCode: state.testStatus === "success" ? 0 : undefined,
      durationMs: state.testStatus === "success" ? 3_120 : undefined,
    },
    checkpoints: state.checkpoints,
    preview: {
      url: "localhost:3000/settings/appearance",
      content: <SettingsPreview dark={state.dark} />,
    },
  };

  return (
    <CodingAgent
      data={data}
      status={running ? "streaming" : "idle"}
      tab={state.tab}
      onTabChange={(tab) => setState((s) => ({ ...s, tab }))}
      onStop={() => setState((s) => ({ ...s, activity: undefined, phase: "done" }))}
      applying={applying}
      onApply={() => {
        setApplying(true);
        setTimeout(() => setApplying(false), 1200);
      }}
    />
  );
}

/** A rendered page for the Preview tab: the settings screen the agent is editing. */
function SettingsPreview({ dark }: { dark: boolean }) {
  const page = dark ? "#1c1c1e" : "#f5f5f7";
  const card = dark ? "#2c2c2e" : "#ffffff";
  const text = dark ? "#f5f5f7" : "#1d1d1f";
  const muted = dark ? "#98989d" : "#6e6e73";
  const options = ["System", "Light", "Dark"];
  return (
    <div
      className="rounded-xl p-4 transition-colors duration-300"
      style={{ background: page, color: text }}
    >
      <p className="text-[0.8125rem]" style={{ color: muted }}>
        Settings
      </p>
      <h3 className="mt-0.5 text-base font-semibold">Appearance</h3>
      <div
        className="mt-3 flex flex-col gap-2 rounded-xl p-3"
        style={{ background: card }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm">Theme</span>
          <span
            className="flex rounded-full p-0.5 text-xs"
            style={{ background: dark ? "#3a3a3c" : "#e8e8ed" }}
          >
            {options.map((o) => {
              const active = o === (dark ? "Dark" : "Light");
              return (
                <span
                  key={o}
                  className="rounded-full px-2.5 py-1"
                  style={{
                    background: active ? (dark ? "#636366" : "#ffffff") : "transparent",
                    color: active ? text : muted,
                  }}
                >
                  {o}
                </span>
              );
            })}
          </span>
        </div>
        <p className="text-xs" style={{ color: muted }}>
          {dark
            ? "Dark is on. Switch back any time."
            : "Follows your system until you pick one."}
        </p>
      </div>
      <div
        className="mt-2 flex flex-col gap-2 rounded-xl p-3"
        style={{ background: card }}
      >
        <div className="flex items-center justify-between text-sm">
          <span>Reduce motion</span>
          <span className="text-xs" style={{ color: muted }}>
            Off
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Text size</span>
          <span className="text-xs" style={{ color: muted }}>
            Default
          </span>
        </div>
      </div>
    </div>
  );
}
