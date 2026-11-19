"use client";

import {
  Bicycle,
  Check,
  Lightbulb,
  PresentationChart,
  UsersThree,
} from "@phosphor-icons/react";
import type { DemoLocale } from "@/components/docs/demo";
import { Button } from "@/components/ui/action-button";
import {
  AgentQuestion,
  type AgentQuestionLabels,
  type QuestionAnswer,
} from "@/components/ui/agent-question";
import {
  ConfirmationCard,
  type ConfirmationCardLabels,
  type ConfirmationItem,
  type ConfirmationStatus,
} from "@/components/ui/confirmation-card";
import {
  FormCard,
  type FormCardLabels,
  type FormStatus,
  type FormValues,
} from "@/components/ui/form-card";
import {
  ResultCarousel,
  type ResultCarouselLabels,
  type ResultItem,
} from "@/components/ui/result-carousel";
import {
  SlotPicker,
  type SlotPickerLabels,
  type Slot,
} from "@/components/ui/slot-picker";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  BookingAssistant,
  type BookingAssistantData,
  type BookingAssistantLabels,
} from "./booking-assistant";

type State = {
  step: number;
  focus?: QuestionAnswer;
  venue?: string;
  slot: string | null;
  slotConfirmed: string | null;
  form: FormValues;
  formStatus: FormStatus;
  confirm: ConfirmationStatus;
  notes: string[];
};

const at = (minute: number) => `2026-11-03T09:${String(minute).padStart(2, "0")}:00Z`;

const ltr = (text: string) => `⁦${text}⁩`;

type Pair = [label: string, detail: string];
type Diet = "standard" | "vegetarian" | "vegan";

type Copy = {
  locale?: string;
  title: string;
  user: string;
  agent: string;
  focusIntro: string;
  focusQuestion: string;
  focus: { workshops: Pair; strategy: Pair; bonding: Pair; mix: Pair };
  focusReason: string;
  venuesIntro: string;
  venuesTitle: string;
  /** "Mar 18–20 · 8 people" */
  when: string;
  metas: [loft: string, studio: string, house: string];
  picked: string;
  choose: string;
  slotIntro: string;
  slotTitle: string;
  zones: [venue: string, attendee: string];
  formIntro: string;
  form: {
    title: string;
    description: string;
    lead: string;
    email: string;
    people: string;
    menu: string;
    diets: Record<Diet, string>;
    pickup: string;
    pickupHint: string;
    submit: string;
  };
  booked: string;
  review: string;
  confirm: {
    title: string;
    rooms: string;
    hall: Pair;
    dinner: Pair;
    bikes: Pair;
    fees: [string, string];
    warning: string;
    doneAt: string;
    book: string;
    booked: string;
  };
  noted: string;
  summary: {
    title: string;
    focus: string;
    venue: string;
    call: string;
    attendees: string;
    booking: string;
    venueValue: (venue: string) => string;
    /** `diet` is the form value, `dietLabel` its translated menu name. */
    attendeesValue: (people: string, diet: string, dietLabel: string) => string;
    bookingValue: string;
  };
  labels?: Partial<BookingAssistantLabels>;
  questionLabels?: Partial<AgentQuestionLabels>;
  carouselLabels?: Partial<ResultCarouselLabels>;
  slotLabels?: Partial<SlotPickerLabels>;
  formLabels?: Partial<FormCardLabels>;
  confirmLabels?: Partial<ConfirmationCardLabels>;
};

