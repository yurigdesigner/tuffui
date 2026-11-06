"use client";

import {
  Bicycle,
  Check,
  Lightbulb,
  PresentationChart,
  UsersThree,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/action-button";
import { AgentQuestion, type QuestionAnswer } from "@/components/ui/agent-question";
import {
  ConfirmationCard,
  type ConfirmationItem,
  type ConfirmationStatus,
} from "@/components/ui/confirmation-card";
import { FormCard, type FormStatus, type FormValues } from "@/components/ui/form-card";
import { ResultCarousel, type ResultItem } from "@/components/ui/result-carousel";
import { SlotPicker, type Slot } from "@/components/ui/slot-picker";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { BookingAssistant, type BookingAssistantData } from "./booking-assistant";

type State = {
  step: number;
  focus?: QuestionAnswer;
  venue?: string;
  slot: string | null;
  slotConfirmed: string | null;
  form: FormValues;
  formStatus: FormStatus;
  confirm: ConfirmationStatus;
  notes: string[];
};

const at = (minute: number) => `2026-11-03T09:${String(minute).padStart(2, "0")}:00Z`;

const focusOptions = [
  {
    id: "workshops",
    label: "Workshops",
    description: "Hands-on design sessions",
    icon: PresentationChart,
  },
  {
    id: "strategy",
    label: "Strategy",
    description: "Roadmap for next year",
    icon: Lightbulb,
  },
  {
    id: "bonding",
    label: "Team time",
    description: "Dinners and activities",
    icon: Bicycle,
  },
  {
    id: "mix",
    label: "A mix",
    description: "Mornings work, afternoons out",
    icon: UsersThree,
  },
];

const venues: ResultItem[] = [
  {
    id: "loft",
    title: "Nordhavn Loft",
    meta: "Harbour · 8 rooms · workshop hall",
    price: "€2,960",
    rating: 4.8,
    tint: "#0a84ff",
  },
  {
    id: "studio",
    title: "Refshaleøen Studio",
    meta: "Island · 6 rooms · open studio",
    price: "€2,410",
    rating: 4.6,
    tint: "#bf5af2",
  },
  {
    id: "house",
    title: "Frederiksberg House",
    meta: "Park · 10 rooms · library",
    price: "€3,380",
    rating: 4.7,
    tint: "#30c05a",
  },
];

const plus30 = (time: string) => {
  const m = Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) + 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

const slots: Slot[] = [
  ["2026-11-10", "10:00"],
  ["2026-11-10", "14:00", true],
  ["2026-11-11", "09:30"],
  ["2026-11-11", "15:00", false, true],
  ["2026-11-12", "11:00"],
  ["2026-11-12", "16:30", true],
].map(([day, start, busy, suggested], i) => ({
  id: `s${i}`,
  day: day as string,
  start: start as string,
  end: plus30(start as string),
  busy: Boolean(busy),
  suggested: Boolean(suggested),
}));

const filled: FormValues = {
  lead: "Ana Ribeiro",
  email: "ana@studio.example",
  headcount: "8",
  diet: "vegetarian",
  pickup: true,
};

const items: ConfirmationItem[] = [
  { id: "rooms", label: "Nordhavn Loft", detail: "8 rooms · Mar 18–20", amount: 2_960 },
  { id: "hall", label: "Workshop hall", detail: "Two mornings", amount: 640 },
  {
    id: "dinner",
    label: "Team dinner",
    detail: "Mar 18, 19:30 · 8 people",
    amount: 520,
    removable: true,
  },
  {
    id: "bikes",
    label: "Bike rental",
    detail: "2 days",
    amount: 22,
    quantity: 8,
    editable: true,
  },
];

const next = (s: State): State => ({ ...s, step: s.step + 1 });
const step = (delay: number, apply: (s: State) => State = next): MockStep<State> => ({
  delay,
  apply,
});

const script: MockStep<State>[] = [
  step(900), // question
  step(2200, (s) => ({ ...s, focus: { optionIds: ["mix"] } })),
  step(700), // venues
  step(1800, (s) => ({ ...s, venue: "loft" })),
  step(700), // slot
  step(1300, (s) => ({ ...s, slot: "s3" })),
  step(1100, (s) => ({ ...s, slotConfirmed: "s3" })),
  step(700), // form
  step(900, (s) => ({ ...s, form: filled })),
  step(1100, (s) => ({ ...s, formStatus: "submitted" })),
  step(700), // confirmation
  wait(400),
];

const initial: State = {
  step: 0,
  slot: null,
  slotConfirmed: null,
  // Every field starts with a value so controlled inputs stay controlled.
  form: { lead: "", email: "", headcount: "", diet: "standard", pickup: false },
  formStatus: "editing",
  confirm: "review",
  notes: [],
};

const done: State = {
  ...initial,
  step: 5,
  focus: { optionIds: ["mix"] },
  venue: "loft",
  slot: "s3",
  slotConfirmed: "s3",
  form: filled,
  formStatus: "submitted",
  confirm: "done",
};

const Text = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-3">{children}</p>
);

