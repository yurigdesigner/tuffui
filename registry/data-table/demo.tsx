"use client";

import { Envelope, Export } from "@phosphor-icons/react";
import { Button } from "@/components/ui/action-button";
import { StatusPill } from "@/components/ui/status-pill";
import { useMockRun, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { DataTable, type DataColumn, type DataRow } from "./data-table";

type Customer = DataRow & {
  name: string;
  plan: string;
  seats: number;
  mrr: number;
  growth: number;
  health: string;
};

const customers: Customer[] = [
  {
    id: "c1",
    name: "Northwind Labs",
    plan: "Enterprise",
    seats: 420,
    mrr: 18_400,
    growth: 12.4,
    health: "Healthy",
  },
  {
    id: "c2",
    name: "Halcyon Health",
    plan: "Enterprise",
    seats: 310,
    mrr: 14_950,
    growth: 8.1,
    health: "Healthy",
  },
  {
    id: "c3",
    name: "Brightline Freight",
    plan: "Team",
    seats: 188,
    mrr: 9_020,
    growth: -3.2,
    health: "At risk",
  },
  {
    id: "c4",
    name: "Copperleaf Studio",
    plan: "Team",
    seats: 96,
    mrr: 4_610,
    growth: 21.7,
    health: "Healthy",
  },
  {
    id: "c5",
    name: "Ostrava Robotics",
    plan: "Enterprise",
    seats: 240,
    mrr: 12_300,
    growth: 4.9,
    health: "Watch",
  },
  {
    id: "c6",
    name: "Pinecrest Schools",
    plan: "Pro",
    seats: 64,
    mrr: 2_880,
    growth: 15.3,
    health: "Healthy",
  },
  {
    id: "c7",
    name: "Meridian Legal",
    plan: "Team",
    seats: 120,
    mrr: 5_760,
    growth: -8.6,
    health: "At risk",
  },
  {
    id: "c8",
    name: "Saltmarsh Coffee",
    plan: "Pro",
    seats: 22,
    mrr: 990,
    growth: 2.2,
    health: "Healthy",
  },
  {
    id: "c9",
    name: "Quarry & Co",
    plan: "Team",
    seats: 140,
    mrr: 6_720,
    growth: 6.4,
    health: "Watch",
  },
];

const tone = { Healthy: "positive", Watch: "warning", "At risk": "negative" } as const;

const columns: DataColumn<Customer>[] = [
  { key: "name", label: "Customer", sortable: true },
  { key: "plan", label: "Plan", sortable: true },
  { key: "seats", label: "Seats", align: "right", sortable: true },
  {
    key: "mrr",
    label: "MRR",
    align: "right",
    sortable: true,
    format: (v) => `$${Number(v).toLocaleString("en-US")}`,
  },
  {
    key: "growth",
    label: "30d",
    align: "right",
    sortable: true,
    format: (v) => `${Number(v) > 0 ? "+" : ""}${v}%`,
  },
  {
    key: "health",
    label: "Health",
    format: (v) => (
      <StatusPill size="sm" tone={tone[v as keyof typeof tone] ?? "neutral"}>
        {String(v)}
      </StatusPill>
    ),
  },
];

// Selectable demo picks the two at-risk accounts, as an agent would before a follow-up.
const pick: MockStep<string[]>[] = [
  { delay: 1400, apply: () => ["c3"] },
  { delay: 700, apply: (s) => [...s, "c7"] },
];

export default function DataTableDemo({
  variant = "Table",
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const selectable = variant === "Selectable";
  const { state, setState } = useMockRun<string[]>([], selectable ? pick : [], {
    autoplay,
  });

  return (
    <DataTable
      title="Top customers by MRR"
      data={customers}
      columns={columns}
      selectable={selectable}
      selected={state}
      onSelectedChange={setState}
      actions={() => (
        <>
          <Button size="sm" icon={Export}>
            Export
          </Button>
          <Button size="sm" variant="primary" icon={Envelope}>
            Draft follow-up
          </Button>
        </>
      )}
    />
  );
}
