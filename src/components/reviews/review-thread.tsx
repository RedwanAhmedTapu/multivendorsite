"use client";

// components/reviews/review-thread.tsx
//
// Comment/reply thread under a review. Depth is capped at one level to match
// the backend rule (review-write-rules.ts MAX_REPLY_DEPTH = 1).
//
// INTEGRATION POINT — no comment API exists yet. `review_comments` is part of
// the unapplied Migration A and no service/route reads or writes it, so this
// component is presentational: without `onSubmit` the composer renders a
// disabled state with its reason, and nothing is ever faked as saved.

import { useState } from "react";
import { CornerDownRight, Lock, Send } from "lucide-react";
import { StarRating } from "./star-rating";
import { formatReviewDate, initialsOf, type ReviewCommentDto } from "./review-types";

interface ReviewThreadProps {
  comments?: ReviewCommentDto[] | null;
  /** Storefront = teal accents, dashboard = blue. */
  variant?: "storefront" | "dashboard";
  /** When absent the composer is disabled and says why. */
  onSubmit?: (body: string, parentId?: string) => Promise<void> | void;
  submitting?: boolean;
  /** Admin view: reveal hidden comments instead of hiding them. */
  showHidden?: boolean;
  onHide?: (commentId: string) => void;
}

export function ReviewThread({
  comments,
  variant = "storefront",
  onSubmit,
  submitting = false,
  showHidden = false,
  onHide,
}: ReviewThreadProps) {
  const [draftFor, setDraftFor] = useState<string | null>(null);
  const [body, setBody] = useState("");

  const all = (comments ?? []).filter((c) => !!c && typeof c.body === "string");
  if (all.length === 0) return null;

  const roots = all.filter((c) => !c.parentId);
  const repliesOf = (id: string) => all.filter((c) => c.parentId === id);
  const accent = variant === "dashboard" ? "text-blue-600" : "text-teal-700";
  const ring = variant === "dashboard" ? "ring-blue-100" : "ring-teal-100";

  const canCompose = typeof onSubmit === "function";

  const submit = async (parentId?: string) => {
    const text = body.trim();
    if (!text || !onSubmit) return;
    await onSubmit(text, parentId);
    setBody("");
    setDraftFor(null);
  };

  return (
    <div className="mt-4 space-y-3 border-t border-slate-100 pt-3">
      {roots.slice(0, 6).map((comment) => {
        const replies = repliesOf(comment.id);
        return (
          <div key={comment.id} className="space-y-2">
            <CommentRow comment={comment} showHidden={showHidden} onHide={onHide} />
            {replies.length > 0 && (
              <ul className="ml-9 space-y-2 border-l border-slate-100 pl-3">
                {replies.slice(0, 4).map((reply) => (
                  <li key={reply.id}>
                    <CommentRow
                      comment={reply}
                      reply
                      showHidden={showHidden}
                      onHide={onHide}
                    />
                  </li>
                ))}
              </ul>
            )}
            {canCompose && !comment.parentId && (
              <div className="ml-9">
                {draftFor === comment.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={2}
                      maxLength={500}
                      placeholder="Write a reply…"
                      className={`w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-slate-300 focus:ring-2 ${ring}`}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={submitting || !body.trim()}
                        onClick={() => submit(comment.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40"
                      >
                        <Send size={11} /> Send
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDraftFor(null);
                          setBody("");
                        }}
                        className="text-[11px] font-medium text-slate-500 hover:text-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setDraftFor(comment.id);
                      setBody("");
                    }}
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold ${accent} hover:underline`}
                  >
                    <CornerDownRight size={11} /> Reply
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {!canCompose && (
        <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Lock size={11} /> Replies open once the comment API ships.
        </p>
      )}
    </div>
  );
}

function CommentRow({
  comment,
  reply = false,
  showHidden = false,
  onHide,
}: {
  comment: ReviewCommentDto;
  reply?: boolean;
  showHidden?: boolean;
  onHide?: (id: string) => void;
}) {
  const hidden = !!(comment as { hiddenAt?: string | null }).hiddenAt;
  return (
    <div className={`rounded-xl bg-slate-50/80 px-3 py-2 ${hidden ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${
            reply ? "bg-slate-200 text-slate-600" : "bg-white text-slate-500 ring-1 ring-slate-200"
          }`}
        >
          {initialsOf(comment.user?.name)}
        </span>
        <span className="text-[11px] font-semibold text-slate-700">
          {comment.user?.name || "Customer"}
        </span>
        <span className="text-[10px] text-slate-400">{formatReviewDate(comment.createdAt)}</span>
        {hidden && (
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
            hidden
          </span>
        )}
        {showHidden && hidden && onHide && (
          <button
            type="button"
            onClick={() => onHide(comment.id)}
            className="ml-auto text-[10px] font-semibold text-blue-600 hover:underline"
          >
            Restore
          </button>
        )}
      </div>
      <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-600">{comment.body}</p>
    </div>
  );
}

/** Compact "4.6 ★ · 12 reviews" line used in headers and vendor rows. */
export function ReviewInlineScore({ value, count }: { value: number; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
      <StarRating value={value} size={12} />
      <span className="font-semibold text-slate-700 tabular-nums">{value.toFixed(1)}</span>
      <span className="text-slate-400">({count})</span>
    </span>
  );
}
