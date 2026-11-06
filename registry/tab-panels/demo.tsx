"use client";

import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/tab-panels";

const panel = "rounded-2xl bg-surface-inset p-4 text-[0.8125rem] text-muted-foreground";

export default function TabPanelsDemo({ variant }: { variant?: string }) {
  const pills = variant === "Pills";
  return (
    <div className="w-full max-w-md">
      <Tabs defaultValue="answer" variant={pills ? "pills" : "default"}>
        <TabList label="Response">
          <Tab value="answer">Answer</Tab>
          <Tab value="sources" count={6}>
            Sources
          </Tab>
          <Tab value="steps" count={4}>
            Steps
          </Tab>
          <Tab value="raw" disabled>
            Raw
          </Tab>
        </TabList>
        <TabPanel value="answer" className={panel}>
          Ship German first: 38% of trial sign-ups last month came from DACH, and the
          glossary is already reviewed.
        </TabPanel>
        <TabPanel value="sources" lazy className={panel}>
          6 sources — analytics export, glossary, two support threads and the pricing
          page.
        </TabPanel>
        <TabPanel value="steps" lazy className={panel}>
          Queried sign-ups by country, checked translation coverage, compared support
          volume.
        </TabPanel>
      </Tabs>
    </div>
  );
}
