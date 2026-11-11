import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { MessageLog } from "@/components/ui/message-log";

export function WebhookLog({ deliveries, perMinute, today }: WebhookData) {
  return (
    <MessageLog
      section="Webhooks"
      title="Message log"
      buckets={perMinute.map((m) => ({
        at: m.minute, // start of the minute
        delivered: m.ok,
        failed: m.failed,
      }))}
      events={deliveries.map((d) => ({
        id: d.messageId, // "msg_2Fk8pZ"
        type: d.eventType, // "order.refunded"
        endpoint: d.endpoint.name,
        at: d.createdAt,
        attempts: d.attempts.map((a) => ({
          status: a.nextAt ? "scheduled" : a.ok ? "delivered" : "failed",
          code: a.httpStatus, // 503
          label: a.reason, // "Service unavailable"
          at: a.nextAt ?? a.sentAt,
          ms: a.durationMs,
          body: a.responseBody,
        })),
      }))}
      defaultWindow={[minutesAgo(5), now()]} // touches the live edge, so it follows it
      total={today.count}
      totalLabel="today"
      onReplay={(event) => replayMessage(event.id)}
      onCopyCurl={(event) => curlFor(event.id)}
    />
  );
}`,
  props: [
    {
      name: "events",
      type: "MessageEvent[]",
      required: true,
      description:
        "Events in any order; the log lists them newest first. The last attempt decides the status: delivered reads as `200 OK`, failed as its code, scheduled or sending as Retrying.",
    },
    {
      name: "buckets",
      type: "MessageBucket[]",
      required: true,
      description:
        "Delivered and failed counts per evenly spaced bucket, oldest first, drawn as dot columns. Narrow cards show the most recent 45, 30 or 15 so dots never merge.",
    },
    {
      name: "perDot",
      type: "number",
      default: "round number for ≤ 8 dots",
      description:
        "Events per dot. Any failure in a bucket draws at least one red dot, so a small error rate is never rounded away.",
    },
    {
      name: "window",
      type: "[number, number] | null",
      description:
        "Controlled brush window in epoch ms, end exclusive. Only events whose `at` falls inside are listed. `null` lists everything.",
    },
    {
      name: "defaultWindow",
      type: "[Time, Time] | null",
      default: "null",
      description:
        "Starting brush when uncontrolled. A window that ends at the newest bucket follows it as new buckets arrive.",
    },
    {
      name: "onWindowChange",
      type: "(window: [number, number] | null) => void",
      description:
        "Called while the brush is dragged, resized or moved with the keyboard, and with `null` when it is cleared. Drag on the chart to draw one; a plain click clears it.",
    },
    {
      name: "filter",
      type: '"all" | "failed" | "retrying"',
      description: "Controlled All / Failed / Retrying tab.",
    },
    {
      name: "defaultFilter",
      type: '"all" | "failed" | "retrying"',
      default: '"all"',
      description: "Starting tab when uncontrolled.",
    },
    {
      name: "onFilterChange",
      type: "(filter: MessageFilter) => void",
      description: "Called when the tab changes.",
    },
    {
      name: "query",
      type: "string",
      description:
        "Controlled search text. Matches event type, message id, endpoint and HTTP codes. Press / anywhere on the page to focus it.",
    },
    {
      name: "defaultQuery",
      type: "string",
      default: '""',
      description: "Starting search text when uncontrolled.",
    },
    {
      name: "onQueryChange",
      type: "(query: string) => void",
      description: "Called as the search text changes.",
    },
    {
      name: "selectedId",
      type: "string | null",
      description:
        "Controlled expanded row. The row opens into its attempts and the response body of the latest finished try; click another try to see its body.",
    },
    {
      name: "defaultSelectedId",
      type: "string | null",
      default: "null",
      description: "Row expanded on mount when uncontrolled.",
    },
    {
      name: "onSelect",
      type: "(event: MessageEvent | null) => void",
      description: "Called when a row is opened, or with `null` when it is closed.",
    },
    {
      name: "onReplay",
      type: "(event: MessageEvent) => void",
      description:
        "Shows a Replay button in the expanded row. Add a `sending` attempt to the event and the button shows a spinner until you swap it for the result.",
    },
    {
      name: "onCopyCurl",
      type: "(event: MessageEvent) => string | void",
      description:
        "Shows a Copy cURL button. Return the command and it is written to the clipboard for you.",
    },
    {
      name: "maxAttempts",
      type: "number",
      default: "8",
      description: "Dots in the Attempts column: one per try, then faint empty slots.",
    },
    {
      name: "annotation",
      type: "{ at: Time; label: string; detail?: string } | null",
      default: "start of the current failure run",
      description:
        'Flag on the timeline. Left out, it marks where the failing buckets that reach now began, with the most common endpoint and code, e.g. "billing-svc · 503". `null` hides it.',
    },
    {
      name: "section",
      type: "string",
      default: '"Webhooks"',
      description: "First part of the breadcrumb title. Hidden on narrow cards.",
    },
    {
      name: "title",
      type: "string",
      default: '"Message log"',
      description: "Header title and the accessible name of the log.",
    },
    {
      name: "total",
      type: "number",
      default: "events.length",
      description: 'Every event in the period, for the "4 of 12,480" footer count.',
    },
    {
      name: "totalLabel",
      type: "string",
      description: 'Words after the footer count, e.g. "today".',
    },
    {
      name: "formatTime",
      type: '(date: Date, precision: "minute" | "second") => string',
      default: '"11:04" / "11:04:09" in UTC',
      description: "Formats the axis, the window, row times and attempt times.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type Time = Date | string | number;

type MessageEvent = {
  id: string;
  type: string;          // "order.created"
  endpoint: string;      // "billing-svc"
  at: Time;              // when it was sent
  attempts: MessageAttempt[];
  latencyMs?: number;    // defaults to the last finished try's ms
  body?: string;         // fallback response body
  bodyLanguage?: CodeLanguage; // "json" by default
};

type MessageAttempt = {
  status: "delivered" | "failed" | "scheduled" | "sending";
  code?: number;         // 503
  label?: string;        // "Service unavailable"
  at: Time;              // ran at, or due at for "scheduled"
  ms?: number;
  body?: string;
};

type MessageBucket = { at: Time; delivered: number; failed: number };

// Brush keys: ← → move the window, Shift + ← → resize it,
// Home / End jump to the edges, Esc clears it.`,
};