const copy: Record<DemoLocale, Copy> = {
  en: {
    title: "Design team offsite",
    user: "Plan a two-day offsite for our design team of 8 in Copenhagen, mid-March. Keep it under €5k.",
    agent: "Planner",
    focusIntro: "Happy to. One thing first so I can shortlist the right places.",
    focusQuestion: "What should the two days focus on?",
    focus: {
      workshops: ["Workshops", "Hands-on design sessions"],
      strategy: ["Strategy", "Roadmap for next year"],
      bonding: ["Team time", "Dinners and activities"],
      mix: ["A mix", "Mornings work, afternoons out"],
    },
    focusReason: "Teams of 8 usually get the most from half-day blocks.",
    venuesIntro: "Three venues with a workshop room and space for 8, all within budget.",
    venuesTitle: "Venues",
    when: "Mar 18–20 · 8 people",
    metas: [
      "Harbour · 8 rooms · workshop hall",
      "Island · 6 rooms · open studio",
      "Park · 10 rooms · library",
    ],
    picked: "Picked",
    choose: "Choose",
    slotIntro:
      "The loft's events team can do a 30-minute kickoff call. These times work for them.",
    slotTitle: "Kickoff call with Nordhavn Loft",
    zones: ["Copenhagen", "London"],
    formIntro: "I need a few details for the booking.",
    form: {
      title: "Attendee details",
      description: "Shared with the venue only.",
      lead: "Group lead",
      email: "Email",
      people: "People",
      menu: "Dinner menu",
      diets: { standard: "Standard", vegetarian: "Vegetarian", vegan: "Vegan" },
      pickup: "Airport pickup",
      pickupHint: "Van from CPH on arrival",
      submit: "Save details",
    },
    booked: "Booked. Invites for the kickoff call are on their way.",
    review: "Here's everything before I book. Nothing is charged until you confirm.",
    confirm: {
      title: "Design offsite · Copenhagen",
      rooms: "8 rooms · Mar 18–20",
      hall: ["Workshop hall", "Two mornings"],
      dinner: ["Team dinner", "Mar 18, 19:30 · 8 people"],
      bikes: ["Bike rental", "2 days"],
      fees: ["Service fee", "City tax"],
      warning: "Rooms become non-refundable 14 days before arrival.",
      doneAt: "Today, 09:31",
      book: "Book",
      booked: "Booked",
    },
    noted: "Noted — I'll factor that into the booking.",
    summary: {
      title: "Trip summary",
      focus: "Focus",
      venue: "Venue",
      call: "Kickoff call",
      attendees: "Attendees",
      booking: "Booking",
      venueValue: (venue) => `${venue}, Mar 18–20`,
      attendeesValue: (people, diet) => `${people} people · ${diet} dinner`,
      bookingValue: "Confirmed · CPH-4821",
    },
  },
  he: {
    locale: "he-IL",
    title: "אוף־סייט לצוות העיצוב",
    user: `תכנן אוף־סייט של יומיים לצוות העיצוב שלנו, 8 אנשים, בקופנהגן באמצע מרץ. התקציב עד ${ltr("€5k")}.`,
    agent: "המתכנן",
    focusIntro: "בשמחה. קודם שאלה אחת, כדי שאוכל לבחור את המקומות המתאימים.",
    focusQuestion: "על מה יתמקדו היומיים?",
    focus: {
      workshops: ["סדנאות", "מפגשי עיצוב מעשיים"],
      strategy: ["אסטרטגיה", "מפת דרכים לשנה הבאה"],
      bonding: ["זמן צוות", "ארוחות ופעילויות"],
      mix: ["שילוב", "בבוקר עבודה, אחר הצהריים בחוץ"],
    },
    focusReason: "צוותים של 8 מפיקים בדרך כלל הכי הרבה מבלוקים של חצי יום.",
    venuesIntro: "שלושה מקומות עם חדר סדנאות ומקום ל־8, כולם בתוך התקציב.",
    venuesTitle: "מקומות",
    when: `${ltr("18–20")} במרץ · 8 אנשים`,
    metas: [
      "נמל · 8 חדרים · אולם סדנאות",
      "אי · 6 חדרים · סטודיו פתוח",
      "פארק · 10 חדרים · ספרייה",
    ],
    picked: "נבחר",
    choose: "בחירה",
    slotIntro: `צוות האירועים של ${ltr("Nordhavn Loft")} יכול לקיים שיחת פתיחה של 30 דקות. המועדים האלה מתאימים להם.`,
    slotTitle: `שיחת פתיחה עם ${ltr("Nordhavn Loft")}`,
    zones: ["קופנהגן", "לונדון"],
    formIntro: "אני צריך כמה פרטים להזמנה.",
    form: {
      title: "פרטי המשתתפים",
      description: "יועבר רק למקום האירוח.",
      lead: "ראש הקבוצה",
      email: "מייל",
      people: "אנשים",
      menu: "תפריט ארוחת ערב",
      diets: { standard: "רגיל", vegetarian: "צמחוני", vegan: "טבעוני" },
      pickup: "איסוף משדה התעופה",
      pickupHint: `ואן מ־${ltr("CPH")} בהגעה`,
      submit: "שמירת הפרטים",
    },
    booked: "הוזמן. ההזמנות לשיחת הפתיחה כבר בדרך.",
    review: "הנה הכול לפני שאני מזמין. שום דבר לא יחויב עד שתאשר.",
    confirm: {
      title: "אוף־סייט עיצוב · קופנהגן",
      rooms: `8 חדרים · ${ltr("18–20")} במרץ`,
      hall: ["אולם סדנאות", "שני בקרים"],
      dinner: ["ארוחת צוות", `18 במרץ, ${ltr("19:30")} · 8 אנשים`],
      bikes: ["השכרת אופניים", "יומיים"],
      fees: ["דמי שירות", "מס עירוני"],
      warning: "החל מ־14 יום לפני ההגעה אי אפשר לקבל החזר על החדרים.",
      doneAt: `היום, ${ltr("09:31")}`,
      book: "להזמין",
      booked: "הוזמן",
    },
    noted: "רשמתי — אקח את זה בחשבון בהזמנה.",
    summary: {
      title: "סיכום הנסיעה",
      focus: "מיקוד",
      venue: "מקום",
      call: "שיחת פתיחה",
      attendees: "משתתפים",
      booking: "הזמנה",
      venueValue: (venue) => `${ltr(venue)}, ${ltr("18–20")} במרץ`,
      attendeesValue: (people, _, diet) => `${people} אנשים · תפריט ${diet}`,
      bookingValue: `אושר · ${ltr("CPH-4821")}`,
    },
    labels: {
      hideSummary: "הסתרת הסיכום",
      showSummary: "הצגת הסיכום",
      hide: (title) => `הסתרת ${title}`,
      show: (title) => `הצגת ${title}`,
      close: (title) => `סגירת ${title}`,
      closeButton: "סגירה",
      placeholder: "אפשר לבקש שינויים…",
      decidedOf: (decided, total) => `${decided}/${total}`,
      decidedShort: (decided, total) => `${decided}/${total}`,
      decided: "הוחלטו",
      decisionsMade: "החלטות שהתקבלו",
      notDecided: "עוד לא הוחלט",
      decidedStatus: ", הוחלט",
      estimate: "הערכה",
      chatThread: {
        conversation: "שיחה",
        today: "היום",
        yesterday: "אתמול",
        unread: "לא נקראו",
        jumpToLatest: "מעבר להודעה האחרונה",
        fresh: (count) => `${count} חדשות`,
      },
      composer: {
        followUp: "הוסיפו המשך — הוא ירוץ כשהסוכן יסיים",
        message: "הודעה",
        commands: "פקודות",
        files: "קבצים",
        switchModel: (model) => `מודל: ${model}. החלפת מודל`,
        tokens: (count) => `${ltr(count)} טוקנים`,
        totalTokens: (count) => `+ ${ltr(count)} טוקנים`,
        context: "הקשר",
        remove: (name) => `הסרת ${name}`,
        add: "הוספה",
        addContext: "הוספת הקשר",
        agentWorking: "הסוכן עובד",
        working: "עובד · הודעות חדשות ייכנסו לתור",
        shortcuts: "קבצים · / פקודות",
        stop: "עצירה",
        queue: "לתור",
        send: "שליחה",
        queued: (count) => `בתור · ${count}`,
        queuedMessages: "הודעות בתור",
        removeQueued: (text) => `הסרת ההודעה מהתור: ${text}`,
        workingStatus: (queued) => `הסוכן עובד${queued ? `, ${queued} בתור` : ""}`,
      },
    },
    questionLabels: {
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
      leftTo: (agent) => `ההחלטה הועברה ל${agent}`,
      goingWith: (option) => `הולך על ${option}`,
      answerSent: "התשובה נשלחה",
      agentWillDecide: "הסוכן יחליט",
      leftToAgent: "ההחלטה הועברה לסוכן",
      undo: "ביטול",
    },
    carouselLabels: {
      results: "תוצאות",
      previous: "התוצאות הקודמות",
      next: "התוצאות הבאות",
      track: (title) => `${title}, גלילה לרוחב`,
      slide: (index, total, title) => `${index} מתוך ${total}: ${title}`,
      outOfFive: "מתוך 5",
    },
    slotLabels: {
      pickTime: "בחירת מועד",
      timesIn: (zone) => `השעות לפי ${zone}`,
      theirTime: "השעה אצלם",
      day: "יום",
      availableTimes: "מועדים פנויים",
      slot: (day, time, { busy, suggested }) =>
        `${day} ${ltr(time)}${busy ? ", תפוס" : ""}${suggested ? ", מומלץ" : ""}`,
      duration: (minutes) => `${minutes} דק׳`,
      suggested: "מומלץ",
      busy: "תפוס",
      confirm: "אישור",
      selected: (day, time) => `נבחר ${day} ${ltr(time)}`,
      meetingTime: "מועד הפגישה",
      inviteSent: "ההזמנה נשלחה",
      pickAnother: "בחירת מועד אחר",
      confirmed: (day, time) => `אושר ${day} ${ltr(time)}`,
    },
    formLabels: {
      required: (field) => `חובה למלא ${field}`,
      invalidEmail: "יש להזין כתובת מייל תקינה",
      notANumber: "יש להזין מספר",
      atLeast: (min) => `לפחות ${min}`,
      atMost: (max) => `לכל היותר ${max}`,
      yes: "כן",
      no: "לא",
      requiredHint: "שדה חובה",
      sending: "שולחים…",
      choose: "בחירה…",
      submitted: "נשלח",
      editAnswers: "עריכת התשובות",
      attention: (count) =>
        count === 1 ? "שדה אחד דורש תיקון" : `${count} שדות דורשים תיקון`,
    },
    confirmLabels: {
      quantity: (item) => `כמות: ${item}`,
      decrease: "הפחתה",
      increase: "הוספה",
      remove: (item) => `הסרת ${item}`,
      subtotal: "סכום ביניים",
      total: "סה״כ",
      warning: "אזהרה: ",
      cancel: "ביטול",
      edit: "עריכה",
      confirming: "מאשרים…",
      confirmingStatus: "מאשרים",
      undo: "ביטול פעולה",
      undoTimeLeft: "הזמן שנותר לביטול",
      seconds: (n) => `${n} שניות`,
      secondsShort: (n) => String(n),
    },
  },
  ar: {
    locale: "ar",
    title: "ملتقى فريق التصميم",
    user: `خطّط لملتقى خارجي لمدة يومين لفريق التصميم المكوّن من 8 أشخاص في كوبنهاغن، منتصف مارس. الميزانية أقل من ${ltr("€5k")}.`,
    agent: "المخطِّط",
    focusIntro: "بكل سرور. سؤال واحد أولًا لأختار الأماكن المناسبة.",
    focusQuestion: "على ماذا يركّز اليومان؟",
    focus: {
      workshops: ["ورش عمل", "جلسات تصميم تطبيقية"],
      strategy: ["الاستراتيجية", "خارطة طريق للعام المقبل"],
      bonding: ["وقت للفريق", "عشاء وأنشطة"],
      mix: ["مزيج", "عمل صباحًا، وخروج بعد الظهر"],
    },
    focusReason: "تستفيد الفرق المكوّنة من 8 أشخاص عادةً من فترات نصف يوم.",
    venuesIntro: "ثلاثة أماكن فيها قاعة ورش وتتسع لـ8 أشخاص، وكلها ضمن الميزانية.",
    venuesTitle: "الأماكن",
    when: `${ltr("18–20")} مارس · 8 أشخاص`,
    metas: [
      "الميناء · 8 غرف · قاعة ورش",
      "جزيرة · 6 غرف · استوديو مفتوح",
      "حديقة · 10 غرف · مكتبة",
    ],
    picked: "تم الاختيار",
    choose: "اختيار",
    slotIntro: `يستطيع فريق الفعاليات في ${ltr("Nordhavn Loft")} إجراء مكالمة انطلاق مدتها 30 دقيقة. هذه المواعيد تناسبهم.`,
    slotTitle: `مكالمة انطلاق مع ${ltr("Nordhavn Loft")}`,
    zones: ["كوبنهاغن", "لندن"],
    formIntro: "أحتاج إلى بعض التفاصيل للحجز.",
    form: {
      title: "بيانات المشاركين",
      description: "تُشارَك مع مكان الإقامة فقط.",
      lead: "قائد المجموعة",
      email: "البريد الإلكتروني",
      people: "عدد الأشخاص",
      menu: "قائمة العشاء",
      diets: { standard: "عادية", vegetarian: "نباتية", vegan: "نباتية صرفة" },
      pickup: "استقبال من المطار",
      pickupHint: `حافلة صغيرة من ${ltr("CPH")} عند الوصول`,
      submit: "حفظ البيانات",
    },
    booked: "تم الحجز. دعوات مكالمة الانطلاق في طريقها.",
    review: "إليك كل شيء قبل الحجز. لن يُخصم أي مبلغ حتى تؤكد.",
    confirm: {
      title: "ملتقى التصميم · كوبنهاغن",
      rooms: `8 غرف · ${ltr("18–20")} مارس`,
      hall: ["قاعة الورش", "صباحان"],
      dinner: ["عشاء الفريق", `18 مارس، ${ltr("19:30")} · 8 أشخاص`],
      bikes: ["استئجار دراجات", "يومان"],
      fees: ["رسوم الخدمة", "ضريبة المدينة"],
      warning: "تصبح الغرف غير قابلة للاسترداد قبل الوصول بـ14 يومًا.",
      doneAt: `اليوم، ${ltr("09:31")}`,
      book: "احجز",
      booked: "تم الحجز",
    },
    noted: "تم — سآخذ ذلك في الحسبان عند الحجز.",
    summary: {
      title: "ملخّص الرحلة",
      focus: "التركيز",
      venue: "المكان",
      call: "مكالمة الانطلاق",
      attendees: "المشاركون",
      booking: "الحجز",
      venueValue: (venue) => `${ltr(venue)}، ${ltr("18–20")} مارس`,
      attendeesValue: (people, _, diet) => `${people} أشخاص · قائمة ${diet}`,
      bookingValue: `مؤكَّد · ${ltr("CPH-4821")}`,
    },
    labels: {
      hideSummary: "إخفاء الملخّص",
      showSummary: "إظهار الملخّص",
      hide: (title) => `إخفاء ${title}`,
      show: (title) => `إظهار ${title}`,
      close: (title) => `إغلاق ${title}`,
      closeButton: "إغلاق",
      placeholder: "اطلب أي تعديل…",
      decidedOf: (decided, total) => `${decided}/${total}`,
      decidedShort: (decided, total) => `${decided}/${total}`,
      decided: "محسومة",
      decisionsMade: "القرارات المتخذة",
      notDecided: "لم يُحسم بعد",
      decidedStatus: "، محسوم",
      estimate: "التقدير",
      chatThread: {
        conversation: "المحادثة",
        today: "اليوم",
        yesterday: "أمس",
        unread: "غير مقروءة",
        jumpToLatest: "الانتقال إلى الأحدث",
        fresh: (count) => `${count} جديدة`,
      },
      composer: {
        followUp: "أضف متابعة، وستُنفَّذ عندما ينتهي الوكيل",
        message: "الرسالة",
        commands: "الأوامر",
        files: "الملفات",
        switchModel: (model) => `النموذج: ${model}. تبديل النموذج`,
        tokens: (count) => `${ltr(count)} رمز`,
        totalTokens: (count) => `+ ${ltr(count)} رمز`,
        context: "السياق",
        remove: (name) => `إزالة ${name}`,
        add: "إضافة",
        addContext: "إضافة سياق",
        agentWorking: "الوكيل يعمل",
        working: "يعمل · الرسائل الجديدة تنتظر دورها",
        shortcuts: "الملفات · / الأوامر",
        stop: "إيقاف",
        queue: "إلى الانتظار",
        send: "إرسال",
        queued: (count) => `في الانتظار · ${count}`,
        queuedMessages: "الرسائل المنتظرة",
        removeQueued: (text) => `إزالة الرسالة المنتظرة: ${text}`,
        workingStatus: (queued) =>
          `الوكيل يعمل${queued ? `، ${queued} في الانتظار` : ""}`,
      },
    },
    questionLabels: {
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
      leftTo: (agent) => `تُرك القرار لـ${agent}`,
      goingWith: (option) => `سيختار ${option}`,
      answerSent: "أُرسلت الإجابة",
      agentWillDecide: "سيقرر الوكيل",
      leftToAgent: "تُرك القرار للوكيل",
      undo: "تراجع",
    },
    carouselLabels: {
      results: "نتائج",
      previous: "النتائج السابقة",
      next: "النتائج التالية",
      track: (title) => `${title}، مرّر أفقيًا`,
      slide: (index, total, title) => `${index} من ${total}: ${title}`,
      outOfFive: "من 5",
    },
    slotLabels: {
      pickTime: "اختر موعدًا",
      timesIn: (zone) => `الأوقات بتوقيت ${zone}`,
      theirTime: "توقيتهم",
      day: "اليوم",
      availableTimes: "المواعيد المتاحة",
      slot: (day, time, { busy, suggested }) =>
        `${day} ${ltr(time)}${busy ? "، محجوز" : ""}${suggested ? "، مقترح" : ""}`,
      duration: (minutes) => `${minutes} د`,
      suggested: "مقترح",
      busy: "محجوز",
      confirm: "تأكيد",
      selected: (day, time) => `تم اختيار ${day} ${ltr(time)}`,
      meetingTime: "موعد الاجتماع",
      inviteSent: "أُرسلت الدعوة",
      pickAnother: "اختيار موعد آخر",
      confirmed: (day, time) => `تم تأكيد ${day} ${ltr(time)}`,
    },
    formLabels: {
      required: (field) => `حقل ${field} مطلوب`,
      invalidEmail: "أدخل بريدًا إلكترونيًا صالحًا",
      notANumber: "أدخل رقمًا",
      atLeast: (min) => `يجب ألا يقل عن ${min}`,
      atMost: (max) => `يجب ألا يزيد على ${max}`,
      yes: "نعم",
      no: "لا",
      requiredHint: "مطلوب",
      sending: "جارٍ الإرسال…",
      choose: "اختر…",
      submitted: "تم الإرسال",
      editAnswers: "تعديل الإجابات",
      attention: (count) =>
        count === 1
          ? "حقل واحد يحتاج إلى مراجعة"
          : count === 2
            ? "حقلان يحتاجان إلى مراجعة"
            : `${count} حقول تحتاج إلى مراجعة`,
    },
    confirmLabels: {
      quantity: (item) => `الكمية: ${item}`,
      decrease: "إنقاص",
      increase: "زيادة",
      remove: (item) => `إزالة ${item}`,
      subtotal: "المجموع الفرعي",
      total: "الإجمالي",
      warning: "تنبيه: ",
      cancel: "إلغاء",
      edit: "تعديل",
      confirming: "جارٍ التأكيد…",
      confirmingStatus: "جارٍ التأكيد",
      undo: "تراجع",
      undoTimeLeft: "الوقت المتبقي للتراجع",
      seconds: (n) =>
        n === 1
          ? "ثانية واحدة"
          : n === 2
            ? "ثانيتان"
            : n >= 3 && n <= 10
              ? `${n} ثوانٍ`
              : `${n} ثانية`,
      secondsShort: (n) => String(n),
    },
  },
};

