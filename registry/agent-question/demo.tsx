"use client";

import { ChatsCircle, Megaphone, Newspaper, PaperPlaneTilt } from "@phosphor-icons/react";
import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  AgentQuestion,
  type AgentQuestionData,
  type AgentQuestionLabels,
  type QuestionAnswer,
} from "./agent-question";

/** Keeps a Latin name or a number run in reading order inside RTL text. */
const ltr = (text: string) => `\u2066${text}\u2069`;

type Copy = {
  single: AgentQuestionData;
  multiple: AgentQuestionData;
  labels?: Partial<AgentQuestionLabels>;
};

const icons = {
  banner: Megaphone,
  email: PaperPlaneTilt,
  blog: Newspaper,
  discord: ChatsCircle,
};

/** Builds the release question from translated text; icons and ids stay the same. */
const announce = (
  question: string,
  options: Record<keyof typeof icons, [string, string]>,
  reason: string,
): AgentQuestionData => ({
  question,
  options: (Object.keys(icons) as (keyof typeof icons)[]).map((id) => ({
    id,
    label: options[id][0],
    description: options[id][1],
    icon: icons[id],
  })),
  multiple: true,
  suggested: { optionId: "banner", reason },
});

/** The same two questions in each demo language; Hebrew and Arabic show the RTL layout. */
const copy: Record<DemoLocale, Copy> = {
  en: {
    single: {
      question: "Which locale should the new onboarding emails ship in first?",
      options: [
        { id: "de", label: "German", description: "31% of last month's sign-ups" },
        { id: "fr", label: "French", description: "18% · footer needs a legal review" },
        { id: "ja", label: "Japanese", description: "12% · longest translation queue" },
        {
          id: "pt",
          label: "Portuguese (Brazil)",
          description: "9% · glossary not started",
        },
      ],
      allowOther: true,
      suggested: {
        optionId: "de",
        reason: "the glossary is done and it's the biggest group.",
      },
    },
    multiple: announce(
      "Where should the 2.4 release be announced?",
      {
        banner: ["In-app banner", "Seen by daily users"],
        email: ["Newsletter", "41k subscribers"],
        blog: ["Blog post", "Long-form, for search"],
        discord: ["Discord", "#announcements"],
      },
      "most users open the app daily.",
    ),
  },
  he: {
    single: {
      question: "באיזו שפה לשלוח קודם את מיילי ההצטרפות החדשים?",
      options: [
        { id: "de", label: "גרמנית", description: "31% מההרשמות בחודש שעבר" },
        { id: "fr", label: "צרפתית", description: "18% · הפוטר צריך בדיקה משפטית" },
        { id: "ja", label: "יפנית", description: "12% · תור התרגום הארוך ביותר" },
        {
          id: "pt",
          label: "פורטוגזית (ברזיל)",
          description: "9% · מילון המונחים עוד לא התחיל",
        },
      ],
      allowOther: true,
      suggested: {
        optionId: "de",
        reason: "מילון המונחים מוכן וזו הקבוצה הגדולה ביותר.",
      },
    },
    multiple: announce(
      `איפה להכריז על גרסה ${ltr("2.4")}?`,
      {
        banner: ["באנר באפליקציה", "מגיע למשתמשים היומיים"],
        email: ["ניוזלטר", `${ltr("41k")} מנויים`],
        blog: ["פוסט בבלוג", "טקסט ארוך, טוב לחיפוש"],
        discord: ["Discord", ltr("#announcements")],
      },
      "רוב המשתמשים פותחים את האפליקציה כל יום.",
    ),
    labels: {
      asks: (agent) => `${agent} שואל`,
      suggests: "מציע",
      suggested: "מוצע",
      selected: "נבחר",
      somethingElse: "משהו אחר…",
      otherPlaceholder: "כתבו לסוכן מה אתם רוצים במקום",
      yourAnswer: "התשובה שלך",
      answer: "שליחה",
      quote: (text) => `„${text}”`,
      letAgentDecide: "שהסוכן יחליט",
      send: (count) => (count === 1 ? "שליחת בחירה אחת" : `שליחת ${count} בחירות`),
      leftTo: (agent) => `ההחלטה הועברה ל־${agent}`,
      goingWith: (option) => `הולך על ${option}`,
      answerSent: "התשובה נשלחה",
      agentWillDecide: "הסוכן יחליט",
      leftToAgent: "ההחלטה הועברה לסוכן",
      undo: "ביטול",
    },
  },
  ar: {
    single: {
      question: "بأي لغة نُطلق رسائل التسجيل الجديدة أولًا؟",
      options: [
        { id: "de", label: "الألمانية", description: "31% من تسجيلات الشهر الماضي" },
        {
          id: "fr",
          label: "الفرنسية",
          description: "18% · التذييل يحتاج إلى مراجعة قانونية",
        },
        { id: "ja", label: "اليابانية", description: "12% · أطول قائمة ترجمة" },
        {
          id: "pt",
          label: "البرتغالية (البرازيل)",
          description: "9% · لم يبدأ العمل على المسرد",
        },
      ],
      allowOther: true,
      suggested: {
        optionId: "de",
        reason: "المسرد جاهز وهي الفئة الأكبر.",
      },
    },
    multiple: announce(
      `أين نعلن عن الإصدار ${ltr("2.4")}؟`,
      {
        banner: ["لافتة داخل التطبيق", "يراها المستخدمون اليوميون"],
        email: ["النشرة البريدية", `${ltr("41k")} مشترك`],
        blog: ["تدوينة", "محتوى مطوّل لمحركات البحث"],
        discord: ["Discord", ltr("#announcements")],
      },
      "معظم المستخدمين يفتحون التطبيق يوميًا.",
    ),
    labels: {
      asks: (agent) => `يسأل ${agent}`,
      suggests: "يقترح",
      suggested: "مقترح",
      selected: "محدد",
      somethingElse: "شيء آخر…",
      otherPlaceholder: "أخبر الوكيل بما تريده بدلًا من ذلك",
      yourAnswer: "إجابتك",
      answer: "إرسال",
      quote: (text) => `«${text}»`,
      letAgentDecide: "دع الوكيل يقرر",
      send: (count) =>
        count === 1
          ? "إرسال خيار واحد"
          : count === 2
            ? "إرسال خيارين"
            : count <= 10
              ? `إرسال ${count} خيارات`
              : `إرسال ${count} خيارًا`,
      leftTo: (agent) => `تُرك القرار لـ${ltr(agent)}`,
      goingWith: (option) => `سيختار ${option}`,
      answerSent: "أُرسلت الإجابة",
      agentWillDecide: "سيقرر الوكيل",
      leftToAgent: "تُرك القرار للوكيل",
      undo: "تراجع",
    },
  },
};

