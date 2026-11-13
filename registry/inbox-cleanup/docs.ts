import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { InboxCleanup } from "@/components/ui/inbox-cleanup";

// Rendered by the agent in answer to "which newsletters should I unsubscribe from?"
export function InboxCleanupAnswer({ newsletters }: Props) {
  return (
    <InboxCleanup
      senders={newsletters.map((n) => ({
        id: n.id,
        name: n.fromName, // "The Daily Brief"
        perWeek: n.weeklyVolume, // 7
        openRate: n.opened / n.received, // 0.02
      }))}
      // Four or more emails a week, opened under 10% of the time.
      defaultZone={{ minPerWeek: 4, maxOpenRate: 0.1 }}
      onUnsubscribe={(ids) => runTool("unsubscribe", { senders: ids })}
      onDigest={(ids) => runTool("weekly_digest", { senders: ids })}
      onKeep={() => sendFollowUp("Keep them all for now")}
    />
  );
}`,
  props: [
    {
      name: "senders",
      type: "InboxSender[]",
      required: true,
      description:
        "Every sender, in any order. Each is a dot: emails a week across, open rate up a log scale.",
    },
    {
      name: "zone",
      type: "InboxZone",
      description:
        "Controlled unsubscribe zone. Senders at or above `minPerWeek` and below `maxOpenRate` are in it.",
    },
    {
      name: "defaultZone",
      type: "InboxZone",
      default: "{ minPerWeek: 4, maxOpenRate: 0.1 }",
      description: "Starting zone when uncontrolled.",
    },
    {
      name: "onZoneChange",
      type: "(zone: InboxZone) => void",
      description:
        "Called while the zone's left or top edge is dragged, or moved with the arrow keys (Shift for bigger steps).",
    },
    {
      name: "adjustable",
      type: "boolean",
      default: "true",
      description: "Shows the two edge handles. Off fixes the zone where it is.",
    },
    {
      name: "selectedIds",
      type: "string[]",
      description:
        "Controlled selection: the senders to unsubscribe from. Ids outside the zone are ignored.",
    },
    {
      name: "defaultSelectedIds",
      type: "string[]",
      description:
        "Starting selection when uncontrolled. Omitted, every sender in the zone starts checked, including ones that enter it later.",
    },
    {
      name: "onSelectedChange",
      type: "(ids: string[]) => void",
      description:
        "Called when a checkbox is toggled, or a zone dot is clicked or picked with Enter or Space.",
    },
    {
      name: "highlightedId",
      type: "string | null",
      description:
        "The sender the agent points at: its dot gets a ring and its tooltip shows until someone hovers another.",
    },
    {
      name: "xDomain",
      type: "[number, number]",
      default: "[0, 12]",
      description: "Emails a week across the x axis. Senders beyond it sit on the edge.",
    },
    {
      name: "xTicks",
      type: "number[]",
      default: "[0, 4, 8, 12]",
      description: "X axis labels. Defaults to four evenly spaced values.",
    },
    {
      name: "yDomain",
      type: "[number, number]",
      default: "[0.01, 1]",
      description: "Open rate, 0–1, up the log y axis.",
    },
    {
      name: "yTicks",
      type: "number[]",
      default: "[1, 0.5, 0.25, 0.1]",
      description: "Y labels and their gridlines.",
    },
    {
      name: "summary",
      type: "ReactNode | ((stats: InboxCleanupStats) => ReactNode)",
      description:
        "Agent text above the chart. Defaults to a sentence built from the live zone: senders, threshold and emails a week skipped.",
    },
    {
      name: "status",
      type: '"analyzing" | "ready"',
      default: '"ready"',
      description:
        "Analyzing plots grey dots only. Ready draws the zone in, turns its senders accent and opens the list and actions.",
    },
    {
      name: "analyzingText",
      type: "ReactNode",
      default: '"Plotting 40 senders by volume and opens…"',
      description: "Shown in place of the summary while analyzing.",
    },
    {
      name: "list",
      type: "boolean",
      default: "true",
      description:
        "Shows the senders in the zone with checkboxes. Hovering a row picks out its dot, and the other way round.",
    },
    {
      name: "onUnsubscribe",
      type: "(ids: string[]) => void",
      description: 'Shows the primary "Unsubscribe from N" button. Gets the checked ids.',
    },
    {
      name: "onDigest",
      type: "(ids: string[]) => void",
      description: 'Shows "Digest instead". Gets the checked ids.',
    },
    {
      name: "onKeep",
      type: "() => void",
      description: 'Shows "Keep all".',
    },
    {
      name: "icon",
      type: "Icon",
      default: "Broom",
      description: "Phosphor icon in the header tile.",
    },
    {
      name: "title",
      type: "ReactNode",
      default: '"Inbox cleanup"',
      description: "Header title.",
    },
    {
      name: "subtitle",
      type: "ReactNode",
      default: '"40 senders · Last 90 days"',
      description: "Secondary line under the title.",
    },
    {
      name: "chartTitle",
      type: "string",
      default: '"Volume × opens"',
      description: "Chart heading, also its accessible name.",
    },
    {
      name: "period",
      type: "string",
      default: '"Last 90 days"',
      description: "Period label right of the chart heading.",
    },
    {
      name: "zoneLabel",
      type: "string",
      default: '"Unsubscribe zone"',
      description: "Label in the zone's top-right corner.",
    },
    {
      name: "formatPerWeek",
      type: "(perWeek: number) => string",
      default: '"7 / wk"',
      description: "Volume in the tooltip and the list.",
    },
    {
      name: "formatOpenRate",
      type: "(openRate: number) => string",
      default: '"2%"',
      description: "Open rate in the tooltip, the list and the default summary.",
    },
    {
      name: "formatXTick",
      type: "(value: number, index: number, ticks: number[]) => string",
      default: '"12 / wk" on the last tick',
      description: "X axis labels.",
    },
    {
      name: "formatYTick",
      type: "(value: number) => string",
      default: '"25%"',
      description: "Y axis labels.",
    },
    {
      name: "intro",
      type: "boolean",
      default: "true",
      description:
        "Dots fade and scale in on mount, and the zone's senders turn accent one by one when it appears. Skipped with reduced motion.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type InboxSender = {
  id: string;
  name: string;       // "The Daily Brief"
  perWeek: number;    // emails a week, 7
  openRate: number;   // share opened, 0–1, 0.02
};

type InboxZone = {
  minPerWeek: number;  // 4  → at least 4 emails a week
  maxOpenRate: number; // 0.1 → opened under 10%
};

type InboxCleanupStats = {
  count: number;          // senders in the zone
  perWeek: number;        // emails a week from them
  skippedPerWeek: number; // of those, unopened
  zone: InboxZone;
};

// Also exported: inZone(sender, zone) => boolean`,
};
