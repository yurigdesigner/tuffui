"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Promo } from "./promo";

/**
 * The Tuff card pinned to the bottom-right corner of the home page. It shows
 * after a short pause on every visit; closing hides it until the next one.
 */
export function PromoCorner() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setShown(true), 1200);
    return () => clearTimeout(id);
  }, []);

  if (!shown) return null;

  return (
    <aside
      aria-label="From the maker of TUFFUI"
      className="fixed right-4 bottom-4 z-40 hidden w-64 rounded-[1.375rem] bg-background/80 p-1 backdrop-blur-xl transition-[opacity,translate] duration-300 ease-ui-out motion-reduce:transition-none sm:block starting:translate-y-3 starting:opacity-0"
    >
      <Promo campaign="corner" />
      <button
        type="button"
        onClick={() => setShown(false)}
        aria-label="Close"
        className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-full bg-background/70 text-muted-foreground backdrop-blur transition-[color,background-color,scale] duration-150 ease-ui-out hover:bg-background hover:text-foreground active:scale-[0.94]"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </aside>
  );
}
