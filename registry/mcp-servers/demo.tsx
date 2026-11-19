"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { McpServers, type McpServer, type McpServersLabels } from "./mcp-servers";

/** Arabic noun after a numeral: 1, 2 and 3–10 pick their forms; 11+ the singular. */
const arCount = (n: number, one: string, two: string, few: string, many: string) =>
  n === 1 ? one : n === 2 ? two : n >= 3 && n <= 10 ? few : many;

/**
 * Tool descriptions and UI strings per language. Server and tool names and the raw
 * connection error stay as the server sends them.
 */
const copy: Record<
  DemoLocale,
  { descriptions?: Record<string, string>; labels?: Partial<McpServersLabels> }
> = {
  en: {},
  he: {
    descriptions: {
      create_pull_request: "פתיחת PR מענף",
      list_issues: "חיפוש באגים ומסננים",
      merge_pull_request: "מיזוג בשיטה שתבחרו",
      get_file_contents: "קריאת קובץ ב־ref מסוים",
      search_issues: "חיפוש באגים לפי טקסט או תווית",
      create_issue: "פתיחת באג חדש",
      update_status: "העברת באג בין סטטוסים",
      query: "הרצת שאילתת SQL לקריאה בלבד",
      describe_table: "עמודות, טיפוסים ואינדקסים",
      read_file: "קריאת קובץ בסביבת העבודה",
      write_file: "יצירה או דריסה של קובץ",
      search_files: "glob ו־grep בסביבת העבודה",
      delete_file: "מחיקת קובץ",
    },
    labels: {
      status: {
        connected: "מחובר",
        connecting: "מתחבר",
        "needs-auth": "נדרשת הרשאה",
        error: "שגיאה",
      },
      title: "שרתי MCP",
      toolsEnabled: (enabled, total) => (
        <>
          {enabled} מתוך {total} כלים פעילים
        </>
      ),
      connected: (connected, total) => (
        <>
          {connected} מתוך {total} מחוברים
        </>
      ),
      toolCount: (on, total) => `${on}/${total} כלים`,
      allTools: "כל הכלים",
      allToolsOn: (server) => `כל הכלים ב־${server}`,
      toolOn: (tool, server) => `${tool} ב־${server}`,
      authorize: "מתן הרשאה",
      reconnect: "חיבור מחדש",
      search: "חיפוש כלים",
      noMatch: "אין כלים תואמים",
      noMatchQuery: (query) => `אין תוצאות עבור „${query}”.`,
      clear: "ניקוי החיפוש",
    },
  },
  ar: {
    descriptions: {
      create_pull_request: "فتح طلب دمج من فرع",
      list_issues: "البحث في البلاغات والمرشِّحات",
      merge_pull_request: "الدمج بالطريقة التي تختارها",
      get_file_contents: "قراءة ملف عند مرجع معيّن",
      search_issues: "البحث عن بلاغات بالنص أو التصنيف",
      create_issue: "فتح بلاغ جديد",
      update_status: "نقل بلاغ بين الحالات",
      query: "تشغيل استعلام SQL للقراءة فقط",
      describe_table: "الأعمدة والأنواع والفهارس",
      read_file: "قراءة ملف في مساحة العمل",
      write_file: "إنشاء ملف أو الكتابة فوقه",
      search_files: "البحث في مساحة العمل بـ glob وgrep",
      delete_file: "حذف ملف",
    },
    labels: {
      status: {
        connected: "متصل",
        connecting: "جارٍ الاتصال",
        "needs-auth": "يحتاج إلى تفويض",
        error: "خطأ",
      },
      title: "خوادم MCP",
      toolsEnabled: (enabled, total) => (
        <>
          {enabled} من {total} {arCount(total, "أداة", "أدوات", "أدوات", "أداة")} مفعّلة
        </>
      ),
      connected: (connected, total) => (
        <>
          {connected} من {total} متصلة
        </>
      ),
      toolCount: (on, total) =>
        `${on}/${total} ${arCount(total, "أداة", "أدوات", "أدوات", "أداة")}`,
      allTools: "كل الأدوات",
      allToolsOn: (server) => `كل الأدوات في ${server}`,
      toolOn: (tool, server) => `${tool} في ${server}`,
      authorize: "تفويض",
      reconnect: "إعادة الاتصال",
      search: "ابحث في الأدوات",
      noMatch: "لا توجد أدوات مطابقة",
      noMatchQuery: (query) => `لا نتائج لـ «${query}».`,
      clear: "مسح البحث",
    },
  },
};

