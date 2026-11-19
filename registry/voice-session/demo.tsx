"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  VoiceSession,
  type VoiceActivity,
  type VoiceOption,
  type VoiceSessionLabels,
  type VoiceTurn,
} from "./voice-session";

const VOICE_IDS = ["ember", "slate", "juniper", "basalt"];
const VOICE_NAMES = ["Ember", "Slate", "Juniper", "Basalt"];

/** Keeps an amount or card number in reading order inside RTL text. */
const ltr = (text: string) => `\u2066${text}\u2069`;

/** The same call in each demo language; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    title: string;
    /** Voice hints, in `VOICE_IDS` order. */
    hints: [string, string, string, string];
    earlier: [string, string];
    answer: string;
    /** Words Wren gets out before Maya talks over her. */
    cutAt: number;
    barge: string;
    fix: string;
    labels?: Partial<VoiceSessionLabels>;
  }
> = {
  en: {
    title: "Billing call",
    hints: ["warm", "calm", "bright", "low"],
    earlier: [
      "Hi Maya, this is Wren from billing. What can I help with?",
      "I was charged twice for the Pro plan this month.",
    ],
    answer:
      "I can see two charges of $24 on November 3. The second is a pending hold from your card update, and it usually drops off within five business days, so you won't need to do anything.",
    cutAt: 21,
    barge: "Can you just refund it now? Rent comes out Friday.",
    fix: "Of course. I've refunded the duplicate $24 to your Visa ending 4417. It should show up in three to five days.",
  },
  he: {
    title: "שיחת חיובים",
    hints: ["חם", "רגוע", "בהיר", "עמוק"],
    earlier: [
      "היי Maya, כאן Wren ממחלקת החיובים. איך אפשר לעזור?",
      "חויבתי פעמיים על חבילת Pro החודש.",
    ],
    answer: `אני רואה שני חיובים של ${ltr("$24")} מה־3 בנובמבר. השני הוא חיוב זמני שנוצר כשעדכנת את הכרטיס, ובדרך כלל הוא נעלם תוך חמישה ימי עסקים, כך שלא צריך לעשות כלום.`,
    cutAt: 19,
    barge: "אפשר פשוט להחזיר את זה עכשיו? שכר הדירה יורד ביום שישי.",
    fix: `בטח. החזרתי את החיוב הכפול של ${ltr("$24")} לכרטיס ה־Visa שמסתיים ב־${ltr("4417")}. הכסף אמור להופיע תוך שלושה עד חמישה ימים.`,
    labels: {
      you: "אתה",
      thinking: "חושבת",
      listening: "מקשיבה",
      connecting: "מתחבר",
      muted: "מושתק",
      onHold: "בהמתנה",
      speaking: (agentName) => `${agentName} מדברת`,
      voice: (voiceLabel) => `קול ${voiceLabel}`,
      voicePicker: (voiceLabel) => `קול: ${voiceLabel}`,
      callTime: (time) => `משך השיחה ${time}`,
      emptyTranscript: "התמלול יופיע כאן כשתדברו.",
      interrupted: "נקטע",
      interruptedNote: " (נקטע)",
      mute: "השתקה",
      unmute: "ביטול השתקה",
      hold: "המתנה",
      resume: "חזרה לשיחה",
      end: "סיום",
    },
  },
  ar: {
    title: "مكالمة الفوترة",
    hints: ["دافئ", "هادئ", "مشرق", "عميق"],
    earlier: [
      "مرحبًا Maya، معك Wren من قسم الفوترة. كيف أساعدك؟",
      "خُصم مني مرتين مقابل باقة Pro هذا الشهر.",
    ],
    answer: `أرى رسمين بقيمة ${ltr("$24")} في 3 نوفمبر. الثاني حجز مؤقت ناتج عن تحديث بطاقتك، وعادةً يختفي خلال خمسة أيام عمل، فلن تحتاج إلى فعل أي شيء.`,
    cutAt: 18,
    barge: "هل يمكنك استرداده الآن فقط؟ الإيجار يُخصم يوم الجمعة.",
    fix: `بالتأكيد. استرددت الرسم المكرر بقيمة ${ltr("$24")} إلى بطاقة Visa المنتهية بـ ${ltr("4417")}. سيظهر خلال ثلاثة إلى خمسة أيام.`,
    labels: {
      you: "أنت",
      thinking: "تفكّر",
      listening: "تستمع",
      connecting: "جارٍ الاتصال",
      muted: "مكتوم",
      onHold: "في الانتظار",
      speaking: (agentName) => `${agentName} تتحدث`,
      voice: (voiceLabel) => `صوت ${voiceLabel}`,
      voicePicker: (voiceLabel) => `الصوت: ${voiceLabel}`,
      callTime: (time) => `مدة المكالمة ${time}`,
      emptyTranscript: "سيظهر النص المكتوب هنا أثناء حديثك.",
      interrupted: "مقاطعة",
      interruptedNote: " (مقاطعة)",
      mute: "كتم",
      unmute: "إلغاء الكتم",
      hold: "انتظار",
      resume: "استئناف",
      end: "إنهاء",
    },
  },
};

