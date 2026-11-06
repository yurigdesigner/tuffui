import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The wordmark only.
const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "AI chat UI",
    "AI agent UI",
    "React components",
    "shadcn",
    "shadcn registry",
    "Tailwind CSS",
    "Next.js",
    "LLM interface",
    "tool calls",
    "chatbot UI",
    "open source",
  ],
  authors: [{ name: `${siteConfig.name} contributors`, url: siteConfig.github }],
  creator: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0d" },
    { media: "(prefers-color-scheme: light)", color: "#fbfbfc" },
  ],
};

// Dark is the default; a stored "light" preference is applied before first paint.
const themeScript = `(function(){try{if(localStorage.getItem("theme")==="light"){var d=document.documentElement;d.classList.remove("dark");}}catch(e){}})()`;

// A tab opened before a deploy still references the old build's chunks, which the
// new deploy removed. When one fails to load, do a full reload onto the current
// build, at most once a minute so a real outage can't loop.
const staleBuildScript = `(function(){function stale(m){return /ChunkLoadError|Loading chunk|Failed to load chunk|error loading dynamically imported module/i.test(m||"")}function reload(){try{var k="tuffui:reloaded",t=+sessionStorage.getItem(k)||0;if(Date.now()-t<6e4)return;sessionStorage.setItem(k,String(Date.now()))}catch(e){}location.reload()}addEventListener("error",function(e){if(stale(e.message)||stale(e.error&&e.error.name))reload()});addEventListener("unhandledrejection",function(e){var r=e.reason;if(r&&(stale(r.name)||stale(r.message)))reload()})})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${orbitron.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: staleBuildScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#content"
          className="sr-only z-50 rounded-md bg-surface-raised px-3 py-2 text-sm focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
