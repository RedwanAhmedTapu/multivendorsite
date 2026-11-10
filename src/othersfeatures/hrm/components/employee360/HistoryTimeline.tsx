// src/othersfeatures/hrm/components/employee360/HistoryTimeline.tsx
//
// The employee's career timeline (HrEmployeeHistory) — vertical timeline
// with typed event markers.

"use client";

import { History } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import type { HrHistoryEvent } from "../../../../features/hrmApi";

const EVENT_COLORS: Record<string, string> = {
  JOINED: "#16A34A",
  PROMOTION: "#4F46E5",
  TRANSFER: "#0EA5E9",
  SALARY_REVISION: "#7C3AED",
  STATUS_CHANGE: "#B45309",
  LEAVE: "#64748B",
  RESIGNATION: "#DC2626",
  LETTER: "#0EA5E9",
  WARNING: "#DC2626",
  EXIT: "#DC2626",
  REVIEW: "#4F46E5",
};

export function HistoryTimeline({ events }: { events: HrHistoryEvent[] | undefined }) {
  return (
    <SectionCard
      icon={<History size={16} className="text-indigo-600" />}
      title="History"
      subtitle="Career timeline — newest first"
    >
      {(!events || events.length === 0) && <p className="text-sm text-gray-400">No history yet.</p>}
      {events && events.length > 0 && (
        <div className="relative space-y-4 pl-6">
          <div className="absolute bottom-1 left-[7px] top-1 w-px bg-gray-200" />
          {events.map((e) => (
            <div key={e.id} className="relative">
              <span
                className="absolute -left-6 top-1 h-[15px] w-[15px] rounded-full border-2 bg-white"
                style={{ borderColor: EVENT_COLORS[e.eventType] ?? "#94A3B8" }}
              />
              <div className="text-sm font-medium text-gray-900">{e.title}</div>
              {e.description && <div className="text-xs text-gray-500">{e.description}</div>}
              <div className="mt-0.5 text-[11px] text-gray-400">
                {e.effectiveDate ? `${e.effectiveDate} · ` : ""}
                {new Date(e.createdAt).toLocaleDateString()}
                {e.amount ? ` · ৳${e.amount}` : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
