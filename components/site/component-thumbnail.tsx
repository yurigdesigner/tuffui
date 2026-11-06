"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Demo } from "@/components/docs/demo";

const STAGE = 600;
// Screens render at a desktop size with a fixed height.
const SCREEN = { width: 1280, height: 800 };

/**
 * The real component, scaled down. It shows the demo's first frame and plays the
 * scripted run while the card is hovered or focused.
 */
export function ComponentThumbnail({
  slug,
  variant,
  playing,
  screen = false,
}: {
  slug: string;
  variant: string;
  playing: boolean;
  screen?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "200px" });
  const [scale, setScale] = useState(0.5);

  // Fit the demo inside the card both ways, then center it.
  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;
    const fit = () => {
      if (screen) {
        // A screen fills the card edge to edge.
        setScale(
          Math.max(frame.clientWidth / SCREEN.width, frame.clientHeight / SCREEN.height),
        );
        return;
      }
      const width = (frame.clientWidth - 32) / STAGE;
      const height = stage.current
        ? (frame.clientHeight - 32) / Math.max(stage.current.offsetHeight, 1)
        : 1;
      setScale(Math.min(1, width, height));
    };
    const observer = new ResizeObserver(fit);
    observer.observe(frame);
    if (stage.current) observer.observe(stage.current);
    return () => observer.disconnect();
  }, [inView, screen]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      inert
      className="pointer-events-none relative h-full w-full overflow-hidden select-none"
    >
      {inView && (
        <div
          ref={stage}
          className="absolute top-1/2 left-1/2 flex justify-center"
          style={{
            width: screen ? SCREEN.width : STAGE,
            height: screen ? SCREEN.height : undefined,
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "50% 50%",
          }}
        >
          <Demo
            key={playing ? "play" : "still"}
            slug={slug}
            variant={variant}
            autoplay={playing}
          />
        </div>
      )}
    </div>
  );
}
