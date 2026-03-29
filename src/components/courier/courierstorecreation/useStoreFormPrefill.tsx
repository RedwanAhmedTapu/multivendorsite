import { useState, useEffect, useCallback } from "react";
import type { Warehouse } from "@/features/warehouseApi";
import { useGetLocationByIdQuery } from "@/features/locationApi";
import type {
  StoreFormValues,
  PathaoLocation,
  RedxLocation,
  AutoFilledField,
} from "@/types/courier-store";

const EMPTY_FORM: StoreFormValues = {
  storeName: "",
  contactName: "",
  contactPhone: "",
  secondaryPhone: "",
  address: "",
};

const EMPTY_PATHAO: PathaoLocation = {
  cityId: null,
  cityName: "",
  zoneId: null,
  zoneName: "",
  areaId: null,
  areaName: "",
};

const EMPTY_REDX: RedxLocation = {
  areaId: null,
  areaName: "",
  districtFilter: "",
};

export function useStoreFormPrefill(
  defaultWarehouse: Warehouse | null,
  courierSlug: string
) {
  const [form, setForm] = useState<StoreFormValues>(EMPTY_FORM);
  const [pathaoLoc, setPathaoLoc] = useState<PathaoLocation>(EMPTY_PATHAO);
  const [redxLoc, setRedxLoc] = useState<RedxLocation>(EMPTY_REDX);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<AutoFilledField>>(new Set());
  const [sourceWarehouseId, setSourceWarehouseId] = useState<string | null>(null);

  // Fetch warehouse's locationId to resolve names
  const locationId = defaultWarehouse?.locationId ?? null;
  const { data: locationData } = useGetLocationByIdQuery(locationId!, {
    skip: !locationId,
  });

  // Apply warehouse data to form + attempt location prefill
  const applyWarehouse = useCallback(
    (w: Warehouse) => {
      const filled = new Set<AutoFilledField>();

      setForm((prev) => {
        const next = { ...prev };
        if (w.name) { next.storeName = w.name; filled.add("storeName"); }
        if (w.phone) { next.contactPhone = w.phone; filled.add("contactPhone"); }
        if (w.address) { next.address = w.address; filled.add("address"); }
        if (w.vendor?.name) { next.contactName = w.vendor.name; filled.add("contactName"); }
        return next;
      });

      setAutoFilledFields(filled);
      setSourceWarehouseId(w.id);
    },
    []
  );

  // When location data resolves, try to map to courier-specific IDs
  useEffect(() => {
    if (!locationData?.data || !defaultWarehouse) return;
    const loc = locationData.data;

    // For Pathao: warehouse location → thana/district/division map
    // We store location names here so the UI can attempt a match against
    // the Pathao cities/zones/areas dropdowns by name.
    if (courierSlug === "PATHAO") {
      setPathaoLoc((prev) => ({
        ...prev,
        // Names are used to attempt fuzzy match in PathaoLocationFields
        _locationName: loc.name,
        _locationLevel: loc.level,
        _parentName: loc.locations?.name ?? "",
        _grandParentName: loc.locations?.locations?.name ?? "",
      } as any));
    }

    if (courierSlug === "REDX") {
      setRedxLoc((prev) => ({
        ...prev,
        // Pass district name for filter pre-selection
        districtFilter: loc.level === "DISTRICT"
          ? loc.name
          : loc.level === "THANA"
          ? (loc.locations?.name ?? "")
          : "",
      }));
    }
  }, [locationData, defaultWarehouse, courierSlug]);

  // Auto-apply default warehouse on mount / when warehouse changes
  useEffect(() => {
    if (defaultWarehouse) {
      applyWarehouse(defaultWarehouse);
    } else {
      resetAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultWarehouse?.id]);

  const clearField = useCallback((field: AutoFilledField) => {
    setAutoFilledFields((prev) => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setForm(EMPTY_FORM);
    setPathaoLoc(EMPTY_PATHAO);
    setRedxLoc(EMPTY_REDX);
    setAutoFilledFields(new Set());
    setSourceWarehouseId(null);
  }, []);

  const updateForm = useCallback(
    (field: keyof StoreFormValues, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      // Clear auto-fill marker when user manually edits
      if (["storeName", "contactName", "contactPhone", "address"].includes(field)) {
        clearField(field as AutoFilledField);
      }
    },
    [clearField]
  );

  return {
    form,
    setForm,
    updateForm,
    pathaoLoc,
    setPathaoLoc,
    redxLoc,
    setRedxLoc,
    autoFilledFields,
    sourceWarehouseId,
    applyWarehouse,
    resetAll,
    clearField,
    warehouseLocationHint: locationData?.data ?? null,
  };
}