const focusIcons = {
  workshops: PresentationChart,
  strategy: Lightbulb,
  bonding: Bicycle,
  mix: UsersThree,
};

const focusOptions = (t: Copy) =>
  (Object.keys(focusIcons) as (keyof typeof focusIcons)[]).map((id) => ({
    id,
    label: t.focus[id][0],
    description: t.focus[id][1],
    icon: focusIcons[id],
  }));

const venueBase = [
  { id: "loft", title: "Nordhavn Loft", price: "€2,960", rating: 4.8, tint: "#0a84ff" },
  {
    id: "studio",
    title: "Refshaleøen Studio",
    price: "€2,410",
    rating: 4.6,
    tint: "#bf5af2",
  },
  {
    id: "house",
    title: "Frederiksberg House",
    price: "€3,380",
    rating: 4.7,
    tint: "#30c05a",
  },
];

const venuesFor = (t: Copy): ResultItem[] =>
  venueBase.map((v, i) => ({ ...v, meta: t.metas[i] }));

const plus30 = (time: string) => {
  const m = Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) + 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

const slots: Slot[] = [
  ["2026-11-10", "10:00"],
  ["2026-11-10", "14:00", true],
  ["2026-11-11", "09:30"],
  ["2026-11-11", "15:00", false, true],
  ["2026-11-12", "11:00"],
  ["2026-11-12", "16:30", true],
].map(([day, start, busy, suggested], i) => ({
  id: `s${i}`,
  day: day as string,
  start: start as string,
  end: plus30(start as string),
  busy: Boolean(busy),
  suggested: Boolean(suggested),
}));

