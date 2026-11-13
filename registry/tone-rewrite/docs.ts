import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ToneRewrite, type ToneValue } from "@/components/ui/tone-rewrite";

export function RewriteSelection({ doc, selection }: { doc: Doc; selection: string }) {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState<ToneValue>({ x: 0, y: 0 });
  // useRewrite streams bullets from your model: ["Net retention held…", "Expansion…"]
  const { status, bullets, total, start, stop } = useRewrite();

  return (
    <ToneRewrite
      attachment={{ name: doc.title, words: doc.words, origin: "Docs" }}
      onRemoveAttachment={() => closeRewrite()}
      source={selection}
      prompt={prompt}
      onPromptChange={setPrompt}
      models={[
        { value: "fast", label: "Chord Fast", hint: "fastest" },
        { value: "pro", label: "Chord Pro", hint: "best writing" },
      ]}
      lengths={[
        { value: "concise", label: "Concise" },
        { value: "thorough", label: "Thorough" },
      ]}
      tone={tone}
      onToneChange={setTone}
      wordRange={[20, 120]}
      status={status} // "idle" | "writing" | "done"
      output={bullets}
      progress={{ current: bullets.length, total }}
      onSend={({ prompt, tone, words, model, length }) =>
        start({ selection, prompt, tone, words, model, length })
      }
      onStop={stop}
      onReplace={(text) => editor.replaceSelection(text)}
      onInsert={(text) => editor.insertAfterSelection(text)}
      followUps={[
        { id: "shorter", label: "Shorter", nudge: { y: -0.3 } },
        { id: "numbers", label: "Add numbers" },
        { id: "formal", label: "More formal", nudge: { x: -0.3 } },
      ]}
      onFollowUp={(f, tone) => start({ selection, prompt: f.label, tone })}
    />
  );
}`,
  props: [
    {
      name: "source",
      type: "string",
      required: true,
      description:
        "The selected text being rewritten, shown as a quote with an accent bar.",
    },
    {
      name: "attachment",
      type: "ToneRewriteAttachment",
      description:
        'Chip above the quote: document name, word count and "from Docs" at the right.',
    },
    {
      name: "onRemoveAttachment",
      type: "() => void",
      description: "Shows × on the attachment chip.",
    },
    {
      name: "sourceWords",
      type: "number",
      default: "attachment.words, then words in source",
      description: 'Left side of "142 → 46" in the status row.',
    },
    {
      name: "prompt",
      type: "string",
      description:
        "Controlled instructions. Enter sends; once a result is in, Enter replaces the selection until the prompt changes, and ⌘/Ctrl+Enter inserts below.",
    },
    {
      name: "defaultPrompt",
      type: "string",
      default: '""',
      description: "Starting instructions when uncontrolled.",
    },
    {
      name: "onPromptChange",
      type: "(prompt: string) => void",
      description: "Called as the user types.",
    },
    {
      name: "placeholder",
      type: "string",
      default: '"Tell the model how to rewrite it"',
      description: "Shown while the prompt is empty.",
    },
    {
      name: "models",
      type: "ToneRewriteOption[]",
      default: "[]",
      description: "Model menu with a sparkle icon. Hidden when empty.",
    },
    {
      name: "model / defaultModel / onModelChange",
      type: "string / string / (model: string) => void",
      default: "first model",
      description: "Selected model, controlled or not.",
    },
    {
      name: "lengths",
      type: "ToneRewriteOption[]",
      default: "[]",
      description: 'Length menu, e.g. "Concise". Hidden when empty.',
    },
    {
      name: "length / defaultLength / onLengthChange",
      type: "string / string / (length: string) => void",
      default: "first length",
      description: "Selected length, controlled or not.",
    },
    {
      name: "tone",
      type: "ToneValue",
      description:
        "Controlled handle on the tone pad. Changes made from outside, like an agent or a follow-up, glide into place; drags and arrow keys follow at once.",
    },
    {
      name: "defaultTone",
      type: "ToneValue",
      default: "{ x: 0, y: 0 }",
      description: "Starting handle when uncontrolled.",
    },
    {
      name: "onToneChange",
      type: "(tone: ToneValue) => void",
      description:
        "Called while the handle is dragged or moved with the keyboard, and when a follow-up nudges it. Arrows move it, Shift moves further, Home resets to neutral.",
    },
    {
      name: "wordRange",
      type: "[number, number]",
      default: "[20, 120]",
      description: "Target words at the Brief and Detailed ends of the pad.",
    },
    {
      name: "estimateWords",
      type: "(tone: ToneValue) => number",
      description:
        "Your own target length. Defaults to `wordRange` along y, rounded to 5.",
    },
    {
      name: "formatEstimate",
      type: "(words: number) => string",
      description:
        'Text right of "Tone". Defaults to "≈ 45 words" with a rolling number.',
    },
    {
      name: "describeRegister",
      type: "(x: number) => string",
      default: "defaultRegister",
      description:
        'Name for the formal–casual position, next to "Tone" and in the slider\'s screen-reader text, e.g. "Fairly formal".',
    },
    {
      name: "labels",
      type: "{ formal?; casual?; brief?; detailed? }",
      description: "Axis labels on the pad.",
    },
    {
      name: "status",
      type: '"idle" | "writing" | "done"',
      default: '"idle"',
      description:
        "Writing shows the status row and a caret; done adds Replace, Insert, Copy and the follow-ups.",
    },
    {
      name: "output",
      type: "string[] | string",
      description:
        "The rewrite as you stream it: bullets, or one block of text. New words fade in as they arrive.",
    },
    {
      name: "progress",
      type: "{ current: number; total: number }",
      description: '"2 of 3" in the status row. The bar fills toward the target length.',
    },
    {
      name: "writingLabel / doneLabel",
      type: "string",
      default: '"Writing" / "Done"',
      description: "Status row label.",
    },
    {
      name: "onSend",
      type: "(request: ToneRewriteRequest) => void",
      description: "Called with the prompt, tone, target words, model and length.",
    },
    {
      name: "onStop",
      type: "() => void",
      description:
        "Shows Stop with an esc key cap while writing; Esc anywhere in the card stops.",
    },
    {
      name: "onReplace",
      type: "(output: string) => void",
      description:
        "Shows Replace selection. Bullets arrive joined with “• ” and new lines.",
    },
    {
      name: "onInsert",
      type: "(output: string) => void",
      description: "Shows Insert below.",
    },
    {
      name: "onCopy",
      type: "(output: string) => void",
      default: "writes to the clipboard",
      description: "Copy button at the end of the action row.",
    },
    {
      name: "followUps",
      type: "ToneRewriteFollowUp[]",
      default: "[]",
      description: 'Chips in the "Then" row once a result is in.',
    },
    {
      name: "onFollowUp",
      type: "(followUp, tone: ToneValue) => void",
      description:
        "Called after the chip's `nudge` moves the handle, with the new tone. Start the rerun here.",
    },
    {
      name: "onAttach",
      type: "() => void",
      description: "Shows the round + button.",
    },
    {
      name: "onVoice",
      type: "() => void",
      description: "Shows the mic button.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `// x: -1 formal … 1 casual. y: -1 brief … 1 detailed.
type ToneValue = { x: number; y: number };

type ToneRewriteAttachment = { name: string; words?: number; origin?: string };

type ToneRewriteOption = { value: string; label: string; hint?: string };

type ToneRewriteFollowUp = {
  id: string;
  label: string;
  nudge?: Partial<ToneValue>; // added to the tone before the rerun
};

type ToneRewriteRequest = {
  prompt: string;
  tone: ToneValue;
  words: number; // target length from the pad
  model?: string;
  length?: string;
};

// "Formal", "Fairly formal", "Neutral", "Fairly casual", "Casual".
function defaultRegister(x: number): string;`,
};
