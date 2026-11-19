"use client";

import { Direction } from "radix-ui";
import { useSyncExternalStore } from "react";
import { Demo, type DemoLocale } from "./demo";

const subscribe = (onChange: () => void) => {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
};

/**
 * Full-viewport host for a screen demo. `?variant=<name>` picks a variant and
 * `?locale=he|ar` a right-to-left language; both are read after hydration (the
 * page is a static export), so the prerender shows the defaults.
 */
export function ScreenHost({ slug, variants }: { slug: string; variants: string[] }) {
  const requested = useSyncExternalStore(
    subscribe,
    () => new URLSearchParams(window.location.search).get("variant"),
    () => null,
  );
  const variant = requested && variants.includes(requested) ? requested : variants[0];
  const requestedLocale = useSyncExternalStore(
    subscribe,
    () => new URLSearchParams(window.location.search).get("locale"),
    () => null,
  );
  const locale: DemoLocale =
    requestedLocale === "he" || requestedLocale === "ar" ? requestedLocale : "en";
  const dir = locale === "en" ? "ltr" : "rtl";

  return (
    <Direction.Provider dir={dir}>
      <main
        id="content"
        dir={dir}
        lang={locale}
        className="h-dvh w-full overflow-hidden bg-background"
      >
        <Demo
          key={`${variant}-${locale}`}
          slug={slug}
          variant={variant}
          locale={locale}
        />
      </main>
    </Direction.Provider>
  );
}
