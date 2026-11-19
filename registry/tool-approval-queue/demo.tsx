"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  ToolApprovalQueue,
  type ToolApprovalQueueLabels,
  type ToolApprovalRequest,
} from "./tool-approval-queue";

const requestsEn: ToolApprovalRequest[] = [
  {
    id: "changelog",
    tool: "fs.write",
    title: "Add the 2.4.0 section to the changelog",
    risk: "low",
    agent: "release-agent",
    payload: {
      kind: "diff",
      path: "docs/changelog.md",
      lines: [
        { type: "context", text: "# Changelog" },
        { type: "add", text: "## 2.4.0 — 3 Nov 2026" },
        { type: "add", text: "- Offline mode for the desktop app" },
        { type: "add", text: "- Faster cold start on Windows (−38%)" },
        { type: "context", text: "## 2.3.2 — 14 Oct 2026" },
      ],
    },
  },
  {
    id: "release",
    tool: "bash",
    title: "Create the GitHub release",
    risk: "medium",
    agent: "release-agent",
    payload: {
      kind: "shell",
      cwd: "~/src/desktop",
      command: "gh release create v2.4.0 --notes-file docs/changelog.md --verify-tag",
    },
  },
  {
    id: "slack",
    tool: "slack.post",
    title: "Announce the release in #releases",
    risk: "medium",
    agent: "release-agent",
    payload: {
      kind: "json",
      args: {
        channel: "#releases",
        text: "Desktop 2.4.0 is out — offline mode and a faster Windows start.",
      },
    },
  },
  {
    id: "publish",
    tool: "bash",
    title: "Publish the SDK to npm",
    risk: "high",
    agent: "release-agent",
    payload: {
      kind: "shell",
      cwd: "~/src/desktop/packages/sdk",
      command: "npm publish --access public --tag latest",
    },
  },
];

/** Keeps a Latin name or version in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

/** Request titles and UI strings per language; commands, diffs and JSON stay as they are. */
const copy: Record<
  DemoLocale,
  { titles?: Record<string, string>; labels?: Partial<ToolApprovalQueueLabels> }
