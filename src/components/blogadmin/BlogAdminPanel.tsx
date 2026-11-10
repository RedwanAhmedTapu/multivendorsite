"use client";
import React, { useState } from "react";
import { Newspaper, FolderTree, Menu as MenuIcon, PanelBottom, Palette } from "lucide-react";
import { useInjectErrorGlowStyle } from "./ui";
import PostsTab from "./PostsTab";
import CategoriesTab from "./CategoriesTab";
import NavMenuTab from "./NavMenuTab";
import FooterTab from "./FooterTab";
import SiteSettingsTab from "./SiteSettingsTab";

type TabKey = "posts" | "categories" | "nav" | "footer" | "settings";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "posts", label: "Posts", icon: <Newspaper size={14} /> },
  { key: "categories", label: "Categories", icon: <FolderTree size={14} /> },
  { key: "nav", label: "Navigation", icon: <MenuIcon size={14} /> },
  { key: "footer", label: "Footer", icon: <PanelBottom size={14} /> },
  { key: "settings", label: "Site Settings", icon: <Palette size={14} /> },
];

export default function BlogAdminPanel() {
  useInjectErrorGlowStyle();
  const [tab, setTab] = useState<TabKey>("posts");

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: "#F0F4FA", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ marginBottom: 18 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0D1B2E", letterSpacing: "-0.3px" }}>
            Finixmart Blog — Content Manager
          </h1>
          <p style={{ fontSize: 12.5, color: "#7A90AB", marginTop: 2 }}>
            Everything here is live on blog.finixmart.com.bd the moment you save.
          </p>
        </div>

        {/* ── Tab bar (same card shell style as SectionCard headers) ── */}
        <div
          style={{
            display: "flex",
            gap: 4,
            background: "#fff",
            border: "1.5px solid #E5EAF2",
            borderRadius: 14,
            padding: 6,
            marginBottom: 16,
            overflowX: "auto",
          }}
        >
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 16px",
                  borderRadius: 9,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12.5,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  fontFamily: "inherit",
                  background: active ? "linear-gradient(135deg,#1D4ED8,#7C3AED)" : "transparent",
                  color: active ? "#fff" : "#64748B",
                  transition: "all 0.15s ease",
                }}
              >
                {t.icon}
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "posts" && <PostsTab />}
        {tab === "categories" && <CategoriesTab />}
        {tab === "nav" && <NavMenuTab />}
        {tab === "footer" && <FooterTab />}
        {tab === "settings" && <SiteSettingsTab />}
      </div>
    </div>
  );
}