const tool = (name: string, description: string, enabled = true) => ({
  name,
  description,
  enabled,
});

const servers: McpServer[] = [
  {
    id: "github",
    name: "github",
    transport: "http",
    status: "connected",
    tools: [
      tool("create_pull_request", "Open a PR from a branch"),
      tool("list_issues", "Search issues and filters"),
      tool("merge_pull_request", "Merge with a chosen strategy", false),
      tool("get_file_contents", "Read a file at a ref"),
    ],
  },
  {
    id: "linear",
    name: "linear",
    transport: "http",
    status: "needs-auth",
    tools: [
      tool("search_issues", "Find issues by text or label", false),
      tool("create_issue", "File a new issue", false),
      tool("update_status", "Move an issue between states", false),
    ],
  },
  {
    id: "postgres",
    name: "postgres-analytics",
    transport: "stdio",
    status: "error",
    error: "ECONNREFUSED 127.0.0.1:5432 — is the database running?",
    tools: [
      tool("query", "Run a read-only SQL query"),
      tool("describe_table", "Columns, types and indexes"),
    ],
  },
  {
    id: "fs",
    name: "filesystem",
    transport: "stdio",
    status: "connected",
    tools: [
      tool("read_file", "Read a file in the workspace"),
      tool("write_file", "Create or overwrite a file"),
      tool("search_files", "Glob and grep the workspace"),
      tool("delete_file", "Remove a file", false),
    ],
  },
];

type State = { servers: McpServer[] };

const patch =
  (id: string, change: Partial<McpServer> | ((s: McpServer) => Partial<McpServer>)) =>
  (state: State): State => ({
    servers: state.servers.map((s) =>
      s.id === id ? { ...s, ...(typeof change === "function" ? change(s) : change) } : s,
    ),
  });

const enableAll = (s: McpServer) => ({
  tools: s.tools.map((t) => ({ ...t, enabled: true })),
});

const script: MockStep<State>[] = [
  wait(1600),
  { delay: 0, apply: patch("linear", { status: "connecting" }) },
  {
    delay: 1200,
    apply: patch("linear", (s) => ({ status: "connected", ...enableAll(s) })),
  },
  wait(1200),
  { delay: 0, apply: patch("postgres", { status: "connecting" }) },
  { delay: 1400, apply: patch("postgres", { status: "connected", error: undefined }) },
];

export default function McpServersDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const { descriptions, labels } = copy[locale];
  const { state, setState } = useMockRun<State>(
    {
      servers: descriptions
        ? servers.map((s) => ({
            ...s,
            tools: s.tools.map((t) => ({ ...t, description: descriptions[t.name] })),
          }))
        : servers,
    },
    script,
    { autoplay },
  );

  const reconnect = (id: string) => {
    setState(patch(id, { status: "connecting" }));
    setTimeout(
      () => setState(patch(id, { status: "connected", error: undefined })),
      1200,
    );
  };

  return (
    <McpServers
      data={state.servers}
      view={variant === "Tools" ? "tools" : "servers"}
      defaultExpanded="github"
      labels={labels}
      onToggleTool={(serverId, name, enabled) =>
        setState(
          patch(serverId, (s) => ({
            tools: s.tools.map((t) => (t.name === name ? { ...t, enabled } : t)),
          })),
        )
      }
      onToggleServer={(serverId, enabled) =>
        setState(
          patch(serverId, (s) => ({ tools: s.tools.map((t) => ({ ...t, enabled })) })),
        )
      }
      onAuthorize={(server) => reconnect(server.id)}
      onReconnect={(server) => reconnect(server.id)}
    />
  );
}
