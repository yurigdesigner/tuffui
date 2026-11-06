"use client";

import { Paperclip } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { DropOverlay, DropZone } from "./drop-zone";

// Fakes a drop so the preview shows accepted and rejected files without a real drag.
function simulateDrop(target: HTMLElement | null, files: File[]) {
  if (!target || typeof DataTransfer === "undefined") return;
  const data = new DataTransfer();
  files.forEach((f) => data.items.add(f));
  for (const type of ["dragenter", "drop"])
    target.dispatchEvent(
      new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: data }),
    );
}

const fake = (name: string, type: string, bytes: number) =>
  new File([new Uint8Array(bytes)], name, { type });

export default function DropZoneDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const zone = useRef<HTMLDivElement>(null);
  const [attached, setAttached] = useState<string[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!autoplay) return;
    if (variant === "Overlay") {
      const timers = [
        setTimeout(() => setShow(true), 900),
        setTimeout(() => {
          setShow(false);
          setAttached(["q3-metrics.csv"]);
        }, 2600),
      ];
      return () => timers.forEach(clearTimeout);
    }
    const timer = setTimeout(
      () =>
        simulateDrop(
          (zone.current?.firstElementChild?.firstElementChild as HTMLElement) ?? null,
          [
            fake("roadmap.pdf", "application/pdf", 240_000),
            fake("screen-recording.mov", "video/quicktime", 4_000),
            fake("dataset.csv", "text/csv", 30 * 1024 * 1024),
          ],
        ),
      1200,
    );
    return () => clearTimeout(timer);
  }, [autoplay, variant]);

  if (variant === "Overlay") {
    return (
      <DropOverlay
        show={show || undefined}
        onFiles={(files) => setAttached((a) => [...a, ...files.map((f) => f.name)])}
        className="w-full max-w-md rounded-[1.375rem] bg-surface p-1.5"
      >
        <div className="flex h-56 flex-col justify-end gap-2 rounded-2xl bg-surface-inset p-4">
          <p className="max-w-[80%] self-end rounded-2xl bg-surface-raised px-3.5 py-2 text-sm">
            Can you compare these numbers with last quarter?
          </p>
          <p className="text-[0.8125rem] text-muted-foreground">
            Drag a file anywhere over this chat.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5 text-[0.8125rem] text-muted-foreground">
          <Paperclip weight="fill" aria-hidden="true" className="size-4" />
          {attached.length ? attached.join(", ") : "No attachments"}
        </div>
      </DropOverlay>
    );
  }

  return (
    <div ref={zone} className="w-full max-w-md">
      <DropZone
        accept="application/pdf,image/*,.csv"
        maxSize={10 * 1024 * 1024}
        onFiles={(files) => setAttached((a) => [...a, ...files.map((f) => f.name)])}
      />
      {attached.length > 0 && (
        <p className="mt-2 px-1 text-[0.8125rem] text-muted-foreground">
          Attached: {attached.join(", ")}
        </p>
      )}
    </div>
  );
}
