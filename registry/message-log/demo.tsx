"use client";

import { useEffect, useRef, useState } from "react";
import { useMockRun, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  MessageLog,
  type MessageAttempt,
  type MessageBucket,
  type MessageEvent,
} from "./message-log";

const MIN = 60_000;
const at = (hm: string) => Date.parse(`2026-11-10T${hm}Z`);

// Seeded noise so the server and the client draw the same feed.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

/** billing-svc starts answering 503 at this minute. */
const BURST = at("10:59:00");
const SERIES_FROM = at("09:00:00");

/** Deliveries per minute from 09:00 to a little past the end of the demo. */
const SERIES: (MessageBucket & { at: number })[] = (() => {
  const next = rng(23);
  return Array.from({ length: 130 }, (_, i) => {
    const t = SERIES_FROM + i * MIN;
    const base = 62 + Math.sin(i / 8) * 18 + Math.sin(i / 3.1) * 6 + next() * 14;
    const burst = t >= BURST ? Math.min((t - BURST) / MIN + 1, 4) / 4 : 0;
    return {
      at: t,
      delivered: Math.round(base * (1 - burst * 0.3)),
      failed: burst ? Math.round(22 + burst * 30 + next() * 12) : 0,
    };
  });
})();

const ok = (code = 200) => ({ code, label: "OK" });
const down = { code: 503, label: "Service unavailable" };
const json = (value: unknown) => JSON.stringify(value, null, 2);
const unavailable = json({ error: "service_unavailable", retry_after: 30 });

type Try = { at: number; ms: number; code: number; label: string; body?: string };
type Plan = Omit<MessageEvent, "attempts" | "at"> & { at: number; tries: Try[] };

const QUIET: [string, string, string, number][] = [
  ["customer.created", "crm-sync", "10:07:41", 230],
  ["order.created", "billing-svc", "10:12:09", 410],
  ["invoice.paid", "ledger", "10:16:55", 170],
  ["order.shipped", "fulfillment", "10:21:30", 520],
  ["customer.updated", "crm-sync", "10:26:02", 200],
  ["order.created", "billing-svc", "10:30:48", 390],
  ["refund.created", "ledger", "10:35:13", 180],
  ["order.shipped", "fulfillment", "10:39:37", 610],
  ["invoice.paid", "ledger", "10:44:20", 150],
  ["order.created", "billing-svc", "10:48:52", 360],
];

/** Every try each event will make. The clock decides how many have run. */
const PLANS: Plan[] = [
  ...QUIET.map(([type, endpoint, hms, ms], i): Plan => ({
    id: `msg_2Fh${"QwErTyUiOp"[i]}${(i * 7 + 3).toString(36)}${"kLmNbVcXzA"[i]}`,
    type,
    endpoint,
    at: at(hms),
    tries: [{ at: at(hms), ms, ...ok(), body: json({ ok: true }) }],
  })),
  {
    id: "msg_2Fj1aQ",
    type: "customer.updated",
    endpoint: "crm-sync",
    at: at("10:52:14"),
    tries: [{ at: at("10:52:14"), ms: 210, ...ok(), body: json({ ok: true }) }],
  },
  {
    id: "msg_2Fj4kT",
    type: "order.created",
    endpoint: "billing-svc",
    at: at("10:54:31"),
    tries: [
      {
        at: at("10:54:31"),
        ms: 380,
        ...ok(),
        body: json({ received: true, order_id: "ord_88194", ledger: "posted" }),
      },
    ],
  },
  {
    id: "msg_2Fj7cR",
    type: "invoice.paid",
    endpoint: "ledger",
    at: at("10:55:47"),
    tries: [{ at: at("10:55:47"), ms: 160, ...ok(202), body: json({ queued: true }) }],
  },
  {
    id: "msg_2Fj9vM",
    type: "customer.updated",
    endpoint: "crm-sync",
    at: at("10:58:05"),
    tries: [{ at: at("10:58:05"), ms: 190, ...ok(), body: json({ ok: true }) }],
  },
  {
    id: "msg_2FkA3e",
    type: "invoice.paid",
    endpoint: "billing-svc",
    at: at("11:00:12"),
    tries: [
      { at: at("11:00:12"), ms: 15_000, code: 504, label: "Gateway timeout" },
      { at: at("11:00:42"), ms: 1_300, ...down, body: unavailable },
      { at: at("11:01:42"), ms: 1_200, ...down, body: unavailable },
      { at: at("11:03:42"), ms: 1_400, ...down, body: unavailable },
    ],
  },
  {
    id: "msg_2FkC8n",
    type: "order.created",
    endpoint: "billing-svc",
    at: at("11:01:09"),
    tries: [
      { at: at("11:01:09"), ms: 1_100, ...down, body: unavailable },
      { at: at("11:01:39"), ms: 1_300, ...down, body: unavailable },
      {
        at: at("11:02:39"),
        ms: 720,
        ...ok(),
        body: json({ received: true, order_id: "ord_88227", ledger: "posted" }),
      },
    ],
  },
  {
    id: "msg_2FkF0d",
    type: "charge.disputed",
    endpoint: "billing-svc",
    at: at("11:02:33"),
    tries: [
      { at: at("11:02:33"), ms: 15_000, code: 504, label: "Gateway timeout" },
      { at: at("11:03:03"), ms: 1_200, ...down, body: unavailable },
      { at: at("11:04:03"), ms: 1_500, ...down, body: unavailable },
      { at: at("11:06:03"), ms: 600, ...ok() },
    ],
  },
  {
    id: "msg_2Fk8pZ",
    type: "order.refunded",
    endpoint: "billing-svc",
    at: at("11:03:52"),
    tries: [
      { at: at("11:03:52"), ms: 1_200, ...down, body: unavailable },
      { at: at("11:04:22"), ms: 1_400, ...down, body: unavailable },
      {
        at: at("11:05:18"),
        ms: 640,
        ...ok(),
        body: json({ received: true, order_id: "ord_88231", ledger: "posted" }),
      },
    ],
  },
  {
    id: "msg_2FkH5w",
    type: "invoice.paid",
    endpoint: "ledger",
    at: at("11:04:18"),
    tries: [{ at: at("11:04:18"), ms: 150, ...ok(202), body: json({ queued: true }) }],
  },
];

