// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import { ArrowUpRight, BookOpenText } from "@phosphor-icons/react";
import { MotionConfig, motion } from "motion/react";
import { Fragment, createContext, useContext, useEffect, useRef, useState } from "react";
import { Tag } from "@/components/ui/status-pill";
import { Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { Tooltip } from "@/components/ui/tooltip-hint";
import { enter } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type Source = {
  id: string;
  title: string;
  url: string;
  snippet?: string;
  /** Display date, e.g. "Mar 2026". */
  date?: string;
};

export type SourceListData = {
  sources: Source[];
  /**
   * Answer text with citation markers like `[1]` or `[1,3]` (1-based, in
   * `sources` order). Used by the footnotes variant.
   */
  text?: string;
  /** Claims in the answer and the sources behind each, for the panel variant. */
  claims?: { id: string; text: string; sourceIds: string[] }[];
};

export type SourceListProps = {
  data: SourceListData;
  variant?: "footnotes" | "panel";
  onOpen?: (source: Source) => void;
  /** UI strings, for translating. */
  labels?: Partial<SourceListLabels>;
  className?: string;
};

export type SourceListLabels = {
  sources: string;
  /** Screen-reader name of a citation marker. */
  source: (n: number, title: string) => string;
  /** Panel title. */
  count: (sources: number) => string;
  /** Panel subtitle. */
  summary: (sites: number, claims: number) => string;
  /** Read before the claims a source backs. */
  supports: string;
  opensInNewTab: string;
};

const defaultLabels: SourceListLabels = {
  sources: "Sources",
  source: (n, title) => `Source ${n}: ${title}`,
  count: (sources) => `${sources} sources`,
  summary: (sites, claims) =>
    `${sites} site${sites === 1 ? "" : "s"} · ${claims} claim${claims === 1 ? "" : "s"} cited`,
  supports: "Supports:",
  opensInNewTab: "Opens in a new tab",
};

const Labels = createContext(defaultLabels);

export const domainOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

function Favicon({ url, className }: { url: string; className?: string }) {
  const domain = domainOf(url);
  // A letter tile tinted from the domain keeps sources apart without loading favicons.
  const hue = [...domain].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 360, 0);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-md text-[0.625rem] font-semibold text-white uppercase",
        className,
      )}
      style={{ background: `oklch(0.62 0.12 ${hue})` }}
    >
      {domain[0]}
    </span>
  );
}

function Preview({ source, index }: { source: Source; index: number }) {
  return (
    <span className="flex w-60 flex-col gap-1 py-0.5 text-start">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Favicon url={source.url} className="size-4 text-[0.5625rem]" />
        <span className="truncate">{domainOf(source.url)}</span>
        {source.date && <span className="ms-auto shrink-0">{source.date}</span>}
      </span>
      <span className="font-medium text-foreground">
        {index + 1}. {source.title}
      </span>
      {source.snippet && (
        <span className="line-clamp-3 text-muted-foreground">{source.snippet}</span>
      )}
    </span>
  );
}

