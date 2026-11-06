import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { DataTable, type DataColumn } from "@/components/ui/data-table";

const columns: DataColumn<Customer>[] = [
  { key: "name", label: "Customer", sortable: true },
  { key: "mrr", label: "MRR", align: "right", sortable: true, format: (v) => \`$\${v}\` },
];

// Render a table when a tool returns rows.
export function CustomersAnswer({ rows }: { rows: Customer[] }) {
  return (
    <DataTable
      title="Top customers by MRR"
      data={rows}
      columns={columns}
      selectable
      actions={(ids) => <Button onClick={() => agent.followUp(ids)}>Draft follow-up</Button>}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "R[]",
      required: true,
      description:
        "Rows. Each needs a unique `id`; other fields are strings, numbers or null.",
    },
    {
      name: "columns",
      type: "DataColumn<R>[]",
      required: true,
      description: "Column order, labels, alignment, display format and which ones sort.",
    },
    {
      name: "title",
      type: "string",
      required: true,
      description: "Header title and table caption.",
    },
    {
      name: "subtitle",
      type: "string",
      description: "Replaces the default row count under the title.",
    },
    { name: "pageSize", type: "number", default: "6", description: "Rows per page." },
    {
      name: "searchable",
      type: "boolean",
      default: "true",
      description: "Shows the filter field above the table.",
    },
    {
      name: "selectable",
      type: "boolean",
      default: "false",
      description: "Adds row checkboxes and a bulk action bar.",
    },
    {
      name: "selected",
      type: "string[]",
      description: "Controlled selection by row id.",
    },
    {
      name: "onSelectedChange",
      type: "(ids: string[]) => void",
      description: "Called when the selection changes.",
    },
    {
      name: "actions",
      type: "(ids: string[]) => ReactNode",
      description: "Buttons in the bulk bar for the selected rows.",
    },
    {
      name: "onRowClick",
      type: "(row: R) => void",
      description: "Makes rows clickable.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type DataRow = { id: string } & Record<string, string | number | null>;

type DataColumn<R> = {
  key: keyof R & string;
  label: string;
  align?: "left" | "right"; // right-aligned columns use tabular mono figures
  format?: (value, row: R) => ReactNode; // sort, filter and CSV use the raw value
  sortable?: boolean; // click cycles descending → ascending → off
  width?: string;
  priority?: 1 | 2 | 3; // 1 always, 2 hidden below a 28rem table, 3 below 36rem
};`,
};
