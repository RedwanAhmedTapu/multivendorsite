// components/locations/LocationForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button, Field, Modal, Skeleton, Toggle, inputCls } from "@/components/payouts/ui";
import {
  useCreateLocationMutation,
  useGetDistrictsQuery,
  useGetDivisionsQuery,
  useGetLocationByIdQuery,
  useUpdateLocationMutation,
  type LocationLevel,
} from "@/features/locationApi";

interface LocationFormProps {
  open: boolean;
  onClose: () => void;
  locationId?: string | null;
}

interface FormState {
  name: string;
  nameLocal: string;
  level: LocationLevel;
  divisionId: string;
  parentId: string;
  externalCode: string;
  sortOrder: string;
  isCodSupported: boolean;
  isDgCodSupported: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  nameLocal: "",
  level: "DIVISION",
  divisionId: "",
  parentId: "",
  externalCode: "",
  sortOrder: "",
  isCodSupported: false,
  isDgCodSupported: false,
};

const LEVEL_OPTIONS: { value: LocationLevel; label: string }[] = [
  { value: "DIVISION", label: "Division" },
  { value: "DISTRICT", label: "District" },
  { value: "THANA", label: "Thana / Area" },
];

export default function LocationForm({ open, onClose, locationId }: LocationFormProps) {
  const isEditing = Boolean(locationId);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<{ name?: string; parentId?: string }>({});
  const [prefilledFor, setPrefilledFor] = useState<string | null>(null);

  const { data: locationData, isFetching: isFetchingLocation } = useGetLocationByIdQuery(
    locationId as string,
    { skip: !open || !locationId },
  );
  const { data: divisionsData, isFetching: isFetchingDivisions } = useGetDivisionsQuery(undefined, {
    skip: !open,
  });
  // All districts (unfiltered) — used to resolve a thana's division during edit prefill
  const { data: allDistrictsData } = useGetDistrictsQuery(undefined, { skip: !open });
  const { data: districtsData, isFetching: isFetchingDistricts } = useGetDistrictsQuery(
    form.divisionId || undefined,
    { skip: !open || form.level !== "THANA" || !form.divisionId },
  );

  const [createLocation, { isLoading: isCreating }] = useCreateLocationMutation();
  const [updateLocation, { isLoading: isUpdating }] = useUpdateLocationMutation();
  const isSaving = isCreating || isUpdating;

  const divisions = divisionsData?.data ?? [];
  const parentOptions =
    form.level === "DISTRICT"
      ? divisions
      : form.level === "THANA"
        ? (districtsData?.data ?? [])
        : [];

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key === "name" ? "name" : "parentId"]: undefined }));
  };

  // Reset when dialog opens for a different location
  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setErrors({});
      setPrefilledFor(null);
    }
  }, [open, locationId]);

  // Prefill form once the location data arrives
  useEffect(() => {
    const loc = locationData?.data;
    if (!open || !loc || prefilledFor === loc.id) return;
    const parentDistrict =
      loc.level === "THANA"
        ? (allDistrictsData?.data ?? []).find((d) => d.id === loc.parent_id)
        : undefined;
    setForm({
      name: loc.name ?? "",
      nameLocal: loc.name_local ?? "",
      level: loc.level,
      divisionId: loc.level === "DISTRICT" ? (loc.parent_id ?? "") : (parentDistrict?.parent_id ?? ""),
      parentId: loc.parent_id ?? "",
      externalCode: loc.external_code ?? "",
      sortOrder: loc.sort_order != null ? String(loc.sort_order) : "",
      isCodSupported: Boolean(loc.is_cod_supported),
      isDgCodSupported: Boolean(loc.is_dg_cod_supported),
    });
    setPrefilledFor(loc.id);
  }, [open, locationData, allDistrictsData, prefilledFor]);

  const handleSubmit = async () => {
    const nextErrors: { name?: string; parentId?: string } = {};
    if (form.name.trim().length < 2) nextErrors.name = "Name is required (at least 2 characters).";
    if (form.level !== "DIVISION" && !form.parentId) nextErrors.parentId = "Please select a parent location.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      name: form.name.trim(),
      nameLocal: form.nameLocal.trim() || undefined,
      externalCode: form.externalCode.trim() || undefined,
      sortOrder: form.sortOrder.trim() === "" ? undefined : Number(form.sortOrder),
      isCodSupported: form.isCodSupported,
      isDgCodSupported: form.isDgCodSupported,
    };

    try {
      if (isEditing && locationId) {
        await updateLocation({
          id: locationId,
          data: { ...payload, parentId: form.level === "DIVISION" ? undefined : form.parentId },
        }).unwrap();
        toast.success("Location updated successfully");
      } else {
        await createLocation({
          ...payload,
          level: form.level,
          parentId: form.level === "DIVISION" ? undefined : form.parentId,
        }).unwrap();
        toast.success("Location created successfully");
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save location. Please try again.");
    }
  };

  const parentLabel = form.level === "DISTRICT" ? "Division" : "District";
  const isFetchingParents = form.level === "DISTRICT" ? isFetchingDivisions : isFetchingDistricts;

  return (
    <Modal
      open={open}
      title={isEditing ? "Edit Location" : "Add Location"}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={isSaving}>
            {isEditing ? "Save Changes" : "Create Location"}
          </Button>
        </>
      }
    >
      {isEditing && isFetchingLocation ? (
        <Skeleton rows={5} />
      ) : (
        <div className="space-y-4">
          <Field label="Level" hint={isEditing ? "Level cannot be changed after creation." : "Select the hierarchy level."}>
            <select
              className={inputCls}
              value={form.level}
              disabled={isEditing}
              onChange={(e) => {
                const level = e.target.value as LocationLevel;
                setForm((f) => ({ ...f, level, divisionId: "", parentId: "" }));
              }}
            >
              {LEVEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name (English)" error={errors.name}>
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Dhaka"
                maxLength={120}
              />
            </Field>
            <Field label="Name (Local)" hint="Optional — shown in Bangla where supported.">
              <input
                className={inputCls}
                value={form.nameLocal}
                onChange={(e) => set("nameLocal", e.target.value)}
                placeholder="e.g. ঢাকা"
                maxLength={120}
              />
            </Field>
          </div>

          {form.level === "THANA" && (
            <Field label="Division">
              <select
                className={inputCls}
                value={form.divisionId}
                onChange={(e) => setForm((f) => ({ ...f, divisionId: e.target.value, parentId: "" }))}
              >
                <option value="">Select division</option>
                {divisions.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </Field>
          )}

          {form.level !== "DIVISION" && (
            <Field label={parentLabel} error={errors.parentId} hint={form.level === "THANA" && !form.divisionId ? "Select a division first." : undefined}>
              <select
                className={inputCls}
                value={form.parentId}
                disabled={form.level === "THANA" && !form.divisionId}
                onChange={(e) => set("parentId", e.target.value)}
              >
                <option value="">
                  {isFetchingParents ? "Loading..." : `Select ${parentLabel.toLowerCase()}`}
                </option>
                {parentOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="External Code" hint="Optional — courier / sync reference code.">
              <input
                className={inputCls}
                value={form.externalCode}
                onChange={(e) => set("externalCode", e.target.value)}
                placeholder="e.g. DHA-01"
                maxLength={40}
              />
            </Field>
            <Field label="Sort Order" hint="Optional — lower values appear first.">
              <input
                className={inputCls}
                type="number"
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", e.target.value)}
                placeholder="0"
              />
            </Field>
          </div>

          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <Toggle
              checked={form.isCodSupported}
              onChange={(v) => set("isCodSupported", v)}
              label="Cash on Delivery (COD)"
              hint="Orders in this location can be delivered with cash collection."
            />
            <Toggle
              checked={form.isDgCodSupported}
              onChange={(v) => set("isDgCodSupported", v)}
              label="Delivery Guarantee COD (DG COD)"
              hint="Enable DG-supported cash collection for this location."
            />
          </div>

          {!isEditing && (
            <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-[#4338CA]" />
              New locations appear in the list, tree view, and courier area sync immediately.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
