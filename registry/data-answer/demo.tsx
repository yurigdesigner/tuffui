"use client";

import { DownloadSimple } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/action-button";
import { ChartCard } from "@/components/ui/chart-card";
import {
  DataTable,
  type DataColumn,
  type DataRow,
  type DataTableProps,
} from "@/components/ui/data-table";
import { SourceList, type Source } from "@/components/ui/source-list";
import { StatGrid, type Stat } from "@/components/ui/stat-grid";
import { StreamingMessage } from "@/components/ui/streaming-message";
import { ToolCallBlock, type ToolCall } from "@/components/ui/tool-call-block";
import { EASE_OUT } from "@/lib/motion-tokens";
import {
  streamText,
  useMockRun,
  wait,
  type MockStep,
} from "@/registry/use-mock-run/use-mock-run";
import { DataAnswer, type DataAnswerData } from "./data-answer";

// Fixed timestamps keep the prerendered HTML and the client in agreement.
const at = (minute: number) => new Date(Date.UTC(2026, 10, 3, 14, minute)).toISOString();

const weeks = ["W36", "W37", "W38", "W39", "W40", "W41", "W42", "W43", "W44", "W45"];

const stats: Stat[] = [
  {
    id: "act",
    label: "Activated in 7 days",
    value: "41.8%",
    delta: 18.6,
    trend: [33, 34, 35, 34, 35, 38, 40, 41, 42, 41.8],
  },
  {
    id: "ttv",
    label: "Time to first value",
    value: "2.4 days",
    delta: -22,
    higherIsBetter: false,
    trend: [3.2, 3.1, 3.2, 3.1, 3, 2.8, 2.6, 2.5, 2.4, 2.4],
  },
  {
    id: "inv",
    label: "Invited a teammate",
    value: "29.1%",
    delta: 6.1,
    trend: [26, 27, 27, 26, 27, 28, 28, 29, 29, 29.1],
  },
  {
    id: "sign",
    label: "Signups",
    value: "3,412",
    delta: 4.2,
    trend: [3100, 3180, 3220, 3150, 3260, 3300, 3350, 3390, 3400, 3412],
  },
];

type Cohort = DataRow & {
  cohort: string;
  signups: number;
  activated: number;
  rate: number;
  invited: number;
  change: number;
};

const cohorts: Cohort[] = weeks.slice(-6).map((w, i) => {
  const signups = [3260, 3300, 3350, 3390, 3400, 3412][i];
  const rate = [35.2, 38.1, 40.3, 41.2, 42.0, 41.8][i];
  return {
    id: w,
    cohort: `${w} · ${["Oct 5", "Oct 12", "Oct 19", "Oct 26", "Nov 2", "Nov 9"][i]}`,
    signups,
    activated: Math.round((signups * rate) / 100),
    rate,
    invited: [26.4, 27.8, 28.1, 28.9, 29.4, 29.1][i],
    change: i === 0 ? 0 : +(rate - [35.2, 38.1, 40.3, 41.2, 42.0][i - 1]).toFixed(1),
  };
});

const pct = (v: unknown) => `${Number(v).toFixed(1)}%`;
const signed = (v: unknown) =>
  Number(v) > 0 ? `+${Number(v).toFixed(1)}` : Number(v).toFixed(1);

const cohortColumns: DataColumn<Cohort>[] = [
  { key: "cohort", label: "Cohort", sortable: true },
  {
    key: "signups",
    label: "Signups",
    align: "right",
    sortable: true,
    format: (v) => Number(v).toLocaleString("en-US"),
  },
  {
    key: "activated",
    label: "Activated",
    align: "right",
    sortable: true,
    format: (v) => Number(v).toLocaleString("en-US"),
  },
  { key: "rate", label: "Rate", align: "right", sortable: true, format: pct },
  { key: "invited", label: "Invited", align: "right", sortable: true, format: pct },
  { key: "change", label: "Δ pts", align: "right", format: signed },
];

type Account = DataRow & {
  account: string;
  plan: string;
  seats: number;
  days: number;
  owner: string;
};

