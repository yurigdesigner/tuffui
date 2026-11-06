import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const ogSize = { width: 1200, height: 630 };

/** Shared OG layout: dark surface, hairline grid, eyebrow, title, description. */
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
        background: "#0b0b0d",
        backgroundImage:
          "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        color: "#f4f4f6",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "#f4f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path
              d="M5 12.5 9.5 17 19 7"
              fill="none"
              stroke="#0b0b0d"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {siteConfig.name}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            fontSize: 22,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#8f8f99",
          }}
        >
          {eyebrow}
        </div>
        <div style={{ fontSize: 80, letterSpacing: -2.5, lineHeight: 1.05 }}>{title}</div>
        <div style={{ fontSize: 30, color: "#a1a1ab", lineHeight: 1.4, maxWidth: 960 }}>
          {description}
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, fontSize: 22, color: "#8f8f99" }}>
        Free · MIT · shadcn registry
      </div>
    </div>,
    ogSize,
  );
}
