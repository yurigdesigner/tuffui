"use client";

import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { AttachmentPreview, type Attachment } from "./attachment-preview";

// Inline SVG placeholders stand in for screenshots the user dropped in.
const shot = (from: string, to: string, label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="160" height="160" fill="url(#g)"/><rect x="20" y="24" width="120" height="14" rx="7" fill="white" fill-opacity=".5"/><rect x="20" y="48" width="80" height="10" rx="5" fill="white" fill-opacity=".35"/><rect x="20" y="96" width="120" height="40" rx="10" fill="white" fill-opacity=".25"/><text x="20" y="150" font-family="sans-serif" font-size="10" fill="white" fill-opacity=".7">${label}</text></svg>`,
  )}`;

const ready: Attachment[] = [
  {
    id: "a",
    name: "onboarding-de.png",
    size: 412_000,
    type: "image/png",
    src: shot("#0a84ff", "#5e5ce6", "Willkommen"),
    alt: "German onboarding screen",
  },
  {
    id: "b",
    name: "plan-picker.png",
    size: 286_000,
    type: "image/png",
    src: shot("#30d158", "#40c8e0", "Tarife"),
    alt: "Plan picker with shortened labels",
  },
  { id: "c", name: "glossary.csv", size: 18_400, type: "text/csv" },
  { id: "d", name: "e2e-report.pdf", size: 1_240_000, type: "application/pdf" },
];

type State = { files: Attachment[] };

const progress = (id: string, value: number, delay = 260): MockStep<State> => ({
  delay,
  apply: (s) => ({
    files: s.files.map((f) =>
      f.id === id
        ? value >= 1
          ? { ...f, status: "ready", progress: 1 }
          : { ...f, status: "uploading", progress: value }
        : f,
    ),
  }),
});

const uploading: Attachment[] = [
  { ...ready[0], status: "uploading", progress: 0 },
  {
    id: "e",
    name: "session-recording.mov",
    size: 48_600_000,
    type: "video/quicktime",
    status: "uploading",
    progress: 0,
  },
  { ...ready[2], status: "uploading", progress: 0 },
];

const script: MockStep<State>[] = [
  wait(500),
  progress("a", 0.3),
  progress("c", 0.6, 120),
  progress("e", 0.08, 120),
  progress("a", 0.7),
  progress("c", 1, 120),
  progress("e", 0.16, 120),
  progress("a", 1),
  progress("e", 0.21),
  {
    delay: 600,
    apply: (s) => ({
      files: s.files.map((f) =>
        f.id === "e" ? { ...f, status: "failed", error: "Over the 25 MB limit" } : f,
      ),
    }),
  },
];

export default function AttachmentPreviewDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const live = variant === "Uploading";
  const { state, setState } = useMockRun<State>(
    { files: live ? uploading : ready },
    live ? script : [],
    { autoplay },
  );

  return (
    <AttachmentPreview
      className="max-w-lg"
      data={state.files}
      onRemove={(a) => setState((s) => ({ files: s.files.filter((f) => f.id !== a.id) }))}
      onRetry={(a) =>
        setState((s) => ({
          files: s.files.map((f) =>
            f.id === a.id
              ? { ...f, status: "uploading", progress: 0.4, error: undefined }
              : f,
          ),
        }))
      }
    />
  );
}