type State = { activity: VoiceActivity; turns: VoiceTurn[] };

const count = (text: string) => text.split(/\s+/).filter(Boolean).length;

/** One step per word, with an uneven cadence like real speech. */
function speak(
  id: string,
  speaker: "user" | "agent",
  text: string,
  { upTo = count(text), pace = 210 } = {},
): MockStep<State>[] {
  const steps: MockStep<State>[] = [
    {
      delay: 0,
      apply: (s) => ({
        activity: speaker,
        turns: [...s.turns, { id, speaker, text, spoken: 0 }],
      }),
    },
  ];
  for (let w = 1; w <= upTo; w++) {
    steps.push({
      delay:
        pace +
        ((w * 7919) % 5) * 22 +
        (/[.,?]$/.test(text.split(" ")[w - 2] ?? "") ? 180 : 0),
      apply: (s) => ({
        ...s,
        turns: s.turns.map((t) => (t.id === id ? { ...t, spoken: w } : t)),
      }),
    });
  }
  return steps;
}

const finish = (id: string, patch: Partial<VoiceTurn> = {}): MockStep<State> => ({
  delay: 260,
  apply: (s) => ({
    ...s,
    turns: s.turns.map((t) => (t.id === id ? { ...t, spoken: undefined, ...patch } : t)),
  }),
});

const set = (activity: VoiceActivity, delay = 0): MockStep<State> => ({
  delay,
  apply: (s) => ({ ...s, activity }),
});

function script({
  answer,
  cutAt,
  barge,
  fix,
}: (typeof copy)[DemoLocale]): MockStep<State>[] {
  return [
    set("thinking", 600),
    wait(1100),
    ...speak("t3", "agent", answer, { upTo: cutAt }),
    // Maya talks over Wren: the line is cut where it was and marked.
    {
      delay: 160,
      apply: (s) => ({
        activity: "user",
        turns: s.turns.map((t) =>
          t.id === "t3"
            ? {
                ...t,
                text: answer.split(" ").slice(0, cutAt).join(" "),
                spoken: undefined,
                interrupted: true,
              }
            : t,
        ),
      }),
    },
    wait(120),
    ...speak("t4", "user", barge, { pace: 250 }),
    finish("t4"),
    set("thinking", 200),
    wait(1000),
    ...speak("t5", "agent", fix),
    finish("t5"),
    set("listening", 100),
  ];
}

const earlier = (text: (typeof copy)[DemoLocale]): VoiceTurn[] => [
  { id: "t1", speaker: "agent", text: text.earlier[0] },
  { id: "t2", speaker: "user", text: text.earlier[1] },
];

/** The barge-in moment, for the still thumbnail. */
const still = (text: (typeof copy)[DemoLocale]): State => ({
  activity: "user",
  turns: [
    ...earlier(text),
    {
      id: "t3",
      speaker: "agent",
      text: text.answer.split(" ").slice(0, text.cutAt).join(" "),
      interrupted: true,
    },
    { id: "t4", speaker: "user", text: text.barge, spoken: 6 },
  ],
});

/** A believable speech envelope: syllables, phrase swells and short gaps. */
function speech(t: number, seed: number) {
  const syllable = Math.abs(Math.sin(t / 88 + seed));
  const phrase = 0.6 + 0.4 * Math.sin(t / 640 + seed * 2);
  const gap = Math.sin(t / 410 + seed * 3) > 0.88 ? 0.12 : 1;
  return Math.min(1, (0.2 + 0.8 * syllable) * phrase * gap + Math.random() * 0.08);
}

export default function VoiceSessionDemo({
  autoplay = true,
  thumbnail = false,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  thumbnail?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const voices: VoiceOption[] = VOICE_IDS.map((value, i) => ({
    value,
    label: VOICE_NAMES[i],
    hint: text.hints[i],
  }));
  const { state } = useMockRun<State>(
    autoplay ? { activity: "listening", turns: earlier(text) } : still(text),
    autoplay ? script(text) : [],
    { autoplay },
  );
  const [startedAt] = useState(() => Date.now() - 154_000);
  const [muted, setMuted] = useState(false);
  const [held, setHeld] = useState(false);

  // The level source reads the latest activity without re-creating itself.
  const activity = useRef(state.activity);
  useLayoutEffect(() => {
    activity.current = state.activity;
  });
  const [getLevel] = useState(() => () => {
    const t = performance.now();
    const a = activity.current;
    if (a === "user") return speech(t, 1.7);
    if (a === "agent") return speech(t, 0.4) * 0.92;
    // Room noise on an open mic.
    return 0.12 + Math.random() * 0.1;
  });

  return (
    <VoiceSession
      agentName="Wren"
      title={text.title}
      activity={state.activity}
      getLevel={getLevel}
      turns={thumbnail ? state.turns.slice(1) : state.turns}
      startedAt={startedAt}
      muted={muted}
      onMutedChange={setMuted}
      held={held}
      onHeldChange={setHeld}
      voices={voices}
      labels={text.labels}
      defaultVoice="ember"
      onEnd={() => {}}
    />
  );
}
