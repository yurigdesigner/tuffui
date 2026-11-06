import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const ogSize = { width: 1200, height: 630 };

// Images are rendered at build time, so fonts and the mark are read from disk.
const read = (path: string) => readFileSync(join(process.cwd(), path));
const fonts = [
  {
    name: "Orbitron",
    data: read("lib/og/fonts/Orbitron-Bold.ttf"),
    weight: 700 as const,
  },
  { name: "Geist", data: read("lib/og/fonts/Geist-Regular.ttf"), weight: 400 as const },
  { name: "Geist", data: read("lib/og/fonts/Geist-SemiBold.ttf"), weight: 600 as const },
];
const mark = `data:image/svg+xml;base64,${read("app/icon.svg").toString("base64")}`;

/** Shared OG layout: the stone mark and wordmark, then eyebrow, title and description. */
export function ogImage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#0b0b0b",
        color: "#f5f5f5",
        fontFamily: "Geist",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori */}
          <img src={mark} width={48} height={55} alt="" />
          <div
            style={{
              fontFamily: "Orbitron",
              fontWeight: 700,
              fontSize: 34,
              letterSpacing: 3,
            }}
          >
            {siteConfig.name}
          </div>
        </div>
        <div style={{ fontSize: 24, color: "#8a8a8a" }}>tuffui.com</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ fontSize: 24, color: "#0a84ff" }}>{eyebrow}</div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 600,
            letterSpacing: -2.5,
            lineHeight: 1.05,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 30, color: "#a3a3a3", lineHeight: 1.4, maxWidth: 980 }}>
          {description}
        </div>
      </div>
    </div>,
    { ...ogSize, fonts },
  );
}
