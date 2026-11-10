"use client";

// Shared pieces for the Marketing Center admin screens. All text via next-intl
// ("marketing" namespace in src/messages/{en,bn}.json).

import * as React from "react";
import { useFormatter, useTranslations } from "next-intl";
import { AlertTriangle, Inbox, Languages, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppLocale, LOCALES, type AppLocale } from "@/i18n/MarketingIntlProvider";
import { formatTaka, type FieldError } from "@/lib/marketing/campaign-admin";
import type { ProgrammePhase as CampaignPhase, ProgrammeStatus as CampaignStatus, RegistrationStatus } from "@/features/marketingAdminApi";

export function useMoney() {
  const { locale } = useAppLocale();
  return React.useCallback((v: string | number | null | undefined) => formatTaka(v, locale), [locale]);
}

export function useDateTime() {
  const format = useFormatter();
  return React.useCallback((iso?: string | null) => (iso ? format.dateTime(new Date(iso), { dateStyle: "medium", timeStyle: "short" }) : "—"), [format]);
}

export function LanguageSwitcher() {
  const t = useTranslations("marketing.common");
  const { locale, setLocale } = useAppLocale();
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-[#E5EAF2] bg-white p-0.5" role="group" aria-label={t("language")}>
      <Languages className="ml-1.5 h-3.5 w-3.5 text-[#7A90AB]" aria-hidden />
      {LOCALES.map((l: AppLocale) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`rounded-md px-2 py-1 text-[12px] font-semibold ${locale === l ? "bg-[#1e40af] text-white" : "text-[#334155] hover:bg-[#F5F7FB]"}`}
        >
          {l === "en" ? "English" : "বাংলা"}
        </button>
      ))}
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  PUBLISHED: "bg-blue-50 text-blue-800 border-blue-200",
  ENDED: "bg-slate-100 text-slate-600 border-slate-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  UPCOMING: "bg-violet-50 text-violet-800 border-violet-200",
  REGISTRATION_OPEN: "bg-emerald-50 text-emerald-800 border-emerald-200",
  REGISTRATION_CLOSED: "bg-amber-50 text-amber-800 border-amber-200",
  LIVE: "bg-emerald-600 text-white border-emerald-600",
  PENDING: "bg-amber-50 text-amber-800 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  WITHDRAWN: "bg-slate-100 text-slate-600 border-slate-200",
};

function Pill({ value, label }: { value: string; label: string }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold ${STATUS_STYLE[value] ?? STATUS_STYLE.DRAFT}`}>{label}</span>;
}

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const t = useTranslations("marketing.status");
  return <Pill value={status} label={t(status)} />;
}
export function PhaseBadge({ phase }: { phase: CampaignPhase }) {
  const t = useTranslations("marketing.phase");
  return <Pill value={phase} label={t(phase)} />;
}
export function RegistrationStatusBadge({ status }: { status: RegistrationStatus }) {
  const t = useTranslations("marketing.registrationStatus");
  return <Pill value={status} label={t(status)} />;
}

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  const t = useTranslations("marketing.common");
  return (
    <div className="space-y-3 p-4" aria-busy="true" aria-label={t("loading")}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const t = useTranslations("marketing.common");
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <AlertTriangle className="h-8 w-8 text-red-500" aria-hidden />
      <p className="text-[14px] font-semibold text-[#0D1B2E]">{t("loadError")}</p>
      {message && <p className="max-w-md text-[12.5px] text-[#7A90AB]">{message}</p>}
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          {t("retry")}
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <Inbox className="h-8 w-8 text-[#94A3B8]" aria-hidden />
      <p className="text-[14px] font-semibold text-[#0D1B2E]">{title}</p>
      {action}
    </div>
  );
}

export function NoticeBox({ title, children, tone = "neutral" }: { title: string; children?: React.ReactNode; tone?: "neutral" | "warning" | "danger" }) {
  const cls = tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : tone === "danger" ? "border-red-200 bg-red-50 text-red-800" : "border-[#E5EAF2] bg-[#FAFBFD] text-[#334155]";
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-[13px] ${cls}`}>
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-0.5">{children}</div>}
      </div>
    </div>
  );
}

/** Renders a FieldError: i18n code or server text. */
export function FieldMessage({ id, error }: { id: string; error?: FieldError }) {
  const t = useTranslations("marketing.errors");
  if (!error) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-[12px] font-medium text-red-600">
      {"code" in error ? t(error.code) : error.text}
    </p>
  );
}

/** Rule key → translated label (minDiscountPercent, minStock, …). */
export function useRuleLabel() {
  const t = useTranslations("marketing.rules");
  return React.useCallback((rule: string) => (t.has(rule) ? t(rule) : rule), [t]);
}
