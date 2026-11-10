"use client";

// Campaign Pages — list + editor.
//
// Left: every campaign (search, status filter, live/draft counts). Right: the
// selected campaign's editor, built from the shared ProductForm primitives
// (components/ui/section-card + section-buttons) so it reads like the rest of
// the dashboard. Only actions the backend supports are offered:
//   create (title)            POST   /api/campaigns
//   edit details / hero / dates PUT  /api/campaigns/:id   (changed fields only)
//   hero image upload         POST   /api/campaigns/upload-image
//   publish / unpublish       POST   /api/campaigns/:id/(un)publish
//   delete                    DELETE /api/campaigns/:id
//   page blocks & products → the block builder at /admin-dashboard/campaigns/[id]
// Form logic lives in lib/campaign/campaign-editor.ts (unit tested).

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useListCampaignsQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  useDeleteCampaignMutation,
  usePublishCampaignMutation,
  useUnpublishCampaignMutation,
  useUploadCampaignImageMutation,
  type CampaignPage,
} from "@/features/campaignPageApi";
import {
  buildCampaignUpdate,
  campaignStats,
  campaignToForm,
  campaignWindow,
  filterCampaigns,
  fromDateTimeLocal,
  validateCampaignForm,
  type CampaignFormErrors,
  type CampaignFormState,
  type CampaignStatusFilter,
  type CampaignWindow,
} from "@/lib/campaign/campaign-editor";
import { SectionCard, FieldLabel, FieldError } from "@/components/ui/section-card";
import { GradientButton, OutlineButton, SmallOutlineButton } from "@/components/ui/section-buttons";
import { Input } from "@/components/ui/input";
import { usePermissions } from "@/hooks/usePermissions";
import { CampaignProgrammeTabs, ProgrammeChip, useProgrammeSummaries } from "@/components/marketing/admin/CampaignProgrammeTabs";
import { StaffCampaignsView } from "@/components/marketing/admin/StaffCampaignsView";
import type { CampaignPageSummary } from "@/features/marketingAdminApi";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CalendarClock,
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  Loader2,
  Megaphone,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Type,
  Upload,
  X,
} from "lucide-react";

/* Tokens — the ProductForm palette (see components/ui/section-card.tsx). */
const C = {
  text: "#0D1B2E",
  textMuted: "#3D5068",
  textFaint: "#7A90AB",
  textFainter: "#9BAABB",
  border: "#E5EAF2",
  borderSoft: "#F0F4FA",
  panelBg: "#FAFBFD",
  pageBg: "#F0F4FA",
  iconBg: "#EEF3FB",
  primary: "#1D4ED8",
  primarySoft: "#EEF3FB",
  danger: "#DC2626",
  dangerBg: "#FEF2F2",
  dangerBorder: "#FECACA",
  success: "#16A34A",
  successBg: "#F0F9F0",
  successBorder: "#BBF7D0",
  warn: "#B45309",
  warnBg: "#FEF3C7",
  purple: "#7C3AED",
};
const GRADIENT = "linear-gradient(135deg,#1D4ED8,#7C3AED)";

const STATUS_META: Record<CampaignPage["status"], { label: string; bg: string; fg: string }> = {
  PUBLISHED: { label: "Live", bg: C.successBg, fg: C.success },
  DRAFT: { label: "Draft", bg: C.panelBg, fg: C.textFaint },
  ARCHIVED: { label: "Archived", bg: "#F1F5F9", fg: "#64748B" },
  SCHEDULED: { label: "Scheduled", bg: C.warnBg, fg: C.warn },
};

const WINDOW_META: Record<CampaignWindow, { label: string; fg: string }> = {
  ALWAYS: { label: "No date limits", fg: C.textFaint },
  UPCOMING: { label: "Starts later", fg: C.warn },
  RUNNING: { label: "In date window", fg: C.success },
  ENDED: { label: "Ended", fg: C.danger },
};

