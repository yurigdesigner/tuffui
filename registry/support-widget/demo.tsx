"use client";

import {
  ArrowUUpLeft,
  CalendarBlank,
  Package,
  Truck,
  UserSound,
} from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import { AgentQuestion } from "@/components/ui/agent-question";
import type { ThreadMessage } from "@/components/ui/chat-thread";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusPill } from "@/components/ui/status-pill";
import { Inset } from "@/components/ui/surface";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { SupportWidget, type SupportWidgetData } from "./support-widget";

// Fixed clock so the prerendered page and the browser agree.
const base = Date.parse("2026-11-03T14:02:00Z");
const at = (minute: number) => new Date(base + minute * 60_000).toISOString();

type Turn = {
  id: string;
  role: "user" | "assistant";
  author?: string;
  kind: "text" | "order" | "question" | "joined";
  text?: string;
  at: string;
};

type State = {
  open: boolean;
  turns: Turn[];
  mode: SupportWidgetData["mode"];
  quickReplies: boolean;
  askRating: boolean;
};

const BOT = "Ridge";
const HUMAN = "Sam Okafor";

const greeting: Turn = {
  id: "g",
  role: "assistant",
  kind: "text",
  text: "Hi Alex! I'm Ridge, the Ridgeline help bot. I can track orders, start returns or get you to a person.",
  at: at(0),
};

const tracked: Turn[] = [
  { id: "u1", role: "user", kind: "text", text: "Track my order", at: at(1) },
  {
    id: "b1",
    role: "assistant",
    kind: "text",
    text: "Found it — your Trail Runner 2 left our Denver warehouse yesterday.",
    at: at(1),
  },
  { id: "b2", role: "assistant", kind: "order", at: at(1) },
];

const question: Turn = { id: "b3", role: "assistant", kind: "question", at: at(2) };

const push = (turn: Turn): MockStep<State> => ({
  delay: 0,
  apply: (s) => ({ ...s, turns: [...s.turns, turn] }),
});

const set = (patch: Partial<State>, delay = 0): MockStep<State> => ({
  delay,
  apply: (s) => ({ ...s, ...patch }),
});

const botScript: MockStep<State>[] = [
  wait(700),
  set({ open: true }),
  wait(1600),
  set({ quickReplies: false }),
  push(tracked[0]),
  set({ mode: "typing" }),
  wait(1300),
  set({ mode: "bot" }),
  push(tracked[1]),
  wait(500),
  push(tracked[2]),
  wait(1100),
  push(question),
];

const handoffScript: MockStep<State>[] = [
  wait(1200),
  set({ quickReplies: false }),
  push({ id: "u2", role: "user", kind: "text", text: "Talk to a person", at: at(3) }),
  set({ mode: "typing" }),
  wait(1000),
  push({
    id: "b4",
    role: "assistant",
    kind: "text",
    text: "Sure — I'm connecting you with someone from the team. I've passed on your order so you won't have to repeat yourself.",
    at: at(3),
  }),
  set({ mode: "waiting" }),
  wait(2600),
  set({ mode: "human" }),
  push({
    id: "h1",
    role: "assistant",
    author: HUMAN,
    kind: "joined",
    text: "Hi Alex, Sam here. Your Trail Runner 2s arrive Friday — want me to move delivery to the weekend?",
    at: at(5),
  }),
  wait(1700),
  push({
    id: "u3",
    role: "user",
    kind: "text",
    text: "Yes please, Saturday morning works.",
    at: at(6),
  }),
  wait(1400),
  push({
    id: "h2",
    role: "assistant",
    author: HUMAN,
    kind: "text",
    text: "Done — Saturday 9–12. You'll get a text the evening before. Anything else?",
    at: at(6),
  }),
  wait(900),
  set({ askRating: true }),
];

function OrderCard() {
  const steps = [
    { label: "Ordered", detail: "Oct 30", done: true },
    { label: "Shipped", detail: "Nov 2", done: true },
    { label: "Out for delivery", detail: "Fri", done: false },
  ];
  return (
    <Inset className="flex w-[26rem] max-w-full flex-col gap-3 p-3">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#0a84ff33,#30d15833)] text-foreground">
          <Package weight="fill" className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">Trail Runner 2 · Size 10</p>
          <p className="truncate text-xs text-muted-foreground">Order #48213 · $139.00</p>
        </div>
        <StatusPill tone="brand" size="sm" icon={Truck}>
          In transit
        </StatusPill>
      </div>
      <ProgressBar
        value={2}
        max={3}
        tone="brand"
        striped
        size="sm"
        label="Delivery progress"
        valueText="Shipped, arriving Friday"
      />
      <ol className="grid grid-cols-3 gap-2 text-xs">
        {steps.map((step) => (
          <li key={step.label} className="min-w-0">
            <p className={step.done ? "font-medium" : "text-muted-foreground"}>
              {step.label}
            </p>
            <p className="text-muted-foreground">{step.detail}</p>
          </li>
        ))}
      </ol>
    </Inset>
  );
}

