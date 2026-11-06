"use client";

import { StatusPill } from "@/components/ui/status-pill";
import { useMockRun, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { TickGauge } from "./tick-gauge";

type State = { ok: number; total: number };

// Requests keep landing, so the rate drifts like a live dashboard.
const script: MockStep<State>[] = [
  { delay: 1800, apply: (s) => ({ ok: s.ok + 180, total: s.total + 196 }) },
  { delay: 1800, apply: (s) => ({ ok: s.ok + 240, total: s.total + 251 }) },
  { delay: 1800, apply: (s) => ({ ok: s.ok + 210, total: s.total + 214 }) },
];

export default function TickGaugeDemo({
  variant = "Below SLO",
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const healthy = variant === "Healthy";
  const { state } = useMockRun<State>(
    healthy ? { ok: 12_418, total: 12_436 } : { ok: 5_568, total: 5_980 },
    healthy ? [] : script,
    { autoplay },
  );
  const rate = state.ok / state.total;
  const failed = state.total - state.ok;
  const met = rate >= 0.99;

  return (
    <TickGauge
      title="Tool call success"
      subtitle={healthy ? "web.search · last 24 h" : "warehouse.query · last 24 h"}
      value={rate}
      target={0.99}
      targetLabel="SLO 99%"
      caption={`${failed.toLocaleString("en-US")} of ${state.total.toLocaleString("en-US")} failed`}
      aside={
        <StatusPill tone={met ? "positive" : "negative"}>
          {met ? "Within SLO" : "Below SLO"}
        </StatusPill>
      }
    />
  );
}
