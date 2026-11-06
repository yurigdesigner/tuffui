"use client";

import { Spinner, Thinking } from "./loader";

export default function LoaderDemo({ variant }: { variant?: string }) {
  if (variant === "Thinking") {
    return (
      <div className="flex flex-col items-start gap-5">
        <Thinking size="sm" />
        <Thinking />
        <Thinking size="lg" words={["Thinking", "Searching the docs", "Writing"]} />
        <Thinking words={["Reading 12 files", "Running tests", "Summarizing"]} />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start gap-5">
      <div className="flex items-center gap-6">
        <Spinner size="sm" />
        <Spinner />
        <Spinner size="lg" />
      </div>
      <Spinner showLabel label="Loading history" />
      <Spinner size="sm" showLabel label="Uploading 3 files" />
    </div>
  );
}
