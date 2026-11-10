"use client";

// components/chatbox/settings/ChatNotificationSettings.tsx
//
// Chat notification preferences — GET / PATCH /chat/notifications (per
// signed-in account, server-side). Only the two settings the chat actually
// honours are offered: message notifications (isEnabled) and the notification
// sound (soundEnabled), both read by the open conversation. Quiet hours,
// previews, away messages and business hours are listed as NOT available —
// the backend stores some of these fields but nothing applies them, so the
// screen doesn't pretend they work (and nothing is kept in local state).

import React, { useState } from "react";
import { Bell, Volume2, Clock, MoonStar, Eye, CalendarClock, Loader2 } from "lucide-react";
import { useGetNotificationSettingsQuery, useUpdateNotificationSettingsMutation } from "@/features/chatApi";
import { friendlyError } from "@/lib/chat/chat-settings";
import { ChatSettingsShell, SettingsLoading, SettingsError, Toggle } from "./ChatSettingsShell";

const NOT_AVAILABLE = [
  { icon: Clock, title: "Away message", text: "Automatic replies while you're away aren't sent yet. Use a first-message auto reply instead." },
  { icon: CalendarClock, title: "Business hours", text: "Opening hours for chat aren't supported yet." },
  { icon: MoonStar, title: "Quiet hours", text: "Muting notifications on a schedule isn't applied yet." },
  { icon: Eye, title: "Message previews", text: "Choosing whether previews are shown isn't applied yet." },
];

export function ChatNotificationSettings() {
  const { data, isLoading, isError, error, refetch } = useGetNotificationSettingsQuery();
  const [update] = useUpdateNotificationSettingsMutation();
  const [pending, setPending] = useState<"isEnabled" | "soundEnabled" | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const settings = data?.data;
  const forbidden = (error as { status?: number } | undefined)?.status === 403;
  const enabled = settings?.isEnabled ?? true;
  const sound = settings?.soundEnabled ?? true;

  const save = async (key: "isEnabled" | "soundEnabled", value: boolean) => {
    setPending(key);
    setNotice(null);
    try {
      await update({ [key]: value }).unwrap();
      setNotice({ kind: "success", text: "Saved." });
    } catch (err) {
      setNotice({ kind: "error", text: friendlyError(err) });
    } finally {
      setPending(null);
    }
  };

  return (
    <ChatSettingsShell title="Chat notifications" description="How the chat alerts you to new customer messages on this account.">
      <div aria-live="polite" className="mb-3">
        {notice ? (
          <p role={notice.kind === "error" ? "alert" : "status"} className={`rounded-lg px-3 py-2 text-sm ${notice.kind === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
            {notice.text}
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <SettingsLoading label="Loading notification settings…" />
      ) : isError ? (
        <SettingsError forbidden={forbidden} what="notification settings" onRetry={forbidden ? undefined : refetch} />
      ) : (
        <section aria-label="Notification settings" className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
          <Row
            icon={<Bell className="h-4 w-4" aria-hidden />}
            title="Message notifications"
            text="Show an alert when a new message arrives in an open conversation."
            control={<Toggle checked={enabled} disabled={pending !== null} onChange={(v) => save("isEnabled", v)} label="Message notifications" />}
            busy={pending === "isEnabled"}
          />
          <Row
            icon={<Volume2 className="h-4 w-4" aria-hidden />}
            title="Notification sound"
            text={enabled ? "Play a short sound with each new message." : "Turn message notifications on to use the sound."}
            control={<Toggle checked={sound} disabled={pending !== null || !enabled} onChange={(v) => save("soundEnabled", v)} label="Notification sound" />}
            busy={pending === "soundEnabled"}
          />
        </section>
      )}

      <section aria-labelledby="chat-not-available" className="mt-6">
        <h2 id="chat-not-available" className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Not available yet
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {NOT_AVAILABLE.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-slate-600">{title}</p>
                <p className="text-xs text-slate-500">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </ChatSettingsShell>
  );
}

function Row({ icon, title, text, control, busy }: { icon: React.ReactNode; title: string; text: string; control: React.ReactNode; busy: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">{icon}</span>
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500">{text}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {busy ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-label="Saving" /> : null}
        {control}
      </div>
    </div>
  );
}

export default ChatNotificationSettings;
