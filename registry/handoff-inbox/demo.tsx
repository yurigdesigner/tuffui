"use client";

import { ArrowsLeftRight } from "@phosphor-icons/react";
import type { DataColumn, DataRow } from "@/components/ui/data-table";
import { StatusPill } from "@/components/ui/status-pill";
import type { ToolCall } from "@/components/ui/tool-call-block";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  HandoffInbox,
  type Escalation,
  type HandoffInboxData,
  type HandoffMessage,
  type HandoffStatus,
} from "./handoff-inbox";

// Fixed times so the prerendered thread matches the browser.
const at = (minute: number) => `2026-11-03T13:${String(minute).padStart(2, "0")}:00Z`;

const handoff = (reason: string): React.ReactNode => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning">
    <ArrowsLeftRight weight="bold" aria-hidden="true" className="size-3.5" />
    Bot handed off · {reason}
  </span>
);

const thread: HandoffMessage[] = [
  {
    id: "m1",
    from: "customer",
    at: at(41),
    content:
      "Hi, I'm moving my number 07700 900123 from Vireo to you. It's been two days and it still says pending.",
  },
  {
    id: "m2",
    from: "bot",
    at: at(41),
    content:
      "The port was rejected by Vireo: the account PIN didn't match. I've resubmitted it with the PIN you gave me.",
  },
  {
    id: "m3",
    from: "customer",
    at: at(46),
    content: "It says rejected again. I need this number for work tomorrow!",
  },
  {
    id: "m4",
    from: "bot",
    at: at(47),
    content:
      "I'm sorry, it was rejected a second time. I'm bringing in a teammate who can sort this out with Vireo. Your temporary number keeps working meanwhile.",
  },
  { id: "h1", from: "handoff", at: at(47), content: handoff("Port rejected twice") },
];

const reply =
  "Hi Dana, I'm Ari from Northline. Vireo has your number on a business account, so it needs the 6-digit port-out code from your last Vireo bill, not your PIN. Could you check?";

const queue: Escalation[] = [
  {
    id: "dana",
    customer: { name: "Dana Okafor" },
    snippet: "It says rejected again. I need this number for work tomorrow!",
    reason: "Port rejected twice",
    tone: "warning",
    urgent: true,
    waiting: 6,
  },
  {
    id: "luis",
    customer: { name: "Luis Ortega" },
    snippet: "Why was I charged €38 for roaming in Norway? I had the travel pass.",
    reason: "Roaming dispute",
    tone: "warning",
    waiting: 11,
  },
  {
    id: "tom",
    customer: { name: "Tom Becker" },
    snippet: "This is the third time I'm asking about my contract end date.",
    reason: "Angry customer",
    tone: "negative",
    urgent: true,
    waiting: 14,
    assignee: "ari",
  },
  {
    id: "priya",
    customer: { name: "Priya Raman" },
    snippet: "Can I keep my eSIM if I switch to a new phone this weekend?",
    reason: "Bot unsure",
    tone: "brand",
    waiting: 3,
  },
];

const arrival: Escalation = {
  id: "hannah",
  customer: { name: "Hannah Weiss" },
  snippet: "I lost my phone at the airport, please block my SIM now.",
  reason: "Lost device",
  tone: "negative",
  urgent: true,
  waiting: 0,
};

const calls: ToolCall[] = [
  {
    id: "c1",
    name: "telco.port_status",
    args: { msisdn: "07700900123", donor: "vireo" },
    status: "success",
    durationMs: 640,
    result: { status: "rejected", reason: "PIN_MISMATCH", attempts: 2 },
  },
  {
    id: "c2",
    name: "telco.port_submit",
    args: { msisdn: "07700900123", pin: "••••" },
    status: "error",
    durationMs: 1_210,
    error: "Rejected by donor carrier: PIN_MISMATCH",
  },
];

const orderColumns: DataColumn[] = [
  { key: "item", label: "Order" },
  {
    key: "status",
    label: "Status",
    format: (value) => (
      <StatusPill
        size="sm"
        tone={
          value === "Rejected" ? "negative" : value === "Active" ? "positive" : "neutral"
        }
      >
        {String(value)}
      </StatusPill>
    ),
  },
];

const orders: DataRow[] = [
  { id: "o1", item: "Port P-2291", status: "Rejected" },
  { id: "o2", item: "Port P-2287", status: "Rejected" },
  { id: "o3", item: "Temporary SIM", status: "Active" },
  { id: "o4", item: "Business Unlimited", status: "Active" },
];

type State = {
  queue: Escalation[];
  messages: HandoffMessage[];
  status: HandoffStatus;
  draft: string;
};