type State = {
  selected: string[];
  status: "pending" | "answered" | "delegated";
  answer?: QuestionAnswer;
};

const singleScript: MockStep<State>[] = [
  wait(2400),
  {
    delay: 0,
    apply: (s) => ({ ...s, status: "answered", answer: { optionIds: ["de"] } }),
  },
];

const multipleScript: MockStep<State>[] = [
  wait(1600),
  { delay: 0, apply: (s) => ({ ...s, selected: ["banner"] }) },
  { delay: 800, apply: (s) => ({ ...s, selected: ["banner", "discord"] }) },
  wait(1300),
  {
    delay: 0,
    apply: (s) => ({ ...s, status: "answered", answer: { optionIds: s.selected } }),
  },
];

export default function AgentQuestionDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const isMultiple = variant === "Multiple";
  const { state, setState } = useMockRun<State>(
    { selected: [], status: "pending" },
    isMultiple ? multipleScript : singleScript,
    { autoplay },
  );

  return (
    <AgentQuestion
      data={isMultiple ? text.multiple : text.single}
      agent={isMultiple ? "launch-agent" : "Claude"}
      labels={text.labels}
      status={state.status}
      answer={state.answer}
      selected={state.selected}
      onSelectedChange={(selected) => setState((s) => ({ ...s, selected }))}
      onSubmit={(answer) => setState((s) => ({ ...s, status: "answered", answer }))}
      onDelegate={() => setState((s) => ({ ...s, status: "delegated" }))}
      onUndo={() => setState({ selected: [], status: "pending" })}
    />
  );
}
