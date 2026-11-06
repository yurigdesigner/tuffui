"use client";

import { ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useMemo, useState, useSyncExternalStore } from "react";
import { docsPages, entriesByCategory } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const groups = entriesByCategory();
const storageKey = "sidebar:collapsed";

// Collapsed groups are a per-viewer convenience, so they live in localStorage.
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
// Falls back to memory when storage is blocked, so toggling still works.
let memory = "[]";
const readSaved = () => {
  try {
    return localStorage.getItem(storageKey) ?? memory;
  } catch {
    return memory;
  }
};

function useCollapsed() {
  const raw = useSyncExternalStore(subscribe, readSaved, () => "[]");
  const collapsed = useMemo<string[]>(() => {
    try {
      const saved = JSON.parse(raw);
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }, [raw]);
  const toggle = (title: string) => {
    const next = collapsed.includes(title)
      ? collapsed.filter((t) => t !== title)
      : [...collapsed, title];
    memory = JSON.stringify(next);
    try {
      localStorage.setItem(storageKey, memory);
    } catch {}
    listeners.forEach((listener) => listener());
  };
  return { collapsed, toggle };
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { collapsed, toggle } = useCollapsed();
  // The group holding the current page opens on arrival, but can still be
  // closed; that choice resets on the next navigation.
  const [closedHere, setClosedHere] = useState({ path: pathname, title: "" });
  const closedTitle = closedHere.path === pathname ? closedHere.title : "";
  const sectionProps = (title: string, hrefs: string[]) => {
    const current = hrefs.includes(pathname);
    const open = current ? closedTitle !== title : !collapsed.includes(title);
    return {
      title,
      open,
      onToggle: () => {
        if (current) setClosedHere({ path: pathname, title: open ? title : "" });
        // Remember the choice for later visits, when this is no longer the current group.
        if (collapsed.includes(title) === open) return;
        toggle(title);
      },
    };
  };

  return (
    <nav aria-label="Documentation" className="flex flex-col gap-4 text-sm">
      <NavSection
        {...sectionProps(
          "Getting started",
          docsPages.map((p) => p.href),
        )}
      >
        {docsPages.map((page) => (
          <NavLink
            key={page.href}
            href={page.href}
            active={pathname === page.href}
            onNavigate={onNavigate}
          >
            {page.name}
          </NavLink>
        ))}
      </NavSection>
      {groups.map((group) => (
        <NavSection
          key={group.id}
          {...sectionProps(
            group.name,
            group.entries.map((e) => `/components/${e.slug}`),
          )}
          count={group.entries.length}
        >
          {group.entries.map((entry) => {
            const href = `/components/${entry.slug}`;
            return (
              <NavLink
                key={entry.slug}
                href={href}
                active={pathname === href}
                onNavigate={onNavigate}
                badge={entry.status === "planned" ? "Soon" : undefined}
              >
                {entry.name}
              </NavLink>
            );
          })}
        </NavSection>
      ))}
    </nav>
  );
}

function NavSection({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const id = useId();
  const reduce = useReducedMotion();
  // Toggling from the keyboard is instant; a click gets the height animation.
  const [instant, setInstant] = useState(false);

  return (
    <div>
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={(event) => {
            setInstant(event.detail === 0 || !!reduce);
            onToggle();
          }}
          className="group flex w-full items-center gap-1.5 rounded-lg px-3 py-1 text-[0.75rem] font-medium text-foreground/40 transition-[color,scale] duration-150 ease-ui-out hover:text-foreground/70 active:scale-[0.98]"
        >
          <ChevronRight
            aria-hidden="true"
            className={cn(
              "size-3.5 shrink-0 transition-transform duration-200 ease-ui-out motion-reduce:transition-none",
              open && "rotate-90",
            )}
          />
          <span className="flex-1 text-left">{title}</span>
          {count !== undefined && (
            <span className="font-mono tabular-nums" aria-label={`${count} components`}>
              {count}
            </span>
          )}
        </button>
      </h2>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            id={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0, transition: { duration: instant ? 0 : 0.15 } }}
            transition={
              instant ? { duration: 0 } : { duration: 0.22, ease: [0.23, 1, 0.32, 1] }
            }
            className="mt-0.5 flex flex-col gap-px overflow-hidden"
          >
            {children}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavLink({
  href,
  active,
  badge,
  onNavigate,
  children,
}: {
  href: string;
  active: boolean;
  badge?: string;
  onNavigate?: () => void;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex items-center justify-between rounded-xl px-3 py-1.5 transition-colors",
          active
            ? "bg-surface-raised font-medium text-foreground"
            : "text-foreground/75 hover:bg-foreground/[0.05] hover:text-foreground",
        )}
      >
        <span className="truncate">{children}</span>
        {badge && (
          <span className="rounded-full bg-foreground/[0.06] px-1.5 text-[0.6875rem] leading-4 font-medium text-muted-foreground">
            {badge}
          </span>
        )}
      </Link>
    </li>
  );
}
