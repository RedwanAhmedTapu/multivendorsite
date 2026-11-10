"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Palette, Loader2 } from "lucide-react";
import { useGetBlogSiteSettingsQuery, useUpdateBlogSiteSettingsMutation } from "@/features/blogApi";
import { SectionCard, FieldLabel, TextInput, PrimaryButton, SuccessNote, COLORS } from "./ui";
import { BlogImageUploader } from "./BlogImageUploader";

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const valid = HEX_RE.test(value);
  return (
    <div>
      <FieldLabel hint="Hex color, e.g. #0F766E">{label}</FieldLabel>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="color"
          value={valid ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 38, height: 38, borderRadius: 8, border: `1px solid ${COLORS.cardBorder}`, padding: 2, cursor: "pointer" }}
        />
        <TextInput value={value} onChange={(e) => onChange(e.target.value)} error={!valid} placeholder="#0F766E" />
      </div>
    </div>
  );
}

export default function SiteSettingsTab() {
  const { data, isLoading: isFetching } = useGetBlogSiteSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateBlogSiteSettingsMutation();

  const [siteName, setSiteName] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [primaryColorHex, setPrimaryColorHex] = useState("#0F766E");
  const [backgroundHex, setBackgroundHex] = useState("#FAF7F2");
  const [textColorHex, setTextColorHex] = useState("#374151");
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");

  useEffect(() => {
    const s = data?.data;
    if (!s) return;
    setSiteName(s.siteName || "");
    setTagline(s.tagline || "");
    setLogoUrl(s.logoUrl || null);
    setFaviconUrl(s.faviconUrl || null);
    setPrimaryColorHex(s.primaryColorHex || "#0F766E");
    setBackgroundHex(s.backgroundHex || "#FAF7F2");
    setTextColorHex(s.textColorHex || "#374151");
    setGoogleAnalyticsId(s.googleAnalyticsId || "");
  }, [data]);

  const colorsValid = HEX_RE.test(primaryColorHex) && HEX_RE.test(backgroundHex) && HEX_RE.test(textColorHex);

  async function handleSave() {
    if (!colorsValid) {
      toast.error("Please enter valid hex colors before saving");
      return;
    }
    try {
      await updateSettings({
        siteName,
        tagline,
        logoUrl: logoUrl || undefined,
        faviconUrl: faviconUrl || undefined,
        primaryColorHex,
        backgroundHex,
        textColorHex,
        googleAnalyticsId: googleAnalyticsId || undefined,
      }).unwrap();
      toast.success("Site settings updated — live on blog.finixmart.com.bd");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update site settings");
    }
  }

  if (isFetching) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.muted, fontSize: 13, padding: 24 }}>
        <Loader2 size={16} style={{ animation: "fm-blogadmin-spin 1s linear infinite" }} />
        Loading site settings…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionCard icon={<Palette size={15} color="#7C3AED" />} title="Brand Identity" subtitle="Logo, name, and tagline shown across the blog" badge="required">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <FieldLabel required>Site Name</FieldLabel>
            <TextInput value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Finixmart Blog" />
          </div>
          <div>
            <FieldLabel hint="Shown under the site name in some layouts">Tagline</FieldLabel>
            <TextInput value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Insights, guides & deals from Finixmart" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
          <div>
            <FieldLabel hint="Shown in the header, recommended: transparent PNG/SVG">Logo</FieldLabel>
            <BlogImageUploader value={logoUrl} onChange={setLogoUrl} aspect="3 / 1" />
          </div>
          <div>
            <FieldLabel hint="Browser tab icon, square, at least 64×64">Favicon</FieldLabel>
            <BlogImageUploader value={faviconUrl} onChange={setFaviconUrl} aspect="1 / 1" />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={<Palette size={15} color="#0891B2" />} title="Brand Colors" subtitle="Applied site-wide on blog.finixmart.com.bd" badge="optional">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <ColorField label="Primary (accent)" value={primaryColorHex} onChange={setPrimaryColorHex} />
          <ColorField label="Background" value={backgroundHex} onChange={setBackgroundHex} />
          <ColorField label="Text" value={textColorHex} onChange={setTextColorHex} />
        </div>
        <div style={{ marginTop: 14, borderRadius: 10, overflow: "hidden", border: `1px solid ${COLORS.cardBorder}` }}>
          <div style={{ padding: 16, background: colorsValid ? backgroundHex : "#fff" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: colorsValid ? textColorHex : COLORS.hint, marginBottom: 6 }}>
              Live preview
            </p>
            <p style={{ fontSize: 15, fontWeight: 800, color: colorsValid ? textColorHex : COLORS.title }}>
              How to Choose the Right Air Fryer
            </p>
            <span
              style={{
                display: "inline-block", marginTop: 8, padding: "4px 12px", borderRadius: 999,
                fontSize: 11, fontWeight: 700, color: "#fff",
                background: colorsValid ? primaryColorHex : COLORS.hint,
              }}
            >
              Electronics
            </span>
          </div>
        </div>
        {colorsValid && <SuccessNote>Colors are valid hex values</SuccessNote>}
      </SectionCard>

      <SectionCard icon={<Palette size={15} color="#D97706" />} title="Analytics" subtitle="Optional Google Analytics measurement ID" badge="optional">
        <FieldLabel hint="e.g. G-XXXXXXXXXX">Google Analytics ID</FieldLabel>
        <TextInput value={googleAnalyticsId} onChange={(e) => setGoogleAnalyticsId(e.target.value)} placeholder="G-XXXXXXXXXX" />
      </SectionCard>

      <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 18px", background: "#fff", border: `1.5px solid ${COLORS.cardBorder}`, borderRadius: 14 }}>
        <PrimaryButton isLoading={isSaving} onClick={handleSave} label="Save Site Settings" loadingLabel="Saving…" />
      </div>
    </div>
  );
}
