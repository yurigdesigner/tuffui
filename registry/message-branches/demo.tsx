"use client";

import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { MessageBranches, type MessageVersion } from "./message-branches";

type State = { versions: MessageVersion[]; index: number };

/** Renders `code` spans; enough for the demo copy. */
const md = (text: string) =>
  text.split(/`([^`]+)`/).map((part, i) =>
    i % 2 ? (
      <code
        key={i}
        className="rounded-md bg-foreground/[0.06] px-1 font-mono text-[0.85em]"
      >
        {part}
      </code>
    ) : (
      part
    ),
  );

const original: MessageVersion = {
  id: "v1",
  kind: "original",
  meta: "sonnet-5.5",
  content: md(
    "Cache resized images by content hash in `.pressd/cache`. On each build, hash the source file and the resize options; if the key exists, copy the cached output instead of running sharp again.",
  ),
};

const versions: MessageVersion[] = [
  {
    id: "v2",
    kind: "regenerated",
    meta: "opus-5.5",
    content: md(
      "Key the cache on a hash of the source bytes plus the resize options, store outputs in `.pressd/cache/images`, and prune entries untouched for 30 days. That keeps CI warm without the cache growing forever.",
    ),
  },
  {
    id: "v3",
    kind: "regenerated",
    meta: "opus-5.5",
    content: md(
      "Two layers work best: an in-memory map for the current build, so the same image used twice is resized once, and a disk cache keyed by content hash for the next build. Expect 48s builds to drop to about 13s.",
    ),
  },
  {
    id: "v4",
    kind: "edited",
    meta: "opus-5.5",
    prompt: "Same question, but the cache has to work on Vercel builds too.",
    turnsAfter: 2,
    content: md(
      "On Vercel, write the cache to `node_modules/.cache/pressd` — that folder is restored between builds. Keep the content-hash key so a changed image always misses, and skip the 30-day prune there.",
    ),
  },
];

const add = (v: MessageVersion, delay: number): MockStep<State> => ({
  delay,
  apply: (s) => ({ versions: [...s.versions, v], index: s.versions.length }),
});

const script: MockStep<State>[] = [
  add(versions[0], 1600),
  add(versions[1], 2200),
  wait(1800),
  { delay: 0, apply: (s) => ({ ...s, index: 0 }) },
  add(versions[2], 2000),
];

export default function MessageBranchesDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const { state, setState } = useMockRun<State>(
    // A paused thumbnail shows every version already in place.
    autoplay
      ? { versions: [original], index: 0 }
      : { versions: [original, ...versions], index: 3 },
    script,
    { autoplay },
  );

  return (
    <MessageBranches
      data={{ versions: state.versions, turnsBefore: 3 }}
      index={state.index}
      onIndexChange={(index) => setState((s) => ({ ...s, index }))}
      onRegenerate={() => {}}
      variant={variant === "Map" ? "map" : "inline"}
    />
  );
}
