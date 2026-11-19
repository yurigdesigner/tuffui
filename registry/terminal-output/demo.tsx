"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  TerminalOutput,
  type TerminalLine,
  type TerminalOutputLabels,
  type TerminalRun,
} from "./terminal-output";

/** Arabic noun after a numeral: 1, 2 and 3–10 pick their forms; 11+ the singular. */
const arCount = (n: number, one: string, two: string, few: string, many: string) =>
  n === 1 ? one : n === 2 ? two : n >= 3 && n <= 10 ? few : many;

/** The command and its output stay as they are; only the chrome is translated. */
const labels: Record<DemoLocale, Partial<TerminalOutputLabels> | undefined> = {
  en: undefined,
  he: {
    running: "רץ",
    exit: (code) => `קוד יציאה ${code}`,
    region: (command) => `טרמינל: ${command}`,
    output: (command) => `הפלט של ${command}`,
    waiting: "ממתין לפלט…",
    error: "שגיאה: ",
    jump: "לשורה האחרונה",
    lines: (n, count) => (count === 1 ? <>שורה {n}</> : <>{n} שורות</>),
    copy: "העתקה",
    copied: "הועתק",
    stop: "עצירה",
    finished: (command, success, code, time) =>
      `${command} ${success ? "הסתיים" : "נכשל"} עם קוד יציאה ${code} אחרי ${time}`,
  },
  ar: {
    running: "قيد التشغيل",
    exit: (code) => `رمز الخروج ${code}`,
    region: (command) => `الطرفية: ${command}`,
    output: (command) => `مخرجات ${command}`,
    waiting: "في انتظار المخرجات…",
    error: "خطأ: ",
    jump: "الانتقال إلى الأحدث",
    lines: (n, count) => (
      <>
        {n} {arCount(count, "سطر", "أسطر", "أسطر", "سطرًا")}
      </>
    ),
    copy: "نسخ",
    copied: "تم النسخ",
    stop: "إيقاف",
    finished: (command, success, code, time) =>
      `${success ? "اكتمل" : "فشل"} ${command} برمز الخروج ${code} بعد ${time}`,
  },
};

const out = (text: string): TerminalLine => ({ text });
const info = (text: string): TerminalLine => ({ text, stream: "info" });
const err = (text: string): TerminalLine => ({ text, stream: "stderr" });

const passing: TerminalLine[] = [
  info("> pressd@3.1.0 test"),
  info("> vitest run"),
  out(""),
  out(" RUN  v3.2.4 /repo/packages/cli"),
  out(""),
  out(" ✓ test/commands/build.spec.ts (6 tests) 41ms"),
  out(" ✓ test/commands/watch.spec.ts (12 tests) 118ms"),
  out(" ✓ test/config/load.spec.ts (9 tests) 87ms"),
  out(" ✓ test/plugins/markdown.spec.ts (14 tests) 203ms"),
  out(" ✓ test/plugins/images.spec.ts (7 tests) 52ms"),
  out(" ✓ test/router.spec.ts (11 tests) 96ms"),
  out(" ✓ test/dev-server.spec.ts (8 tests) 74ms"),
  out(" ✓ test/cli.spec.ts (5 tests) 61ms"),
  out(""),
  out(" Test Files  8 passed (8)"),
  out("      Tests  72 passed (72)"),
  out("   Duration  3.84s"),
];

const failing: TerminalLine[] = [
  ...passing.slice(0, 7),
  err(
    " ✗ test/config/load.spec.ts > defaults > resolves outDir relative to the config file",
  ),
  err("   AssertionError: expected '/repo/dist' to be '/repo/site/dist'"),
  err("    ❯ test/config/load.spec.ts:48:31"),
  out(" ✓ test/plugins/markdown.spec.ts (14 tests) 203ms"),
  out(" ✓ test/plugins/images.spec.ts (7 tests) 52ms"),
  out(""),
  err(" Test Files  1 failed | 5 passed (6)"),
  out("      Tests  1 failed | 53 passed (54)"),
  out("   Duration  2.91s"),
];

const build = (lines: TerminalLine[], durationMs: number, exitCode: number) => {
  const steps: MockStep<TerminalRun>[] = [wait(500)];
  lines.forEach((line, i) =>
    steps.push({
      delay: 140 + ((i * 7) % 5) * 70,
      apply: (s) => (s.status === "running" ? { ...s, lines: [...s.lines, line] } : s),
    }),
  );
  steps.push({
    delay: 300,
    // A run the viewer stopped stays stopped.
    apply: (s) =>
      s.status === "running"
        ? { ...s, status: exitCode === 0 ? "success" : "failed", exitCode, durationMs }
        : s,
  });
  return steps;
};

export default function TerminalOutputDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const failed = variant === "Failed";
  const lines = failed ? failing : passing;
  const base = { command: "pnpm test", cwd: "~/repo/packages/cli" };
  // The paused thumbnail shows the finished run.
  const initial: TerminalRun = autoplay
    ? { ...base, lines: [], status: "running" }
    : {
        ...base,
        lines,
        status: failed ? "failed" : "success",
        exitCode: failed ? 1 : 0,
        durationMs: 3_840,
      };
  const { state, setState } = useMockRun<TerminalRun>(
    initial,
    build(lines, failed ? 2_910 : 3_840, failed ? 1 : 0),
    { autoplay },
  );

  return (
    <TerminalOutput
      data={state}
      maxHeight={240}
      labels={labels[locale]}
      onStop={() =>
        setState((s) => ({
          ...s,
          lines: [...s.lines, info("^C")],
          status: "failed",
          exitCode: 130,
          durationMs: 1_200,
        }))
      }
    />
  );
}
