"use client";

// components/reviews/review-form.tsx
//
// Create / edit a review. Rating and comment go to POST/PATCH /reviews; photos are
// a separate multipart call (POST /reviews/:id/images, max 3, 5MB each) because
// the review row has to exist before an image can be attached to it.
//
// The parent decides when to upload: this form only collects File objects and
// validates the count/size/type client-side so the user is never surprised by a
// server rejection.

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { StarRatingInput } from "./star-rating";
import { MAX_REVIEW_COMMENT, MAX_REVIEW_IMAGES } from "./review-types";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface ReviewFormProps {
  mode?: "create" | "edit";
  initialRating?: number;
  initialComment?: string;
  submitting?: boolean;
  error?: string | null;
  variant?: "storefront" | "dashboard";
  onSubmit: (values: { rating: number; comment: string; files: File[] }) => Promise<void> | void;
  onCancel?: () => void;
}

export function ReviewForm({
  mode = "create",
  initialRating = 0,
  initialComment = "",
  submitting = false,
  error,
  variant = "storefront",
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const dashboard = variant === "dashboard";
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRating(initialRating);
    setComment(initialComment);
    setTouched(false);
  }, [initialRating, initialComment]);

  // Object URLs must be revoked or the tab leaks them.
  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const ratingMissing = touched && rating < 1;
  const canSubmit = rating >= 1 && !submitting;

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    setFileError(null);
    const room = MAX_REVIEW_IMAGES - files.length;
    const picked = Array.from(incoming);

    if (picked.length > room) {
      setFileError(`You can add ${room} more photo${room === 1 ? "" : "s"}.`);
      return;
    }
    const bad = picked.find(
      (file) => !ACCEPTED.includes(file.type) || file.size > MAX_BYTES
    );
    if (bad) {
      setFileError(
        !ACCEPTED.includes(bad.type)
          ? "Only JPEG, PNG, WebP or GIF images are allowed."
          : "Each photo must be 5 MB or smaller."
      );
      return;
    }
    setFiles((current) => [...current, ...picked]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeAt = (index: number) => {
    setFileError(null);
    setFiles((current) => current.filter((_, i) => i !== index));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    await onSubmit({ rating, comment: comment.trim(), files });
  };

  return (
    <form
      onSubmit={submit}
      className={`rounded-2xl border bg-white p-4 ${
        dashboard ? "border-blue-100 shadow-sm shadow-blue-50" : "border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-slate-800">
          {mode === "edit" ? "Edit your review" : "Write a review"}
        </h4>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close review form"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Your rating
          </span>
          <div className="mt-1 flex items-center gap-2">
            <StarRatingInput
              value={rating}
              onChange={(next) => {
                setRating(next);
                setTouched(true);
              }}
              disabled={submitting}
              error={ratingMissing}
            />
            {rating > 0 && (
              <span className="text-xs font-semibold text-slate-500">{rating} / 5</span>
            )}
          </div>
          {ratingMissing && (
            <p className="mt-1 text-[11px] font-medium text-rose-600">Pick a star rating first.</p>
          )}
        </div>

        <div>
          <label
            htmlFor="review-comment"
            className="text-[11px] font-semibold uppercase tracking-wide text-slate-500"
          >
            Your review <span className="font-normal normal-case text-slate-400">(optional)</span>
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, MAX_REVIEW_COMMENT))}
            disabled={submitting}
            rows={4}
            placeholder="What did you like or dislike? Was the quality what you expected?"
            className={`mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 disabled:bg-slate-50 ${
              dashboard ? "focus:ring-blue-100" : "focus:ring-teal-100"
            }`}
          />
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              {comment.length}/{MAX_REVIEW_COMMENT}
            </span>
            <span className="text-[10px] text-slate-400">Visible to everyone</span>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <ImagePlus size={14} className="text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-500">
              Photos <span className="font-normal text-slate-400">(optional)</span>
            </span>
            <span className="ml-auto text-[10px] font-medium text-slate-400 tabular-nums">
              {files.length}/{MAX_REVIEW_IMAGES}
            </span>
          </div>

          {previews.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {previews.map((url, index) => (
                <li key={url} className="relative">
                  <img
                    src={url}
                    alt={`Selected photo ${index + 1}`}
                    className="h-16 w-16 rounded-lg object-cover ring-1 ring-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeAt(index)}
                    disabled={submitting}
                    aria-label={`Remove photo ${index + 1}`}
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-white p-0.5 text-slate-500 shadow ring-1 ring-slate-200 hover:text-rose-600 disabled:opacity-40"
                  >
                    <X size={11} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={submitting || files.length >= MAX_REVIEW_IMAGES}
              className="rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Choose photos
            </button>
            <span className="text-[10px] text-slate-400">
              JPEG, PNG, WebP or GIF · up to 5 MB each
            </span>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            multiple
            className="hidden"
            onChange={(event) => addFiles(event.target.files)}
          />
          {fileError && (
            <p role="alert" className="mt-1.5 text-[11px] font-medium text-rose-600">
              {fileError}
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700">
            {error}
          </p>
        )}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
              dashboard
                ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-105"
                : "bg-teal-800 hover:bg-teal-900"
            }`}
          >
            {submitting && <Loader2 size={12} className="animate-spin" />}
            {mode === "edit" ? "Save changes" : "Submit review"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="text-xs font-medium text-slate-500 transition hover:text-slate-800 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
