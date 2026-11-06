import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { Calendar, DatePicker } from "@/components/ui/date-field";

<DatePicker
  label="Ship the release on"
  value={date}
  onValueChange={setDate}
  min={new Date()}
  isDisabled={(d) => d.getDay() === 0 || d.getDay() === 6}
/>

<Calendar mode="range" value={range} onValueChange={setRange} />`,
  props: [
    {
      name: "mode",
      type: '"single" | "range"',
      default: '"single"',
      description: "Calendar: one day, or a from / to range picked with two clicks.",
    },
    {
      name: "value",
      type: "Date | null | { from; to }",
      description: "Selected day, or range in range mode. Calendar is controlled.",
    },
    {
      name: "onValueChange",
      type: "(value) => void",
      description: "Fires on pick. DatePicker closes its popover after.",
    },
    { name: "min / max", type: "Date", description: "Days outside are disabled." },
    {
      name: "isDisabled",
      type: "(date: Date) => boolean",
      description: "Disable individual days, e.g. weekends.",
    },
    { name: "locale", type: "string", description: "Month and weekday names via Intl." },
    {
      name: "label / placeholder / formatOptions",
      type: "string / string / Intl.DateTimeFormatOptions",
      description: "DatePicker trigger text.",
    },
  ],
  types: `type DateRange = { from: Date | null; to: Date | null };
// Keys: arrows move a day / week, Home / End the week, PageUp / PageDown the month,
// Enter or Space picks. Without a value the calendar opens on the current month,
// so pass a value when you prerender to keep server and client markup equal.`,
};
