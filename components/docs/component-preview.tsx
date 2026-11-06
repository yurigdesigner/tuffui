"use client";

import { RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { Tabs } from "radix-ui";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Demo } from "./demo";
import { loadSource, SourceCode } from "./source-code";

export function ComponentPreview({
  slug,
  variants,
  className,
}: {
  slug: string;
  variants: string[];
  className?: string;
}) {
  const [variant, setVariant] = useState(variants[0]);
  const [run, setRun] = useState(0);

  return (
    <Tabs.Root
      defaultValue="preview"
      className={cn(
        "flex flex-col gap-1.5 rounded-[1.375rem] bg-surface p-1.5",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 p-0.5">
        <Tabs.List
          aria-label="Preview or code"
          className="inline-flex h-8 items-center rounded-full bg-foreground/[0.05] p-0.5"
        >
          {["preview", "code"].map((value) => (
            <Tabs.Trigger
              key={value}
              value={value}
              onPointerEnter={value === "code" ? () => loadSource(slug) : undefined}
              className="h-full rounded-full px-3.5 text-[0.8125rem] font-medium text-muted-foreground capitalize transition-colors hover:text-foreground data-[state=active]:bg-surface-raised data-[state=active]:text-foreground"
            >
              {value}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <div className="flex items-center gap-2">
          {variants.length > 1 && (
            <div
              role="radiogroup"
              aria-label="Variant"
              className="inline-flex h-8 items-center rounded-full bg-foreground/[0.05] p-0.5"
            >
              {variants.map((name) => (
                <button
                  key={name}
                  type="button"
                  role="radio"
                  aria-checked={variant === name}
                  onClick={() => {
                    setVariant(name);
                    setRun((n) => n + 1);
                  }}
                  className="relative h-full rounded-full px-3 text-[0.8125rem] text-muted-foreground transition-colors hover:text-foreground aria-checked:text-foreground"
                >
                  {variant === name && (
                    <motion.span
                      layoutId={`${slug}-variant`}
                      transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                      className="absolute inset-0 rounded-full bg-surface-raised"
                    />
                  )}
                  <span className="relative">{name}</span>
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setRun((n) => n + 1)}
            className="group inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground/[0.05] px-3 text-[0.8125rem] font-medium text-muted-foreground transition-[color,background-color,scale] duration-150 ease-ui-out hover:bg-foreground/[0.08] hover:text-foreground active:scale-[0.97]"
          >
            <motion.span
              key={run}
              initial={{ rotate: run ? -360 : 0 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="inline-flex"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
            </motion.span>
            Replay
          </button>
        </div>
      </div>
      <Tabs.Content value="preview" forceMount className="data-[state=inactive]:hidden">
        <div className="relative isolate flex min-h-[480px] items-center justify-center overflow-hidden rounded-2xl bg-surface-inset px-4 py-12 sm:px-10 sm:py-16">
          <div className="flex w-full justify-center">
            <Demo key={`${variant}-${run}`} slug={slug} variant={variant} />
          </div>
        </div>
      </Tabs.Content>
      <Tabs.Content value="code">
        <SourceCode slug={slug} title={`components/ui/${slug}.tsx`} />
      </Tabs.Content>
    </Tabs.Root>
  );
}
