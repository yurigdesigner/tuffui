"use client";

import { useMockRun, wait } from "@/registry/use-mock-run/use-mock-run";
import { ArtifactPanel, type ArtifactTab, type ArtifactVersion } from "./artifact-panel";

function Hero({ cta, stats }: { cta?: boolean; stats?: boolean }) {
  return (
    <div className="w-full max-w-sm rounded-2xl bg-foreground/[0.04] p-5">
      <p className="text-[0.6875rem] font-medium text-brand">pressd 3.1</p>
      <p className="mt-1 text-lg font-semibold tracking-tight text-balance">
        Static sites that build in seconds
      </p>
      <p className="mt-1.5 text-[0.8125rem] text-muted-foreground">
        Cached image pipeline, instant previews, zero config.
      </p>
      {cta && (
        <div className="mt-4 flex gap-2">
          <span className="rounded-full bg-foreground px-3.5 py-1.5 text-xs font-medium text-background">
            Get started
          </span>
          <span className="rounded-full bg-foreground/[0.07] px-3.5 py-1.5 text-xs">
            Docs
          </span>
        </div>
      )}
      {stats && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            ["3.8×", "faster"],
            ["12.6s", "full build"],
            ["0", "config"],
          ].map(([n, l]) => (
            <div key={l} className="rounded-xl bg-foreground/[0.05] py-2">
              <p className="font-mono text-sm font-medium">{n}</p>
              <p className="text-[0.6875rem] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const source = (extra: string) => `export function Hero() {
  return (
    <section className="rounded-2xl p-5">
      <p className="text-brand">pressd 3.1</p>
      <h1>Static sites that build in seconds</h1>
      <p>Cached image pipeline, instant previews, zero config.</p>${extra}
    </section>
  );
}`;

const versions: ArtifactVersion[] = [
  {
    id: "v1",
    label: "v1",
    createdAt: "14:02",
    note: "First draft of the hero copy.",
    preview: <Hero />,
    source: source(""),
    filename: "hero.tsx",
  },
  {
    id: "v2",
    label: "v2",
    createdAt: "14:05",
    note: "Added primary and docs actions.",
    preview: <Hero cta />,
    source: source(`
      <div className="flex gap-2">
        <a href="/start">Get started</a>
        <a href="/docs">Docs</a>
      </div>`),
    filename: "hero.tsx",
  },
  {
    id: "v3",
    label: "v3",
    createdAt: "14:09",
    note: "Stats row from the latest benchmark run.",
    preview: <Hero cta stats />,
    source: source(`
      <Actions />
      <Stats items={[["3.8×", "faster"], ["12.6s", "full build"], ["0", "config"]]} />`),
    filename: "hero.tsx",
  },
];

type State = { versionId: string; tab: ArtifactTab };

export default function ArtifactPanelDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const history = variant === "Versions";
  const { state, setState } = useMockRun<State>(
    { versionId: history ? "v3" : "v1", tab: "preview" },
    history
      ? [
          wait(1500),
          { delay: 0, apply: (s) => ({ ...s, versionId: "v2" }) },
          { delay: 1600, apply: (s) => ({ ...s, versionId: "v1" }) },
          { delay: 1600, apply: (s) => ({ ...s, tab: "source" }) },
        ]
      : [
          wait(1200),
          { delay: 0, apply: (s) => ({ ...s, versionId: "v2" }) },
          { delay: 1400, apply: (s) => ({ ...s, versionId: "v3" }) },
          { delay: 1800, apply: (s) => ({ ...s, tab: "source" }) },
          { delay: 2200, apply: (s) => ({ ...s, tab: "preview" }) },
        ],
    { autoplay },
  );

  return (
    <ArtifactPanel
      view={history ? "versions" : "preview"}
      data={{ title: "Landing hero", kind: "React", versions }}
      versionId={state.versionId}
      onVersionChange={(v) => setState((s) => ({ ...s, versionId: v.id }))}
      tab={state.tab}
      onTabChange={(tab) => setState((s) => ({ ...s, tab }))}
      onRestore={() => setState((s) => ({ ...s, versionId: "v3" }))}
      onOpen={() => {}}
    />
  );
}
