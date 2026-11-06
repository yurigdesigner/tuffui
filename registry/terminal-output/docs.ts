import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { TerminalOutput, type TerminalRun } from "@/components/ui/terminal-output";

export function CommandOutput({ run }: { run: TerminalRun }) {
  // Append lines as the sandbox streams them:
  // { text: chunk, stream: "stdout" | "stderr" }
  return (
    <TerminalOutput
      data={run}
      onStop={() => sandbox.kill(run.command)}
      onCopy={(text) => analytics.track("terminal_copied", { bytes: text.length })}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "TerminalRun",
      required: true,
      description:
        "The command, its output lines and status. While running, the header counts up on its own.",
    },
    {
      name: "onStop",
      type: "() => void",
      description: "Shows a Stop button while the command runs. Kill the process here.",
    },
    {
      name: "onCopy",
      type: "(text: string) => void",
      description: "Called with the full output after it is copied to the clipboard.",
    },
    {
      name: "maxHeight",
      type: "number",
      default: "280",
      description:
        "Height in px after which the output scrolls. Scrolling up pauses auto-follow and shows Jump to latest.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root section.",
    },
  ],
  types: `type TerminalRun = {
  command: string;
  cwd?: string;
  lines: TerminalLine[];
  status: "running" | "success" | "failed";
  exitCode?: number;
  durationMs?: number; // final duration
};

type TerminalLine = {
  text: string;
  stream?: "stdout" | "stderr" | "info"; // stderr is tinted and marked
};`,
};
