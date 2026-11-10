// lib/pos/admin-subscription.ts
//
// Client-side checks for the admin lifecycle form (the server re-validates).

import type { LifecycleOp } from "@/features/posSubscriptionAdminApi";

export type LifecycleBody = { op: LifecycleOp; reason: string; days?: number; until?: string | null };

export function validateLifecycleForm(
  f: { op: LifecycleOp; reason: string; days?: string; until?: string; openEnded?: boolean },
  now: Date = new Date(),
): { ok: true; body: LifecycleBody } | { ok: false; message: string } {
  const reason = f.reason.trim();
  if (reason.length < 3) return { ok: false, message: "Give a reason (at least 3 characters)." };
  if (reason.length > 500) return { ok: false, message: "Reason is too long (max 500)." };
  if (f.op === "extend") {
    const days = Number(f.days);
    if (!Number.isInteger(days) || days < 1 || days > 3660) return { ok: false, message: "Days must be a whole number between 1 and 3660." };
    return { ok: true, body: { op: f.op, reason, days } };
  }
  if (f.op === "grant") {
    if (f.openEnded) return { ok: true, body: { op: f.op, reason, until: null } };
    if (!f.until || !/^\d{4}-\d{2}-\d{2}$/.test(f.until)) return { ok: false, message: "Pick an end date or choose open-ended." };
    const [y, m, d] = f.until.split("-").map(Number);
    const end = new Date(y, m - 1, d, 23, 59, 59, 999);
    if (end.getTime() <= now.getTime()) return { ok: false, message: "The end date must be in the future." };
    return { ok: true, body: { op: f.op, reason, until: end.toISOString() } };
  }
  return { ok: true, body: { op: f.op, reason } };
}
