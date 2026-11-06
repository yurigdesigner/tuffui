"use client";

import { useState } from "react";
import { SearchField, TextArea, TextField } from "@/components/ui/text-field";

export default function TextFieldDemo({ variant }: { variant?: string }) {
  const [query, setQuery] = useState("glossary");

  if (variant === "States") {
    return (
      <div className="flex w-full max-w-sm flex-col gap-4">
        <TextField
          label="API key"
          defaultValue="sk-live-12"
          error="That key is too short."
        />
        <TextField label="Disabled" defaultValue="opus-5.5" disabled />
      </div>
    );
  }
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <SearchField
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={() => setQuery("")}
        placeholder="Search memories"
      />
      <TextField
        label="Agent name"
        placeholder="release-notes"
        description="Shown in traces and approvals."
      />
      <TextArea label="Instructions" placeholder="Keep product names in English…" />
    </div>
  );
}
