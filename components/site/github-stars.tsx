"use client";

import { useEffect, useState } from "react";
import { starsApi } from "@/lib/github-stars";

const cacheKey = "tuffui:stars";
const maxAge = 60 * 60 * 1000;

const format = (n: number) =>
  n < 1000 ? String(n) : `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "")}k`;

// One request per tab, shared by every counter on the page, cached for an hour.
let live: Promise<number | null> | undefined;
function liveStars() {
  live ??= (async () => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(cacheKey) ?? "null");
      if (saved && Date.now() - saved.at < maxAge) return saved.stars as number;
    } catch {}
    try {
      const res = await fetch(starsApi);
      const count = res.ok ? (await res.json()).stargazers_count : null;
      if (typeof count !== "number") return null;
      try {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ stars: count, at: Date.now() }),
        );
      } catch {}
      return count;
    } catch {
      return null;
    }
  })();
  return live;
}

/** The repo's star count: the build-time value first, then a live one. */
export function GitHubStars({
  initial,
  className,
}: {
  initial: number | null;
  className?: string;
}) {
  const [stars, setStars] = useState(initial);

  useEffect(() => {
    let active = true;
    liveStars().then((count) => active && count !== null && setStars(count));
    return () => {
      active = false;
    };
  }, []);

  if (stars === null) return null;
  return (
    <span className={className} aria-label={`${stars} stars`}>
      {format(stars)}
    </span>
  );
}