function StatusBadge({ status }: { status: CampaignPage["status"] }) {
  const s = STATUS_META[status] ?? STATUS_META.DRAFT;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        padding: "3px 9px",
        borderRadius: 20,
        background: s.bg,
        color: s.fg,
        border: `1px solid ${status === "PUBLISHED" ? C.successBorder : C.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : null;

/* ─── List item ──────────────────────────────────────────────────────────── */

function CampaignListItem({
  campaign,
  selected,
  onSelect,
  programme,
}: {
  campaign: CampaignPage;
  selected: boolean;
  onSelect: () => void;
  /** Vendor programme summary (Marketing Center), if the campaign has one. */
  programme?: CampaignPageSummary["programme"];
}) {
  const win = WINDOW_META[campaignWindow(campaign)];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className="w-full text-left"
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: 10,
        borderRadius: 12,
        border: `1.5px solid ${selected ? C.primary : C.border}`,
        background: selected ? C.primarySoft : "#fff",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "border-color 0.15s ease, background 0.15s ease",
      }}
    >
      <div
        style={{
          width: 56,
          height: 40,
          borderRadius: 9,
          flexShrink: 0,
          background: campaign.heroImage ? `url(${campaign.heroImage}) center/cover` : C.iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid ${C.borderSoft}`,
        }}
      >
        {!campaign.heroImage && <Megaphone size={16} color={C.primary} />}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {campaign.title}
          </span>
          <StatusBadge status={campaign.status} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, fontSize: 10.5, color: C.textFaint }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>/campaign/{campaign.slug}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
            <Layers size={10} /> {campaign._count?.components ?? 0}
          </span>
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, color: win.fg, marginTop: 2 }}>{win.label}</div>
        {programme && <ProgrammeChip status={programme.status} pending={programme.counts?.pending ?? 0} />}
      </div>
    </button>
  );
}

/* ─── Editor ─────────────────────────────────────────────────────────────── */

