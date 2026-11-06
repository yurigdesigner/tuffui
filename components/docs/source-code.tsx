"use client";

import { useEffect, useState } from "react";
import { CopyButton } from "./copy-button";

type Source = { code: string; html: string };

const cache = new Map<string, Promise<Source>>();

/** Starts the request early (e.g. on tab hover) and dedupes repeat calls. */
export function loadSource(slug: string) {
  let request = cache.get(slug);
  if (!request) {
    request = fetch(`/source/${slug}`).then((res) => res.json());
    cache.set(slug, request);
  }
  return request;
}

export function SourceCode({ slug, title }: { slug: string; title: string }) {
  const [source, setSource] = useState<Source>();

  useEffect(() => {
    let live = true;
    loadSource(slug).then((s) => live && setSource(s));
    return () => {
      live = false;
    };
  }, [slug]);

  return (
    <div className="relative">
      <div className="flex h-9 items-center pr-9 pl-3 font-mono text-xs text-muted-foreground">
        {title}
      </div>
      {source && (
        <CopyButton value={source.code} className="absolute top-2.5 right-2.5" />
      )}
      {source ? (
        <div
          className="code max-h-[560px] overflow-auto rounded-2xl bg-surface-inset"
          dangerouslySetInnerHTML={{ __html: source.html }}
        />
      ) : (
        <div
          aria-busy="true"
          className="flex flex-col gap-2.5 rounded-2xl bg-surface-inset p-5"
        >
          <span className="sr-only">Loading source…</span>
          {[72, 54, 88, 40, 66, 80, 48].map((w, i) => (
            <span
              key={i}
              className="h-3 animate-pulse rounded-full bg-foreground/[0.06]"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
