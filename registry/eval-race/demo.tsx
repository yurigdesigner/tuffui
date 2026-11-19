"use client";

import { useMockRun, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import type { DemoLocale } from "@/components/docs/demo";
import { EvalRace, type EvalRaceLabels, type EvalRacer } from "./eval-race";

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

/** Keeps a Latin name in reading order inside RTL text. */
const ltr = (text: string) => `\u2066${text}\u2069`;

/** Arabic counted noun: 1, 2, 3–10, 11+. */
const ar = (n: number, one: string, two: string, few: string, many: string) =>
  n === 1 ? one : n === 2 ? two : n <= 10 ? `${n} ${few}` : `${n} ${many}`;

/** Model names stay as they are; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    race: { title: string; subtitle: string };
    standings: { title: string; subtitle: string };
    locale?: string;
    formatTime?: (seconds: number) => string;
    labels?: Partial<EvalRaceLabels>;
  }
> = {
  en: {
    race: { title: "Eval race", subtitle: "5 models · 400 cases · support-bench v3" },
    standings: { title: "Tool-use suite", subtitle: "6 models · 600 cases · run 2214" },
  },
  he: {
    race: {
      title: "מרוץ הערכה",
      subtitle: `5 מודלים · 400 מקרים · ${ltr("support-bench v3")}`,
    },
    standings: {
      title: "חבילת שימוש בכלים",
      subtitle: "6 מודלים · 600 מקרים · ריצה 2214",
    },
    locale: "he-IL",
    formatTime: (s) => `${s.toFixed(1)} שנ׳`,
    labels: {
      subtitle: (models, cases) => `${models} מודלים · ${cases} מקרים`,
      leaderLine: (name, state, margin) =>
        `${ltr(name)} ${state === "wins" ? "מנצח" : state === "finished" ? "סיים ראשון" : "מוביל"}${margin ? ` ${margin}` : ""}`,
      byLaps: (n) => (n === 1 ? "בהפרש של הקפה" : `בהפרש של ${n} הקפות`),
      byCases: (n) => (n === 1 ? "בהפרש של מקרה אחד" : `בהפרש של ${n} מקרים`),
      byTime: (time) => `בהפרש של ${time}`,
      noRacers: "אין עדיין משתתפים",
      casesScored: (perLap) => `מקרים שנבדקו · הקפה = ${perLap}`,
      final: "סופי",
      live: "חי",
      lapOf: (lap, laps) => `הקפה ${lap} מתוך ${laps}`,
      lap: (lap) => `הקפה ${lap}`,
      fastestLap: (name) => `ההקפה המהירה · ${ltr(name)}`,
      firstLap: (perLap) => `הקפה ראשונה · ${perLap} מקרים`,
      columns: {
        pos: "מק׳",
        model: "מודל",
        laps: "הקפות",
        gap: "פער",
        last: "אחרונה",
        best: "מיטבית",
      },
      leader: "מוביל",
      lapsBehind: (n) => (n === 1 ? "+1 הקפה" : `+${n} הקפות`),
      standingsAria: (title) => `דירוג ${title}. מקשי החיצים עוברים בין המודלים.`,
      table: {
        position: "מקום",
        model: "מודל",
        scored: "מקרים שנבדקו",
        lap: "הקפה",
        gap: "פער",
        last: "הקפה אחרונה",
        best: "הקפה מיטבית",
      },
      of: (value, total) => `${value} מתוך ${total}`,
      finished: "סיים",
      none: "אין",
      focused: (rank, name, scored, total, gap) =>
        `מקום ${rank}, ${ltr(name)}, ${scored} מתוך ${total} מקרים, ${gap}`,
      status: (name, final) => `${ltr(name)} ${final ? "מנצח" : "מוביל"}`,
    },
  },
  ar: {
    race: {
      title: "سباق التقييم",
      subtitle: `5 نماذج · 400 حالة · ${ltr("support-bench v3")}`,
    },
    standings: {
      title: "مجموعة استخدام الأدوات",
      subtitle: "6 نماذج · 600 حالة · التشغيل 2214",
    },
    locale: "ar",
    formatTime: (s) => `${s.toFixed(1)} ث`,
    labels: {
      subtitle: (models, cases) =>
        `${ar(models, "نموذج واحد", "نموذجان", "نماذج", "نموذجًا")} · ${cases} حالة`,
      leaderLine: (name, state, margin) =>
        `${state === "wins" ? "يفوز" : state === "finished" ? "أنهى أولًا" : "يتصدّر"} ${ltr(name)}${margin ? ` ${margin}` : ""}`,
      byLaps: (n) => `بفارق ${ar(n, "لفة واحدة", "لفتين", "لفات", "لفة")}`,
      byCases: (n) => `بفارق ${ar(n, "حالة واحدة", "حالتين", "حالات", "حالة")}`,
      byTime: (time) => `بفارق ${time}`,
      noRacers: "لا متسابقين بعد",
      casesScored: (perLap) => `الحالات المقيَّمة · اللفة = ${perLap}`,
      final: "نهائي",
      live: "مباشر",
      lapOf: (lap, laps) => `اللفة ${lap} من ${laps}`,
      lap: (lap) => `اللفة ${lap}`,
      fastestLap: (name) => `أسرع لفة · ${ltr(name)}`,
      firstLap: (perLap) => `اللفة الأولى · ${perLap} حالة`,
      columns: {
        pos: "#",
        model: "النموذج",
        laps: "اللفات",
        gap: "الفارق",
        last: "الأخيرة",
        best: "الأفضل",
      },
      leader: "المتصدّر",
      lapsBehind: (n) => `+${n} ${n >= 3 && n <= 10 ? "لفات" : "لفة"}`,
      standingsAria: (title) =>
        `ترتيب ${title}. استخدم مفاتيح الأسهم للتنقل بين النماذج.`,
      table: {
        position: "المركز",
        model: "النموذج",
        scored: "الحالات المقيَّمة",
        lap: "اللفة",
        gap: "الفارق",
        last: "آخر لفة",
        best: "أفضل لفة",
      },
      of: (value, total) => `${value} من ${total}`,
      finished: "أنهى السباق",
      none: "لا شيء",
      focused: (rank, name, scored, total, gap) =>
        `المركز ${rank}، ${ltr(name)}، ${scored} من ${total} حالة، ${gap}`,
      status: (name, final) => `${final ? "يفوز" : "يتصدّر"} ${ltr(name)}`,
    },
  },
};

type State = { frame: number };

export default function EvalRaceDemo({
  variant = "Race",
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const shared = {
    locale: text.locale,
    formatTime: text.formatTime,
    labels: text.labels,
  };
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
        title={text.standings.title}
        subtitle={text.standings.subtitle}
        {...shared}
        racers={racers}
        total={race.total}
        perLap={race.perLap}
      />
    );
  }
  return (
    <EvalRace
      title={text.race.title}
      subtitle={text.race.subtitle}
      {...shared}
      racers={racers}
      total={race.total}
      perLap={race.perLap}
    />
  );
}
