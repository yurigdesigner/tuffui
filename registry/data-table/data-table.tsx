// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import {
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUp,
  Check,
  Copy,
  Table,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Button, IconButton } from "@/components/ui/action-button";
import { Checkbox } from "@/components/ui/choice-controls";
import { RollingNumber } from "@/components/ui/rolling-number";
import { Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { SearchField } from "@/components/ui/text-field";
import { enter, exit } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

export type DataRow = { id: string } & Record<string, string | number | null>;

export type DataColumn<R extends DataRow = DataRow> = {
  key: keyof R & string;
  label: string;
  align?: "left" | "right";
  /** Display text for a cell. Sorting and CSV use the raw value. */
  format?: (value: R[keyof R], row: R) => React.ReactNode;
  sortable?: boolean;
  /** Narrow columns don't grow. */
  width?: string;
  /**
   * Which columns survive a narrow table: 1 always shows, 2 hides below a
   * 28rem-wide table, 3 below 36rem. Defaults to 1 for the first two columns,
   * 2 for the next two and 3 after that.
   */
  priority?: 1 | 2 | 3;
};

const hideBelow = {
  1: "",
  2: "hidden @md:table-cell",
  3: "hidden @xl:table-cell",
} as const;
const priorityOf = (c: { priority?: 1 | 2 | 3 }, i: number) =>
  hideBelow[c.priority ?? (i < 2 ? 1 : i < 4 ? 2 : 3)];

export type DataTableProps<R extends DataRow = DataRow> = {
  data: R[];
  columns: DataColumn<R>[];
  title: string;
  subtitle?: string;
  /** Rows per page. */
  pageSize?: number;
  /** Show the filter field above the table. */
  searchable?: boolean;
  selectable?: boolean;
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  /** Bulk actions shown when rows are selected. */
  actions?: (ids: string[]) => React.ReactNode;
  onRowClick?: (row: R) => void;
  /** UI strings, for translating the table. */
  labels?: Partial<DataTableLabels>;
  className?: string;
};

export type DataTableLabels = {
  /** Word after the row count in the header. */
  rows: (count: number) => string;
  copyCsv: string;
  copiedCsv: string;
  filter: string;
  clearFilter: string;
  /** Word after the selected count. */
  selected: (count: number) => string;
  clearSelection: string;
  selectAll: string;
  selectRow: (name: string) => string;
  noMatch: string;
  noMatchDescription: (query: string) => string;
  /** Footer range, e.g. "1–6 of 9". */
  range: (from: number, to: number, total: number) => string;
  previousPage: string;
  nextPage: string;
  /** Screen-reader status after filtering or sorting. */
  status: (
    count: number,
    sort: { key: string; label: string; dir: "asc" | "desc" } | null,
  ) => string;
};

const defaultLabels: DataTableLabels = {
  rows: (count) => (count === 1 ? "row" : "rows"),
  copyCsv: "Copy as CSV",
  copiedCsv: "Copied as CSV",
  filter: "Filter rows",
  clearFilter: "Clear search",
  selected: () => "selected",
  clearSelection: "Clear",
  selectAll: "Select all rows on this page",
  selectRow: (name) => `Select ${name}`,
  noMatch: "No rows match",
  noMatchDescription: (query) => `Nothing matches “${query}”.`,
  range: (from, to, total) => `${from}–${to} of ${total}`,
  previousPage: "Previous page",
  nextPage: "Next page",
  status: (count, sort) =>
    `${count} rows${sort ? `, sorted by ${sort.key} ${sort.dir}ending` : ""}`,
};

type Sort = { key: string; dir: "asc" | "desc" } | null;

const compare = (a: unknown, b: unknown) =>
  typeof a === "number" && typeof b === "number"
    ? a - b
    : String(a ?? "").localeCompare(String(b ?? ""), "en", { numeric: true });

const csvCell = (v: unknown) => {
  const text = String(v ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function DataTable<R extends DataRow>({
  data,
  columns,
  title,
  subtitle,
  pageSize = 6,
  searchable = true,
  selectable = false,
  selected: selectedProp,
  onSelectedChange,
  actions,
  onRowClick,
  labels: labelOverrides,
  className,
}: DataTableProps<R>) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>(null);
  const [page, setPage] = useState(0);
  const [ownSelected, setOwnSelected] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const selected = selectedProp ?? ownSelected;
  const setSelected = (ids: string[]) => {
    setOwnSelected(ids);
    onSelectedChange?.(ids);
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? data.filter((row) =>
          columns.some((c) =>
            String(row[c.key] ?? "")
              .toLowerCase()
              .includes(q),
          ),
        )
      : data;
    if (!sort) return filtered;
    const sign = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => sign * compare(a[sort.key], b[sort.key]));
  }, [data, columns, query, sort]);

  const pages = Math.max(Math.ceil(rows.length / pageSize), 1);
  const current = Math.min(page, pages - 1);
  const visible = rows.slice(current * pageSize, (current + 1) * pageSize);
  const allOnPage = visible.length > 0 && visible.every((r) => selected.includes(r.id));
  const someOnPage = visible.some((r) => selected.includes(r.id));

  const toggleSort = (key: string) => {
    setSort((s) =>
      s?.key !== key
        ? { key, dir: "desc" }
        : s.dir === "desc"
          ? { key, dir: "asc" }
          : null,
    );
    setPage(0);
  };

  const copyCsv = async () => {
    const lines = [
      columns.map((c) => csvCell(c.label)).join(","),
      ...rows.map((row) => columns.map((c) => csvCell(row[c.key])).join(",")),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <MotionConfig reducedMotion="user">
      <Shell className={cn("max-w-2xl", className)}>
        <ShellHeader
          icon={Table}
          title={title}
          subtitle={
            subtitle ?? (
              <>
                <RollingNumber value={rows.length} /> {labels.rows(rows.length)}
              </>
            )
          }
          aside={
            <IconButton
              icon={copied ? Check : Copy}
              iconWeight={copied ? "bold" : "fill"}
              label={copied ? labels.copiedCsv : labels.copyCsv}
              variant="quiet"
              size="sm"
              onClick={copyCsv}
            />
          }
        />
        <Panel className="p-2">
          {searchable && (
            <div className="flex items-center gap-2 p-1 pb-2">
              <SearchField
                className="flex-1"
                placeholder={labels.filter}
                labels={{ clear: labels.clearFilter }}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                onClear={() => setQuery("")}
              />
            </div>
          )}

          <AnimatePresence initial={false}>
            {selectable && selected.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1, transition: enter }}
                exit={{ height: 0, opacity: 0, transition: exit }}
                className="overflow-hidden"
              >
                <div className="mx-1 mb-2 flex items-center gap-2 rounded-xl bg-brand/10 py-1.5 ps-3 pe-1.5 text-[0.8125rem]">
                  <span className="text-brand">
                    <RollingNumber value={selected.length} />{" "}
                    {labels.selected(selected.length)}
                  </span>
                  <Button variant="quiet" size="sm" onClick={() => setSelected([])}>
                    {labels.clearSelection}
                  </Button>
                  <span className="ms-auto flex gap-1.5">{actions?.(selected)}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="overflow-hidden">
            <table className="w-full border-separate border-spacing-0 text-[0.8125rem]">
              <caption className="sr-only">{title}</caption>
              <thead>
                <tr className="text-muted-foreground">
                  {selectable && (
                    <th scope="col" className="w-9 px-2 py-2">
                      <Checkbox
                        aria-label={labels.selectAll}
                        checked={allOnPage ? true : someOnPage ? "mixed" : false}
                        onCheckedChange={() =>
                          setSelected(
                            allOnPage
                              ? selected.filter((id) => !visible.some((r) => r.id === id))
                              : [...new Set([...selected, ...visible.map((r) => r.id)])],
                          )
                        }
                      />
                    </th>
                  )}
                  {columns.map((c, ci) => {
                    const dir = sort?.key === c.key ? sort.dir : null;
                    const SortIcon = dir === "asc" ? CaretUp : CaretDown;
                    return (
                      <th
                        key={c.key}
                        scope="col"
                        aria-sort={
                          dir ? (dir === "asc" ? "ascending" : "descending") : undefined
                        }
                        className={cn(
                          "px-2 py-2 font-medium",
                          c.align === "right" ? "text-end" : "text-start",
                          priorityOf(c, ci),
                        )}
                        style={{ width: c.width }}
                      >
                        {c.sortable ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(c.key)}
                            className={cn(
                              "-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-[background-color,color,scale] duration-150 ease-out hover:bg-foreground/[0.06] hover:text-foreground active:scale-[0.97]",
                              dir && "text-foreground",
                              c.align === "right" && "flex-row-reverse",
                            )}
                          >
                            {c.label}
                            <SortIcon
                              weight="bold"
                              aria-hidden="true"
                              className={cn(
                                "size-3 transition-opacity",
                                dir ? "opacity-100" : "opacity-30",
                              )}
                            />
                          </button>
                        ) : (
                          c.label
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {visible.map((row, i) => {
                  const isSelected = selected.includes(row.id);
                  return (
                    <tr
                      key={row.id}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={cn(
                        "transition-colors duration-150 [&>td:first-child]:rounded-s-xl [&>td:last-child]:rounded-e-xl",
                        isSelected
                          ? "bg-brand/10"
                          : i % 2 === 1
                            ? "bg-foreground/[0.025] hover:bg-foreground/[0.05]"
                            : "hover:bg-foreground/[0.05]",
                        onRowClick && "cursor-pointer",
                      )}
                    >
                      {selectable && (
                        <td className="px-2 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            aria-label={labels.selectRow(String(row[columns[0].key]))}
                            checked={isSelected}
                            onCheckedChange={(on) =>
                              setSelected(
                                on
                                  ? [...selected, row.id]
                                  : selected.filter((id) => id !== row.id),
                              )
                            }
                          />
                        </td>
                      )}
                      {columns.map((c, ci) => (
                        <td
                          key={c.key}
                          className={cn(
                            "px-2 py-2.5 whitespace-nowrap",
                            priorityOf(c, ci),
                            c.align === "right" &&
                              "text-end font-mono text-xs tabular-nums",
                          )}
                        >
                          {c.align === "right" ? (
                            // Signs and units stay on the correct side of numbers in RTL.
                            <span dir="ltr">
                              {c.format
                                ? c.format(row[c.key], row)
                                : String(row[c.key] ?? "—")}
                            </span>
                          ) : c.format ? (
                            c.format(row[c.key], row)
                          ) : (
                            String(row[c.key] ?? "—")
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && (
              <EmptyState
                compact
                icon={MagnifyingGlass}
                title={labels.noMatch}
                description={labels.noMatchDescription(query)}
              />
            )}
          </div>
        </Panel>

        <footer className="flex items-center justify-between gap-3 py-1.5 ps-3.5 pe-1.5 text-xs text-muted-foreground">
          <span>
            {labels.range(
              rows.length ? current * pageSize + 1 : 0,
              Math.min((current + 1) * pageSize, rows.length),
              rows.length,
            )}
          </span>
          <span className="flex items-center gap-1">
            <IconButton
              icon={CaretLeft}
              iconWeight="bold"
              label={labels.previousPage}
              className="rtl:[&_svg]:-scale-x-100"
              variant="quiet"
              size="sm"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            />
            <span dir="ltr" className="w-14 text-center tabular-nums">
              {current + 1} / {pages}
            </span>
            <IconButton
              icon={CaretRight}
              iconWeight="bold"
              label={labels.nextPage}
              className="rtl:[&_svg]:-scale-x-100"
              variant="quiet"
              size="sm"
              disabled={current >= pages - 1}
              onClick={() => setPage(current + 1)}
            />
          </span>
        </footer>
        <p role="status" aria-live="polite" className="sr-only">
          {copied
            ? labels.copiedCsv
            : labels.status(
                rows.length,
                sort && {
                  ...sort,
                  label: columns.find((c) => c.key === sort.key)?.label ?? sort.key,
                },
              )}
        </p>
      </Shell>
    </MotionConfig>
  );
}
