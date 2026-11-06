import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Promo } from "./promo";
import { TableOfContents, type TocItem } from "./toc";

type PagerLink = { href: string; name: string };

export function DocsPage({
  eyebrow,
  title,
  description,
  meta,
  toc = [],
  prev,
  next,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  meta?: React.ReactNode;
  toc?: TocItem[];
  prev?: PagerLink;
  next?: PagerLink;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-10 xl:gap-14">
      <article className="min-w-0 flex-1 pb-24">
        <header className="mb-10">
          {eyebrow && <p className="mb-3 label">{eyebrow}</p>}
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-[2.125rem]">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-pretty text-muted-foreground">
            {description}
          </p>
          {meta && <div className="mt-4 flex flex-wrap items-center gap-2">{meta}</div>}
        </header>
        <div className="flex flex-col gap-14">{children}</div>
        {(prev || next) && (
          <nav aria-label="Pagination" className="mt-20 grid gap-3 sm:grid-cols-2">
            {prev ? <Pager link={prev} direction="prev" /> : <span />}
            {next && <Pager link={next} direction="next" />}
          </nav>
        )}
      </article>
      {toc.length > 0 && (
        <aside className="hidden w-52 shrink-0 xl:block">
          <div className="sticky top-24">
            <TableOfContents items={toc} />
            <Promo className="mt-8" />
          </div>
        </aside>
      )}
    </div>
  );
}

export function DocsSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="scroll-mt-24">
      <h2
        id={id}
        className="group mb-4 scroll-mt-24 text-xl font-semibold tracking-tight"
      >
        <a href={`#${id}`} className="outline-offset-4">
          {title}
          <span
            aria-hidden="true"
            className="ml-2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          >
            #
          </span>
        </a>
      </h2>
      {description && (
        <p className="-mt-2 mb-4 text-sm text-muted-foreground">{description}</p>
      )}
      {children}
    </section>
  );
}

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full bg-foreground/[0.05] px-2.5 font-mono text-xs text-muted-foreground tabular-nums",
        className,
      )}
    >
      {children}
    </span>
  );
}

function Pager({ link, direction }: { link: PagerLink; direction: "prev" | "next" }) {
  const isNext = direction === "next";
  return (
    <Link
      href={link.href}
      className={cn(
        "group flex flex-col gap-1 rounded-[1.375rem] bg-surface px-5 py-4 transition-[background-color,scale] duration-200 ease-ui-out active:scale-[0.99] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[color-mix(in_oklab,var(--surface),var(--foreground)_5%)]",
        isNext && "sm:col-start-2 sm:items-end sm:text-right",
      )}
    >
      <span className="flex items-center gap-1 text-[0.8125rem] text-muted-foreground">
        {!isNext && <ArrowLeft className="size-3" aria-hidden="true" />}
        {isNext ? "Next" : "Previous"}
        {isNext && <ArrowRight className="size-3" aria-hidden="true" />}
      </span>
      <span className="font-medium">{link.name}</span>
    </Link>
  );
}

export function Placeholder({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-[1.375rem] bg-surface",
        className,
      )}
    >
      <span className="relative label">{label}</span>
    </div>
  );
}
