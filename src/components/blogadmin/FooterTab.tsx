"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { PanelBottom, Plus, Trash2, Loader2 } from "lucide-react";
import { useGetBlogFooterQuery, useUpsertBlogFooterMutation, type BlogFooterColumn } from "@/features/blogApi";
import { SectionCard, FieldLabel, TextInput, TextArea, PrimaryButton, SecondaryButton, IconButton, COLORS } from "./ui";

export default function FooterTab() {
  const { data, isLoading } = useGetBlogFooterQuery();
  const [upsertFooter, { isLoading: isSaving }] = useUpsertBlogFooterMutation();

  const [aboutTitle, setAboutTitle] = useState("About Us");
  const [aboutText, setAboutText] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [copyrightText, setCopyrightText] = useState("");
  const [columns, setColumns] = useState<BlogFooterColumn[]>([]);

  useEffect(() => {
    const f = data?.data;
    if (!f) return;
    setAboutTitle(f.aboutTitle || "About Us");
    setAboutText(f.aboutText || "");
    setFacebookUrl(f.facebookUrl || "");
    setYoutubeUrl(f.youtubeUrl || "");
    setInstagramUrl(f.instagramUrl || "");
    setLinkedinUrl(f.linkedinUrl || "");
    setCopyrightText(f.copyrightText || "");
    setColumns(f.columns?.length ? f.columns : []);
  }, [data]);

  function addColumn() {
    if (columns.length >= 6) {
      toast.error("Maximum 6 footer columns");
      return;
    }
    setColumns((cols) => [...cols, { title: "New Column", sortOrder: cols.length, isVisible: true, elements: [] }]);
  }
  function removeColumn(idx: number) {
    setColumns((cols) => cols.filter((_, i) => i !== idx));
  }
  function updateColumnTitle(idx: number, title: string) {
    setColumns((cols) => cols.map((c, i) => (i === idx ? { ...c, title } : c)));
  }
  function addElement(colIdx: number) {
    setColumns((cols) =>
      cols.map((c, i) => (i === colIdx ? { ...c, elements: [...c.elements, { label: "", url: "" }] } : c))
    );
  }
  function updateElement(colIdx: number, elIdx: number, field: "label" | "url", value: string) {
    setColumns((cols) =>
      cols.map((c, i) =>
        i === colIdx ? { ...c, elements: c.elements.map((el, j) => (j === elIdx ? { ...el, [field]: value } : el)) } : c
      )
    );
  }
  function removeElement(colIdx: number, elIdx: number) {
    setColumns((cols) => cols.map((c, i) => (i === colIdx ? { ...c, elements: c.elements.filter((_, j) => j !== elIdx) } : c)));
  }

  async function handleSave() {
    if (!aboutText.trim() || !copyrightText.trim()) {
      toast.error("About text and copyright text are required");
      return;
    }
    const cleanColumns = columns
      .filter((c) => c.title.trim())
      .map((c, i) => ({
        ...c,
        sortOrder: i,
        elements: c.elements.filter((el) => el.label.trim() && el.url.trim()),
      }));
    try {
      await upsertFooter({
        aboutTitle,
        aboutText,
        facebookUrl: facebookUrl || undefined,
        youtubeUrl: youtubeUrl || undefined,
        instagramUrl: instagramUrl || undefined,
        linkedinUrl: linkedinUrl || undefined,
        copyrightText,
        columns: cleanColumns,
      }).unwrap();
      toast.success("Footer updated — live on blog.finixmart.com.bd");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update footer");
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.muted, fontSize: 13, padding: 24 }}>
        <Loader2 size={16} style={{ animation: "fm-blogadmin-spin 1s linear infinite" }} />
        Loading footer…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionCard icon={<PanelBottom size={15} color="#0891B2" />} title="About & Social" subtitle="Shown in the footer's first column" badge="required">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14 }}>
          <div>
            <FieldLabel>About Title</FieldLabel>
            <TextInput value={aboutTitle} onChange={(e) => setAboutTitle(e.target.value)} placeholder="About Us" />
          </div>
          <div>
            <FieldLabel required>About Text</FieldLabel>
            <TextArea value={aboutText} onChange={(e) => setAboutText(e.target.value)} placeholder="Welcome to the Finixmart Blog…" />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 14 }}>
          <div><FieldLabel>Facebook</FieldLabel><TextInput value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/…" /></div>
          <div><FieldLabel>YouTube</FieldLabel><TextInput value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/…" /></div>
          <div><FieldLabel>Instagram</FieldLabel><TextInput value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/…" /></div>
          <div><FieldLabel>LinkedIn</FieldLabel><TextInput value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/…" /></div>
        </div>
        <div style={{ marginTop: 14 }}>
          <FieldLabel required>Copyright Text</FieldLabel>
          <TextInput value={copyrightText} onChange={(e) => setCopyrightText(e.target.value)} placeholder="Copyright© 2026, Finixmart. All rights reserved." />
        </div>
      </SectionCard>

      <SectionCard
        icon={<PanelBottom size={15} color="#7C3AED" />}
        title="Footer Columns & Links"
        subtitle="Up to 6 columns, each with its own links"
        badge="optional"
        right={<SecondaryButton label="+ Add Column" onClick={addColumn} disabled={columns.length >= 6} />}
      >
        {columns.length === 0 ? (
          <p style={{ fontSize: 12.5, color: COLORS.hint }}>No columns yet — add one (e.g. "Beauty News", "Discover").</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            {columns.map((col, colIdx) => (
              <div key={colIdx} style={{ border: `1px solid ${COLORS.cardBorder}`, borderRadius: 10, padding: 12, background: "#FAFBFD" }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  <TextInput value={col.title} onChange={(e) => updateColumnTitle(colIdx, e.target.value)} placeholder="Column title" style={{ fontWeight: 700 }} />
                  <IconButton title="Remove column" danger onClick={() => removeColumn(colIdx)}><Trash2 size={13} /></IconButton>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {col.elements.map((el, elIdx) => (
                    <div key={elIdx} style={{ display: "flex", gap: 5 }}>
                      <TextInput value={el.label} onChange={(e) => updateElement(colIdx, elIdx, "label", e.target.value)} placeholder="Link label" style={{ fontSize: 12 }} />
                      <TextInput value={el.url} onChange={(e) => updateElement(colIdx, elIdx, "url", e.target.value)} placeholder="/blog/slug" style={{ fontSize: 12 }} />
                      <IconButton title="Remove link" danger onClick={() => removeElement(colIdx, elIdx)}><Trash2 size={12} /></IconButton>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => addElement(colIdx)}
                  style={{ marginTop: 8, fontSize: 11.5, fontWeight: 600, color: "#7C3AED", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}
                >
                  <Plus size={12} /> Add link
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 18px", background: "#fff", border: `1.5px solid ${COLORS.cardBorder}`, borderRadius: 14 }}>
        <PrimaryButton isLoading={isSaving} onClick={handleSave} label="Save Footer" loadingLabel="Saving…" />
      </div>
    </div>
  );
}
