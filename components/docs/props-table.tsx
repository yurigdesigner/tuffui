import type { PropDef } from "@/lib/docs/types";

export function PropsTable({ props }: { props: PropDef[] }) {
  return (
    <div className="rounded-[1.375rem] bg-surface p-1.5">
      <div className="overflow-x-auto rounded-2xl bg-surface-inset p-1.5">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="text-[0.8125rem] text-muted-foreground">
              <th scope="col" className="px-3 py-2 font-medium">
                Prop
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Type
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Default
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {props.map((prop) => (
              <tr
                key={prop.name}
                className="align-top odd:bg-foreground/[0.025] [&>td:first-child]:rounded-l-xl [&>td:last-child]:rounded-r-xl"
              >
                <td className="px-3 py-3 font-mono text-[0.8125rem] whitespace-nowrap">
                  {prop.name}
                  {prop.required && (
                    <span className="text-negative" aria-label="required">
                      *
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 font-mono text-[0.75rem] text-muted-foreground">
                  {prop.type}
                </td>
                <td className="px-3 py-3 font-mono text-[0.75rem] text-muted-foreground">
                  {prop.default ?? "—"}
                </td>
                <td className="px-3 py-3 text-muted-foreground">{prop.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
