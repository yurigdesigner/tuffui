"use client";

import { useSyncExternalStore } from "react";
import { Demo } from "./demo";

const subscribe = (onChange: () => void) => {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
};

/**
 * Full-viewport host for a screen demo. `?variant=<name>` picks a variant; it's
 * read after hydration (the page is a static export), so the prerender shows
 * the default one.
 */
export function ScreenHost({ slug, variants }: { slug: string; variants: string[] }) {
  const requested = useSyncExternalStore(
    subscribe,
    () => new URLSearchParams(window.location.search).get("variant"),
    () => null,
  );
  const variant = requested && variants.includes(requested) ? requested : variants[0];

  return (
    <main id="content" className="h-dvh w-full overflow-hidden bg-background">
      <Demo key={variant} slug={slug} variant={variant} />
    </main>
  );
}
