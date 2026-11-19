"use client";

import { Key } from "@phosphor-icons/react";
import { StatusPill } from "@/components/ui/status-pill";
import { useMockRun, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import type { DemoLocale } from "@/components/docs/demo";
import {
  BlastRadius,
  type BlastKind,
  type BlastNode,
  type BlastRadiusLabels,
} from "./blast-radius";

const kinds: Record<string, BlastKind> = {
  service: { label: "Service", color: "var(--brand)" },
  database: { label: "Database", color: "#1a9e8c" },
  bucket: { label: "Bucket", color: "#bf5af2" },
  key: { label: "Secret", color: "#b8862b" },
  person: { label: "Person", color: "#30b0c7" },
};

// Everything a freshly issued API key can read, and what that read opens up.
// `hop` marks when the scan in the demo flags each node.
const leaked: (BlastNode & { hop?: number })[] = [
  {
    id: "warehouse",
    label: "analytics-warehouse",
    kind: "service",
    affected: true,
    hop: 1,
    note: "Granted read on every schema",
  },
  {
    id: "billing",
    label: "billing-exports",
    parent: "warehouse",
    kind: "bucket",
    affected: true,
    hop: 2,
    note: "Read by the new key",
  },
  {
    id: "events",
    label: "events-raw",
    parent: "warehouse",
    kind: "bucket",
    affected: true,
    indirect: true,
    hop: 2,
    note: "Readable through a warehouse view",
  },
  {
    id: "payments",
    label: "payments-api",
    kind: "service",
    affected: true,
    hop: 1,
    note: "Key has the payments:read scope",
  },
  {
    id: "stripe",
    label: "stripe-secret",
    parent: "payments",
    kind: "key",
    affected: true,
    indirect: true,
    hop: 2,
    note: "Mounted as an env var in payments-api",
  },
  {
    id: "ledger",
    label: "ledger-db",
    parent: "payments",
    kind: "database",
    note: "Row-level policy blocks the key",
  },
  { id: "support", label: "support-db", kind: "database", note: "No grant for this key" },
  { id: "attachments", label: "ticket-attachments", parent: "support", kind: "bucket" },
  { id: "zendesk", label: "zendesk-sync", parent: "support", kind: "service" },
  { id: "ci", label: "ci-runner", kind: "service", note: "Separate project" },
  { id: "deploy", label: "deploy-key", parent: "ci", kind: "key" },
  {
    id: "crm",
    label: "crm-api",
    kind: "service",
    affected: true,
    hop: 1,
    note: "Key has the contacts:read scope",
  },
  {
    id: "contacts",
    label: "customer-contacts",
    parent: "crm",
    kind: "database",
    affected: true,
    hop: 2,
    note: "Read by the new key",
  },
  {
    id: "sales",
    label: "sales-team",
    parent: "crm",
    kind: "person",
    note: "Owners of crm-api",
  },
  { id: "docs", label: "docs-site", kind: "service" },
  { id: "search", label: "search-index", parent: "docs", kind: "database" },
  {
    id: "maya",
    label: "maya.rios",
    parent: "docs",
    kind: "person",
    note: "Created the key",
  },
];

const toolKinds: Record<string, BlastKind> = {
  tool: { label: "MCP tool", color: "#5e5ce6" },
  database: { label: "Database", color: "#1a9e8c" },
  bucket: { label: "Bucket", color: "#bf5af2" },
  service: { label: "Service", color: "var(--brand)" },
  key: { label: "Secret", color: "#b8862b" },
};

// What a support agent's MCP tools can reach. Write and exec tools are the risk.
const tools: BlastNode[] = [
  { id: "gh", label: "github.read_file", kind: "tool", note: "Read-only, two repos" },
  { id: "repo-app", label: "acme/support-app", parent: "gh", kind: "service" },
  { id: "repo-docs", label: "acme/help-center", parent: "gh", kind: "service" },
  {
    id: "pg",
    label: "postgres.query",
    kind: "tool",
    affected: true,
    note: "Accepts raw SQL, not just SELECT",
  },
  {
    id: "users",
    label: "users",
    parent: "pg",
    kind: "database",
    affected: true,
    note: "Writable by the agent's role",
  },
  {
    id: "orders",
    label: "orders",
    parent: "pg",
    kind: "database",
    affected: true,
    indirect: true,
    note: "Reachable through a foreign key cascade",
  },
  { id: "slack", label: "slack.post_message", kind: "tool", note: "Limited to #support" },
  { id: "support-channel", label: "#support", parent: "slack", kind: "service" },
  {
    id: "s3",
    label: "s3.put_object",
    kind: "tool",
    affected: true,
    note: "Bucket policy allows overwrite",
  },
  {
    id: "backups",
    label: "nightly-backups",
    parent: "s3",
    kind: "bucket",
    affected: true,
    note: "Agent can overwrite backups",
  },
  { id: "uploads", label: "customer-uploads", parent: "s3", kind: "bucket" },
  {
    id: "shell",
    label: "shell.exec",
    kind: "tool",
    affected: true,
    note: "Runs on the worker host",
  },
  {
    id: "worker",
    label: "agent-worker-01",
    parent: "shell",
    kind: "service",
    affected: true,
    note: "Full shell as the app user",
  },
  {
    id: "env",
    label: "OPENAI_API_KEY",
    parent: "shell",
    kind: "key",
    affected: true,
    indirect: true,
    note: "Readable from the process env",
  },
  { id: "fetch", label: "web.fetch", kind: "tool", note: "Outbound only" },
  { id: "kb", label: "kb.search", kind: "tool", note: "Read-only index" },
  { id: "kb-index", label: "help-articles", parent: "kb", kind: "database" },
];

// The scan flags the first hop, then follows the grants one hop further.
const script: MockStep<number>[] = [
  { delay: 900, apply: () => 1 },
  { delay: 700, apply: () => 2 },
];

/** Keeps a Latin name in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

type Translation = {
  /** Kind labels by kind. */
  kinds: Record<string, string>;
  /** Node notes by id. */
  notes: Record<string, string>;
  leaked: {
    title: string;
    subtitle: string;
    exposed: (n: number) => string;
    scanning: string;
  };
  tools: { title: string; subtitle: string; risk: (n: number) => string };
  labels: Partial<BlastRadiusLabels>;
};

