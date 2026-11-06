export const siteConfig = {
  name: "TUFFUI",
  shortName: "tuffui",
  tagline: "free React components for AI chat and agent UIs",
  description:
    "Free, open-source React components for AI-agent interfaces: chats, tool calls, approvals, plans, traces, memory and usage.",
  // Local builds set NEXT_PUBLIC_SITE_URL so registry links point at the dev server.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://tuffui.com",
  github: "https://github.com/yurigdesigner/tuffui",
  donate: "https://ko-fi.com/yurigokoryan",
  author: { name: "@yurygok", url: "https://x.com/yurygok" },
  license: "MIT",
} as const;
