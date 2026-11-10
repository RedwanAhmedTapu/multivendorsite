"use client";

import React, { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useGetSlidersQuery,
  useCreateSliderMutation,
  useUpdateSliderMutation,
  useDeleteSliderMutation,
  Slider,
} from "@/features/sliderApi";
import { sliderAutoLink, sliderPayloadFromForm, sliderToForm } from "@/lib/slider/slider-form";
import { useGetVendorsQuery } from "@/features/vendorManageApi";
import { useListCampaignsQuery } from "@/features/campaignPageApi";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Trash2,
  Upload,
  Image as ImageIcon,
  Plus,
  Type,
  Link2,
  Store,
  LayoutGrid,
  AlertCircle,
  X,
  Check,
  Sparkles,
  ExternalLink,
  Megaphone,
  Pencil,
  Save,
  RotateCcw,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
 * Design language matches AddProductForm/VariantManager exactly: same
 * blue→purple gradient primary action, same neutral palette, same card
 * shell — so this screen feels like part of the same product, not a
 * bolted-on admin table.
 * ────────────────────────────────────────────────────────────────────── */

const PALETTE = {
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
  purple: "#7C3AED",
};

/* Inject keyframes once — same pattern AddProductForm uses for its error glow. */
if (typeof document !== "undefined" && !document.getElementById("fm-slider-anim-style")) {
  const s = document.createElement("style");
  s.id = "fm-slider-anim-style";
  s.textContent = `
    @keyframes fm-fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fm-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fm-pop { 0% { opacity:0; transform: scale(0.92); } 100% { opacity:1; transform: scale(1); } }
    @keyframes fm-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
    @keyframes fm-pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(29,78,216,0.28); } 100% { box-shadow: 0 0 0 8px rgba(29,78,216,0); } }
    .fm-slider-card { animation: fm-fade-up 0.45s cubic-bezier(0.22,1,0.36,1) both; }
    .fm-shimmer { background: linear-gradient(90deg, #F0F4FA 0%, #E5EAF2 50%, #F0F4FA 100%); background-size: 800px 100%; animation: fm-shimmer 1.4s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
}

/* ─── Section Card Shell (same visual contract as AddProductForm) ───────── */

function SectionCard({
  icon,
  title,
  subtitle,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: "required" | "optional";
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1.5px solid ${PALETTE.border}`,
        borderRadius: 14,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          borderBottom: `1px solid ${PALETTE.borderSoft}`,
          background: PALETTE.panelBg,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: PALETTE.iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: PALETTE.text, letterSpacing: "-0.2px" }}>
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 11, color: PALETTE.textFaint, marginTop: 1 }}>{subtitle}</div>
            )}
          </div>
        </div>
        {badge && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "2px 9px",
              borderRadius: 20,
              background: badge === "required" ? PALETTE.dangerBg : PALETTE.successBg,
              color: badge === "required" ? PALETTE.danger : PALETTE.success,
              border: `1px solid ${badge === "required" ? PALETTE.dangerBorder : PALETTE.successBorder}`,
            }}
          >
            {badge === "required" ? "Required" : "Optional"}
          </span>
        )}
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}

/* ─── Field Label ────────────────────────────────────────────────────────── */

function FieldLabel({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div style={{ marginBottom: 6 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: PALETTE.textMuted,
          letterSpacing: "0.01em",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {children}
        {required && <span style={{ color: PALETTE.danger, fontWeight: 800 }}>*</span>}
      </label>
      {hint && <p style={{ fontSize: 10.5, color: PALETTE.textFainter, marginTop: 2 }}>{hint}</p>}
    </div>
  );
}

/* ─── Gradient primary button — same hover/press physics as AddProductForm ── */

function GradientButton({
  onClick,
  children,
  disabled,
  icon,
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        padding: "11px 28px",
        borderRadius: 11,
        border: "none",
        width: "100%",
        background: disabled
          ? "#CBD5E1"
          : hovered
            ? "linear-gradient(135deg,#2563EB,#8B5CF6)"
            : "linear-gradient(135deg,#1D4ED8,#7C3AED)",
        color: "#fff",
        fontSize: 13.5,
        fontWeight: 700,
        letterSpacing: "0.01em",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        boxShadow: disabled
          ? "none"
          : hovered
            ? "0 10px 24px rgba(124,58,237,0.35), 0 2px 6px rgba(29,78,216,0.25)"
            : "0 4px 14px rgba(124,58,237,0.25)",
        transform: pressed ? "scale(0.98)" : hovered ? "translateY(-1px)" : "translateY(0)",
        transition: "all 0.18s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {icon}
      {children}
    </button>
  );
}

/* ─── Type badge (pill) ──────────────────────────────────────────────────── */

function TypeBadge({ type }: { type: "HOMEPAGE" | "VENDORPAGE" }) {
  const homepage = type === "HOMEPAGE";
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        padding: "3px 9px",
        borderRadius: 20,
        background: homepage ? "#EEF3FB" : "#F5F0FE",
        color: homepage ? PALETTE.primary : PALETTE.purple,
        border: `1px solid ${homepage ? "#C7D9F7" : "#E1D2FB"}`,
      }}
    >
      {homepage ? "Homepage" : "Vendor Page"}
    </span>
  );
}

