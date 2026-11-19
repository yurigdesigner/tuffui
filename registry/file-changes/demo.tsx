"use client";

import { useState } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { FileChanges, type FileChange, type FileChangesLabels } from "./file-changes";

/** Arabic noun after a numeral: 1, 2 and 3–10 pick their forms; 11+ the singular. */
const arCount = (n: number, one: string, two: string, few: string, many: string) =>
  n === 1 ? one : n === 2 ? two : n >= 3 && n <= 10 ? few : many;

/** Code and paths stay as they are; Hebrew and Arabic show the RTL layout. */
const labels: Record<DemoLocale, Partial<FileChangesLabels> | undefined> = {
  en: undefined,
  he: {
    status: { added: "נוסף", modified: "שונה", deleted: "נמחק", renamed: "שונה שם" },
    line: (n) => `שורה ${n}`,
    reverted: "בוטל",
    hunk: (n) => `שורות החל מ־${n}`,
    keepOrRevert: "לשמור או לבטל את הקטע",
    keep: "לשמור",
    revert: "לבטל",
    added: "נוסף: ",
    removed: "הוסר: ",
    root: "תיקיית השורש",
    from: (path) => `לשעבר ${path}`,
    files: "קבצים ששונו",
    region: "שינויים בקבצים",
    empty: "אין שינויים לבדיקה",
    kept: "הקטע נשמר",
    revertedStatus: "הקטע בוטל",
    applyingStatus: (kept, total) => `מחילים ${kept} מתוך ${total} קטעים`,
    summary: (kept, total, files, roll) => (
      <>
        יוחלו {roll(String(kept), true)} מתוך {roll(String(total), true)} קטעים ב־
        {roll(String(files))} {files === 1 ? "קובץ" : "קבצים"}
      </>
    ),
    discard: "לבטל הכול",
    apply: "החלה",
    applying: "מחילים…",
  },
  ar: {
    status: {
      added: "مُضاف",
      modified: "مُعدَّل",
      deleted: "محذوف",
      renamed: "مُعاد تسميته",
    },
    line: (n) => `السطر ${n}`,
    reverted: "تم التراجع",
    hunk: (n) => `الأسطر بدءًا من ${n}`,
    keepOrRevert: "الإبقاء على هذا المقطع أو التراجع عنه",
    keep: "إبقاء",
    revert: "تراجع",
    added: "مُضاف: ",
    removed: "محذوف: ",
    root: "الجذر",
    from: (path) => `سابقًا ${path}`,
    files: "الملفات المعدّلة",
    region: "تغييرات الملفات",
    empty: "لا توجد تغييرات للمراجعة",
    kept: "تم الإبقاء على المقطع",
    revertedStatus: "تم التراجع عن المقطع",
    applyingStatus: (kept, total) =>
      `جارٍ تطبيق ${kept} من ${total} ${arCount(total, "مقطع", "مقاطع", "مقاطع", "مقطعًا")}`,
    summary: (kept, total, files, roll) => (
      <>
        سيُطبَّق {roll(String(kept), true)} من {roll(String(total), true)}{" "}
        {arCount(total, "مقطع", "مقاطع", "مقاطع", "مقطعًا")} في {roll(String(files))}{" "}
        {arCount(files, "ملف", "ملفات", "ملفات", "ملفًا")}
      </>
    ),
    discard: "تجاهل الكل",
    apply: "تطبيق",
    applying: "جارٍ التطبيق…",
  },
};

