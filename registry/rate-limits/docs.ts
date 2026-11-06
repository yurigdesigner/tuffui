import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { RateLimits } from "@/components/ui/rate-limits";

// Fill it from the rate-limit headers on each API response.
export function Limits({ headers, queue, retryAfter }: Props) {
  return (
    <RateLimits
      data={{
        model: "opus-5.5 · Tier 3",
        limits: [
          {
            id: "req",
            label: "Requests",
            limit: Number(headers["requests-limit"]),
            remaining: Number(headers["requests-remaining"]),
            resetsInMs: msUntil(headers["requests-reset"]),
          },
          // …input and output tokens the same way
        ],
        queued: queue, // calls your client is holding back
        retryAfterMs: retryAfter * 1000, // from a 429's retry-after header
      }}
      onRetry={() => client.flushQueue()}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "{ model?: string; limits: RateLimit[]; queued?: QueuedCall[]; retryAfterMs?: number }",
      required: true,
      description:
        "One gauge per limit. retryAfterMs (or a bucket at zero) switches to the throttled state; both timers count down locally.",
    },
    {
      name: "onRetry",
      type: "() => void",
      description:
        "Called by Retry now, which unlocks when the retry-after countdown ends.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type RateLimit = {
  id: string;
  label: string; // shown as "<label> / min"
  limit: number;
  remaining: number;
  resetsInMs: number;
};

type QueuedCall = { id: string; label: string; tokens?: number };`,
};
