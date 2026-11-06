"use client";

import {
  streamText,
  useMockRun,
  wait,
  type MockStep,
} from "@/registry/use-mock-run/use-mock-run";
import { ChatThread, type ThreadMessage } from "./chat-thread";

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

const history: ThreadMessage[] = [
  {
    id: "y1",
    role: "user",
    at: ago(26 * 60),
    content: "Which onboarding emails still go out in English only?",
  },
  {
    id: "y2",
    role: "assistant",
    at: ago(26 * 60 - 1),
    content:
      "Four of the seven: welcome, verify-email, trial-ending and first-invoice. The other three already use the locale from the user profile.",
  },
  {
    id: "t1",
    role: "user",
    at: ago(4),
    content: "Translate those four into German.",
  },
  {
    id: "t2",
    role: "user",
    at: ago(3),
    content: "Keep product names in English, and use the glossary for plan names.",
  },
];

const answer =
  "Done — all four templates now have a German version under emails/de. Product names stay in English and the plan names come from the glossary, so “Team” and “Business” match the pricing page. Want me to send test emails to your inbox?";

type State = { messages: ThreadMessage[] };

const script: MockStep<State>[] = [
  wait(900),
  {
    delay: 0,
    apply: (s) => ({
      messages: [
        ...s.messages,
        {
          id: "t3",
          role: "assistant",
          at: new Date().toISOString(),
          content: "",
          streaming: true,
        },
      ],
    }),
  },
  ...streamText<State>(
    answer,
    (s, content) => ({
      messages: s.messages.map((m) => (m.id === "t3" ? { ...m, content } : m)),
    }),
    { interval: 26 },
  ),
  {
    delay: 0,
    apply: (s) => ({
      messages: s.messages.map((m) => (m.id === "t3" ? { ...m, streaming: false } : m)),
    }),
  },
  { delay: 1400, apply: (s) => ({ messages: [...s.messages, followUp()] }) },
];

const followUp = (): ThreadMessage => ({
  id: "t4",
  role: "user",
  at: new Date().toISOString(),
  content: "Yes, send them to me.",
});

export default function ChatThreadDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const { state } = useMockRun<State>({ messages: history }, script, { autoplay });

  return (
    <ChatThread
      data={{ messages: state.messages, unreadFrom: "t3" }}
      density={variant === "Dense" ? "dense" : "default"}
      agentName="Claude"
      height={variant === "Dense" ? 340 : 420}
    />
  );
}