function Footnotes({
  data,
  onOpen,
}: {
  data: SourceListData;
  onOpen?: (s: Source) => void;
}) {
  const { sources, text = "" } = data;
  const labels = useContext(Labels);
  const [flash, setFlash] = useState<number | null>(null);
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const jump = (n: number) => {
    refs.current[n]?.focus({ preventScroll: false });
    setFlash(n);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFlash(null), 1200);
  };

  const parts = text.split(/(\[\d+(?:,\s*\d+)*\])/g);

  return (
    <div className="@container flex flex-col gap-4">
      <p className="text-[0.9375rem] leading-7">
        {parts.map((part, i) => {
          const match = part.match(/^\[(.+)\]$/);
          if (!match) return <Fragment key={i}>{part}</Fragment>;
          const numbers = match[1].split(",").map((n) => Number(n.trim()) - 1);
          return (
            <span key={i} className="mx-0.5 inline-flex gap-0.5 align-[0.1em]">
              {numbers.map((n) =>
                sources[n] ? (
                  <Tooltip
                    key={n}
                    side="bottom"
                    content={<Preview source={sources[n]} index={n} />}
                  >
                    <button
                      type="button"
                      onClick={() => jump(n)}
                      aria-label={labels.source(n + 1, sources[n].title)}
                      className="h-[1.15rem] min-w-[1.15rem] rounded-md bg-brand/15 px-1 font-mono text-[0.6875rem] leading-[1.15rem] font-medium text-brand transition-[background-color,scale] duration-150 ease-out hover:bg-brand/25 active:scale-[0.95]"
                    >
                      {n + 1}
                    </button>
                  </Tooltip>
                ) : null,
              )}
            </span>
          );
        })}
      </p>
      <ol aria-label={labels.sources} className="flex flex-col gap-0.5">
        {sources.map((s, n) => (
          <li key={s.id}>
            <a
              ref={(el) => {
                refs.current[n] = el;
              }}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => onOpen?.(s)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-[0.8125rem] transition-colors duration-200 hover:bg-foreground/[0.04]",
                flash === n && "bg-brand/10",
              )}
            >
              <span className="w-4 text-end font-mono text-xs text-muted-foreground">
                {n + 1}
              </span>
              <Favicon url={s.url} />
              <span className="min-w-0 flex-1 truncate">{s.title}</span>
              <span className="hidden shrink-0 text-xs text-muted-foreground @sm:inline">
                {domainOf(s.url)}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SourcePanel({
  data,
  onOpen,
}: {
  data: SourceListData;
  onOpen?: (s: Source) => void;
}) {
  const { sources, claims = [] } = data;
  const groups = Object.entries(
    sources.reduce<Record<string, Source[]>>((acc, s) => {
      (acc[domainOf(s.url)] ??= []).push(s);
      return acc;
    }, {}),
  ).sort((a, b) => b[1].length - a[1].length);
  const domains = groups.length;
  const labels = useContext(Labels);

  return (
    <Shell aria-label={labels.sources}>
      <ShellHeader
        icon={BookOpenText}
        title={labels.count(sources.length)}
        subtitle={labels.summary(domains, claims.length)}
      />
      <Panel className="flex flex-col gap-3 p-1.5">
        {groups.map(([domain, items], g) => (
          <motion.section
            key={domain}
            aria-label={domain}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { ...enter, delay: g * 0.04 } }}
          >
            <h4 className="flex items-center gap-2 px-2.5 pt-1.5 pb-1 text-xs text-muted-foreground">
              <Favicon url={items[0].url} className="size-4 text-[0.5625rem]" />
              {domain}
              <span className="font-mono">· {items.length}</span>
            </h4>
            <ul className="flex flex-col">
              {items.map((s) => {
                const n = sources.indexOf(s);
                const cited = claims.filter((c) => c.sourceIds.includes(s.id));
                return (
                  <li key={s.id}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => onOpen?.(s)}
                      className="group flex gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-foreground/[0.03]"
                    >
                      <span className="w-4 pt-0.5 text-end font-mono text-xs text-muted-foreground">
                        {n + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-2">
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            {s.title}
                          </span>
                          {s.date && (
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {s.date}
                            </span>
                          )}
                        </span>
                        {s.snippet && (
                          <span className="mt-0.5 line-clamp-2 block text-[0.8125rem] text-muted-foreground">
                            {s.snippet}
                          </span>
                        )}
                        {cited.length > 0 && (
                          <span className="mt-2 flex flex-wrap gap-1">
                            <span className="sr-only">{labels.supports}</span>
                            {cited.map((c) => (
                              <Tag key={c.id} className="max-w-full truncate font-sans">
                                {c.text}
                              </Tag>
                            ))}
                          </span>
                        )}
                      </span>
                      <ArrowUpRight
                        weight="bold"
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-[translate,color] duration-150 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                        aria-label={labels.opensInNewTab}
                      />
                    </a>
                  </li>
                );
              })}
            </ul>
          </motion.section>
        ))}
      </Panel>
    </Shell>
  );
}

export function SourceList({
  data,
  variant = "footnotes",
  onOpen,
  labels,
  className,
}: SourceListProps) {
  return (
    <Labels.Provider value={{ ...defaultLabels, ...labels }}>
      <MotionConfig reducedMotion="user">
        <div className={cn("w-full max-w-xl", className)}>
          {variant === "panel" ? (
            <SourcePanel data={data} onOpen={onOpen} />
          ) : (
            <Footnotes data={data} onOpen={onOpen} />
          )}
        </div>
      </MotionConfig>
    </Labels.Provider>
  );
}