const tick = (s: State): State => ({
  ...s,
  queue: s.queue.map((e) => ({ ...e, waiting: e.waiting + 1 })),
});

const type = (text: string): MockStep<State>[] =>
  Array.from({ length: Math.ceil(text.length / 4) }, (_, i) => ({
    delay: 40,
    apply: (s: State) => ({ ...s, draft: text.slice(0, (i + 1) * 4) }),
  }));

const add = (message: HandoffMessage) => (s: State) => ({
  ...s,
  messages: [...s.messages, message],
});

// A new escalation lands on top while the queue keeps counting.
const inboxScript: MockStep<State>[] = [
  wait(1800),
  { delay: 0, apply: (s) => ({ ...s, queue: [arrival, ...s.queue] }) },
  { delay: 2600, apply: tick },
  { delay: 3000, apply: tick },
];

// Ari has taken over: types a reply, the customer answers, Ari hands back.
const takeoverScript: MockStep<State>[] = [
  wait(1200),
  ...type(reply),
  wait(500),
  {
    delay: 0,
    apply: (s) => ({
      ...add({ id: "r1", from: "operator", at: at(55), content: reply })(s),
      draft: "",
    }),
  },
  {
    delay: 2200,
    apply: add({
      id: "r2",
      from: "customer",
      at: at(57),
      content: "Found it on the bill: 482913.",
    }),
  },
  { delay: 1400, apply: tick },
  ...type("Thanks! Resubmitted with that code. It usually completes within 2 hours."),
  wait(400),
  {
    delay: 0,
    apply: (s) => ({
      ...add({
        id: "r3",
        from: "operator",
        at: at(58),
        content:
          "Thanks! Resubmitted with that code. It usually completes within 2 hours.",
      })(s),
      draft: "",
    }),
  },
  { delay: 1600, apply: (s) => ({ ...s, status: "returned" }) },
];

export default function HandoffInboxDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const takeover = variant === "Takeover";
  const { state, setState } = useMockRun<State>(
    {
      queue: takeover
        ? queue.map((e) => (e.id === "dana" ? { ...e, assignee: "ari" } : e))
        : queue,
      messages: thread,
      status: takeover ? "active" : "waiting",
      draft: "",
    },
    takeover ? takeoverScript : inboxScript,
    { autoplay },
  );

  const data: HandoffInboxData = {
    team: "Northline Mobile · Support",
    operator: { id: "ari", name: "Ari Novak" },
    bot: { name: "Nora" },
    queue: state.queue,
    activeId: "dana",
    messages: state.messages,
    summary: {
      wants: "Move 07700 900123 from Vireo before work tomorrow.",
      tried: [
        "Checked the port: rejected, PIN mismatch",
        "Resubmitted with the customer's PIN: rejected again",
        "Kept the temporary number active",
      ],
      calls,
    },
    suggestions: [
      {
        id: "s1",
        title: "Ask for the port-out code",
        prompt:
          "Could you check your last Vireo bill for a 6-digit port-out code? Business accounts need it instead of the PIN.",
      },
      {
        id: "s2",
        title: "Offer to call Vireo together",
        prompt: "If it's easier, I can call Vireo with you on the line right now.",
      },
      {
        id: "s3",
        title: "Extend the temporary number",
        prompt:
          "I've extended your temporary number for 7 days, so nothing breaks tomorrow.",
      },
    ],
    customer: {
      name: "Dana Okafor",
      plan: "Business Unlimited",
      since: "Customer since March 2023",
      orders,
      orderColumns,
      notes: [
        {
          id: "n1",
          text: "Needs the number for work by 09:00 tomorrow.",
          scope: "session",
          source: "from chat · today",
        },
        {
          id: "n2",
          text: "Prefers chat over phone calls.",
          scope: "user",
          source: "from profile",
          pinned: true,
        },
        {
          id: "n3",
          text: "Number sits on a Vireo business account.",
          scope: "user",
          source: "from bot · today",
          isNew: true,
        },
      ],
    },
  };

  return (
    <HandoffInbox
      data={data}
      status={state.status}
      draft={state.draft}
      onDraftChange={(draft) => setState((s) => ({ ...s, draft }))}
      onTakeOver={() =>
        setState((s) => ({
          ...s,
          status: "active",
          queue: s.queue.map((e) => (e.id === "dana" ? { ...e, assignee: "ari" } : e)),
        }))
      }
      onHandBack={() => setState((s) => ({ ...s, status: "returned" }))}
      onSend={(text) =>
        setState((s) =>
          add({
            id: `o${s.messages.length}`,
            from: "operator",
            at: at(59),
            content: text,
          })(s),
        )
      }
    />
  );
}
