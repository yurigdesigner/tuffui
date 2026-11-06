"use client";

import { RadialDots } from "./radial-dots";

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));

// Runs by hour: scheduled jobs overnight, people during the working day.
const curve = (h: number, peak: number, width: number, height: number) =>
  height * Math.exp(-((h - peak) ** 2) / (2 * width ** 2));
const scheduled = hours.map((_, h) =>
  Math.round(curve(h, 3, 1.4, 60) + curve(h, 21, 1.2, 70) + 4),
);
const people = hours.map((_, h) => Math.round(curve(h, 13, 3, 140)));
const retries = hours.map((_, h) => Math.round(curve(h, 14, 2.5, 30) + 2));

export default function RadialDotsDemo({
  variant = "Runs by hour",
}: {
  variant?: string;
}) {
  const weekdays = variant === "By weekday";
  return weekdays ? (
    <RadialDots
      title="Conversations by weekday"
      subtitle="Support bot · last 8 weeks"
      labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
      axis={[0, 1, 2, 3, 4, 5, 6]}
      series={[
        {
          id: "bot",
          label: "Solved by bot",
          values: [820, 910, 880, 860, 740, 310, 260],
        },
        { id: "human", label: "Handed off", values: [140, 160, 150, 170, 120, 40, 30] },
      ]}
      center={{ value: "78%", caption: "solved by bot" }}
    />
  ) : (
    <RadialDots
      title="Runs by hour"
      subtitle="invoice-agent · last 7 days, UTC"
      labels={hours}
      series={[
        { id: "people", label: "Started by people", values: people },
        { id: "scheduled", label: "Scheduled", values: scheduled },
        { id: "retries", label: "Retries", values: retries },
      ]}
      center={{ value: "32 s", caption: "per run" }}
    />
  );
}
