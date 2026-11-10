// lib/chat/chat-settings.ts
//
// Pure helpers for the vendor chat-settings screens (auto replies, quick
// replies, notifications) and the composer's quick-reply picker. No React,
// no network — unit-testable.
//
// What the backend actually supports (inspected, not assumed):
//   - auto replies: the trigger engine evaluates only KEYWORD (substring
//     match, case-insensitive) and FIRST_MESSAGE; INACTIVITY / AWAY_MODE are
//     accepted by validation but never fire; matchType and cooldownSeconds are
//     stored but not applied; only TEXT replies are posted correctly. So the
//     editor offers exactly KEYWORD + FIRST_MESSAGE, text replies, and the
//     per-conversation limit (maxTriggersPerConv), which IS enforced.
//   - payloads never carry vendorId / scope / counters — the server derives
//     ownership from the authenticated vendor (and refuses protected fields
//     on quick replies).

export type AutoReplyTrigger = "KEYWORD" | "FIRST_MESSAGE";

export const SUPPORTED_AUTO_REPLY_TRIGGERS: { value: AutoReplyTrigger; label: string; help: string }[] = [
  { value: "FIRST_MESSAGE", label: "First message", help: "Sent once when a customer messages you for the first time in a conversation." },
  { value: "KEYWORD", label: "Keyword", help: "Sent when a customer's message contains one of your keywords (not case-sensitive)." },
];

/** Stored trigger types the engine does not run — shown as such, never offered. */
export const UNSUPPORTED_TRIGGER_COPY: Record<string, string> = {
  INACTIVITY: "Inactivity rules are saved but not sent yet.",
  AWAY_MODE: "Away-mode rules are saved but not sent yet.",
};

export const LIMITS = {
  autoReplyName: 120,
  autoReplyMessage: 2000,
  keyword: 100,
  keywordCount: 50,
  maxTriggersMin: 1,
  maxTriggersMax: 100,
  quickReplyName: 100,
  quickReplyContent: 2000,
  shortcut: 50,
  category: 100,
} as const;

export interface AutoReplyDraft {
  name: string;
  triggerType: AutoReplyTrigger;
  keywordsText: string;
  message: string;
  maxTriggersPerConv: string;
  isActive: boolean;
}

export interface QuickReplyDraft {
  name: string;
  content: string;
  shortcut: string;
  category: string;
  keywordsText: string;
}

export type FieldErrors = Partial<Record<string, string>>;

/** "a, b ,a" → ["a", "b"] (trimmed, de-duplicated case-insensitively, order kept). */
export function splitKeywords(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of (text ?? "").split(",")) {
    const k = raw.trim();
    if (!k || seen.has(k.toLowerCase())) continue;
    seen.add(k.toLowerCase());
    out.push(k);
  }
  return out;
}

export function emptyAutoReplyDraft(): AutoReplyDraft {
  return { name: "", triggerType: "FIRST_MESSAGE", keywordsText: "", message: "", maxTriggersPerConv: "1", isActive: true };
}

export function autoReplyToDraft(rule: { name?: string; triggerType?: string; keywords?: string[]; message?: string; maxTriggersPerConv?: number; isActive?: boolean }): AutoReplyDraft {
  return {
    name: rule.name ?? "",
    triggerType: rule.triggerType === "KEYWORD" ? "KEYWORD" : "FIRST_MESSAGE",
    keywordsText: (rule.keywords ?? []).join(", "),
    message: rule.message ?? "",
    maxTriggersPerConv: String(rule.maxTriggersPerConv ?? 1),
    isActive: rule.isActive ?? true,
  };
}

export function validateAutoReplyDraft(d: AutoReplyDraft): FieldErrors {
  const e: FieldErrors = {};
  const name = d.name.trim();
  if (!name) e.name = "Give the rule a name.";
  else if (name.length > LIMITS.autoReplyName) e.name = `Use at most ${LIMITS.autoReplyName} characters.`;
  const message = d.message.trim();
  if (!message) e.message = "Write the reply customers will receive.";
  else if (message.length > LIMITS.autoReplyMessage) e.message = `Use at most ${LIMITS.autoReplyMessage} characters.`;
  if (!SUPPORTED_AUTO_REPLY_TRIGGERS.some((t) => t.value === d.triggerType)) e.triggerType = "Choose when the reply is sent.";
  const keywords = splitKeywords(d.keywordsText);
  if (d.triggerType === "KEYWORD") {
    if (keywords.length === 0) e.keywords = "Add at least one keyword.";
    else if (keywords.length > LIMITS.keywordCount) e.keywords = `Use at most ${LIMITS.keywordCount} keywords.`;
    else if (keywords.some((k) => k.length > LIMITS.keyword)) e.keywords = `Each keyword can have at most ${LIMITS.keyword} characters.`;
  }
  const max = Number(d.maxTriggersPerConv);
  if (!Number.isInteger(max) || max < LIMITS.maxTriggersMin || max > LIMITS.maxTriggersMax) {
    e.maxTriggersPerConv = `Enter a whole number from ${LIMITS.maxTriggersMin} to ${LIMITS.maxTriggersMax}.`;
  }
  return e;
}