const SliderAdmin: React.FC = () => {
  const { data: sliders, isLoading, error } = useGetSlidersQuery();
  const [createSlider, { isLoading: creating }] = useCreateSliderMutation();
  const [updateSlider, { isLoading: updating }] = useUpdateSliderMutation();
  const [deleteSlider] = useDeleteSliderMutation();

  // Edit mode: the saved banner being edited (null = creating a new one).
  const [editingSlider, setEditingSlider] = useState<Slider | null>(null);
  const formTopRef = useRef<HTMLDivElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonLink, setButtonLink] = useState("");
  const [type, setType] = useState<"HOMEPAGE" | "VENDORPAGE">("HOMEPAGE");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Vendor tagging — e.g. a HOMEPAGE slide promoting a specific vendor.
  // Clicking that slide on the homepage will take shoppers straight to
  // that vendor's storefront (/store/{vendorId}).
  const [vendorId, setVendorId] = useState<string>("");
  const [vendorSearch, setVendorSearch] = useState("");
  const { data: vendorResults, isFetching: vendorsLoading } = useGetVendorsQuery({
    search: vendorSearch || undefined,
    status: "ACTIVE",
    page: 1,
    limit: 20,
  });
  const vendorOptions = vendorResults?.data ?? [];
  const selectedVendor = vendorOptions.find((v) => v.id === vendorId);

  // Campaign tagging — same idea as vendor tagging above, but for a
  // dedicated landing page (banner + curated products) built in
  // Campaign Pages. Selecting one clears the vendor pick, and vice versa
  // — a slide links to one destination at a time.
  const [campaignId, setCampaignId] = useState<string>("");
  const { data: campaigns } = useListCampaignsQuery();
  const selectedCampaign = campaigns?.find((c) => c.id === campaignId);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const applyFile = (f: File | null) => {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) applyFile(f);
  }, []);

  const autoLink = sliderAutoLink(vendorId, campaignId ? selectedCampaign?.slug : undefined);

  // The server can change a banner's vendor but cannot remove it (update
  // ignores an empty vendorId), so an edited vendor banner stays tagged.
  const lockedVendorId = editingSlider?.vendorId ?? "";
  const editingVendorName = lockedVendorId && vendorId === lockedVendorId ? editingSlider?.vendor?.storeName : undefined;
  const isEditing = editingSlider !== null;
  const saving = creating || updating;
  // A newly chosen file wins; otherwise an edited banner shows its current image.
  const shownImage = preview ?? (editingSlider ? editingSlider.imageUrl : null);

  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setDescription("");
    setButtonText("");
    setButtonLink("");
    setType("HOMEPAGE");
    setVendorId("");
    setVendorSearch("");
    setCampaignId("");
    applyFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /** Edit: prefill the form with the saved banner (its current image stays until replaced). */
  const startEdit = (slider: Slider) => {
    const f = sliderToForm(slider, campaigns ?? []);
    setEditingSlider(slider);
    setTitle(f.title);
    setSubtitle(f.subtitle);
    setDescription(f.description);
    setButtonText(f.buttonText);
    setButtonLink(f.buttonLink);
    setType(f.type);
    setVendorId(f.vendorId);
    setVendorSearch("");
    setCampaignId(f.campaignId);
    applyFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setConfirmDeleteId(null);
    formTopRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };

  const cancelEdit = () => {
    setEditingSlider(null);
    resetForm();
  };

  const handleSubmit = async () => {
    const form = { title, subtitle, description, buttonText, buttonLink, type, vendorId, campaignId };
    const payload = sliderPayloadFromForm(form, campaignId ? selectedCampaign?.slug : undefined, file);

    if (editingSlider) {
      try {
        // Real update endpoint (PUT /sliders/:id) — the image is sent only
        // when a new one was chosen, so the current image is preserved.
        await updateSlider({ id: editingSlider.id, ...payload }).unwrap();
        toast.success("Banner updated");
        // invalidatesTags("Slider") refetches the list; leave edit mode.
        setEditingSlider(null);
        resetForm();
      } catch (err) {
        console.error("UpdateSlider error:", err);
        toast.error("Failed to update banner. Please try again.");
      }
      return;
    }

    if (!file) {
      toast.error("Slider image is required");
      return;
    }

    try {
      await createSlider({ ...payload, type, image: file }).unwrap();
      toast.success("Slider created successfully");
      resetForm();
    } catch (err) {
      console.error("CreateSlider error:", err);
      toast.error("Failed to create slider. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteSlider(id).unwrap();
      toast.success("Slider deleted");
      if (editingSlider?.id === id) cancelEdit();
    } catch (err) {
      console.error("DeleteSlider error:", err);
      toast.error("Failed to delete slider.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        background: PALETTE.pageBg,
        minHeight: "100vh",
        padding: "24px 16px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* ── Page heading ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            animation: "fm-fade-up 0.4s ease both",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: "linear-gradient(135deg,#1D4ED8,#7C3AED)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(124,58,237,0.25)",
            }}
          >
            <LayoutGrid size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: PALETTE.text, letterSpacing: "-0.3px", margin: 0 }}>
              Homepage Sliders
            </h1>
            <p style={{ fontSize: 11.5, color: PALETTE.textFaint, margin: 0 }}>
              Create promotional slides and link them straight to a vendor&apos;s store
            </p>
          </div>
        </div>

        {/* ════ CREATE / EDIT FORM ════ */}
        <div ref={formTopRef} style={{ display: "flex", flexDirection: "column", gap: 14, scrollMarginTop: 16 }}>
          <SectionCard
            icon={isEditing ? <Pencil size={15} color={PALETTE.primary} /> : <Sparkles size={15} color={PALETTE.primary} />}
            title={isEditing ? "Edit Banner" : "Create New Slider"}
            subtitle={
              isEditing
                ? `Editing "${editingSlider?.title || "Untitled banner"}" — change any field, then save`
                : "Fill in the details below and upload a banner image"
            }
            badge="required"
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
              {/* ── Left column ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <FieldLabel hint="Small label shown above the headline">Title</FieldLabel>
                  <div style={{ position: "relative" }}>
                    <Type size={14} color="#94A3B8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    <Input
                      placeholder="e.g. Mega Discount Week"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      style={{ paddingLeft: 32, fontSize: 13 }}
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel hint="Bold headline shown on the slide">Subtitle</FieldLabel>
                  <Input
                    placeholder="e.g. Up to 50% off electronics"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    style={{ fontSize: 13 }}
                  />
                </div>

                <div>
                  <FieldLabel hint="Short supporting line under the subtitle">Description</FieldLabel>
                  <Input
                    placeholder="e.g. Limited time offer, ends Friday"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ fontSize: 13 }}
                  />
                </div>

                <div>
                  <FieldLabel hint="Text shown on the call-to-action button">Button Text</FieldLabel>
                  <Input
                    placeholder="e.g. Shop Now"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    style={{ fontSize: 13 }}
                  />
                </div>
              </div>

              {/* ── Right column ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <FieldLabel hint="Where clicking the slide should go">Button Link</FieldLabel>
                  <div style={{ position: "relative" }}>
                    <Link2 size={14} color="#94A3B8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    <Input
                      placeholder={autoLink ? `${autoLink} (auto — selected below)` : "/category/electronics"}
                      value={buttonLink}
                      onChange={(e) => setButtonLink(e.target.value)}
                      style={{
                        paddingLeft: 32,
                        fontSize: 13,
                        borderColor: autoLink && !buttonLink ? "#6EE7B7" : undefined,
                      }}
                    />
                  </div>
                  {autoLink && !buttonLink && (
                    <p style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: PALETTE.success, marginTop: 5 }}>
                      <Check size={11} /> Left empty — auto-links to {autoLink}
                    </p>
                  )}
                </div>

                <div>
                  <FieldLabel hint="Clicking the slide sends shoppers to this vendor's store">
                    Link to a Vendor&apos;s Store
                  </FieldLabel>
                  <Select
                    value={vendorId || "none"}
                    onValueChange={(val) => {
                      setVendorId(val === "none" ? "" : val);
                      if (val !== "none") setCampaignId(""); // a slide links to one destination at a time
                    }}
                  >
                    <SelectTrigger style={{ borderColor: PALETTE.border }}>
                      <SelectValue placeholder="Search & select a vendor">
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                          <Store size={13} color={selectedVendor || editingVendorName ? PALETTE.primary : "#94A3B8"} />
                          {selectedVendor ? selectedVendor.storeName : editingVendorName ?? (vendorId ? "Selected vendor" : "No vendor (generic slide)")}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <div style={{ padding: 8 }}>
                        <Input
                          placeholder="Search vendor by store name..."
                          value={vendorSearch}
                          onChange={(e) => setVendorSearch(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          style={{ height: 32, fontSize: 12.5 }}
                        />
                      </div>
                      <SelectItem value="none" disabled={!!lockedVendorId}>
                        No vendor (generic slide)
                      </SelectItem>
                      {vendorsLoading && (
                        <div style={{ padding: "8px 12px", fontSize: 11.5, color: PALETTE.textFainter }}>Searching…</div>
                      )}
                      {/* The edited banner's own vendor, even when it is not in the current search page. */}
                      {lockedVendorId && !vendorOptions.some((v) => v.id === lockedVendorId) && (
                        <SelectItem value={lockedVendorId}>
                          {editingSlider?.vendor?.storeName ?? "Current vendor"}
                        </SelectItem>
                      )}
                      {vendorOptions.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.storeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {lockedVendorId && (
                    <p style={{ fontSize: 10.5, color: PALETTE.textFaint, marginTop: 5 }}>
                      This banner is linked to a vendor. You can switch to another vendor; removing the vendor link
                      isn&apos;t supported yet — delete and recreate the banner for a generic slide.
                    </p>
                  )}
                </div>

                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: 0, right: 0, top: -7, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 1, background: PALETTE.border }} />
                    <span style={{ fontSize: 9.5, fontWeight: 800, color: PALETTE.textFainter, letterSpacing: "0.06em" }}>OR</span>
                    <div style={{ flex: 1, height: 1, background: PALETTE.border }} />
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <FieldLabel hint="Clicking the slide opens this campaign landing page (banner + curated products)">
                      Link to a Campaign Page
                    </FieldLabel>
                    <Select
                      value={campaignId || "none"}
                      disabled={!!lockedVendorId}
                      onValueChange={(val) => {
                        setCampaignId(val === "none" ? "" : val);
                        if (val !== "none") setVendorId(""); // mutually exclusive with vendor
                      }}
                    >
                      <SelectTrigger style={{ borderColor: PALETTE.border }}>
                        <SelectValue placeholder="Select a campaign">
                          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                            <Megaphone size={13} color={selectedCampaign ? PALETTE.purple : "#94A3B8"} />
                            {selectedCampaign ? selectedCampaign.title : "No campaign (generic slide)"}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No campaign (generic slide)</SelectItem>
                        {(campaigns ?? []).map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {c.title}
                              {c.status !== "PUBLISHED" && (
                                <span style={{ fontSize: 9.5, fontWeight: 700, color: PALETTE.textFainter, background: PALETTE.borderSoft, borderRadius: 6, padding: "1px 5px" }}>
                                  {c.status}
                                </span>
                              )}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {campaignId && selectedCampaign?.status !== "PUBLISHED" && (
                      <p style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "#B45309", marginTop: 5 }}>
                        This campaign isn&apos;t published yet — publish it before the slide goes live.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <FieldLabel>Slider Type</FieldLabel>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {(["HOMEPAGE", "VENDORPAGE"] as const).map((t) => {
                      const active = type === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setType(t)}
                          style={{
                            padding: "9px 10px",
                            borderRadius: 10,
                            border: `1.5px solid ${active ? PALETTE.primary : PALETTE.border}`,
                            background: active ? PALETTE.primarySoft : "#fff",
                            color: active ? PALETTE.primary : PALETTE.textMuted,
                            fontSize: 12.5,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {t === "HOMEPAGE" ? "Homepage" : "Vendor Page"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Image upload (drag & drop) ── */}
            <div style={{ marginTop: 16 }}>
              <FieldLabel
                required={!isEditing}
                hint={
                  isEditing
                    ? "The current image is kept unless you choose a new one"
                    : "Recommended: 1600×600px, under 2MB"
                }
              >
                Slider Image
              </FieldLabel>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: "relative",
                  border: `1.5px dashed ${dragActive ? PALETTE.primary : shownImage ? "#6EE7B7" : PALETTE.border}`,
                  borderRadius: 12,
                  background: dragActive ? PALETTE.primarySoft : shownImage ? "#F0FDF4" : PALETTE.panelBg,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  overflow: "hidden",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => applyFile(e.target.files?.[0] || null)}
                  style={{ display: "none" }}
                />
                {shownImage ? (
                  <div style={{ position: "relative", animation: "fm-pop 0.3s ease both" }}>
                    <img
                      src={shownImage}
                      alt="Preview"
                      style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent 50%)",
                        display: "flex",
                        alignItems: "flex-end",
                        padding: 12,
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", fontSize: 12, fontWeight: 600 }}>
                        <Check size={13} /> {file ? file.name : "Current image (kept) — click to replace"}
                      </span>
                    </div>
                    {file && (
                    <button
                      type="button"
                      title={isEditing ? "Keep the current image" : "Remove image"}
                      onClick={(e) => {
                        e.stopPropagation();
                        applyFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        width: 26,
                        height: 26,
                        borderRadius: 8,
                        border: "none",
                        background: "rgba(15,23,42,0.6)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      <X size={13} />
                    </button>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "32px 16px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: dragActive ? "#DBEAFE" : PALETTE.iconBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                        animation: dragActive ? "fm-pulse-ring 1.1s ease-out infinite" : undefined,
                      }}
                    >
                      <Upload size={18} color={PALETTE.primary} />
                    </div>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: PALETTE.textMuted, margin: 0 }}>
                      {dragActive ? "Drop the image here" : "Click to upload or drag & drop"}
                    </p>
                    <p style={{ fontSize: 10.5, color: PALETTE.textFainter, margin: 0 }}>PNG or JPG</p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              {isEditing ? (
                <>
                  <GradientButton onClick={handleSubmit} disabled={saving} icon={<Save size={16} />}>
                    {updating ? "Saving…" : "Save Changes"}
                  </GradientButton>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={saving}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "11px 18px",
                      borderRadius: 11,
                      border: `1.5px solid ${PALETTE.border}`,
                      background: "#fff",
                      color: PALETTE.textMuted,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: saving ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <RotateCcw size={14} /> Cancel
                  </button>
                </>
              ) : (
                <GradientButton onClick={handleSubmit} disabled={saving} icon={<Plus size={16} />}>
                  {creating ? "Creating…" : "Create Slider"}
                </GradientButton>
              )}
            </div>
          </SectionCard>

          {/* ════ SLIDERS LIST ════ */}
          <SectionCard
            icon={<ImageIcon size={15} color={PALETTE.primary} />}
            title="All Sliders"
            subtitle={`${sliders?.length ?? 0} slide${sliders?.length === 1 ? "" : "s"} currently live`}
          >
            {isLoading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="fm-shimmer" style={{ height: 190, borderRadius: 12 }} />
                ))}
              </div>
            ) : error ? (
              <div style={{ textAlign: "center", padding: "40px 12px" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    margin: "0 auto 12px",
                    borderRadius: 14,
                    background: PALETTE.dangerBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AlertCircle size={22} color={PALETTE.danger} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: PALETTE.danger, margin: 0 }}>Failed to load sliders</p>
                <p style={{ fontSize: 11.5, color: PALETTE.textFaint, marginTop: 4 }}>Please try refreshing the page</p>
              </div>
            ) : !sliders?.length ? (
              <div style={{ textAlign: "center", padding: "40px 12px" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    margin: "0 auto 12px",
                    borderRadius: 14,
                    background: PALETTE.iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ImageIcon size={22} color="#94A3B8" />
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: PALETTE.textMuted, margin: 0 }}>No sliders yet</p>
                <p style={{ fontSize: 11.5, color: PALETTE.textFaint, marginTop: 4 }}>Create your first slider above</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                {sliders.map((slider: Slider, index) => (
                  <div
                    key={slider.id}
                    className="fm-slider-card"
                    style={{
                      animationDelay: `${index * 45}ms`,
                      border: `1.5px solid ${editingSlider?.id === slider.id ? PALETTE.primary : PALETTE.border}`,
                      borderRadius: 13,
                      overflow: "hidden",
                      background: "#fff",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-3px)";
                      e.currentTarget.style.boxShadow = "0 12px 24px rgba(29,78,216,0.12)";
                      e.currentTarget.style.borderColor = "#C7D9F7";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.borderColor = editingSlider?.id === slider.id ? PALETTE.primary : PALETTE.border;
                    }}
                  >
                    <div style={{ position: "relative", aspectRatio: "16/8" }}>
                      <img
                        src={slider.imageUrl}
                        alt={slider.title || "Slider"}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                      <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 6, alignItems: "center" }}>
                        <TypeBadge type={slider.type} />
                        {editingSlider?.id === slider.id && (
                          <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.05em", color: "#fff", background: PALETTE.primary, borderRadius: 20, padding: "2px 8px" }}>
                            EDITING
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        aria-label="Edit banner"
                        title="Edit banner"
                        onClick={() => startEdit(slider)}
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 42,
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          border: "none",
                          background: "rgba(15,23,42,0.55)",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          backdropFilter: "blur(4px)",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = PALETTE.primary)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(15,23,42,0.55)")}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete banner"
                        onClick={() => setConfirmDeleteId(slider.id)}
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          border: "none",
                          background: "rgba(15,23,42,0.55)",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          backdropFilter: "blur(4px)",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = PALETTE.danger)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(15,23,42,0.55)")}
                      >
                        <Trash2 size={13} />
                      </button>

                      {/* Inline animated delete-confirm overlay */}
                      {confirmDeleteId === slider.id && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(13,27,46,0.72)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 10,
                            animation: "fm-fade-in 0.15s ease both",
                          }}
                        >
                          <p style={{ color: "#fff", fontSize: 12.5, fontWeight: 700, margin: 0, animation: "fm-pop 0.2s ease both" }}>
                            Delete this slider?
                          </p>
                          <div style={{ display: "flex", gap: 8, animation: "fm-pop 0.22s ease both" }}>
                            <button
                              type="button"
                              onClick={() => handleDelete(slider.id)}
                              disabled={deletingId === slider.id}
                              style={{
                                padding: "6px 14px",
                                borderRadius: 8,
                                border: "none",
                                background: PALETTE.danger,
                                color: "#fff",
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: "pointer",
                                fontFamily: "inherit",
                              }}
                            >
                              {deletingId === slider.id ? "Deleting…" : "Delete"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              style={{
                                padding: "6px 14px",
                                borderRadius: 8,
                                border: "1px solid rgba(255,255,255,0.4)",
                                background: "transparent",
                                color: "#fff",
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: "pointer",
                                fontFamily: "inherit",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ padding: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: PALETTE.text, marginBottom: 2 }}>
                        {slider.title || <span style={{ color: "#B4C0D0", fontWeight: 500 }}>No title</span>}
                      </div>
                      {slider.subtitle && (
                        <div style={{ fontSize: 11.5, color: PALETTE.textFaint, marginBottom: 6 }}>{slider.subtitle}</div>
                      )}

                      {slider.vendor && (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: PALETTE.purple,
                            background: "#F5F0FE",
                            border: "1px solid #E1D2FB",
                            borderRadius: 20,
                            padding: "2px 8px",
                            marginBottom: 6,
                          }}
                        >
                          <Store size={10} /> {slider.vendor.storeName}
                        </div>
                      )}

                      {slider.buttonLink && (
                        <a
                          href={slider.buttonLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            color: PALETTE.primary,
                            marginTop: 4,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <ExternalLink size={11} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{slider.buttonLink}</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default SliderAdmin;