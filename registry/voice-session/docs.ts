import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { VoiceSession } from "@/components/ui/voice-session";

// Wire your realtime voice client: who has the floor, the transcript, and a
// level source read once per frame from an AnalyserNode.
export function VoiceMode({ call }: Props) {
  const getLevel = () => {
    const analyser = call.activity === "agent" ? call.playback : call.mic;
    analyser.getByteTimeDomainData(buffer);
    return rms(buffer) * 3; // 0–1
  };

  return (
    <VoiceSession
      title="Billing call"
      agentName="Wren"
      activity={call.activity} // "listening" | "user" | "thinking" | "agent"
      getLevel={getLevel}
      turns={call.transcript.map((t) => ({
        id: t.id,
        speaker: t.role, // "user" | "agent"
        text: t.text,
        spoken: t.final ? undefined : t.wordsSoFar, // live lines fill word by word
        interrupted: t.bargedIn, // cut by the user talking over the agent
      }))}
      startedAt={call.startedAt}
      muted={call.muted}
      onMutedChange={call.setMuted}
      held={call.onHold}
      onHeldChange={call.setHold}
      voices={[
        { value: "ember", label: "Ember", hint: "warm" },
        { value: "slate", label: "Slate", hint: "calm" },
      ]}
      voice={call.voice}
      onVoiceChange={call.setVoice}
      onEnd={call.hangUp}
    />
  );
}`,
  props: [
    {
      name: "activity",
      type: '"connecting" | "listening" | "user" | "thinking" | "agent"',
      required: true,
      description:
        "Who has the floor. The user's voice scrolls in as brand-colored dot columns, the agent's is a centered spectrum, thinking is a small hump sweeping along the line, and listening shows the open mic faintly.",
    },
    {
      name: "getLevel",
      type: "() => number",
      description:
        "Loudness 0–1 of whoever is speaking, read once per animation frame — no re-renders. Without it the bars move at a steady half level. Reduced motion draws a still frame instead.",
    },
    {
      name: "turns",
      type: "VoiceTurn[]",
      required: true,
      description:
        "The transcript, oldest first. A turn with `spoken` set is live: its words appear as the count grows and the newest is highlighted. Set `interrupted` on an agent line the user talked over.",
    },
    {
      name: "agentName",
      type: "string",
      default: '"Agent"',
      description: "Label on agent lines, in the legend and in the status pill.",
    },
    {
      name: "title",
      type: "string",
      default: '"Voice"',
      description: "Header title.",
    },
    {
      name: "subtitle",
      type: "string",
      default: '"Wren · Ember voice"',
      description: "Secondary line. Defaults to the agent name and the selected voice.",
    },
    {
      name: "startedAt",
      type: "number | Date | null",
      description:
        "Start of the call. The timer counts up from it every second; it shows 00:00 until mounted so server and client match.",
    },
    {
      name: "muted",
      type: "boolean",
      description:
        "Controlled mute. While muted the mic bars go flat and the pill says Muted; the agent's voice still shows.",
    },
    {
      name: "defaultMuted",
      type: "boolean",
      default: "false",
      description: "Starting mute state when uncontrolled.",
    },
    {
      name: "onMutedChange",
      type: "(muted: boolean) => void",
      description: "Called by the Mute button.",
    },
    {
      name: "held",
      type: "boolean",
      description: "Controlled hold. Bars go still and dim, the pill says On hold.",
    },
    {
      name: "defaultHeld",
      type: "boolean",
      default: "false",
      description: "Starting hold state when uncontrolled.",
    },
    {
      name: "onHeldChange",
      type: "(held: boolean) => void",
      description: "Called by the Hold / Resume button.",
    },
    {
      name: "voices",
      type: "VoiceOption[]",
      default: "[]",
      description: "Voices for the selector in the controls. Empty hides it.",
    },
    {
      name: "voice",
      type: "string",
      description: "Controlled voice `value`.",
    },
    {
      name: "defaultVoice",
      type: "string",
      default: "voices[0].value",
      description: "Starting voice when uncontrolled.",
    },
    {
      name: "onVoiceChange",
      type: "(voice: string) => void",
      description: "Called when a voice is picked.",
    },
    {
      name: "onEnd",
      type: "() => void",
      description: "Called by the End button.",
    },
    {
      name: "labels",
      type: "Partial<VoiceSessionLabels>",
      description:
        'Your own UI strings (You, Mute, Hold, End, status words…), for translating. Right-to-left works under `dir="rtl"`; the level bars and the call timer stay left to right.',
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type VoiceTurn = {
  id: string;
  speaker: "user" | "agent";
  text: string;           // the whole line; only the first \`spoken\` words show
  spoken?: number;        // words heard so far; omit once the line is final
  interrupted?: boolean;  // agent line cut by barge-in
};

type VoiceOption = {
  value: string;
  label: string;          // "Ember"
  hint?: string;          // "warm"
};`,
};