const filled: FormValues = {
  lead: "Ana Ribeiro",
  email: "ana@studio.example",
  headcount: "8",
  diet: "vegetarian",
  pickup: true,
};

const itemsFor = (t: Copy): ConfirmationItem[] => [
  { id: "rooms", label: "Nordhavn Loft", detail: t.confirm.rooms, amount: 2_960 },
  { id: "hall", label: t.confirm.hall[0], detail: t.confirm.hall[1], amount: 640 },
  {
    id: "dinner",
    label: t.confirm.dinner[0],
    detail: t.confirm.dinner[1],
    amount: 520,
    removable: true,
  },
  {
    id: "bikes",
    label: t.confirm.bikes[0],
    detail: t.confirm.bikes[1],
    amount: 22,
    quantity: 8,
    editable: true,
  },
];

const next = (s: State): State => ({ ...s, step: s.step + 1 });
const step = (delay: number, apply: (s: State) => State = next): MockStep<State> => ({
  delay,
  apply,
});

const script: MockStep<State>[] = [
  step(900), // question
  step(2200, (s) => ({ ...s, focus: { optionIds: ["mix"] } })),
  step(700), // venues
  step(1800, (s) => ({ ...s, venue: "loft" })),
  step(700), // slot
  step(1300, (s) => ({ ...s, slot: "s3" })),
  step(1100, (s) => ({ ...s, slotConfirmed: "s3" })),
  step(700), // form
  step(900, (s) => ({ ...s, form: filled })),
  step(1100, (s) => ({ ...s, formStatus: "submitted" })),
  step(700), // confirmation
  wait(400),
];

