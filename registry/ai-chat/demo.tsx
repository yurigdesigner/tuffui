"use client";

import {
  ChartBar,
  EnvelopeSimple,
  Lightbulb,
  MagnifyingGlass,
  Users,
} from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import { ResponseFeedback } from "@/components/ui/response-feedback";
import { SourceList, type Source } from "@/components/ui/source-list";
import { StreamingMessage } from "@/components/ui/streaming-message";
import { ToolCallBlock, type ToolCall } from "@/components/ui/tool-call-block";
import {
  streamText,
  useMockRun,
  wait,
  type MockStep,
} from "@/registry/use-mock-run/use-mock-run";
import { AIChat, type AIChatData } from "./ai-chat";

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

type Turn = {
  id: string;
  role: "user" | "assistant";
  at: string;
  text: string;
  call?: ToolCall;
  phase?: "tool" | "streaming" | "done";
  sources?: Source[];
};

type State = { turns: Turn[]; status: "idle" | "streaming"; followUps: boolean };

const sources: Source[] = [
  {
    id: "s1",
    title: "Interview — Northwind Labs, ops lead",
    url: "https://research.acme.app/interviews/northwind",
    snippet:
      "“The checklist made it obvious what to do next. I set up billing on day one.”",
    date: "Oct 28",
  },
  {
    id: "s2",
    title: "Interview — Halcyon Health, admin",
    url: "https://research.acme.app/interviews/halcyon",
    snippet: "“Inviting the team was buried. I only found it after asking support.”",
    date: "Oct 29",
  },
  {
    id: "s3",
    title: "Onboarding funnel — week 44",
    url: "https://metrics.acme.app/funnels/onboarding",
    snippet: "Checklist completion 61% → 74%; invite step drop-off unchanged at 38%.",
    date: "Nov 1",
  },
];

const answer =
  "Across the six interviews, people liked the new setup checklist — it made the next step obvious and two teams set up billing on day one [1]. The weak spot is inviting teammates: four of six couldn't find it without help [2]. The funnel agrees: checklist completion rose from 61% to 74%, but drop-off at the invite step is still 38% [3]. I'd move invites into the checklist as step two.";

const stripMarkers = (text: string) => text.replace(/\s?\[\d+(?:,\s?\d+)*\]/g, "");

const search = (status: ToolCall["status"]): ToolCall => ({
  id: "search",
  name: "docs.search",
  args: { query: "onboarding interview notes", since: "7d", limit: 10 },
  status,
  durationMs: status === "success" ? 1_420 : undefined,
  result:
    status === "success"
      ? { matches: 6, top: ["northwind", "halcyon", "brightline"] }
      : undefined,
});

const prompt =
  "What did customers say about the new onboarding in last week's interviews?";

const history: Turn[] = [
  {
    id: "h1",
    role: "user",
    at: ago(42),
    text: "Draft five interview questions about the new onboarding.",
  },
  {
    id: "h2",
    role: "assistant",
    at: ago(41),
    phase: "done",
    text: "Here are five: what did you expect to do first, what made you pause, how did you invite your team, what did you skip, and what would you change first? I kept them open-ended so people describe what they did rather than rate it.",
  },
];

const ask = (s: State, text: string): State => ({
  ...s,
  followUps: false,
  status: "streaming",
  turns: [
    ...s.turns,
    { id: `u${s.turns.length}`, role: "user", at: new Date().toISOString(), text },
    {
      id: `a${s.turns.length}`,
      role: "assistant",
      at: new Date().toISOString(),
      text: "",
      phase: "tool",
      call: search("running"),
    },
  ],
});

const updateLast = (s: State, patch: Partial<Turn>): State => ({
  ...s,
  turns: s.turns.map((t, i) => (i === s.turns.length - 1 ? { ...t, ...patch } : t)),
});

const answerSteps: MockStep<State>[] = [
  wait(1400),
  {
    delay: 0,
    apply: (s) => updateLast(s, { call: search("success"), phase: "streaming" }),
  },
  ...streamText<State>(stripMarkers(answer), (s, text) => updateLast(s, { text }), {
    interval: 26,
    startDelay: 300,
  }),
  {
    delay: 200,
    apply: (s) => ({
      ...updateLast(s, { text: answer, phase: "done", sources }),
      status: "idle",
      followUps: true,
    }),
  },
];

const conversationScript: MockStep<State>[] = [
  wait(900),
  { delay: 0, apply: (s) => ask(s, prompt) },
  ...answerSteps,
];