function CampaignEditor({
  campaign,
  onBack,
  onDeleted,
  onDirtyChange,
}: {
  campaign: CampaignPage;
  onBack: () => void;
  onDeleted: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const router = useRouter();
  const [updateCampaign, { isLoading: saving }] = useUpdateCampaignMutation();
  const [publish, { isLoading: publishing }] = usePublishCampaignMutation();
  const [unpublish, { isLoading: unpublishing }] = useUnpublishCampaignMutation();
  const [deleteCampaign, { isLoading: deleting }] = useDeleteCampaignMutation();
  const [uploadImage, { isLoading: uploading }] = useUploadCampaignImageMutation();

  // `saved` is the last server state the form is compared against.
  const [saved, setSaved] = useState<CampaignPage>(campaign);
  const [form, setForm] = useState<CampaignFormState>(() => campaignToForm(campaign));
  const [errors, setErrors] = useState<CampaignFormErrors>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Status / block count change from other actions (publish, list refetch).
  const live = campaign.status === "PUBLISHED";
  const changes = useMemo(() => buildCampaignUpdate(form, saved), [form, saved]);
  const dirty = Object.keys(changes).length > 0;
  // Block body: an effect may only return nothing or a cleanup function.
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const set = <K extends keyof CampaignFormState>(key: K, value: CampaignFormState[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSave = async () => {
    const found = validateCampaignForm(form);
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    if (!dirty) return;
    try {
      const updated = await updateCampaign({ id: campaign.id, ...changes }).unwrap();
      setSaved(updated);
      setForm(campaignToForm(updated));
      toast.success("Campaign saved");
    } catch {
      toast.error("Failed to save campaign");
    }
  };

  const handleDiscard = () => {
    setForm(campaignToForm(saved));
    setErrors({});
  };

  const handleUpload = async (file: File) => {
    try {
      const res = await uploadImage(file).unwrap();
      set("heroImage", res.url);
      toast.success("Image uploaded — save to apply it");
    } catch {
      toast.error("Image upload failed");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const togglePublish = async () => {
    try {
      if (live) {
        await unpublish(campaign.id).unwrap();
        toast.success("Moved back to draft");
      } else {
        await publish(campaign.id).unwrap();
        toast.success("Campaign is live");
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCampaign(campaign.id).unwrap();
      toast.success("Campaign deleted");
      onDeleted();
    } catch {
      toast.error("Failed to delete campaign");
    } finally {
      setConfirmDelete(false);
    }
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/campaign/${campaign.slug}`);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  const win = campaignWindow({
    startDate: fromDateTimeLocal(form.startDate) ?? null,
    endDate: fromDateTimeLocal(form.endDate) ?? null,
  });
  const publicVisible = live && (win === "ALWAYS" || win === "RUNNING");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Editor header */}
      <div
        style={{
          background: "#fff",
          border: `1.5px solid ${C.border}`,
          borderRadius: 14,
          padding: "14px 16px",
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to campaigns"
            className="lg:hidden"
            style={{ border: `1.5px solid ${C.border}`, background: "#fff", borderRadius: 9, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.textMuted }}
          >
            <ArrowLeft size={15} />
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.2px" }}>
                {saved.title}
              </h2>
              <StatusBadge status={campaign.status} />
              {dirty && (
                <span style={{ fontSize: 10, fontWeight: 700, color: C.warn, background: C.warnBg, borderRadius: 20, padding: "3px 9px" }}>
                  Unsaved changes
                </span>
              )}
            </div>
            <p style={{ fontSize: 11, color: C.textFaint, margin: "3px 0 0" }}>
              {publicVisible
                ? "Visible on the storefront"
                : live
                  ? "Published, but outside its date window — not shown on the storefront"
                  : "Draft — not shown on the storefront until published"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <SmallOutlineButton onClick={() => router.push(`/admin-dashboard/campaigns/${campaign.id}`)} icon={<Layers size={13} />}>
            Edit page blocks
          </SmallOutlineButton>
          <button
            type="button"
            onClick={togglePublish}
            disabled={publishing || unpublishing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 13px",
              borderRadius: 9,
              fontSize: 12,
              fontWeight: 700,
              cursor: publishing || unpublishing ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              border: `1.5px solid ${live ? C.successBorder : "transparent"}`,
              background: live ? C.successBg : GRADIENT,
              color: live ? C.success : "#fff",
            }}
          >
            {publishing || unpublishing ? <Loader2 size={13} className="animate-spin" /> : live ? <EyeOff size={13} /> : <Eye size={13} />}
            {live ? "Unpublish" : "Publish"}
          </button>
        </div>
      </div>

      {/* Details */}
      <SectionCard icon={<Type size={15} color={C.primary} />} title="Campaign details" subtitle="Name and public address" badge="required">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <FieldLabel required hint="Shown to admins and in banner pickers">
              Title
            </FieldLabel>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Mega T-shirt Fest"
              aria-invalid={!!errors.title}
              style={{ fontSize: 13, borderColor: errors.title ? "#FCA5A5" : undefined }}
            />
            <FieldError message={errors.title} />
          </div>
          <div>
            <FieldLabel hint="Set when the campaign was created; it does not change">Page URL</FieldLabel>
            <div style={{ display: "flex", gap: 6 }}>
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 10px",
                  height: 36,
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.panelBg,
                  fontSize: 12.5,
                  color: C.textMuted,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                /campaign/{campaign.slug}
              </div>
              <button type="button" onClick={copyUrl} aria-label="Copy page link" title="Copy link" style={iconBtn}>
                <Copy size={13} />
              </button>
              <a href={`/campaign/${campaign.slug}`} target="_blank" rel="noopener noreferrer" aria-label="Open page" title="Open page" style={iconBtn}>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Hero */}
      <SectionCard icon={<ImageIcon size={15} color={C.primary} />} title="Hero banner" subtitle="The large banner at the top of the campaign page" badge="optional">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <FieldLabel hint="Big text over the hero banner">Hero headline</FieldLabel>
              <Input value={form.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} placeholder="e.g. Up to 70% off" style={{ fontSize: 13 }} />
            </div>
            <div>
              <FieldLabel hint="Supporting line under the headline">Hero subtitle</FieldLabel>
              <Input value={form.heroSubtitle} onChange={(e) => set("heroSubtitle", e.target.value)} placeholder="e.g. This weekend only" style={{ fontSize: 13 }} />
            </div>
            <div>
              <FieldLabel hint="Recommended: wide image, under 2MB">Hero image</FieldLabel>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.primary,
                    background: C.primarySoft,
                    padding: "8px 14px",
                    borderRadius: 9,
                    cursor: uploading ? "wait" : "pointer",
                  }}
                >
                  {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  {form.heroImage ? "Replace image" : "Upload image"}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    style={{ display: "none" }}
                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                  />
                </label>
                {form.heroImage && (
                  <SmallOutlineButton onClick={() => set("heroImage", "")} icon={<X size={13} />}>
                    Remove
                  </SmallOutlineButton>
                )}
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div>
            <FieldLabel hint="How the top of the page will look">Preview</FieldLabel>
            <div
              style={{
                position: "relative",
                borderRadius: 12,
                overflow: "hidden",
                aspectRatio: "16 / 7",
                border: `1px solid ${C.border}`,
                background: form.heroImage ? `url(${form.heroImage}) center/cover` : GRADIENT,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(13,27,46,0.65), rgba(13,27,46,0.05) 70%)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: 14,
                  color: "#fff",
                }}
              >
                <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.2 }}>{form.heroTitle || form.title || "Campaign headline"}</div>
                {(form.heroSubtitle || !form.heroTitle) && (
                  <div style={{ fontSize: 11.5, opacity: 0.9, marginTop: 3 }}>{form.heroSubtitle || "Hero subtitle"}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Schedule */}
      <SectionCard icon={<CalendarClock size={15} color={C.primary} />} title="Schedule" subtitle="Optional date window — the storefront shows a live campaign only inside it" badge="optional">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(["startDate", "endDate"] as const).map((key) => (
            <div key={key}>
              <FieldLabel hint={key === "startDate" ? "Leave empty to start immediately" : "Leave empty to run with no end"}>
                {key === "startDate" ? "Starts" : "Ends"}
              </FieldLabel>
              <div style={{ display: "flex", gap: 6 }}>
                <Input
                  type="datetime-local"
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  aria-invalid={!!errors[key]}
                  style={{ fontSize: 13, borderColor: errors[key] ? "#FCA5A5" : undefined }}
                />
                {form[key] && (
                  <button type="button" onClick={() => set(key, "")} aria-label={`Clear ${key === "startDate" ? "start" : "end"} date`} title="Clear" style={iconBtn}>
                    <X size={13} />
                  </button>
                )}
              </div>
              <FieldError message={errors[key]} />
            </div>
          ))}
        </div>
        <p style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: C.textFaint, margin: "10px 0 0" }}>
          <Calendar size={11} /> Times are in your local time zone. Window now: <b style={{ color: WINDOW_META[win].fg }}>{WINDOW_META[win].label}</b>
        </p>
      </SectionCard>

      {/* Blocks */}
      <SectionCard icon={<Layers size={15} color={C.primary} />} title="Page blocks" subtitle="Banners, product grids and countdowns shown below the hero">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <p style={{ fontSize: 12.5, color: C.textMuted, margin: 0 }}>
            <b style={{ color: C.text }}>{campaign._count?.components ?? 0}</b> block{(campaign._count?.components ?? 0) === 1 ? "" : "s"} on this page
          </p>
          <OutlineButton onClick={() => router.push(`/admin-dashboard/campaigns/${campaign.id}`)} icon={<Layers size={14} />}>
            Open block builder
          </OutlineButton>
        </div>
      </SectionCard>

      {/* Danger zone */}
      <div style={{ background: "#fff", border: `1.5px solid ${C.dangerBorder}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: C.danger }}>
            <AlertTriangle size={14} /> Delete campaign
          </div>
          <p style={{ fontSize: 11, color: C.textFaint, margin: "3px 0 0" }}>Removes the page and all of its blocks. Banners linking to it will lead nowhere.</p>
        </div>
        {confirmDelete ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: C.danger }}>Delete permanently?</span>
            <button type="button" onClick={handleDelete} disabled={deleting} style={{ ...pillBtn, background: C.danger, color: "#fff", border: "none" }}>
              {deleting ? "Deleting…" : "Delete"}
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} disabled={deleting} style={pillBtn}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmDelete(true)} style={{ ...pillBtn, color: C.danger, borderColor: C.dangerBorder }}>
            <Trash2 size={13} /> Delete
          </button>
        )}
      </div>

      {/* Save bar */}
      <div
        className="sticky bottom-0 z-10"
        style={{
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(6px)",
          border: `1.5px solid ${dirty ? "#C7D9F7" : C.border}`,
          borderRadius: 14,
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
          boxShadow: dirty ? "0 -6px 20px rgba(29,78,216,0.08)" : "none",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: dirty ? C.warn : C.textFaint, fontWeight: 600 }}>
          {dirty ? "You have unsaved changes" : <><Check size={13} color={C.success} /> All changes saved</>}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <OutlineButton onClick={handleDiscard} disabled={!dirty || saving} icon={<RotateCcw size={14} />}>
            Discard
          </OutlineButton>
          <GradientButton onClick={handleSave} isLoading={saving} disabled={!dirty} icon={<Save size={15} />}>
            Save changes
          </GradientButton>
        </div>
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  width: 36,
  height: 36,
  flexShrink: 0,
  borderRadius: 8,
  border: `1px solid ${C.border}`,
  background: "#fff",
  color: C.textMuted,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const pillBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: 11.5,
  fontWeight: 700,
  color: C.textMuted,
  background: "#fff",
  border: `1.5px solid ${C.border}`,
  borderRadius: 8,
  padding: "6px 12px",
  cursor: "pointer",
  fontFamily: "inherit",
};

