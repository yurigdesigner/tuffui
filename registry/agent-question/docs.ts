import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { AgentQuestion } from "@/components/ui/agent-question";

export function Clarify({ question, agent }: { question: PendingQuestion; agent: Agent }) {
  return (
    <AgentQuestion
      agent="Claude"
      data={{
        question: question.text,
        options: question.options, // { id, label, description?, icon? }[]
        multiple: question.multiSelect,
        allowOther: true,
        suggested: question.recommendation, // { optionId, reason }
      }}
      onSubmit={(answer) => agent.answer(question.id, answer)}
      onDelegate={() => agent.answer(question.id, { delegate: true })}
      onUndo={() => agent.reopen(question.id)}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "AgentQuestionData",
      required: true,
      description:
        "The question, the options as cards, the agent's suggestion with a reason, and whether to allow several answers or free text.",
    },
    {
      name: "status",
      type: '"pending" | "answered" | "delegated"',
      description:
        "Leave unset and the card settles on its own when the user answers. Set it to restore a past thread.",
    },
    {
      name: "answer",
      type: "QuestionAnswer",
      description: "The answer to show once answered.",
    },
    {
      name: "onSubmit",
      type: "(answer: QuestionAnswer) => void",
      description:
        "Single choice: called as soon as a card is clicked. Multiple: called from the Send pill.",
    },
    {
      name: "onDelegate",
      type: "() => void",
      description:
        "Shows “Let the agent decide”. The agent should go with its suggestion.",
    },
    {
      name: "onUndo",
      type: "() => void",
      description: "Called from the Undo pill, shown for undoMs after answering.",
    },
    {
      name: "undoMs",
      type: "number",
      default: "4000",
      description: "How long Undo stays available.",
    },
    {
      name: "selected",
      type: "string[]",
      description: "Controlled selection for multiple-choice questions.",
    },
    {
      name: "onSelectedChange",
      type: "(ids: string[]) => void",
      description: "Called when a card is toggled.",
    },
    {
      name: "agent",
      type: "string",
      default: '"Agent"',
      description: "Name shown above the question, e.g. “Claude asks”.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type AgentQuestionData = {
  question: string;
  options: { id: string; label: string; description?: string; icon?: Icon }[];
  multiple?: boolean;   // toggle cards, then send
  allowOther?: boolean; // adds a "Something else…" card
  suggested?: { optionId: string; reason: string };
};

type QuestionAnswer = {
  optionIds: string[];
  other?: string;
};

// Keyboard: arrow keys move between cards, Enter or Space picks.`,
};
