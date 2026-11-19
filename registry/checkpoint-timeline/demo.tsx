"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  CheckpointTimeline,
  type Checkpoint,
  type CheckpointTimelineLabels,
} from "./checkpoint-timeline";

const f = (path: string, additions: number, deletions: number) => ({
  path,
  additions,
  deletions,
});

const checkpointsEn: Checkpoint[] = [
  { id: "c1", label: "Read the yargs setup in src/cli.ts", at: "18m ago", files: [] },
  {
    id: "c2",
    label: "Add commander and remove yargs from package.json",
    at: "16m ago",
    files: [f("package.json", 1, 2), f("pnpm-lock.yaml", 24, 61)],
  },
  {
    id: "c3",
    label: "Rewrite the entry point with a Command program",
    at: "14m ago",
    files: [f("src/cli.ts", 18, 27)],
  },
  {
    id: "c4",
    label: "Port the build command and its flags",
    at: "11m ago",
    files: [f("src/commands/build.ts", 22, 15), f("src/cli.ts", 3, 1)],
  },
  {
    id: "c5",
    label: "Port the watch command",
    at: "9m ago",
    files: [f("src/commands/watch.ts", 31, 0), f("src/cli.ts", 2, 0)],
  },
  {
    id: "c6",
    label: "Delete the legacy argument parser",
    at: "7m ago",
    files: [f("src/legacy/args.ts", 0, 88), f("src/cli.ts", 0, 4)],
  },
  {
    id: "c7",
    label: "Change --out-dir to resolve from cwd",
    at: "4m ago",
    files: [f("src/commands/build.ts", 6, 3), f("test/cli.spec.ts", 12, 2)],
  },
  {
    id: "c8",
    label: "Update snapshots after the flag change",
    at: "1m ago",
    files: [f("test/__snapshots__/cli.spec.ts.snap", 40, 38)],
  },
];

/** Keeps a Latin path or flag in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

/** Arabic noun after a numeral: 1, 2 and 3–10 pick their forms; 11+ the singular. */
const arCount = (n: number, one: string, two: string, few: string, many: string) =>
  n === 1 ? one : n === 2 ? two : n >= 3 && n <= 10 ? few : many;

/** Turn summaries and times per language; file paths stay as they are. */
const copy: Record<
  DemoLocale,
  { turns?: [string, string][]; labels?: Partial<CheckpointTimelineLabels> }
