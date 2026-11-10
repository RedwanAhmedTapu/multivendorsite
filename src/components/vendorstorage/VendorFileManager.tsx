"use client";
import React, { useState, useMemo, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  FolderPlus, Upload, Move, Trash2, CheckSquare, Square, Grid3x3, List,
  FolderOpen, Folder as FolderIcon, X, Copy, Edit, Download, MoreVertical,
  Image as ImageIcon, FolderUp, ChevronRight, ChevronDown, GripVertical,
} from "lucide-react";

import {
  useGetFoldersQuery,
  useCreateFolderMutation,
  useRenameFolderMutation,
  useDeleteFolderMutation,
  useMoveFilesToFolderMutation,
  useGetVendorFilesQuery,
  useGetProductImagesFromR2Query,
  useUploadMultipleFilesMutation,
  useDeleteFileMutation,
  type Folder,
} from "@/features/vendorManageApi";

type ViewMode = "grid" | "list";

const PLACEHOLDER_IMAGE = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0MEg2MFY2MEg0MFY0MFoiIGZpbGw9IiNEOEQ5REIiLz4KPC9zdmc+";

// ── Palette (matches AddProductForm) ──────────────────────────────────────
const C = {
  bg: "#F0F4FA",
  panel: "#fff",
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
  amber: "#D97706",
};

// ── Sonner-based confirmation helper (replaces native window.confirm) ────
// Shows a toast with "Confirm" / "Cancel" actions and resolves a Promise<boolean>
// once the user picks one, dismisses it, or lets it auto-close.
function confirmToast(message: string, options?: { confirmLabel?: string; description?: string }): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    toast(message, {
      description: options?.description,
      duration: 12000,
      action: {
        label: options?.confirmLabel || "Confirm",
        onClick: () => settle(true),
      },
      cancel: {
        label: "Cancel",
        onClick: () => settle(false),
      },
      onDismiss: () => settle(false),
      onAutoClose: () => settle(false),
    });
  });
}

// ── Stable image component (prevents infinite re-render loops on error) ──
const StableImage = React.memo(({ src, alt, className, style, onError }: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(PLACEHOLDER_IMAGE);
      onError?.(e);
    }
  }, [hasError, onError]);

  React.useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  return (
    <img src={imgSrc} alt={alt} className={className} style={style} onError={handleError} loading="lazy" draggable={false} />
  );
});
StableImage.displayName = 'StableImage';

// ── Folder tree node type for the Move dialog ──
interface FolderTreeNode extends Folder {
  children: FolderTreeNode[];
}

function buildFolderTree(folders: Folder[]): FolderTreeNode[] {
  const byId = new Map<string, FolderTreeNode>();
  folders.forEach((f) => byId.set(f.id, { ...f, children: [] }));

  const roots: FolderTreeNode[] = [];
  byId.forEach((node) => {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortRec = (nodes: FolderTreeNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);

  return roots;
}

// ── Unified item: merges vendor-uploaded files + Cloudflare R2 product images ──
interface UnifiedItem {
  uid: string;        // "file:<id>" or "product:<r2 key>" — unique in the UI
  kind: "file" | "product";
  realId: string;      // actual id/key sent to the backend
  name: string;
  url: string;
  size: number | string;
  date?: string | null;
  folderId?: string | null; // which folder the file lives in (null = root); products have no folder
}

// ── Small styled pill used for status/info chips ──
function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "primary" | "danger" }) {
  const styles: Record<string, React.CSSProperties> = {
    neutral: { background: "#F1F5F9", color: C.label, border: `1px solid ${C.border}` },
    primary: { background: "#EEF3FB", color: C.primary, border: `1px solid #DCE6F7` },
    danger: { background: C.redBg, color: C.red, border: `1px solid ${C.redBorder}` },
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: 20,
        ...styles[tone],
      }}
    >
      {children}
    </span>
  );
}

