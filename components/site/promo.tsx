import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const link = (campaign: string) =>
  `https://usetuff.com/?utm_source=tuffui&utm_medium=site&utm_campaign=${campaign}`;

/** A quiet card for Tuff, the maker's other product. */
export function Promo({
  className,
  campaign = "sidebar",
}: {
  className?: string;
  campaign?: string;
}) {
  return (
    <a
      href={link(campaign)}
      target="_blank"
      rel="noopener"
      className={`group block rounded-2xl bg-surface p-1.5 text-sm transition-[background-color,scale] duration-150 ease-ui-out active:scale-[0.98] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[color-mix(in_oklab,var(--surface),var(--foreground)_5%)] ${className ?? ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static export, no optimizer */}
      <img
        src="/promo/tuff-app.webp"
        alt="Tuff task board with Todo, In Progress and Done columns"
        width={880}
        height={355}
        loading="lazy"
        className="block aspect-[880/355] w-full rounded-xl bg-surface-inset object-cover object-left-top"
      />
      <span className="block px-2 pt-2.5 pb-1.5">
        <span className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
          <img
            src="/promo/tuff-icon.png"
            alt=""
            width={20}
            height={20}
            className="size-5 rounded-md"
          />
          <span className="font-medium">Tuff</span>
          <ArrowUpRight
            className="ml-auto size-3.5 text-muted-foreground transition-transform duration-150 ease-ui-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </span>
        <span className="mt-1.5 block text-[0.8125rem] leading-snug text-muted-foreground">
          Tasks, docs and chat for teams and their AI agents, with GitHub integration. One
          flat price, not per seat.
        </span>
        <span className="mt-2 block text-[0.6875rem] text-muted-foreground/80">
          From the maker of TUFFUI
        </span>
      </span>
    </a>
  );
}

/** One-row Tuff link for small screens, where the full card has no room. */
export function PromoCompact({
  className,
  campaign = "mobile",
}: {
  className?: string;
  campaign?: string;
}) {
  return (
    <a
      href={link(campaign)}
      target="_blank"
      rel="noopener"
      className={cn(
        "group flex items-center gap-3 rounded-2xl bg-surface-inset p-2.5 pr-3.5 transition-[background-color,scale] duration-150 ease-ui-out active:scale-[0.98] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[color-mix(in_oklab,var(--surface-inset),var(--foreground)_5%)]",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
      <img
        src="/promo/tuff-icon.png"
        alt=""
        width={32}
        height={32}
        className="size-8 shrink-0 rounded-lg"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">Tuff</span>
        <span className="block text-xs leading-snug text-pretty text-muted-foreground">
          Tasks, docs and chat for teams and AI agents
        </span>
      </span>
      <ArrowUpRight
        className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 ease-ui-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        aria-hidden="true"
      />
    </a>
  );
}
