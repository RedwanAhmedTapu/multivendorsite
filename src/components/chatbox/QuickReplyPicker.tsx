"use client";

// components/chatbox/QuickReplyPicker.tsx
//
// Composer popover: search the quick replies available to the signed-in
// account (GET /chat/quick-replies/suggestions — the server scopes it to
// platform replies + the vendor's own) and insert one into the message box.
// Inserting never sends: the vendor reviews/edits, then sends a normal TEXT
// message. Platform replies are labelled from the server's row
// (quickReplySource), and nothing here is editable — management lives in
// /vendor-dashboard/chat/quick-reply, which lists only the vendor's own rows.

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, X, Loader2, Zap, Settings } from "lucide-react";
import { useGetQuickReplySuggestionsQuery, type ChatQuickReply } from "@/features/chatApi";
import { quickReplySource } from "@/lib/chat/chat-settings";

export function QuickReplyPicker({ onPick, onClose }: { onPick: (content: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 200);
    return () => clearTimeout(t);
  }, [query]);
  useEffect(() => {
    inputRef.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  const { data, isFetching, isError, refetch } = useGetQuickReplySuggestionsQuery(debounced || undefined);
  const items: ChatQuickReply[] = data?.data ?? [];

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label="Quick replies"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: "calc(100% + 8px)",
        maxWidth: 440,
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        boxShadow: "0 12px 40px rgba(15,23,42,0.16)",
        zIndex: 40,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>
        <Zap size={15} color="#4f46e5" aria-hidden />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", flex: 1 }}>Quick replies</span>
        <Link href="/vendor-dashboard/chat/quick-reply" aria-label="Manage quick replies" title="Manage quick replies" style={{ color: "#64748b", display: "flex", padding: 4, borderRadius: 6 }}>
          <Settings size={15} aria-hidden />
        </Link>
        <button type="button" onClick={onClose} aria-label="Close quick replies" style={{ border: "none", background: "transparent", cursor: "pointer", color: "#64748b", display: "flex", padding: 4, borderRadius: 6 }}>
          <X size={15} aria-hidden />
        </button>
      </div>
      <div style={{ position: "relative", padding: "8px 12px" }}>
        <Search size={14} color="#94a3b8" aria-hidden style={{ position: "absolute", left: 22, top: "50%", transform: "translateY(-50%)" }} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, keyword or shortcut"
          aria-label="Search quick replies"
          style={{ width: "100%", padding: "8px 10px 8px 30px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "inherit" }}
        />
      </div>
      <div style={{ maxHeight: 260, overflowY: "auto", padding: "0 6px 8px" }} aria-busy={isFetching}>
        {isError ? (
          <div role="alert" style={{ padding: "16px 12px", fontSize: 12, color: "#b91c1c", display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span>Couldn&apos;t load quick replies.</span>
            <button type="button" onClick={() => refetch()} style={{ border: "none", background: "transparent", color: "#b91c1c", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>
              Retry
            </button>
          </div>
        ) : isFetching && items.length === 0 ? (
          <div role="status" style={{ padding: 16, fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 8 }}>
            <Loader2 size={14} className="animate-spin" aria-hidden /> Loading…
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: "16px 12px", fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
            {debounced ? "No quick replies match your search." : "No quick replies yet."}{" "}
            <Link href="/vendor-dashboard/chat/quick-reply" style={{ color: "#4f46e5", fontWeight: 600 }}>
              Create one
            </Link>
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {items.map((q) => (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => onPick(q.content)}
                  className="quick-reply-option"
                  style={{ width: "100%", textAlign: "left", border: "none", background: "transparent", cursor: "pointer", padding: "8px 10px", borderRadius: 10, font: "inherit" }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{q.name}</span>
                    {q.shortcut ? <code style={{ fontSize: 10, color: "#64748b", background: "#f1f5f9", borderRadius: 4, padding: "1px 4px" }}>/{q.shortcut}</code> : null}
                    {quickReplySource(q) === "platform" ? (
                      <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: "#4f46e5", background: "#eef2ff", borderRadius: 999, padding: "1px 7px" }}>FinixMart</span>
                    ) : null}
                  </span>
                  <span style={{ display: "block", fontSize: 12, color: "#64748b", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.content}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <style>{`.quick-reply-option:hover, .quick-reply-option:focus-visible { background: #f5f3ff !important; outline: none; }`}</style>
    </div>
  );
}

export default QuickReplyPicker;
