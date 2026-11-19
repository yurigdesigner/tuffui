// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import { CaretDown, ChatCircleDots, PaperPlaneRight, X } from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { IconButton } from "@/components/ui/action-button";
import { Avatar } from "@/components/ui/agent-avatar";
import {
  ChatThread,
  type ChatThreadLabels,
  type ThreadMessage,
} from "@/components/ui/chat-thread";
import { Spinner, Thinking } from "@/components/ui/loader";
import {
  PromptSuggestions,
  type PromptSuggestion,
  type PromptSuggestionsLabels,
} from "@/components/ui/prompt-suggestions";
import {
  ResponseFeedback,
  type ResponseFeedbackLabels,
} from "@/components/ui/response-feedback";
import { TextField } from "@/components/ui/text-field";
import { EASE_OUT } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type SupportPerson = { name: string; avatar?: string; role?: string };

export type SupportWidgetData = {
  /** The bot that answers first. */
  bot: SupportPerson;
  /** The person who takes over after a handoff. */
  human?: SupportPerson;
  /** The visitor, shown on their own messages. */
  visitor: { name: string };
  /** Turns; set `author` to the human's name for messages written by a person. */
  messages: ThreadMessage[];
  /** Quick replies under the last bot message. */
  quickReplies?: PromptSuggestion[];
  /**
   * `typing` shows the bot composing, `waiting` the queue for a person, `human`
   * switches the header to the person who joined.
   */
  mode?: "bot" | "typing" | "waiting" | "human";
  /** Queue hint while waiting, e.g. "~2 min". */
  wait?: string;
  /** Ask for a rating at the end of the conversation. */
  askRating?: boolean;
  /** Count on the launcher while the panel is closed. */
  unread?: number;
};

export type SupportWidgetLabels = {
  /** Dialog name. */
  chatWith: (name: string) => string;
  /** Under the bot's name in the header. */
  repliesInstantly: string;
  /** Under the person's name when they have no `role`. */
  supportTeam: string;
  minimise: string;
  endChat: string;
  /** Screen-reader text while the bot composes. */
  typing: (name: string) => string;
  thinking: string;
  loading: string;
  /** Queue line; `wait` is the hint from data, e.g. "~2 min". */
  waiting: (wait?: string) => string;
  message: string;
  placeholder: string;
  /** Placeholder while waiting for a person. */
  waitingPlaceholder: string;
  send: string;
  openChat: string;
  hideChat: string;
  /** Screen-reader text after the launcher count. */
  unread: string;
  /** Passed through to the components the widget is built from. */
  chatThread?: Partial<ChatThreadLabels>;
  suggestions?: Partial<PromptSuggestionsLabels>;
  feedback?: Partial<ResponseFeedbackLabels>;
  /** Reasons offered with the rating; the rating component's own list by default. */
  ratingReasons?: string[];
};

const defaultLabels: SupportWidgetLabels = {
  chatWith: (name) => `Chat with ${name}`,
  repliesInstantly: "Typically replies instantly",
  supportTeam: "Support team",
  minimise: "Minimise chat",
  endChat: "End chat",
  typing: (name) => `${name} is typing`,
  thinking: "Thinking",
  loading: "Loading",
  waiting: (wait) => `Waiting for a person${wait ? ` · ${wait}` : ""}`,
  message: "Message",
  placeholder: "Write a message…",
  waitingPlaceholder: "Add details while you wait…",
  send: "Send",
  openChat: "Open support chat",
  hideChat: "Hide support chat",
  unread: " unread",
};

export type SupportWidgetProps = {
  data: SupportWidgetData;
  /** The host page the widget sits on. */
  children?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Close ends the conversation; minimising just hides the panel. */
  onClose?: () => void;
  onSend?: (text: string) => void;
  onRate?: (feedback: {
    rating: number | "up" | "down";
    reasons: string[];
    note: string;
  }) => void;
  /** Your own UI strings, plus labels for the inner components, for translating. */
  labels?: Partial<SupportWidgetLabels>;
  /** Intl locale for message times. */
  locale?: string;
  className?: string;
};

