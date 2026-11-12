"use client";

import { BellSimple, PencilSimpleLine } from "@phosphor-icons/react";
import { useState } from "react";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { RenewalRings, type RenewalAction, type RenewalContract } from "./renewal-rings";

// Fixed, so the server and the client draw the same clock face.
const TODAY = "2026-11-04";

const CONTRACTS: RenewalContract[] = [
  {
    id: "kestrel",
    name: "Kestrel",
    endDate: "2026-11-20",
    noticeDays: 30,
    value: 84_000,
    autoRenew: true,
    note: "Notice window already closed, so it renews on Nov 20 at the current rate.",
  },
  {
    id: "northvale",
    name: "Northvale",
    endDate: "2026-12-08",
    noticeDays: 30,
    value: 280_000,
    autoRenew: true,
    note: "First deadline: notice by Nov 8 or it auto-renews for a year. Seats in use fell 31% this quarter, worth renegotiating.",
  },
  {
    id: "halden",
    name: "Halden",
    endDate: "2026-12-26",
    noticeDays: 30,
    value: 126_000,
    autoRenew: true,
  },
  {
    id: "orrery",
    name: "Orrery",
    endDate: "2027-01-14",
    noticeDays: 60,
    value: 480_000,
    autoRenew: false,
    note: "Largest renewal in the window. Procurement wants a decision by Nov 15.",
  },
  {
    id: "brightwell",
    name: "Brightwell",
    endDate: "2027-01-31",
    noticeDays: 30,
    value: 58_000,
    autoRenew: true,
  },
  {
    id: "cobalt",
    name: "Cobalt Bay",
    endDate: "2027-04-03",
    noticeDays: 90,
    value: 190_000,
    autoRenew: true,
  },
  {
    id: "marlow",
    name: "Marlow",
    endDate: "2027-06-27",
    noticeDays: 60,
    value: 72_000,
    autoRenew: false,
  },
  {
    id: "tessel",
    name: "Tessel",
    endDate: "2027-07-24",
    noticeDays: 30,
    value: 44_000,
    autoRenew: true,
  },
  {
    id: "quillon",
    name: "Quillon",
    endDate: "2027-08-31",
    noticeDays: 60,
    value: 132_000,
    autoRenew: true,
  },
  {
    id: "fenwick",
    name: "Fenwick",
    endDate: "2027-10-01",
    noticeDays: 30,
    value: 66_000,
    autoRenew: false,
  },
  {
    id: "ashgrove",
    name: "Ashgrove",
    endDate: "2027-10-22",
    noticeDays: 90,
    value: 210_000,
    autoRenew: true,
  },
];

/** Synced from the CRM mid-answer. */
const LARKSPUR: RenewalContract = {
  id: "larkspur",
  name: "Larkspur",
  endDate: "2027-01-05",
  noticeDays: 45,
  value: 96_000,
  autoRenew: true,
  note: "Just synced from the CRM: the pilot converts to an annual plan unless you give notice by Nov 21.",
};

const ACTIONS: RenewalAction[] = [
  {
    label: "Draft notice",
    icon: PencilSimpleLine,
    onSelect: () => {},
    hidden: (c) => !c.noticeDays || c.id === "kestrel",
  },
  { label: "Remind me", icon: BellSimple, onSelect: () => {} },
];

type State = { added: boolean; selected: string | null };

export default function RenewalRingsDemo({
  autoplay = true,
  thumbnail = false,
}: {
  variant?: string;
  autoplay?: boolean;
  thumbnail?: boolean;
}) {
  // Rings sweep in, the agent points at the first notice deadline, then a new
  // contract syncs in and takes its place among the rings.
  const steps: MockStep<State>[] = autoplay
    ? [
        wait(1500),
        { delay: 0, apply: (s) => ({ ...s, selected: "northvale" }) },
        { delay: 2600, apply: (s) => ({ ...s, added: true }) },
        { delay: 1400, apply: (s) => ({ ...s, selected: "larkspur" }) },
      ]
    : [];
  const { state } = useMockRun<State>(
    autoplay ? { added: false, selected: null } : { added: true, selected: "northvale" },
    steps,
    { autoplay },
  );
  // Once someone picks a ring, the script stops steering the selection.
  const [picked, setPicked] = useState<string | null | undefined>(undefined);

  return (
    <RenewalRings
      contracts={state.added ? [...CONTRACTS, LARKSPUR] : CONTRACTS}
      today={TODAY}
      maxRings={7}
      selectedId={picked !== undefined ? picked : state.selected}
      onSelectedChange={setPicked}
      actions={ACTIONS}
      details={!thumbnail}
      intro={autoplay}
    />
  );
}
