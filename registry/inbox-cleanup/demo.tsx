"use client";

import { animate } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { EASE_IN_OUT } from "@/lib/motion-tokens";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { InboxCleanup, inZone, type InboxSender, type InboxZone } from "./inbox-cleanup";

/** Newsletters over the last 90 days: emails a week and the share opened. */
const SENDERS: InboxSender[] = [
  // The unsubscribe zone: frequent and rarely opened.
  { id: "daily-brief", name: "The Daily Brief", perWeek: 7, openRate: 0.02 },
  { id: "morning-ping", name: "Morning Ping", perWeek: 10, openRate: 0.03 },
  { id: "deal-radar", name: "Deal Radar", perWeek: 9, openRate: 0.05 },
  { id: "growth-notes", name: "Growth Notes", perWeek: 6, openRate: 0.06 },
  { id: "market-pulse", name: "Market Pulse", perWeek: 6, openRate: 0.04 },
  { id: "flash-picks", name: "Flash Picks", perWeek: 5, openRate: 0.08 },
  // Close to the zone, but not in it.
  { id: "product-drops", name: "Product Drops", perWeek: 3.5, openRate: 0.05 },
  { id: "builder-digest", name: "Builder Digest", perWeek: 5, openRate: 0.13 },
  { id: "rate-watch", name: "Rate Watch", perWeek: 8, openRate: 0.16 },
  { id: "coupon-club", name: "Coupon Club", perWeek: 2.5, openRate: 0.03 },
  // Often, and read.
  { id: "team-standup", name: "Team Standup", perWeek: 10.5, openRate: 0.62 },
  { id: "city-desk", name: "City Desk", perWeek: 7.5, openRate: 0.34 },
  { id: "the-margin", name: "The Margin", perWeek: 5.5, openRate: 0.41 },
  { id: "signal-check", name: "Signal Check", perWeek: 6.5, openRate: 0.22 },
  { id: "launch-log", name: "Launch Log", perWeek: 4.5, openRate: 0.28 },
  { id: "inbox-zero", name: "Inbox Zero Tips", perWeek: 9.5, openRate: 0.11 },
  { id: "field-guide", name: "Field Guide", perWeek: 4, openRate: 0.55 },
  // Now and then.
  { id: "weekend-reads", name: "Weekend Reads", perWeek: 1, openRate: 0.78 },
  { id: "long-view", name: "The Long View", perWeek: 1, openRate: 0.92 },
  { id: "design-mail", name: "Design Mail", perWeek: 1.5, openRate: 0.66 },
  { id: "quiet-hours", name: "Quiet Hours", perWeek: 0.5, openRate: 0.71 },
  { id: "pocket-maps", name: "Pocket Maps", perWeek: 0.5, openRate: 0.38 },
  { id: "garden-letters", name: "Garden Letters", perWeek: 1, openRate: 0.45 },
  { id: "ledger", name: "The Ledger", perWeek: 2, openRate: 0.52 },
  { id: "small-print", name: "Small Print", perWeek: 2, openRate: 0.27 },
  { id: "recipe-box", name: "Recipe Box", perWeek: 3, openRate: 0.36 },
  { id: "night-shift", name: "Night Shift", perWeek: 2.5, openRate: 0.19 },
  { id: "open-roles", name: "Open Roles", perWeek: 3, openRate: 0.12 },
  { id: "foundry", name: "Foundry Notes", perWeek: 1.5, openRate: 0.24 },
  { id: "parcel", name: "Parcel Updates", perWeek: 3.5, openRate: 0.85 },
  { id: "trail-report", name: "Trail Report", perWeek: 0.5, openRate: 0.14 },
  { id: "almanac", name: "The Almanac", perWeek: 1, openRate: 0.07 },
  { id: "studio-hours", name: "Studio Hours", perWeek: 2, openRate: 0.09 },
  { id: "event-board", name: "Event Board", perWeek: 1.5, openRate: 0.04 },
  { id: "quarterly", name: "Quarterly Letter", perWeek: 0.5, openRate: 0.96 },
  { id: "patch-notes", name: "Patch Notes", perWeek: 2.5, openRate: 0.58 },
  { id: "book-club", name: "Book Club", perWeek: 1, openRate: 0.31 },
  { id: "travel-desk", name: "Travel Desk", perWeek: 3, openRate: 0.2 },
  { id: "hiring-pulse", name: "Hiring Pulse", perWeek: 4.5, openRate: 0.17 },
  { id: "podcast-picks", name: "Podcast Picks", perWeek: 2, openRate: 0.15 },
];