const initial: State = {
  step: 0,
  slot: null,
  slotConfirmed: null,
  // Every field starts with a value so controlled inputs stay controlled.
  form: { lead: "", email: "", headcount: "", diet: "standard", pickup: false },
  formStatus: "editing",
  confirm: "review",
  notes: [],
};

const done: State = {
  ...initial,
  step: 5,
  focus: { optionIds: ["mix"] },
  venue: "loft",
  slot: "s3",
  slotConfirmed: "s3",
  form: filled,
  formStatus: "submitted",
  confirm: "done",
};

const Text = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-3">{children}</p>
);

export default function BookingAssistantDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const t = copy[locale];
  const venues = venuesFor(t);
  const items = itemsFor(t);
  const options = focusOptions(t);
  const confirmed = variant === "Confirmed";
  const { state, setState } = useMockRun<State>(
    confirmed ? done : initial,
    confirmed ? [] : script,
    {
      autoplay,
    },
  );
  const set = (patch: Partial<State>) => setState((s) => ({ ...s, ...patch }));
  // Steps reveal one assistant turn each; picks made by the viewer move the run on.
  const reveal = (n: number) => setState((s) => ({ ...s, step: Math.max(s.step, n) }));

  const venue = venues.find((v) => v.id === state.venue);
  const slot = slots.find((x) => x.id === state.slotConfirmed);
  const total = items.reduce((n, i) => n + i.amount * (i.quantity ?? 1), 0) + 48 + 64;

  const turns: {
    id: string;
    role: "user" | "assistant";
    content: React.ReactNode;
    show: boolean;
  }[] = [
    {
      id: "u1",
      role: "user",
      show: true,
      content: t.user,
    },
    {
      id: "a1",
      role: "assistant",
      show: state.step >= 1,
      content: (
        <>
          <Text>{t.focusIntro}</Text>
          <AgentQuestion
            data={{
              question: t.focusQuestion,
              options,
              suggested: { optionId: "mix", reason: t.focusReason },
            }}
            labels={t.questionLabels}
            status={state.focus ? "answered" : "pending"}
            answer={state.focus}
            onSubmit={(answer) => {
              set({ focus: answer });
              reveal(2);
            }}
            onUndo={() => set({ focus: undefined })}
            agent={t.agent}
            className="max-w-none"
          />
        </>
      ),
    },
    {
      id: "a2",
      role: "assistant",
      show: state.step >= 2,
      content: (
        <>
          <Text>{t.venuesIntro}</Text>
          <VenueOptions
            venues={venues}
            t={t}
            picked={state.venue}
            onPick={(id) => {
              set({ venue: id });
              reveal(3);
            }}
          />
        </>
      ),
    },
    {
      id: "a3",
      role: "assistant",
      show: state.step >= 3,
      content: (
        <>
          <Text>{t.slotIntro}</Text>
          <SlotPicker
            data={{
              title: t.slotTitle,
              slots,
              timeZone: { label: t.zones[0], offset: 1 },
              attendeeZone: { label: t.zones[1], offset: 0 },
            }}
            locale={t.locale}
            labels={t.slotLabels}
            selectedId={state.slot}
            onSelect={(s) => set({ slot: s?.id ?? null })}
            confirmedId={state.slotConfirmed}
            onConfirm={(s) => {
              set({ slotConfirmed: s.id });
              reveal(4);
            }}
            onChange={() => set({ slotConfirmed: null })}
            className="max-w-none"
          />
        </>
      ),
    },
    {
      id: "a4",
      role: "assistant",
      show: state.step >= 4,
      content: (
        <>
          <Text>{t.formIntro}</Text>
          <FormCard
            data={{
              title: t.form.title,
              description: t.form.description,
              fields: [
                { name: "lead", label: t.form.lead, type: "text", required: true },
                { name: "email", label: t.form.email, type: "email", required: true },
                {
                  name: "headcount",
                  label: t.form.people,
                  type: "number",
                  min: 2,
                  max: 12,
                  required: true,
                },
                {
                  name: "diet",
                  label: t.form.menu,
                  type: "select",
                  options: [
                    { value: "standard", label: t.form.diets.standard },
                    { value: "vegetarian", label: t.form.diets.vegetarian },
                    { value: "vegan", label: t.form.diets.vegan },
                  ],
                },
                {
                  name: "pickup",
                  label: t.form.pickup,
                  type: "switch",
                  description: t.form.pickupHint,
                },
              ],
            }}
            values={state.form}
            onValuesChange={(form) => set({ form })}
            status={state.formStatus}
            onStatusChange={(formStatus) => set({ formStatus })}
            onSubmit={() => reveal(5)}
            submitLabel={t.form.submit}
            labels={t.formLabels}
            className="max-w-none"
          />
        </>
      ),
    },
    {
      id: "a5",
      role: "assistant",
      show: state.step >= 5 || confirmed,
      content: (
        <>
          <Text>{state.confirm === "done" ? t.booked : t.review}</Text>
          <ConfirmationCard
            data={{
              title: t.confirm.title,
              subtitle: t.when,
              items,
              fees: [
                { label: t.confirm.fees[0], amount: 48 },
                { label: t.confirm.fees[1], amount: 64 },
              ],
              warnings: [t.confirm.warning],
              reference: "CPH-4821",
              doneAt: t.confirm.doneAt,
            }}
            currency="EUR"
            locale={t.locale}
            labels={t.confirmLabels}
            status={state.confirm}
            onConfirm={() => {
              set({ confirm: "confirming" });
              setTimeout(() => set({ confirm: "done" }), 1200);
            }}
            onUndo={() => set({ confirm: "review" })}
            confirmLabel={t.confirm.book}
            doneLabel={t.confirm.booked}
            className="max-w-none"
          />
        </>
      ),
    },
  ];

  const messages = turns
    .filter((t) => t.show)
    .map((t, i) => ({ id: t.id, role: t.role, at: at(10 + i * 3), content: t.content }));
  const extra = state.notes.flatMap((text, i) => [
    { id: `n${i}`, role: "user" as const, at: at(40 + i), content: text },
    {
      id: `r${i}`,
      role: "assistant" as const,
      at: at(40 + i),
      content: t.noted,
    },
  ]);

  const data: BookingAssistantData = {
    title: t.title,
    model: "opus-5.5",
    user: { name: "Ana Ribeiro" },
    messages: [...messages, ...extra],
    summary: {
      title: t.summary.title,
      estimate: state.venue ? `€${total.toLocaleString("en-US")}` : undefined,
      items: [
        {
          id: "focus",
          label: t.summary.focus,
          value: state.focus
            ? options.find((o) => o.id === state.focus?.optionIds[0])?.label
            : undefined,
        },
        {
          id: "venue",
          label: t.summary.venue,
          value: venue ? t.summary.venueValue(venue.title) : undefined,
        },
        {
          id: "call",
          label: t.summary.call,
          value: slot
            ? `${new Date(`${slot.day}T00:00:00Z`).toLocaleDateString(t.locale ?? "en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}, ${slot.start}`
            : undefined,
        },
        {
          id: "people",
          label: t.summary.attendees,
          value:
            state.formStatus === "submitted"
              ? t.summary.attendeesValue(
                  String(state.form.headcount ?? 8),
                  String(state.form.diet ?? "standard"),
                  t.form.diets[(state.form.diet ?? "standard") as Diet] ??
                    String(state.form.diet),
                )
              : undefined,
        },
        {
          id: "booking",
          label: t.summary.booking,
          value: state.confirm === "done" ? t.summary.bookingValue : undefined,
        },
      ],
    },
  };

  return (
    <BookingAssistant
      data={data}
      labels={t.labels}
      locale={t.locale}
      onSend={(text) => setState((s) => ({ ...s, notes: [...s.notes, text] }))}
    />
  );
}

