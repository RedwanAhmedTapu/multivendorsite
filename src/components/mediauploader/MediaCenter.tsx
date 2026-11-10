"use client";
import React, { useState, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { format } from "date-fns";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FolderOpen, Folder as FolderIcon, X, Search, CheckSquare, Square,
  FolderUp, Image as ImageIcon, Video as VideoIcon, Check,
} from "lucide-react";

import {
  useGetFoldersQuery,
  useGetVendorFilesQuery,
  useGetProductImagesFromR2Query,
  type Folder,
} from "@/features/vendorManageApi";

// ── Palette (matches AddProductForm / VendorFileManager) ──────────────────
const C = {
  bg: "#F0F4FA",
  border: "#E5EAF2",
  borderSoft: "#F0F4FA",
  headerBg: "#FAFBFD",
  title: "#0D1B2E",
  label: "#3D5068",
  hint: "#7A90AB",
  muted: "#9BAABB",
  slate: "#64748B",
  primary: "#1D4ED8",
  cyan: "#0891B2",
  gradient: "linear-gradient(135deg,#1D4ED8,#0891B2)",
  green: "#16A34A",
  greenBg: "#F0F9F0",
  greenBorder: "#BBF7D0",
  red: "#DC2626",
  redBg: "#FEF2F2",
  redBorder: "#FECACA",
};

const PLACEHOLDER_IMAGE = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0MEg2MFY2MEg0MFY0MFoiIGZpbGw9IiNEOEQ5REIiLz4KPC9zdmc+";

const StableImage = React.memo(({ src, alt, style }: { src: string; alt: string; style?: React.CSSProperties }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  React.useEffect(() => { setImgSrc(src); setHasError(false); }, [src]);
  return (
    <img
      src={imgSrc}
      alt={alt}
      style={style}
      loading="lazy"
      draggable={false}
      onError={() => { if (!hasError) { setHasError(true); setImgSrc(PLACEHOLDER_IMAGE); } }}
    />
  );
});
StableImage.displayName = "StableImage";

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "primary" }) {
  const styles: Record<string, React.CSSProperties> = {
    neutral: { background: "#F1F5F9", color: C.label, border: `1px solid ${C.border}` },
    primary: { background: "#EEF3FB", color: C.primary, border: `1px solid #DCE6F7` },
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, ...styles[tone] }}>
      {children}
    </span>
  );
}

export interface MediaCenterItem {
  url: string;
  name: string;
}

interface MediaCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What kind of media to browse — images (vendor files + product images) or videos (vendor files only). */
  fileType?: "IMAGE" | "VIDEO";
  /** Allow picking more than one item. When false, clicking an item confirms immediately. */
  multiple?: boolean;
  /** Cap on how many items can be selected at once (only relevant when multiple is true). */
  maxSelect?: number;
  /** Called with the chosen item(s) once the user confirms (or clicks, in single mode). */
  onSelect: (items: MediaCenterItem[]) => void;
  title?: string;
  description?: string;
}

interface UnifiedItem {
  uid: string;
  kind: "file" | "product";
  name: string;
  url: string;
  size: number | string;
  date?: string | null;
  folderId?: string | null;
}