const pop = { type: "spring", duration: 0.35, bounce: 0.12 } as const;

/**
 * A support chat embedded on a site: a launcher in the corner opens a panel that
 * grows out of it. From 28rem wide the panel floats over the page; below that it
 * fills the screen. The thread is the panel's one scroll and the composer stays
 * pinned at its bottom.
 */
export function SupportWidget({
  data,
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  onClose,
  onSend,
  onRate,
  labels: labelOverrides,
  locale,
  className,
}: SupportWidgetProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const { bot, human, visitor, messages, quickReplies, mode = "bot" } = data;
  const [own, setOwn] = useState(defaultOpen);
  const open = openProp ?? own;
  const [draft, setDraft] = useState("");
  const panelId = useId();
  const input = useRef<HTMLInputElement>(null);
  const focusOnOpen = useRef(false);
  const dock = useRef<HTMLFormElement>(null);
  const [inset, setInset] = useState(72);
  const root = useRef<HTMLDivElement>(null);
  // The panel grows out of the launcher, which sits bottom left in RTL.
  const [rtl, setRtl] = useState(false);
  useEffect(() => {
    if (root.current) setRtl(getComputedStyle(root.current).direction === "rtl");
  }, []);

  const setOpen = (next: boolean) => {
    setOwn(next);
    onOpenChange?.(next);
  };

  // Opening from the launcher moves focus into the composer; a scripted open doesn't.
  useEffect(() => {
    if (open && focusOnOpen.current) {
      focusOnOpen.current = false;
      input.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const el = dock.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setInset(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);

  const send = (text: string) => {
    if (!text.trim()) return;
    onSend?.(text.trim());
    setDraft("");
  };

  const speaker = mode === "human" && human ? human : bot;

  const footer = (
    <div className="flex flex-col gap-3 pt-1">
      {mode === "typing" && (
        <div className="flex items-center gap-2 ps-9 text-muted-foreground">
          <Thinking size="sm" label={labels.thinking} />
          <span className="sr-only">{labels.typing(bot.name)}</span>
        </div>
      )}
      {mode === "waiting" && (
        <div
          role="status"
          className="mx-auto flex items-center gap-2 rounded-full bg-foreground/[0.05] px-3 py-1.5 text-[0.8125rem] text-muted-foreground"
        >
          <Spinner size="sm" label={labels.loading} />
          {labels.waiting(data.wait)}
        </div>
      )}
      {mode === "bot" && quickReplies && quickReplies.length > 0 && (
        <PromptSuggestions
          data={quickReplies}
          variant="chips"
          labels={labels.suggestions}
          onSelect={(_, prompt) => send(prompt)}
          className="max-w-none ps-9"
        />
      )}
      {data.askRating && (
        <ResponseFeedback
          variant="detailed"
          onSubmit={onRate}
          labels={labels.feedback}
          reasons={labels.ratingReasons}
          className="max-w-none"
        />
      )}
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={root}
        className={cn(
          "@container relative h-full w-full overflow-hidden bg-background text-foreground",
          className,
        )}
      >
        <div className="h-full overflow-y-auto">{children}</div>

        <AnimatePresence>
          {open && (
            <motion.section
              key="panel"
              id={panelId}
              role="dialog"
              aria-label={labels.chatWith(speaker.name)}
              onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1, transition: pop }}
              exit={{
                opacity: 0,
                scale: 0.94,
                transition: { duration: 0.15, ease: EASE_OUT },
              }}
              style={{ transformOrigin: rtl ? "bottom left" : "bottom right" }}
              className={cn(
                "absolute inset-2 z-20 flex flex-col rounded-[1.375rem] bg-surface p-1.5",
                "@md:inset-auto @md:end-5 @md:bottom-24 @md:h-[min(40rem,calc(100%-7.5rem))] @md:w-[23.5rem]",
                "shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)]",
              )}
            >
              <header className="flex items-center gap-3 pt-1.5 pr-1.5 pb-3 pl-1.5">
                <Avatar
                  name={speaker.name}
                  src={speaker.avatar}
                  kind={speaker === bot ? "agent" : "person"}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[0.9375rem] font-medium">
                    {speaker.name}
                  </h2>
                  <p className="truncate text-[0.8125rem] text-muted-foreground">
                    {speaker === bot
                      ? labels.repliesInstantly
                      : (speaker.role ?? labels.supportTeam)}
                  </p>
                </div>
                <IconButton
                  icon={CaretDown}
                  iconWeight="bold"
                  label={labels.minimise}
                  onClick={() => setOpen(false)}
                />
                <IconButton
                  icon={X}
                  iconWeight="bold"
                  label={labels.endChat}
                  onClick={() => {
                    setOpen(false);
                    onClose?.();
                  }}
                />
              </header>

              <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-surface-inset">
                <ChatThread
                  bare
                  density="dense"
                  data={{ messages }}
                  agentName={bot.name}
                  userName={visitor.name}
                  locale={locale}
                  labels={labels.chatThread}
                  bottomInset={inset}
                  contentClassName="px-3"
                  renderAvatar={(message) =>
                    message.role === "user" ? undefined : message.author &&
                      message.author === human?.name ? (
                      <Avatar
                        name={human.name}
                        src={human.avatar}
                        size="sm"
                        kind="person"
                      />
                    ) : (
                      <Avatar name={bot.name} src={bot.avatar} size="sm" kind="agent" />
                    )
                  }
                  footer={footer}
                />
                <form
                  ref={dock}
                  onSubmit={(event) => {
                    event.preventDefault();
                    send(draft);
                  }}
                  className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-surface-inset px-3 pt-2 pb-3 before:pointer-events-none before:absolute before:inset-x-0 before:-top-5 before:h-5 before:bg-gradient-to-t before:from-surface-inset before:to-transparent"
                >
                  <TextField
                    ref={input}
                    aria-label={labels.message}
                    dir="auto"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={
                      mode === "waiting" ? labels.waitingPlaceholder : labels.placeholder
                    }
                    className="flex-1"
                  />
                  <IconButton
                    type="submit"
                    icon={PaperPlaneRight}
                    label={labels.send}
                    variant="primary"
                    size="md"
                    disabled={!draft.trim()}
                    className="rtl:[&_svg]:-scale-x-100"
                  />
                </form>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? labels.hideChat : labels.openChat}
          onClick={() => {
            focusOnOpen.current = !open;
            setOpen(!open);
          }}
          className={cn(
            "absolute end-5 bottom-5 z-30 flex size-14 items-center justify-center rounded-full bg-foreground text-background",
            "shadow-[0_12px_30px_-12px_rgba(0,0,0,0.5)] transition-[scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.95]",
            open && "@max-md:hidden",
          )}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={open ? "close" : "chat"}
              initial={{ opacity: 0, scale: 0.9, rotate: open ? -45 : 45 }}
              animate={{
                opacity: 1,
                scale: 1,
                rotate: 0,
                transition: { duration: 0.2, ease: EASE_OUT },
              }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.12 } }}
              className="flex"
            >
              {open ? (
                <CaretDown weight="bold" className="size-6" aria-hidden="true" />
              ) : (
                <ChatCircleDots weight="fill" className="size-7" aria-hidden="true" />
              )}
            </motion.span>
          </AnimatePresence>
          {!open && !!data.unread && (
            <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-negative px-1.5 text-[0.6875rem] font-semibold text-white tabular-nums">
              {data.unread}
              <span className="sr-only">{labels.unread}</span>
            </span>
          )}
        </motion.button>
      </div>
    </MotionConfig>
  );
}