/** Venues as a carousel when the thread is wide enough, a wrapping list below. */
function VenueOptions({
  venues,
  t,
  picked,
  onPick,
}: {
  venues: ResultItem[];
  t: Copy;
  picked?: string;
  onPick: (id: string) => void;
}) {
  const data = venues.map((v) => ({
    ...v,
    badge: v.id === picked ? t.picked : undefined,
    action: v.id === picked ? t.picked : t.choose,
  }));
  return (
    <>
      <ResultCarousel
        data={data}
        title={t.venuesTitle}
        subtitle={t.when}
        labels={t.carouselLabels}
        compact
        onAction={(item) => onPick(item.id)}
        className="hidden max-w-none @2xl:block"
      />
      <ul className="flex flex-col gap-1.5 rounded-[1.375rem] bg-surface p-1.5 @2xl:hidden">
        {data.map((v) => (
          <li
            key={v.id}
            className="flex items-center gap-3 rounded-2xl bg-surface-inset p-3"
          >
            <span
              aria-hidden="true"
              className="size-9 shrink-0 rounded-xl"
              style={{ background: `color-mix(in oklab, ${v.tint} 35%, var(--surface))` }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{v.title}</p>
              <p className="truncate text-xs text-muted-foreground">{v.meta}</p>
            </div>
            <Button
              size="sm"
              variant={v.id === picked ? "secondary" : "primary"}
              icon={v.id === picked ? Check : undefined}
              iconWeight="bold"
              aria-pressed={v.id === picked}
              onClick={() => onPick(v.id)}
              className="shrink-0"
            >
              {v.id === picked ? t.picked : v.price}
            </Button>
          </li>
        ))}
      </ul>
    </>
  );
}
