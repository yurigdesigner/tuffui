// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import {
  ArrowSquareOut,
  CaretLeft,
  CaretRight,
  Check,
  ClockCounterClockwise,
  Copy,
  DownloadSimple,
  FileCode,
  type Icon,
} from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useRef, useState } from "react";
import { Button, IconButton } from "@/components/ui/action-button";
import { RollingNumber } from "@/components/ui/rolling-number";
import { Segmented } from "@/components/ui/segmented-control";
import { StatusPill, Tag } from "@/components/ui/status-pill";
import { Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { EASE_OUT, exit, instant } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type ArtifactVersion = {
  id: string;
  /** Short name, e.g. "v3". */
  label: string;
  createdAt: string;
  /** What changed in this version. */
  note: string;
  preview: React.ReactNode;
  source: string;
  /** File name for downloads, e.g. "hero.tsx". */
  filename?: string;
};

export type ArtifactTab = "preview" | "source";

export type ArtifactPanelProps = {
  data: { title: string; kind: string; versions: ArtifactVersion[] };
  icon?: Icon;
  /** `preview` is the canvas; `versions` adds the history list. */
  view?: "preview" | "versions";
  versionId?: string;
  onVersionChange?: (version: ArtifactVersion) => void;
  tab?: ArtifactTab;
  onTabChange?: (tab: ArtifactTab) => void;
  onRestore?: (version: ArtifactVersion) => void;
  onCopy?: (source: string) => void;
  /** Defaults to downloading `source` as `filename`. */
  onDownload?: (version: ArtifactVersion) => void;
  onOpen?: (version: ArtifactVersion) => void;
  /** UI strings, for translating the panel. */
  labels?: Partial<ArtifactPanelLabels>;
  className?: string;
};

export type ArtifactPanelLabels = {
  version: string;
  previousVersion: string;
  nextVersion: string;
  /** Between the version label and the total, as in "v2 of 3". */
  of: string;
  view: string;
  preview: string;
  source: string;
  copySource: string;
  copied: string;
  download: string;
  open: string;
  versions: string;
  current: string;
  /** Shown under an older version. */
  viewing: (label: string, current: string) => string;
  restore: string;
  sourceCopied: string;
  /** Screen-reader status after moving between versions or tabs. */
  status: (label: string, tab: ArtifactTab) => string;
};

const defaultLabels: ArtifactPanelLabels = {
  version: "Version",
  previousVersion: "Previous version",
  nextVersion: "Next version",
  of: "of",
  view: "View",
  preview: "Preview",
  source: "Source",
  copySource: "Copy source",
  copied: "Copied",
  download: "Download",
  open: "Open in new tab",
  versions: "Versions",
  current: "Current",
  viewing: (label, current) => `Viewing ${label} · current is ${current}`,
  restore: "Restore this version",
  sourceCopied: "Source copied",
  status: (label, tab) => `${label}, ${tab}`,
};

export function ArtifactPanel({
  data,
  icon = FileCode,
  view = "preview",
  versionId,
  onVersionChange,
  tab: tabProp,
  onTabChange,
  onRestore,
  onCopy,
  onDownload,
  onOpen,
  labels: labelOverrides,
  className,
}: ArtifactPanelProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const canvasRef = useRef<HTMLDivElement>(null);
  const { versions } = data;
  const latest = versions.length - 1;
  const [innerIndex, setInnerIndex] = useState(latest);
  const index = Math.max(
    versionId ? versions.findIndex((v) => v.id === versionId) : innerIndex,
    0,
  );
  const version = versions[index];
  const [innerTab, setInnerTab] = useState<ArtifactTab>("preview");
  const tab = tabProp ?? innerTab;
  const [direction, setDirection] = useState(0);
  const [keyboard, setKeyboard] = useState(false);
  const [copied, setCopied] = useState(false);

  const go = (next: number, fromKeyboard = false) => {
    const clamped = Math.min(Math.max(next, 0), latest);
    if (clamped === index) return;
    // Slides follow reading order: newer versions enter from the end side.
    const rtl =
      canvasRef.current && getComputedStyle(canvasRef.current).direction === "rtl";
    setDirection((clamped > index ? 1 : -1) * (rtl ? -1 : 1));
    setKeyboard(fromKeyboard);
    setInnerIndex(clamped);
    onVersionChange?.(versions[clamped]);
  };

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(version.source);
    } catch {}
    onCopy?.(version.source);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    if (onDownload) return onDownload(version);
    const url = URL.createObjectURL(new Blob([version.source], { type: "text/plain" }));
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: version.filename ?? `${data.title}.txt`,
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  const canvas = (
    <div ref={canvasRef} className="relative min-h-64 overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.div
          key={`${version.id}-${tab}`}
          custom={direction}
          initial={{ opacity: 0, x: direction * 16 }}
          animate={{
            opacity: 1,
            x: 0,
            transition: keyboard ? instant : { duration: 0.24, ease: EASE_OUT },
          }}
          exit={{ opacity: 0, x: direction * -16, transition: keyboard ? instant : exit }}
          className="h-full"
        >
          {tab === "preview" ? (
            <div className="flex min-h-64 items-center justify-center p-5">
              {version.preview}
            </div>
          ) : (
            <pre
              dir="ltr"
              className="max-h-80 overflow-x-hidden overflow-y-auto py-3 font-mono text-xs leading-5"
            >
              {version.source.split("\n").map((line, i) => (
                <div key={i} className="flex">
                  <span
                    aria-hidden="true"
                    className="w-10 shrink-0 pe-3 text-end text-muted-foreground/60 select-none"
                  >
                    {i + 1}
                  </span>
                  <code className="min-w-0 pe-4 [overflow-wrap:anywhere] whitespace-pre-wrap">
                    {line}
                  </code>
                </div>
              ))}
            </pre>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <Shell aria-label={data.title} className={cn("max-w-2xl", className)}>
        <ShellHeader
          icon={icon}
          title={data.title}
          subtitle={
            <>
              <Tag className="me-1.5">{data.kind}</Tag>
              {version.createdAt}
            </>
          }
          aside={
            <div
              role="group"
              aria-label={labels.version}
              className="flex items-center gap-0.5"
              onKeyDown={(e) => {
                const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
                const step = { ArrowLeft: rtl ? 1 : -1, ArrowRight: rtl ? -1 : 1 }[e.key];
                if (step) {
                  e.preventDefault();
                  go(index + step, true);
                }
              }}
            >
              <IconButton
                icon={CaretLeft}
                iconWeight="bold"
                label={labels.previousVersion}
                className="rtl:[&_svg]:-scale-x-100"
                disabled={index === 0}
                onClick={(e) => go(index - 1, e.detail === 0)}
              />
              <span className="min-w-14 text-center font-mono text-xs text-muted-foreground tabular-nums">
                <RollingNumber value={version.label} /> {labels.of} {versions.length}
              </span>
              <IconButton
                icon={CaretRight}
                iconWeight="bold"
                label={labels.nextVersion}
                className="rtl:[&_svg]:-scale-x-100"
                disabled={index === latest}
                onClick={(e) => go(index + 1, e.detail === 0)}
              />
            </div>
          }
        />
        <div className="flex items-center justify-between gap-2 px-1.5 pb-2">
          <Segmented
            label={labels.view}
            size="sm"
            value={tab}
            onValueChange={(t) => {
              setInnerTab(t);
              onTabChange?.(t);
            }}
            options={[
              { value: "preview", label: labels.preview },
              { value: "source", label: labels.source },
            ]}
          />
          <div className="flex items-center gap-0.5">
            <IconButton
              icon={copied ? Check : Copy}
              iconWeight={copied ? "bold" : "fill"}
              label={labels.copySource}
              tooltip={copied ? labels.copied : true}
              onClick={copy}
            />
            <IconButton
              icon={DownloadSimple}
              label={labels.download}
              tooltip
              onClick={download}
            />
            {onOpen && (
              <IconButton
                icon={ArrowSquareOut}
                label={labels.open}
                tooltip
                tooltipAlign="end"
                onClick={() => onOpen(version)}
              />
            )}
          </div>
        </div>
        {view === "versions" ? (
          <div className="grid gap-1.5 @2xl:grid-cols-[13rem_1fr]">
            <Panel className="p-1.5">
              <ul aria-label={labels.versions} className="flex flex-col gap-0.5">
                {[...versions].reverse().map((v) => {
                  const i = versions.indexOf(v);
                  const active = i === index;
                  return (
                    <li key={v.id}>
                      <button
                        type="button"
                        aria-current={active ? "true" : undefined}
                        onClick={(e) => go(i, e.detail === 0)}
                        className={cn(
                          "w-full rounded-xl px-3 py-2 text-start transition-[background-color,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]",
                          active ? "bg-foreground/[0.07]" : "hover:bg-foreground/[0.04]",
                        )}
                      >
                        <span className="flex items-center gap-2 text-[0.8125rem] font-medium">
                          {v.label}
                          {i === latest && (
                            <StatusPill size="sm" tone="positive">
                              {labels.current}
                            </StatusPill>
                          )}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                          {v.note}
                        </span>
                        <span className="mt-0.5 block text-[0.6875rem] text-muted-foreground/80">
                          {v.createdAt}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Panel>
            <Panel className="flex flex-col">
              {canvas}
              {index !== latest && (
                <div className="flex items-center justify-between gap-3 p-2 ps-4">
                  <p className="flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground">
                    <ClockCounterClockwise
                      weight="fill"
                      className="size-3.5"
                      aria-hidden="true"
                    />
                    {labels.viewing(version.label, versions[latest].label)}
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onRestore?.(version)}
                  >
                    {labels.restore}
                  </Button>
                </div>
              )}
            </Panel>
          </div>
        ) : (
          <Panel>{canvas}</Panel>
        )}
        <p role="status" aria-live="polite" className="sr-only">
          {copied ? labels.sourceCopied : labels.status(version.label, tab)}
        </p>
      </Shell>
    </MotionConfig>
  );
}
