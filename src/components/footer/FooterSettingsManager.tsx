// src/components/footer/FooterSettingsManager.tsx
//
// Admin → Settings → Footer.
//
// Visual redesign only. Every hook, handler, payload, default value, validation
// step, `alert`/`confirm` call, `refetch()` and tab rule below is the original
// implementation untouched; only the presentation changed.
//
// Design tokens copied from the vendor Product Form (ProductForm.tsx):
//   border #E5EAF2 · section header #FAFBFD · inset #EEF3FB / #F0F4FA
//   text #0D1B2E / #3D5068 / #7A90AB / #9BAABB
//   accent gradient linear-gradient(135deg, #2563EB, #8B5CF6)
//   success #F0F9F0/#16A34A · danger #FEF2F2/#DC2626 · radius 9–14px
//
// No component-library primitives are used on this page.

"use client";

import React, { useState } from "react";
import {
  useGetFooterSettingsQuery,
  useCreateFooterSettingsMutation,
  useUpdateFooterSettingsMutation,
  useDeleteFooterSettingsMutation,
  useAddFooterColumnMutation,
  useUpdateFooterColumnMutation,
  useDeleteFooterColumnMutation,
  useAddFooterElementMutation,
  useUpdateFooterElementMutation,
  useDeleteFooterElementMutation,
  FooterSettings,
  FooterColumn,
  FooterElement,
} from "@/features/footerSettingsApi";
import {
  Trash2,
  Pencil,
  Save,
  X,
  Settings,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  Plus,
  AlertCircle,
  Link as LinkIcon,
  Eye,
  EyeOff,
  LayoutGrid,
  Type,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";

interface CompanyFormState {
  companyName: string;
  address: string;
  email: string;
  phone1: string;
  phone2: string;
  dbidNumber: string;
  tradeLicense: string;
  newsletterTitle: string;
  newsletterDescription: string;
  socialMediaTitle: string;
  twitterUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  instagramUrl: string;
  whatsappUrl: string;
  copyrightText: string;
  paymentBannerImage: string;
}

interface ColumnFormState {
  title: string;
  isVisible: boolean;
}

interface ElementFormState {
  label: string;
  url: string;
  displayOrder: number;
  isVisible: boolean;
  openInNewTab: boolean;
}

/* ── design primitives ─────────────────────────────────────────────────────── */

const CARD =
  "rounded-[14px] border border-[#E5EAF2] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]";
const SECTION_HEAD =
  "flex items-start justify-between gap-3 border-b border-[#F0F4FA] bg-[#FAFBFD] px-4 py-3 rounded-t-[13px]";
const LABEL = "text-[11px] font-semibold uppercase tracking-wide text-[#7A90AB]";
const FIELD =
  "w-full rounded-[12px] border border-[#E5EAF2] bg-white px-3 py-2.5 text-[13px] text-[#0D1B2E] outline-none transition placeholder:text-[#9BAABB] focus:border-[#A855F7] focus:ring-4 focus:ring-[#A855F7]/10 disabled:bg-[#FAFBFD] disabled:text-[#9BAABB]";
const PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-[11px] bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-[#8B5CF6]/25 transition hover:brightness-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#8B5CF6]/25 disabled:cursor-not-allowed disabled:opacity-50";
const GHOST =
  "inline-flex items-center justify-center gap-1.5 rounded-[11px] border border-[#E5EAF2] bg-white px-3 py-2 text-xs font-semibold text-[#3D5068] transition hover:border-[#D5DEEC] hover:bg-[#FAFBFD] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#E5EAF2] disabled:opacity-50";
const DANGER =
  "inline-flex items-center justify-center gap-1.5 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-xs font-semibold text-[#DC2626] transition hover:bg-[#FEE2E2] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#DC2626]/20 disabled:opacity-50";
const ICON_BTN =
  "rounded-[9px] p-1.5 text-[#9BAABB] transition hover:bg-[#EEF3FB] hover:text-[#3D5068] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/30";

const TABS = [
  { key: "view", label: "Overview" },
  { key: "create", label: "Create" },
  { key: "edit", label: "Company info" },
  { key: "columns", label: "Columns & links" },
] as const;

export default function FooterSettingsManager() {
  const { data, isLoading, error, refetch } = useGetFooterSettingsQuery();
  const [createFooterSettings, { isLoading: isCreating }] =
    useCreateFooterSettingsMutation();
  const [updateFooterSettings, { isLoading: isUpdating }] =
    useUpdateFooterSettingsMutation();
  const [deleteFooterSettings, { isLoading: isDeleting }] =
    useDeleteFooterSettingsMutation();

  const [addColumn] = useAddFooterColumnMutation();
  const [updateColumn] = useUpdateFooterColumnMutation();
  const [deleteColumn] = useDeleteFooterColumnMutation();

  const [addElement] = useAddFooterElementMutation();
  const [updateElement] = useUpdateFooterElementMutation();
  const [deleteElement] = useDeleteFooterElementMutation();

  const [activeTab, setActiveTab] = useState("view");
  const [isEditing, setIsEditing] = useState(false);

  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [isElementDialogOpen, setIsElementDialogOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<FooterColumn | null>(null);
  const [editingElement, setEditingElement] = useState<FooterElement | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string>("");

  const footerSettings = data?.data;

  const [companyForm, setCompanyForm] = useState<CompanyFormState>({
    companyName: "",
    address: "",
    email: "",
    phone1: "",
    phone2: "",
    dbidNumber: "",
    tradeLicense: "",
    newsletterTitle: "Let's keep in touch",
    newsletterDescription: "Get recommendations, tips, updates and more.",
    socialMediaTitle: "Stay Connected",
    twitterUrl: "",
    facebookUrl: "",
    youtubeUrl: "",
    instagramUrl: "",
    whatsappUrl: "",
    copyrightText: "Copyright © 2026 FinixMart, All rights reserved.",
    paymentBannerImage: "/footer/sslcommerz-banner.png",
  });

  const [columnForm, setColumnForm] = useState<ColumnFormState>({
    title: "",
    isVisible: true,
  });

  const [elementForm, setElementForm] = useState<ElementFormState>({
    label: "",
    url: "",
    displayOrder: 0,
    isVisible: true,
    openInNewTab: false,
  });

  /* ── handlers (unchanged) ───────────────────────────────────────────────── */

  const handleEdit = () => {
    if (footerSettings) {
      setCompanyForm({
        companyName: footerSettings.companyName,
        address: footerSettings.address,
        email: footerSettings.email,
        phone1: footerSettings.phone1,
        phone2: footerSettings.phone2 || "",
        dbidNumber: footerSettings.dbidNumber,
        tradeLicense: footerSettings.tradeLicense,
        newsletterTitle: footerSettings.newsletterTitle,
        newsletterDescription: footerSettings.newsletterDescription,
        socialMediaTitle: footerSettings.socialMediaTitle,
        twitterUrl: footerSettings.twitterUrl || "",
        facebookUrl: footerSettings.facebookUrl || "",
        youtubeUrl: footerSettings.youtubeUrl || "",
        instagramUrl: footerSettings.instagramUrl || "",
        whatsappUrl: footerSettings.whatsappUrl || "",
        copyrightText: footerSettings.copyrightText,
        paymentBannerImage: footerSettings.paymentBannerImage,
      });
      setIsEditing(true);
      setActiveTab("edit");
    }
  };

  const handleSaveCompanyInfo = async () => {
    try {
      if (isEditing && footerSettings) {
        await updateFooterSettings({
          companyName: companyForm.companyName,
          address: companyForm.address,
          email: companyForm.email,
          phone1: companyForm.phone1,
          phone2: companyForm.phone2 || null,
          dbidNumber: companyForm.dbidNumber,
          tradeLicense: companyForm.tradeLicense,
          newsletterTitle: companyForm.newsletterTitle,
          newsletterDescription: companyForm.newsletterDescription,
          socialMediaTitle: companyForm.socialMediaTitle,
          twitterUrl: companyForm.twitterUrl || null,
          facebookUrl: companyForm.facebookUrl || null,
          youtubeUrl: companyForm.youtubeUrl || null,
          instagramUrl: companyForm.instagramUrl || null,
          whatsappUrl: companyForm.whatsappUrl || null,
          copyrightText: companyForm.copyrightText,
          paymentBannerImage: companyForm.paymentBannerImage,
        }).unwrap();
        alert("Footer settings updated successfully!");
      } else {
        await createFooterSettings({
          companyName: companyForm.companyName,
          address: companyForm.address,
          email: companyForm.email,
          phone1: companyForm.phone1,
          phone2: companyForm.phone2 || null,
          dbidNumber: companyForm.dbidNumber,
          tradeLicense: companyForm.tradeLicense,
          newsletterTitle: companyForm.newsletterTitle,
          newsletterDescription: companyForm.newsletterDescription,
          socialMediaTitle: companyForm.socialMediaTitle,
          twitterUrl: companyForm.twitterUrl || null,
          facebookUrl: companyForm.facebookUrl || null,
          youtubeUrl: companyForm.youtubeUrl || null,
          instagramUrl: companyForm.instagramUrl || null,
          whatsappUrl: companyForm.whatsappUrl || null,
          copyrightText: companyForm.copyrightText,
          paymentBannerImage: companyForm.paymentBannerImage,
        }).unwrap();
        alert("Footer settings created successfully!");
      }
      refetch();
      setActiveTab("view");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Failed to save footer settings:", error);
      alert(error?.data?.message || "Failed to save footer settings");
    }
  };

  const handleDelete = async () => {
    if (
      confirm(
        "Are you sure you want to delete the footer settings? This will also delete all columns and elements."
      )
    ) {
      try {
        await deleteFooterSettings().unwrap();
        alert("Footer settings deleted successfully!");
        refetch();
        setActiveTab("view");
      } catch (error: any) {
        console.error("Failed to delete footer settings:", error);
        alert(error?.data?.message || "Failed to delete footer settings");
      }
    }
  };

  const handleCancel = () => {
    setActiveTab("view");
    setIsEditing(false);
  };

  const handleCompanyInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCompanyForm({ ...companyForm, [name]: value });
  };

  const handleOpenColumnDialog = (column?: FooterColumn) => {
    if (column) {
      setEditingColumn(column);
      setColumnForm({
        title: column.title,
        isVisible: column.isVisible,
      });
    } else {
      setEditingColumn(null);
      setColumnForm({
        title: "",
        isVisible: true,
      });
    }
    setIsColumnDialogOpen(true);
  };

  const handleSaveColumn = async () => {
    try {
      if (editingColumn) {
        await updateColumn({
          columnId: editingColumn.id,
          data: columnForm,
        }).unwrap();
        alert("Column updated successfully!");
      } else {
        if (!footerSettings?.id) {
          alert("Please create footer settings first!");
          return;
        }
        await addColumn({
          footerSettingsId: footerSettings.id,
          data: columnForm,
        }).unwrap();
        alert("Column added successfully!");
      }
      setIsColumnDialogOpen(false);
      refetch();
    } catch (error: any) {
      console.error("Failed to save column:", error);
      alert(error?.data?.message || "Failed to save column");
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (confirm("Are you sure? This will delete all elements in this column.")) {
      try {
        await deleteColumn(columnId).unwrap();
        alert("Column deleted successfully!");
        refetch();
      } catch (error: any) {
        console.error("Failed to delete column:", error);
        alert(error?.data?.message || "Failed to delete column");
      }
    }
  };

  const handleToggleColumnVisibility = async (column: FooterColumn) => {
    try {
      await updateColumn({
        columnId: column.id,
        data: { isVisible: !column.isVisible },
      }).unwrap();
      refetch();
    } catch (error: any) {
      console.error("Failed to toggle column visibility:", error);
    }
  };

  const handleOpenElementDialog = (columnId: string, element?: FooterElement) => {
    setSelectedColumnId(columnId);
    if (element) {
      setEditingElement(element);
      setElementForm({
        label: element.label,
        url: element.url,
        displayOrder: element.displayOrder,
        isVisible: element.isVisible,
        openInNewTab: element.openInNewTab,
      });
    } else {
      setEditingElement(null);
      const column = footerSettings?.columns.find((c) => c.id === columnId);
      setElementForm({
        label: "",
        url: "",
        displayOrder: column?.elements.length || 0,
        isVisible: true,
        openInNewTab: false,
      });
    }
    setIsElementDialogOpen(true);
  };

  const handleSaveElement = async () => {
    try {
      if (editingElement) {
        await updateElement({
          elementId: editingElement.id,
          data: elementForm,
        }).unwrap();
        alert("Element updated successfully!");
      } else {
        await addElement({
          columnId: selectedColumnId,
          data: elementForm,
        }).unwrap();
        alert("Element added successfully!");
      }
      setIsElementDialogOpen(false);
      refetch();
    } catch (error: any) {
      console.error("Failed to save element:", error);
      alert(error?.data?.message || "Failed to save element");
    }
  };

  const handleDeleteElement = async (elementId: string) => {
    if (confirm("Are you sure you want to delete this element?")) {
      try {
        await deleteElement(elementId).unwrap();
        alert("Element deleted successfully!");
        refetch();
      } catch (error: any) {
        console.error("Failed to delete element:", error);
        alert(error?.data?.message || "Failed to delete element");
      }
    }
  };

  const handleToggleElementVisibility = async (element: FooterElement) => {
    try {
      await updateElement({
        elementId: element.id,
        data: { isVisible: !element.isVisible },
      }).unwrap();
      refetch();
    } catch (error: any) {
      console.error("Failed to toggle element visibility:", error);
    }
  };

  /* ── presentation ───────────────────────────────────────────────────────── */

  const socials = footerSettings
    ? [
        { label: "Twitter", url: footerSettings.twitterUrl },
        { label: "Facebook", url: footerSettings.facebookUrl },
        { label: "YouTube", url: footerSettings.youtubeUrl },
        { label: "Instagram", url: footerSettings.instagramUrl },
        { label: "WhatsApp", url: footerSettings.whatsappUrl },
      ].filter((social) => !!social.url)
    : [];

  const tabDisabled: Record<string, boolean> = {
    view: false,
    create: !!footerSettings,
    edit: !footerSettings,
    columns: !footerSettings,
  };

  return (
    <div className="min-h-full bg-[#F7F9FD] px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1180px] space-y-4">
        {/* header */}
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] text-white shadow-sm shadow-[#8B5CF6]/25">
                <Settings size={16} />
              </span>
              <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-[#0D1B2E]">
                Footer settings
              </h1>
            </div>
            <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-[#7A90AB]">
              Company details, link columns and the bottom bar of the storefront footer.
              {footerSettings
                ? " Changes appear on the public site as soon as you save."
                : " Create the configuration once, then edit it here."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {footerSettings && (
              <button type="button" onClick={handleEdit} className={GHOST}>
                <Pencil size={13} /> Edit company info
              </button>
            )}
            {!footerSettings && !isLoading && (
              <button type="button" onClick={() => setActiveTab("create")} className={PRIMARY}>
                <Plus size={14} /> Create footer settings
              </button>
            )}
          </div>
        </header>

        {/* tab strip (plain buttons, same rules as before) */}
        <div className="inline-flex max-w-full overflow-x-auto rounded-[12px] border border-[#E5EAF2] bg-white p-1">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                disabled={tabDisabled[tab.key]}
                onClick={() => setActiveTab(tab.key)}
                aria-pressed={active}
                className={`whitespace-nowrap rounded-[9px] px-3 py-1.5 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${
                  active
                    ? "bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] text-white shadow-sm shadow-[#8B5CF6]/25"
                    : "text-[#3D5068] hover:bg-[#FAFBFD]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── overview ─────────────────────────────────────────────────────── */}
        {activeTab === "view" && (
          <div className="space-y-4">
            {isLoading ? (
              <div className={`${CARD} p-4`}>
                <div className="space-y-2">
                  {[0, 1, 2, 3].map((row) => (
                    <div key={row} className="h-10 animate-pulse rounded-[10px] bg-[#F0F4FA]" />
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className={`${CARD} flex flex-col items-center gap-2 px-6 py-10 text-center`}>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FEF2F2] text-[#DC2626]">
                  <AlertCircle size={17} />
                </span>
                <p className="text-sm font-semibold text-[#0D1B2E]">Could not load footer settings</p>
                <p className="max-w-sm text-xs text-[#7A90AB]">The request failed. Nothing was changed.</p>
                <button type="button" onClick={() => refetch()} className={`${GHOST} mt-1`}>
                  Retry
                </button>
              </div>
            ) : footerSettings ? (
              <>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                  {/* company */}
                  <section className={CARD}>
                    <div className={SECTION_HEAD}>
                      <div>
                        <h2 className="text-sm font-semibold text-[#0D1B2E]">Company information</h2>
                        <p className="mt-0.5 text-[11px] text-[#7A90AB]">Shown in the footer contact block.</p>
                      </div>
                      <span className="rounded-full bg-[#EEF3FB] px-2 py-0.5 text-[10px] font-semibold text-[#3D5068]">
                        {footerSettings.companyName}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 px-4 py-3.5 sm:grid-cols-2">
                      <Field icon={<Mail size={12} />} label="Email" value={footerSettings.email} />
                      <Field icon={<Phone size={12} />} label="Primary phone" value={footerSettings.phone1} />
                      {footerSettings.phone2 && (
                        <Field icon={<Phone size={12} />} label="Secondary phone" value={footerSettings.phone2} />
                      )}
                      <Field label="DBID number" value={footerSettings.dbidNumber} />
                      <Field label="Trade licence" value={footerSettings.tradeLicense} />
                      <div className="sm:col-span-2">
                        <Field icon={<MapPin size={12} />} label="Address" value={footerSettings.address} multiline />
                      </div>
                    </div>
                  </section>

                  {/* newsletter + bottom bar */}
                  <div className="space-y-4">
                    <section className={CARD}>
                      <div className={SECTION_HEAD}>
                        <div>
                          <h2 className="text-sm font-semibold text-[#0D1B2E]">Newsletter</h2>
                          <p className="mt-0.5 text-[11px] text-[#7A90AB]">Signup copy above the form.</p>
                        </div>
                        <Type size={13} className="text-[#9BAABB]" />
                      </div>
                      <div className="space-y-2 px-4 py-3.5">
                        <p className="text-[13px] font-semibold text-[#0D1B2E]">{footerSettings.newsletterTitle}</p>
                        <p className="text-[11.5px] leading-relaxed text-[#7A90AB]">
                          {footerSettings.newsletterDescription}
                        </p>
                      </div>
                    </section>

                    <section className={CARD}>
                      <div className={SECTION_HEAD}>
                        <div>
                          <h2 className="text-sm font-semibold text-[#0D1B2E]">Social media</h2>
                          <p className="mt-0.5 text-[11px] text-[#7A90AB]">{footerSettings.socialMediaTitle}</p>
                        </div>
                        <Globe size={13} className="text-[#9BAABB]" />
                      </div>
                      <div className="flex flex-wrap gap-1.5 px-4 py-3.5">
                        {socials.length === 0 ? (
                          <p className="text-[11.5px] italic text-[#9BAABB]">No social links configured.</p>
                        ) : (
                          socials.map((social) => (
                            <span
                              key={social.label}
                              className="inline-flex items-center gap-1 rounded-full border border-[#E5EAF2] bg-[#FAFBFD] px-2 py-0.5 text-[10.5px] font-semibold text-[#3D5068]"
                            >
                              <LinkIcon size={9} className="text-[#9BAABB]" /> {social.label}
                            </span>
                          ))
                        )}
                      </div>
                    </section>
                  </div>
                </div>

                {/* columns summary */}
                <section className={CARD}>
                  <div className={SECTION_HEAD}>
                    <div>
                      <h2 className="text-sm font-semibold text-[#0D1B2E]">
                        Footer columns
                        <span className="ml-1.5 rounded-full bg-[#EEF3FB] px-1.5 py-0.5 text-[10px] font-semibold text-[#3D5068]">
                          {footerSettings.columns.length}
                        </span>
                      </h2>
                      <p className="mt-0.5 text-[11px] text-[#7A90AB]">Link groups rendered left of the newsletter.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("columns")}
                      className={GHOST}
                    >
                      <LayoutGrid size={12} /> Manage columns
                    </button>
                  </div>
                  <div className="px-4 py-3.5">
                    {footerSettings.columns.length === 0 ? (
                      <p className="rounded-[10px] border border-dashed border-[#E5EAF2] bg-[#FAFBFD] px-3 py-4 text-center text-[11.5px] text-[#7A90AB]">
                        No columns yet. Open “Columns & links” to add the first one.
                      </p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {footerSettings.columns.map((column) => (
                          <div key={column.id} className="rounded-[12px] border border-[#E5EAF2] p-3">
                            <div className="flex items-center gap-1.5">
                              <p className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-[#0D1B2E]">
                                {column.title}
                              </p>
                              {!column.isVisible && (
                                <span className="rounded-full bg-[#EEF3FB] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#7A90AB]">
                                  hidden
                                </span>
                              )}
                            </div>
                            <ul className="mt-1.5 space-y-1">
                              {[...column.elements]
                                .sort((a, b) => a.displayOrder - b.displayOrder)
                                .map((element) => (
                                  <li key={element.id} className="flex items-center gap-1 text-[11px]">
                                    <LinkIcon size={9} className="shrink-0 text-[#C3CFDF]" />
                                    <span className={element.isVisible ? "truncate text-[#3D5068]" : "truncate text-[#9BAABB] line-through"}>
                                      {element.label}
                                    </span>
                                    {element.openInNewTab && (
                                      <span className="shrink-0 text-[9px] font-bold text-[#8B5CF6]">↗</span>
                                    )}
                                  </li>
                                ))}
                              {column.elements.length === 0 && (
                                <li className="text-[10.5px] italic text-[#9BAABB]">No links</li>
                              )}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                {/* bottom bar */}
                <section className={CARD}>
                  <div className={SECTION_HEAD}>
                    <div>
                      <h2 className="text-sm font-semibold text-[#0D1B2E]">Bottom bar</h2>
                      <p className="mt-0.5 text-[11px] text-[#7A90AB]">Copyright line and payment methods banner.</p>
                    </div>
                    <span className="text-[10.5px] text-[#9BAABB]">
                      Updated {new Date(footerSettings.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="grid gap-3 px-4 py-3.5 sm:grid-cols-2">
                    <Field label="Copyright text" value={footerSettings.copyrightText} />
                    <Field
                      icon={<ImageIcon size={12} />}
                      label="Payment banner"
                      value={footerSettings.paymentBannerImage}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F0F4FA] px-4 py-3">
                    <p className="text-[10.5px] text-[#9BAABB]">Deleting removes the columns and links with it.</p>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={handleEdit} className={GHOST}>
                        <Pencil size={12} /> Edit
                      </button>
                      <button type="button" onClick={handleDelete} disabled={isDeleting} className={DANGER}>
                        <Trash2 size={12} /> {isDeleting ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <div className={`${CARD} flex flex-col items-center gap-2 px-6 py-12 text-center`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EEF3FB] text-[#9BAABB]">
                  <Settings size={18} />
                </span>
                <p className="text-sm font-semibold text-[#0D1B2E]">No footer settings yet</p>
                <p className="max-w-sm text-xs text-[#7A90AB]">
                  Create the configuration to fill the storefront footer with your company details.
                </p>
                <button type="button" onClick={() => setActiveTab("create")} className={`${PRIMARY} mt-1`}>
                  <Plus size={13} /> Create footer settings
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── create / edit ────────────────────────────────────────────────── */}
        {(activeTab === "create" || activeTab === "edit") && (
          <div className="space-y-4">
            <section className={CARD}>
              <div className={SECTION_HEAD}>
                <div>
                  <h2 className="text-sm font-semibold text-[#0D1B2E]">
                    {isEditing ? "Edit footer settings" : "Create footer settings"}
                  </h2>
                  <p className="mt-0.5 text-[11px] text-[#7A90AB]">
                    {isEditing
                      ? "Update the company information shown in the footer."
                      : "Fill in the company details to create the footer configuration."}
                  </p>
                </div>
                <span className="rounded-full bg-[#F0F9F0] px-2 py-0.5 text-[10px] font-semibold text-[#16A34A]">
                  {isEditing ? "editing" : "new"}
                </span>
              </div>

              <div className="space-y-5 px-4 py-4">
                {/* company */}
                <FormSection title="Company information" hint="Contact details and registration numbers.">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField id="companyName" name="companyName" label="Company name" required value={companyForm.companyName} onChange={handleCompanyInputChange} placeholder="e.g., Finix Mart" />
                    <TextField id="email" name="email" type="email" label="Email" required value={companyForm.email} onChange={handleCompanyInputChange} placeholder="e.g., support@finixmart.com.bd" />
                    <TextField id="phone1" name="phone1" label="Primary phone" required value={companyForm.phone1} onChange={handleCompanyInputChange} placeholder="e.g., +880 9647-415199" />
                    <TextField id="phone2" name="phone2" label="Secondary phone" value={companyForm.phone2} onChange={handleCompanyInputChange} placeholder="e.g., +880 1911-802804" />
                    <div className="sm:col-span-2">
                      <TextAreaField id="address" name="address" label="Address" required rows={2} value={companyForm.address} onChange={handleCompanyInputChange} placeholder="e.g., HM Hasem Mansion (6th Floor), Purana Paltan, Dhaka-1000." />
                    </div>
                    <TextField id="dbidNumber" name="dbidNumber" label="DBID number" required value={companyForm.dbidNumber} onChange={handleCompanyInputChange} placeholder="e.g., 567849" />
                    <TextField id="tradeLicense" name="tradeLicense" label="Trade licence" required value={companyForm.tradeLicense} onChange={handleCompanyInputChange} placeholder="e.g., E457/684" />
                  </div>
                </FormSection>

                {/* newsletter */}
                <FormSection title="Newsletter" hint="Heading and one-line description above the signup field.">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField id="newsletterTitle" name="newsletterTitle" label="Newsletter title" required value={companyForm.newsletterTitle} onChange={handleCompanyInputChange} placeholder="e.g., Let's keep in touch" />
                    <TextField id="newsletterDescription" name="newsletterDescription" label="Newsletter description" required value={companyForm.newsletterDescription} onChange={handleCompanyInputChange} placeholder="e.g., Get recommendations, tips, updates and more." />
                  </div>
                </FormSection>

                {/* social */}
                <FormSection title="Social media" hint="Only the links you fill in are rendered.">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField id="socialMediaTitle" name="socialMediaTitle" label="Section title" required value={companyForm.socialMediaTitle} onChange={handleCompanyInputChange} placeholder="e.g., Stay Connected" />
                    <div className="hidden sm:block" />
                    <TextField id="twitterUrl" name="twitterUrl" label="Twitter URL" value={companyForm.twitterUrl} onChange={handleCompanyInputChange} placeholder="https://twitter.com/yourpage" />
                    <TextField id="facebookUrl" name="facebookUrl" label="Facebook URL" value={companyForm.facebookUrl} onChange={handleCompanyInputChange} placeholder="https://facebook.com/yourpage" />
                    <TextField id="youtubeUrl" name="youtubeUrl" label="YouTube URL" value={companyForm.youtubeUrl} onChange={handleCompanyInputChange} placeholder="https://youtube.com/yourpage" />
                    <TextField id="instagramUrl" name="instagramUrl" label="Instagram URL" value={companyForm.instagramUrl} onChange={handleCompanyInputChange} placeholder="https://instagram.com/yourpage" />
                    <TextField id="whatsappUrl" name="whatsappUrl" label="WhatsApp URL" value={companyForm.whatsappUrl} onChange={handleCompanyInputChange} placeholder="https://wa.me/yourphone" />
                  </div>
                </FormSection>

                {/* bottom bar */}
                <FormSection title="Bottom bar" hint="Copyright line and the payment methods image.">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField id="copyrightText" name="copyrightText" label="Copyright text" required value={companyForm.copyrightText} onChange={handleCompanyInputChange} placeholder="e.g., Copyright © 2026 FinixMart, All rights reserved." />
                    <TextField id="paymentBannerImage" name="paymentBannerImage" label="Payment banner image" required value={companyForm.paymentBannerImage} onChange={handleCompanyInputChange} placeholder="e.g., /footer/sslcommerz-banner.png" />
                  </div>
                </FormSection>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F0F4FA] px-4 py-3">
                <button type="button" onClick={handleCancel} className={GHOST}>
                  <X size={12} /> Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCompanyInfo}
                  disabled={isCreating || isUpdating}
                  className={PRIMARY}
                >
                  {(isCreating || isUpdating) ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  {isCreating || isUpdating
                    ? "Saving…"
                    : isEditing
                      ? "Update settings"
                      : "Create settings"}
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ── columns ──────────────────────────────────────────────────────── */}
        {activeTab === "columns" && (
          <section className={CARD}>
            <div className={SECTION_HEAD}>
              <div>
                <h2 className="text-sm font-semibold text-[#0D1B2E]">Columns & links</h2>
                <p className="mt-0.5 text-[11px] text-[#7A90AB]">
                  Add, rename, hide or delete link groups. Order uses each link’s display order.
                </p>
              </div>
              <button type="button" onClick={() => handleOpenColumnDialog()} className={PRIMARY}>
                <Plus size={13} /> Add column
              </button>
            </div>

            <div className="px-4 py-3.5">
              {!footerSettings?.columns.length ? (
                <p className="rounded-[10px] border border-dashed border-[#E5EAF2] bg-[#FAFBFD] px-3 py-6 text-center text-[11.5px] text-[#7A90AB]">
                  No columns yet. Add the first one to start grouping links.
                </p>
              ) : (
                <div className="space-y-3">
                  {footerSettings.columns.map((column) => (
                    <div key={column.id} className="overflow-hidden rounded-[12px] border border-[#E5EAF2]">
                      <div className="flex flex-wrap items-center gap-2 border-b border-[#F0F4FA] bg-[#FAFBFD] px-3 py-2.5">
                        <p className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-[#0D1B2E]">
                          {column.title}
                        </p>
                        {!column.isVisible && (
                          <span className="rounded-full bg-[#EEF3FB] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#7A90AB]">
                            hidden
                          </span>
                        )}
                        <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#3D5068] ring-1 ring-[#E5EAF2]">
                          {column.elements.length} links
                        </span>

                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => handleOpenColumnDialog(column)} aria-label="Edit column" className={ICON_BTN}>
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleColumnVisibility(column)}
                            aria-label={column.isVisible ? "Hide column" : "Show column"}
                            className={ICON_BTN}
                          >
                            {column.isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenElementDialog(column.id)}
                            aria-label="Add link to column"
                            className={ICON_BTN}
                          >
                            <Plus size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteColumn(column.id)}
                            aria-label="Delete column"
                            className={`${ICON_BTN} hover:bg-[#FEF2F2] hover:text-[#DC2626]`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="px-3 py-2.5">
                        {column.elements.length === 0 ? (
                          <p className="text-[11px] italic text-[#9BAABB]">No links in this column yet.</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {[...column.elements]
                              .sort((a, b) => a.displayOrder - b.displayOrder)
                              .map((element) => (
                                <li
                                  key={element.id}
                                  className="flex items-center gap-2 rounded-[10px] border border-[#F0F4FA] px-2.5 py-1.5 transition hover:bg-[#FAFBFD]"
                                >
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#EEF3FB] text-[9.5px] font-bold text-[#3D5068] tabular-nums">
                                    {element.displayOrder}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className={`truncate text-[12px] font-medium ${element.isVisible ? "text-[#0D1B2E]" : "text-[#9BAABB] line-through"}`}>
                                      {element.label}
                                    </p>
                                    <p className="truncate text-[10.5px] text-[#9BAABB]">{element.url}</p>
                                  </div>
                                  {element.openInNewTab && (
                                    <span className="shrink-0 rounded-full border border-[#E5EAF2] px-1.5 py-0.5 text-[9px] font-semibold text-[#7A90AB]">
                                      new tab
                                    </span>
                                  )}
                                  {!element.isVisible && (
                                    <span className="shrink-0 rounded-full bg-[#EEF3FB] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#7A90AB]">
                                      hidden
                                    </span>
                                  )}
                                  <div className="flex shrink-0 items-center gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleElementVisibility(element)}
                                      aria-label={element.isVisible ? "Hide link" : "Show link"}
                                      className={ICON_BTN}
                                    >
                                      {element.isVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenElementDialog(column.id, element)}
                                      aria-label="Edit link"
                                      className={ICON_BTN}
                                    >
                                      <Pencil size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteElement(element.id)}
                                      aria-label="Delete link"
                                      className={`${ICON_BTN} hover:bg-[#FEF2F2] hover:text-[#DC2626]`}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* ── column modal ───────────────────────────────────────────────────── */}
      {isColumnDialogOpen && (
        <Modal
          title={editingColumn ? "Edit column" : "Add new column"}
          description={
            editingColumn
              ? "Update the column title or hide it from the footer."
              : "A column is just a heading — add the links after saving."
          }
          onClose={() => setIsColumnDialogOpen(false)}
          footer={
            <>
              <button type="button" onClick={() => setIsColumnDialogOpen(false)} className={GHOST}>
                Cancel
              </button>
              <button type="button" onClick={handleSaveColumn} className={PRIMARY}>
                {editingColumn ? "Update" : "Create"}
              </button>
            </>
          }
        >
          <label className="block">
            <span className={LABEL}>
              Column title <span className="text-[#DC2626]">*</span>
            </span>
            <input
              id="column-title"
              value={columnForm.title}
              onChange={(e) => setColumnForm({ ...columnForm, title: e.target.value })}
              placeholder="e.g., Customer Service"
              className={`${FIELD} mt-1.5`}
            />
          </label>

          <ToggleRow
            id="column-visible"
            checked={columnForm.isVisible}
            onChange={(checked) => setColumnForm({ ...columnForm, isVisible: checked })}
            label="Visible in the footer"
            hint="Hidden columns keep their links but are not rendered."
          />
        </Modal>
      )}

      {/* ── element modal ──────────────────────────────────────────────────── */}
      {isElementDialogOpen && (
        <Modal
          title={editingElement ? "Edit link" : "Add new link"}
          description={
            editingElement
              ? "Update the label, destination or ordering of this link."
              : "Links appear in the order set below."
          }
          onClose={() => setIsElementDialogOpen(false)}
          footer={
            <>
              <button type="button" onClick={() => setIsElementDialogOpen(false)} className={GHOST}>
                Cancel
              </button>
              <button type="button" onClick={handleSaveElement} className={PRIMARY}>
                {editingElement ? "Update" : "Create"}
              </button>
            </>
          }
        >
          <label className="block">
            <span className={LABEL}>
              Label <span className="text-[#DC2626]">*</span>
            </span>
            <input
              id="element-label"
              value={elementForm.label}
              onChange={(e) => setElementForm({ ...elementForm, label: e.target.value })}
              placeholder="e.g., About Us"
              className={`${FIELD} mt-1.5`}
            />
          </label>

          <label className="block">
            <span className={LABEL}>
              URL <span className="text-[#DC2626]">*</span>
            </span>
            <input
              id="element-url"
              value={elementForm.url}
              onChange={(e) => setElementForm({ ...elementForm, url: e.target.value })}
              placeholder="e.g., /about"
              className={`${FIELD} mt-1.5`}
            />
          </label>

          <label className="block">
            <span className={LABEL}>Display order</span>
            <input
              id="element-order"
              type="number"
              value={elementForm.displayOrder}
              onChange={(e) =>
                setElementForm({
                  ...elementForm,
                  displayOrder: parseInt(e.target.value) || 0,
                })
              }
              placeholder="0"
              className={`${FIELD} mt-1.5`}
            />
          </label>

          <ToggleRow
            id="element-visible"
            checked={elementForm.isVisible}
            onChange={(checked) => setElementForm({ ...elementForm, isVisible: checked })}
            label="Visible in the footer"
            hint="Hidden links stay editable here but are not rendered."
          />

          <ToggleRow
            id="element-new-tab"
            checked={elementForm.openInNewTab}
            onChange={(checked) => setElementForm({ ...elementForm, openInNewTab: checked })}
            label="Open in a new tab"
            hint="Adds target=_blank with a safe rel on the storefront link."
          />
        </Modal>
      )}
    </div>
  );
}

/* ── shared presentational pieces (page-local, plain Tailwind) ─────────────── */

function Field({
  label,
  value,
  icon,
  multiline = false,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  multiline?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-[10px] border border-[#F0F4FA] bg-[#FAFBFD] px-3 py-2">
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#9BAABB]">
        {icon} {label}
      </p>
      <p className={`mt-0.5 text-[12.5px] text-[#0D1B2E] ${multiline ? "whitespace-pre-line leading-relaxed" : "truncate"}`}>
        {value || <span className="text-[#C3CFDF]">—</span>}
      </p>
    </div>
  );
}

function FormSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[12px] border border-[#E5EAF2] p-3.5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-1">
        <h3 className="text-[12.5px] font-semibold text-[#0D1B2E]">{title}</h3>
        <p className="text-[10.5px] text-[#9BAABB]">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function TextField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className={LABEL}>
        {label} {required && <span className="text-[#DC2626]">*</span>}
      </span>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${FIELD} mt-1.5`}
      />
    </label>
  );
}

function TextAreaField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  required = false,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className={LABEL}>
        {label} {required && <span className="text-[#DC2626]">*</span>}
      </span>
      <textarea
        id={id}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${FIELD} mt-1.5 resize-y leading-relaxed`}
      />
    </label>
  );
}

function ToggleRow({
  id,
  checked,
  onChange,
  label,
  hint,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-[12px] border border-[#E5EAF2] px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="text-[12px] font-semibold text-[#0D1B2E]">{label}</p>
        <p className="mt-0.5 text-[10.5px] leading-relaxed text-[#7A90AB]">{hint}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-[#8B5CF6]/25 ${
          checked ? "bg-gradient-to-r from-[#2563EB] to-[#8B5CF6]" : "bg-[#D5DEEC]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
            checked ? "left-[1.375rem]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function Modal({
  title,
  description,
  onClose,
  footer,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6" role="presentation">
      <button type="button" aria-label="Close dialog" onClick={onClose} className="absolute inset-0 bg-[#0D1B2E]/40 backdrop-blur-[2px]" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[18px] border border-[#E5EAF2] bg-white shadow-2xl sm:rounded-[18px]"
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <header className="flex items-start justify-between gap-3 border-b border-[#F0F4FA] bg-[#FAFBFD] px-4 py-3.5">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[#0D1B2E]">{title}</h2>
            <p className="mt-0.5 text-[11px] leading-relaxed text-[#7A90AB]">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-[10px] p-1.5 text-[#9BAABB] transition hover:bg-white hover:text-[#3D5068] focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/30"
          >
            <X size={15} />
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">{children}</div>

        <footer className="flex items-center justify-end gap-2 border-t border-[#F0F4FA] bg-white px-4 py-3">
          {footer}
        </footer>
      </div>
    </div>
  );
}
