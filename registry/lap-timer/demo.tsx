"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/components/ui/status-pill";
import { LapTimer, type LapSector } from "./lap-timer";

type Run = {
  title: string;
  subtitle: string;
  lap: string;
  best: number;
  /** Simulated seconds per real second, so a run plays in about ten seconds. */
  speed: number;
  sectors: (Omit<LapSector, "split"> & { time: number })[];
};

const run: Run = {
  title: "Pipeline lap",
  subtitle: "eval run 418 · support-qa",
  lap: "Lap 3",
  best: 44.1,
  speed: 4,
  sectors: [
    { id: "retrieve", label: "retrieve", best: 13.9, time: 13.1 },
    { id: "generate", label: "generate", best: 19.2, time: 19.6 },
    { id: "score", label: "score", best: 10.7, time: 8.8 },
  ],
};

export default function LapTimerDemo({
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const total = run.sectors.reduce((a, s) => a + s.time, 0);
  const [t, setT] = useState(autoplay ? 0 : total);

  // Plays the lap once on a frame clock, then holds on the finished lap.
  useEffect(() => {
    if (!autoplay) return;
    let frame = 0;
    let start = 0;
    const tick = (now: number) => {
      start ||= now + 600;
      const next = Math.min(Math.max(0, ((now - start) / 1000) * run.speed), total);
      setT(next);
      if (next < total) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [autoplay, total]);

  const sectors: LapSector[] = run.sectors.map(({ time, ...s }, i) => {
    const edge = run.sectors.slice(0, i + 1).reduce((a, x) => a + x.time, 0);
    return t >= edge - 1e-6 ? { ...s, split: time } : s;
  });
  const running = t < total;
  const newBest = total < run.best;

  return (
    <LapTimer
      title={run.title}
      subtitle={run.subtitle}
      lap={run.lap}
      sectors={sectors}
      elapsed={t}
      best={run.best}
      running={running}
      aside={
        running ? (
          <StatusPill tone="brand" size="sm">
            Live
          </StatusPill>
        ) : (
          <StatusPill tone={newBest ? "positive" : "neutral"} size="sm">
            {newBest ? "New best" : "Finished"}
          </StatusPill>
        )
      }
    />
  );
}
