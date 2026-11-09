"use client";

import { useMockRun, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { EvalRace, type EvalRacer } from "./eval-race";

// Seeded noise so the server and the client draw the same race.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

type Entrant = {
  id: string;
  label: string;
  /** Cases per tick. */
  pace: number;
  /** Pace multiplier per lap — some models slow down on the harder batches. */
  form: number[];
  start: number;
};

const TICK = 250;
// Lap times read like a real run: one tick of the demo is two seconds of eval.
const SECONDS_PER_TICK = 2;

/** Plays the race out tick by tick until every model has scored the whole set. */
function simulate(entrants: Entrant[], total: number, perLap: number, seed: number) {
  const next = rng(seed);
  // Runs joined mid-race get the laps they already have on the clock.
  const tickOf = (e: Entrant, lap: number) => perLap / (e.pace * (e.form[lap] ?? 1));
  const racers = entrants.map((e) => {
    const done = Math.floor(e.start / perLap);
    return {
      id: e.id,
      label: e.label,
      scored: e.start,
      laps: Array.from(
        { length: done },
        (_, k) => Math.round(tickOf(e, k) * SECONDS_PER_TICK * (9.6 + next())) / 10,
      ),
      since: ((e.start % perLap) / perLap) * tickOf(e, done),
    };
  });
  const frames: EvalRacer[][] = [];
  const snap = () =>
    racers.map(({ id, label, scored, laps }) => ({
      id,
      label,
      scored,
      laps: [...laps],
    }));
  frames.push(snap());
  for (let tick = 1; tick < 400 && racers.some((r) => r.scored < total); tick++) {
    racers.forEach((r, i) => {
      if (r.scored >= total) return;
      const e = entrants[i];
      const lap = Math.floor(r.scored / perLap);
      const step = e.pace * (e.form[lap] ?? 1) * (0.88 + next() * 0.24);
      const scored = Math.min(total, r.scored + Math.max(1, Math.round(step)));
      r.since += 1;
      if (Math.floor(scored / perLap) > lap || scored === total) {
        // Interpolate the crossing so lap times aren't stuck to whole ticks.
        const over = (scored - (lap + 1) * perLap) / (scored - r.scored);
        const t = r.since - Math.max(over, 0);
        r.laps.push(Math.round(t * SECONDS_PER_TICK * 10) / 10);
        r.since = Math.max(over, 0);
      }
      r.scored = scored;
    });
    frames.push(snap());
  }
  return frames;
}

const RACE = {
  total: 400,
  perLap: 100,
  frames: simulate(
    [
      {
        id: "kestrel",
        label: "kestrel-4",
        pace: 7.4,
        form: [1.08, 1.06, 0.9, 0.93],
        start: 6,
      },
      {
        id: "wren",
        label: "wren-2.5",
        pace: 7.2,
        form: [0.96, 0.98, 1.08, 1.06],
        start: 4,
      },
      {
        id: "osprey",
        label: "osprey-pro",
        pace: 7,
        form: [1, 0.96, 1.06, 1.2],
        start: 2,
      },
      {
        id: "heron",
        label: "heron-flash",
        pace: 6.1,
        form: [1, 1.24, 1, 0.86],
        start: 0,
      },
      {
        id: "puffin",
        label: "puffin-mini",
        pace: 5.3,
        form: [1, 1, 1.02, 1.05],
        start: 0,
      },
    ],
    400,
    100,
    7,
  ),
};

const STANDINGS = {
  total: 600,
  perLap: 200,
  frames: simulate(
    [
      {
        id: "fern",
        label: "fern-large",
        pace: 9.6,
        form: [1.04, 0.95, 0.98],
        start: 238,
      },
      { id: "moss", label: "moss-7", pace: 9.4, form: [0.98, 1.06, 1.04], start: 226 },
      { id: "sedge", label: "sedge-r1", pace: 9.1, form: [1, 1.02, 1.06], start: 212 },
      { id: "ivy", label: "ivy-tools", pace: 8.4, form: [1.02, 1, 1], start: 196 },
      { id: "thistle", label: "thistle-lite", pace: 7.6, form: [1, 1, 1], start: 170 },
      { id: "bramble", label: "bramble-2", pace: 6.4, form: [1, 1, 1.08], start: 132 },
    ],
    600,
    200,
    23,
  ),
};

type State = { frame: number };

export default function EvalRaceDemo({
  variant = "Race",
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const race = variant === "Standings" ? STANDINGS : RACE;
  const last = race.frames.length - 1;
  const steps: MockStep<State>[] = autoplay
    ? race.frames.slice(1).map(() => ({
        delay: TICK,
        apply: (s) => ({ frame: Math.min(s.frame + 1, last) }),
      }))
    : [];
  const { state } = useMockRun<State>({ frame: autoplay ? 0 : last }, steps, {
    autoplay,
  });
  const racers = race.frames[state.frame];

  if (variant === "Standings") {
    return (
      <EvalRace
        layout="standings"
        title="Tool-use suite"
        subtitle="6 models · 600 cases · run 2214"
        racers={racers}
        total={race.total}
        perLap={race.perLap}
      />
    );
  }
  return (
    <EvalRace
      title="Eval race"
      subtitle="5 models · 400 cases · support-bench v3"
      racers={racers}
      total={race.total}
      perLap={race.perLap}
    />
  );
}