// In "New chat" the starter card is picked, then the same run plays.
const newChatScript: MockStep<State>[] = [wait(1600), ...conversationScript.slice(1)];

const followUps = [
  { id: "f1", title: "Draft the checklist change" },
  { id: "f2", title: "Which teams struggled most?" },
  { id: "f3", title: "Chart invite drop-off by plan" },
];

const starters = [
  {
    id: "st1",
    icon: Users,
    title: "Summarize customer interviews",
    hint: "From last week's notes",
    prompt,
  },
  {
    id: "st2",
    icon: ChartBar,
    title: "Chart onboarding drop-off",
    hint: "By step and by plan",
  },
  {
    id: "st3",
    icon: EnvelopeSimple,
    title: "Draft the release email",
    hint: "From merged pull requests",
  },
  {
    id: "st4",
    icon: Lightbulb,
    title: "Find quick wins",
    hint: "In open support tickets",
  },
];

const conversations: AIChatData["conversations"] = [
  { id: "c1", title: "Onboarding interview notes", updatedAt: ago(1), running: false },
  { id: "c2", title: "Q4 pricing page copy", updatedAt: ago(90), pinned: true },
  { id: "c3", title: "Churn reasons by plan", updatedAt: ago(60 * 5) },
  { id: "c4", title: "Support macros in German", updatedAt: ago(60 * 26) },
  { id: "c5", title: "Release notes for 2.4", updatedAt: ago(60 * 30) },
  { id: "c6", title: "Hiring plan — design", updatedAt: ago(60 * 24 * 4) },
];

function AssistantTurn({ turn, last }: { turn: Turn; last: boolean }) {
  return (
    <div className="flex w-full flex-col gap-3">
      {turn.call && <ToolCallBlock data={turn.call} className="max-w-none" />}
      {turn.phase === "tool" && (
        <p className="flex items-center gap-2 text-[0.8125rem] text-muted-foreground">
          <MagnifyingGlass weight="bold" className="size-3.5" aria-hidden="true" />
          Searching your research notes…
        </p>
      )}
      {turn.phase === "streaming" && (
        <StreamingMessage
          data={{ content: turn.text, status: "streaming" }}
          showHeader={false}
          className="max-w-none"
        />
      )}
      {turn.phase === "done" &&
        (turn.sources ? (
          <SourceList
            data={{ sources: turn.sources, text: turn.text }}
            variant="footnotes"
            className="max-w-none"
          />
        ) : (
          <p>{turn.text}</p>
        ))}
      {turn.phase === "done" && last && <ResponseFeedback />}
    </div>
  );
}

export default function AIChatDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const fresh = variant === "New chat";
  const { state, setState } = useMockRun<State>(
    { turns: fresh ? [] : history, status: "idle", followUps: false },
    fresh ? newChatScript : conversationScript,
    { autoplay },
  );

  // Messages the viewer sends get the same scripted answer.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const play = (text: string) => {
    timers.current.forEach(clearTimeout);
    setState((s) => ask(s, text));
    let at = 0;
    timers.current = answerSteps.map((step) => {
      at += step.delay;
      return setTimeout(() => setState(step.apply), at);
    });
  };

  const data: AIChatData = {
    conversations,
    activeId: state.turns.length ? "c1" : undefined,
    title: "Onboarding interview notes",
    model: "opus-5.5",
    user: { name: "Maya Chen" },
    starters,
    followUps: state.followUps ? followUps : undefined,
    context: {
      limit: 200_000,
      segments: [
        {
          id: "history",
          label: "Conversation",
          tokens: 4_200 + state.turns.length * 2_900,
        },
        {
          id: "files",
          label: "Research notes",
          tokens: state.turns.length > 2 ? 18_400 : 0,
        },
        { id: "system", label: "Instructions", tokens: 3_100, pinned: true },
      ],
    },
    messages: state.turns.map((turn, i) => ({
      id: turn.id,
      role: turn.role,
      at: turn.at,
      content:
        turn.role === "user" ? (
          turn.text
        ) : (
          <AssistantTurn turn={turn} last={i === state.turns.length - 1} />
        ),
    })),
  };

  return (
    <AIChat
      data={data}
      status={state.status}
      onSend={play}
      onStop={() => {
        timers.current.forEach(clearTimeout);
        setState((s) => ({ ...updateLast(s, { phase: "done" }), status: "idle" }));
      }}
      onNewChat={() => {
        timers.current.forEach(clearTimeout);
        setState({ turns: [], status: "idle", followUps: false });
      }}
    />
  );
}