const ZONE: InboxZone = { minPerWeek: 4, maxOpenRate: 0.1 };

type State = {
  ready: boolean;
  pointed: string | null;
  excluded: string[];
  /** Where the script drags the zone's top edge to. */
  top: number;
};

const SETTLED: State = {
  ready: true,
  pointed: "daily-brief",
  excluded: ["flash-picks"],
  top: ZONE.maxOpenRate,
};

export default function InboxCleanupDemo({
  autoplay = true,
  thumbnail = false,
}: {
  variant?: string;
  autoplay?: boolean;
  thumbnail?: boolean;
}) {
  // Dots land, the zone draws in and its senders turn accent, the agent points
  // at the worst offender, then keeps one sender off the list.
  const steps: MockStep<State>[] = autoplay
    ? [
        wait(1000),
        { delay: 0, apply: (s) => ({ ...s, ready: true }) },
        { delay: 1300, apply: (s) => ({ ...s, pointed: "daily-brief" }) },
        { delay: 1700, apply: (s) => ({ ...s, excluded: ["flash-picks"] }) },
        // The top edge gets a tug: up to take in Builder Digest, down past
        // Flash Picks, then back to 10%.
        { delay: 1100, apply: (s) => ({ ...s, top: 0.145 }) },
        { delay: 1100, apply: (s) => ({ ...s, top: 0.072 }) },
        { delay: 1100, apply: (s) => ({ ...s, top: ZONE.maxOpenRate }) },
      ]
    : [];
  const { state } = useMockRun<State>(
    autoplay
      ? { ready: false, pointed: null, excluded: [], top: ZONE.maxOpenRate }
      : SETTLED,
    steps,
    { autoplay },
  );

  const [zone, setZone] = useState(ZONE);
  // Once someone moves the zone, the script stops steering it.
  const [zoneTouched, setZoneTouched] = useState(false);
  // The top edge as last drawn, so a new tug starts where the last one ended.
  const topRef = useRef(ZONE.maxOpenRate);
  useEffect(() => {
    if (zoneTouched) return;
    const from = topRef.current;
    if (from === state.top) return;
    // Glide on the log scale the axis uses, so the edge moves evenly.
    const controls = animate(Math.log(from), Math.log(state.top), {
      duration: 0.6,
      ease: EASE_IN_OUT,
      onUpdate: (v) => {
        topRef.current = Math.exp(v);
        setZone((z) => ({ ...z, maxOpenRate: topRef.current }));
      },
    });
    return () => controls.stop();
  }, [state.top, zoneTouched]);
  // Once someone checks a box, the script stops steering the selection.
  const [excluded, setExcluded] = useState<string[] | null>(null);
  const off = excluded ?? state.excluded;
  const selectedIds = SENDERS.filter((s) => inZone(s, zone) && !off.includes(s.id)).map(
    (s) => s.id,
  );

  return (
    <InboxCleanup
      senders={SENDERS}
      status={state.ready ? "ready" : "analyzing"}
      zone={zone}
      onZoneChange={(z) => {
        setZoneTouched(true);
        setZone(z);
      }}
      selectedIds={selectedIds}
      onSelectedChange={(ids) =>
        setExcluded(
          SENDERS.filter((s) => inZone(s, zone) && !ids.includes(s.id)).map((s) => s.id),
        )
      }
      highlightedId={state.pointed}
      list={!thumbnail}
      intro={autoplay}
      onUnsubscribe={() => {}}
      onKeep={() => {}}
      onDigest={() => {}}
    />
  );
}
