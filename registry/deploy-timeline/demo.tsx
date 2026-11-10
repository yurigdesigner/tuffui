"use client";

import { useEffect, useState } from "react";
import { DeployTimeline, type Deploy } from "./deploy-timeline";

const HOUR = 3_600_000;

const history: Deploy[] = [
  {
    id: "v11",
    version: "v11",
    kind: "prompt",
    label: "few-shot refresh",
    at: "2026-10-27T10:00:00Z",
    score: 0.904,
  },
  {
    id: "v12",
    version: "v12",
    kind: "prompt",
    label: "shorter system prompt",
    at: "2026-10-29T15:00:00Z",
    score: 0.912,
  },
  {
    id: "o4-mini",
    version: "o4-mini",
    kind: "model",
    label: "model swap",
    at: "2026-10-31T11:00:00Z",
    score: 0.921,
  },
  {
    id: "v13",
    version: "v13",
    kind: "prompt",
    label: "stricter escalation rules",
    at: "2026-11-02T14:20:00Z",
    score: 0.877,
    rolledBackAfter: 38,
  },
  {
    id: "v14",
    version: "v14",
    kind: "prompt",
    label: "escalation rules, take two",
    at: "2026-11-04T09:00:00Z",
    score: 0.931,
  },
];

const CANARY_AT = Date.parse("2026-11-07T13:00:00Z");
const END = Date.parse("2026-11-08T22:00:00Z");
const RANGE: [string, string] = ["2026-10-26T12:00:00Z", "2026-11-09T00:00:00Z"];

/** Canary beats: traffic share and the eval score it is settling on. */
const beats = [
  { at: 0, share: 0.01, score: 0.918 },
  { at: 0.22, share: 0.02, score: 0.941 },
  { at: 0.48, share: 0.05, score: 0.933 },
  { at: 0.74, share: 0.1, score: 0.936 },
];

const INTRO = 1900; // ms: the line draws in, then the canary starts moving
const GROW = 5200; // ms: the canary runs from deploy to now

export default function DeployTimelineDemo({
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const [p, setP] = useState(autoplay ? 0 : 1);

  // One frame clock: after the intro, the canary's clock runs to the end.
  useEffect(() => {
    if (!autoplay) return;
    let frame = 0;
    let start = 0;
    const tick = (now: number) => {
      start ||= now + INTRO;
      const next = Math.min(Math.max((now - start) / GROW, 0), 1);
      setP(next);
      if (next < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [autoplay]);

  // Ease the clock out so the canary arrives gently.
  const t = 1 - (1 - p) ** 2;
  const now = CANARY_AT + 2 * HOUR + t * (END - CANARY_AT - 2 * HOUR);
  const beat = [...beats].reverse().find((b) => p >= b.at) ?? beats[0];

  const deploys: Deploy[] = [
    ...history,
    {
      id: "v15",
      version: "v15",
      kind: "prompt",
      label: "tool-use hints",
      at: CANARY_AT,
      score: beat.score,
      canary: beat.share,
    },
  ];

  return (
    <DeployTimeline
      title="Deployments"
      subtitle="triage-l · prompt & model versions · 14 days"
      deploys={deploys}
      threshold={0.88}
      range={RANGE}
      now={now}
      intro={autoplay}
      onCompare={() => {}}
      onRollback={() => {}}
    />
  );
}
