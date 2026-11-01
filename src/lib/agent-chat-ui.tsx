// Agent chat (P10) — small presentational pieces the existing chat UI shows
// ONLY for agent conversations, and only while NEXT_PUBLIC_AGENT_CHAT_ENABLED
// is "true". For every other conversation they render nothing, so the
// existing customer / vendor / admin chat looks exactly as before.

import { ShieldCheck } from "lucide-react";

export const AGENT_CHAT_UI_ENABLED = process.env.NEXT_PUBLIC_AGENT_CHAT_ENABLED === "true";

/** Conversation types that involve an agent (backend AGENT_SUPPORT / AGENT_VENDOR). */
export const isAgentConversation = (type: unknown): boolean => type === "AGENT_SUPPORT" || type === "AGENT_VENDOR";

export const AGENT_CHAT_NOTICE = "FinixMart admins can read this conversation.";

/** "Agent" label next to an agent's name in conversation lists. */
export function AgentChatBadge() {
  return (
    <span className="ml-1.5 inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-1.5 py-px align-middle text-[10px] font-bold uppercase tracking-wide text-violet-700">
      Agent
    </span>
  );
}

/** Banner shown on both sides of an agent conversation. */
export function AgentChatNotice({ readOnlyText }: { readOnlyText?: string | null }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-violet-100 bg-violet-50 px-4 py-2 text-xs text-violet-800" role="note">
      <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
      <span>{AGENT_CHAT_NOTICE}</span>
      {readOnlyText && <span className="font-semibold">{readOnlyText}</span>}
    </div>
  );
}