const accounts: Account[] = [
  ["Northwind Labs", "Team", 24, 1.2, "Ana P."],
  ["Halcyon Health", "Team", 41, 2.8, "Leo M."],
  ["Brightline Freight", "Team", 12, 0.9, "Ana P."],
  ["Copperleaf Studio", "Team", 9, 1.6, "Sam K."],
  ["Ostrava Robotics", "Team", 33, 3.4, "Leo M."],
  ["Pinecrest Schools", "Team", 18, 2.1, "Sam K."],
  ["Lumen Dental", "Team", 7, 1.1, "Ana P."],
].map(
  ([account, plan, seats, days, owner], i) =>
    ({ id: `a${i}`, account, plan, seats, days, owner }) as Account,
);

const accountColumns: DataColumn<Account>[] = [
  { key: "account", label: "Account", sortable: true },
  { key: "seats", label: "Seats", align: "right", sortable: true },
  {
    key: "days",
    label: "Days to activate",
    align: "right",
    sortable: true,
    format: (v) => `${v}d`,
  },
  { key: "owner", label: "Owner", sortable: true },
];

/** True while the element is narrower than `px` — answers adapt to the message column. */
function useNarrow(px: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setNarrow(el.clientWidth < px));
    observer.observe(el);
    return () => observer.disconnect();
  }, [px]);
  return [ref, narrow] as const;
}

/** KPI cards; sparklines only when two cards per row have room for them. */
function FittedStats() {
  const [ref, narrow] = useNarrow(520);
  return (
    <div ref={ref} className="min-w-0">
      <StatGrid
        data={stats}
        sparklines={!narrow}
        title="Since onboarding v2"
        subtitle="Weeks 41–45 vs 36–40"
        className="max-w-none"
      />
    </div>
  );
}

/** Keeps a table inside the message column: drops less important columns when narrow. */
function FittedTable<R extends DataRow>({
  columns,
  keep,
  ...props
}: DataTableProps<R> & { keep: string[] }) {
  const [ref, narrow] = useNarrow(520);
  return (
    <div ref={ref} className="min-w-0">
      <DataTable
        {...props}
        columns={narrow ? columns.filter((c) => keep.includes(c.key)) : columns}
        className="max-w-none"
      />
    </div>
  );
}

const sources: Source[] = [
  {
    id: "s1",
    title: "events.onboarding_step — warehouse",
    url: "https://data.acme.app/tables/onboarding_step",
    snippet: "Step completions per account, refreshed hourly.",
    date: "Nov 9",
  },
  {
    id: "s2",
    title: "Onboarding v2 launch note",
    url: "https://acme.app/changelog/onboarding-v2",
    snippet: "New checklist shipped to all new workspaces in week 41.",
    date: "Oct 12",
  },
];

const overviewText =
  "Activation in the first 7 days rose from 35.2% to 41.8% since the new onboarding shipped in week 41 [2], and teams reach their first report almost a day sooner [1]. Invites moved less — about 3 points — so the checklist helps people start, not yet bring their team.";
const drillText =
  "Team accounts drive most of the lift: they activate 1.6× faster than Free and make up 41% of activated workspaces. Below are the Team accounts that activated last week — select a few to export.";

const strip = (t: string) => t.replace(/\s?\[\d+(?:,\s?\d+)*\]/g, "");

const query = (status: ToolCall["status"], sql: string): ToolCall => ({
  id: "sql",
  name: "warehouse.query",
  args: { sql },
  status,
  durationMs: status === "success" ? 2_180 : undefined,
  result: status === "success" ? { rows: 60, bytes_scanned: "1.4 GB" } : undefined,
});

const overviewSql =
  "select week, count(*) signups, avg(activated_7d) rate, avg(invited) invited from onboarding_cohorts where week >= 'W36' group by week order by week";
const drillSql =
  "select plan, count(*) activated, avg(days_to_activate) days from onboarding_cohorts where activated_7d and week = 'W45' group by plan";

type Phase = "query" | "text" | "stats" | "chart" | "table" | "done";
type Turn = {
  id: string;
  role: "user" | "assistant";
  at: string;
  text: string;
  kind: "overview" | "drill";
  phase: Phase;
};
type State = { turns: Turn[]; status: "idle" | "streaming" };

