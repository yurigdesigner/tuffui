import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { RunTrace, type TraceSpan } from "@/components/ui/run-trace";

// Map your tracer's spans (OpenTelemetry, Langfuse, agent SDK events) to TraceSpan.
export function Trace({ spans, elapsedMs }: { spans: TraceSpan[]; elapsedMs: number }) {
  return (
    <RunTrace
      data={{ spans, elapsedMs }}
      onZoom={(span) => analytics.track("trace_zoom", { span: span?.name })}
    />
  );
}

// While the run is live, leave endMs undefined on open spans and
// re-render with a growing elapsedMs (e.g. from requestAnimationFrame).`,
  props: [
    {
      name: "data",
      type: "{ spans: TraceSpan[]; elapsedMs: number }",
      required: true,
      description:
        "Spans of one run with offsets from its start. elapsedMs drives running spans and the time axis.",
    },
    {
      name: "view",
      type: '"flame" | "breakdown"',
      default: '"flame"',
      description:
        "Flame is a zoomable flame graph: click a span to fill the width with it, Esc or the breadcrumb to zoom out. Breakdown totals time, tokens or cost per tool and model.",
    },
    {
      name: "onZoom",
      type: "(span: TraceSpan | null) => void",
      description:
        "Called when the flame graph zooms into a span, or back to the whole run.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root section.",
    },
  ],
  types: `type TraceSpan = {
  id: string;
  parentId?: string;       // nests the span under another one
  name: string;
  kind: "llm" | "tool" | "agent" | "retrieval";
  startMs: number;         // offset from the start of the run
  endMs?: number;          // undefined while running
  model?: string;
  tokens?: { input: number; output: number };
  costUsd?: number;
  status?: "ok" | "error";
};`,
};
