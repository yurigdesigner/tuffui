"use client";

import {
  ArrowUUpLeft,
  CalendarBlank,
  Package,
  Truck,
  UserSound,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import { AgentQuestion, type AgentQuestionLabels } from "@/components/ui/agent-question";
import type { ThreadMessage } from "@/components/ui/chat-thread";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusPill } from "@/components/ui/status-pill";
import { Inset } from "@/components/ui/surface";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  SupportWidget,
  type SupportWidgetData,
  type SupportWidgetLabels,
} from "./support-widget";

// Fixed clock so the prerendered page and the browser agree.
const base = Date.parse("2026-11-03T14:02:00Z");
const at = (minute: number) => new Date(base + minute * 60_000).toISOString();

type Turn = {
  id: string;
  role: "user" | "assistant";
  author?: string;
  kind: "text" | "order" | "question" | "joined";
  text?: string;
  at: string;
};

type State = {
  open: boolean;
  turns: Turn[];
  mode: SupportWidgetData["mode"];
  quickReplies: boolean;
  askRating: boolean;
};

const BOT = "Ridge";
const HUMAN = "Sam Okafor";

const ltr = (text: string) => `⁦${text}⁩`;

type Copy = {
  locale?: string;
  greeting: string;
  quickReplies: [track: string, ret: string, person: string];
  found: string;
  question: string;
  options: [date: string, ret: string, person: string];
  connecting: string;
  joinedText: string;
  joinedPill: string;
  saturday: string;
  done: string;
  noted: string;
  role: string;
  wait: string;
  order: {
    /** Size line after the product name. */
    size: string;
    number: string;
    status: string;
    steps: [label: string, detail: string][];
    progress: string;
    progressText: string;
  };
  store: {
    nav: string[];
    orders: string;
    kicker: string;
    headline: string;
    sub: string;
  };
  labels?: Partial<SupportWidgetLabels>;
  questionLabels?: Partial<AgentQuestionLabels>;
};

