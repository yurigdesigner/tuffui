"use client";

import { RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { Direction, Tabs } from "radix-ui";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Demo, type DemoLocale } from "./demo";
import { loadSource, SourceCode } from "./source-code";

export function ComponentPreview({
  slug,
  variants,
  rtl = false,
  className,
}: {
  slug: string;
  variants: string[];
  /** Shows an LTR/RTL switch for components that support right-to-left. */
  rtl?: boolean;
  className?: string;
}) {
  const [variant, setVariant] = useState(variants[0]);
  const [locale, setLocale] = useState<DemoLocale>("en");
  const dir = locale === "en" ? "ltr" : "rtl";
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
          {rtl && (
            <Switch
              id={`${slug}-locale`}
              label="Language"
              options={["en", "he", "ar"]}
              value={locale}
              onChange={(next) => {
                setLocale(next as DemoLocale);
                setRun((n) => n + 1);
              }}
              uppercase
            />
          )}
          {variants.length > 1 && (
            <Switch
              id={`${slug}-variant`}
              label="Variant"
              options={variants}
              value={variant}
              onChange={(name) => {
                setVariant(name);
                setRun((n) => n + 1);
              }}
            />
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
          <Direction.Provider dir={dir}>
            <div dir={dir} lang={locale} className="flex w-full justify-center">
              <Demo
                key={`${variant}-${run}`}
                slug={slug}
                variant={variant}
                locale={locale}
              />
            </div>
          </Direction.Provider>
        </div>
      </Tabs.Content>
      <Tabs.Content value="code">
        <SourceCode slug={slug} title={`components/ui/${slug}.tsx`} />
      </Tabs.Content>
    </Tabs.Root>
  );
}

/** Pill radio group with a sliding highlight. */
function Switch({
  id,
  label,
  options,
  value,
  onChange,
  uppercase = false,
}: {
  id: string;
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  uppercase?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex h-8 items-center rounded-full bg-foreground/[0.05] p-0.5"
    >
      {options.map((name) => (
        <button
          key={name}
          type="button"
          role="radio"
          aria-checked={value === name}
          onClick={() => onChange(name)}
          className={cn(
            "relative h-full rounded-full px-3 text-[0.8125rem] text-muted-foreground transition-colors hover:text-foreground aria-checked:text-foreground",
            uppercase && "uppercase",
          )}
        >
          {value === name && (
            <motion.span
              layoutId={id}
              transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              className="absolute inset-0 rounded-full bg-surface-raised"
            />
          )}
          <span className="relative">{name}</span>
        </button>
      ))}
    </div>
  );
}
