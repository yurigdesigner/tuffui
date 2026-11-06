"use client";

import { Kbd, KeyCombo } from "./key-hint";

export default function KeyHintDemo({ variant }: { variant?: string }) {
  if (variant === "Inline") {
    return (
      <div className="flex max-w-sm flex-col gap-3 text-sm text-muted-foreground">
        <p>
          Press <KeyCombo keys="mod+k" /> to search chats, <KeyCombo keys="shift+enter" />{" "}
          for a new line.
        </p>
        <p>
          <Kbd>/</Kbd> opens commands, <Kbd>@</Kbd> mentions a file, <Kbd>Esc</Kbd> stops
          the agent.
        </p>
      </div>
    );
  }
  const rows = [
    ["Search", "mod+k"],
    ["New chat", "mod+shift+o"],
    ["Send", "enter"],
    ["New line", "shift+enter"],
    ["Stop generating", "esc"],
  ];
  return (
    <div className="flex flex-col items-center gap-5">
      <ul className="w-64">
        {rows.map(([label, keys]) => (
          <li
            key={label}
            className="flex items-center justify-between rounded-xl px-3 py-2 text-sm"
          >
            {label}
            <KeyCombo keys={keys} />
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        <KeyCombo keys="mod+k" size="md" />
        <Kbd size="md">A</Kbd>
        <Kbd size="md">↑</Kbd>
      </div>
    </div>
  );
}
