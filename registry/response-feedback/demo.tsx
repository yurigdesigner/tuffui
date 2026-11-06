"use client";

import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { ResponseFeedback, emptyFeedback, type Feedback } from "./response-feedback";

const note = "It skipped the Vercel cache folder";

/** Types the note one character at a time, starting `from` ms after the last step. */
const typeNote = (from: number): MockStep<Feedback>[] =>
  Array.from(note, (_, i) => ({
    delay: i === 0 ? from : 45,
    apply: (s: Feedback) => ({ ...s, note: note.slice(0, i + 1) }),
  }));

const inline: MockStep<Feedback>[] = [
  { delay: 1400, apply: () => ({ ...emptyFeedback, rating: "down", status: "open" }) },
  { delay: 900, apply: (s) => ({ ...s, reasons: ["Inaccurate"] }) },
  { delay: 600, apply: (s) => ({ ...s, reasons: [...s.reasons, "Not helpful"] }) },
  ...typeNote(700),
  wait(700),
  { delay: 0, apply: (s) => ({ ...s, status: "sent" }) },
];

const detailed: MockStep<Feedback>[] = [
  { delay: 1200, apply: (s) => ({ ...s, rating: 2 }) },
  { delay: 800, apply: (s) => ({ ...s, reasons: ["Inaccurate"] }) },
  { delay: 600, apply: (s) => ({ ...s, reasons: [...s.reasons, "Too long"] }) },
  ...typeNote(700),
  wait(700),
  { delay: 0, apply: (s) => ({ ...s, status: "sent" }) },
];

export default function ResponseFeedbackDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const isDetailed = variant === "Detailed";
  const { state, setState } = useMockRun<Feedback>(
    emptyFeedback,
    isDetailed ? detailed : inline,
    { autoplay },
  );

  const feedback = (
    <ResponseFeedback
      value={state}
      onValueChange={setState}
      onCopy={() => {}}
      onRegenerate={() => {}}
      variant={isDetailed ? "detailed" : "inline"}
    />
  );

  if (isDetailed) return feedback;

  return (
    <div className="w-full max-w-xl">
      <p className="mb-2 text-[0.9375rem] leading-relaxed">
        Cache resized images by content hash in{" "}
        <code className="rounded-md bg-foreground/[0.06] px-1 font-mono text-[0.85em]">
          .pressd/cache
        </code>
        . On each build, hash the source and the resize options; if the key exists, copy
        the cached output instead of running sharp again.
      </p>
      {feedback}
    </div>
  );
}
