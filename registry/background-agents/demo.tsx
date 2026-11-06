"use client";

import { useMockRun, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { BackgroundAgents, type BackgroundAgent } from "./background-agents";

type State = BackgroundAgent[];

const initial: State = [
  {
    id: "licenses",
    name: "License audit",
    task: "Check every npm dependency against the allowed-license list",
    status: "running",
    progress: 0.34,
    action: "Reading node_modules/sharp/package.json",
    elapsedMs: 74_000,
  },
  {
    id: "og",
    name: "OG images",
    task: "Generate social cards for 40 blog posts",
    status: "running",
    progress: 0.6,
    action: "Rendered 24 of 40 · /blog/edge-caching",
    elapsedMs: 211_000,
  },
  {
    id: "invoices",
    name: "Invoice backfill",
    task: "Regenerate PDFs for March invoices with the new tax line",
    status: "waiting",
    progress: 0.48,
    action: "3 invoices have no VAT ID — needs a decision",
    elapsedMs: 166_000,
  },
  {
    id: "docs-ja",
    name: "Docs in Japanese",
    task: "Translate the getting-started guide and API reference",
    status: "queued",
    progress: 0,
    action: "Waits for a free worker",
    elapsedMs: 0,
  },
];

/** Patches an agent unless the viewer paused or cancelled it. */
const step = (
  delay: number,
  id: string,
  patch: Partial<BackgroundAgent>,
): MockStep<State> => ({
  delay,
  apply: (s) =>
    s.map((a) =>
      a.id === id && (a.status === "running" || a.status === "queued")
        ? { ...a, ...patch, elapsedMs: a.elapsedMs + delay }
        : a,
    ),
});

const script: MockStep<State>[] = [
  step(900, "og", { progress: 0.68, action: "Rendered 27 of 40 · /blog/rsc-patterns" }),
  step(800, "licenses", { progress: 0.45, action: "sharp — Apache-2.0 · allowed" }),
  step(1000, "og", { progress: 0.79, action: "Rendered 32 of 40 · /blog/vector-search" }),
  step(900, "licenses", { progress: 0.58, action: "Flagged caniuse-lite — CC-BY-4.0" }),
  step(1000, "og", { progress: 0.93, action: "Rendered 37 of 40 · /blog/zero-downtime" }),
  step(900, "licenses", { progress: 0.71, action: "Reading node_modules/@img/…" }),
  step(900, "og", {
    progress: 1,
    status: "done",
    action: "40 images in public/og · 3.1 MB",
  }),
  step(600, "docs-ja", {
    status: "running",
    progress: 0.06,
    action: "Splitting 18 pages into chunks",
  }),
  step(1000, "licenses", { progress: 0.86, action: "Writing licenses.csv" }),
  step(900, "docs-ja", { progress: 0.19, action: "Translating getting-started.mdx" }),
  step(1000, "licenses", {
    progress: 1,
    status: "done",
    action: "412 packages · 1 needs legal review",
  }),
  step(900, "docs-ja", { progress: 0.33, action: "Translating api/authentication.mdx" }),
];

export default function BackgroundAgentsDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const { state, setState } = useMockRun<State>(initial, script, { autoplay });
  const set = (id: string, patch: Partial<BackgroundAgent>) =>
    setState((s) => s.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  return (
    <BackgroundAgents
      data={state}
      layout={variant === "Dock" ? "dock" : "grid"}
      className={variant === "Dock" ? "max-w-md" : undefined}
      onPause={(a) => set(a.id, { status: "paused", action: "Paused by you" })}
      onResume={(a) => set(a.id, { status: "running" })}
      onCancel={(a) => set(a.id, { status: "cancelled", action: "Cancelled by you" })}
      onReview={(a) =>
        set(a.id, { status: "running", action: "Skipping invoices without a VAT ID" })
      }
      onOpen={() => {}}
    />
  );
}
