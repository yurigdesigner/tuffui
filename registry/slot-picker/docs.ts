import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { SlotPicker } from "@/components/ui/slot-picker";

// The scheduling agent proposes free slots from both calendars.
export function ProposeTimes({ proposal }: { proposal: Proposal }) {
  return (
    <SlotPicker
      data={{
        title: proposal.title,
        slots: proposal.slots, // { id, day: "2026-11-10", start: "14:30", end: "15:00", busy?, suggested? }
        timeZone: { label: "Lisbon (UTC+0)", offset: 0 },
        attendeeZone: { label: "New York (UTC−5)", offset: -5 },
      }}
      onConfirm={(slot) => agent.sendToolResult(proposal.callId, { slotId: slot.id })}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "{ title?: string; slots: Slot[]; timeZone: SlotZone; attendeeZone?: SlotZone }",
      required: true,
      description:
        "Candidate slots in `timeZone`. With `attendeeZone` a switch shows the times in the other person's zone.",
    },
    {
      name: "variant",
      type: '"week" | "day"',
      default: '"week"',
      description:
        "Day columns for up to five days, or one day at a time with durations.",
    },
    {
      name: "selectedId / onSelect",
      type: "string | null",
      description: "The picked slot. Picking shows a confirm row under the panel.",
    },
    {
      name: "onConfirm",
      type: "(slot: Slot) => void",
      description:
        "Called from the confirm row; the card switches to the confirmed summary.",
    },
    {
      name: "confirmedId / onChange",
      type: "string | null",
      description:
        "Controls the confirmed state. onChange fires from “Pick another time”.",
    },
    { name: "className", type: "string", description: "Extra classes for the shell." },
  ],
  types: `type Slot = {
  id: string;
  day: string;   // ISO date
  start: string; // "HH:MM" in data.timeZone
  end: string;
  busy?: boolean;      // shown striped and disabled
  suggested?: boolean; // marked with a dot
};

type SlotZone = { label: string; offset: number }; // hours from UTC`,
};
