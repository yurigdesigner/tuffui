"use client";

import { useEffect, useState } from "react";
import { ProgressBar, SegmentedBar } from "@/components/ui/progress-bar";

function useTicking(autoplay: boolean) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => setStep((n) => (n + 1) % 6), 1200);
    return () => clearInterval(timer);
  }, [autoplay]);
  return step;
}

export default function ProgressBarDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const step = useTicking(autoplay);

  if (variant === "Segmented") {
    return (
      <div className="flex w-full max-w-sm flex-col gap-2">
        <SegmentedBar
          label="Context window"
          max={200_000}
          segments={[
            {
              id: "chat",
              label: "Conversation",
              value: 52_000 + step * 9_000,
              color: "var(--brand)",
            },
            { id: "files", label: "Files", value: 31_400, color: "#5e5ce6" },
            { id: "tools", label: "Tools", value: 11_800, color: "#bf5af2" },
          ]}
        />
        <SegmentedBar
          label="Spend by model"
          size="sm"
          striped
          max={600}
          segments={[
            { id: "opus", label: "Opus", value: 216, color: "var(--brand)" },
            { id: "sonnet", label: "Sonnet", value: 180, color: "#bf5af2" },
            { id: "haiku", label: "Haiku", value: 97, color: "#40c8e0" },
          ]}
        />
      </div>
    );
  }

  const value = 20 + step * 15;
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <ProgressBar label="Upload" value={value} />
      <ProgressBar
        label="Requests left"
        kind="meter"
        value={82}
        tone="positive"
        striped
      />
      <ProgressBar label="Budget" kind="meter" value={88} tone="warning" striped />
      <ProgressBar
        label="Output tokens"
        kind="meter"
        value={4}
        tone="negative"
        size="sm"
      />
      <ProgressBar label="Queued" value={35} tone="neutral" size="lg" />
    </div>
  );
}
