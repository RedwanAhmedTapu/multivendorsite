"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import {
  Building2,
  ChevronRight,
  Warehouse as WarehouseIcon,
  Plus,
  Star,
  StarOff,
  Trash2,
  X,
  Loader2,
  MapPin,
  Layers,
  Grid,
  Boxes,
  Eye,
  EyeOff,
  Pencil,
  Power,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetWarehousesByVendorQuery,
  useSetDefaultWarehouseMutation,
  useDeleteWarehouseMutation,
  useDeactivateWarehouseMutation,
  useReactivateWarehouseMutation,
  useGetRacksByWarehouseQuery,
  useCreateRackMutation,
  useDeleteRackMutation,
  useToggleRackActiveMutation,
  type Warehouse,
} from "@/features/warehouseApi";
import Link from "next/link";
import { WarehouseFormDialog } from "@/components/warehouse/WarehouseFormDialog";

const apiErrorMessage = (err: any, fallback: string) => err?.data?.message || fallback;

/* ── Stat Card (Reusable) ── */
function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white shadow-sm`}>
          {icon}
        </div>
      </div>
      <div className="text-xl font-extrabold text-slate-800">{value}</div>
    </div>
  );
}

/* ── Manage Racks Modal ── */
function ManageRacksModal({
  warehouseId,
  warehouseName,
  onClose,
}: {
  warehouseId: string;
  warehouseName: string;
  onClose: () => void;
}) {
  const { data: racksData, isLoading } = useGetRacksByWarehouseQuery({ warehouseId });
  const [createRack, { isLoading: isCreating }] = useCreateRackMutation();
  const [deleteRack] = useDeleteRackMutation();
  const [toggleRack] = useToggleRackActiveMutation();

  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [totalRows, setTotalRows] = useState(1);
  const [totalShelves, setTotalShelves] = useState(1);

  const racks = racksData?.data ?? [];

  const handleAddRack = async () => {
    if (!code) {
      toast.error("Rack code is required");
      return;
    }
    const promise = createRack({
      warehouseId,
      code,
      label: label || undefined,
      totalRows: Number(totalRows),
      totalShelves: Number(totalShelves),
    }).unwrap();

    toast.promise(promise, {
      loading: "Adding rack...",
      success: () => {
        setCode("");
        setLabel("");
        return "Rack added successfully";
      },
      error: (err: any) => err?.data?.message || "Failed to add rack",
    });
  };

  const handleDeleteRack = async (id: string) => {
    const promise = deleteRack({ id }).unwrap();
    toast.promise(promise, {
      loading: "Deleting rack...",
      success: "Rack deleted",
      error: "Failed to delete rack",
    });
  };

  const handleToggle = async (id: string) => {
    const promise = toggleRack({ id }).unwrap();
    toast.promise(promise, {
      loading: "Updating status...",
      success: "Rack status updated",
      error: "Failed to update status",
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-sm">
              <Boxes size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Manage Racks</h2>
              <p className="text-[11px] text-slate-400">{warehouseName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Add Rack Form */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Add New Rack</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Code (e.g. A1)"
                className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100"
              />
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Label (Optional)"
                className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100"
              />
              <input
                type="number"
                value={totalRows}
                onChange={(e) => setTotalRows(Number(e.target.value))}
                placeholder="Total Rows"
                className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100"
              />
              <input
                type="number"
                value={totalShelves}
                onChange={(e) => setTotalShelves(Number(e.target.value))}
                placeholder="Total Shelves"
                className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100"
              />
            </div>
            <button
              onClick={handleAddRack}
              disabled={isCreating}
              className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg hover:from-blue-700 hover:to-cyan-600 disabled:opacity-60"
            >
              {isCreating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Add Rack
            </button>
          </div>

          {/* Racks List */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Existing Racks</h3>
            {isLoading ? (
              <div className="text-center text-xs text-slate-400 py-8">Loading racks...</div>
            ) : racks.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No racks found. Add your first rack above.
              </div>
            ) : (
              <div className="space-y-2">
                {racks.map((rack) => (
                  <div
                    key={rack.id}
                    className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                        <Grid size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-700">{rack.code}</div>
                        <div className="text-[11px] text-slate-400">
                          {rack.totalRows} Rows • {rack.totalShelves} Shelves
                          {rack.label && ` • ${rack.label}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(rack.id)}
                        className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-colors ${
                          rack.isActive
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {rack.isActive ? "Active" : "Inactive"}
                      </button>
                      <button
                        onClick={() => handleDeleteRack(rack.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Warehouse Card ── */
function WarehouseCard({
  warehouse,
  onManageRacks,
  onEdit,
}: {
  warehouse: any;
  onManageRacks: (w: any) => void;
  onEdit: (w: any) => void;
}) {
  const [setDefault, { isLoading: isSettingDefault }] = useSetDefaultWarehouseMutation();
  const [deleteWarehouse] = useDeleteWarehouseMutation();
  const [deactivateWarehouse, { isLoading: isDeactivating }] = useDeactivateWarehouseMutation();
  const [reactivateWarehouse, { isLoading: isReactivating }] = useReactivateWarehouseMutation();
  const isInactive = warehouse.isActive === false;

  const handleSetDefault = async () => {
    const promise = setDefault({ id: warehouse.id }).unwrap();
    toast.promise(promise, {
      loading: "Setting as default...",
      success: "Default warehouse updated",
      error: (err: any) => apiErrorMessage(err, "Failed to set default"),
    });
  };

  // Deactivation is refused by the backend while the warehouse still holds
  // stock or has pending operational references; its message says why.
  const handleDeactivate = async () => {
    if (!confirm("Deactivate this warehouse? It will no longer be used for new stock, orders or pickups. History is kept.")) return;
    const promise = deactivateWarehouse({ id: warehouse.id }).unwrap();
    toast.promise(promise, {
      loading: "Deactivating...",
      success: "Warehouse deactivated",
      error: (err: any) => apiErrorMessage(err, "Failed to deactivate warehouse"),
    });
  };

  const handleReactivate = async () => {
    const promise = reactivateWarehouse({ id: warehouse.id }).unwrap();
    toast.promise(promise, {
      loading: "Reactivating...",
      success: "Warehouse reactivated",
      error: (err: any) => apiErrorMessage(err, "Failed to reactivate warehouse"),
    });
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this warehouse?")) {
      const promise = deleteWarehouse({ id: warehouse.id }).unwrap();
      toast.promise(promise, {
        loading: "Deleting...",
        success: "Warehouse deleted",
        // A warehouse that was ever used operationally cannot be deleted —
        // the backend explains and the vendor deactivates it instead.
        error: (err: any) => apiErrorMessage(err, "Failed to delete warehouse"),
      });
    }
  };

  return (
    <div
      className={`relative bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
        warehouse.isDefault ? "border-cyan-300 shadow-cyan-100" : "border-slate-200 shadow-slate-100"
      }${isInactive ? " opacity-70" : ""}`}
    >
      {warehouse.isDefault && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-600 to-cyan-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
          <Star size={10} fill="currentColor" /> Default
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-sm">
            <WarehouseIcon size={19} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  warehouse.type === "PICKUP"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-violet-50 text-violet-700 border-violet-200"
                }`}
              >
                {warehouse.type === "PICKUP" ? "Pickup" : "Return"}
              </span>
              {isInactive && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-500 border-slate-300">
                  Inactive
                </span>
              )}
            </div>
            <div className="text-sm font-bold text-slate-700 mt-1 truncate">
              {warehouse.name || "Unnamed Warehouse"}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              Code: {warehouse.code || "—"}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
          <MapPin size={12} className="shrink-0 text-slate-400" />
          <span className="truncate">{warehouse.address || "No address provided"}</span>
        </div>
      </div>

      <div className="px-4 pb-4 flex flex-col gap-2">
        <button
          onClick={() => onEdit(warehouse)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <Pencil size={12} />
          Edit Details
        </button>
        <button
          onClick={() => onManageRacks(warehouse)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-xl hover:bg-cyan-100 transition-colors"
        >
          <Layers size={12} />
          Manage Racks
        </button>

        <div className="flex items-center gap-2">
          {isInactive ? (
            <button
              onClick={handleReactivate}
              disabled={isReactivating}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors disabled:opacity-60"
            >
              {isReactivating ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
              Reactivate
            </button>
          ) : !warehouse.isDefault ? (
            <button
              onClick={handleSetDefault}
              disabled={isSettingDefault}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-60"
            >
              {isSettingDefault ? <Loader2 size={12} className="animate-spin" /> : <StarOff size={12} />}
              Set Default
            </button>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-400 bg-slate-50 border border-slate-100 rounded-xl cursor-default">
              <Star size={12} className="text-cyan-500" fill="currentColor" />
              Default
            </div>
          )}
          {!isInactive && (
            <button
              onClick={handleDeactivate}
              disabled={isDeactivating}
              title="Deactivate warehouse"
              className="flex items-center justify-center px-3 py-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-60"
            >
              {isDeactivating ? <Loader2 size={12} className="animate-spin" /> : <Power size={12} />}
            </button>
          )}
          <button
            onClick={handleDelete}
            title="Delete warehouse (only if never used)"
            className="flex items-center justify-center px-3 py-2 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function VendorWarehouseSettingsPage() {
  const vendorId = useSelector((state: RootState) => state.auth.user?.vendorId ?? "");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [activeWarehouse, setActiveWarehouse] = useState<any>(null);

  const { data, isLoading } = useGetWarehousesByVendorQuery({ vendorId }, { skip: !vendorId });
  const warehouses = data?.data ?? [];

  // Lists include deactivated warehouses (shown with an Inactive badge); the
  // counters only count active ones.
  const activeWarehouses = warehouses.filter((w) => w.isActive !== false);
  const defaultWarehouse = activeWarehouses.find((w) => w.isDefault);
  const pickupCount = activeWarehouses.filter((w) => w.type === "PICKUP").length;
  const returnCount = activeWarehouses.filter((w) => w.type === "RETURN").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 font-sans">
      {/* ── Top Bar ── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-30 shadow-sm shadow-blue-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 min-w-0 overflow-hidden">
            
            <ChevronRight size={12} className="shrink-0" />
            <Link href="/vendor-dashboard/settings" className="font-semibold text-slate-500 hover:text-slate-700 truncate">

            <div className="flex items-center gap-1.5 font-semibold text-cyan-600 shrink-0">
              <Building2 size={14} />
              <span>Settings</span>
            </div>
            </Link>
            <Link href="/vendor-dashboard/settings/warehouse-settings" className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 truncate">
            <ChevronRight size={12} className="shrink-0" />
            <span className="font-semibold text-slate-700 truncate">Warehouse Settings</span>
            </Link>
          </div>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:from-blue-700 hover:to-cyan-600 shadow-sm shadow-blue-200 transition-all shrink-0"
          >
            <Plus size={13} />
            <span className="hidden sm:inline">Add Warehouse</span>
          </button>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        {/* ── Page title ── */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Warehouse & Inventory Settings
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your pickup/return locations, racks, rows, and shelves
          </p>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard
            label="Active Warehouses"
            value={activeWarehouses.length}
            icon={<WarehouseIcon size={16} />}
            accent="from-blue-500 to-cyan-400"
          />
          <StatCard
            label="Default Hub"
            value={defaultWarehouse ? defaultWarehouse.name || defaultWarehouse.code || "Set" : "Not Set"}
            icon={<Star size={16} />}
            accent="from-cyan-500 to-emerald-400"
          />
          <StatCard
            label="Pickup Points"
            value={pickupCount}
            icon={<MapPin size={16} />}
            accent="from-violet-500 to-purple-400"
          />
          <StatCard
            label="Return Points"
            value={returnCount}
            icon={<Boxes size={16} />}
            accent="from-amber-500 to-orange-400"
          />
        </div>

        {/* ── Warehouses Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 h-56 animate-pulse">
                <div className="w-11 h-11 rounded-xl bg-slate-100 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : warehouses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-100 py-20 text-center">
            <div className="flex flex-col items-center gap-3 text-slate-300">
              <WarehouseIcon size={40} className="opacity-40" />
              <div className="text-sm font-medium text-slate-400">No warehouses added yet</div>
              <button
                onClick={() => setAddModalOpen(true)}
                className="mt-2 flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:from-blue-700 hover:to-cyan-600 shadow-sm shadow-blue-200 transition-all"
              >
                <Plus size={13} /> Add your first warehouse
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.map((wh) => (
              <WarehouseCard
                key={wh.id}
                warehouse={wh}
                onManageRacks={setActiveWarehouse}
                onEdit={(w) => setEditingWarehouse(w)}
              />
            ))}
          </div>
        )}
      </div>

      <WarehouseFormDialog
        vendorId={vendorId}
        open={addModalOpen || !!editingWarehouse}
        warehouse={editingWarehouse}
        onClose={() => {
          setAddModalOpen(false);
          setEditingWarehouse(null);
        }}
      />

      {activeWarehouse && (
        <ManageRacksModal
          warehouseId={activeWarehouse.id}
          warehouseName={activeWarehouse.name || activeWarehouse.code || "Warehouse"}
          onClose={() => setActiveWarehouse(null)}
        />
      )}
    </div>
  );
}