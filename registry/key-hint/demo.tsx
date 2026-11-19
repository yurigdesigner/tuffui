"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { Kbd, KeyCombo, type KeyHintLabels } from "./key-hint";

type Copy = {
  rows: [label: string, keys: string][];
  /** Inline sentences, split around the key chips. */
  press: string;
  toSearch: string;
  newLine: string;
  opensCommands: string;
  mentionsFile: string;
  stopsAgent: string;
  labels?: Partial<KeyHintLabels>;
};

const copy: Record<DemoLocale, Copy> = {
  en: {
    rows: [
      ["Search", "mod+k"],
      ["New chat", "mod+shift+o"],
      ["Send", "enter"],
      ["New line", "shift+enter"],
      ["Stop generating", "esc"],
    ],
    press: "Press",
    toSearch: "to search chats,",
    newLine: "for a new line.",
    opensCommands: "opens commands,",
    mentionsFile: "mentions a file,",
    stopsAgent: "stops the agent.",
  },
  he: {
    rows: [
      ["חיפוש", "mod+k"],
      ["צ׳אט חדש", "mod+shift+o"],
      ["שליחה", "enter"],
      ["שורה חדשה", "shift+enter"],
      ["עצירת התשובה", "esc"],
    ],
    press: "הקישו",
    toSearch: "כדי לחפש בצ׳אטים,",
    newLine: "לשורה חדשה.",
    opensCommands: "פותח פקודות,",
    mentionsFile: "מאזכר קובץ,",
    stopsAgent: "עוצר את הסוכן.",
    labels: {
      command: "Command",
      control: "Control",
      option: "Option",
      shift: "Shift",
      enter: "Enter",
      up: "חץ למעלה",
      down: "חץ למטה",
      left: "חץ שמאלה",
      right: "חץ ימינה",
      backspace: "Backspace",
    },
  },
  ar: {
    rows: [
      ["بحث", "mod+k"],
      ["محادثة جديدة", "mod+shift+o"],
      ["إرسال", "enter"],
      ["سطر جديد", "shift+enter"],
      ["إيقاف التوليد", "esc"],
    ],
    press: "اضغط",
    toSearch: "للبحث في المحادثات،",
    newLine: "لسطر جديد.",
    opensCommands: "يفتح الأوامر،",
    mentionsFile: "يشير إلى ملف،",
    stopsAgent: "يوقف الوكيل.",
    labels: {
      command: "Command",
      control: "Control",
      option: "Option",
      shift: "Shift",
      enter: "Enter",
      up: "السهم لأعلى",
      down: "السهم لأسفل",
      left: "السهم لليسار",
      right: "السهم لليمين",
      backspace: "Backspace",
    },
  },
};

export default function KeyHintDemo({
  variant,
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  if (variant === "Inline") {
    return (
      <div className="flex max-w-sm flex-col gap-3 text-sm text-muted-foreground">
        <p>
          {text.press} <KeyCombo keys="mod+k" labels={text.labels} /> {text.toSearch}{" "}
          <KeyCombo keys="shift+enter" labels={text.labels} /> {text.newLine}
        </p>
        <p>
          <Kbd>/</Kbd> {text.opensCommands} <Kbd>@</Kbd> {text.mentionsFile}{" "}
          <Kbd>Esc</Kbd> {text.stopsAgent}
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-5">
      <ul className="w-64">
        {text.rows.map(([label, keys]) => (
          <li
            key={keys}
            className="flex items-center justify-between rounded-xl px-3 py-2 text-sm"
          >
            {label}
            <KeyCombo keys={keys} labels={text.labels} />
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        <KeyCombo keys="mod+k" size="md" labels={text.labels} />
        <Kbd size="md">A</Kbd>
        <Kbd size="md">↑</Kbd>
      </div>
    </div>
  );
}
