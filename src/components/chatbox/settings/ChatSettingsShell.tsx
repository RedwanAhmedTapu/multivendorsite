"use client";

// components/chatbox/settings/ChatSettingsShell.tsx
//
// Shared frame for the vendor chat-settings screens: page header, section
// tabs (real routes, so each screen is linkable), and the common loading /
// error / forbidden / empty states. No data fetching here.

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Bot, Zap, Bell, AlertTriangle, Lock, Loader2, RefreshCw, ArrowLeft } from "lucide-react";

export const CHAT_SETTINGS_TABS = [
  { href: "/vendor-dashboard/chat/auto-reply", label: "Auto replies", icon: Bot },
  { href: "/vendor-dashboard/chat/quick-reply", label: "Quick replies", icon: Zap },
  { href: "/vendor-dashboard/chat/notification", label: "Notifications", icon: Bell },
] as const;

export function ChatSettingsShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  return (
    <div className="mx-auto w-full max-w-4xl px-1 py-2 sm:px-2">
      <Link
        href="/vendor-dashboard/chat"
        className="mb-3 inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to Live Chat
      </Link>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-sm">
            <MessageSquare className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h1>
            <p className="mt-0.5 text-sm text-slate-500">{description}</p>
          </div>
        </div>
        {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
      </div>

      <nav aria-label="Chat settings" className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
        {CHAT_SETTINGS_TABS.map((t) => {
          const active = pathname.startsWith(t.href);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:text-sm ${
                active ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {t.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}

export function SettingsLoading({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl border border-slate-100 bg-slate-50" />
      ))}
      <p className="flex items-center gap-2 text-xs text-slate-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> {label}
      </p>
    </div>
  );
}

/** Error / forbidden panel. Never shows server-provided text. */
export function SettingsError({ forbidden, what, onRetry }: { forbidden?: boolean; what: string; onRetry?: () => void }) {
  if (forbidden) {
    return (
      <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">Only the store owner can manage {what}.</p>
          <p className="mt-0.5 text-amber-800/80">Sign in with the vendor account to change these settings.</p>
        </div>
      </div>
    );
  }
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>Couldn&apos;t load {what}. Check your connection and try again.</p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Try again
        </button>
      ) : null}
    </div>
  );
}

export function SettingsEmpty({ icon, title, hint, action }: { icon: React.ReactNode; title: string; hint: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">{icon}</span>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-slate-500">{hint}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs font-medium text-rose-600">
      {message}
    </p>
  );
}

export const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 aria-[invalid=true]:border-rose-300";

export const primaryBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1";

export const secondaryBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

export const dangerBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500";

/** Accessible on/off switch (button role="switch"); no Radix portal so it renders anywhere. */
export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (next: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-indigo-600" : "bg-slate-300"
      }`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}
