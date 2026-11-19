// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import {
  ArrowCounterClockwise,
  CheckCircle,
  Minus,
  Plus,
  SealCheck,
  Trash,
  Warning,
} from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Button, IconButton } from "@/components/ui/action-button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { RollingNumber } from "@/components/ui/rolling-number";
import { StatusPill } from "@/components/ui/status-pill";
import { IconTile, Inset, Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { enter, exit, spring } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type ConfirmationItem = {
  id: string;
  label: string;
  detail?: string;
  /** Price of one unit. */
  amount: number;
  quantity?: number;
  /** Shows a quantity stepper. */
  editable?: boolean;
  removable?: boolean;
};

export type ConfirmationStatus = "review" | "confirming" | "done";

export type ConfirmationCardProps = {
  data: {
    title: string;
    subtitle?: string;
    items: ConfirmationItem[];
    fees?: { label: string; amount: number }[];
    warnings?: string[];
    /** Shown once done, e.g. a booking or deploy id. */
    reference?: string;
    /** Shown once done, e.g. "Today, 14:32". */
    doneAt?: string;
  };
  currency?: string;
  status?: ConfirmationStatus;
  onItemsChange?: (items: ConfirmationItem[]) => void;
  onConfirm?: (items: ConfirmationItem[]) => void;
  onEdit?: () => void;
  onCancel?: () => void;
  /** Shows an undo countdown after confirming. */
  onUndo?: () => void;
  undoSeconds?: number;
  confirmLabel?: string;
  doneLabel?: string;
  /** BCP 47 locale for amounts, e.g. `he-IL`. */
  locale?: string;
  /** UI strings, for translating the card. */
  labels?: Partial<ConfirmationCardLabels>;
  className?: string;
};

export type ConfirmationCardLabels = {
  quantity: (item: string) => string;
  decrease: string;
  increase: string;
  remove: (item: string) => string;
  subtotal: string;
  total: string;
  /** Read before each warning by screen readers. */
  warning: string;
  cancel: string;
  edit: string;
  confirming: string;
  /** Screen-reader status while confirming. */
  confirmingStatus: string;
  undo: string;
  undoTimeLeft: string;
  seconds: (n: number) => string;
  /** Countdown on the undo button. */
  secondsShort: (n: number) => string;
};

const defaultLabels: ConfirmationCardLabels = {
  quantity: (item) => `${item} quantity`,
  decrease: "Decrease",
  increase: "Increase",
  remove: (item) => `Remove ${item}`,
  subtotal: "Subtotal",
  total: "Total",
  warning: "Warning: ",
  cancel: "Cancel",
  edit: "Edit",
  confirming: "Confirming…",
  confirmingStatus: "Confirming",
  undo: "Undo",
  undoTimeLeft: "Time left to undo",
  seconds: (n) => `${n} seconds`,
  secondsShort: (n) => `${n}s`,
};

export function ConfirmationCard({
  data,
  currency = "USD",
  status = "review",
  onItemsChange,
  onConfirm,
  onEdit,
  onCancel,
  onUndo,
  undoSeconds = 30,
  confirmLabel = "Confirm",
  doneLabel = "Done",
  locale = "en-US",
  labels: labelOverrides,
  className,
}: ConfirmationCardProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const money = (n: number) =>
    n.toLocaleString(locale, { style: "currency", currency, maximumFractionDigits: 2 });
  const items = data.items;
  const subtotal = items.reduce((n, i) => n + i.amount * (i.quantity ?? 1), 0);
  const total = subtotal + (data.fees ?? []).reduce((n, f) => n + f.amount, 0);
  const update = (id: string, change: Partial<ConfirmationItem> | null) =>
    onItemsChange?.(
      change === null
        ? items.filter((i) => i.id !== id)
        : items.map((i) => (i.id === id ? { ...i, ...change } : i)),
    );

  return (
    <MotionConfig reducedMotion="user">
      <Shell aria-label={data.title} className={cn("max-w-md", className)}>
        <AnimatePresence mode="popLayout" initial={false}>
          {status === "done" ? (
            <Done
              key="done"
              data={data}
              total={money(total)}
              label={doneLabel}
              labels={labels}
              onUndo={onUndo}
              undoSeconds={undoSeconds}
            />
          ) : (
            <motion.div key="review" exit={{ opacity: 0, transition: exit }}>
              <ShellHeader icon={SealCheck} title={data.title} subtitle={data.subtitle} />
              <Panel>
                <ul className="px-2 pt-2">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.li
                        key={item.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto", transition: spring }}
                        exit={{ opacity: 0, height: 0, transition: exit }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center gap-3 rounded-xl px-2 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm">{item.label}</p>
                            {item.detail && (
                              <p className="truncate text-xs text-muted-foreground">
                                {item.detail}
                              </p>
                            )}
                          </div>
                          {item.editable && (
                            <div
                              role="group"
                              aria-label={labels.quantity(item.label)}
                              className="flex items-center gap-1 rounded-full bg-foreground/[0.05] p-0.5"
                            >
                              <IconButton
                                icon={Minus}
                                iconWeight="bold"
                                label={labels.decrease}
                                variant="quiet"
                                size="sm"
                                className="size-7"
                                disabled={
                                  (item.quantity ?? 1) <= 1 || status !== "review"
                                }
                                onClick={() =>
                                  update(item.id, { quantity: (item.quantity ?? 1) - 1 })
                                }
                              />
                              <span className="w-5 text-center font-mono text-xs tabular-nums">
                                <RollingNumber value={String(item.quantity ?? 1)} />
                              </span>
                              <IconButton
                                icon={Plus}
                                iconWeight="bold"
                                label={labels.increase}
                                variant="quiet"
                                size="sm"
                                className="size-7"
                                disabled={status !== "review"}
                                onClick={() =>
                                  update(item.id, { quantity: (item.quantity ?? 1) + 1 })
                                }
                              />
                            </div>
                          )}
                          <span className="min-w-20 text-end font-mono text-[0.8125rem] tabular-nums">
                            <RollingNumber
                              value={money(item.amount * (item.quantity ?? 1))}
                            />
                          </span>
                          {item.removable && (
                            <IconButton
                              icon={Trash}
                              label={labels.remove(item.label)}
                              variant="quiet"
                              size="sm"
                              disabled={status !== "review"}
                              onClick={() => update(item.id, null)}
                            />
                          )}
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <dl className="mx-4 flex flex-col gap-1.5 py-3 text-[0.8125rem]">
                  {[
                    { label: labels.subtotal, amount: subtotal },
                    ...(data.fees ?? []),
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between text-muted-foreground"
                    >
                      <dt>{row.label}</dt>
                      <dd className="font-mono tabular-nums">
                        <RollingNumber value={money(row.amount)} />
                      </dd>
                    </div>
                  ))}
                  <div className="flex items-baseline justify-between pt-1.5">
                    <dt className="font-medium">{labels.total}</dt>
                    <dd className="font-mono text-lg font-medium tabular-nums">
                      <RollingNumber value={money(total)} />
                    </dd>
                  </div>
                </dl>
                {data.warnings?.length ? (
                  <div className="flex flex-col gap-1.5 px-2 pb-2">
                    {data.warnings.map((w) => (
                      <Inset
                        key={w}
                        className="flex items-start gap-2 bg-warning/10 px-3 py-2 text-[0.8125rem] text-warning"
                      >
                        <Warning
                          weight="fill"
                          className="mt-0.5 size-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>
                          <span className="sr-only">{labels.warning}</span>
                          {w}
                        </span>
                      </Inset>
                    ))}
                  </div>
                ) : null}
              </Panel>
              <div className="flex items-center justify-end gap-1.5 pt-1.5">
                {onCancel && (
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={onCancel}
                    disabled={status !== "review"}
                  >
                    {labels.cancel}
                  </Button>
                )}
                {onEdit && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onEdit}
                    disabled={status !== "review"}
                  >
                    {labels.edit}
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  loading={status === "confirming"}
                  disabled={!items.length}
                  onClick={() => onConfirm?.(items)}
                >
                  {status === "confirming" ? (
                    labels.confirming
                  ) : (
                    <>
                      {confirmLabel} · <span dir="ltr">{money(total)}</span>
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <p role="status" aria-live="polite" className="sr-only">
          {status === "confirming"
            ? labels.confirmingStatus
            : status === "done"
              ? `${doneLabel}, ${money(total)}`
              : ""}
        </p>
      </Shell>
    </MotionConfig>
  );
}

function Done({
  data,
  total,
  label,
  labels,
  onUndo,
  undoSeconds,
}: {
  data: ConfirmationCardProps["data"];
  total: string;
  label: string;
  labels: ConfirmationCardLabels;
  onUndo?: () => void;
  undoSeconds: number;
}) {
  const [left, setLeft] = useState(undoSeconds);
  useEffect(() => {
    if (!onUndo) return;
    const timer = setInterval(() => setLeft((n) => Math.max(n - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [onUndo]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0, transition: enter }}
    >
      <Panel className="flex items-center gap-3 p-3">
        <IconTile icon={CheckCircle} className="bg-positive/15 text-positive" />
        <div className="min-w-0 flex-1">
          <p className="text-[0.9375rem] font-medium">{data.title}</p>
          <p className="truncate text-[0.8125rem] text-muted-foreground">
            {data.reference && <span className="font-mono">{data.reference} · </span>}
            {data.doneAt ?? total}
          </p>
        </div>
        <StatusPill tone="positive" icon={CheckCircle}>
          {label}
        </StatusPill>
      </Panel>
      <AnimatePresence initial={false}>
        {onUndo && left > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: enter }}
            exit={{ opacity: 0, transition: exit }}
            className="flex items-center gap-3 ps-3 pt-1.5"
          >
            <ProgressBar
              value={left}
              max={undoSeconds}
              size="sm"
              tone="neutral"
              label={labels.undoTimeLeft}
              valueText={labels.seconds(left)}
              className="flex-1"
            />
            <Button
              variant="quiet"
              size="sm"
              icon={ArrowCounterClockwise}
              iconWeight="bold"
              onClick={onUndo}
            >
              {labels.undo} · <RollingNumber value={labels.secondsShort(left)} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