> = {
  en: {},
  he: {
    turns: [
      [`קריאת הגדרות yargs ב־${ltr("src/cli.ts")}`, "לפני 18 דק׳"],
      [`הוספת commander והסרת yargs מ־${ltr("package.json")}`, "לפני 16 דק׳"],
      ["כתיבה מחדש של נקודת הכניסה עם Command", "לפני 14 דק׳"],
      ["העברת פקודת build והדגלים שלה", "לפני 11 דק׳"],
      ["העברת פקודת watch", "לפני 9 דק׳"],
      ["מחיקת מנתח הארגומנטים הישן", "לפני 7 דק׳"],
      [`שינוי ${ltr("--out-dir")} כך שייפתר מתיקיית העבודה`, "לפני 4 דק׳"],
      ["עדכון snapshots אחרי שינוי הדגל", "לפני דקה"],
    ],
    labels: {
      title: "נקודות שמירה",
      turns: (n) => `${n} סבבים`,
      files: (n) => (n === 1 ? "קובץ 1" : `${n} קבצים`),
      tick: (n, label, files, at) =>
        `נקודת שמירה ${n}: ${label}, ${files} קבצים שונו, ${at}`,
      panel: (n) => `נקודת שמירה ${n}`,
      heading: (n) => <>נקודת שמירה {n}</>,
      current: "נוכחית",
      noFiles: "בסבב הזה לא שונו קבצים",
      atCheckpoint: (n) => `בנקודת שמירה ${n}`,
      position: (n, total) => (
        <>
          נקודה {n} מתוך {total}
        </>
      ),
      previous: "נקודת השמירה הקודמת",
      next: "נקודת השמירה הבאה",
      drops: (n) =>
        n === 1 ? "נקודת שמירה אחת מאוחרת תימחק" : `${n} נקודות שמירה מאוחרות יימחקו`,
      cancel: "ביטול",
      restore: "שחזור",
      restoreHere: "שחזור לנקודה הזו",
      currentState: "המצב הנוכחי",
      restored: (n, label) => `שוחזר לנקודת שמירה ${n}: ${label}`,
    },
  },
  ar: {
    turns: [
      [`قراءة إعداد yargs في ${ltr("src/cli.ts")}`, "قبل 18 د"],
      [`إضافة commander وإزالة yargs من ${ltr("package.json")}`, "قبل 16 د"],
      ["إعادة كتابة نقطة الدخول ببرنامج Command", "قبل 14 د"],
      ["نقل أمر build وخياراته", "قبل 11 د"],
      ["نقل أمر watch", "قبل 9 د"],
      ["حذف محلل الوسائط القديم", "قبل 7 د"],
      [`جعل ${ltr("--out-dir")} يُحسب من مجلد العمل`, "قبل 4 د"],
      ["تحديث snapshots بعد تغيير الخيار", "قبل دقيقة"],
    ],
    labels: {
      title: "نقاط الاستعادة",
      turns: (n) => `${n} ${arCount(n, "دور", "أدوار", "أدوار", "دورًا")}`,
      files: (n) => `${n} ${arCount(n, "ملف", "ملفات", "ملفات", "ملفًا")}`,
      tick: (n, label, files, at) => `نقطة ${n}: ${label}، ملفات معدّلة: ${files}، ${at}`,
      panel: (n) => `نقطة الاستعادة ${n}`,
      heading: (n) => <>نقطة الاستعادة {n}</>,
      current: "الحالية",
      noFiles: "لم تتغير أي ملفات في هذا الدور",
      atCheckpoint: (n) => `عند النقطة ${n}`,
      position: (n, total) => (
        <>
          النقطة {n} من {total}
        </>
      ),
      previous: "النقطة السابقة",
      next: "النقطة التالية",
      drops: (n) =>
        n === 1
          ? "ستُحذف نقطة لاحقة واحدة"
          : n === 2
            ? "ستُحذف نقطتان لاحقتان"
            : n <= 10
              ? `ستُحذف ${n} نقاط لاحقة`
              : `ستُحذف ${n} نقطة لاحقة`,
      cancel: "إلغاء",
      restore: "استعادة",
      restoreHere: "الاستعادة إلى هنا",
      currentState: "الحالة الحالية",
      restored: (n, label) => `تمت الاستعادة إلى النقطة ${n}: ${label}`,
    },
  },
};

type State = { data: Checkpoint[]; selected?: string; confirming: boolean };

const select = (id: string, delay: number): MockStep<State> => ({
  delay,
  apply: (s) => ({ ...s, selected: id }),
});

const script: MockStep<State>[] = [
  wait(1200),
  select("c7", 0),
  select("c6", 700),
  select("c5", 700),
  { delay: 1400, apply: (s) => ({ ...s, confirming: true }) },
  {
    delay: 1800,
    apply: (s) => ({
      data: s.data.slice(0, s.data.findIndex((c) => c.id === "c5") + 1),
      selected: undefined,
      confirming: false,
    }),
  },
];

export default function CheckpointTimelineDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const { turns, labels } = copy[locale];
  const checkpoints = turns
    ? checkpointsEn.map((c, i) => ({ ...c, label: turns[i][0], at: turns[i][1] }))
    : checkpointsEn;
  const { state, setState } = useMockRun<State>(
    { data: checkpoints, confirming: false },
    script,
    { autoplay },
  );

  return (
    <CheckpointTimeline
      data={state.data}
      variant={variant === "Compact" ? "compact" : "timeline"}
      selectedId={state.selected}
      onSelect={(c) => setState((s) => ({ ...s, selected: c.id }))}
      confirming={state.confirming}
      onConfirmingChange={(confirming) => setState((s) => ({ ...s, confirming }))}
      labels={labels}
      onRestore={(c) =>
        setState((s) => ({
          data: s.data.slice(0, s.data.indexOf(c) + 1),
          selected: undefined,
          confirming: false,
        }))
      }
    />
  );
}