/* ─── Create dialog ──────────────────────────────────────────────────────── */

function CreateCampaignDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (c: CampaignPage) => void }) {
  const [createCampaign, { isLoading: creating }] = useCreateCampaignMutation();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!title.trim()) {
      setError("Campaign title is required");
      return;
    }
    try {
      const campaign = await createCampaign({ title: title.trim() }).unwrap();
      toast.success("Campaign created — add a hero banner and page blocks");
      onCreated(campaign);
    } catch {
      toast.error("Failed to create campaign");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="New campaign"
      style={{ position: "fixed", inset: 0, background: "rgba(13,27,46,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440 }}>
        <SectionCard icon={<Megaphone size={15} color={C.primary} />} title="New campaign" subtitle="The page URL is generated from the title" badge="required">
          <FieldLabel required>Title</FieldLabel>
          <Input
            autoFocus
            placeholder="e.g. Mega T-shirt Fest"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            style={{ fontSize: 13 }}
          />
          <FieldError message={error} />
          <p style={{ fontSize: 10.5, color: C.textFainter, marginTop: 8 }}>
            It starts as a draft. Add the hero banner, dates and page blocks next, then publish.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
            <OutlineButton onClick={onClose} disabled={creating}>
              Cancel
            </OutlineButton>
            <GradientButton onClick={submit} isLoading={creating} icon={<Plus size={15} />}>
              Create campaign
            </GradientButton>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

const FILTERS: { value: CampaignStatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PUBLISHED", label: "Live" },
  { value: "DRAFT", label: "Drafts" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "ARCHIVED", label: "Archived" },
];

export default function CampaignsPage() {
  // Marketing Center: ADMIN gets the vendor tabs next to Details; admin-side
  // staff with marketingManagement get only the vendor tabs (StaffCampaignsView).
  // The ADMIN-only list waits for the role, so staff never request it.
  const { role, can, isLoading: permsLoading } = usePermissions();
  const staffView = role === "EMPLOYEE" && can("marketingManagement");
  const { data: campaigns, isLoading: listLoading, isError, refetch } = useListCampaignsQuery(undefined, { skip: staffView || permsLoading });
  const isLoading = listLoading || permsLoading;
  const programmes = useProgrammeSummaries(role === "ADMIN");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CampaignStatusFilter>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const dirtyRef = useRef(false);

  const list = useMemo(() => campaigns ?? [], [campaigns]);
  const stats = campaignStats(list);
  const visible = filterCampaigns(list, query, status);
  const selected = list.find((c) => c.id === selectedId) ?? null;
  // Only offer status filters that exist (plus All / Live / Drafts).
  const filters = FILTERS.filter((f) => f.value === "ALL" || f.value === "PUBLISHED" || f.value === "DRAFT" || list.some((c) => c.status === f.value));

  // Deleted elsewhere / no longer in the list → close the editor.
  useEffect(() => {
    if (selectedId && campaigns && !campaigns.some((c) => c.id === selectedId)) setSelectedId(null);
  }, [campaigns, selectedId]);

  const confirmLeave = () => !dirtyRef.current || window.confirm("Discard your unsaved changes to this campaign?");

  const select = (id: string | null) => {
    if (id === selectedId) return;
    if (!confirmLeave()) return;
    dirtyRef.current = false;
    setSelectedId(id);
  };

  if (staffView) return <StaffCampaignsView />;

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: C.pageBg, minHeight: "100vh" }} className="px-3 py-5 sm:px-4 sm:py-6">
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: GRADIENT, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(124,58,237,0.25)" }}>
              <Megaphone size={18} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: "-0.3px", margin: 0 }}>Campaign Pages</h1>
              <p style={{ fontSize: 11.5, color: C.textFaint, margin: 0 }}>Landing pages a homepage banner can link to — flash sales, brand events and more</p>
            </div>
          </div>
          <GradientButton onClick={() => confirmLeave() && setShowCreate(true)} icon={<Plus size={15} />}>
            New campaign
          </GradientButton>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Total", value: stats.total, fg: C.text },
            { label: "Live", value: stats.live, fg: C.success },
            { label: "Drafts", value: stats.draft, fg: C.textMuted },
            { label: "Scheduled / Archived", value: stats.scheduled + stats.archived, fg: C.warn },
          ].map((s) => (
            <div key={s.label} style={{ background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "10px 14px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.fg, marginTop: 2 }}>{isLoading ? "—" : s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
          {/* List */}
          <div className={selected ? "hidden lg:block" : "block"}>
            <SectionCard icon={<Layers size={15} color={C.primary} />} title="Campaigns" subtitle={`${visible.length} of ${list.length} shown`}>
              <div style={{ position: "relative", marginBottom: 10 }}>
                <Search size={14} color="#94A3B8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <Input placeholder="Search by title or URL…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ paddingLeft: 32, fontSize: 13 }} aria-label="Search campaigns" />
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {filters.map((f) => {
                  const active = status === f.value;
                  return (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setStatus(f.value)}
                      aria-pressed={active}
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: "5px 11px",
                        borderRadius: 20,
                        border: `1.5px solid ${active ? C.primary : C.border}`,
                        background: active ? C.primarySoft : "#fff",
                        color: active ? C.primary : C.textMuted,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              {isLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} style={{ height: 64, borderRadius: 12, background: C.borderSoft }} className="animate-pulse" />
                  ))}
                </div>
              ) : isError ? (
                <div style={{ textAlign: "center", padding: "24px 8px" }}>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: C.danger, margin: 0 }}>Couldn&apos;t load campaigns</p>
                  <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
                    <SmallOutlineButton onClick={() => refetch()} icon={<RotateCcw size={13} />}>
                      Try again
                    </SmallOutlineButton>
                  </div>
                </div>
              ) : !list.length ? (
                <div style={{ textAlign: "center", padding: "28px 8px" }}>
                  <Megaphone size={26} color="#B4C0D0" style={{ margin: "0 auto 8px" }} />
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: C.textMuted, margin: 0 }}>No campaigns yet</p>
                  <p style={{ fontSize: 11, color: C.textFaint, marginTop: 4 }}>Create one, then link a homepage banner to it</p>
                </div>
              ) : !visible.length ? (
                <p style={{ fontSize: 12, color: C.textFaint, textAlign: "center", padding: "20px 8px", margin: 0 }}>No campaigns match your search</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "70vh", overflowY: "auto", paddingRight: 2 }}>
                  {visible.map((c) => (
                    <CampaignListItem key={c.id} campaign={c} selected={c.id === selectedId} onSelect={() => select(c.id)} programme={programmes.get(c.id)} />
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Editor */}
          <div className={selected ? "block" : "hidden lg:block"}>
            {selected ? (
              <CampaignProgrammeTabs
                pageId={selected.id}
                details={
                  <CampaignEditor
                    key={selected.id}
                    campaign={selected}
                    onBack={() => select(null)}
                    onDeleted={() => {
                      dirtyRef.current = false;
                      setSelectedId(null);
                    }}
                    onDirtyChange={(d) => {
                      dirtyRef.current = d;
                    }}
                  />
                }
              />
            ) : (
              <div style={{ background: "#fff", border: `1.5px dashed ${C.border}`, borderRadius: 14, padding: "56px 16px", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, margin: "0 auto 12px", borderRadius: 14, background: C.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Megaphone size={22} color={C.primary} />
                </div>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: C.textMuted, margin: 0 }}>Select a campaign to edit it</p>
                <p style={{ fontSize: 11.5, color: C.textFaint, marginTop: 4 }}>Or create a new one to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreate && (
        <CreateCampaignDialog
          onClose={() => setShowCreate(false)}
          onCreated={(c) => {
            setShowCreate(false);
            setStatus("ALL");
            setQuery("");
            dirtyRef.current = false;
            setSelectedId(c.id);
          }}
        />
      )}
    </div>
  );
}