const copy: Record<DemoLocale, Copy> = {
  en: {
    greeting:
      "Hi Alex! I'm Ridge, the Ridgeline help bot. I can track orders, start returns or get you to a person.",
    quickReplies: ["Track my order", "Return an item", "Talk to a person"],
    found: "Found it — your Trail Runner 2 left our Denver warehouse yesterday.",
    question: "Anything else with this order?",
    options: ["Change delivery date", "Start a return", "Talk to a person"],
    connecting:
      "Sure — I'm connecting you with someone from the team. I've passed on your order so you won't have to repeat yourself.",
    joinedText:
      "Hi Alex, Sam here. Your Trail Runner 2s arrive Friday — want me to move delivery to the weekend?",
    joinedPill: `${HUMAN.split(" ")[0]} joined · Support team`,
    saturday: "Yes please, Saturday morning works.",
    done: "Done — Saturday 9–12. You'll get a text the evening before. Anything else?",
    noted: "Got it — I've added that to your order notes.",
    role: "Support team · Denver",
    wait: "~2 min",
    order: {
      size: "Size 10",
      number: "Order #48213 · $139.00",
      status: "In transit",
      steps: [
        ["Ordered", "Oct 30"],
        ["Shipped", "Nov 2"],
        ["Out for delivery", "Fri"],
      ],
      progress: "Delivery progress",
      progressText: "Shipped, arriving Friday",
    },
    store: {
      nav: ["Footwear", "Jackets", "Packs", "Stories"],
      orders: "Orders",
      kicker: "New season",
      headline: "Gear for the long way round.",
      sub: "Free returns for 60 days, repairs for life.",
    },
  },
  he: {
    locale: "he-IL",
    greeting: `היי ${ltr("Alex")}! אני ${ltr("Ridge")}, הבוט של ${ltr("Ridgeline")}. אני יכול לעקוב אחרי הזמנות, לפתוח החזרה או לחבר אותך לנציג.`,
    quickReplies: ["מעקב אחרי ההזמנה שלי", "החזרת פריט", "שיחה עם נציג"],
    found: `מצאתי — ה־${ltr("Trail Runner 2")} שלך יצאו אתמול מהמחסן שלנו בדנוור.`,
    question: "עוד משהו בקשר להזמנה הזו?",
    options: ["שינוי מועד המשלוח", "פתיחת החזרה", "שיחה עם נציג"],
    connecting:
      "בטח — אני מחבר אותך למישהו מהצוות. העברתי את פרטי ההזמנה, כך שלא תצטרך לחזור על עצמך.",
    joinedText: `היי ${ltr("Alex")}, כאן ${ltr("Sam")}. ה־${ltr("Trail Runner 2")} שלך מגיעות ביום שישי — להעביר את המשלוח לסוף השבוע?`,
    joinedPill: `${ltr("Sam")} הצטרף · צוות התמיכה`,
    saturday: "כן בבקשה, שבת בבוקר מתאים לי.",
    done: `סגור — שבת, ${ltr("9–12")}. תקבל הודעה בערב שלפני. עוד משהו?`,
    noted: "קיבלתי — הוספתי את זה להערות של ההזמנה.",
    role: "צוות התמיכה · דנוור",
    wait: "כ־2 דק׳",
    order: {
      size: "מידה 10",
      number: `הזמנה ${ltr("#48213")} · ${ltr("$139.00")}`,
      status: "בדרך",
      steps: [
        ["הוזמן", "30 באוק׳"],
        ["נשלח", "2 בנוב׳"],
        ["יצא למסירה", "שישי"],
      ],
      progress: "התקדמות המשלוח",
      progressText: "נשלח, יגיע ביום שישי",
    },
    store: {
      nav: ["הנעלה", "מעילים", "תיקים", "סיפורים"],
      orders: "הזמנות",
      kicker: "עונה חדשה",
      headline: "ציוד לדרך הארוכה.",
      sub: "החזרה חינם תוך 60 יום, תיקונים לכל החיים.",
    },
    labels: {
      chatWith: (name) => `צ׳אט עם ${name}`,
      repliesInstantly: "בדרך כלל עונה מיד",
      supportTeam: "צוות התמיכה",
      minimise: "מזעור הצ׳אט",
      endChat: "סיום הצ׳אט",
      typing: (name) => `${name} מקליד`,
      thinking: "חושב",
      loading: "טוען",
      waiting: (wait) => `ממתינים לנציג${wait ? ` · ${wait}` : ""}`,
      message: "הודעה",
      placeholder: "כתבו הודעה…",
      waitingPlaceholder: "אפשר להוסיף פרטים בזמן ההמתנה…",
      send: "שליחה",
      openChat: "פתיחת צ׳אט התמיכה",
      hideChat: "הסתרת צ׳אט התמיכה",
      unread: " לא נקראו",
      chatThread: {
        conversation: "שיחה",
        today: "היום",
        yesterday: "אתמול",
        unread: "לא נקראו",
        jumpToLatest: "מעבר להודעה האחרונה",
        fresh: (count) => `${count} חדשות`,
      },
      suggestions: {
        suggestedPrompts: "הצעות לבקשות",
        suggestedFollowUps: "תשובות מהירות",
        moreSuggestions: "הצעות נוספות",
        loadingSuggestions: "טוען הצעות חדשות",
      },
      ratingReasons: ["לא מדויק", "לא עזר", "ארוך מדי", "לא בטוח", "אחר"],
      feedback: {
        thanks: "תודה",
        whatWentWrong: "מה השתבש?",
        whatStoodOut: "מה בלט?",
        reasons: "סיבות",
        note: "הוספת הערה",
        notePlaceholder: "הוספת הערה (לא חובה)",
        cancel: "ביטול",
        send: "שליחת משוב",
        sentThanks: "תודה — נשתמש בזה כדי להשתפר.",
        undo: "בטל",
        question: "איך הייתה התשובה?",
        rating: "דירוג",
        scale: ["גרועה", "חלשה", "סבירה", "טובה", "מצוינת"],
        announceSent: "המשוב נשלח",
        announceHelpful: "סומן כמועיל",
        announceOpen: "ספרו לנו מה השתבש",
      },
    },
    questionLabels: {
      asks: (agent) => `${agent} שואל`,
      suggests: "מציע",
      suggested: "מוצע",
      selected: "נבחר",
      somethingElse: "משהו אחר…",
      otherPlaceholder: "כתבו מה אתם צריכים",
      yourAnswer: "התשובה שלך",
      answer: "שליחה",
      quote: (text) => `„${text}”`,
      letAgentDecide: "שהבוט יחליט",
      send: (count) => (count === 1 ? "שליחת בחירה אחת" : `שליחת ${count} בחירות`),
      leftTo: (agent) => `ההחלטה הועברה ל־${agent}`,
      goingWith: (option) => `הולך על ${option}`,
      answerSent: "התשובה נשלחה",
      agentWillDecide: "הבוט יחליט",
      leftToAgent: "ההחלטה הועברה לבוט",
      undo: "ביטול",
    },
  },
  ar: {
    locale: "ar",
    greeting: `مرحبًا ${ltr("Alex")}! أنا ${ltr("Ridge")}، مساعد ${ltr("Ridgeline")}. أستطيع تتبّع الطلبات وبدء الإرجاع أو تحويلك إلى أحد الموظفين.`,
    quickReplies: ["تتبّع طلبي", "إرجاع منتج", "التحدث إلى موظف"],
    found: `وجدته — غادر ${ltr("Trail Runner 2")} مستودعنا في دنفر أمس.`,
    question: "هل من شيء آخر بخصوص هذا الطلب؟",
    options: ["تغيير موعد التوصيل", "بدء الإرجاع", "التحدث إلى موظف"],
    connecting:
      "بالتأكيد — سأوصلك بأحد أعضاء الفريق. أرسلت لهم تفاصيل طلبك حتى لا تضطر إلى تكرارها.",
    joinedText: `مرحبًا ${ltr("Alex")}، معك ${ltr("Sam")}. يصل ${ltr("Trail Runner 2")} يوم الجمعة — هل تريد نقل التوصيل إلى عطلة نهاية الأسبوع؟`,
    joinedPill: `انضم ${ltr("Sam")} · فريق الدعم`,
    saturday: "نعم من فضلك، صباح السبت يناسبني.",
    done: `تم — السبت ${ltr("9–12")}. ستصلك رسالة نصية في المساء السابق. هل من شيء آخر؟`,
    noted: "تم — أضفت ذلك إلى ملاحظات طلبك.",
    role: "فريق الدعم · دنفر",
    wait: "نحو دقيقتين",
    order: {
      size: "مقاس 10",
      number: `الطلب ${ltr("#48213")} · ${ltr("$139.00")}`,
      status: "قيد الشحن",
      steps: [
        ["تم الطلب", "30 أكتوبر"],
        ["تم الشحن", "2 نوفمبر"],
        ["خرج للتوصيل", "الجمعة"],
      ],
      progress: "تقدّم التوصيل",
      progressText: "تم الشحن، يصل يوم الجمعة",
    },
    store: {
      nav: ["أحذية", "سترات", "حقائب", "قصص"],
      orders: "الطلبات",
      kicker: "موسم جديد",
      headline: "عتاد للطريق الطويل.",
      sub: "إرجاع مجاني خلال 60 يومًا، وإصلاح مدى الحياة.",
    },
    labels: {
      chatWith: (name) => `محادثة مع ${name}`,
      repliesInstantly: "يرد عادةً فورًا",
      supportTeam: "فريق الدعم",
      minimise: "تصغير المحادثة",
      endChat: "إنهاء المحادثة",
      typing: (name) => `${name} يكتب`,
      thinking: "يفكّر",
      loading: "جارٍ التحميل",
      waiting: (wait) => `بانتظار أحد الموظفين${wait ? ` · ${wait}` : ""}`,
      message: "الرسالة",
      placeholder: "اكتب رسالة…",
      waitingPlaceholder: "أضف التفاصيل أثناء الانتظار…",
      send: "إرسال",
      openChat: "فتح محادثة الدعم",
      hideChat: "إخفاء محادثة الدعم",
      unread: " غير مقروءة",
      chatThread: {
        conversation: "المحادثة",
        today: "اليوم",
        yesterday: "أمس",
        unread: "غير مقروءة",
        jumpToLatest: "الانتقال إلى الأحدث",
        fresh: (count) => `${count} جديدة`,
      },
      suggestions: {
        suggestedPrompts: "اقتراحات للطلبات",
        suggestedFollowUps: "ردود سريعة",
        moreSuggestions: "مزيد من الاقتراحات",
        loadingSuggestions: "جارٍ تحميل اقتراحات جديدة",
      },
      ratingReasons: ["غير دقيقة", "غير مفيدة", "طويلة جدًا", "غير آمنة", "أخرى"],
      feedback: {
        thanks: "شكرًا",
        whatWentWrong: "ما الخطأ؟",
        whatStoodOut: "ما الذي لفت انتباهك؟",
        reasons: "الأسباب",
        note: "إضافة ملاحظة",
        notePlaceholder: "إضافة ملاحظة (اختياري)",
        cancel: "إلغاء",
        send: "إرسال الملاحظات",
        sentThanks: "شكرًا — سنستفيد من ذلك في التحسين.",
        undo: "تراجع",
        question: "ما رأيك في هذه الإجابة؟",
        rating: "التقييم",
        scale: ["سيئة", "ضعيفة", "مقبولة", "جيدة", "ممتازة"],
        announceSent: "تم إرسال الملاحظات",
        announceHelpful: "تم وضع علامة مفيدة",
        announceOpen: "أخبرنا بما حدث من خطأ",
      },
    },
    questionLabels: {
      asks: (agent) => `يسأل ${agent}`,
      suggests: "يقترح",
      suggested: "مقترح",
      selected: "محدد",
      somethingElse: "شيء آخر…",
      otherPlaceholder: "اكتب ما تحتاج إليه",
      yourAnswer: "إجابتك",
      answer: "إرسال",
      quote: (text) => `«${text}»`,
      letAgentDecide: "دع المساعد يقرر",
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
      agentWillDecide: "سيقرر المساعد",
      leftToAgent: "تُرك القرار للمساعد",
      undo: "تراجع",
    },
  },
};

