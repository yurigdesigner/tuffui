"use client";

import { ArrowUpRight, Monitor, RotateCcw, Smartphone, Tablet } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Tabs } from "radix-ui";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Demo } from "./demo";
import { loadSource, SourceCode } from "./source-code";

/** Design sizes a screen is rendered at before it is scaled to the column. */
export const devices = {
  desktop: { label: "Desktop", width: 1280, height: 800, icon: Monitor },
  tablet: { label: "Tablet", width: 768, height: 960, icon: Tablet },
  mobile: { label: "Mobile", width: 390, height: 780, icon: Smartphone },
} as const;

export type Device = keyof typeof devices;

/**
 * A screen rendered at a real device width inside a browser-like frame, scaled
 * down to the column. Screens lay out with container queries, so every width
 * shows its own layout here exactly as it would full screen.
 */
export function ScreenPreview({
  slug,
  variants,
  className,
}: {
  slug: string;
  variants: string[];
  className?: string;
}) {
  const [variant, setVariant] = useState(variants[0]);
  const [device, setDevice] = useState<Device>("desktop");
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
        <div className="flex flex-wrap items-center gap-2">
          <Pills
            label="Device"
            id={`${slug}-device`}
            value={device}
            onChange={(d) => setDevice(d as Device)}
            options={(Object.keys(devices) as Device[]).map((key) => ({
              value: key,
              label: devices[key].label,
              icon: devices[key].icon,
            }))}
          />
          {variants.length > 1 && (
            <Pills
              label="Variant"
              id={`${slug}-variant`}
              value={variant}
              onChange={(v) => {
                setVariant(v);
                setRun((n) => n + 1);
              }}
              options={variants.map((name) => ({ value: name, label: name }))}
            />
          )}
          <button
            type="button"
            onClick={() => setRun((n) => n + 1)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground/[0.05] px-3 text-[0.8125rem] font-medium text-muted-foreground transition-[color,background-color,scale] duration-150 ease-ui-out hover:bg-foreground/[0.08] hover:text-foreground active:scale-[0.97]"
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
          <Link
            href={
              variant === variants[0]
                ? `/screens/${slug}`
                : `/screens/${slug}?variant=${encodeURIComponent(variant)}`
            }
            target="_blank"
            className="inline-flex h-8 items-center gap-1 rounded-full bg-foreground/[0.05] px-3 text-[0.8125rem] font-medium text-muted-foreground transition-[color,background-color,scale] duration-150 ease-ui-out hover:bg-foreground/[0.08] hover:text-foreground active:scale-[0.97]"
          >
            Full screen
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
      <Tabs.Content value="preview" forceMount className="data-[state=inactive]:hidden">
        <DeviceFrame slug={slug} device={device}>
          <Demo key={`${variant}-${run}`} slug={slug} variant={variant} />
        </DeviceFrame>
      </Tabs.Content>
      <Tabs.Content value="code">
        <SourceCode slug={slug} title={`components/${slug}.tsx`} />
      </Tabs.Content>
    </Tabs.Root>
  );
}

function DeviceFrame({
  slug,
  device,
  children,
}: {
  slug: string;
  device: Device;
  children: React.ReactNode;
}) {
  const { width, height } = devices[device];
  const stage = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1, el.clientWidth / width));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div className="flex justify-center rounded-2xl bg-surface-inset p-3 sm:p-5">
      <div
        className="w-full overflow-hidden rounded-[1.125rem] bg-surface"
        style={{ maxWidth: width }}
      >
        <div className="flex h-9 items-center gap-3 px-3.5" aria-hidden="true">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
          </span>
          <span className="mx-auto max-w-72 min-w-0 flex-1 truncate rounded-full bg-foreground/[0.06] px-3 py-0.5 text-center font-mono text-[0.6875rem] text-muted-foreground">
            app.example.com/{slug}
          </span>
          <span className="w-[2.625rem]" />
        </div>
        <div ref={stage} className="relative w-full" style={{ height: height * scale }}>
          <div
            className="absolute top-0 left-0 origin-top-left overflow-hidden bg-background"
            style={{ width, height, transform: `scale(${scale})` }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function Pills({
  label,
  id,
  value,
  onChange,
  options,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; icon?: typeof Monitor }[];
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex h-8 items-center rounded-full bg-foreground/[0.05] p-0.5"
    >
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            aria-label={Icon ? option.label : undefined}
            title={Icon ? option.label : undefined}
            onClick={() => onChange(option.value)}
            className="relative flex h-full items-center rounded-full px-3 text-[0.8125rem] text-muted-foreground transition-colors hover:text-foreground aria-checked:text-foreground"
          >
            {value === option.value && (
              <motion.span
                layoutId={id}
                transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                className="absolute inset-0 rounded-full bg-surface-raised"
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
