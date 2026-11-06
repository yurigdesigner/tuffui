"use client";

import { useState } from "react";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { FileChanges, type FileChange } from "./file-changes";

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
}: {
  variant?: string;
  autoplay?: boolean;
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
    />
  );
}
