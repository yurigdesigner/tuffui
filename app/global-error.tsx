"use client";

import { useEffect } from "react";

const isStaleChunk = (error: Error) =>
  /ChunkLoadError|Failed to load chunk|Loading chunk/i.test(
    `${error.name} ${error.message}`,
  );

/**
 * Last-resort error page. A stale chunk after a deploy reloads onto the current
 * build (once a minute at most); anything else shows a plain retry.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    if (!isStaleChunk(error)) return;
    try {
      const key = "tuffui:reloaded";
      if (Date.now() - Number(sessionStorage.getItem(key) ?? 0) < 60_000) return;
      sessionStorage.setItem(key, String(Date.now()));
    } catch {}
    location.reload();
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body
        style={{
          margin: 0,
          background: "#0b0b0b",
          color: "#f5f5f5",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: 480, margin: "20vh auto", padding: "0 16px" }}>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ color: "#a3a3a3" }}>
            Reload to get the latest version of the site.
          </p>
          <button
            type="button"
            onClick={() => (isStaleChunk(error) ? location.reload() : reset())}
            style={{
              marginTop: 16,
              height: 40,
              padding: "0 20px",
              borderRadius: 999,
              border: 0,
              background: "#f5f5f5",
              color: "#0b0b0b",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