/** The request body — whitelisted fields only (never vendorId / scope / counters). */
export function toAutoReplyPayload(d: AutoReplyDraft) {
  return {
    name: d.name.trim(),
    triggerType: d.triggerType,
    message: d.message.trim(),
    messageType: "TEXT" as const,
    keywords: d.triggerType === "KEYWORD" ? splitKeywords(d.keywordsText) : [],
    maxTriggersPerConv: Number(d.maxTriggersPerConv),
    isActive: d.isActive,
  };
}

export function emptyQuickReplyDraft(): QuickReplyDraft {
  return { name: "", content: "", shortcut: "", category: "", keywordsText: "" };
}

export function quickReplyToDraft(q: { name?: string; content?: string; shortcut?: string | null; category?: string | null; keywords?: string[] }): QuickReplyDraft {
  return { name: q.name ?? "", content: q.content ?? "", shortcut: q.shortcut ?? "", category: q.category ?? "", keywordsText: (q.keywords ?? []).join(", ") };
}

export function validateQuickReplyDraft(d: QuickReplyDraft): FieldErrors {
  const e: FieldErrors = {};
  if (!d.name.trim()) e.name = "Give the quick reply a name.";
  else if (d.name.length > LIMITS.quickReplyName) e.name = `Use at most ${LIMITS.quickReplyName} characters.`;
  if (!d.content.trim()) e.content = "Write the message text.";
  else if (d.content.length > LIMITS.quickReplyContent) e.content = `Use at most ${LIMITS.quickReplyContent} characters.`;
  if (d.shortcut.length > LIMITS.shortcut) e.shortcut = `Use at most ${LIMITS.shortcut} characters.`;
  else if (/\s/.test(d.shortcut.trim())) e.shortcut = "Shortcuts can't contain spaces.";
  if (d.category.length > LIMITS.category) e.category = `Use at most ${LIMITS.category} characters.`;
  const keywords = splitKeywords(d.keywordsText);
  if (keywords.length > LIMITS.keywordCount) e.keywords = `Use at most ${LIMITS.keywordCount} keywords.`;
  else if (keywords.some((k) => k.length > LIMITS.keyword)) e.keywords = `Each keyword can have at most ${LIMITS.keyword} characters.`;
  return e;
}

/**
 * Whitelisted body. On create, empty optional fields are left out; on update
 * they are sent as "" so clearing a shortcut / category actually clears it.
 */
export function toQuickReplyPayload(d: QuickReplyDraft, mode: "create" | "update" = "create") {
  const body: { name: string; content: string; shortcut?: string; category?: string; keywords: string[] } = {
    name: d.name.trim(),
    content: d.content,
    keywords: splitKeywords(d.keywordsText),
  };
  if (d.shortcut.trim() || mode === "update") body.shortcut = d.shortcut.trim();
  if (d.category.trim() || mode === "update") body.category = d.category.trim();
  return body;
}

/**
 * Where a quick reply in the composer comes from — decided from the SERVER's
 * row (platform rows are GLOBAL with no owning vendor), never from a vendor id
 * the client holds. Only rows the vendor's own list returned are editable.
 */
export function quickReplySource(row: { scope?: string; vendorId?: string | null }): "platform" | "yours" {
  return row.scope === "GLOBAL" && (row.vendorId ?? null) === null ? "platform" : "yours";
}

/** User-facing copy for a failed request — never the server's internal text. */
export function friendlyError(err: unknown, action = "save"): string {
  const status = (err as { status?: number | string } | null)?.status;
  if (status === 403) return "Only the store owner can manage chat settings.";
  if (status === 404) return "This item no longer exists. The list has been refreshed.";
  if (status === 400) return `The server didn't accept these values. Please check them and ${action} again.`;
  if (status === 503 || status === 429) return "The service is busy. Please try again in a moment.";
  if (status === "FETCH_ERROR") return "You appear to be offline. Check your connection and try again.";
  return `Couldn't ${action} right now. Please try again.`;
}

/** Label for a message whose sender isn't the conversation's counterpart (e.g. a platform auto-reply). */
export function senderTypeLabel(senderType?: string | null): string | null {
  switch (senderType) {
    case "ADMIN":
    case "EMPLOYEE":
      return "FinixMart Support";
    case "VENDOR":
      return "Store";
    case "CUSTOMER":
      return "Customer";
    case "DELIVERY":
      return "Delivery partner";
    case "AGENT": // P10: FinixMart agent
      return "Agent";
    default:
      return null;
  }
}

export function conversationTypeLabel(type?: string | null): string {
  switch (type) {
    case "PRODUCT_INQUIRY":
      return "Product inquiry";
    case "USER_SUPPORT":
    case "VENDOR_SUPPORT":
      return "FinixMart support";
    case "DELIVERY_CHAT":
      return "Delivery";
    case "GENERAL_CHAT":
      return "Chat";
    default:
      return "Conversation";
  }
}
