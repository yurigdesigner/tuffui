// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import { Code, GitBranch, SidebarSimple } from "@phosphor-icons/react";
import { MotionConfig, motion } from "motion/react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { IconButton } from "@/components/ui/action-button";
import { Avatar } from "@/components/ui/agent-avatar";
import {
  AgentComposer,
  type AgentComposerLabels,
  type ComposerMessage,
  type ComposerMode,
} from "@/components/ui/agent-composer";
import {
  AgentStatus,
  type AgentStatusData,
  type AgentStatusLabels,
} from "@/components/ui/agent-status";
import {
  ChatThread,
  type ChatThreadLabels,
  type ThreadMessage,
} from "@/components/ui/chat-thread";
import {
  CheckpointTimeline,
  type Checkpoint,
  type CheckpointTimelineLabels,
} from "@/components/ui/checkpoint-timeline";
import {
  FileChanges,
  type FileChange,
  type FileChangesLabels,
  type HunkSelection,
} from "@/components/ui/file-changes";
import { Segmented } from "@/components/ui/segmented-control";
import { Tag } from "@/components/ui/status-pill";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/tab-panels";
import {
  TerminalOutput,
  type TerminalOutputLabels,
  type TerminalRun,
} from "@/components/ui/terminal-output";
import { Tooltip } from "@/components/ui/tooltip-hint";
import { EASE_IN_OUT, instant as noMotion } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type WorkTab = "changes" | "terminal" | "preview";

export type CodingAgentData = {
  /** The task, shown in the header. */
  title: string;
  repo: string;
  branch: string;
  model: string;
  user: { name: string; avatar?: string };
  /** Thread turns; `content` can hold plans, tool calls and approval requests. */
  messages: ThreadMessage[];
  /** Live status line at the end of the thread while the agent works. */
  activity?: AgentStatusData;
  files: FileChange[];
  terminal: TerminalRun;
  checkpoints: Checkpoint[];
  /** What the preview tab renders, with the address it shows. */
  preview: { url: string; content: React.ReactNode };
};

export type CodingAgentProps = {
  data: CodingAgentData;
  status?: "idle" | "streaming";
  /** Controls the work panel tab. */
  tab?: WorkTab;
  onTabChange?: (tab: WorkTab) => void;
  onSend?: (message: ComposerMessage) => void;
  onStop?: () => void;
  onApply?: (selection: HunkSelection) => void;
  onDiscard?: () => void;
  applying?: boolean;
  onRestore?: (checkpoint: Checkpoint) => void;
  /** Formats message times in the thread. */
  locale?: string;
  labels?: Partial<CodingAgentLabels>;
  className?: string;
};

export type CodingAgentLabels = {
  showChat: string;
  hideChat: string;
  showWork: string;
  hideWork: string;
  /** Screen-reader name of the pane switch in the narrow layout. */
  show: string;
  panes: Record<"chat" | WorkTab, string>;
  /** Screen-reader names of the two panes. */
  conversation: string;
  work: string;
  /** Composer placeholders, idle and while the agent works. */
  askForChange: string;
  followUp: string;
  noChanges: string;
  /** Strings of the components inside the screen. */
  thread?: Partial<ChatThreadLabels>;
  activity?: Partial<AgentStatusLabels>;
  composer?: Partial<AgentComposerLabels>;
  checkpoints?: Partial<CheckpointTimelineLabels>;
  files?: Partial<FileChangesLabels>;
  terminal?: Partial<TerminalOutputLabels>;
};

const defaultLabels: CodingAgentLabels = {
  showChat: "Show chat",
  hideChat: "Hide chat",
  showWork: "Show work panel",
  hideWork: "Hide work panel",
  show: "Show",
  panes: { chat: "Chat", changes: "Changes", terminal: "Terminal", preview: "Preview" },
  conversation: "Conversation",
  work: "Work",
  askForChange: "Ask for a change…",
  followUp: "Add a follow-up…",
  noChanges: "No changes yet. Files the agent edits show up here.",
};

const LabelsContext = createContext<CodingAgentLabels>(defaultLabels);

type Layout = "split" | "chat" | "work";
type Pane = "chat" | WorkTab;

