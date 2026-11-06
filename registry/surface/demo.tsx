"use client";

import { Brain, Gauge, ShieldCheck } from "@phosphor-icons/react";
import { Panel, Inset, Shell, ShellHeader } from "@/components/ui/surface";
import { StatusPill } from "@/components/ui/status-pill";

export default function SurfaceDemo({ variant }: { variant?: string }) {
  if (variant === "Headers") {
    return (
      <div className="flex w-full max-w-md flex-col gap-3">
        <Shell>
          <ShellHeader
            icon={ShieldCheck}
            title="Permission requests"
            aside={
              <span className="text-[0.8125rem] text-muted-foreground">4 waiting</span>
            }
          />
          <Panel className="h-14" />
        </Shell>
        <Shell>
          <ShellHeader
            icon={Gauge}
            title="Rate limits"
            subtitle="opus-5.5 · Tier 3"
            aside={
              <StatusPill tone="positive" size="sm">
                Healthy
              </StatusPill>
            }
          />
          <Panel className="h-14" />
        </Shell>
        <Shell>
          <ShellHeader title="No icon" subtitle="The title lines up with panel content" />
          <Panel className="h-14" />
        </Shell>
      </div>
    );
  }

  return (
    <Shell className="max-w-md">
      <ShellHeader
        icon={Brain}
        title="Shell"
        subtitle="Headers and footers sit in its padding"
      />
      <Panel className="p-4">
        <p className="text-sm">Panel</p>
        <p className="mb-3 text-[0.8125rem] text-muted-foreground">
          Main content, one step lighter or darker than the shell.
        </p>
        <Inset className="px-3.5 py-3 font-mono text-xs text-muted-foreground">
          Inset — code, payloads and details, one level deeper
        </Inset>
      </Panel>
      <p className="px-3.5 py-3 text-[0.8125rem] text-muted-foreground">
        Footer text lives in the shell too.
      </p>
    </Shell>
  );
}
