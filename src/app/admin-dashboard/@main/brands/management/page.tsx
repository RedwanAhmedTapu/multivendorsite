"use client";
import React, { useMemo, useState } from "react";
import {
  useGetBrandCatalogQuery,
  useCreateBrandCatalogEntryMutation,
  useBulkCreateBrandCatalogEntriesMutation,
  useDeleteBrandCatalogEntryMutation,
} from "@/features/brandApi";
import {
  Search,
  Loader2,
  Inbox,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  ListPlus,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

// NOTE: the backend only exposes create / bulkCreate / remove for the
// brand catalog (see BrandCatalogService + routes) — there is no update
// endpoint. Renaming below is implemented as "create the new name, then
// delete the old row" rather than a true update, so a rename produces a
// new row id. If you add a PATCH /admin/catalog/:id endpoint + RTK
// mutation later, swap handleConfirmRename to call that directly instead.

// Kept local since brandApi.ts doesn't currently export this shape.
interface BrandCatalogEntry {
  id: string;
  name: string;
  createdBy?: string | null;
  createdAt?: string;
}

const ROW_COUNT_OPTIONS = [10, 25, 50, 100, 200];

export default function AdminBrandCatalogPage() {
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(50);

  const [newName, setNewName] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useGetBrandCatalogQuery({
    search: search || undefined,
    limit,
  });

  const entries: BrandCatalogEntry[] = data ?? [];

  const [createEntry, { isLoading: isCreating }] =
    useCreateBrandCatalogEntryMutation();
  const [bulkCreateEntries, { isLoading: isBulkCreating }] =
    useBulkCreateBrandCatalogEntriesMutation();
  const [deleteEntry] = useDeleteBrandCatalogEntryMutation();

  const parsedBulkNames = useMemo(
    () =>
      bulkText
        .split(/[\n,]/)
        .map((n) => n.trim())
        .filter((n) => n.length > 0),
    [bulkText]
  );

  // ── Add single ──────────────────────────────────────────────────────
  const handleAddSingle = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error("Enter a brand name first");
      return;
    }
    try {
      await createEntry({ name: trimmed }).unwrap();
      toast.success(`"${trimmed}" added to the catalog`);
      setNewName("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to add brand name");
    }
  };

  // ── Bulk add ─────────────────────────────────────────────────────────
  const handleBulkAdd = async () => {
    if (parsedBulkNames.length === 0) {
      toast.error("Enter at least one brand name (one per line, or comma-separated)");
      return;
    }
    try {
      const result = await bulkCreateEntries({ names: parsedBulkNames }).unwrap();
      toast.success(
        `${result.created} added, ${result.skipped} skipped (already existed or invalid)`
      );
      setBulkText("");
      setIsBulkOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to bulk add brand names");
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────
  const handleDelete = async (entry: BrandCatalogEntry) => {
    if (!confirm(`Remove "${entry.name}" from the brand catalog?`)) return;
    setDeletingId(entry.id);
    try {
      await deleteEntry(entry.id).unwrap();
      toast.success(`"${entry.name}" removed`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to remove brand name");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Rename (create-then-delete, see note above) ─────────────────────
  const startEditing = (entry: BrandCatalogEntry) => {
    setEditingId(entry.id);
    setEditingValue(entry.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingValue("");
  };

  const handleConfirmRename = async (entry: BrandCatalogEntry) => {
    const trimmed = editingValue.trim();
    if (!trimmed) {
      toast.error("Brand name can't be empty");
      return;
    }
    if (trimmed === entry.name) {
      cancelEditing();
      return;
    }
    try {
      await createEntry({ name: trimmed }).unwrap();
      await deleteEntry(entry.id).unwrap();
      toast.success(`Renamed "${entry.name}" → "${trimmed}"`);
      cancelEditing();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to rename brand name");
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        background: "#F0F4FA",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 18px" }}>
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 19, fontWeight: 800, color: "#0D1B2E", margin: 0 }}>
            Brand Catalog
          </h1>
          <p style={{ fontSize: 12, color: "#7A90AB", margin: "3px 0 0" }}>
            Manage the master list of brand names vendors can select from
          </p>
        </div>

        {/* ── Add single brand name ── */}
        <div
          style={{
            background: "#fff",
            border: "1.5px solid #E5EAF2",
            borderRadius: 14,
            padding: 14,
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <Tag
                size={14}
                color="#94A3B8"
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSingle();
                }}
                placeholder="Add a brand name…"
                style={{
                  width: "100%",
                  padding: "9px 12px 9px 32px",
                  borderRadius: 9,
                  border: "1px solid #E2E8F0",
                  fontSize: 12.5,
                  fontFamily: "inherit",
                }}
              />
            </div>
            <button
              onClick={handleAddSingle}
              disabled={isCreating}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 16px",
                borderRadius: 9,
                border: "none",
                background: isCreating ? "#CBD5E1" : "linear-gradient(135deg,#1D4ED8,#0891B2)",
                color: "#fff",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: isCreating ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {isCreating ? (
                <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Plus size={13} />
              )}
              Add
            </button>
            <button
              onClick={() => setIsBulkOpen((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 16px",
                borderRadius: 9,
                border: "1.5px solid #E5EAF2",
                background: isBulkOpen ? "#EFF6FF" : "#fff",
                color: isBulkOpen ? "#1D4ED8" : "#3D5068",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <ListPlus size={13} />
              Bulk add
            </button>
          </div>

          {/* ── Bulk add panel ── */}
          {isBulkOpen && (
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: "1px solid #F0F4FA",
              }}
            >
              <label style={{ fontSize: 11.5, fontWeight: 700, color: "#3D5068", display: "block", marginBottom: 6 }}>
                Paste brand names — one per line, or comma-separated
              </label>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"Samsung\nApple\nSony, LG, Philips"}
                rows={5}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 9,
                  border: "1px solid #E2E8F0",
                  fontSize: 12.5,
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 8,
                }}
              >
                <span style={{ fontSize: 11.5, color: "#7A90AB" }}>
                  {parsedBulkNames.length} name{parsedBulkNames.length !== 1 ? "s" : ""} detected
                </span>
                <button
                  onClick={handleBulkAdd}
                  disabled={isBulkCreating || parsedBulkNames.length === 0}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: 9,
                    border: "none",
                    background:
                      isBulkCreating || parsedBulkNames.length === 0
                        ? "#CBD5E1"
                        : "linear-gradient(135deg,#1D4ED8,#0891B2)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor:
                      isBulkCreating || parsedBulkNames.length === 0
                        ? "not-allowed"
                        : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {isBulkCreating ? (
                    <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <ListPlus size={13} />
                  )}
                  Add {parsedBulkNames.length || ""} name
                  {parsedBulkNames.length !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Search + row-count controls ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div style={{ position: "relative", minWidth: 240, flex: 1 }}>
            <Search
              size={14}
              color="#94A3B8"
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brand names…"
              style={{
                width: "100%",
                padding: "8px 12px 8px 32px",
                borderRadius: 8,
                border: "1px solid #E2E8F0",
                fontSize: 12.5,
                fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600 }}>
              Show
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              style={{
                padding: "7px 10px",
                borderRadius: 8,
                border: "1px solid #E2E8F0",
                fontSize: 12.5,
                fontFamily: "inherit",
                background: "#fff",
                color: "#3D5068",
                cursor: "pointer",
              }}
            >
              {ROW_COUNT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} rows
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Table ── */}
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Loader2 size={22} color="#1D4ED8" style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : entries.length === 0 ? (
          <div
            style={{
              background: "#fff",
              border: "1.5px solid #E5EAF2",
              borderRadius: 14,
              padding: "48px 20px",
              textAlign: "center",
            }}
          >
            <Inbox size={30} color="#CBD5E1" style={{ margin: "0 auto 10px" }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: "#3D5068", margin: 0 }}>
              No brand names found
            </p>
            <p style={{ fontSize: 12, color: "#9BAABB", marginTop: 4 }}>
              {search ? "Try a different search term." : "Add your first brand name above."}
            </p>
          </div>
        ) : (
          <div
            style={{
              background: "#fff",
              border: "1.5px solid #E5EAF2",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <div
              className="catalog-table-header"
              style={{
                display: "grid",
                gridTemplateColumns: "2.5fr 1fr auto",
                gap: 10,
                padding: "10px 16px",
                background: "#FAFBFD",
                borderBottom: "1px solid #F0F4FA",
                fontSize: 10.5,
                fontWeight: 700,
                color: "#9BAABB",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              <span>Brand name</span>
              <span>Added</span>
              <span style={{ textAlign: "right" }}>Actions</span>
            </div>

            {entries.map((entry) => {
              const isEditingRow = editingId === entry.id;
              const isDeletingRow = deletingId === entry.id;
              return (
                <div
                  key={entry.id}
                  className="catalog-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2.5fr 1fr auto",
                    gap: 10,
                    padding: "10px 16px",
                    borderBottom: "1px solid #F0F4FA",
                    alignItems: "center",
                  }}
                >
                  {isEditingRow ? (
                    <input
                      autoFocus
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleConfirmRename(entry);
                        if (e.key === "Escape") cancelEditing();
                      }}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 7,
                        border: "1px solid #93C5FD",
                        fontSize: 12.5,
                        fontFamily: "inherit",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#0D1B2E",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {entry.name}
                    </span>
                  )}

                  <span style={{ fontSize: 11.5, color: "#64748B" }}>
                    {entry.createdAt
                      ? new Date(entry.createdAt).toLocaleDateString()
                      : "—"}
                  </span>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                    {isEditingRow ? (
                      <>
                        <button
                          onClick={() => handleConfirmRename(entry)}
                          title="Save"
                          style={{
                            padding: "6px 8px",
                            borderRadius: 7,
                            border: "1.5px solid #BBF7D0",
                            background: "#F0FDF4",
                            color: "#16A34A",
                            cursor: "pointer",
                          }}
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={cancelEditing}
                          title="Cancel"
                          style={{
                            padding: "6px 8px",
                            borderRadius: 7,
                            border: "1.5px solid #E5EAF2",
                            background: "#fff",
                            color: "#64748B",
                            cursor: "pointer",
                          }}
                        >
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(entry)}
                          title="Rename"
                          style={{
                            padding: "6px 8px",
                            borderRadius: 7,
                            border: "1.5px solid #E5EAF2",
                            background: "#fff",
                            color: "#3D5068",
                            cursor: "pointer",
                          }}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(entry)}
                          disabled={isDeletingRow}
                          title="Delete"
                          style={{
                            padding: "6px 8px",
                            borderRadius: 7,
                            border: "1.5px solid #FECACA",
                            background: "#FEF2F2",
                            color: "#DC2626",
                            cursor: isDeletingRow ? "not-allowed" : "pointer",
                          }}
                        >
                          {isDeletingRow ? (
                            <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Result count / fetching indicator */}
        {!isLoading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              marginTop: 12,
              fontSize: 11.5,
              color: "#9BAABB",
            }}
          >
            {isFetching ? (
              <>
                <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
                Refreshing…
              </>
            ) : (
              <>
                Showing {entries.length} of up to {limit} rows
                {entries.length === limit && (
                  <button
                    onClick={() => setLimit((l) => Math.min(l * 2, 200))}
                    style={{
                      marginLeft: 6,
                      background: "none",
                      border: "none",
                      color: "#1D4ED8",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: 11.5,
                    }}
                  >
                    Load more →
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .catalog-table-header { display: none !important; }
          .catalog-row {
            grid-template-columns: 1fr !important;
            gap: 6px !important;
          }
        }
      `}</style>
    </div>
  );
}