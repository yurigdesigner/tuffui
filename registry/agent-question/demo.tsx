"use client";

import { ChatsCircle, Megaphone, Newspaper, PaperPlaneTilt } from "@phosphor-icons/react";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  AgentQuestion,
  type AgentQuestionData,
  type QuestionAnswer,
} from "./agent-question";

const single: AgentQuestionData = {
  question: "Which locale should the new onboarding emails ship in first?",
  options: [
    { id: "de", label: "German", description: "31% of last month's sign-ups" },
    { id: "fr", label: "French", description: "18% · footer needs a legal review" },
    { id: "ja", label: "Japanese", description: "12% · longest translation queue" },
    { id: "pt", label: "Portuguese (Brazil)", description: "9% · glossary not started" },
  ],
  allowOther: true,
  suggested: {
    optionId: "de",
    reason: "the glossary is done and it's the biggest group.",
  },
};

const multiple: AgentQuestionData = {
  question: "Where should the 2.4 release be announced?",
  options: [
    {
      id: "banner",
      label: "In-app banner",
      description: "Seen by daily users",
      icon: Megaphone,
    },
    {
      id: "email",
      label: "Newsletter",
      description: "41k subscribers",
      icon: PaperPlaneTilt,
    },
    {
      id: "blog",
      label: "Blog post",
      description: "Long-form, for search",
      icon: Newspaper,
    },
    {
      id: "discord",
      label: "Discord",
      description: "#announcements",
      icon: ChatsCircle,
    },
  ],
  multiple: true,
  suggested: { optionId: "banner", reason: "most users open the app daily." },
};

type State = {
  selected: string[];
  status: "pending" | "answered" | "delegated";
  answer?: QuestionAnswer;
};

const singleScript: MockStep<State>[] = [
  wait(2400),
  {
    delay: 0,
    apply: (s) => ({ ...s, status: "answered", answer: { optionIds: ["de"] } }),
  },
];

const multipleScript: MockStep<State>[] = [
  wait(1600),
  { delay: 0, apply: (s) => ({ ...s, selected: ["banner"] }) },
  { delay: 800, apply: (s) => ({ ...s, selected: ["banner", "discord"] }) },
  wait(1300),
  {
    delay: 0,
    apply: (s) => ({ ...s, status: "answered", answer: { optionIds: s.selected } }),
  },
];

export default function AgentQuestionDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const isMultiple = variant === "Multiple";
  const { state, setState } = useMockRun<State>(
    { selected: [], status: "pending" },
    isMultiple ? multipleScript : singleScript,
    { autoplay },
  );

  return (
    <AgentQuestion
      data={isMultiple ? multiple : single}
      agent={isMultiple ? "launch-agent" : "Claude"}
      status={state.status}
      answer={state.answer}
      selected={state.selected}
      onSelectedChange={(selected) => setState((s) => ({ ...s, selected }))}
      onSubmit={(answer) => setState((s) => ({ ...s, status: "answered", answer }))}
      onDelegate={() => setState((s) => ({ ...s, status: "delegated" }))}
      onUndo={() => setState({ selected: [], status: "pending" })}
    />
  );
}
