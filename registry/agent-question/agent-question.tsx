// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import {
  ArrowUUpLeft,
  ChatCircleDots,
  Check,
  type Icon as PhosphorIcon,
  PencilSimpleLine,
  Sparkle,
} from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Button } from "@/components/ui/action-button";
import { StatusPill } from "@/components/ui/status-pill";
import { IconTile, Shell } from "@/components/ui/surface";
import { enter, exit as leave } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type QuestionOption = {
  id: string;
  label: string;
  description?: string;
  icon?: PhosphorIcon;
};

export type AgentQuestionData = {
  question: string;
  options: QuestionOption[];
  /** Allow several answers instead of one. */
  multiple?: boolean;
  /** Adds a "Something else…" card that turns into a text field. */
  allowOther?: boolean;
  /** The option the agent would pick, and why. */
  suggested?: { optionId: string; reason: string };
};

export type QuestionAnswer = {
  /** Ids of the picked options. */
  optionIds: string[];
  /** Free text from "Something else…". */
  other?: string;
};

export type AgentQuestionProps = {
  data: AgentQuestionData;
  /** Controls the state; leave unset to let the card track it. */
  status?: "pending" | "answered" | "delegated";
  answer?: QuestionAnswer;
  onSubmit?: (answer: QuestionAnswer) => void;
  /** "Let the agent decide": the agent goes with its suggestion. */
  onDelegate?: () => void;
  /** Called from the Undo pill shown for `undoMs` after answering. */
  onUndo?: () => void;
  undoMs?: number;
  /** Controlled selection for multiple-choice questions. */
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  /** Name shown above the question. */
  agent?: string;
  /** UI strings, for translating. */
  labels?: Partial<AgentQuestionLabels>;
  className?: string;
};

export type AgentQuestionLabels = {
  asks: (agent: string) => string;
  /** Word before the suggested option's name. */
  suggests: string;
  /** Pill on the suggested card. */
  suggested: string;
  /** Screen-reader text on a checked card. */
  selected: string;
  somethingElse: string;
  otherPlaceholder: string;
  /** Screen-reader name of the free-text field. */
  yourAnswer: string;
  answer: string;
  /** A free-text answer, quoted. */
  quote: (text: string) => string;
  letAgentDecide: string;
  send: (count: number) => string;
  leftTo: (agent: string) => string;
  goingWith: (option: string) => string;
  answerSent: string;
  agentWillDecide: string;
  /** Announced to screen readers after delegating. */
  leftToAgent: string;
  undo: string;
};

const defaultLabels: AgentQuestionLabels = {
  asks: (agent) => `${agent} asks`,
  suggests: "Suggests",
  suggested: "Suggested",
  selected: "Selected",
  somethingElse: "Something else…",
  otherPlaceholder: "Tell the agent what you want instead",
  yourAnswer: "Your answer",
  answer: "Answer",
  quote: (text) => `“${text}”`,
  letAgentDecide: "Let the agent decide",
  send: (count) => `Send ${count} ${count === 1 ? "choice" : "choices"}`,
  leftTo: (agent) => `Left to ${agent}`,
  goingWith: (option) => `going with ${option}`,
  answerSent: "Answer sent",
  agentWillDecide: "Agent will decide",
  leftToAgent: "Left to the agent",
  undo: "Undo",
};

const Labels = createContext(defaultLabels);

// Cards morph into the summary on screen: a critically damped spring.
const morph = { type: "spring", duration: 0.35, bounce: 0 } as const;

