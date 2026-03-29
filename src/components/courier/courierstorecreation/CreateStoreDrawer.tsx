"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Store,
  MapPin,
  Check,
  Loader2,
  AlertCircle,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import {
  useGetCourierProvidersQuery,
  usePathaoCreateStoreMutation,
  useRedxCreatePickupStoreMutation,
  type CourierProvider,
  type Environment,
} from "@/features/courierApi";
import {
  useGetWarehousesByVendorQuery,
  type Warehouse,
  WarehouseType,
} from "@/features/warehouseApi";

import { WarehouseAutoFill } from "./WarehouseAutoFill";
import { StoreFormFields } from "./StoreFormFields";
import { PathaoLocationFields } from "./PathaoLocationFields";
import { RedxLocationFields } from "./RedxLocationFields";
import { useStoreFormPrefill } from "./useStoreFormPrefill";
import type { VendorRow } from "@/types/courier-store";

interface Props {
  open: boolean;
  vendor: VendorRow | null;
  environment: Environment;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateStoreDrawer({ open, vendor, environment, onClose, onSuccess }: Props) {
  const [selectedProvider, setSelectedProvider] = useState<CourierProvider | null>(null);

  // Courier providers
  const { data: providersData, isLoading: providersLoading } = useGetCourierProvidersQuery({
    isActive: true,
    includeCredentials: true,
  });
  const providers = providersData?.data || [];

  // Vendor warehouses
  const { data: warehousesData, isLoading: warehousesLoading } = useGetWarehousesByVendorQuery(
    { vendorId: vendor?.id ?? "" },
    { skip: !vendor?.id }
  );
  const warehouses = warehousesData?.data || [];

  const defaultWarehouse =
    warehouses.find((w) => w.type === WarehouseType.PICKUP && w.isDefault) ||
    warehouses.find((w) => w.type === WarehouseType.PICKUP) ||
    warehouses.find((w) => w.isDefault) ||
    warehouses[0] ||
    null;

  const courierSlug = selectedProvider?.name?.toUpperCase() || "";
  const isPathao = courierSlug === "PATHAO";
  const isRedx = courierSlug === "REDX";

  const {
    form,
    updateForm,
    pathaoLoc,
    setPathaoLoc,
    redxLoc,
    setRedxLoc,
    autoFilledFields,
    sourceWarehouseId,
    applyWarehouse,
    resetAll,
    warehouseLocationHint,
  } = useStoreFormPrefill(defaultWarehouse, courierSlug);

  // Mutations
  const [createPathaoStore, { isLoading: creatingPathao }] = usePathaoCreateStoreMutation();
  const [createRedxStore, { isLoading: creatingRedx }] = useRedxCreatePickupStoreMutation();
  const isCreating = creatingPathao || creatingRedx;

  // Reset form when drawer opens/closes or vendor changes
  useEffect(() => {
    if (!open) {
      setSelectedProvider(null);
      resetAll();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vendor?.id]);

  // Reset location when provider switches
  useEffect(() => {
    setPathaoLoc({ cityId: null, cityName: "", zoneId: null, zoneName: "", areaId: null, areaName: "" });
    setRedxLoc({ areaId: null, areaName: "", districtFilter: "" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvider?.id]);

  // Validation
  const isFormValid = Boolean(
    form.storeName &&
    form.contactPhone &&
    form.address &&
    (isPathao ? form.contactName : true) &&
    (isPathao ? pathaoLoc.cityId && pathaoLoc.zoneId && pathaoLoc.areaId : true) &&
    (isRedx ? redxLoc.areaId : true)
  );

  const handleSubmit = async () => {
    if (!selectedProvider || !vendor) return;

    try {
      if (isPathao) {
        await createPathaoStore({
          courierProviderId: selectedProvider.id,
          environment,
          storeData: {
            name: form.storeName,
            contact_name: form.contactName,
            contact_number: form.contactPhone,
            secondary_contact: form.secondaryPhone || undefined,
            address: form.address,
            city_id: pathaoLoc.cityId!,
            zone_id: pathaoLoc.zoneId!,
            area_id: pathaoLoc.areaId!,
          },
        }).unwrap();

        toast.success("Pathao store created!", {
          description: `${form.storeName} registered in ${pathaoLoc.cityName} → ${pathaoLoc.zoneName} → ${pathaoLoc.areaName}`,
        });
      } else if (isRedx) {
        await createRedxStore({
          courierProviderId: selectedProvider.id,
          environment,
          storeData: {
            name: form.storeName,
            phone: form.contactPhone,
            address: form.address,
            area_id: redxLoc.areaId!,
          },
        }).unwrap();

        toast.success("RedX store created!", {
          description: `${form.storeName} registered in ${redxLoc.areaName}`,
        });
      } else {
        // Generic/other couriers — show info
        toast.info("Store registration submitted", {
          description: "Provider-specific API not yet integrated.",
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error("Failed to create store", {
        description: err?.data?.message || "Please check your details and try again.",
      });
    }
  };

  const providerColor = isPathao
    ? { ring: "ring-teal-500", bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" }
    : isRedx
    ? { ring: "ring-red-500", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" }
    : { ring: "ring-slate-300", bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl flex flex-col gap-0 p-0 overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-teal-50/60 to-slate-50 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SheetTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-teal-600 text-white">
                  <Store className="w-4 h-4" />
                </div>
                Create Pickup Store
              </SheetTitle>
              <SheetDescription className="mt-1 text-slate-500 text-sm">
                {vendor ? (
                  <>
                    Registering for{" "}
                    <span className="font-semibold text-slate-700">{vendor.storeName}</span>
                  </>
                ) : (
                  "Select a vendor to continue"
                )}
              </SheetDescription>
            </div>
            <Badge
              variant="outline"
              className={`mt-1 text-xs flex-shrink-0 ${providerColor.bg} ${providerColor.text} ${providerColor.border}`}
            >
              {environment}
            </Badge>
          </div>
        </SheetHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Courier Provider Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Courier Provider <span className="text-red-500">*</span>
            </Label>
            {providersLoading ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading providers…
              </div>
            ) : providers.length === 0 ? (
              <div className="flex items-center gap-2 text-red-600 text-sm py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4" />
                No active courier providers configured.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {providers.map((p) => {
                  const isSelected = selectedProvider?.id === p.id;
                  const slug = p.name.toUpperCase();
                  const color = slug === "PATHAO"
                    ? "teal"
                    : slug === "REDX"
                    ? "red"
                    : "slate";
                  const colorCls = {
                    teal: isSelected ? "border-teal-500 bg-teal-50 ring-2 ring-teal-200" : "border-slate-200 hover:border-teal-300",
                    red: isSelected ? "border-red-500 bg-red-50 ring-2 ring-red-200" : "border-slate-200 hover:border-red-300",
                    slate: isSelected ? "border-slate-400 bg-slate-50 ring-2 ring-slate-200" : "border-slate-200 hover:border-slate-400",
                  }[color];

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProvider(p)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-150 text-left ${colorCls}`}
                    >
                      <div className={`p-2 rounded-lg flex-shrink-0 ${
                        color === "teal" ? "bg-teal-100 text-teal-700"
                        : color === "red" ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-600"
                      }`}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{p.displayName || p.name}</p>
                        {p.description && (
                          <p className="text-xs text-slate-500 truncate">{p.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className="text-[10px] py-0">
                          {p.authType}
                        </Badge>
                        {isSelected && (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            color === "teal" ? "bg-teal-600" : color === "red" ? "bg-red-600" : "bg-slate-600"
                          }`}>
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedProvider && (
            <>
              <Separator />

              {/* Warehouse auto-fill */}
              <WarehouseAutoFill
                warehouses={warehouses}
                selectedWarehouseId={sourceWarehouseId}
                onSelect={applyWarehouse}
                onClear={resetAll}
                isLoading={warehousesLoading}
              />

              {/* Store details */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" /> Store Details
                </p>
                <StoreFormFields
                  form={form}
                  autoFilledFields={autoFilledFields}
                  isPathao={isPathao}
                  onChange={updateForm}
                />
              </div>

              <Separator />

              {/* Location fields */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {isPathao ? "Pathao Coverage Area" : isRedx ? "RedX Delivery Area" : "Pickup Area"}
                </p>

                {!isPathao && !isRedx && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 text-sm text-amber-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Location fields for{" "}
                    <strong>{selectedProvider.displayName}</strong> are not yet configured.
                  </div>
                )}

                {isPathao && (
                  <PathaoLocationFields
                    courierProviderId={selectedProvider.id}
                    environment={environment}
                    location={pathaoLoc}
                    warehouseLocationHint={warehouseLocationHint}
                    onChange={setPathaoLoc}
                  />
                )}

                {isRedx && (
                  <RedxLocationFields
                    courierProviderId={selectedProvider.id}
                    environment={environment}
                    location={redxLoc}
                    warehouseLocationHint={warehouseLocationHint}
                    onChange={setRedxLoc}
                  />
                )}
              </div>

              {/* Final summary when ready */}
              {isFormValid && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200 space-y-2">
                  <p className="text-xs font-semibold text-green-800 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Ready to Create
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                    <div><span className="text-slate-400">Store</span><br /><strong>{form.storeName}</strong></div>
                    <div><span className="text-slate-400">Phone</span><br /><strong>{form.contactPhone}</strong></div>
                    {isPathao && pathaoLoc.cityName && (
                      <div className="col-span-2 flex items-center gap-1 flex-wrap">
                        <span className="text-slate-400">Location:</span>
                        <span className="font-medium">{pathaoLoc.cityName}</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                        <span className="font-medium">{pathaoLoc.zoneName}</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                        <span className="font-medium">{pathaoLoc.areaName}</span>
                      </div>
                    )}
                    {isRedx && redxLoc.areaName && (
                      <div className="col-span-2">
                        <span className="text-slate-400">Area:</span>{" "}
                        <strong>{redxLoc.areaName}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
          <Button variant="outline" onClick={onClose} size="sm" disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isCreating}
            size="sm"
            className={`gap-2 min-w-32 ${
              isPathao
                ? "bg-teal-600 hover:bg-teal-700"
                : isRedx
                ? "bg-red-600 hover:bg-red-700"
                : "bg-slate-700 hover:bg-slate-800"
            }`}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <Store className="w-3.5 h-3.5" />
                Create Store
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}