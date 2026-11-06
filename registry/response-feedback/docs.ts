import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ResponseFeedback } from "@/components/ui/response-feedback";

export function AnswerActions({ message }: { message: Message }) {
  return (
    <ResponseFeedback
      onRate={(rating) => analytics.track("answer_rated", { id: message.id, rating })}
      onSubmit={({ rating, reasons, note }) =>
        api.feedback.create({ messageId: message.id, rating, reasons, note })
      }
      onUndo={() => api.feedback.delete({ messageId: message.id })}
      onCopy={() => navigator.clipboard.writeText(message.text)}
      onRegenerate={() => thread.regenerate(message.id)}
    />
  );
}`,
  props: [
    {
      name: "value",
      type: "Feedback",
      description:
        "Controlled state: rating, reasons, note and status. Leave it out and the component keeps its own.",
    },
    {
      name: "onValueChange",
      type: "(value: Feedback) => void",
      description: "Called on every change of the controlled state.",
    },
    {
      name: "onRate",
      type: "(rating: FeedbackRating) => void",
      description:
        "Called on a thumbs up or down, or when a 1–5 rating is picked. Pressing the same thumb again clears it.",
    },
    {
      name: "onSubmit",
      type: "(feedback: { rating: FeedbackRating; reasons: string[]; note: string }) => void",
      description:
        "Called when the reasons form is sent. Needs at least one reason or a note.",
    },
    {
      name: "onUndo",
      type: "() => void",
      description: "Shows Undo in the thank-you for `undoMs`; reopens the form.",
    },
    {
      name: "undoMs",
      type: "number",
      default: "5000",
      description: "How long Undo stays after a submit.",
    },
    {
      name: "onCopy",
      type: "() => void",
      description: "Shows a copy button that confirms with a check.",
    },
    {
      name: "onRegenerate",
      type: "() => void",
      description: "Shows a regenerate button.",
    },
    {
      name: "reasons",
      type: "string[]",
      default: '["Inaccurate", "Not helpful", "Too long", "Unsafe", "Other"]',
      description: "Reason chips, multi-select.",
    },
    {
      name: "variant",
      type: '"inline" | "detailed"',
      default: '"inline"',
      description:
        "Thumbs under an answer that open reasons on a down vote, or a card with a 1–5 rating and reasons always shown.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type FeedbackRating = "up" | "down" | 1 | 2 | 3 | 4 | 5;

type Feedback = {
  rating: FeedbackRating | null;
  reasons: string[];
  note: string;
  status: "idle" | "open" | "sent";
};`,
};