const push = (turn: Turn): MockStep<State> => ({
  delay: 0,
  apply: (s) => ({ ...s, turns: [...s.turns, turn] }),
});

const set = (patch: Partial<State>, delay = 0): MockStep<State> => ({
  delay,
  apply: (s) => ({ ...s, ...patch }),
});

/** The scripted conversation in one language. */
function script(t: Copy) {
  const greeting: Turn = {
    id: "g",
    role: "assistant",
    kind: "text",
    text: t.greeting,
    at: at(0),
  };

  const tracked: Turn[] = [
    { id: "u1", role: "user", kind: "text", text: t.quickReplies[0], at: at(1) },
    { id: "b1", role: "assistant", kind: "text", text: t.found, at: at(1) },
    { id: "b2", role: "assistant", kind: "order", at: at(1) },
  ];

  const question: Turn = { id: "b3", role: "assistant", kind: "question", at: at(2) };

  const botScript: MockStep<State>[] = [
    wait(700),
    set({ open: true }),
    wait(1600),
    set({ quickReplies: false }),
    push(tracked[0]),
    set({ mode: "typing" }),
    wait(1300),
    set({ mode: "bot" }),
    push(tracked[1]),
    wait(500),
    push(tracked[2]),
    wait(1100),
    push(question),
  ];

  const handoffScript: MockStep<State>[] = [
    wait(1200),
    set({ quickReplies: false }),
    push({ id: "u2", role: "user", kind: "text", text: t.quickReplies[2], at: at(3) }),
    set({ mode: "typing" }),
    wait(1000),
    push({ id: "b4", role: "assistant", kind: "text", text: t.connecting, at: at(3) }),
    set({ mode: "waiting" }),
    wait(2600),
    set({ mode: "human" }),
    push({
      id: "h1",
      role: "assistant",
      author: HUMAN,
      kind: "joined",
      text: t.joinedText,
      at: at(5),
    }),
    wait(1700),
    push({ id: "u3", role: "user", kind: "text", text: t.saturday, at: at(6) }),
    wait(1400),
    push({
      id: "h2",
      role: "assistant",
      author: HUMAN,
      kind: "text",
      text: t.done,
      at: at(6),
    }),
    wait(900),
    set({ askRating: true }),
  ];

  const quickReplies = t.quickReplies.map((title, i) => ({ id: `q${i + 1}`, title }));

  return { greeting, tracked, question, botScript, handoffScript, quickReplies };
}

