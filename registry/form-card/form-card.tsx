// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import { CheckCircle, ClipboardText, PencilSimple } from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/action-button";
import { Checkbox, Radio, RadioGroup, Switch } from "@/components/ui/choice-controls";
import { Select } from "@/components/ui/select-field";
import { StatusPill } from "@/components/ui/status-pill";
import { Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { TextArea, TextField } from "@/components/ui/text-field";
import { enter, exit } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type FormFieldOption = { value: string; label: string; description?: string };

export type FormField = {
  name: string;
  label: string;
  type:
    "text" | "email" | "number" | "textarea" | "select" | "radio" | "checkbox" | "switch";
  required?: boolean;
  description?: string;
  placeholder?: string;
  /** For select and radio. */
  options?: FormFieldOption[];
  min?: number;
  max?: number;
};

export type FormValue = string | boolean | undefined;
export type FormValues = Record<string, FormValue>;
export type FormStatus = "editing" | "submitting" | "submitted";

export type FormCardProps = {
  data: { title: string; description?: string; fields: FormField[] };
  values?: FormValues;
  defaultValues?: FormValues;
  onValuesChange?: (values: FormValues) => void;
  /** Return a promise to show the loading state until it settles. */
  onSubmit?: (values: FormValues) => void | Promise<void>;
  /** Extra checks after the built-in ones (required, email, number range). */
  validate?: (values: FormValues) => Record<string, string | undefined>;
  /** Controls the editing / submitting / submitted state from outside. */
  status?: FormStatus;
  onStatusChange?: (status: FormStatus) => void;
  /** Shows every field's error at once, as after a submit attempt. */
  revealErrors?: boolean;
  submitLabel?: string;
  /** UI strings, for translating the form. */
  labels?: Partial<FormCardLabels>;
  className?: string;
};

export type FormCardLabels = {
  required: (field: string) => string;
  invalidEmail: string;
  notANumber: string;
  atLeast: (min: number) => string;
  atMost: (max: number) => string;
  yes: string;
  no: string;
  /** Legend next to the asterisk under the fields. */
  requiredHint: string;
  sending: string;
  choose: string;
  submitted: string;
  editAnswers: string;
  /** Screen-reader announcement after a submit with errors. */
  attention: (count: number) => string;
};

const defaultLabels: FormCardLabels = {
  required: (field) => `${field} is required`,
  invalidEmail: "Enter a valid email address",
  notANumber: "Enter a number",
  atLeast: (min) => `Must be at least ${min}`,
  atMost: (max) => `Must be at most ${max}`,
  yes: "Yes",
  no: "No",
  requiredHint: "Required",
  sending: "Sending…",
  choose: "Choose…",
  submitted: "Submitted",
  editAnswers: "Edit answers",
  attention: (count) =>
    `${count} ${count === 1 ? "field needs" : "fields need"} attention`,
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function check(
  field: FormField,
  value: FormValue,
  labels: FormCardLabels,
): string | undefined {
  const empty = value === undefined || value === "" || value === false;
  if (field.required && empty) return labels.required(field.label);
  if (empty || typeof value !== "string") return;
  if (field.type === "email" && !EMAIL.test(value)) return labels.invalidEmail;
  if (field.type === "number") {
    const n = Number(value);
    if (Number.isNaN(n)) return labels.notANumber;
    if (field.min !== undefined && n < field.min) return labels.atLeast(field.min);
    if (field.max !== undefined && n > field.max) return labels.atMost(field.max);
  }
}

function display(field: FormField, value: FormValue, labels: FormCardLabels) {
  if (typeof value === "boolean") return value ? labels.yes : labels.no;
  if (!value) return "—";
  return field.options?.find((o) => o.value === value)?.label ?? value;
}

export function FormCard({
  data,
  values: valuesProp,
  defaultValues = {},
  onValuesChange,
  onSubmit,
  validate,
  status: statusProp,
  onStatusChange,
  revealErrors = false,
  submitLabel = "Submit",
  labels: labelOverrides,
  className,
}: FormCardProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const [inner, setInner] = useState<FormValues>(defaultValues);
  const values = valuesProp ?? inner;
  const [innerStatus, setInnerStatus] = useState<FormStatus>("editing");
  const status = statusProp ?? innerStatus;
  const setStatus = (next: FormStatus) => {
    setInnerStatus(next);
    onStatusChange?.(next);
  };
  const [touched, setTouched] = useState<string[]>([]);
  const [attempted, setAttempted] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const custom = validate?.(values) ?? {};
  const errors = Object.fromEntries(
    data.fields.map((f) => [f.name, check(f, values[f.name], labels) ?? custom[f.name]]),
  );
  const shown = (name: string) =>
    revealErrors || attempted || touched.includes(name) ? errors[name] : undefined;

  const set = (name: string, value: FormValue) => {
    const next = { ...values, [name]: value };
    if (!valuesProp) setInner(next);
    onValuesChange?.(next);
  };
  const blur = (name: string) => setTouched((t) => (t.includes(name) ? t : [...t, name]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    const count = Object.values(errors).filter(Boolean).length;
    if (count) {
      setAnnouncement(labels.attention(count));
      return;
    }
    setStatus("submitting");
    try {
      await onSubmit?.(values);
      setStatus("submitted");
      setAnnouncement(labels.submitted);
    } catch {
      setStatus("editing");
    }
  };

  const submitted = status === "submitted";

  return (
    <MotionConfig reducedMotion="user">
      <Shell aria-label={data.title} className={cn("max-w-md", className)}>
        <ShellHeader
          icon={ClipboardText}
          title={data.title}
          subtitle={submitted ? undefined : data.description}
          aside={
            submitted ? (
              <StatusPill tone="positive" icon={CheckCircle}>
                {labels.submitted}
              </StatusPill>
            ) : undefined
          }
        />
        <Panel className="overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            {submitted ? (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0, transition: enter }}
                exit={{ opacity: 0, transition: exit }}
              >
                <dl className="grid gap-x-4 gap-y-2.5 p-4 text-[0.8125rem] @md:grid-cols-[auto_1fr]">
                  {data.fields.map((f) => (
                    <div key={f.name} className="contents">
                      <dt className="text-muted-foreground">{f.label}</dt>
                      <dd className="min-w-0 truncate">
                        {display(f, values[f.name], labels)}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="flex justify-end px-2 pb-2">
                  <Button
                    variant="quiet"
                    size="sm"
                    icon={PencilSimple}
                    onClick={() => {
                      setStatus("editing");
                      setAttempted(false);
                    }}
                  >
                    {labels.editAnswers}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                noValidate
                onSubmit={submit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: enter }}
                exit={{ opacity: 0, transition: exit }}
                className="flex flex-col gap-4 p-4"
              >
                {data.fields.map((f) => (
                  <FieldControl
                    key={f.name}
                    field={f}
                    value={values[f.name]}
                    error={shown(f.name)}
                    onChange={(v) => set(f.name, v)}
                    onBlur={() => blur(f.name)}
                    choose={labels.choose}
                  />
                ))}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <p className="text-xs text-muted-foreground">
                    <span aria-hidden="true" className="text-negative">
                      *
                    </span>{" "}
                    {labels.requiredHint}
                  </p>
                  <Button
                    variant="primary"
                    type="submit"
                    loading={status === "submitting"}
                  >
                    {status === "submitting" ? labels.sending : submitLabel}
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </Panel>
        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </Shell>
    </MotionConfig>
  );
}

function Label({ field }: { field: FormField }) {
  return (
    <>
      {field.label}
      {field.required && (
        <span aria-hidden="true" className="ms-0.5 text-negative">
          *
        </span>
      )}
    </>
  );
}

function FieldControl({
  field,
  value,
  error,
  onChange,
  onBlur,
  choose,
}: {
  field: FormField;
  value: FormValue;
  error?: string;
  onChange: (value: FormValue) => void;
  onBlur: () => void;
  choose: string;
}) {
  const text = typeof value === "string" ? value : "";
  const common = {
    label: <Label field={field} />,
    description: field.description,
    error,
    required: field.required,
    placeholder: field.placeholder,
    onBlur,
  };

  switch (field.type) {
    case "textarea":
      return (
        <TextArea {...common} value={text} onChange={(e) => onChange(e.target.value)} />
      );
    case "checkbox":
    case "switch": {
      const Control = field.type === "switch" ? Switch : Checkbox;
      return (
        <div onBlur={onBlur}>
          <Control
            label={<Label field={field} />}
            description={
              error ? <span className="text-negative">{error}</span> : field.description
            }
            checked={value === true}
            onCheckedChange={(c) => onChange(c)}
          />
        </div>
      );
    }
    case "radio":
      return (
        <fieldset className="flex flex-col gap-2" onBlur={onBlur}>
          <legend className="mb-2 px-1 text-[0.8125rem] font-medium">
            <Label field={field} />
          </legend>
          <RadioGroup
            label={field.label}
            value={text}
            onValueChange={(v) => onChange(v)}
            className="px-1"
          >
            {field.options?.map((o) => (
              <Radio
                key={o.value}
                value={o.value}
                label={o.label}
                description={o.description}
              />
            ))}
          </RadioGroup>
          {error && <p className="px-1 text-xs text-negative">{error}</p>}
        </fieldset>
      );
    case "select":
      return (
        <Select
          label={<Label field={field} />}
          description={field.description}
          error={error}
          required={field.required}
          placeholder={field.placeholder ?? choose}
          options={field.options ?? []}
          // Always controlled: "" shows the placeholder, so the Select never flips modes.
          value={text}
          onValueChange={(v) => {
            onChange(v);
            onBlur();
          }}
        />
      );
    default:
      return (
        <TextField
          {...common}
          type={field.type === "number" ? "text" : field.type}
          inputMode={field.type === "number" ? "numeric" : undefined}
          value={text}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
