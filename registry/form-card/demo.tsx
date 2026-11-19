"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  FormCard,
  type FormCardLabels,
  type FormField,
  type FormStatus,
  type FormValues,
} from "./form-card";

/** Keeps a Latin name or a numeric range in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

type Copy = {
  title: string;
  description: string;
  submit: string;
  fields: {
    name: string;
    email: string;
    emailHint: string;
    team: string;
    teams: [string, string, string];
    monitors: string;
    monitorsHint: string;
    access: string;
    none: [string, string];
    read: [string, string];
    buddy: string;
  };
  labels?: Partial<FormCardLabels>;
};

/** The same onboarding form in each demo language; Hebrew and Arabic show the RTL layout. */
const copy: Record<DemoLocale, Copy> = {
  en: {
    title: "New teammate details",
    description: "The onboarding agent needs these to set up accounts.",
    submit: "Send to agent",
    fields: {
      name: "Full name",
      email: "Work email",
      emailHint: "The invite to the workspace goes here.",
      team: "Team",
      teams: ["Platform", "Growth", "Design"],
      monitors: "Laptop monitors",
      monitorsHint: "0–3",
      access: "Production access",
      none: ["None", "Staging only"],
      read: ["Read-only", "Logs and dashboards"],
      buddy: "Assign an onboarding buddy",
    },
  },
  he: {
    title: "פרטי העובד החדש",
    description: "סוכן הקליטה צריך את הפרטים האלה כדי לפתוח חשבונות.",
    submit: "שליחה לסוכן",
    fields: {
      name: "שם מלא",
      email: "מייל עבודה",
      emailHint: "ההזמנה לסביבת העבודה תישלח לכאן.",
      team: "צוות",
      teams: ["פלטפורמה", "צמיחה", "עיצוב"],
      monitors: "מסכים נוספים",
      monitorsHint: ltr("0–3"),
      access: "גישה לפרודקשן",
      none: ["ללא", "רק סביבת Staging"],
      read: ["קריאה בלבד", "לוגים ודשבורדים"],
      buddy: "שיבוץ חבר מלווה",
    },
    labels: {
      required: (field) => `חובה למלא ${field}`,
      invalidEmail: "יש להזין כתובת מייל תקינה",
      notANumber: "יש להזין מספר",
      atLeast: (min) => `לפחות ${min}`,
      atMost: (max) => `לכל היותר ${max}`,
      yes: "כן",
      no: "לא",
      requiredHint: "שדה חובה",
      sending: "שולחים…",
      choose: "בחירה…",
      submitted: "נשלח",
      editAnswers: "עריכת התשובות",
      attention: (count) =>
        count === 1 ? "שדה אחד דורש תיקון" : `${count} שדות דורשים תיקון`,
    },
  },
  ar: {
    title: "بيانات الزميل الجديد",
    description: "يحتاج وكيل التهيئة إلى هذه البيانات لإنشاء الحسابات.",
    submit: "إرسال إلى الوكيل",
    fields: {
      name: "الاسم الكامل",
      email: "بريد العمل",
      emailHint: "ستصل دعوة مساحة العمل إلى هذا العنوان.",
      team: "الفريق",
      teams: ["المنصة", "النمو", "التصميم"],
      monitors: "شاشات إضافية",
      monitorsHint: ltr("0–3"),
      access: "الوصول إلى بيئة الإنتاج",
      none: ["بلا وصول", "بيئة الاختبار فقط"],
      read: ["قراءة فقط", "السجلات ولوحات المتابعة"],
      buddy: "تعيين زميل مرشد",
    },
    labels: {
      required: (field) => `حقل ${field} مطلوب`,
      invalidEmail: "أدخل بريدًا إلكترونيًا صالحًا",
      notANumber: "أدخل رقمًا",
      atLeast: (min) => `يجب ألا يقل عن ${min}`,
      atMost: (max) => `يجب ألا يزيد على ${max}`,
      yes: "نعم",
      no: "لا",
      requiredHint: "مطلوب",
      sending: "جارٍ الإرسال…",
      choose: "اختر…",
      submitted: "تم الإرسال",
      editAnswers: "تعديل الإجابات",
      attention: (count) =>
        count === 1
          ? "حقل واحد يحتاج إلى مراجعة"
          : count === 2
            ? "حقلان يحتاجان إلى مراجعة"
            : `${count} حقول تحتاج إلى مراجعة`,
    },
  },
};

const fieldsFor = ({ fields: f }: Copy): FormField[] => [
  {
    name: "name",
    label: f.name,
    type: "text",
    required: true,
    placeholder: "Ada Lovelace",
  },
  {
    name: "email",
    label: f.email,
    type: "email",
    required: true,
    placeholder: "ada@company.com",
    description: f.emailHint,
  },
  {
    name: "team",
    label: f.team,
    type: "select",
    required: true,
    options: [
      { value: "platform", label: f.teams[0] },
      { value: "growth", label: f.teams[1] },
      { value: "design", label: f.teams[2] },
    ],
  },
  {
    name: "seats",
    label: f.monitors,
    type: "number",
    min: 0,
    max: 3,
    placeholder: f.monitorsHint,
  },
  {
    name: "access",
    label: f.access,
    type: "radio",
    required: true,
    options: [
      { value: "none", label: f.none[0], description: f.none[1] },
      { value: "read", label: f.read[0], description: f.read[1] },
    ],
  },
  { name: "buddy", label: f.buddy, type: "switch" },
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
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const validation = variant === "Validation";
  const { state, setState } = useMockRun<State>(
    { values: {}, status: "editing", reveal: false },
    validation ? invalid : filling,
    { autoplay },
  );

  return (
    <FormCard
      data={{
        title: text.title,
        description: text.description,
        fields: fieldsFor(text),
      }}
      values={state.values}
      onValuesChange={(values) => setState((s) => ({ ...s, values }))}
      status={state.status}
      revealErrors={state.reveal}
      submitLabel={text.submit}
      labels={text.labels}
      onStatusChange={(status) => setState((s) => ({ ...s, status }))}
      onSubmit={() => new Promise((resolve) => setTimeout(resolve, 1000))}
    />
  );
}
