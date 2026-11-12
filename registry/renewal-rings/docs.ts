import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { BellSimple, PencilSimpleLine } from "@phosphor-icons/react";
import { RenewalRings } from "@/components/ui/renewal-rings";

// Rendered by the agent in answer to "which contracts renew soon?"
export function RenewalsAnswer({ contracts, firstDeadline }: Props) {
  return (
    <RenewalRings
      today={new Date()}
      contracts={contracts.map((c) => ({
        id: c.id,
        name: c.account, // "Northvale"
        endDate: c.termEnd, // "2026-12-08"
        noticeDays: c.noticePeriod, // 30
        value: c.acv,
        autoRenew: c.autoRenew,
        note: c.id === firstDeadline.id ? firstDeadline.summary : undefined,
      }))}
      // The agent points at the first notice deadline.
      defaultSelectedId={firstDeadline.id}
      actions={[
        {
          label: "Draft notice",
          icon: PencilSimpleLine,
          onSelect: (c) => sendFollowUp(\`Draft a non-renewal notice for \${c.name}\`),
        },
        { label: "Remind me", icon: BellSimple, onSelect: (c) => remind(c.id) },
      ]}
    />
  );
}`,
  props: [
    {
      name: "contracts",
      type: "RenewalContract[]",
      required: true,
      description:
        "Every contract, in any order. Those ending within the horizon are sorted by end date; the soonest gets the outer ring.",
    },
    {
      name: "today",
      type: "string | Date",
      default: "new Date()",
      description:
        'Start of the clock face, at 12 o\'clock. Dates are compared as calendar days. Pass a fixed date (e.g. `"2026-11-04"`) when rendering on the server.',
    },
    {
      name: "horizonMonths",
      type: "number",
      default: "12",
      description: "Months around the clock face. Contracts ending later are left out.",
    },
    {
      name: "windowDays",
      type: "number",
      default: "90",
      description:
        "Renewal window: counted in the header pill and the center, marked by the dotted radius, and the scope of the auto-renew and ACV stats.",
    },
    {
      name: "noticeSoonDays",
      type: "number",
      default: "30",
      description: "Notice deadlines within this many days count as due in the footer.",
    },
    {
      name: "maxRings",
      type: "number",
      default: "6",
      description:
        'Rings drawn at most; the soonest ends are kept and the panel says "6 of 9 shown". Rings tighten to fit.',
    },
    {
      name: "selectedId",
      type: "string | null",
      description:
        "Controlled selection. The selected ring stays highlighted and its details stay open; hover and focus preview others.",
    },
    {
      name: "defaultSelectedId",
      type: "string | null",
      default: "null",
      description: "Starting selection when uncontrolled.",
    },
    {
      name: "onSelectedChange",
      type: "(id: string | null) => void",
      description:
        "Called when a ring or its name is clicked, or picked with Enter or Space. Clicking the selected ring clears it; so does Escape. Arrow keys, Home and End move between rings.",
    },
    {
      name: "actions",
      type: "RenewalAction[]",
      description:
        "Small follow-up buttons under the active contract's details, e.g. Draft notice or Remind me. `hidden` drops one for some contracts.",
    },
    {
      name: "title",
      type: "string",
      default: '"Renewals"',
      description: "Header title.",
    },
    {
      name: "subtitle",
      type: "string",
      default: '"Next 12 months · from today"',
      description: "Secondary line under the title.",
    },
    {
      name: "heading",
      type: "string",
      default: '"Term left"',
      description: "Heading above the chart, also its accessible name.",
    },
    {
      name: "details",
      type: "boolean",
      default: "true",
      description:
        "Shows the details block: below the chart on narrow cards, beside it from 32rem.",
    },
    {
      name: "stats",
      type: "boolean",
      default: "true",
      description: "Shows the footer: notices due, auto-renewals and ACV up for renewal.",
    },
    {
      name: "intro",
      type: "boolean",
      default: "true",
      description:
        "Sweeps each arc in from Today on mount, one after another. Off renders the finished chart. Skipped with reduced motion.",
    },
    {
      name: "formatValue",
      type: "(value: number) => string",
      default: '"$1.2M"',
      description: "Formats ACV in the details and the footer.",
    },
    {
      name: "formatDate",
      type: "(date: Date) => string",
      default: '"Mar 14, 2027"',
      description: "Formats end and notice dates. The date is UTC midnight of that day.",
    },
    {
      name: "formatMonth",
      type: "(date: Date) => string",
      default: '"M"',
      description: "Month labels around the face.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type RenewalContract = {
  id: string;
  name: string;             // "Northvale"
  endDate: string | Date;   // last day of the term, "2026-12-08"
  noticeDays?: number;      // hatched window before the end; 0 hides it
  value: number;            // annual contract value
  autoRenew?: boolean;
  note?: React.ReactNode;   // shown with the details, e.g. the agent's note
};

type RenewalAction = {
  label: string;
  icon?: Icon;              // Phosphor icon
  onSelect: (contract: RenewalContract) => void;
  hidden?: (contract: RenewalContract) => boolean;
};`,
};
