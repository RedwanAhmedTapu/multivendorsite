"use client";

// components/chatbox/useChatConnection.ts
//
// Read-only connection status for the chat UI: browser online/offline events
// plus a light poll of socketService.isConnected(). It never connects,
// disconnects or registers socket listeners, so the Phase 1–3 socket
// lifecycle (token refresh, reconnect, listener preservation) is untouched.
// "reconnecting" is reported only after the socket has been down for two
// consecutive checks, so a normal first connect doesn't flash a banner.

import { useEffect, useState } from "react";
import { socketService } from "@/services/socketService";

export type ChatConnectionState = "online" | "reconnecting" | "offline";

export const CONNECTION_POLL_MS = 2000;

export function useChatConnection(pollMs: number = CONNECTION_POLL_MS): ChatConnectionState {
  const [browserOnline, setBrowserOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine !== false));
  const [downChecks, setDownChecks] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const on = () => setBrowserOnline(true);
    const off = () => setBrowserOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const t = setInterval(() => setDownChecks((n) => (socketService.isConnected() ? 0 : Math.min(n + 1, 3))), pollMs);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      clearInterval(t);
    };
  }, [pollMs]);

  if (!browserOnline) return "offline";
  return downChecks >= 2 ? "reconnecting" : "online";
}

export const CONNECTION_COPY: Record<Exclude<ChatConnectionState, "online">, string> = {
  offline: "You're offline. New messages won't arrive or send until your connection is back.",
  reconnecting: "Reconnecting to chat… live updates are paused. Messages you send still go through.",
};
