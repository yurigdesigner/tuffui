"use client";

import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { UserMessage, type UserMessageData } from "./user-message";

const attachments: UserMessageData["attachments"] = [
  { id: "shot", name: "plan-picker-de.png", kind: "image", size: 284_000 },
  { id: "log", name: "e2e-de-DE.log", kind: "file", size: 41_200 },
];

const initial = (withFiles: boolean): UserMessageData => ({
  id: "m1",
  content: withFiles
    ? "The German plan picker overflows on mobile — screenshot and the e2e log attached. Can you shorten the labels?"
    : "Translate the onboarding emails into German and keep product names in English.",
  attachments: withFiles ? attachments : undefined,
  status: "sending",
  sentAt: "14:02",
});

const script: MockStep<UserMessageData>[] = [
  wait(1200),
  { delay: 0, apply: (s) => ({ ...s, status: "failed" }) },
  wait(2200),
  { delay: 0, apply: (s) => ({ ...s, status: "sending" }) },
  { delay: 900, apply: (s) => ({ ...s, status: "sent" }) },
];

export default function UserMessageDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const withFiles = variant === "With attachments";
  const start = initial(withFiles);
  const { state, setState } = useMockRun<UserMessageData>(
    autoplay ? start : { ...start, status: "sent" },
    script,
    { autoplay },
  );

  return (
    <div className="w-full max-w-xl">
      <UserMessage
        data={state}
        onEdit={(content) => {
          setState((s) => ({ ...s, content, edited: true, status: "sending" }));
          setTimeout(() => setState((s) => ({ ...s, status: "sent" })), 900);
        }}
        onRetry={() => {
          setState((s) => ({ ...s, status: "sending" }));
          setTimeout(() => setState((s) => ({ ...s, status: "sent" })), 900);
        }}
      />
    </div>
  );
}