// An agent migrating a CLI from yargs to commander.
const files: FileChange[] = [
  {
    id: "cli",
    path: "src/cli.ts",
    status: "modified",
    hunks: [
      {
        id: "imports",
        oldStart: 1,
        newStart: 1,
        lines: [
          { type: "remove", text: 'import yargs from "yargs";' },
          { type: "remove", text: 'import { hideBin } from "yargs/helpers";' },
          { type: "add", text: 'import { Command } from "commander";' },
          { type: "context", text: 'import { build } from "./commands/build";' },
        ],
      },
      {
        id: "program",
        oldStart: 8,
        newStart: 7,
        lines: [
          { type: "remove", text: "yargs(hideBin(process.argv))" },
          {
            type: "remove",
            text: '  .command("build <dir>", "Build a site", {}, build)',
          },
          { type: "remove", text: "  .strict()" },
          { type: "remove", text: "  .parse();" },
          { type: "add", text: 'const program = new Command("pressd");' },
          { type: "add", text: 'program.command("build <dir>").action(build);' },
          { type: "add", text: "program.parse();" },
        ],
      },
    ],
  },
  {
    id: "build",
    path: "src/commands/build.ts",
    status: "modified",
    hunks: [
      {
        id: "signature",
        oldStart: 12,
        newStart: 12,
        lines: [
          {
            type: "remove",
            text: "export async function build(argv: { dir: string }) {",
          },
          { type: "add", text: "export async function build(dir: string) {" },
          { type: "remove", text: "  const root = resolve(argv.dir);" },
          { type: "add", text: "  const root = resolve(dir);" },
        ],
      },
    ],
  },
  {
    id: "watch",
    path: "src/commands/watch.ts",
    status: "added",
    hunks: [
      {
        id: "new",
        oldStart: 0,
        newStart: 1,
        lines: [
          { type: "add", text: 'import { watch as fsWatch } from "node:fs";' },
          { type: "add", text: "" },
          { type: "add", text: "export function watch(dir: string) {" },
          { type: "add", text: "  fsWatch(dir, { recursive: true }, () => build(dir));" },
          { type: "add", text: "}" },
        ],
      },
    ],
  },
  {
    id: "args",
    path: "src/legacy/args.ts",
    status: "deleted",
    hunks: [
      {
        id: "all",
        oldStart: 1,
        newStart: 0,
        lines: [
          { type: "remove", text: "// Shared yargs option builders." },
          {
            type: "remove",
            text: 'export const dirOption = { type: "string" } as const;',
          },
          {
            type: "remove",
            text: 'export const verbose = { alias: "v", type: "boolean" } as const;',
          },
        ],
      },
    ],
  },
  {
    id: "pkg",
    path: "package.json",
    status: "modified",
    hunks: [
      {
        id: "deps",
        oldStart: 21,
        newStart: 21,
        lines: [
          { type: "context", text: '  "dependencies": {' },
          { type: "remove", text: '    "yargs": "^17.7.2",' },
          { type: "add", text: '    "commander": "^13.1.0",' },
          { type: "context", text: '    "picocolors": "^1.1.0"' },
        ],
      },
    ],
  },
];

type State = { files: FileChange[]; selectedId: string };

const script: MockStep<State>[] = [
  ...files.slice(1).map((file) => ({
    delay: 500,
    apply: (s: State) => ({ ...s, files: [...s.files, file] }),
  })),
  wait(2200),
  { delay: 0, apply: (s) => ({ ...s, selectedId: "build" }) },
  wait(2200),
  { delay: 0, apply: (s) => ({ ...s, selectedId: "args" }) },
];

export default function FileChangesDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  // The paused thumbnail shows the finished list.
  const { state, setState } = useMockRun<State>(
    { files: autoplay ? files.slice(0, 1) : files, selectedId: "cli" },
    script,
    { autoplay },
  );
  const [applying, setApplying] = useState(false);

  return (
    <FileChanges
      data={state.files}
      view={variant === "Stacked" ? "stacked" : "split"}
      selectedId={state.selectedId}
      onSelectedChange={(selectedId) => setState((s) => ({ ...s, selectedId }))}
      applying={applying}
      onApply={() => {
        setApplying(true);
        setTimeout(() => setApplying(false), 1400);
      }}
      onDiscard={() => setState((s) => ({ ...s, files: [] }))}
      labels={labels[locale]}
    />
  );
}
