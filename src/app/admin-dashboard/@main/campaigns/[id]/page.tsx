"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useGetCampaignByIdQuery,
  useUpdateCampaignMutation,
  usePublishCampaignMutation,
  useUnpublishCampaignMutation,
  useAddComponentMutation,
  useUpdateComponentMutation,
  useDeleteComponentMutation,
  useReorderComponentsMutation,
  useSetComponentProductsMutation,
  useUploadCampaignImageMutation,
  type ComponentType,
  type CampaignComponent,
} from "@/features/campaignPageApi";
import { useGetAllProductsQuery } from "@/features/productapi/adminProductApi";
import { buildCampaignUpdate, campaignToForm, toDateTimeLocal, validateCampaignForm } from "@/lib/campaign/campaign-editor";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Image as ImageIcon,
  Grid3x3,
  Timer,
  Ticket,
  LayoutGrid,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Upload,
  Search,
  Check,
  X,
  Loader2,
} from "lucide-react";

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
  success: "#16A34A",
  successBg: "#F0F9F0",
  successBorder: "#BBF7D0",
  purple: "#7C3AED",
};

const COMPONENT_TYPES: { type: ComponentType; label: string; icon: React.ReactNode; hint: string }[] = [
  { type: "BANNER", label: "Banner", icon: <ImageIcon size={16} />, hint: "Full-width image block" },
  { type: "PRODUCT_GRID", label: "Product Grid", icon: <Grid3x3 size={16} />, hint: "Curated products in a grid" },
  { type: "PRODUCT_CAROUSEL", label: "Product Carousel", icon: <Grid3x3 size={16} />, hint: "Scrollable product row" },
  { type: "FEATURED_PRODUCTS", label: "Featured Products", icon: <Grid3x3 size={16} />, hint: "Highlighted product picks" },
  { type: "COUNTDOWN_TIMER", label: "Countdown Timer", icon: <Timer size={16} />, hint: "Flash-sale style countdown" },
  { type: "VOUCHER_PROMOTION", label: "Voucher Promo", icon: <Ticket size={16} />, hint: "Coupon/voucher banner" },
  { type: "CATEGORY_GRID", label: "Category Grid", icon: <LayoutGrid size={16} />, hint: "Category shortcuts" },
];

const PRODUCT_TYPES: ComponentType[] = ["PRODUCT_GRID", "PRODUCT_CAROUSEL", "FEATURED_PRODUCTS"];
const BANNER_TYPES: ComponentType[] = ["BANNER", "STORE_BANNER"];

function typeMeta(type: ComponentType) {
  return COMPONENT_TYPES.find((t) => t.type === type) ?? { label: type, icon: <LayoutGrid size={16} />, hint: "" };
}

/* ─────────────────────────── Product Picker Modal ─────────────────────────── */

