"use client";

import { Brain, Cpu, Lightning, Robot } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Combobox, Select, type SelectOption } from "@/components/ui/select-field";

const tools: SelectOption[] = [
  { value: "github", label: "github.create_pull_request", description: "GitHub" },
  { value: "issues", label: "github.list_issues", description: "GitHub" },
  { value: "linear", label: "linear.create_issue", description: "Linear" },
  { value: "search", label: "web.search", description: "Built-in" },
  { value: "fetch", label: "web.fetch", description: "Built-in" },
  { value: "query", label: "postgres.query", description: "postgres-analytics" },
  { value: "read", label: "fs.read", description: "filesystem" },
  { value: "write", label: "fs.write", description: "filesystem", disabled: true },
];

export default function SelectFieldDemo({ variant }: { variant?: string }) {
  const [model, setModel] = useState("opus");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  // Pretend the tool search runs on a server: results arrive after a short delay.
  const [results, setResults] = useState(tools);

  useEffect(() => {
    if (variant !== "Combobox") return;
    const timer = setTimeout(() => {
      setResults(tools.filter((t) => t.label.includes(query.toLowerCase())));
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, variant]);

  if (variant === "Combobox") {
    return (
      <div className="flex w-full max-w-xs flex-col gap-4">
        <Combobox
          label="Tool"
          description="Searches every connected MCP server."
          placeholder="Search tools…"
          options={results}
          loading={loading}
          onQueryChange={(q) => {
            setQuery(q);
            setLoading(true);
          }}
          emptyText="No tool matches"
        />
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <Select
        label="Model"
        value={model}
        onValueChange={setModel}
        options={[
          {
            label: "Anthropic",
            options: [
              {
                value: "opus",
                label: "opus-5.5",
                icon: Brain,
                description: "Deep reasoning",
              },
              {
                value: "sonnet",
                label: "sonnet-5.5",
                icon: Cpu,
                description: "Fast and capable",
              },
              {
                value: "haiku",
                label: "haiku-5.5",
                icon: Lightning,
                description: "Quick edits",
              },
            ],
          },
          {
            label: "Local",
            options: [
              { value: "local", label: "llama-local", icon: Robot, disabled: true },
            ],
          },
        ]}
      />
      <Select
        label="Reply language"
        placeholder="Choose a language"
        error="Pick a language before sending."
        options={[
          { value: "en", label: "English" },
          { value: "de", label: "German" },
          { value: "ja", label: "Japanese" },
        ]}
      />
    </div>
  );
}
