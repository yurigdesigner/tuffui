"use client";

import { Tabs } from "radix-ui";
import { CopyButton } from "./copy-button";

const managers = {
  pnpm: "pnpm dlx shadcn@latest add",
  npm: "npx shadcn@latest add",
  yarn: "yarn dlx shadcn@latest add",
  bun: "bunx --bun shadcn@latest add",
} as const;

export function InstallBlock({ url }: { url: string }) {
  return (
    <Tabs.Root defaultValue="pnpm" className="rounded-[1.375rem] bg-surface p-1.5">
      <Tabs.List
        aria-label="Package manager"
        className="mb-1.5 inline-flex h-8 items-center rounded-full bg-foreground/[0.05] p-0.5"
      >
        {Object.keys(managers).map((name) => (
          <Tabs.Trigger
            key={name}
            value={name}
            className="h-full rounded-full px-3 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-surface-raised data-[state=active]:text-foreground"
          >
            {name}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {Object.entries(managers).map(([name, command]) => {
        const full = `${command} ${url}`;
        return (
          <Tabs.Content
            key={name}
            value={name}
            className="flex items-center gap-2 rounded-2xl bg-surface-inset py-1.5 pr-1.5 pl-4"
          >
            <code className="flex-1 overflow-x-auto py-1.5 font-mono text-[0.8125rem] whitespace-nowrap">
              <span className="text-muted-foreground">{command}</span> {url}
            </code>
            <CopyButton value={full} />
          </Tabs.Content>
        );
      })}
    </Tabs.Root>
  );
}