> = {
  en: {},
  he: {
    titles: {
      changelog: `הוספת הגרסה ${ltr("2.4.0")} ליומן השינויים`,
      release: "יצירת ה־release ב־GitHub",
      slack: `הודעה על הגרסה ב־${ltr("#releases")}`,
      publish: "פרסום ה־SDK ב־npm",
    },
    labels: {
      title: "בקשות הרשאה",
      waiting: (n) => <>{n} ממתינות לך</>,
      allClear: "הכול טופל",
      selected: (n) => <>{n} נבחרו</>,
      clear: "ניקוי",
      deny: "דחייה",
      approve: "אישור",
      approveFor: (scope) =>
        ({ once: "אישור חד־פעמי", session: "אישור לסשן", always: "אישור תמיד" })[scope],
      grantFor: "תוקף ההרשאה",
      scopes: { once: "פעם אחת", session: "הסשן הזה", always: "תמיד" },
      risk: { high: "סיכון גבוה", medium: "סיכון בינוני", low: "סיכון נמוך" },
      riskShort: { high: "גבוה", medium: "בינוני", low: "נמוך" },
      requests: "בקשות",
      emptyTitle: "אין מה לבדוק",
      emptyDescription: "בקשות חדשות יופיעו כאן.",
      select: (title) => `בחירת ${title}`,
      resolved: (n) => `טופלו · ${n}`,
      outcome: (decision, scope) =>
        decision === "approved"
          ? { once: "אושר פעם אחת", session: "אושר לסשן", always: "אושר תמיד" }[scope]
          : "נדחה",
      undo: "ביטול",
      decided: (title, count, decision, scope) => {
        const subject = count === 1 ? title : `${count} בקשות`;
        if (decision === "denied") return `${subject}: נדחה`;
        return `${subject}: ${{ once: "אושר פעם אחת", session: "אושר לסשן", always: "אושר תמיד" }[scope]}`;
      },
      backInQueue: (title) => `${title} חזר לתור`,
    },
  },
  ar: {
    titles: {
      changelog: `إضافة قسم الإصدار ${ltr("2.4.0")} إلى سجل التغييرات`,
      release: "إنشاء الإصدار على GitHub",
      slack: `الإعلان عن الإصدار في ${ltr("#releases")}`,
      publish: "نشر الـ SDK على npm",
    },
    labels: {
      title: "طلبات الأذونات",
      waiting: (n) => <>{n} بانتظارك</>,
      allClear: "لا شيء معلّق",
      selected: (n) => <>تم تحديد {n}</>,
      clear: "مسح",
      deny: "رفض",
      approve: "موافقة",
      approveFor: (scope) =>
        ({
          once: "موافقة لمرة واحدة",
          session: "موافقة لهذه الجلسة",
          always: "موافقة دائمة",
        })[scope],
      grantFor: "مدة الإذن",
      scopes: { once: "مرة واحدة", session: "هذه الجلسة", always: "دائمًا" },
      risk: { high: "خطورة عالية", medium: "خطورة متوسطة", low: "خطورة منخفضة" },
      riskShort: { high: "عالية", medium: "متوسطة", low: "منخفضة" },
      requests: "الطلبات",
      emptyTitle: "لا شيء للمراجعة",
      emptyDescription: "ستظهر الطلبات الجديدة هنا.",
      select: (title) => `تحديد ${title}`,
      resolved: (n) => `تمت معالجتها · ${n}`,
      outcome: (decision, scope) =>
        decision === "approved"
          ? {
              once: "تمت الموافقة لمرة واحدة",
              session: "تمت الموافقة لهذه الجلسة",
              always: "تمت الموافقة دائمًا",
            }[scope]
          : "مرفوض",
      undo: "تراجع",
      decided: (title, count, decision, scope) => {
        const subject = count === 1 ? title : `${count} طلبات`;
        if (decision === "denied") return `${subject}: مرفوض`;
        return `${subject}: ${{ once: "تمت الموافقة لمرة واحدة", session: "تمت الموافقة لهذه الجلسة", always: "تمت الموافقة دائمًا" }[scope]}`;
      },
      backInQueue: (title) => `أُعيد ${title} إلى قائمة الانتظار`,
    },
  },
};

type State = { data: ToolApprovalRequest[]; selected: string[] };

const resolve = (ids: string[], status: "approved" | "denied") => (s: State) => ({
  data: s.data.map((r) => (ids.includes(r.id) ? { ...r, status } : r)),
  selected: s.selected.filter((id) => !ids.includes(id)),
});

const script = (requests: ToolApprovalRequest[]): MockStep<State>[] => [
  // Requests arrive while the agent works.
  ...requests.map((r, i) => ({
    delay: i ? 700 : 400,
    apply: (s: State) => ({ ...s, data: [...s.data, r] }),
  })),
  wait(1100),
  { delay: 0, apply: (s) => ({ ...s, selected: ["changelog"] }) },
  { delay: 600, apply: (s) => ({ ...s, selected: ["changelog", "release"] }) },
  { delay: 1400, apply: resolve(["changelog", "release"], "approved") },
  { delay: 1600, apply: resolve(["slack"], "denied") },
];

export default function ToolApprovalQueueDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const { titles, labels } = copy[locale];
  const requests = titles
    ? requestsEn.map((r) => ({ ...r, title: titles[r.id] }))
    : requestsEn;
  const { state, setState } = useMockRun<State>(
    // Paused thumbnails show the full queue.
    { data: autoplay ? [] : requests, selected: [] },
    script(requests),
    { autoplay },
  );

  return (
    // Fixed height, anchored to the top: the queue grows downward as requests
    // arrive instead of the whole card re-centering on every change.
    <div className="flex min-h-[38rem] w-full items-start justify-center">
      <ToolApprovalQueue
        data={state.data}
        layout={variant === "Flat" ? "flat" : "grouped"}
        defaultExpanded="publish"
        labels={labels}
        selected={state.selected}
        onSelectedChange={(selected) => setState((s) => ({ ...s, selected }))}
        onUndo={(request) =>
          setState((s) => ({
            ...s,
            data: s.data.map((r) =>
              r.id === request.id ? { ...r, status: "pending" } : r,
            ),
          }))
        }
      />
    </div>
  );
}
