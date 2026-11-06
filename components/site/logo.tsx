import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

// A pixel-textured stone block in isometric view: an 8×8 grid on each face,
// lit from the top left. Shades come from a fixed hash, so it never changes.
const N = 8;
// Each face has its own greys: lit top, mid left, shaded right.
const faces = [
  {
    matrix: "9.5 -5.5 9.5 5.5 2.5 6.5",
    stone: ["#a3a5a0", "#8f918d", "#7d7f7b", "#b4b6b0"],
  },
  { matrix: "9.5 5.5 0 11 2.5 6.5", stone: ["#6b6d71", "#5c5e62", "#4e5054", "#7a7c80"] },
  { matrix: "9.5 -5.5 0 11 12 12", stone: ["#45474b", "#3a3c40", "#303236", "#525458"] },
];

function shade(face: number, u: number, v: number) {
  let h = (face + 1) * 374761393 + u * 668265263 + v * 2147483647;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  const noise = ((h ^ (h >>> 16)) >>> 0) % 4;
  // Neighbouring cells share a shade now and then, so it reads as stone, not noise.
  const clump = (u + v * 3 + face) % 5 === 0 ? 0 : noise;
  return faces[face].stone[clump];
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="2 0.5 20 23"
      aria-hidden="true"
      shapeRendering="crispEdges"
      className={cn("h-6 w-auto", className)}
    >
      {faces.map((face, f) => (
        <g key={f} transform={`matrix(${face.matrix})`}>
          {Array.from({ length: N * N }, (_, i) => {
            const u = i % N;
            const v = Math.floor(i / N);
            return (
              <rect
                key={i}
                x={u / N}
                y={v / N}
                // A hair larger than a cell so no seams show between them.
                width={1 / N + 0.01}
                height={1 / N + 0.01}
                fill={shade(f, u, v)}
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
}

/** The block mark and the wordmark, set in Orbitron. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} home`}
      className={cn(
        "flex items-center gap-2 rounded-md font-logo text-[0.9375rem] font-bold tracking-[0.08em]",
        className,
      )}
    >
      <LogoMark />
      {siteConfig.name}
    </Link>
  );
}
