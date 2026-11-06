"use client";

import { useMockRun, wait } from "@/registry/use-mock-run/use-mock-run";
import {
  ConfirmationCard,
  type ConfirmationItem,
  type ConfirmationStatus,
} from "./confirmation-card";

const items: ConfirmationItem[] = [
  {
    id: "rooms",
    label: "Hotel rooms",
    detail: "Casa do Rio, Porto · 2 nights",
    amount: 360,
    quantity: 7,
    editable: true,
  },
  {
    id: "venue",
    label: "Meeting room",
    detail: "Full day, Mar 13",
    amount: 640,
    removable: true,
  },
  {
    id: "dinner",
    label: "Team dinner",
    detail: "Mar 13, 20:00 · 7 people",
    amount: 455,
    removable: true,
  },
  {
    id: "transfer",
    label: "Airport transfer",
    detail: "Van, both ways",
    amount: 180,
    removable: true,
  },
];

type State = { items: ConfirmationItem[]; status: ConfirmationStatus };

export default function ConfirmationCardDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const done = variant === "Done";
  const { state, setState } = useMockRun<State>(
    { items, status: done ? "done" : "review" },
    done
      ? []
      : [
          wait(1500),
          {
            delay: 0,
            apply: (s) => ({
              ...s,
              items: s.items.map((i) => (i.id === "rooms" ? { ...i, quantity: 6 } : i)),
            }),
          },
          {
            delay: 1300,
            apply: (s) => ({ ...s, items: s.items.filter((i) => i.id !== "transfer") }),
          },
          { delay: 1500, apply: (s) => ({ ...s, status: "confirming" }) },
          { delay: 1300, apply: (s) => ({ ...s, status: "done" }) },
        ],
    { autoplay },
  );

  return (
    <ConfirmationCard
      data={{
        title: "Book the Porto offsite",
        subtitle: "Mar 12–14 · 6 people",
        items: state.items,
        fees: [
          { label: "Service fee", amount: 48 },
          { label: "City tax", amount: 36 },
        ],
        warnings: ["Rooms become non-refundable on Mar 1."],
        reference: "BK-48213",
        doneAt: "Booked today, 14:32",
      }}
      status={state.status}
      onItemsChange={(next) => setState((s) => ({ ...s, items: next }))}
      onConfirm={() => {
        setState((s) => ({ ...s, status: "confirming" }));
        setTimeout(() => setState((s) => ({ ...s, status: "done" })), 1200);
      }}
      onEdit={() => {}}
      onCancel={() => setState({ items, status: "review" })}
      onUndo={() => setState((s) => ({ ...s, status: "review" }))}
      confirmLabel="Book"
      doneLabel="Booked"
    />
  );
}