function ProductPickerModal({
  initialSelected,
  onClose,
  onSave,
}: {
  initialSelected: string[];
  onClose: () => void;
  onSave: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const { data, isFetching } = useGetAllProductsQuery({
    search: search || undefined,
    approvalStatus: "ACTIVE",
    limit: 30,
  });
  const products = data?.items ?? [];

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(13,27,46,0.5)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 640, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${PALETTE.borderSoft}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 14.5, fontWeight: 800, color: PALETTE.text, margin: 0 }}>Select Products</h3>
            <p style={{ fontSize: 11, color: PALETTE.textFaint, margin: "2px 0 0" }}>{selected.length} selected</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: PALETTE.textFaint }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "12px 20px" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} color="#94A3B8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <Input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 30, fontSize: 13 }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
          {isFetching ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
              <Loader2 size={20} className="animate-spin" color={PALETTE.primary} />
            </div>
          ) : products.length === 0 ? (
            <p style={{ textAlign: "center", fontSize: 12, color: PALETTE.textFaint, padding: 30 }}>No products found</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
              {products.map((p) => {
                const active = selected.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    style={{
                      textAlign: "left",
                      border: `1.5px solid ${active ? PALETTE.primary : PALETTE.border}`,
                      background: active ? PALETTE.primarySoft : "#fff",
                      borderRadius: 10,
                      padding: 8,
                      cursor: "pointer",
                      position: "relative",
                    }}
                  >
                    {active && (
                      <div style={{ position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: "50%", background: PALETTE.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check size={11} color="#fff" />
                      </div>
                    )}
                    <div style={{ width: "100%", aspectRatio: "1/1", borderRadius: 8, background: PALETTE.panelBg, overflow: "hidden", marginBottom: 6 }}>
                      {p.images?.[0]?.url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0].url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: PALETTE.text, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                      {p.name}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: 16, borderTop: `1px solid ${PALETTE.borderSoft}`, display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: `1.5px solid ${PALETTE.border}`, background: "#fff", color: PALETTE.textMuted, fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(selected)}
            style={{ flex: 2, padding: "9px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#1D4ED8,#7C3AED)", color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}
          >
            Save Selection ({selected.length})
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Component Card ─────────────────────────── */

function ComponentCard({
  component,
  campaignId,
  isFirst,
  isLast,
  onMove,
}: {
  component: CampaignComponent;
  campaignId: string;
  isFirst: boolean;
  isLast: boolean;
  onMove: (dir: "up" | "down") => void;
}) {
  const [updateComponent] = useUpdateComponentMutation();
  const [deleteComponent] = useDeleteComponentMutation();
  const [setProducts] = useSetComponentProductsMutation();
  const [uploadImage, { isLoading: uploading }] = useUploadCampaignImageMutation();

  const [expanded, setExpanded] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [local, setLocal] = useState({
    title: component.config?.title ?? "",
    bannerImage: component.config?.bannerImage ?? "",
    bannerLink: component.config?.bannerLink ?? "",
    bannerBackgroundColor: component.config?.bannerBackgroundColor ?? "#F0F4FA",
    productsPerRow: component.config?.productsPerRow ?? 4,
    countdownEndDate: component.config?.countdownEndDate
      ? toDateTimeLocal(component.config.countdownEndDate) // local time, like the input
      : "",
    showProductPrice: component.config?.showProductPrice ?? true,
    showProductRating: component.config?.showProductRating ?? true,
  });

  const meta = typeMeta(component.type);
  const isProductType = PRODUCT_TYPES.includes(component.type);
  const isBannerType = BANNER_TYPES.includes(component.type);
  const isCountdown = component.type === "COUNTDOWN_TIMER";

  const saveConfig = async () => {
    try {
      await updateComponent({
        componentId: component.id,
        campaignId,
        config: {
          title: local.title || undefined,
          bannerImage: local.bannerImage || undefined,
          bannerLink: local.bannerLink || undefined,
          bannerBackgroundColor: local.bannerBackgroundColor || undefined,
          productsPerRow: isProductType ? Number(local.productsPerRow) : undefined,
          countdownEndDate: isCountdown && local.countdownEndDate ? new Date(local.countdownEndDate).toISOString() : undefined,
          showProductPrice: local.showProductPrice,
          showProductRating: local.showProductRating,
        },
      }).unwrap();
      toast.success("Block updated");
    } catch {
      toast.error("Failed to save block");
    }
  };

  const toggleVisible = async () => {
    try {
      await updateComponent({ componentId: component.id, campaignId, isVisible: !component.isVisible }).unwrap();
    } catch {
      toast.error("Failed to toggle visibility");
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const res = await uploadImage(file).unwrap();
      setLocal((p) => ({ ...p, bannerImage: res.url }));
    } catch {
      toast.error("Image upload failed");
    }
  };

  return (
    <div style={{ border: `1.5px solid ${PALETTE.border}`, borderRadius: 13, overflow: "hidden", background: "#fff" }}>
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          background: PALETTE.panelBg,
          cursor: "pointer",
        }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div style={{ width: 30, height: 30, borderRadius: 8, background: PALETTE.iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: PALETTE.primary, flexShrink: 0 }}>
          {meta.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: PALETTE.text }}>
            {component.config?.title || meta.label}
          </div>
          <div style={{ fontSize: 10.5, color: PALETTE.textFaint }}>
            {meta.label}
            {isProductType && ` · ${component.products.length} products`}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={(e) => e.stopPropagation()}>
          <button onClick={() => !isFirst && onMove("up")} disabled={isFirst} style={iconBtnStyle(isFirst)}>
            <ChevronUp size={13} />
          </button>
          <button onClick={() => !isLast && onMove("down")} disabled={isLast} style={iconBtnStyle(isLast)}>
            <ChevronDown size={13} />
          </button>
          <button onClick={toggleVisible} style={iconBtnStyle(false)} title={component.isVisible ? "Hide" : "Show"}>
            {component.isVisible ? <Eye size={13} /> : <EyeOff size={13} color={PALETTE.textFainter} />}
          </button>
          <button
            onClick={async () => {
              try {
                await deleteComponent({ componentId: component.id, campaignId }).unwrap();
                toast.success("Block removed");
              } catch {
                toast.error("Failed to remove block");
              }
            }}
            style={{ ...iconBtnStyle(false), color: PALETTE.danger }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Config body */}
      {expanded && (
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Block title (optional heading)</label>
            <Input value={local.title} onChange={(e) => setLocal((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. T-Shirt Fest" style={{ fontSize: 13 }} />
          </div>

          {(isBannerType || isCountdown) && (
            <>
              <div>
                <label style={labelStyle}>Banner Image</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {local.bannerImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={local.bannerImage} alt="" style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 6, border: `1px solid ${PALETTE.border}` }} />
                  )}
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: PALETTE.primary,
                      background: PALETTE.primarySoft,
                      padding: "7px 12px",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                    {local.bannerImage ? "Replace" : "Upload"}
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                  </label>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Banner Link</label>
                <Input value={local.bannerLink} onChange={(e) => setLocal((p) => ({ ...p, bannerLink: e.target.value }))} placeholder="/category/electronics" style={{ fontSize: 13 }} />
              </div>
            </>
          )}

          {isCountdown && (
            <div>
              <label style={labelStyle}>Countdown ends at</label>
              <Input
                type="datetime-local"
                value={local.countdownEndDate}
                onChange={(e) => setLocal((p) => ({ ...p, countdownEndDate: e.target.value }))}
                style={{ fontSize: 13 }}
              />
            </div>
          )}

          {isProductType && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Products per row</label>
                  <Input
                    type="number"
                    min={2}
                    max={6}
                    value={local.productsPerRow}
                    onChange={(e) => setLocal((p) => ({ ...p, productsPerRow: Number(e.target.value) }))}
                    style={{ fontSize: 13 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 4 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: PALETTE.textMuted, fontWeight: 600 }}>
                    <input type="checkbox" checked={local.showProductPrice} onChange={(e) => setLocal((p) => ({ ...p, showProductPrice: e.target.checked }))} />
                    Show price
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: PALETTE.textMuted, fontWeight: 600 }}>
                    <input type="checkbox" checked={local.showProductRating} onChange={(e) => setLocal((p) => ({ ...p, showProductRating: e.target.checked }))} />
                    Show rating
                  </label>
                </div>
              </div>

              <button
                onClick={() => setShowPicker(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "9px 0",
                  borderRadius: 9,
                  border: `1.5px dashed ${PALETTE.border}`,
                  background: PALETTE.panelBg,
                  color: PALETTE.primary,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <Plus size={13} /> Manage Products ({component.products.length} selected)
              </button>
            </>
          )}

          <button
            onClick={saveConfig}
            style={{
              padding: "9px 0",
              borderRadius: 9,
              border: "none",
              background: "linear-gradient(135deg,#1D4ED8,#7C3AED)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 12.5,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Save Block
          </button>
        </div>
      )}

      {showPicker && (
        <ProductPickerModal
          initialSelected={component.products.map((p) => p.product.id)}
          onClose={() => setShowPicker(false)}
          onSave={async (ids) => {
            try {
              await setProducts({ componentId: component.id, campaignId, productIds: ids }).unwrap();
              toast.success("Products updated");
            } catch {
              toast.error("Failed to update products");
            } finally {
              setShowPicker(false);
            }
          }}
        />
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 11.5, fontWeight: 700, color: PALETTE.textMuted, display: "block", marginBottom: 5 };
const iconBtnStyle = (disabled: boolean): React.CSSProperties => ({
  width: 26,
  height: 26,
  borderRadius: 7,
  border: `1px solid ${PALETTE.border}`,
  background: "#fff",
  color: disabled ? "#CBD5E1" : PALETTE.textMuted,
  cursor: disabled ? "not-allowed" : "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

/* ─────────────────────────── Main Page ─────────────────────────── */

export default function CampaignBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const { data: campaign, isLoading } = useGetCampaignByIdQuery(campaignId);
  const [updateCampaign] = useUpdateCampaignMutation();
  const [publish] = usePublishCampaignMutation();
  const [unpublish] = useUnpublishCampaignMutation();
  const [addComponent] = useAddComponentMutation();
  const [reorder] = useReorderComponentsMutation();
  const [uploadImage, { isLoading: uploadingHero }] = useUploadCampaignImageMutation();

  const [meta, setMeta] = useState({ title: "", heroTitle: "", heroSubtitle: "", heroImage: "", startDate: "", endDate: "" });
  const [showTypePicker, setShowTypePicker] = useState(false);

  useEffect(() => {
    // Local-time datetime-local values (the old UTC slice shifted the window on every save).
    if (campaign) setMeta(campaignToForm(campaign));
  }, [campaign]);

  if (isLoading || !campaign) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <Loader2 size={24} className="animate-spin" color={PALETTE.primary} />
      </div>
    );
  }

  const components = [...(campaign.components ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  const saveMeta = async () => {
    const errors = validateCampaignForm(meta);
    const firstError = Object.values(errors)[0];
    if (firstError) {
      toast.error(firstError);
      return;
    }
    // Only changed fields; a cleared optional field is sent as null.
    const changes = buildCampaignUpdate(meta, campaign);
    if (Object.keys(changes).length === 0) {
      toast.info("No changes to save");
      return;
    }
    try {
      await updateCampaign({ id: campaignId, ...changes }).unwrap();
      toast.success("Campaign saved");
    } catch {
      toast.error("Failed to save campaign");
    }
  };

  const handleHeroUpload = async (file: File) => {
    try {
      const res = await uploadImage(file).unwrap();
      setMeta((p) => ({ ...p, heroImage: res.url }));
    } catch {
      toast.error("Image upload failed");
    }
  };

  const handleAddComponent = async (type: ComponentType) => {
    try {
      await addComponent({ campaignId, type, sortOrder: components.length }).unwrap();
      toast.success("Block added");
    } catch {
      toast.error("Failed to add block");
    } finally {
      setShowTypePicker(false);
    }
  };

  const moveComponent = async (index: number, dir: "up" | "down") => {
    const newOrder = [...components];
    const swapWith = dir === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= newOrder.length) return;
    [newOrder[index], newOrder[swapWith]] = [newOrder[swapWith], newOrder[index]];
    try {
      await reorder({ campaignId, orderedIds: newOrder.map((c) => c.id) }).unwrap();
    } catch {
      toast.error("Failed to reorder");
    }
  };

  const togglePublish = async () => {
    try {
      if (campaign.status === "PUBLISHED") {
        await unpublish(campaignId).unwrap();
        toast.success("Moved back to draft");
      } else {
        await publish(campaignId).unwrap();
        toast.success("Campaign is now live");
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: PALETTE.pageBg, minHeight: "100vh", padding: "24px 16px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <button
            onClick={() => router.push("/admin-dashboard/campaigns")}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: PALETTE.textFaint, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
          >
            <ArrowLeft size={14} /> All Campaigns
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a
              href={`/campaign/${campaign.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11.5, color: PALETTE.primary, fontWeight: 700 }}
            >
              /campaign/{campaign.slug} ↗
            </a>
            <button
              onClick={togglePublish}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: "none",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                background: campaign.status === "PUBLISHED" ? PALETTE.successBg : "linear-gradient(135deg,#1D4ED8,#7C3AED)",
                color: campaign.status === "PUBLISHED" ? PALETTE.success : "#fff",
              }}
            >
              {campaign.status === "PUBLISHED" ? "● Live — Unpublish" : "Publish Campaign"}
            </button>
          </div>
        </div>

        {/* Campaign meta */}
        <div style={{ background: "#fff", border: `1.5px solid ${PALETTE.border}`, borderRadius: 14, padding: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Campaign Title</label>
              <Input value={meta.title} onChange={(e) => setMeta((p) => ({ ...p, title: e.target.value }))} style={{ fontSize: 13 }} />
            </div>
            <div>
              <label style={labelStyle}>Hero Headline</label>
              <Input value={meta.heroTitle} onChange={(e) => setMeta((p) => ({ ...p, heroTitle: e.target.value }))} placeholder="Big text over the hero banner" style={{ fontSize: 13 }} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Hero Subtitle</label>
              <Input value={meta.heroSubtitle} onChange={(e) => setMeta((p) => ({ ...p, heroSubtitle: e.target.value }))} style={{ fontSize: 13 }} />
            </div>
            <div>
              <label style={labelStyle}>Starts</label>
              <Input type="datetime-local" value={meta.startDate} onChange={(e) => setMeta((p) => ({ ...p, startDate: e.target.value }))} style={{ fontSize: 13 }} />
            </div>
            <div>
              <label style={labelStyle}>Ends</label>
              <Input type="datetime-local" value={meta.endDate} onChange={(e) => setMeta((p) => ({ ...p, endDate: e.target.value }))} style={{ fontSize: 13 }} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Hero Banner Image</label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {meta.heroImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={meta.heroImage} alt="" style={{ width: 100, height: 56, objectFit: "cover", borderRadius: 8, border: `1px solid ${PALETTE.border}` }} />
                )}
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: PALETTE.primary, background: PALETTE.primarySoft, padding: "8px 14px", borderRadius: 9, cursor: "pointer" }}>
                  {uploadingHero ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  {meta.heroImage ? "Replace" : "Upload"}
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleHeroUpload(e.target.files[0])} />
                </label>
              </div>
            </div>
          </div>
          <button
            onClick={saveMeta}
            style={{ marginTop: 14, padding: "9px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#1D4ED8,#7C3AED)", color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}
          >
            Save Campaign Details
          </button>
        </div>

        {/* Components */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 800, color: PALETTE.text, margin: 0 }}>Page Blocks</h3>
            <button
              onClick={() => setShowTypePicker(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: PALETTE.primary, background: PALETTE.primarySoft, border: "none", borderRadius: 9, padding: "7px 12px", cursor: "pointer", fontFamily: "inherit" }}
            >
              <Plus size={13} /> Add Block
            </button>
          </div>

          {components.length === 0 ? (
            <div style={{ background: "#fff", border: `1.5px dashed ${PALETTE.border}`, borderRadius: 13, textAlign: "center", padding: 30 }}>
              <p style={{ fontSize: 12, color: PALETTE.textFaint, margin: 0 }}>No blocks yet — add a banner or product grid to get started</p>
            </div>
          ) : (
            components.map((c, i) => (
              <ComponentCard
                key={c.id}
                component={c}
                campaignId={campaignId}
                isFirst={i === 0}
                isLast={i === components.length - 1}
                onMove={(dir) => moveComponent(i, dir)}
              />
            ))
          )}
        </div>
      </div>

      {/* Type picker */}
      {showTypePicker && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,27,46,0.5)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShowTypePicker(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 20, width: "100%", maxWidth: 440 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ fontSize: 14.5, fontWeight: 800, color: PALETTE.text, margin: 0 }}>Add a Block</h3>
              <button onClick={() => setShowTypePicker(false)} style={{ background: "none", border: "none", cursor: "pointer", color: PALETTE.textFaint }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {COMPONENT_TYPES.map((t) => (
                <button
                  key={t.type}
                  onClick={() => handleAddComponent(t.type)}
                  style={{ textAlign: "left", display: "flex", gap: 10, alignItems: "center", padding: 10, borderRadius: 10, border: `1.5px solid ${PALETTE.border}`, background: "#fff", cursor: "pointer" }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: PALETTE.iconBg, color: PALETTE.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {t.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: PALETTE.text }}>{t.label}</div>
                    <div style={{ fontSize: 9.5, color: PALETTE.textFaint }}>{t.hint}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}