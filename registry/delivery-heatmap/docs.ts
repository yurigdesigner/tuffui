import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { DeliveryHeatmap, type DeliveryRange } from "@/components/ui/delivery-heatmap";

export function WebhookDeliveries({ day }: { day: string }) {
  const [range, setRange] = useState<DeliveryRange>("24h");
  // One row per endpoint, one bucket per 5 min / hour / day.
  const { endpoints, labels } = useDeliveryStats(range);

  return (
    <DeliveryHeatmap
      range={range}
      onRangeChange={setRange}
      date={\`\${day} · UTC\`}
      labels={labels} // ["00:00", "01:00", …]
      endpoints={endpoints.map((e) => ({
        id: e.id,
        label: e.name, // "billing-svc"
        buckets: e.buckets.map((b) => ({
          attempts: b.attempts, // retries included
          failed: b.failed,
          status: b.topErrorStatus, // 503
        })),
      }))}
      onSelect={(endpoint, i) => openAttempts(endpoint.id, labels[i])}
    />
  );
}`,
  props: [
    {
      name: "endpoints",
      type: "DeliveryEndpoint[]",
      required: true,
      description:
        "One row per endpoint, top to bottom. Each bucket fills its slot as high as its attempt volume, on five levels against the busiest bucket in view; a failing bucket turns red.",
    },
    {
      name: "labels",
      type: "string[]",
      required: true,
      description:
        'One label per column, e.g. `"11:00"` or `"Nov 4"`. Sets the column count and is used on the axis and in the tooltip.',
    },
    {
      name: "ticks",
      type: "number[]",
      default: "even spread",
      description:
        "Column indexes to label on the axis. Left out, labels thin out to fit the width.",
    },
    {
      name: "range",
      type: '"1h" | "24h" | "7d"',
      description:
        "Controlled range. The component doesn't bucket anything itself: swap `endpoints` and `labels` when it changes, and the cells refill with a short stagger.",
    },
    {
      name: "defaultRange",
      type: '"1h" | "24h" | "7d"',
      default: '"24h"',
      description: "Starting range when uncontrolled.",
    },
    {
      name: "onRangeChange",
      type: "(range: DeliveryRange) => void",
      description: "Shows the 1h / 24h / 7d switch. Called with the new range.",
    },
    {
      name: "failThreshold",
      type: "number",
      default: "0.05",
      description:
        "Share of failed attempts from which a bucket reads as failing. A bucket's own `failing` flag wins over it.",
    },
    {
      name: "title",
      type: "string",
      default: '"Deliveries"',
      description: "Header title.",
    },
    {
      name: "section",
      type: "string",
      default: '"Webhooks"',
      description: "Breadcrumb before the title. Pass an empty string to drop it.",
    },
    { name: "subtitle", type: "string", description: "Secondary line under the title." },
    {
      name: "heading",
      type: "string",
      default: '"Attempts by endpoint"',
      description: "Heading above the chart, also the grid's accessible name.",
    },
    {
      name: "date",
      type: "string",
      description: 'Window shown next to the heading, e.g. "Nov 4 · UTC".',
    },
    {
      name: "stats",
      type: "DeliveryStat[]",
      default: "attempts, delivered, failed",
      description: "Footer row. Numbers roll to their new value. Pass `[]` to hide it.",
    },
    {
      name: "intro",
      type: "boolean",
      default: "true",
      description:
        "Fills the cells in column by column on mount. Off renders the finished chart. Skipped with reduced motion.",
    },
    {
      name: "formatCount",
      type: "(n: number) => string",
      default: '"61,204"',
      description: "Formats counts in the tooltip, footer and cell labels.",
    },
    {
      name: "onSelect",
      type: "(endpoint: DeliveryEndpoint, bucketIndex: number) => void",
      description:
        "Called when a cell is clicked, or picked with Enter. Cells take arrow keys, Home and End; hover and focus show the tooltip on their own.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type DeliveryRange = "1h" | "24h" | "7d";

type DeliveryEndpoint = {
  id: string;
  label: string;             // "billing-svc"
  buckets: DeliveryBucket[]; // same order as labels
};

type DeliveryBucket = {
  attempts: number;          // retries included
  failed: number;
  status?: number | string;  // shown in the tooltip, e.g. 503
  failing?: boolean;         // overrides failThreshold
};

type DeliveryStat = {
  label: string;
  value: number | string;
  tone?: "neutral" | "brand" | "negative";
};`,
};
