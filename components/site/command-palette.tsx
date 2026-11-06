"use client";

import { Command } from "cmdk";
import { ArrowRight, Box, FileText, Search } from "lucide-react";
import { docsPages, entriesByCategory } from "@/lib/catalog";

const groups = entriesByCategory();

export function CommandPalette({ onSelect }: { onSelect: (href: string) => void }) {
  return (
    <Command label="Search components and docs" loop filter={filter}>
      <div className="flex items-center gap-2 px-3">
        <Search className="size-4 text-muted-foreground" aria-hidden="true" />
        <Command.Input
          autoFocus
          placeholder="Search components and docs…"
          className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <kbd className="rounded-full bg-surface-raised px-2 font-mono text-[0.6875rem] leading-5 text-muted-foreground">
          esc
        </kbd>
      </div>
      <Command.List className="max-h-[min(60vh,420px)] scroll-py-2 overflow-y-auto rounded-2xl bg-surface-inset p-2">
        <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
          No results.
        </Command.Empty>
        <Command.Group heading="Docs" className={groupClass}>
          {docsPages.map((page) => (
            <Command.Item
              key={page.href}
              value={page.name}
              onSelect={() => onSelect(page.href)}
              className={itemClass}
            >
              <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
              {page.name}
            </Command.Item>
          ))}
        </Command.Group>
        {groups.map((group) => (
          <Command.Group key={group.id} heading={group.name} className={groupClass}>
            {group.entries.map((entry) => (
              <Command.Item
                key={entry.slug}
                value={entry.name}
                keywords={[entry.description, group.name]}
                onSelect={() => onSelect(`/components/${entry.slug}`)}
                className={itemClass}
              >
                <Box className="size-4 text-muted-foreground" aria-hidden="true" />
                <span className="flex-1 truncate">{entry.name}</span>
                <ArrowRight
                  className="size-3.5 text-muted-foreground opacity-0 group-data-[selected=true]:opacity-100"
                  aria-hidden="true"
                />
              </Command.Item>
            ))}
          </Command.Group>
        ))}
      </Command.List>
    </Command>
  );
}

// Substring match instead of cmdk's fuzzy scoring — fuzzy matches every long description.
function filter(value: string, search: string, keywords: string[] = []) {
  const query = search.trim().toLowerCase();
  if (value.toLowerCase().includes(query)) return 1;
  return keywords.some((keyword) => keyword.toLowerCase().includes(query)) ? 0.5 : 0;
}

const groupClass =
  "[&_[cmdk-group-heading]]:text-[0.75rem] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1";
const itemClass =
  "group flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm data-[selected=true]:bg-foreground/[0.06]";