/** Container width (px) from which chat and the work panel sit side by side. */
const SPLIT_AT = 960;

/**
 * A coding agent at work: the conversation on the start side, what it changed on
 * the end side. Wide, both panes can be collapsed; narrow, a switch shows one at a time.
 * The thread is the only scroll on its side and the composer stays pinned.
 */
export function CodingAgent({
  data,
  status = "idle",
  tab: tabProp,
  onTabChange,
  onSend,
  onStop,
  onApply,
  onDiscard,
  applying,
  onRestore,
  locale,
  labels: labelOverrides,
  className,
}: CodingAgentProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const root = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(true);
  const [layout, setLayout] = useState<Layout>("split");
  const [instant, setInstant] = useState(false);
  const [ownTab, setOwnTab] = useState<WorkTab>("changes");
  const tab = tabProp ?? ownTab;
  const setTab = (next: WorkTab) => {
    setOwnTab(next);
    onTabChange?.(next);
  };
  const [pane, setPane] = useState<Pane>("chat");

  // Layout depends on the screen's own width, not the viewport.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWide(el.offsetWidth >= SPLIT_AT));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toggle = (event: React.MouseEvent, side: "chat" | "work") => {
    // Keyboard toggles snap; pointer toggles animate.
    setInstant(event.detail === 0);
    setLayout((current) =>
      side === "chat"
        ? current === "work"
          ? "split"
          : "work"
        : current === "chat"
          ? "split"
          : "chat",
    );
  };

  const chatShown = layout !== "work";
  const workShown = layout !== "chat";
  const changes = data.files.reduce((n, f) => n + f.hunks.length, 0);

  const chat = (
    <ChatColumn
      data={data}
      status={status}
      onSend={onSend}
      onStop={onStop}
      locale={locale}
    />
  );

  return (
    <LabelsContext.Provider value={labels}>
      <MotionConfig reducedMotion="user">
        <div
          ref={root}
          className={cn(
            "@container relative flex h-full w-full flex-col overflow-hidden bg-background text-foreground",
            className,
          )}
        >
          <header className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-2 px-3 py-2.5 @md:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <h2 className="min-w-0 truncate text-[0.9375rem] font-medium">
                {data.title}
              </h2>
              <Tag className="hidden shrink-0 gap-1 @lg:inline-flex">
                <GitBranch weight="bold" className="size-3" aria-hidden="true" />
                <span dir="ltr">{data.branch}</span>
              </Tag>
            </div>
            <div className="flex items-center gap-1">
              {wide && (
                <>
                  <PaneToggle
                    label={chatShown ? labels.hideChat : labels.showChat}
                    pressed={chatShown}
                    onClick={(e) => toggle(e, "chat")}
                  />
                  <PaneToggle
                    label={workShown ? labels.hideWork : labels.showWork}
                    pressed={workShown}
                    mirrored
                    onClick={(e) => toggle(e, "work")}
                  />
                </>
              )}
              <Avatar
                name={data.user.name}
                src={data.user.avatar}
                size="sm"
                className="ms-1"
              />
            </div>
            {!wide && (
              <Segmented<Pane>
                label={labels.show}
                size="sm"
                value={pane}
                onValueChange={setPane}
                className="w-full [&>*]:flex-1"
                options={[
                  { value: "chat", label: labels.panes.chat },
                  {
                    value: "changes",
                    label: `${labels.panes.changes}${changes ? ` ${changes}` : ""}`,
                  },
                  { value: "terminal", label: labels.panes.terminal },
                  { value: "preview", label: labels.panes.preview },
                ]}
              />
            )}
          </header>

          {wide ? (
            <div className="flex min-h-0 flex-1 gap-1.5 px-1.5 pb-1.5">
              <motion.div
                initial={false}
                animate={{
                  width: layout === "split" ? "44%" : layout === "chat" ? "100%" : "0%",
                }}
                transition={instant ? noMotion : { duration: 0.32, ease: EASE_IN_OUT }}
                inert={!chatShown}
                aria-hidden={!chatShown || undefined}
                className="min-w-0 shrink-0 overflow-hidden"
              >
                <div className="h-full min-w-[22rem]">{chat}</div>
              </motion.div>
              <div
                inert={!workShown}
                aria-hidden={!workShown || undefined}
                className="min-w-0 flex-1 overflow-hidden"
              >
                <div className="h-full min-w-[26rem]">
                  <WorkPanel
                    data={data}
                    tab={tab}
                    onTabChange={setTab}
                    changes={changes}
                    onApply={onApply}
                    onDiscard={onDiscard}
                    applying={applying}
                    onRestore={onRestore}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="min-h-0 flex-1 px-1.5 pb-1.5">
              {pane === "chat" ? (
                chat
              ) : (
                <WorkPanel
                  data={data}
                  tab={pane}
                  changes={changes}
                  onApply={onApply}
                  onDiscard={onDiscard}
                  applying={applying}
                  onRestore={onRestore}
                />
              )}
            </div>
          )}
        </div>
      </MotionConfig>
    </LabelsContext.Provider>
  );
}