// ── Panel shell — mirrors SectionCard styling from AddProductForm ──
function Panel({
  icon, title, subtitle, right, children,
}: {
  icon: React.ReactNode; title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div style={{ background: C.panel, border: `1.5px solid ${C.border}`, borderRadius: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 18px", borderBottom: `1px solid ${C.borderSoft}`, background: C.headerBg,
          borderRadius: "12px 12px 0 0", flexWrap: "wrap", gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "#EEF3FB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: C.title, letterSpacing: "-0.2px" }}>{title}</div>
            {subtitle && <div style={{ fontSize: 11, color: C.hint, marginTop: 1 }}>{subtitle}</div>}
          </div>
        </div>
        {right}
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}

// ── Recursive tree row for the Move dialog ──
function FolderTreeRow({
  node, depth, selectedId, onSelect, expandedIds, onToggleExpand, disabledIds,
}: {
  node: FolderTreeNode;
  depth: number;
  selectedId: string;
  onSelect: (id: string) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  disabledIds: Set<string>;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const isDisabled = disabledIds.has(node.id);

  return (
    <div>
      <div
        style={{
          display: "flex", alignItems: "center", gap: 4, padding: "6px 4px", borderRadius: 8,
          cursor: isDisabled ? "not-allowed" : "pointer", fontSize: 13,
          paddingLeft: depth * 18 + 4,
          background: isSelected ? "#EEF3FB" : "transparent",
          color: isSelected ? C.primary : C.label,
          fontWeight: isSelected ? 600 : 500,
          opacity: isDisabled ? 0.4 : 1,
        }}
        onClick={() => !isDisabled && onSelect(node.id)}
      >
        <button
          onClick={(e) => { e.stopPropagation(); if (hasChildren) onToggleExpand(node.id); }}
          style={{ width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "none", border: "none", cursor: "pointer" }}
        >
          {hasChildren ? (isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />) : null}
        </button>
        {isSelected ? <FolderOpen className="w-4 h-4 flex-shrink-0" style={{ color: C.primary }} /> : <FolderIcon className="w-4 h-4 flex-shrink-0" style={{ color: "#F5B942" }} />}
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{node.name}</span>
        <span style={{ fontSize: 11, color: C.muted, marginRight: 6 }}>{node.fileCount}</span>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <FolderTreeRow key={child.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} expandedIds={expandedIds} onToggleExpand={onToggleExpand} disabledIds={disabledIds} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function VendorFileManager() {
  const { user } = useSelector((state: RootState) => state.auth);
  const vendorId = user?.vendorId;

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());
  const [currentFolderId, setCurrentFolderId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const [createFolderDialog, setCreateFolderDialog] = useState(false);
  const [renameFolderDialog, setRenameFolderDialog] = useState(false);
  const [moveDialog, setMoveDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameFolderName, setRenameFolderName] = useState("");
  const [selectedFolderToRename, setSelectedFolderToRename] = useState<string | null>(null);
  const [targetFolderId, setTargetFolderId] = useState<string>("");
  const [expandedTreeIds, setExpandedTreeIds] = useState<Set<string>>(new Set());

  // ── drag & drop state ──
  const [draggedUids, setDraggedUids] = useState<string[] | null>(null);
  const [hoveredFolderId, setHoveredFolderId] = useState<string | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isRoot = !currentFolderId;

  // ── API Hooks ──────────────────────────────────────────────────────────

  const {
    data: foldersData,
    refetch: refetchFolders,
    isLoading: foldersLoading,
    error: foldersError,
  } = useGetFoldersQuery(undefined, { skip: !vendorId, refetchOnMountOrArgChange: true });

  const [createFolder] = useCreateFolderMutation();
  const [renameFolder] = useRenameFolderMutation();
  const [deleteFolder] = useDeleteFolderMutation();
  const [moveFilesToFolder, { isLoading: isMovingFiles }] = useMoveFilesToFolderMutation();

  const {
    data: filesData,
    refetch: refetchFiles,
    isLoading: filesLoading,
  } = useGetVendorFilesQuery(
    {
      vendorId: vendorId || "",
      fileType: "IMAGE",
      page: 1,
      limit: 100,
      // At root we want EVERY file across every folder (not just root-level ones),
      // so folderId is omitted entirely — the backend should treat a missing
      // folderId as "return all of this vendor's files". Inside a folder we still
      // scope the request to that folder only.
      ...(currentFolderId ? { folderId: currentFolderId } : {}),
      excludeProductFiles: true,
    },
    { skip: !vendorId }
  );

  // Product images pulled directly from Cloudflare R2 — only relevant at root,
  // since product images don't live inside any vendor-created folder yet.
  const {
    data: r2ProductData,
    isLoading: r2Loading,
    refetch: refetchR2Images,
  } = useGetProductImagesFromR2Query(undefined, { skip: !vendorId || !isRoot });

  const [deleteFile] = useDeleteFileMutation();
  const [uploadFiles, { isLoading: isUploading }] = useUploadMultipleFilesMutation();

  // ── Derived data ───────────────────────────────────────────────────────

  const folders: Folder[] = useMemo(() => foldersData ?? [], [foldersData]);
  const folderTree = useMemo(() => buildFolderTree(folders), [folders]);

  // At root, show EVERY folder that exists (flat), no matter how deeply nested —
  // not just top-level ones. Inside a folder, show only its direct children as before.
  const currentDirectoryFolders = useMemo(() => {
    if (!folders.length) return [];
    const list = isRoot ? folders : folders.filter((folder) => folder.parentId === currentFolderId);
    return list.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [folders, currentFolderId, isRoot]);

  // Full "Parent / Child" path for a folder, used to label nested folders when
  // they're shown flat at root.
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

  // Merge vendor files + R2 product images into a single unified list.
  // At root, EVERY file (regardless of which folder it lives in) and every
  // product image show together — there's no more separate, read-only
  // "Product Images" section, and no more root-only-files restriction.
 const unifiedItems: UnifiedItem[] = useMemo(() => {
  const fileItems: UnifiedItem[] = (filesData?.files ?? []).map((f: any) => ({
    uid: `file:${f.id}`,
    kind: "file",
    realId: f.id,
    name: f.fileName,
    url: f.r2Url,
    size: f.fileSize,
    date: f.createdAt,
    folderId: f.folderId ?? null,
  }));

  const fileUrls = new Set(fileItems.map((f) => f.url));

  const productItems: UnifiedItem[] = isRoot
    ? (r2ProductData?.files ?? [])
        .filter((img: any) => !fileUrls.has(img.url)) // dedupe against vendor files
        .map((img: any) => ({
          uid: `product:${img.key}`,
          kind: "product",
          realId: img.key,
          name: img.key.split("/").pop() || "image",
          url: img.url,
          size: img.size,
          date: img.lastModified,
          folderId: null,
        }))
    : [];

  return [...fileItems, ...productItems];
}, [filesData?.files, r2ProductData, isRoot]);

  // Where a file "lives", used only for the small location tag shown at root.
  const getItemFolderLabel = useCallback((item: UnifiedItem): string => {
    if (item.kind === "product") return "Product";
    if (!item.folderId) return "Root";
    return folders.find((f) => f.id === item.folderId)?.name ?? "Root";
  }, [folders]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return unifiedItems;
    const q = searchQuery.toLowerCase();
    return unifiedItems.filter((it) => it.name.toLowerCase().includes(q));
  }, [unifiedItems, searchQuery]);

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
    if (!currentFolderId) return "All Files";
    return folders.find((f) => f.id === currentFolderId)?.name ?? "Unknown Folder";
  }, [currentFolderId, folders]);

  const targetFolderName = useMemo(() => {
    if (!targetFolderId) return "Root";
    return folders.find((f) => f.id === targetFolderId)?.name ?? "Unknown Folder";
  }, [targetFolderId, folders]);

  // ── Selection handlers ──────────────────────────────────────────────────

  const toggleSelection = useCallback((uid: string) => {
    setSelectedUids((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedUids((prev) => (prev.size === filteredItems.length ? new Set() : new Set(filteredItems.map((f) => f.uid))));
  }, [filteredItems]);

  const clearSelection = useCallback(() => setSelectedUids(new Set()), []);

  const formatFileSize = useCallback((size: string | number) => {
    const bytes = typeof size === "string" ? parseInt(size, 10) : size;
    if (isNaN(bytes)) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }, []);

  // ── File actions ───────────────────────────────────────────────────────

  const handleDeleteItems = useCallback(async (uids: string[]) => {
    const confirmed = await confirmToast(`Delete ${uids.length} item(s)?`, {
      description: "This action cannot be undone.",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;
    try {
      const realIds = uids.map((uid) => uid.split(":").slice(1).join(":"));
      await Promise.all(realIds.map((id) => deleteFile(id).unwrap()));
      toast.success(`Deleted ${uids.length} item(s)`);
      setSelectedUids((prev) => {
        const next = new Set(prev);
        uids.forEach((u) => next.delete(u));
        return next;
      });
      refetchFiles();
      if (isRoot) refetchR2Images();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete item(s)");
    }
  }, [deleteFile, refetchFiles, refetchR2Images, isRoot]);

  const handleUpload = async (fileList: FileList) => {
    const formData = new FormData();
    Array.from(fileList).forEach((file) => formData.append("files", file));
    if (currentFolderId) formData.append("folderId", currentFolderId);

    try {
      await uploadFiles(formData).unwrap();
      toast.success(`Uploaded ${fileList.length} file(s)`);
      refetchFiles();
    } catch (error: any) {
      toast.error(error?.data?.message || "Upload failed");
    }
  };

  const handleDownload = useCallback((item: UnifiedItem) => {
    const link = document.createElement('a');
    link.href = item.url;
    link.download = item.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleCopyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url)
      .then(() => toast.success("URL copied to clipboard"))
      .catch(() => toast.error("Failed to copy URL"));
  }, []);

  // Shared move routine — used by both the Move dialog and drag & drop.
  const moveItemsToFolder = useCallback(async (uids: string[], destFolderId: string) => {
    if (!uids.length) return;
    const destName = destFolderId ? (folders.find((f) => f.id === destFolderId)?.name ?? "Unknown Folder") : "Root";

    // Skip items that are already sitting in the destination folder (compare each
    // item's actual current folder, not just the folder currently being viewed —
    // relevant now that root shows files from every folder at once).
    const itemsByUid = new Map(unifiedItems.map((it) => [it.uid, it]));
    const movableUids = uids.filter((uid) => {
      const it = itemsByUid.get(uid);
      if (!it || it.kind !== "file") return true;
      return (it.folderId || "") !== (destFolderId || "");
    });
    if (movableUids.length === 0) {
      toast.error("Item(s) already in this folder");
      return;
    }
    uids = movableUids;

    try {
      const realIds = uids.map((uid) => uid.split(":").slice(1).join(":"));
      await moveFilesToFolder({ fileIds: realIds, targetFolderId: destFolderId || null }).unwrap();

      setSelectedUids((prev) => {
        const next = new Set(prev);
        uids.forEach((u) => next.delete(u));
        return next;
      });

      await Promise.all([refetchFiles(), refetchFolders()]);
      if (isRoot) refetchR2Images();
      toast.success(`Moved ${uids.length} item(s) to ${destName}`);
    } catch (error: any) {
      console.error("Move items error:", error);
      toast.error(error?.data?.message || error?.message || "Failed to move item(s)");
    }
  }, [folders, unifiedItems, moveFilesToFolder, refetchFiles, refetchFolders, refetchR2Images, isRoot]);

  const handleMoveFiles = useCallback(async () => {
    if (selectedUids.size === 0) return;
    await moveItemsToFolder(Array.from(selectedUids), targetFolderId);
    setMoveDialog(false);
    setTargetFolderId("");
  }, [selectedUids, targetFolderId, moveItemsToFolder]);

  // ── Folder actions ────────────────────────────────────────────────────

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return toast.error("Folder name is required");
    try {
      await createFolder({ name: newFolderName.trim(), parentId: currentFolderId || null }).unwrap();
      toast.success(`Folder "${newFolderName}" created`);
      setCreateFolderDialog(false);
      setNewFolderName("");
      refetchFolders();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create folder");
    }
  }, [newFolderName, currentFolderId, createFolder, refetchFolders]);

  const handleRenameFolder = useCallback(async () => {
    if (!renameFolderName.trim() || !selectedFolderToRename) return;
    try {
      await renameFolder({ folderId: selectedFolderToRename, newName: renameFolderName.trim() }).unwrap();
      toast.success("Folder renamed successfully");
      setRenameFolderDialog(false);
      setRenameFolderName("");
      setSelectedFolderToRename(null);
      refetchFolders();
      refetchFiles();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to rename folder");
    }
  }, [renameFolderName, selectedFolderToRename, renameFolder, refetchFolders, refetchFiles]);

  const handleDeleteFolder = useCallback(async (folderId: string, folderName: string) => {
    const confirmed = await confirmToast(`Delete folder "${folderName}"?`, {
      description: "The folder must be empty (no files or subfolders).",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;
    try {
      await deleteFolder({ folderId }).unwrap();
      toast.success("Folder deleted successfully");
      if (currentFolderId === folderId) {
        const deleted = folders.find((f) => f.id === folderId);
        setCurrentFolderId(deleted?.parentId ?? "");
      }
      refetchFolders();
      refetchFiles();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete folder");
    }
  }, [folders, currentFolderId, deleteFolder, refetchFolders, refetchFiles]);

  const openRenameFolderDialog = useCallback((folder: Folder) => {
    setSelectedFolderToRename(folder.id);
    setRenameFolderName(folder.name);
    setRenameFolderDialog(true);
  }, []);

  const navigateToFolder = useCallback((folderId: string) => {
    setCurrentFolderId(folderId);
    clearSelection();
  }, [clearSelection]);

  const navigateToBreadcrumb = useCallback((folderId: string) => {
    setCurrentFolderId(folderId);
    clearSelection();
  }, [clearSelection]);

  const navigateUp = useCallback(() => {
    if (!currentFolderId) return;
    const current = folders.find((f) => f.id === currentFolderId);
    setCurrentFolderId(current?.parentId ?? "");
    clearSelection();
  }, [currentFolderId, folders, clearSelection]);

  const openMoveDialog = useCallback(() => {
    setTargetFolderId("");
    setExpandedTreeIds(new Set(breadcrumbChain.map((f) => f.id)));
    setMoveDialog(true);
  }, [breadcrumbChain]);

  const toggleTreeExpand = useCallback((id: string) => {
    setExpandedTreeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const moveDisabledIds = useMemo(() => new Set(currentFolderId ? [currentFolderId] : []), [currentFolderId]);

  // ── Drag & drop ──────────────────────────────────────────────────────────
  // Dragging an item that's part of the current selection drags the whole
  // selection; dragging an unselected item drags just that item.

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const handleItemDragStart = useCallback((e: React.DragEvent, uid: string) => {
    const uids = selectedUids.has(uid) && selectedUids.size > 0 ? Array.from(selectedUids) : [uid];
    setDraggedUids(uids);
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", JSON.stringify(uids)); } catch { /* noop */ }
  }, [selectedUids]);

  const handleItemDragEnd = useCallback(() => {
    setDraggedUids(null);
    setHoveredFolderId(null);
    clearHoverTimer();
  }, [clearHoverTimer]);

  const handleFolderDragEnter = useCallback((folderId: string) => {
    if (!draggedUids) return;
    setHoveredFolderId(folderId);
    clearHoverTimer();
    // Hover over a folder while dragging auto-opens it, like a native file explorer,
    // so the user can drop deep inside nested folders without releasing the drag.
    hoverTimerRef.current = setTimeout(() => {
      navigateToFolder(folderId);
      setHoveredFolderId(null);
    }, 700);
  }, [draggedUids, clearHoverTimer, navigateToFolder]);

  const handleFolderDragLeave = useCallback((folderId: string) => {
    setHoveredFolderId((prev) => (prev === folderId ? null : prev));
    clearHoverTimer();
  }, [clearHoverTimer]);

  const handleFolderDrop = useCallback(async (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    clearHoverTimer();
    setHoveredFolderId(null);
    let uids = draggedUids;
    if (!uids) {
      try { uids = JSON.parse(e.dataTransfer.getData("text/plain") || "[]"); } catch { uids = []; }
    }
    setDraggedUids(null);
    if (!uids || !uids.length) return;
    await moveItemsToFolder(uids, folderId);
  }, [draggedUids, clearHoverTimer, moveItemsToFolder]);

  const handleUpDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    clearHoverTimer();
    setHoveredFolderId(null);
    const uids = draggedUids ?? [];
    setDraggedUids(null);
    if (!uids.length || !currentFolderId) return;
    const current = folders.find((f) => f.id === currentFolderId);
    await moveItemsToFolder(uids, current?.parentId ?? "");
  }, [draggedUids, currentFolderId, folders, moveItemsToFolder, clearHoverTimer]);

  const handleRootDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    clearHoverTimer();
    setHoveredFolderId(null);
    const uids = draggedUids ?? [];
    setDraggedUids(null);
    if (!uids.length) return;
    await moveItemsToFolder(uids, "");
  }, [draggedUids, moveItemsToFolder, clearHoverTimer]);

  const isDragging = !!draggedUids && draggedUids.length > 0;

  // ── Item action menu (shared between grid & list views) ────────────────

  const ItemMenu = ({ item }: { item: UnifiedItem }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="secondary" className="h-6 w-6" style={{ background: "rgba(255,255,255,0.92)" }} onClick={(e) => e.stopPropagation()} disabled={isMovingFiles}>
          <MoreVertical className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleDownload(item)}>
          <Download className="w-4 h-4 mr-2" /> Download
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCopyUrl(item.url)}>
          <Copy className="w-4 h-4 mr-2" /> Copy URL
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem style={{ color: C.red }} onClick={() => handleDeleteItems([item.uid])}>
          <Trash2 className="w-4 h-4 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const isLoadingAny = filesLoading || (isRoot && r2Loading);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: C.bg, minHeight: "100vh", padding: "18px 20px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>

        <Panel
          icon={<ImageIcon size={15} color={C.primary} />}
          title="File Manager"
          subtitle="Your uploaded images and product images, all in one place"
          right={
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setViewMode("grid")}
                style={{
                  width: 32, height: 32, borderRadius: 9, border: `1.5px solid ${C.border}`, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: viewMode === "grid" ? C.gradient : "#fff",
                  color: viewMode === "grid" ? "#fff" : C.slate,
                }}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                style={{
                  width: 32, height: 32, borderRadius: 9, border: `1.5px solid ${C.border}`, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: viewMode === "list" ? C.gradient : "#fff",
                  color: viewMode === "list" ? "#fff" : C.slate,
                }}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          }
        >
          {/* Status bar */}
          <div style={{ marginBottom: 14, padding: "10px 12px", background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 10, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", fontSize: 12 }}>
            <span style={{ color: C.hint, fontWeight: 600 }}>Status:</span>
            {foldersLoading && <Pill>Loading folders…</Pill>}
            {isLoadingAny && <Pill>Loading items…</Pill>}
            {isUploading && <Pill tone="primary">Uploading…</Pill>}
            {isMovingFiles && <Pill tone="primary">Moving…</Pill>}
            {foldersError && <Pill tone="danger">Folders error</Pill>}
            <Pill>{isRoot ? "All folders" : "Folders here"}: {currentDirectoryFolders.length}</Pill>
            <Pill>{isRoot ? "All items" : "Items"}: {filteredItems.length}</Pill>
            <Pill tone="primary">Selected: {selectedUids.size}</Pill>
            <Pill>Location: {currentFolderName}</Pill>
          </div>

          {/* Breadcrumb — also acts as a drop target to move items up / to root */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, padding: 10, background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => navigateToBreadcrumb("")}
              onDragOver={(e) => { if (isDragging) e.preventDefault(); }}
              onDrop={handleRootDrop}
              style={{
                padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600,
                background: !currentFolderId ? "#EEF3FB" : "transparent",
                color: !currentFolderId ? C.primary : C.label,
              }}
            >
              Root
            </button>
            {breadcrumbChain.length > 0 && (
              <>
                <span style={{ color: C.muted }}>/</span>
                <button
                  onClick={navigateUp}
                  onDragOver={(e) => { if (isDragging) e.preventDefault(); }}
                  onDrop={handleUpDrop}
                  style={{ padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: C.label, display: "flex", alignItems: "center", gap: 4 }}
                >
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
                  <button onClick={() => navigateToBreadcrumb(folder.id)} style={{ padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: C.label, background: "transparent" }}>
                    {folder.name}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Toolbar */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <label htmlFor="file-upload">
              <input
                id="file-upload" type="file" multiple accept="image/*" className="hidden"
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
                disabled={isUploading || isMovingFiles}
              />
              <span
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9,
                  background: isUploading || isMovingFiles ? "#CBD5E1" : C.gradient, color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: isUploading || isMovingFiles ? "not-allowed" : "pointer",
                }}
              >
                <Upload className="w-4 h-4" /> {isUploading ? "Uploading…" : "Upload Image"}
              </span>
            </label>

            <button
              onClick={() => setCreateFolderDialog(true)}
              disabled={isUploading || isMovingFiles}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9, border: `1.5px solid ${C.border}`, background: "#fff", color: C.label, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              <FolderPlus className="w-4 h-4" /> Create Folder
            </button>

            {selectedUids.size > 0 && (
              <>
                <button
                  onClick={openMoveDialog}
                  disabled={isMovingFiles || isUploading}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9, border: `1.5px solid ${C.border}`, background: "#fff", color: C.primary, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  <Move className="w-4 h-4" /> {isMovingFiles ? "Moving…" : `Move (${selectedUids.size})`}
                </button>
                <button
                  onClick={() => handleDeleteItems(Array.from(selectedUids))}
                  disabled={isUploading || isMovingFiles}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9, border: `1.5px solid ${C.redBorder}`, background: C.redBg, color: C.red, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  <Trash2 className="w-4 h-4" /> Delete ({selectedUids.size})
                </button>
                <button onClick={clearSelection} disabled={isUploading || isMovingFiles} style={{ width: 32, height: 32, borderRadius: 9, border: `1.5px solid ${C.border}`, background: "#fff", color: C.slate, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X className="w-4 h-4" />
                </button>
              </>
            )}

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <Input
                placeholder="Search files & images…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: 240, fontSize: 13 }}
                disabled={isUploading || isMovingFiles}
              />
              <button
                onClick={selectAll}
                title={selectedUids.size === filteredItems.length ? "Deselect all" : "Select all"}
                disabled={isUploading || isMovingFiles || filteredItems.length === 0}
                style={{ width: 32, height: 32, borderRadius: 9, border: `1.5px solid ${C.border}`, background: "#fff", color: C.slate, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {selectedUids.size === filteredItems.length && filteredItems.length > 0 ? <CheckSquare className="w-4 h-4" style={{ color: C.primary }} /> : <Square className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Folders */}
          {foldersLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${C.border}`, borderBottomColor: C.primary, animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : currentDirectoryFolders.length > 0 ? (
            <div style={{ marginBottom: 22 }}>
              <h3 style={{ fontSize: 12.5, fontWeight: 700, color: C.title, marginBottom: 10 }}>
                {isRoot ? "All Folders" : "Folders"} ({currentDirectoryFolders.length})
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                {currentDirectoryFolders.map((folder) => {
                  const isHovered = hoveredFolderId === folder.id;
                  const path = isRoot ? getFolderPath(folder) : "";
                  return (
                    <div
                      key={folder.id}
                      onClick={() => navigateToFolder(folder.id)}
                      onDragOver={(e) => { if (isDragging) e.preventDefault(); }}
                      onDragEnter={(e) => { e.preventDefault(); handleFolderDragEnter(folder.id); }}
                      onDragLeave={() => handleFolderDragLeave(folder.id)}
                      onDrop={(e) => handleFolderDrop(e, folder.id)}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 10px",
                        border: `1.5px solid ${isHovered ? C.primary : C.border}`, borderRadius: 12, cursor: "pointer",
                        background: isHovered ? "#EEF3FB" : "#fff", position: "relative", transition: "all 0.15s",
                        boxShadow: isHovered ? "0 0 0 3px rgba(29,78,216,0.12)" : "none",
                      }}
                      className="group"
                    >
                      <FolderOpen className="w-10 h-10 mb-2" style={{ color: isHovered ? C.primary : "#F5B942" }} />
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: C.title, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }} title={folder.name}>{folder.name}</p>
                      {path && (
                        <p style={{ fontSize: 9.5, color: C.muted, marginTop: 1, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }} title={path}>
                          in {path}
                        </p>
                      )}
                      <p style={{ fontSize: 10.5, color: C.hint, marginTop: 3 }}>
                        {folder.fileCount} file{folder.fileCount === 1 ? "" : "s"}
                        {folder.childFolderCount > 0 && ` · ${folder.childFolderCount} folder${folder.childFolderCount === 1 ? "" : "s"}`}
                      </p>
                      <div style={{ position: "absolute", top: 6, right: 6, opacity: 0, transition: "opacity 0.15s", display: "flex", gap: 4 }} className="group-hover:opacity-100">
                        <button onClick={(e) => { e.stopPropagation(); openRenameFolderDialog(folder); }} disabled={isMovingFiles} style={{ width: 22, height: 22, borderRadius: 6, border: "none", background: "rgba(255,255,255,0.95)", boxShadow: "0 1px 2px rgba(0,0,0,0.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Edit className="w-3 h-3" style={{ color: C.label }} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id, folder.name); }} disabled={isMovingFiles} style={{ width: 22, height: 22, borderRadius: 6, border: "none", background: C.red, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Trash2 className="w-3 h-3" style={{ color: "#fff" }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            !foldersLoading && folders.length > 0 && (
              <div style={{ textAlign: "center", padding: 28, color: C.hint, border: `1.5px dashed ${C.border}`, borderRadius: 12, marginBottom: 22 }}>
                <FolderOpen className="w-10 h-10 mx-auto mb-3" style={{ opacity: 0.4 }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: C.label }}>No subfolders in this directory</p>
                <p style={{ fontSize: 11.5, marginTop: 4 }}>Create a new folder or navigate to a different directory</p>
              </div>
            )
          )}

          {!foldersLoading && folders.length === 0 && (
            <div style={{ textAlign: "center", padding: 28, color: C.hint, border: `1.5px dashed ${C.border}`, borderRadius: 12, marginBottom: 22 }}>
              <FolderOpen className="w-10 h-10 mx-auto mb-3" style={{ opacity: 0.4 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: C.label }}>No folders created yet</p>
              <button onClick={() => setCreateFolderDialog(true)} disabled={isMovingFiles} style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 9, border: `1.5px solid ${C.border}`, background: "#fff", color: C.label, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                <FolderPlus className="w-4 h-4" /> Create Your First Folder
              </button>
            </div>
          )}

       {/* Unified files + product images */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
              <h3 style={{ fontSize: 12.5, fontWeight: 700, color: C.title }}>
                {currentFolderName} ({filteredItems.length} item{filteredItems.length === 1 ? "" : "s"})
              </h3>
              <p style={{ fontSize: 10.5, color: C.hint }}>Drag any item onto a folder to move it — hover a folder while dragging to open it</p>
            </div>

            {isLoadingAny ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", border: `3px solid ${C.border}`, borderBottomColor: C.primary, animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : filteredItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: C.hint, border: `1.5px dashed ${C.border}`, borderRadius: 12 }}>
                <ImageIcon className="w-10 h-10 mx-auto mb-3" style={{ opacity: 0.4 }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: C.label }}>No images found</p>
                {searchQuery && <p style={{ fontSize: 11.5, marginTop: 4 }}>Try adjusting your search terms</p>}
                {!searchQuery && currentFolderId && <p style={{ fontSize: 11.5, marginTop: 4 }}>This folder is empty</p>}
                {!searchQuery && !currentFolderId && <p style={{ fontSize: 11.5, marginTop: 4 }}>Upload some images or navigate to a folder</p>}
              </div>
            ) : viewMode === "grid" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
                {filteredItems.map((item) => {
                  const isSelected = selectedUids.has(item.uid);
                  const isBeingDragged = !!draggedUids?.includes(item.uid);
                  return (
                    <div
                      key={item.uid}
                      draggable
                      onDragStart={(e) => handleItemDragStart(e, item.uid)}
                      onDragEnd={handleItemDragEnd}
                      onClick={() => toggleSelection(item.uid)}
                      style={{
                        position: "relative", borderRadius: 12, overflow: "hidden", cursor: "grab",
                        border: `2px solid ${isSelected ? C.primary : "transparent"}`,
                        boxShadow: isSelected ? "0 4px 12px rgba(29,78,216,0.15)" : "0 1px 3px rgba(0,0,0,0.04)",
                        opacity: isBeingDragged ? 0.4 : 1,
                        transform: isSelected ? "scale(1.01)" : "scale(1)",
                        transition: "all 0.15s",
                        background: "#fff",
                      }}
                      className="group"
                    >
                      <div style={{ aspectRatio: "1/1", background: "#F1F5F9", position: "relative" }}>
                        <StableImage src={item.url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        {isRoot && (
                          <span style={{ position: "absolute", bottom: 4, left: 4 }}>
                            <Pill tone={item.kind === "product" ? "primary" : "neutral"}>{getItemFolderLabel(item)}</Pill>
                          </span>
                        )}
                      </div>
                      <div style={{ position: "absolute", top: 6, left: 6 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSelection(item.uid); }}
                          style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(255,255,255,0.92)", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          disabled={isMovingFiles}
                        >
                          {isSelected ? <CheckSquare className="w-3.5 h-3.5" style={{ color: C.primary }} /> : <Square className="w-3.5 h-3.5" style={{ color: C.muted }} />}
                        </button>
                      </div>
                      <div
                        style={{ position: "absolute", top: 6, right: 6 }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      >
                        <ItemMenu item={item} />
                      </div>
                      <div
                        style={{ position: "absolute", bottom: 6, right: 6, color: "#fff" }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      >
                        <GripVertical className="w-3.5 h-3.5" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }} />
                      </div>
                      <div style={{ padding: 8, background: "#fff", borderTop: `1px solid ${C.borderSoft}` }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: C.title, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.name}>{item.name}</p>
                        <p style={{ fontSize: 10, color: C.hint }}>
                          {formatFileSize(item.size)}{item.date ? ` • ${format(new Date(item.date), "MMM d, yyyy")}` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {filteredItems.map((item) => {
                  const isSelected = selectedUids.has(item.uid);
                  const isBeingDragged = !!draggedUids?.includes(item.uid);
                  return (
                    <div
                      key={item.uid}
                      draggable
                      onDragStart={(e) => handleItemDragStart(e, item.uid)}
                      onDragEnd={handleItemDragEnd}
                      onClick={() => toggleSelection(item.uid)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, padding: 10, borderRadius: 10, cursor: "grab",
                        border: `1.5px solid ${isSelected ? C.primary : C.border}`,
                        background: isSelected ? "#EEF3FB" : "#fff",
                        opacity: isBeingDragged ? 0.4 : 1,
                        transition: "all 0.15s",
                      }}
                    >
                      <button onClick={(e) => { e.stopPropagation(); toggleSelection(item.uid); }} disabled={isMovingFiles} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                        {isSelected ? <CheckSquare className="w-5 h-5" style={{ color: C.primary }} /> : <Square className="w-5 h-5" style={{ color: C.muted }} />}
                      </button>
                      <StableImage src={item.url} alt={item.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: C.title, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.name}>{item.name}</p>
                          {isRoot && <Pill tone={item.kind === "product" ? "primary" : "neutral"}>{getItemFolderLabel(item)}</Pill>}
                        </div>
                        <p style={{ fontSize: 11, color: C.hint }}>
                          {formatFileSize(item.size)}{item.date ? ` • ${format(new Date(item.date), "MMM d, yyyy")}` : ""}
                        </p>
                      </div>
                      <ItemMenu item={item} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Panel>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderDialog} onOpenChange={setCreateFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>Enter a name for your new folder{currentFolderId && ` in "${currentFolderName}"`}</DialogDescription>
          </DialogHeader>
          <Input placeholder="Folder name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()} style={{ background: C.gradient, border: "none" }}>Create Folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={renameFolderDialog} onOpenChange={setRenameFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>Enter a new name for the folder</DialogDescription>
          </DialogHeader>
          <Input placeholder="New folder name" value={renameFolderName} onChange={(e) => setRenameFolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder()} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameFolderDialog(false)}>Cancel</Button>
            <Button onClick={handleRenameFolder} disabled={!renameFolderName.trim()} style={{ background: C.gradient, border: "none" }}>Rename Folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Files Dialog */}
      <Dialog open={moveDialog} onOpenChange={setMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Items</DialogTitle>
            <DialogDescription>
              Select a destination folder for {selectedUids.size} item(s)
              <span style={{ display: "block", marginTop: 4, color: C.green, fontWeight: 600 }}>Selected: {targetFolderName}</span>
            </DialogDescription>
          </DialogHeader>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ maxHeight: 280, overflowY: "auto", border: `1.5px solid ${C.border}`, borderRadius: 10, padding: 8 }}>
              <div
                onClick={() => setTargetFolderId("")}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 4px", borderRadius: 8, cursor: "pointer", fontSize: 13, marginBottom: 4,
                  background: targetFolderId === "" ? "#EEF3FB" : "transparent",
                  color: targetFolderId === "" ? C.primary : C.label,
                  fontWeight: targetFolderId === "" ? 600 : 500,
                }}
              >
                <span style={{ width: 16, flexShrink: 0 }} />
                <FolderOpen className="w-4 h-4 flex-shrink-0" />
                <span>Root Directory</span>
              </div>

              {folderTree.length === 0 ? (
                <p style={{ fontSize: 11.5, color: C.muted, textAlign: "center", padding: 16 }}>No folders yet</p>
              ) : (
                folderTree.map((node) => (
                  <FolderTreeRow key={node.id} node={node} depth={0} selectedId={targetFolderId} onSelect={setTargetFolderId} expandedIds={expandedTreeIds} onToggleExpand={toggleTreeExpand} disabledIds={moveDisabledIds} />
                ))
              )}
            </div>

            <div style={{ padding: 12, background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 10 }}>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: C.title }}>Move Summary</p>
              <p style={{ fontSize: 12, color: C.hint, marginTop: 2 }}>
                Moving {selectedUids.size} item(s) from <strong style={{ color: C.label }}>{currentFolderName}</strong> to <strong style={{ color: C.label }}>{targetFolderName}</strong>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialog(false)}>Cancel</Button>
            <Button onClick={handleMoveFiles} disabled={selectedUids.size === 0 || isMovingFiles} style={{ background: C.gradient, border: "none" }}>
              {isMovingFiles ? "Moving…" : `Move ${selectedUids.size} Item(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}