export default function BookingAssistantDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const confirmed = variant === "Confirmed";
  const { state, setState } = useMockRun<State>(
    confirmed ? done : initial,
    confirmed ? [] : script,
    {
      autoplay,
    },
  );
  const set = (patch: Partial<State>) => setState((s) => ({ ...s, ...patch }));
  // Steps reveal one assistant turn each; picks made by the viewer move the run on.
  const reveal = (n: number) => setState((s) => ({ ...s, step: Math.max(s.step, n) }));

  const venue = venues.find((v) => v.id === state.venue);
  const slot = slots.find((x) => x.id === state.slotConfirmed);
  const total = items.reduce((n, i) => n + i.amount * (i.quantity ?? 1), 0) + 48 + 64;

  const turns: {
    id: string;
    role: "user" | "assistant";
    content: React.ReactNode;
    show: boolean;
  }[] = [
    {
      id: "u1",
      role: "user",
      show: true,
      content:
        "Plan a two-day offsite for our design team of 8 in Copenhagen, mid-March. Keep it under €5k.",
    },
    {
      id: "a1",
      role: "assistant",
      show: state.step >= 1,
      content: (
        <>
          <Text>Happy to. One thing first so I can shortlist the right places.</Text>
          <AgentQuestion
            data={{
              question: "What should the two days focus on?",
              options: focusOptions,
              suggested: {
                optionId: "mix",
                reason: "Teams of 8 usually get the most from half-day blocks.",
              },
            }}
            status={state.focus ? "answered" : "pending"}
            answer={state.focus}
            onSubmit={(answer) => {
              set({ focus: answer });
              reveal(2);
            }}
            onUndo={() => set({ focus: undefined })}
            agent="Planner"
            className="max-w-none"
          />
        </>
      ),
    },
    {
      id: "a2",
      role: "assistant",
      show: state.step >= 2,
      content: (
        <>
          <Text>
            Three venues with a workshop room and space for 8, all within budget.
          </Text>
          <VenueOptions
            picked={state.venue}
            onPick={(id) => {
              set({ venue: id });
              reveal(3);
            }}
          />
        </>
      ),
    },
    {
      id: "a3",
      role: "assistant",
      show: state.step >= 3,
      content: (
        <>
          <Text>
            The loft&apos;s events team can do a 30-minute kickoff call. These times work
            for them.
          </Text>
          <SlotPicker
            data={{
              title: "Kickoff call with Nordhavn Loft",
              slots,
              timeZone: { label: "Copenhagen", offset: 1 },
              attendeeZone: { label: "London", offset: 0 },
            }}
            selectedId={state.slot}
            onSelect={(s) => set({ slot: s?.id ?? null })}
            confirmedId={state.slotConfirmed}
            onConfirm={(s) => {
              set({ slotConfirmed: s.id });
              reveal(4);
            }}
            onChange={() => set({ slotConfirmed: null })}
            className="max-w-none"
          />
        </>
      ),
    },
    {
      id: "a4",
      role: "assistant",
      show: state.step >= 4,
      content: (
        <>
          <Text>I need a few details for the booking.</Text>
          <FormCard
            data={{
              title: "Attendee details",
              description: "Shared with the venue only.",
              fields: [
                { name: "lead", label: "Group lead", type: "text", required: true },
                { name: "email", label: "Email", type: "email", required: true },
                {
                  name: "headcount",
                  label: "People",
                  type: "number",
                  min: 2,
                  max: 12,
                  required: true,
                },
                {
                  name: "diet",
                  label: "Dinner menu",
                  type: "select",
                  options: [
                    { value: "standard", label: "Standard" },
                    { value: "vegetarian", label: "Vegetarian" },
                    { value: "vegan", label: "Vegan" },
                  ],
                },
                {
                  name: "pickup",
                  label: "Airport pickup",
                  type: "switch",
                  description: "Van from CPH on arrival",
                },
              ],
            }}
            values={state.form}
            onValuesChange={(form) => set({ form })}
            status={state.formStatus}
            onStatusChange={(formStatus) => set({ formStatus })}
            onSubmit={() => reveal(5)}
            submitLabel="Save details"
            className="max-w-none"
          />
        </>
      ),
    },
    {
      id: "a5",
      role: "assistant",
      show: state.step >= 5 || confirmed,
      content: (
        <>
          <Text>
            {state.confirm === "done"
              ? "Booked. Invites for the kickoff call are on their way."
              : "Here's everything before I book. Nothing is charged until you confirm."}
          </Text>
          <ConfirmationCard
            data={{
              title: "Design offsite · Copenhagen",
              subtitle: "Mar 18–20 · 8 people",
              items,
              fees: [
                { label: "Service fee", amount: 48 },
                { label: "City tax", amount: 64 },
              ],
              warnings: ["Rooms become non-refundable 14 days before arrival."],
              reference: "CPH-4821",
              doneAt: "Today, 09:31",
            }}
            currency="EUR"
            status={state.confirm}
            onConfirm={() => {
              set({ confirm: "confirming" });
              setTimeout(() => set({ confirm: "done" }), 1200);
            }}
            onUndo={() => set({ confirm: "review" })}
            confirmLabel="Book"
            doneLabel="Booked"
            className="max-w-none"
          />
        </>
      ),
    },
  ];

  const messages = turns
    .filter((t) => t.show)
    .map((t, i) => ({ id: t.id, role: t.role, at: at(10 + i * 3), content: t.content }));
  const extra = state.notes.flatMap((text, i) => [
    { id: `n${i}`, role: "user" as const, at: at(40 + i), content: text },
    {
      id: `r${i}`,
      role: "assistant" as const,
      at: at(40 + i),
      content: "Noted — I'll factor that into the booking.",
    },
  ]);

  const data: BookingAssistantData = {
    title: "Design team offsite",
    model: "opus-5.5",
    user: { name: "Ana Ribeiro" },
    messages: [...messages, ...extra],
    summary: {
      title: "Trip summary",
      estimate: state.venue ? `€${total.toLocaleString("en-US")}` : undefined,
      items: [
        {
          id: "focus",
          label: "Focus",
          value: state.focus
            ? focusOptions.find((o) => o.id === state.focus?.optionIds[0])?.label
            : undefined,
        },
        {
          id: "venue",
          label: "Venue",
          value: venue ? `${venue.title}, Mar 18–20` : undefined,
        },
        {
          id: "call",
          label: "Kickoff call",
          value: slot
            ? `${new Date(`${slot.day}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}, ${slot.start}`
            : undefined,
        },
        {
          id: "people",
          label: "Attendees",
          value:
            state.formStatus === "submitted"
              ? `${state.form.headcount ?? 8} people · ${state.form.diet ?? "standard"} dinner`
              : undefined,
        },
        {
          id: "booking",
          label: "Booking",
          value: state.confirm === "done" ? "Confirmed · CPH-4821" : undefined,
        },
      ],
    },
  };

  return (
    <BookingAssistant
      data={data}
      onSend={(text) => setState((s) => ({ ...s, notes: [...s.notes, text] }))}
    />
  );
}

/** Venues as a carousel when the thread is wide enough, a wrapping list below. */
function VenueOptions({
  picked,
  onPick,
}: {
  picked?: string;
  onPick: (id: string) => void;
}) {
  const data = venues.map((v) => ({
    ...v,
    badge: v.id === picked ? "Picked" : undefined,
    action: v.id === picked ? "Picked" : "Choose",
  }));
  return (
    <>
      <ResultCarousel
        data={data}
        title="Venues"
        subtitle="Mar 18–20 · 8 people"
        compact
        onAction={(item) => onPick(item.id)}
        className="hidden max-w-none @2xl:block"
      />
      <ul className="flex flex-col gap-1.5 rounded-[1.375rem] bg-surface p-1.5 @2xl:hidden">
        {data.map((v) => (
          <li
            key={v.id}
            className="flex items-center gap-3 rounded-2xl bg-surface-inset p-3"
          >
            <span
              aria-hidden="true"
              className="size-9 shrink-0 rounded-xl"
              style={{ background: `color-mix(in oklab, ${v.tint} 35%, var(--surface))` }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{v.title}</p>
              <p className="truncate text-xs text-muted-foreground">{v.meta}</p>
            </div>
            <Button
              size="sm"
              variant={v.id === picked ? "secondary" : "primary"}
              icon={v.id === picked ? Check : undefined}
              iconWeight="bold"
              aria-pressed={v.id === picked}
              onClick={() => onPick(v.id)}
              className="shrink-0"
            >
              {v.id === picked ? "Picked" : v.price}
            </Button>
          </li>
        ))}
      </ul>
    </>
  );
}