function Storefront() {
  const products = [
    { name: "Trail Runner 2", price: "$139", tint: "from-[#0a84ff]/25 to-[#30d158]/20" },
    {
      name: "Summit Shell Jacket",
      price: "$249",
      tint: "from-[#ff9f0a]/25 to-[#bf5af2]/20",
    },
    { name: "Ridge 28L Pack", price: "$119", tint: "from-[#5e5ce6]/25 to-[#40c8e0]/20" },
  ];
  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-8 px-5 py-5 @md:px-8">
      <nav className="flex items-center gap-6 text-sm">
        <span className="font-semibold tracking-tight">Ridgeline</span>
        <span className="hidden gap-5 text-muted-foreground @2xl:flex">
          <span>Footwear</span>
          <span>Jackets</span>
          <span>Packs</span>
          <span>Stories</span>
        </span>
        <span className="ml-auto text-muted-foreground">Orders</span>
      </nav>
      <header className="flex flex-col gap-3 pt-4 @2xl:pt-10">
        <p className="text-[0.8125rem] text-muted-foreground">New season</p>
        <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-balance @2xl:text-5xl">
          Gear for the long way round.
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Free returns for 60 days, repairs for life.
        </p>
      </header>
      <ul className="grid grid-cols-1 gap-3 @md:grid-cols-2 @3xl:grid-cols-3">
        {products.map((p) => (
          <li key={p.name} className="rounded-[1.375rem] bg-surface p-1.5">
            <div className={`aspect-[4/3] rounded-2xl bg-gradient-to-br ${p.tint}`} />
            <div className="flex items-center justify-between px-2.5 pt-2.5 pb-1.5 text-sm">
              <span className="truncate font-medium">{p.name}</span>
              <span className="text-muted-foreground tabular-nums">{p.price}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const quickReplies = [
  { id: "q1", title: "Track my order" },
  { id: "q2", title: "Return an item" },
  { id: "q3", title: "Talk to a person" },
];

export default function SupportWidgetDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const handoff = variant === "Handoff";
  const still: State = handoff
    ? {
        open: true,
        turns: [greeting, ...tracked],
        mode: "bot",
        quickReplies: true,
        askRating: false,
      }
    : {
        open: !autoplay,
        turns: autoplay ? [greeting] : [greeting, ...tracked, question],
        mode: "bot",
        quickReplies: autoplay,
        askRating: false,
      };
  const { state, setState } = useMockRun<State>(
    still,
    handoff ? handoffScript : botScript,
    {
      autoplay,
    },
  );

  // Messages typed by the viewer get a short reply.
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const send = (text: string) => {
    const n = state.turns.length;
    setState((s) => ({
      ...s,
      quickReplies: false,
      mode: s.mode === "human" ? "human" : "typing",
      turns: [...s.turns, { id: `v${n}`, role: "user", kind: "text", text, at: at(8) }],
    }));
    timer.current = setTimeout(
      () =>
        setState((s) => ({
          ...s,
          mode: s.mode === "human" ? "human" : "bot",
          turns: [
            ...s.turns,
            {
              id: `r${n}`,
              role: "assistant",
              author: s.mode === "human" ? HUMAN : undefined,
              kind: "text",
              text: "Got it — I've added that to your order notes.",
              at: at(8),
            },
          ],
        })),
      900,
    );
  };

  const messages: ThreadMessage[] = state.turns.map((turn) => ({
    id: turn.id,
    role: turn.role,
    author: turn.author,
    at: turn.at,
    content:
      turn.kind === "order" ? (
        <OrderCard />
      ) : turn.kind === "question" ? (
        <AgentQuestion
          agent={BOT}
          data={{
            question: "Anything else with this order?",
            options: [
              { id: "date", label: "Change delivery date", icon: CalendarBlank },
              { id: "return", label: "Start a return", icon: ArrowUUpLeft },
              { id: "person", label: "Talk to a person", icon: UserSound },
            ],
          }}
          className="w-[26rem] max-w-full"
        />
      ) : turn.kind === "joined" ? (
        <div className="flex flex-col items-start gap-2">
          <StatusPill size="sm" tone="positive">
            {HUMAN.split(" ")[0]} joined · Support team
          </StatusPill>
          <p>{turn.text}</p>
        </div>
      ) : (
        turn.text
      ),
  }));

  return (
    <SupportWidget
      data={{
        bot: { name: BOT },
        human: { name: HUMAN, role: "Support team · Denver" },
        visitor: { name: "Alex Rivera" },
        messages,
        quickReplies: state.quickReplies ? quickReplies : undefined,
        mode: state.mode,
        wait: "~2 min",
        askRating: state.askRating,
        unread: state.open ? 0 : 1,
      }}
      open={state.open}
      onOpenChange={(open) => setState((s) => ({ ...s, open }))}
      onSend={send}
    >
      <Storefront />
    </SupportWidget>
  );
}
