"use client";

import { Brain, Gauge, ShieldCheck } from "@phosphor-icons/react";
import { Panel, Inset, Shell, ShellHeader } from "@/components/ui/surface";
import { StatusPill } from "@/components/ui/status-pill";
import type { DemoLocale } from "@/components/docs/demo";

/** Keeps a Latin name in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

const copy: Record<
  DemoLocale,
  {
    permissions: string;
    waiting: string;
    rateLimits: string;
    tier: string;
    healthy: string;
    noIcon: string;
    noIconSubtitle: string;
    shell: string;
    shellSubtitle: string;
    panel: string;
    panelText: string;
    inset: string;
    footer: string;
  }
> = {
  en: {
    permissions: "Permission requests",
    waiting: "4 waiting",
    rateLimits: "Rate limits",
    tier: "opus-5.5 · Tier 3",
    healthy: "Healthy",
    noIcon: "No icon",
    noIconSubtitle: "The title lines up with panel content",
    shell: "Shell",
    shellSubtitle: "Headers and footers sit in its padding",
    panel: "Panel",
    panelText: "Main content, one step lighter or darker than the shell.",
    inset: "Inset — code, payloads and details, one level deeper",
    footer: "Footer text lives in the shell too.",
  },
  he: {
    permissions: "בקשות הרשאה",
    waiting: "4 ממתינות",
    rateLimits: "מגבלות קצב",
    tier: `${ltr("opus-5.5")} · רמה 3`,
    healthy: "תקין",
    noIcon: "בלי אייקון",
    noIconSubtitle: "הכותרת מיושרת לתוכן הפאנל",
    shell: "Shell",
    shellSubtitle: "כותרות עליונות ותחתונות יושבות בריפוד שלו",
    panel: "Panel",
    panelText: "התוכן הראשי, בהיר או כהה בדרגה אחת מה־Shell.",
    inset: "Inset — קוד, מטענים ופרטים, רמה אחת עמוק יותר",
    footer: "גם טקסט התחתית נמצא בתוך ה־Shell.",
  },
  ar: {
    permissions: "طلبات الأذونات",
    waiting: "4 قيد الانتظار",
    rateLimits: "حدود المعدّل",
    tier: `${ltr("opus-5.5")} · المستوى 3`,
    healthy: "سليم",
    noIcon: "بلا أيقونة",
    noIconSubtitle: "يصطف العنوان مع محتوى اللوحة",
    shell: "Shell",
    shellSubtitle: "الترويسة والتذييل يقعان في حشوته",
    panel: "Panel",
    panelText: "المحتوى الرئيسي، أفتح أو أغمق بدرجة واحدة من الإطار.",
    inset: "Inset — الشيفرة والحمولات والتفاصيل، بمستوى أعمق",
    footer: "نص التذييل يعيش داخل الإطار أيضًا.",
  },
};

export default function SurfaceDemo({
  variant,
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  if (variant === "Headers") {
    return (
      <div className="flex w-full max-w-md flex-col gap-3">
        <Shell>
          <ShellHeader
            icon={ShieldCheck}
            title={text.permissions}
            aside={
              <span className="text-[0.8125rem] text-muted-foreground">
                {text.waiting}
              </span>
            }
          />
          <Panel className="h-14" />
        </Shell>
        <Shell>
          <ShellHeader
            icon={Gauge}
            title={text.rateLimits}
            subtitle={text.tier}
            aside={
              <StatusPill tone="positive" size="sm">
                {text.healthy}
              </StatusPill>
            }
          />
          <Panel className="h-14" />
        </Shell>
        <Shell>
          <ShellHeader title={text.noIcon} subtitle={text.noIconSubtitle} />
          <Panel className="h-14" />
        </Shell>
      </div>
    );
  }

  return (
    <Shell className="max-w-md">
      <ShellHeader icon={Brain} title={text.shell} subtitle={text.shellSubtitle} />
      <Panel className="p-4">
        <p className="text-sm">{text.panel}</p>
        <p className="mb-3 text-[0.8125rem] text-muted-foreground">{text.panelText}</p>
        <Inset className="px-3.5 py-3 font-mono text-xs text-muted-foreground">
          {text.inset}
        </Inset>
      </Panel>
      <p className="px-3.5 py-3 text-[0.8125rem] text-muted-foreground">{text.footer}</p>
    </Shell>
  );
}