export default function MediaCenter({
  open,
  onOpenChange,
  fileType = "IMAGE",
  multiple = false,
  maxSelect,
  onSelect,
  title,
  description,
}: MediaCenterProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const vendorId = user?.vendorId;

  const [currentFolderId, setCurrentFolderId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());

  const isRoot = !currentFolderId;
  const isImageMode = fileType === "IMAGE";

  // ── Data ─────────────────────────────────────────────────────────────────

  const { data: foldersData, isLoading: foldersLoading } = useGetFoldersQuery(undefined, { skip: !vendorId || !open });
  const folders: Folder[] = useMemo(() => foldersData ?? [], [foldersData]);

  const { data: filesData, isLoading: filesLoading } = useGetVendorFilesQuery(
    {
      vendorId: vendorId || "",
      fileType,
      page: 1,
      limit: 200,
      ...(currentFolderId ? { folderId: currentFolderId } : {}),
      excludeProductFiles: true,
    },
    { skip: !vendorId || !open }
  );

  const { data: r2ProductData, isLoading: r2Loading } = useGetProductImagesFromR2Query(undefined, {
    skip: !vendorId || !open || !isRoot || !isImageMode,
  });

  const isLoadingAny = filesLoading || (isRoot && isImageMode && r2Loading);

  // ── Derived ──────────────────────────────────────────────────────────────

  const currentDirectoryFolders = useMemo(() => {
    if (!folders.length) return [];
    const list = isRoot ? folders : folders.filter((f) => f.parentId === currentFolderId);
    const sorted = list.slice().sort((a, b) => a.name.localeCompare(b.name));
    if (!searchQuery.trim()) return sorted;
    const q = searchQuery.toLowerCase();
    return sorted.filter((f) => f.name.toLowerCase().includes(q));
  }, [folders, currentFolderId, isRoot, searchQuery]);

  const getFolderPath = useCallback((folder: Folder): string => {
    const parts: string[] = [];
    let parentId = folder.parentId;
    while (parentId) {
      const parent = folders.find((f) => f.id === parentId);
      if (!parent) break;
      parts.unshift(parent.name);
      parentId = parent.parentId;
    }
    return parts.join(" / ");
  }, [folders]);

  const unifiedItems: UnifiedItem[] = useMemo(() => {
    const fileItems: UnifiedItem[] = (filesData?.files ?? []).map((f: any) => ({
      uid: `file:${f.id}`,
      kind: "file",
      name: f.fileName,
      url: f.r2Url,
      size: f.fileSize,
      date: f.createdAt,
      folderId: f.folderId ?? null,
    }));

    const productItems: UnifiedItem[] = isRoot && isImageMode
      ? (r2ProductData?.files ?? []).map((img: any) => ({
          uid: `product:${img.key}`,
          kind: "product",
          name: img.key.split("/").pop() || "image",
          url: img.url,
          size: img.size,
          date: img.lastModified,
          folderId: null,
        }))
      : [];

    return [...fileItems, ...productItems];
  }, [filesData?.files, r2ProductData, isRoot, isImageMode]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return unifiedItems;
    const q = searchQuery.toLowerCase();
    return unifiedItems.filter((it) => it.name.toLowerCase().includes(q));
  }, [unifiedItems, searchQuery]);

  const getItemFolderLabel = useCallback((item: UnifiedItem): string => {
    if (item.kind === "product") return "Product";
    if (!item.folderId) return "Root";
    return folders.find((f) => f.id === item.folderId)?.name ?? "Root";
  }, [folders]);

  const breadcrumbChain = useMemo(() => {
    if (!currentFolderId) return [];
    const chain: Folder[] = [];
    let cursor = folders.find((f) => f.id === currentFolderId) ?? null;
    while (cursor) {
      chain.unshift(cursor);
      cursor = cursor.parentId ? folders.find((f) => f.id === cursor!.parentId) ?? null : null;
    }
    return chain;
  }, [currentFolderId, folders]);

  const currentFolderName = useMemo(() => {
    if (!currentFolderId) return "All Media";
    return folders.find((f) => f.id === currentFolderId)?.name ?? "Unknown Folder";
  }, [currentFolderId, folders]);

  // ── Navigation ───────────────────────────────────────────────────────────

  const navigateToFolder = useCallback((folderId: string) => {
    setCurrentFolderId(folderId);
    setSearchQuery("");
  }, []);

  const navigateUp = useCallback(() => {
    if (!currentFolderId) return;
    const current = folders.find((f) => f.id === currentFolderId);
    setCurrentFolderId(current?.parentId ?? "");
  }, [currentFolderId, folders]);

  // ── Selection ────────────────────────────────────────────────────────────

  const finalizeSelection = useCallback((uids: string[]) => {
    const byUid = new Map(unifiedItems.map((it) => [it.uid, it]));
    const items: MediaCenterItem[] = uids
      .map((uid) => byUid.get(uid))
      .filter((it): it is UnifiedItem => !!it)
      .map((it) => ({ url: it.url, name: it.name }));
    if (!items.length) return;
    onSelect(items);
    setSelectedUids(new Set());
    setSearchQuery("");
    onOpenChange(false);
  }, [unifiedItems, onSelect, onOpenChange]);

  const handleItemClick = useCallback((uid: string) => {
    if (!multiple) {
      finalizeSelection([uid]);
      return;
    }
    setSelectedUids((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        if (maxSelect && next.size >= maxSelect) return prev;
        next.add(uid);
      }
      return next;
    });
  }, [multiple, finalizeSelection, maxSelect]);

  const handleClose = useCallback((next: boolean) => {
    if (!next) {
      setSelectedUids(new Set());
      setSearchQuery("");
      setCurrentFolderId("");
    }
    onOpenChange(next);
  }, [onOpenChange]);

  const formatFileSize = useCallback((size: string | number) => {
    const bytes = typeof size === "string" ? parseInt(size, 10) : size;
    if (isNaN(bytes)) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent style={{ maxWidth: 900, maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <DialogHeader>
          <DialogTitle style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700, color: C.title }}>
            {isImageMode ? <ImageIcon size={16} color={C.primary} /> : <VideoIcon size={16} color={C.primary} />}
            {title || (isImageMode ? "Choose from Media Center" : "Choose a Video")}
          </DialogTitle>
          <DialogDescription style={{ fontSize: 12, color: C.hint }}>
            {description || (multiple
              ? `Click items to select them${maxSelect ? ` (up to ${maxSelect})` : ""}, then confirm below.`
              : "Click an item to link it — no upload needed.")}
          </DialogDescription>
        </DialogHeader>

        {/* Breadcrumb + search */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: 8, background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 10, flex: 1, flexWrap: "wrap" }}>
            <button
              onClick={() => navigateToFolder("")}
              style={{ padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600, background: !currentFolderId ? "#EEF3FB" : "transparent", color: !currentFolderId ? C.primary : C.label }}
            >
              Root
            </button>
            {breadcrumbChain.length > 0 && (
              <>
                <span style={{ color: C.muted }}>/</span>
                <button onClick={navigateUp} style={{ padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: C.label, display: "flex", alignItems: "center", gap: 4 }}>
                  <FolderUp className="w-3 h-3" /> ...
                </button>
              </>
            )}
            {breadcrumbChain.map((folder, i) => (
              <React.Fragment key={folder.id}>
                <span style={{ color: C.muted }}>/</span>
                {i === breadcrumbChain.length - 1 ? (
                  <Pill tone="primary"><FolderOpen className="w-3 h-3" /> {folder.name}</Pill>
                ) : (
                  <button onClick={() => navigateToFolder(folder.id)} style={{ padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: C.label, background: "transparent" }}>
                    {folder.name}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>
          <div style={{ position: "relative", width: 200 }}>
            <Search size={13} color={C.muted} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <Input placeholder="Search…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingLeft: 28, fontSize: 12.5 }} />
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", flex: 1, paddingRight: 4 }}>
          {/* Folders */}
          {foldersLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${C.border}`, borderBottomColor: C.primary, animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : currentDirectoryFolders.length > 0 ? (
            <div style={{ marginBottom: 18 }}>
              <h4 style={{ fontSize: 11.5, fontWeight: 700, color: C.title, marginBottom: 8 }}>
                {isRoot ? "All Folders" : "Folders"} ({currentDirectoryFolders.length})
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
                {currentDirectoryFolders.map((folder) => {
                  const path = isRoot ? getFolderPath(folder) : "";
                  return (
                    <div
                      key={folder.id}
                      onClick={() => navigateToFolder(folder.id)}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 8px", border: `1.5px solid ${C.border}`, borderRadius: 10, cursor: "pointer", background: "#fff", transition: "all 0.15s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.primary; (e.currentTarget as HTMLElement).style.background = "#EEF3FB"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.background = "#fff"; }}
                    >
                      <FolderOpen className="w-8 h-8 mb-1.5" style={{ color: "#F5B942" }} />
                      <p style={{ fontSize: 11.5, fontWeight: 600, color: C.title, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }} title={folder.name}>{folder.name}</p>
                      {path && <p style={{ fontSize: 9, color: C.muted, marginTop: 1, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }} title={path}>in {path}</p>}
                      <p style={{ fontSize: 9.5, color: C.hint, marginTop: 2 }}>{folder.fileCount} file{folder.fileCount === 1 ? "" : "s"}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Items */}
          <div>
            <h4 style={{ fontSize: 11.5, fontWeight: 700, color: C.title, marginBottom: 8 }}>
              {currentFolderName} ({filteredItems.length} item{filteredItems.length === 1 ? "" : "s"})
            </h4>

            {isLoadingAny ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", border: `3px solid ${C.border}`, borderBottomColor: C.primary, animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : filteredItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: 30, color: C.hint, border: `1.5px dashed ${C.border}`, borderRadius: 12 }}>
                {isImageMode ? <ImageIcon className="w-9 h-9 mx-auto mb-2" style={{ opacity: 0.4 }} /> : <VideoIcon className="w-9 h-9 mx-auto mb-2" style={{ opacity: 0.4 }} />}
                <p style={{ fontSize: 12.5, fontWeight: 600, color: C.label }}>Nothing here yet</p>
                <p style={{ fontSize: 11, marginTop: 3 }}>Upload {isImageMode ? "images" : "a video"} first from the File Manager or the uploader above.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
                {filteredItems.map((item) => {
                  const isSelected = selectedUids.has(item.uid);
                  return (
                    <div
                      key={item.uid}
                      onClick={() => handleItemClick(item.uid)}
                      style={{
                        position: "relative", borderRadius: 10, overflow: "hidden", cursor: "pointer",
                        border: `2px solid ${isSelected ? C.primary : "transparent"}`,
                        boxShadow: isSelected ? "0 4px 12px rgba(29,78,216,0.15)" : "0 1px 3px rgba(0,0,0,0.04)",
                        background: "#fff", transition: "all 0.15s",
                      }}
                    >
                      <div style={{ aspectRatio: "1/1", background: "#F1F5F9", position: "relative" }}>
                        {isImageMode ? (
                          <StableImage src={item.url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <video src={item.url} muted preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )}
                        <span style={{ position: "absolute", bottom: 4, left: 4 }}>
                          <Pill tone={item.kind === "product" ? "primary" : "neutral"}>{getItemFolderLabel(item)}</Pill>
                        </span>
                        {multiple && (
                          <div style={{ position: "absolute", top: 6, left: 6, width: 22, height: 22, borderRadius: 6, background: "rgba(255,255,255,0.92)", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {isSelected ? <CheckSquare className="w-3.5 h-3.5" style={{ color: C.primary }} /> : <Square className="w-3.5 h-3.5" style={{ color: C.muted }} />}
                          </div>
                        )}
                        {!multiple && isSelected && (
                          <div style={{ position: "absolute", inset: 0, background: "rgba(29,78,216,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Check size={15} color="#fff" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{ padding: 6, borderTop: `1px solid ${C.borderSoft}` }}>
                        <p style={{ fontSize: 10.5, fontWeight: 600, color: C.title, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.name}>{item.name}</p>
                        <p style={{ fontSize: 9.5, color: C.hint }}>
                          {formatFileSize(item.size)}{item.date ? ` • ${format(new Date(item.date), "MMM d")}` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {multiple && (
          <DialogFooter style={{ borderTop: `1px solid ${C.borderSoft}`, paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span style={{ fontSize: 11.5, color: C.hint, marginRight: "auto" }}>
              {selectedUids.size} selected{maxSelect ? ` / ${maxSelect}` : ""}
            </span>
            <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
            <Button
              onClick={() => finalizeSelection(Array.from(selectedUids))}
              disabled={selectedUids.size === 0}
              style={{ background: C.gradient, border: "none" }}
            >
              Add {selectedUids.size || ""} Selected
            </Button>
          </DialogFooter>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </DialogContent>
    </Dialog>
  );
}