import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { FormCard, type FormField } from "@/components/ui/form-card";

// The agent asks for structured input with a tool call like request_form(fields).
export function AgentForm({ call }: { call: { title: string; fields: FormField[] } }) {
  return (
    <FormCard
      data={{ title: call.title, fields: call.fields }}
      onSubmit={async (values) => {
        await agent.sendToolResult(call.id, values); // the run continues with the answers
      }}
      validate={(values) => ({
        email: String(values.email ?? "").endsWith("@company.com")
          ? undefined
          : "Use your company address",
      })}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "{ title: string; description?: string; fields: FormField[] }",
      required: true,
      description: "The form the agent asked for, usually straight from a tool call.",
    },
    {
      name: "onSubmit",
      type: "(values: FormValues) => void | Promise<void>",
      description:
        "Called once every field is valid. Return a promise to show the loading state; a rejection returns to editing.",
    },
    {
      name: "validate",
      type: "(values) => Record<string, string | undefined>",
      description:
        "Extra checks after the built-in ones (required, email format, number min/max).",
    },
    {
      name: "values / defaultValues / onValuesChange",
      type: "FormValues",
      description: "Controlled or uncontrolled answers, keyed by field name.",
    },
    {
      name: "status / onStatusChange",
      type: '"editing" | "submitting" | "submitted"',
      description:
        "Controls the state from outside. Submitted collapses into a summary with Edit.",
    },
    {
      name: "revealErrors",
      type: "boolean",
      default: "false",
      description:
        "Shows every error at once. Otherwise a field shows its error after blur or a submit attempt.",
    },
    {
      name: "submitLabel",
      type: "string",
      default: '"Submit"',
      description: "Text of the primary button.",
    },
    { name: "className", type: "string", description: "Extra classes for the shell." },
  ],
  types: `type FormField = {
  name: string;
  label: string;
  type: "text" | "email" | "number" | "textarea" | "select" | "radio" | "checkbox" | "switch";
  required?: boolean;
  description?: string;
  placeholder?: string;
  options?: { value: string; label: string; description?: string }[]; // select, radio
  min?: number; // number
  max?: number;
};

type FormValues = Record<string, string | boolean | undefined>;`,
};