function realize(plan: Plan, now: number): MessageEvent | null {
  if (plan.at > now) return null;
  const attempts: MessageAttempt[] = [];
  for (const t of plan.tries) {
    if (t.at > now) {
      if (attempts.at(-1)?.status !== "delivered")
        attempts.push({ status: "scheduled", at: t.at });
      break;
    }
    attempts.push(
      now < t.at + t.ms
        ? { status: "sending", at: t.at }
        : {
            status: t.code < 300 ? "delivered" : "failed",
            code: t.code,
            label: t.label,
            at: t.at,
            ms: t.ms,
            body: t.body,
          },
    );
  }
  return {
    id: plan.id,
    type: plan.type,
    endpoint: plan.endpoint,
    at: plan.at,
    attempts,
  };
}

const START = at("10:58:00");
// Minute ticks up to 11:05, then the waiting order.refunded try runs.
const CLOCK = [
  ...Array.from({ length: 8 }, (_, i) => START + i * MIN),
  at("11:05:18"),
  at("11:05:19"),
];
const FINAL = CLOCK.at(-1)!;
const TODAY_AT_FINAL = 12_480;

const minuteOf = (t: number) => Math.floor(t / MIN) * MIN;
const bucketsAt = (now: number) => SERIES.filter((b) => b.at < minuteOf(now)).slice(-60);
const totalAt = (now: number) =>
  TODAY_AT_FINAL -
  SERIES.filter((b) => b.at >= minuteOf(now) && b.at < minuteOf(FINAL)).reduce(
    (a, b) => a + b.delivered + b.failed,
    0,
  );

type Replay = { at: number; done: boolean };
type State = { tick: number };

export default function MessageLogDemo({
  autoplay = true,
  thumbnail = false,
}: {
  variant?: string;
  autoplay?: boolean;
  thumbnail?: boolean;
}) {
  const steps: MockStep<State>[] = autoplay
    ? CLOCK.slice(1).map((t, i) => ({
        delay: i < 7 ? 1500 : i === 7 ? 1600 : 900,
        apply: (s) => ({ tick: Math.min(s.tick + 1, CLOCK.length - 1) }),
      }))
    : [];
  const { state } = useMockRun<State>({ tick: autoplay ? 0 : CLOCK.length - 1 }, steps, {
    autoplay,
  });
  const now = CLOCK[state.tick];

  // Replays run on their own: the try goes out now and lands a moment later.
  const [replays, setReplays] = useState<Record<string, Replay>>({});
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const events = PLANS.flatMap((p) => {
    const e = realize(p, now);
    if (!e) return [];
    const r = replays[e.id];
    if (!r) return [e];
    const attempts = e.attempts.filter((a) => a.status !== "scheduled");
    attempts.push(
      r.done
        ? {
            status: "delivered",
            ...ok(),
            at: r.at,
            ms: 410,
            body: json({ received: true, replayed: true }),
          }
        : { status: "sending", at: r.at },
    );
    return [{ ...e, attempts }];
  });

  const replay = (e: MessageEvent) => {
    const t = now;
    setReplays((r) => ({ ...r, [e.id]: { at: t + 1000, done: false } }));
    timers.current.push(
      setTimeout(
        () => setReplays((r) => ({ ...r, [e.id]: { at: t + 1000, done: true } })),
        1200,
      ),
    );
  };

  const end = minuteOf(now);
  return (
    <MessageLog
      events={events}
      buckets={bucketsAt(now)}
      perDot={20}
      defaultWindow={[end - 5 * MIN, end]}
      // On a home-page card the open row would double the height and shrink it.
      defaultSelectedId={thumbnail ? null : "msg_2Fk8pZ"}
      total={totalAt(now)}
      totalLabel="today"
      onReplay={replay}
      onCopyCurl={(e) =>
        `curl -X POST https://hooks.example.com/${e.endpoint} \\\n  -H "Content-Type: application/json" \\\n  -H "Webhook-Id: ${e.id}" \\\n  -d '{"type":"${e.type}"}'`
      }
    />
  );
}
