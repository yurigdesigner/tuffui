"use client";

import { Brain, Database, Globe, Wrench } from "@phosphor-icons/react";
import { Accordion, Collapsible } from "@/components/ui/disclosure";

export default function DisclosureDemo({ variant }: { variant?: string }) {
  if (variant === "Single") {
    return (
      <div className="w-full max-w-md">
        <Collapsible title="Thought for 6s" icon={Brain} meta="3 steps">
          Compared sign-ups by country, checked which locales have a reviewed glossary,
          then weighed support volume per language.
        </Collapsible>
      </div>
    );
  }
  return (
    <div className="w-full max-w-md rounded-2xl bg-surface-inset p-1.5">
      <Accordion
        defaultValue={["search"]}
        items={[
          {
            id: "search",
            title: "Web search",
            icon: Globe,
            meta: "4 results",
            content:
              "Searched “onboarding localization best practices” and opened 4 pages.",
          },
          {
            id: "query",
            title: "Database query",
            icon: Database,
            meta: "120ms",
            content:
              "SELECT country, count(*) FROM signups WHERE created_at > now() - 30d …",
          },
          {
            id: "tools",
            title: "Tools used",
            icon: Wrench,
            meta: "2",
            content: "analytics.export, glossary.lookup",
          },
        ]}
      />
    </div>
  );
}