const order: Phase[] = ["query", "text", "stats", "chart", "table", "done"];
const reached = (turn: Turn, phase: Phase) =>
  order.indexOf(turn.phase) >= order.indexOf(phase);

const Reveal = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.24, ease: EASE_OUT }}
    className="min-w-0"
  >
    {children}
  </motion.div>
);

function Answer({ turn }: { turn: Turn }) {
  const drill = turn.kind === "drill";
  const [selected, setSelected] = useState<string[]>(["a0", "a2"]);
  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <ToolCallBlock
        data={query(
          turn.phase === "query" ? "running" : "success",
          drill ? drillSql : overviewSql,
        )}
        className="max-w-none"
      />
      {turn.phase === "text" && (
        <StreamingMessage
          data={{ content: turn.text, status: "streaming" }}
          showHeader={false}
          className="max-w-none"
        />
      )}
      {reached(turn, "stats") &&
        (drill ? (
          <p>{turn.text}</p>
        ) : (
          <SourceList
            data={{ sources, text: turn.text }}
            variant="footnotes"
            className="max-w-none"
          />
        ))}
      <AnimatePresence initial={false}>
        {!drill && reached(turn, "stats") && (
          <Reveal key="stats">
            <FittedStats />
          </Reveal>
        )}
        {reached(turn, "chart") && (
          <Reveal key="chart">
            {drill ? (
              <ChartCard
                type="donut"
                title="Activated workspaces by plan"
                subtitle="Week 45"
                total="1,425"
                data={{
                  labels: ["Activated"],
                  series: [
                    { id: "team", label: "Team", values: [584] },
                    { id: "free", label: "Free", values: [512] },
                    { id: "business", label: "Business", values: [228] },
                    { id: "ent", label: "Enterprise", values: [101] },
                  ],
                }}
                className="max-w-none"
              />
            ) : (
              <ChartCard
                type="area"
                title="7-day activation by signup week"
                subtitle="Onboarding v2 from week 41"
                total="41.8%"
                format={(v) => `${v}%`}
                data={{
                  labels: weeks,
                  series: [
                    {
                      id: "act",
                      label: "Activated",
                      values: [33.4, 34.1, 35, 34.2, 35.2, 38.1, 40.3, 41.2, 42, 41.8],
                    },
                    {
                      id: "inv",
                      label: "Invited a teammate",
                      values: [26, 26.8, 27.1, 26.3, 26.9, 27.8, 28.1, 28.9, 29.4, 29.1],
                    },
                  ],
                }}
                className="max-w-none"
              />
            )}
          </Reveal>
        )}
        {reached(turn, "table") && (
          <Reveal key="table">
            {drill ? (
              <FittedTable<Account>
                title="Team accounts activated in week 45"
                subtitle={`${accounts.length} accounts`}
                data={accounts}
                columns={accountColumns}
                keep={["account", "days"]}
                selectable
                selected={selected}
                onSelectedChange={setSelected}
                actions={() => (
                  <Button size="sm" icon={DownloadSimple}>
                    Export
                  </Button>
                )}
              />
            ) : (
              <FittedTable<Cohort>
                title="Weekly cohorts"
                subtitle="Last 6 signup weeks"
                data={cohorts}
                columns={cohortColumns}
                keep={["cohort", "rate", "change"]}
              />
            )}
          </Reveal>
        )}
      </AnimatePresence>
    </div>
  );
}

const ask = (s: State, text: string, kind: Turn["kind"], minute: number): State => ({
  status: "streaming",
  turns: [
    ...s.turns,
    { id: `u${s.turns.length}`, role: "user", at: at(minute), text, kind, phase: "done" },
    {
      id: `a${s.turns.length}`,
      role: "assistant",
      at: at(minute),
      text: "",
      kind,
      phase: "query",
    },
  ],
});

const patchLast = (s: State, patch: Partial<Turn>): State => ({
  ...s,
  turns: s.turns.map((t, i) => (i === s.turns.length - 1 ? { ...t, ...patch } : t)),
});