function PaneToggle({
  label,
  pressed,
  mirrored,
  onClick,
}: {
  label: string;
  pressed: boolean;
  mirrored?: boolean;
  onClick: (event: React.MouseEvent) => void;
}) {
  return (
    <Tooltip content={label} side="bottom" align="end">
      <IconButton
        icon={SidebarSimple}
        label={label}
        title={undefined}
        aria-pressed={pressed}
        onClick={onClick}
        // The chat pane sits at the start, so its glyph mirrors under dir="rtl".
        className={cn(
          mirrored ? "ltr:[&_svg]:-scale-x-100" : "rtl:[&_svg]:-scale-x-100",
          !pressed && "text-muted-foreground",
        )}
      />
    </Tooltip>
  );
}

function ChatColumn({
  data,
  status,
  onSend,
  onStop,
  locale,
}: Pick<CodingAgentProps, "onSend" | "onStop" | "locale"> & {
  data: CodingAgentData;
  status: "idle" | "streaming";
}) {
  const labels = useContext(LabelsContext);
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<ComposerMode>("act");
  const dock = useRef<HTMLDivElement>(null);
  const [inset, setInset] = useState(150);

  useEffect(() => {
    const el = dock.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setInset(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      aria-label={labels.conversation}
      className="relative h-full overflow-hidden rounded-[1.375rem] bg-surface"
    >
      <ChatThread
        bare
        data={{ messages: data.messages }}
        agentName={data.model}
        userName={data.user.name}
        bottomInset={inset}
        locale={locale}
        labels={labels.thread}
        contentClassName="w-full px-3 @md:px-4"
        footer={
          data.activity && (
            <AgentStatus
              data={data.activity}
              onStop={onStop}
              maxSteps={0}
              labels={labels.activity}
              className="mt-3 max-w-none"
            />
          )
        }
      />
      <div
        ref={dock}
        className="absolute inset-x-0 bottom-0 bg-surface before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-gradient-to-t before:from-surface before:to-transparent"
      >
        <div className="px-2 pt-1 pb-2">
          <AgentComposer
            value={draft}
            onValueChange={setDraft}
            mode={mode}
            onModeChange={setMode}
            status={status}
            onSubmit={(message) => {
              onSend?.(message);
              setDraft("");
            }}
            onStop={onStop}
            placeholder={status === "streaming" ? labels.followUp : labels.askForChange}
            labels={labels.composer}
            className="max-w-none"
          />
        </div>
      </div>
    </section>
  );
}

function WorkPanel({
  data,
  tab,
  onTabChange,
  changes,
  onApply,
  onDiscard,
  applying,
  onRestore,
}: Pick<CodingAgentProps, "onApply" | "onDiscard" | "applying" | "onRestore"> & {
  data: CodingAgentData;
  tab: WorkTab;
  /** Without it the panel shows `tab` and renders no tab list (narrow layout). */
  onTabChange?: (tab: WorkTab) => void;
  changes: number;
}) {
  const labels = useContext(LabelsContext);
  const body = (current: WorkTab) =>
    current === "changes" ? (
      <ChangesTab
        data={data}
        onApply={onApply}
        onDiscard={onDiscard}
        applying={applying}
      />
    ) : current === "terminal" ? (
      <TerminalTab run={data.terminal} />
    ) : (
      <PreviewTab preview={data.preview} />
    );

  return (
    <section
      aria-label={labels.work}
      className="flex h-full flex-col overflow-hidden rounded-[1.375rem] bg-surface p-1.5"
    >
      {onTabChange ? (
        <Tabs
          value={tab}
          defaultValue="changes"
          onValueChange={(v) => onTabChange(v as WorkTab)}
          variant="pills"
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex flex-wrap items-center gap-2 ps-1.5 pe-1 pt-1 pb-2">
            <TabList label={labels.work} className="min-w-0">
              <Tab value="changes" count={changes || undefined}>
                {labels.panes.changes}
              </Tab>
              <Tab value="terminal">{labels.panes.terminal}</Tab>
              <Tab value="preview">{labels.panes.preview}</Tab>
            </TabList>
            <Checkpoints data={data.checkpoints} onRestore={onRestore} />
          </div>
          {(["changes", "terminal", "preview"] as const).map((value) => (
            <TabPanel key={value} value={value} className="min-h-0 flex-1">
              {body(value)}
            </TabPanel>
          ))}
        </Tabs>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 ps-1.5 pe-1 pt-1 pb-2">
            <Tag className="gap-1">
              <GitBranch weight="bold" className="size-3" aria-hidden="true" />
              <span dir="ltr" className="truncate">
                {data.branch}
              </span>
            </Tag>
            <Checkpoints data={data.checkpoints} onRestore={onRestore} />
          </div>
          <div className="min-h-0 flex-1">{body(tab)}</div>
        </>
      )}
    </section>
  );
}

function Checkpoints({
  data,
  onRestore,
}: {
  data: Checkpoint[];
  onRestore?: (checkpoint: Checkpoint) => void;
}) {
  const labels = useContext(LabelsContext);
  if (data.length === 0) return null;
  return (
    <CheckpointTimeline
      variant="compact"
      data={data}
      onRestore={onRestore}
      labels={labels.checkpoints}
      className="min-w-0 flex-1 basis-64 bg-foreground/[0.04]"
    />
  );
}

function ChangesTab({
  data,
  onApply,
  onDiscard,
  applying,
}: Pick<CodingAgentProps, "onApply" | "onDiscard" | "applying"> & {
  data: CodingAgentData;
}) {
  const labels = useContext(LabelsContext);
  return (
    // The panel's one scroll. Diff rows clip instead of scrolling sideways.
    <div className="h-full overflow-y-auto overscroll-contain rounded-2xl [&_.overflow-x-auto]:flex-wrap [&_.overflow-x-auto]:overflow-x-hidden">
      {data.files.length === 0 ? (
        <p className="grid h-full place-items-center px-6 text-center text-[0.8125rem] text-muted-foreground">
          {labels.noChanges}
        </p>
      ) : (
        <FileChanges
          data={data.files}
          view="stacked"
          onApply={(selection) => onApply?.(selection)}
          onDiscard={onDiscard}
          applying={applying}
          labels={labels.files}
          className="max-w-none"
        />
      )}
    </div>
  );
}

function TerminalTab({ run }: { run: TerminalRun }) {
  const labels = useContext(LabelsContext);
  const box = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(320);

  // The terminal's own log is this tab's single scroll, sized to fill the panel.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeight(el.clientHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={box} className="h-full overflow-hidden">
      <TerminalOutput
        data={run}
        maxHeight={Math.max(height - 108, 120)}
        labels={labels.terminal}
        className="max-w-none bg-transparent p-0"
      />
    </div>
  );
}

function PreviewTab({ preview }: { preview: CodingAgentData["preview"] }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-surface-inset">
      <div className="flex shrink-0 items-center gap-2 px-3 py-2">
        <Code
          weight="bold"
          className="size-3.5 text-muted-foreground"
          aria-hidden="true"
        />
        <span
          dir="ltr"
          className="min-w-0 truncate rounded-full bg-foreground/[0.05] px-2.5 py-0.5 font-mono text-[0.6875rem] text-muted-foreground"
        >
          {preview.url}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3">
        {preview.content}
      </div>
    </div>
  );
}