export function AgentQuestion({
  data,
  status: statusProp,
  answer: answerProp,
  onSubmit,
  onDelegate,
  onUndo,
  undoMs = 4000,
  selected: selectedProp,
  onSelectedChange,
  agent = "Agent",
  labels: labelOverrides,
  className,
}: AgentQuestionProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const [own, setOwn] = useState<{
    status: "pending" | "answered" | "delegated";
    answer?: QuestionAnswer;
  }>({
    status: "pending",
  });
  const [ownSelected, setOwnSelected] = useState<string[]>([]);
  const [writing, setWriting] = useState(false);
  const [other, setOther] = useState("");
  const grid = useRef<HTMLDivElement>(null);
  const id = useId();

  const status = statusProp ?? own.status;
  const answer = answerProp ?? own.answer;
  const selected = selectedProp ?? ownSelected;
  const suggested = data.options.find((o) => o.id === data.suggested?.optionId);

  const setSelected = (ids: string[]) => {
    setOwnSelected(ids);
    onSelectedChange?.(ids);
  };
  const submit = (a: QuestionAnswer) => {
    setOwn({ status: "answered", answer: a });
    onSubmit?.(a);
  };
  const pick = (optionId: string) => {
    if (!data.multiple) return submit({ optionIds: [optionId] });
    setSelected(
      selected.includes(optionId)
        ? selected.filter((x) => x !== optionId)
        : [...selected, optionId],
    );
  };
  const undo = () => {
    setOwn({ status: "pending" });
    setSelected([]);
    setWriting(false);
    onUndo?.();
  };

  // Roving focus: arrows move between cards, following the grid's column count.
  const onGridKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const cards = [...(grid.current?.querySelectorAll<HTMLElement>("[data-card]") ?? [])];
    const i = cards.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    const style = getComputedStyle(grid.current!);
    const cols = style.gridTemplateColumns.split(" ").length;
    // In RTL the next card sits to the left.
    const side = style.direction === "rtl" ? -1 : 1;
    const step = {
      ArrowRight: side,
      ArrowLeft: -side,
      ArrowDown: cols,
      ArrowUp: -cols,
    }[e.key];
    if (!step) return;
    e.preventDefault();
    cards[Math.min(Math.max(i + step, 0), cards.length - 1)]?.focus();
  };

  const count = selected.length + (data.multiple && other.trim() ? 1 : 0);
  const chosen = data.options.filter((o) => answer?.optionIds.includes(o.id));

  return (
    <Labels.Provider value={labels}>
      <MotionConfig reducedMotion="user">
        <Shell aria-labelledby={`${id}-q`} className={cn("max-w-xl", className)}>
          <div className="flex items-center gap-3 ps-1.5 pe-2 pt-1.5 pb-3">
            <IconTile icon={ChatCircleDots} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{labels.asks(agent)}</p>
              <h3
                id={`${id}-q`}
                className="mt-0.5 text-[0.9375rem] font-medium text-pretty"
              >
                {data.question}
              </h3>
            </div>
          </div>
          {status === "pending" && data.suggested && suggested && (
            <p className="-mt-1 flex items-start gap-1.5 px-3.5 pb-3 text-[0.8125rem] text-muted-foreground">
              <Sparkle
                weight="fill"
                className="mt-0.5 size-3.5 shrink-0 text-brand"
                aria-hidden="true"
              />
              <span>
                {labels.suggests}{" "}
                <span className="text-foreground">{suggested.label}</span> —{" "}
                {data.suggested.reason}
              </span>
            </p>
          )}
          <LayoutGroup id={id}>
            {status === "pending" ? (
              <div
                ref={grid}
                role={data.multiple ? "group" : "radiogroup"}
                aria-labelledby={`${id}-q`}
                onKeyDown={onGridKey}
                className="grid grid-cols-1 gap-1.5 @md:grid-cols-2"
              >
                {data.options.map((o, i) => {
                  const on = selected.includes(o.id);
                  return (
                    <Card
                      key={o.id}
                      option={o}
                      role={data.multiple ? "checkbox" : "radio"}
                      checked={on}
                      tabIndex={i === 0 ? 0 : -1}
                      suggested={o.id === data.suggested?.optionId}
                      onClick={() => pick(o.id)}
                    />
                  );
                })}
                {data.allowOther &&
                  (writing ? (
                    <motion.form
                      layout
                      transition={morph}
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!data.multiple && other.trim())
                          submit({ optionIds: [], other: other.trim() });
                      }}
                      className="flex items-center gap-2 rounded-2xl bg-surface-inset p-2 @md:col-span-2"
                    >
                      <input
                        autoFocus
                        dir="auto"
                        value={other}
                        onChange={(e) => setOther(e.target.value)}
                        onKeyDown={(e) => e.key === "Escape" && setWriting(false)}
                        placeholder={labels.otherPlaceholder}
                        aria-label={labels.yourAnswer}
                        className="h-9 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
                      />
                      {!data.multiple && (
                        <Button type="submit" variant="primary" disabled={!other.trim()}>
                          {labels.answer}
                        </Button>
                      )}
                    </motion.form>
                  ) : (
                    <button
                      type="button"
                      data-card
                      tabIndex={-1}
                      onClick={() => setWriting(true)}
                      className="flex min-h-16 items-center gap-3 rounded-2xl bg-surface-inset/50 p-3.5 text-start text-sm text-muted-foreground transition-[color,background-color,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-surface-inset hover:text-foreground active:scale-[0.98]"
                    >
                      <PencilSimpleLine
                        weight="fill"
                        className="size-4 shrink-0"
                        aria-hidden="true"
                      />
                      {labels.somethingElse}
                    </button>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {status === "delegated" ? (
                  <p className="rounded-2xl bg-surface-inset p-3.5 text-sm">
                    {labels.leftTo(agent)}
                    {suggested && (
                      <span className="text-muted-foreground">
                        {" "}
                        — {labels.goingWith(suggested.label)}
                      </span>
                    )}
                  </p>
                ) : (
                  <>
                    {chosen.map((o) => (
                      <Card
                        key={o.id}
                        option={o}
                        role="radio"
                        checked
                        readOnly
                        suggested={false}
                      />
                    ))}
                    {answer?.other && (
                      <p className="rounded-2xl bg-surface-inset p-3.5 text-sm">
                        {labels.quote(answer.other)}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </LayoutGroup>
          <div className="flex min-h-12 items-center gap-3 px-2 pt-1.5 text-[0.8125rem]">
            {status === "pending" ? (
              <>
                {onDelegate && (
                  <Button
                    variant="quiet"
                    onClick={() => {
                      setOwn({ status: "delegated" });
                      onDelegate();
                    }}
                    className="-ms-1 px-2.5 font-normal"
                  >
                    {labels.letAgentDecide}
                  </Button>
                )}
                <AnimatePresence>
                  {data.multiple && count > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1, transition: enter }}
                      exit={{ opacity: 0, scale: 0.95, transition: leave }}
                      className="ms-auto ltr:origin-right rtl:origin-left"
                    >
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() =>
                          submit({
                            optionIds: selected,
                            other: other.trim() || undefined,
                          })
                        }
                      >
                        {labels.send(count)}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <Settled status={status} undoMs={undoMs} onUndo={undo} />
            )}
          </div>
          <p role="status" aria-live="polite" className="sr-only">
            {status === "answered"
              ? labels.answerSent
              : status === "delegated"
                ? labels.leftToAgent
                : ""}
          </p>
        </Shell>
      </MotionConfig>
    </Labels.Provider>
  );
}

function Card({
  option,
  checked,
  suggested,
  readOnly,
  role,
  ...props
}: {
  option: QuestionOption;
  checked: boolean;
  suggested: boolean;
  readOnly?: boolean;
  role: "radio" | "checkbox";
} & Omit<React.ComponentProps<"button">, "children" | "role">) {
  const labels = useContext(Labels);
  const Icon = option.icon;
  const content = (
    <>
      {Icon && (
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-xl",
            checked
              ? "bg-brand text-brand-foreground"
              : "bg-foreground/[0.05] text-muted-foreground",
          )}
        >
          <Icon weight="fill" className="size-4" aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm font-medium">
          {option.label}
          {suggested && (
            <StatusPill tone="brand" size="sm">
              {labels.suggested}
            </StatusPill>
          )}
        </span>
        {option.description && (
          <span className="mt-0.5 block text-[0.8125rem] text-muted-foreground">
            {option.description}
          </span>
        )}
      </span>
      {checked && (
        <Check
          weight="bold"
          className="mt-0.5 size-4 shrink-0 text-brand"
          aria-label={labels.selected}
        />
      )}
    </>
  );
  const base = cn(
    "flex min-h-16 items-start gap-3 rounded-2xl p-3.5 text-start",
    checked ? "bg-brand/10" : "bg-surface-inset",
  );
  return (
    <motion.div layoutId={`card-${option.id}`} transition={morph}>
      {readOnly ? (
        <div className={base}>{content}</div>
      ) : (
        <button
          type="button"
          data-card
          role={role}
          aria-checked={checked}
          className={cn(
            base,
            "w-full transition-[background-color,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-surface-raised/60 active:scale-[0.98]",
            checked && "hover:bg-brand/15",
          )}
          {...props}
        >
          {content}
        </button>
      )}
    </motion.div>
  );
}

/** Answered or delegated: a short window to take it back. */
function Settled({
  status,
  undoMs,
  onUndo,
}: {
  status: "answered" | "delegated";
  undoMs: number;
  onUndo: () => void;
}) {
  const labels = useContext(Labels);
  const [undoable, setUndoable] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setUndoable(false), undoMs);
    return () => clearTimeout(timer);
  }, [undoMs]);
  return (
    <>
      <span className="flex items-center gap-1.5 px-1.5 text-muted-foreground">
        <Check weight="bold" className="size-3.5 text-positive" aria-hidden="true" />
        {status === "answered" ? labels.answerSent : labels.agentWillDecide}
      </span>
      <AnimatePresence>
        {undoable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: enter }}
            exit={{ opacity: 0, transition: leave }}
            className="ms-auto"
          >
            <Button
              icon={ArrowUUpLeft}
              iconWeight="bold"
              onClick={onUndo}
              className="gap-1 px-3 text-xs rtl:[&_svg]:-scale-x-100"
            >
              {labels.undo}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