const answerSteps = (full: string): MockStep<State>[] => [
  wait(1500),
  { delay: 0, apply: (s) => patchLast(s, { phase: "text" }) },
  ...streamText<State>(strip(full), (s, text) => patchLast(s, { text }), {
    interval: 22,
    startDelay: 200,
  }),
  { delay: 250, apply: (s) => patchLast(s, { text: full, phase: "stats" }) },
  { delay: 700, apply: (s) => patchLast(s, { phase: "chart" }) },
  { delay: 700, apply: (s) => patchLast(s, { phase: "table" }) },
  { delay: 400, apply: (s) => ({ ...patchLast(s, { phase: "done" }), status: "idle" }) },
];

const firstQuestion = "How did activation change after the new onboarding?";
const drillQuestion = "Break activation down by plan";

const overviewDone: Turn[] = [
  {
    id: "u0",
    role: "user",
    at: at(2),
    text: firstQuestion,
    kind: "overview",
    phase: "done",
  },
  {
    id: "a0",
    role: "assistant",
    at: at(2),
    text: overviewText,
    kind: "overview",
    phase: "done",
  },
];
const drillDone: Turn[] = [
  ...overviewDone,
  {
    id: "u2",
    role: "user",
    at: at(6),
    text: drillQuestion,
    kind: "drill",
    phase: "done",
  },
  {
    id: "a2",
    role: "assistant",
    at: at(6),
    text: drillText,
    kind: "drill",
    phase: "done",
  },
];

const followUps = [
  { id: "f1", title: drillQuestion },
  { id: "f2", title: "Which step loses the most people?" },
  { id: "f3", title: "Compare with last quarter" },
];

export default function DataAnswerDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const drill = variant === "Drill-down";
  const script: MockStep<State>[] = drill
    ? [
        wait(900),
        { delay: 0, apply: (s) => ask(s, drillQuestion, "drill", 6) },
        ...answerSteps(drillText),
      ]
    : [
        wait(800),
        { delay: 0, apply: (s) => ask(s, firstQuestion, "overview", 2) },
        ...answerSteps(overviewText),
      ];
  // Paused thumbnails show the finished answer; a live run starts from the question.
  const initial: State = autoplay
    ? { turns: drill ? overviewDone : [], status: "idle" }
    : { turns: drill ? drillDone : overviewDone, status: "idle" };
  const { state, setState } = useMockRun<State>(initial, script, { autoplay });

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const play = (text: string) => {
    timers.current.forEach(clearTimeout);
    const kind = text === drillQuestion ? "drill" : "overview";
    setState((s) => ask(s, text, kind, 9));
    let t = 0;
    timers.current = answerSteps(kind === "drill" ? drillText : overviewText).map(
      (step) => {
        t += step.delay;
        return setTimeout(() => setState(step.apply), t);
      },
    );
  };

  const last = state.turns.at(-1);
  const data: DataAnswerData = {
    title: "Onboarding activation",
    model: "opus-5.5",
    user: { name: "Maya Chen" },
    sources: [
      {
        id: "wh",
        name: "Product warehouse",
        detail: "events · 48M rows",
        status: "synced",
      },
      {
        id: "crm",
        name: "CRM accounts",
        detail: "accounts · 12.4k rows",
        status: "syncing",
      },
      {
        id: "bill",
        name: "Billing",
        detail: "subscriptions · 9.8k rows",
        status: "stale",
      },
    ],
    saved: [
      { id: "q1", title: "Weekly active workspaces" },
      { id: "q2", title: "Churn by plan, last 90 days" },
      { id: "q3", title: "Where do trials drop off?" },
    ],
    followUps: last?.kind === "overview" && last.phase === "done" ? followUps : undefined,
    messages: state.turns.map((turn) => ({
      id: turn.id,
      role: turn.role,
      at: turn.at,
      content: turn.role === "user" ? turn.text : <Answer turn={turn} />,
    })),
  };

  return (
    <DataAnswer
      data={data}
      status={state.status}
      onSend={play}
      onStop={() => {
        timers.current.forEach(clearTimeout);
        setState((s) => ({ ...patchLast(s, { phase: "done" }), status: "idle" }));
      }}
    />
  );
}