/** Resource, tool and person names stay Latin; Hebrew and Arabic show the RTL layout. */
const copy: Record<Exclude<DemoLocale, "en">, Translation> = {
  he: {
    kinds: {
      service: "שירות",
      database: "מסד נתונים",
      bucket: "דלי אחסון",
      key: "סוד",
      person: "אדם",
      tool: `כלי ${ltr("MCP")}`,
    },
    notes: {
      warehouse: "הרשאת קריאה לכל הסכמות",
      billing: "נקרא על ידי המפתח החדש",
      events: "קריא דרך תצוגה במחסן הנתונים",
      payments: `למפתח יש את ההרשאה ${ltr("payments:read")}`,
      stripe: `מוגדר כמשתנה סביבה ב־${ltr("payments-api")}`,
      ledger: "מדיניות ברמת השורה חוסמת את המפתח",
      support: "אין הרשאה למפתח הזה",
      ci: "פרויקט נפרד",
      crm: `למפתח יש את ההרשאה ${ltr("contacts:read")}`,
      contacts: "נקרא על ידי המפתח החדש",
      sales: `הבעלים של ${ltr("crm-api")}`,
      maya: "יצרה את המפתח",
      gh: "קריאה בלבד, שני מאגרים",
      pg: `מקבל ${ltr("SQL")} גולמי, לא רק ${ltr("SELECT")}`,
      users: "הסוכן יכול לכתוב בו",
      orders: "נגיש דרך מחיקה מדורגת של מפתח זר",
      slack: `מוגבל ל־${ltr("#support")}`,
      s3: "מדיניות הדלי מתירה דריסה",
      backups: "הסוכן יכול לדרוס גיבויים",
      shell: "רץ על שרת ה־worker",
      worker: "מעטפת מלאה כמשתמש האפליקציה",
      env: "קריא ממשתני הסביבה של התהליך",
      fetch: "יוצא בלבד",
      kb: "אינדקס לקריאה בלבד",
    },
    leaked: {
      title: "רדיוס הפגיעה",
      subtitle: `${ltr("sk-live-…7f2a")} · הונפק לפני 14 דקות`,
      exposed: (n) => (n === 1 ? "משאב חשוף אחד" : `${n} חשופים`),
      scanning: "סורק",
    },
    tools: {
      title: "הרשאות כלים",
      subtitle: `${ltr("support-agent")} · 6 כלי ${ltr("MCP")}`,
      risk: (n) => `${n} בסיכון`,
    },
    labels: {
      hops: (depth) => (depth === 1 ? "קפיצה אחת" : `${depth} קפיצות`),
      affected: "מושפע",
      instructions: (title) => `${title}. אפשר לעבור בין הצמתים עם מקשי החיצים.`,
      summary: (title, affected, total, center) =>
        `${title}: ${affected} מתוך ${total} שנגישים מ־${center} מושפעים`,
      reading: (node, flags) =>
        `${node.label}, ${node.kind}, ${node.hops}${flags.affected ? ", מושפע" : ""}${flags.indirect ? ", עקיף" : ""}${node.note ? `. ${node.note}` : ""}`,
    },
  },
  ar: {
    kinds: {
      service: "خدمة",
      database: "قاعدة بيانات",
      bucket: "حاوية تخزين",
      key: "سرّ",
      person: "شخص",
      tool: `أداة ${ltr("MCP")}`,
    },
    notes: {
      warehouse: "صلاحية قراءة على كل المخططات",
      billing: "يقرؤه المفتاح الجديد",
      events: "قابل للقراءة عبر عرض في المستودع",
      payments: `يملك المفتاح صلاحية ${ltr("payments:read")}`,
      stripe: `مُثبَّت كمتغير بيئة في ${ltr("payments-api")}`,
      ledger: "سياسة على مستوى الصفوف تحظر المفتاح",
      support: "لا صلاحية لهذا المفتاح",
      ci: "مشروع منفصل",
      crm: `يملك المفتاح صلاحية ${ltr("contacts:read")}`,
      contacts: "يقرؤه المفتاح الجديد",
      sales: `مالكو ${ltr("crm-api")}`,
      maya: "أنشأت المفتاح",
      gh: "قراءة فقط، مستودعان",
      pg: `يقبل ${ltr("SQL")} خامًا، لا ${ltr("SELECT")} فقط`,
      users: "يستطيع الوكيل الكتابة فيه",
      orders: "يمكن الوصول إليه عبر حذف متتالٍ لمفتاح أجنبي",
      slack: `مقصور على ${ltr("#support")}`,
      s3: "سياسة الحاوية تسمح بالكتابة فوق الملفات",
      backups: "يستطيع الوكيل الكتابة فوق النسخ الاحتياطية",
      shell: "يعمل على خادم العامل",
      worker: "صدفة كاملة بصلاحيات مستخدم التطبيق",
      env: "قابل للقراءة من متغيرات بيئة العملية",
      fetch: "صادر فقط",
      kb: "فهرس للقراءة فقط",
    },
    leaked: {
      title: "نطاق الضرر",
      subtitle: `${ltr("sk-live-…7f2a")} · صدر قبل 14 دقيقة`,
      exposed: (n) => (n === 1 ? "مورد مكشوف" : `${n} مكشوفة`),
      scanning: "جارٍ الفحص",
    },
    tools: {
      title: "صلاحيات الأدوات",
      subtitle: `${ltr("support-agent")} · 6 أدوات ${ltr("MCP")}`,
      risk: (n) => `${n} في خطر`,
    },
    labels: {
      hops: (depth) =>
        depth === 1
          ? "قفزة واحدة"
          : depth === 2
            ? "قفزتان"
            : depth <= 10
              ? `${depth} قفزات`
              : `${depth} قفزة`,
      affected: "متأثر",
      instructions: (title) => `${title}. استخدم مفاتيح الأسهم لقراءة كل عقدة.`,
      summary: (title, affected, total, center) =>
        `${title}: ${affected} من ${total} يمكن الوصول إليها من ${center} متأثرة`,
      reading: (node, flags) =>
        `${node.label}، ${node.kind}، ${node.hops}${flags.affected ? "، متأثر" : ""}${flags.indirect ? "، غير مباشر" : ""}${node.note ? `. ${node.note}` : ""}`,
    },
  },
};

