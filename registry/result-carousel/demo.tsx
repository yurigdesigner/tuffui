"use client";

import { useState } from "react";
import { useMockRun, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { ResultCarousel, type ResultItem } from "./result-carousel";

const hotels: ResultItem[] = [
  {
    id: "h1",
    title: "Casa do Rio",
    meta: "Alfama · 0.6 km from center",
    price: "$214 / night",
    rating: 4.8,
    tint: "#0a84ff",
    badge: "Best match",
    action: "Book",
  },
  {
    id: "h2",
    title: "Miradouro Suites",
    meta: "Graça · city view terrace",
    price: "$188 / night",
    rating: 4.6,
    tint: "#1a9e8c",
    action: "Book",
  },
  {
    id: "h3",
    title: "Hotel Lumen Chiado",
    meta: "Chiado · 0.3 km from center",
    price: "$256 / night",
    rating: 4.7,
    tint: "#bf5af2",
    action: "Book",
  },
  {
    id: "h4",
    title: "Tagus Loft",
    meta: "Cais do Sodré · riverside",
    price: "$171 / night",
    rating: 4.4,
    tint: "#b8862b",
    action: "Book",
  },
  {
    id: "h5",
    title: "Azulejo House",
    meta: "Mouraria · quiet street",
    price: "$149 / night",
    rating: 4.5,
    tint: "#5e5ce6",
    action: "Book",
  },
  {
    id: "h6",
    title: "Bairro Studio",
    meta: "Bairro Alto · walk-up",
    price: "$132 / night",
    rating: 4.2,
    tint: "#40c8e0",
    action: "Book",
  },
];

// Results stream in as the search tool returns them.
const script: MockStep<ResultItem[]>[] = hotels.slice(2).map((hotel) => ({
  delay: 450,
  apply: (s) => [...s, hotel],
}));

export default function ResultCarouselDemo({
  variant = "Cards",
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const { state } = useMockRun<ResultItem[]>(
    autoplay ? hotels.slice(0, 2) : hotels,
    script,
    {
      autoplay,
    },
  );
  const [picked, setPicked] = useState<string>();

  return (
    <ResultCarousel
      title="Hotels in Lisbon"
      subtitle={picked ? `Booking ${picked}…` : "Nov 14–17 · 2 guests · under $260"}
      compact={variant === "Compact"}
      data={state}
      onAction={(item) => setPicked(item.title)}
    />
  );
}
