"use client";

import Link from "next/link";
import { useState } from "react";
import type { CatalogEntry } from "@/lib/catalog";
import { getCategory, isScreen } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { ComponentThumbnail } from "./component-thumbnail";

export function ComponentCard({ entry, fresh }: { entry: CatalogEntry; fresh?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const screen = isScreen(entry);

  return (
    <Link
      href={`/components/${entry.slug}`}
      // Preview plays on mouse hover and keyboard focus only. On touch, swapping
      // the thumbnail on tap makes iOS treat the tap as a hover and drop the click.
      onPointerEnter={(e) => e.pointerType === "mouse" && setPlaying(true)}
      onPointerLeave={() => setPlaying(false)}
      onFocus={(e) => e.currentTarget.matches(":focus-visible") && setPlaying(true)}
      onBlur={() => setPlaying(false)}
      className={cn(
        "group flex stagger-in flex-col rounded-[1.375rem] bg-surface p-1.5 transition-[background-color,scale] duration-200 ease-ui-out active:scale-[0.99] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[color-mix(in_oklab,var(--surface),var(--foreground)_5%)]",
        // Screens get two columns wherever the grid has them.
        screen && "sm:col-span-2",
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-surface-inset">
        <ComponentThumbnail
          slug={entry.slug}
          variant={entry.variants[0]}
          playing={playing}
          screen={screen}
        />
      </div>
      <div className="flex flex-col gap-1 px-3 pt-3 pb-2.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex min-w-0 items-center gap-2 font-medium">
            <span className="truncate">{entry.name}</span>
            {fresh && (
              <span className="shrink-0 rounded-full bg-brand/15 px-2 py-0.5 text-[0.6875rem] leading-none font-medium text-brand">
                New
              </span>
            )}
          </h3>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {screen ? "Screen" : `${entry.variants.length} ${entry.variants.length === 1 ? "variant" : "variants"}`}
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{entry.description}</p>
        <p className="mt-1.5 text-[0.8125rem] text-muted-foreground/80">
          {getCategory(entry.category).name}
        </p>
      </div>
    </Link>
  );
}