function OrderCard({ t, locale }: { t: Copy["order"]; locale?: string }) {
  const steps = t.steps.map(([label, detail], i) => ({ label, detail, done: i < 2 }));
  return (
    <Inset className="flex w-[26rem] max-w-full flex-col gap-3 p-3">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#0a84ff33,#30d15833)] text-foreground">
          <Package weight="fill" className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {/* bdi keeps the Latin name from setting the message's direction. */}
            <bdi>Trail Runner 2</bdi> · {t.size}
          </p>
          <p className="truncate text-xs text-muted-foreground">{t.number}</p>
        </div>
        <StatusPill tone="brand" size="sm" icon={Truck}>
          {t.status}
        </StatusPill>
      </div>
      <ProgressBar
        value={2}
        max={3}
        tone="brand"
        striped
        size="sm"
        label={t.progress}
        valueText={t.progressText}
        locale={locale}
      />
      <ol className="grid grid-cols-3 gap-2 text-xs">
        {steps.map((step) => (
          <li key={step.label} className="min-w-0">
            <p className={step.done ? "font-medium" : "text-muted-foreground"}>
              {step.label}
            </p>
            <p className="text-muted-foreground">{step.detail}</p>
          </li>
        ))}
      </ol>
    </Inset>
  );
}

function Storefront({ t }: { t: Copy["store"] }) {
  const products = [
    { name: "Trail Runner 2", price: "$139", tint: "from-[#0a84ff]/25 to-[#30d158]/20" },
    {
      name: "Summit Shell Jacket",
      price: "$249",
      tint: "from-[#ff9f0a]/25 to-[#bf5af2]/20",
    },
    { name: "Ridge 28L Pack", price: "$119", tint: "from-[#5e5ce6]/25 to-[#40c8e0]/20" },
  ];
  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-8 px-5 py-5 @md:px-8">
      <nav className="flex items-center gap-6 text-sm">
        <span className="font-semibold tracking-tight">Ridgeline</span>
        <span className="hidden gap-5 text-muted-foreground @2xl:flex">
          {t.nav.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </span>
        <span className="ms-auto text-muted-foreground">{t.orders}</span>
      </nav>
      <header className="flex flex-col gap-3 pt-4 @2xl:pt-10">
        <p className="text-[0.8125rem] text-muted-foreground">{t.kicker}</p>
        <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-balance @2xl:text-5xl rtl:tracking-normal">
          {t.headline}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">{t.sub}</p>
      </header>
      <ul className="grid grid-cols-1 gap-3 @md:grid-cols-2 @3xl:grid-cols-3">
        {products.map((p) => (
          <li key={p.name} className="rounded-[1.375rem] bg-surface p-1.5">
            <div className={`aspect-[4/3] rounded-2xl bg-gradient-to-br ${p.tint}`} />
            <div className="flex items-center justify-between px-2.5 pt-2.5 pb-1.5 text-sm">
              <span className="truncate font-medium">{p.name}</span>
              <span className="text-muted-foreground tabular-nums">{p.price}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SupportWidgetDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const t = copy[locale];
  const { greeting, tracked, question, botScript, handoffScript, quickReplies } = useMemo(
    () => script(t),
    [t],
  );
  const handoff = variant === "Handoff";
  const still: State = handoff
    ? {
        open: true,
        turns: [greeting, ...tracked],
        mode: "bot",
        quickReplies: true,
        askRating: false,
      }
    : {
        open: !autoplay,
        turns: autoplay ? [greeting] : [greeting, ...tracked, question],
        mode: "bot",
        quickReplies: autoplay,
        askRating: false,
      };
  const { state, setState } = useMockRun<State>(
    still,
    handoff ? handoffScript : botScript,
    {
      autoplay,
    },
  );

  // Messages typed by the viewer get a short reply.
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const send = (text: string) => {
    const n = state.turns.length;
    setState((s) => ({
      ...s,
      quickReplies: false,
      mode: s.mode === "human" ? "human" : "typing",
      turns: [...s.turns, { id: `v${n}`, role: "user", kind: "text", text, at: at(8) }],
    }));
    timer.current = setTimeout(
      () =>
        setState((s) => ({
          ...s,
          mode: s.mode === "human" ? "human" : "bot",
          turns: [
            ...s.turns,
            {
              id: `r${n}`,
              role: "assistant",
              author: s.mode === "human" ? HUMAN : undefined,
              kind: "text",
              text: t.noted,
              at: at(8),
            },
          ],
        })),
      900,
    );
  };

  const messages: ThreadMessage[] = state.turns.map((turn) => ({
    id: turn.id,
    role: turn.role,
    author: turn.author,
    at: turn.at,
    content:
      turn.kind === "order" ? (
        <OrderCard t={t.order} locale={t.locale} />
      ) : turn.kind === "question" ? (
        <AgentQuestion
          agent={BOT}
          labels={t.questionLabels}
          data={{
            question: t.question,
            options: [
              { id: "date", label: t.options[0], icon: CalendarBlank },
              { id: "return", label: t.options[1], icon: ArrowUUpLeft },
              { id: "person", label: t.options[2], icon: UserSound },
            ],
          }}
          className="w-[26rem] max-w-full"
        />
      ) : turn.kind === "joined" ? (
        <div className="flex flex-col items-start gap-2">
          <StatusPill size="sm" tone="positive">
            {t.joinedPill}
          </StatusPill>
          <p>{turn.text}</p>
        </div>
      ) : (
        turn.text
      ),
  }));

  return (
    <SupportWidget
      data={{
        bot: { name: BOT },
        human: { name: HUMAN, role: t.role },
        visitor: { name: "Alex Rivera" },
        messages,
        quickReplies: state.quickReplies ? quickReplies : undefined,
        mode: state.mode,
        wait: t.wait,
        askRating: state.askRating,
        unread: state.open ? 0 : 1,
      }}
      open={state.open}
      onOpenChange={(open) => setState((s) => ({ ...s, open }))}
      onSend={send}
      labels={t.labels}
      locale={t.locale}
    >
      <Storefront t={t.store} />
    </SupportWidget>
  );
}
