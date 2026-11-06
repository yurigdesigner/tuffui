"use client";

import { useState } from "react";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { ConversationList, type Conversation } from "./conversation-list";

const hours = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

const chats: Conversation[] = [
  {
    id: "glossary",
    title: "Product glossary for translators",
    updatedAt: hours(70),
    pinned: true,
  },
  { id: "de", title: "German onboarding emails", updatedAt: hours(0.2), running: true },
  { id: "og", title: "OG images for the blog", updatedAt: hours(2) },
  { id: "pricing", title: "Pricing page copy review", updatedAt: hours(5) },
  { id: "licenses", title: "npm license audit", updatedAt: hours(27) },
  { id: "cli", title: "Migrate the CLI to commander", updatedAt: hours(30) },
  { id: "release", title: "Release notes for 2.4", updatedAt: hours(80) },
  { id: "invoices", title: "Backfill March invoices", updatedAt: hours(120) },
];

type State = { chats: Conversation[]; active: string };

const script: MockStep<State>[] = [
  wait(1800),
  {
    delay: 0,
    apply: (s) => ({
      ...s,
      chats: s.chats.map((c) => (c.id === "og" ? { ...c, pinned: true } : c)),
    }),
  },
  { delay: 1600, apply: (s) => ({ ...s, active: "pricing" }) },
  {
    delay: 2200,
    apply: (s) => ({
      ...s,
      chats: s.chats.map((c) => (c.id === "de" ? { ...c, running: false } : c)),
    }),
  },
];

export default function ConversationListDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const { state, setState } = useMockRun<State>({ chats, active: "de" }, script, {
    autoplay,
  });
  const [count, setCount] = useState(1);
  const update = (id: string, patch: Partial<Conversation>) =>
    setState((s) => ({
      ...s,
      chats: s.chats.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  const drop = (c: Conversation) =>
    setState((s) => ({ ...s, chats: s.chats.filter((x) => x.id !== c.id) }));

  return (
    <ConversationList
      data={state.chats}
      activeId={state.active}
      variant={variant === "Compact" ? "compact" : "sidebar"}
      onSelect={(c) => setState((s) => ({ ...s, active: c.id }))}
      onNew={() => {
        const id = `new-${count}`;
        setCount((n) => n + 1);
        setState((s) => ({
          active: id,
          chats: [
            { id, title: "New chat", updatedAt: new Date().toISOString() },
            ...s.chats,
          ],
        }));
      }}
      onRename={(c, title) => update(c.id, { title })}
      onPin={(c, pinned) => update(c.id, { pinned })}
      onArchive={drop}
      onDelete={drop}
    />
  );
}
