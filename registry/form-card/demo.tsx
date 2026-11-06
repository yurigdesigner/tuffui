"use client";

import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { FormCard, type FormField, type FormStatus, type FormValues } from "./form-card";

const fields: FormField[] = [
  {
    name: "name",
    label: "Full name",
    type: "text",
    required: true,
    placeholder: "Ada Lovelace",
  },
  {
    name: "email",
    label: "Work email",
    type: "email",
    required: true,
    placeholder: "ada@company.com",
    description: "The invite to the workspace goes here.",
  },
  {
    name: "team",
    label: "Team",
    type: "select",
    required: true,
    options: [
      { value: "platform", label: "Platform" },
      { value: "growth", label: "Growth" },
      { value: "design", label: "Design" },
    ],
  },
  {
    name: "seats",
    label: "Laptop monitors",
    type: "number",
    min: 0,
    max: 3,
    placeholder: "0–3",
  },
  {
    name: "access",
    label: "Production access",
    type: "radio",
    required: true,
    options: [
      { value: "none", label: "None", description: "Staging only" },
      { value: "read", label: "Read-only", description: "Logs and dashboards" },
    ],
  },
  { name: "buddy", label: "Assign an onboarding buddy", type: "switch" },
];

type State = { values: FormValues; status: FormStatus; reveal: boolean };

const type = (name: string, text: string, from = ""): MockStep<State>[] =>
  Array.from(text, (_, i) => ({
    delay: 45 + ((i * 7) % 3) * 15,
    apply: (s: State) => ({
      ...s,
      values: { ...s.values, [name]: from + text.slice(0, i + 1) },
    }),
  }));

const set = (name: string, value: string | boolean, delay = 500): MockStep<State> => ({
  delay,
  apply: (s) => ({ ...s, values: { ...s.values, [name]: value } }),
});

const filling: MockStep<State>[] = [
  wait(700),
  ...type("name", "Mara Ito"),
  wait(300),
  ...type("email", "mara@pressd.dev"),
  set("team", "platform", 600),
  set("access", "read", 700),
  set("buddy", true, 600),
  { delay: 700, apply: (s) => ({ ...s, status: "submitting" }) },
  { delay: 1200, apply: (s) => ({ ...s, status: "submitted" }) },
];

const invalid: MockStep<State>[] = [
  wait(700),
  ...type("name", "Mara Ito"),
  wait(300),
  ...type("email", "mara@pressd"),
  set("seats", "5", 600),
  { delay: 700, apply: (s) => ({ ...s, reveal: true }) },
  wait(1600),
  ...type("email", ".dev", "mara@pressd"),
  set("seats", "2", 500),
];

export default function FormCardDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const validation = variant === "Validation";
  const { state, setState } = useMockRun<State>(
    { values: {}, status: "editing", reveal: false },
    validation ? invalid : filling,
    { autoplay },
  );

  return (
    <FormCard
      data={{
        title: "New teammate details",
        description: "The onboarding agent needs these to set up accounts.",
        fields,
      }}
      values={state.values}
      onValuesChange={(values) => setState((s) => ({ ...s, values }))}
      status={state.status}
      revealErrors={state.reveal}
      submitLabel="Send to agent"
      onStatusChange={(status) => setState((s) => ({ ...s, status }))}
      onSubmit={() => new Promise((resolve) => setTimeout(resolve, 1000))}
    />
  );
}
