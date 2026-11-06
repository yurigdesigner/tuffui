"use client";

import { useEffect, useState } from "react";
import { RollingNumber } from "@/components/ui/rolling-number";

const usd = (n: number) => `$${n.toFixed(2)}`;
const tokens = (n: number) => (n < 1000 ? `${n}` : `${(n / 1000).toFixed(1)}k`);

export default function RollingNumberDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => setN((v) => v + 1), 1400);
    return () => clearInterval(timer);
  }, [autoplay]);

  if (variant === "Currency") {
    return (
      <div className="flex flex-col items-center gap-1">
        <RollingNumber
          value={125.2 + n * 3.87}
          format={usd}
          className="text-4xl font-medium tracking-tight"
        />
        <span className="text-[0.8125rem] text-muted-foreground">spent this month</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-1">
      <RollingNumber
        value={tokens(48_200 + n * 6_350)}
        className="font-mono text-4xl font-medium tracking-tight"
      />
      <span className="text-[0.8125rem] text-muted-foreground">of 200k tokens</span>
    </div>
  );
}