/** Swaps kind labels and node notes for the demo's language. */
const translate = (
  text: Translation | undefined,
  nodes: BlastNode[],
  kindMap: Record<string, BlastKind>,
) =>
  text
    ? {
        nodes: nodes.map((n) => ({ ...n, note: n.note && (text.notes[n.id] ?? n.note) })),
        kinds: Object.fromEntries(
          Object.entries(kindMap).map(([k, v]) => [
            k,
            { ...v, label: text.kinds[k] ?? v.label },
          ]),
        ),
      }
    : { nodes, kinds: kindMap };

export default function BlastRadiusDemo({
  variant = "Leaked key",
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const { state: scanned } = useMockRun<number>(autoplay ? 0 : 2, script, { autoplay });
  const text = locale === "en" ? undefined : copy[locale];

  if (variant === "Tool permissions") {
    const risky = tools.filter((t) => t.affected).length;
    const local = translate(text, tools, toolKinds);
    return (
      <BlastRadius
        title={text?.tools.title ?? "Tool permissions"}
        subtitle={text?.tools.subtitle ?? "support-agent · 6 MCP tools"}
        center={{ label: "support-agent", initials: "SA" }}
        nodes={local.nodes}
        kinds={local.kinds}
        labels={text?.labels}
        aside={
          <StatusPill tone="negative">
            {text ? text.tools.risk(risky) : `${risky} at risk`}
          </StatusPill>
        }
      />
    );
  }

  const nodes = leaked.map(({ hop, ...node }) => ({
    ...node,
    affected: node.affected && (hop ?? 0) <= scanned,
  }));
  const count = nodes.filter((n) => n.affected).length;
  const local = translate(text, nodes, kinds);
  return (
    <BlastRadius
      title={text?.leaked.title ?? "Blast radius"}
      subtitle={text?.leaked.subtitle ?? "sk-live-…7f2a · issued 14 min ago"}
      center={{ label: "sk-live-…7f2a", icon: Key }}
      nodes={local.nodes}
      kinds={local.kinds}
      labels={text?.labels}
      aside={
        <StatusPill tone={count ? "negative" : "neutral"}>
          {count
            ? text
              ? text.leaked.exposed(count)
              : `${count} exposed`
            : (text?.leaked.scanning ?? "Scanning")}
        </StatusPill>
      }
    />
  );
}
