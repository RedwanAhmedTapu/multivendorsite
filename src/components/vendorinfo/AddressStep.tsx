// components/vendor/steps/AddressStep.tsx
import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { RootState } from '@/store/store';
import {
  useGetDivisionsQuery,
  useGetDistrictsQuery,
  useGetThanasQuery,
  Location,
} from '@/features/locationApi';
import {
  useCreateOrUpdateBulkWarehousesMutation,
  useGetWarehousesByVendorQuery,
  WarehouseType,
  BulkWarehouseRequest,
} from '@/features/warehouseApi';

interface AddressFormData {
  detailsAddress: string;
  city: string;
  zone: string;
  area: string;
  warehouseType: WarehouseType;
  warehouseName?: string;
  warehouseEmail?: string;
  warehousePhone?: string;
  sameAsWarehouse?: boolean;
  returnAddress?: string;
  returnCity?: string;
  returnZone?: string;
  returnArea?: string;
  returnName?: string;
  returnEmail?: string;
  returnPhone?: string;
}

interface AddressStepProps {
  form: UseFormReturn<AddressFormData>;
  warehouseId?: string;
  onSuccess?: (warehouseId: string, locationId: string) => void;
  isSubmitting?: boolean;
  onBack: () => void;
  showBackButton?: boolean;
  onClearError: (field: string) => void;
}

/* ── Small SVG helpers ── */
const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    fill="none" stroke="currentColor" viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

/* ── Shared input style ── */
const inputCls = (hasError?: boolean) =>
  `w-full px-4 py-3 rounded-xl border-2 text-sm text-slate-900 font-medium placeholder-slate-300 focus:outline-none transition-all ${
    hasError
      ? 'border-red-300 bg-red-50 focus:border-red-400'
      : 'border-slate-200 focus:border-blue-500'
  }`;

/* ── Location cascading dropdown ── */
interface LocationDropdownProps {
  label: string;
  required?: boolean;
  display: string;
  open: boolean;
  onToggle: () => void;
  divisions: Location[];
  districts: Location[];
  thanas: Location[];
  returnDistricts?: Location[];
  returnThanas?: Location[];
  selectedDivisionId: string;
  selectedDistrictId: string;
  selectedThanaId: string;
  onDivisionClick: (id: string) => void;
  onDistrictClick: (id: string) => void;
  onThanaClick: (divId: string, disId: string, thanaId: string) => void;
  loading?: boolean;
  isReturn?: boolean;
  returnDivisionId?: string;
  returnDistrictId?: string;
}

const LocationDropdown: React.FC<LocationDropdownProps> = ({
  label, required, display, open, onToggle,
  divisions, districts, thanas,
  returnDistricts = [], returnThanas = [],
  selectedDivisionId, selectedDistrictId, selectedThanaId,
  onDivisionClick, onDistrictClick, onThanaClick,
  loading, isReturn,
  returnDivisionId, returnDistrictId,
}) => {
  const activeDivId = isReturn ? (returnDivisionId || '') : selectedDivisionId;
  const activeDisId = isReturn ? (returnDistrictId || '') : selectedDistrictId;
  const activeDistricts = isReturn ? returnDistricts : districts;
  const activeThanas = isReturn ? returnThanas : thanas;

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-black uppercase tracking-widest text-slate-500">
        {label} {required && <span className="text-red-500 normal-case">*</span>}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={onToggle}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all focus:outline-none ${
            open ? 'border-blue-500 bg-white' : 'border-slate-200 hover:border-slate-300'
          }`}
          style={{ backgroundColor: open ? '#fff' : '#faf8ff' }}
        >
          <span className={selectedThanaId || (isReturn && returnDivisionId) ? 'text-slate-900' : 'text-slate-400'}>
            {display}
          </span>
          <ChevronIcon open={open} />
        </button>

        {open && (
          <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-slate-500 text-sm">
                <SpinnerIcon /> Loading locations…
              </div>
            ) : divisions.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-400">No locations available</div>
            ) : (
              divisions.map((div) => (
                <div key={div.id}>
                  {/* Division */}
                  <button
                    type="button"
                    onClick={() => onDivisionClick(div.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm font-bold border-b border-slate-100 transition-colors ${
                      activeDivId === div.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {div.name}
                    {activeDivId === div.id && (
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>

                  {/* Districts */}
                  {activeDivId === div.id && activeDistricts.map((dis) => (
                    <div key={dis.id}>
                      <button
                        type="button"
                        onClick={() => onDistrictClick(dis.id)}
                        className={`w-full flex items-center justify-between pl-8 pr-4 py-2.5 text-left text-sm border-b border-slate-100 transition-colors ${
                          activeDisId === dis.id ? 'bg-blue-50/60 text-blue-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {dis.name}
                        {activeDisId === dis.id && (
                          <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </button>

                      {/* Thanas */}
                      {activeDisId === dis.id && activeThanas.map((thana) => (
                        <button
                          key={thana.id}
                          type="button"
                          onClick={() => onThanaClick(div.id, dis.id, thana.id)}
                          className={`w-full pl-14 pr-4 py-2 text-left text-[13px] transition-colors ${
                            selectedThanaId === thana.id ? 'bg-blue-600 text-white font-semibold' : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'
                          }`}
                        >
                          {thana.name}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Info row for table view ── */
const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
    <p className="text-sm font-semibold text-slate-900">{value || '—'}</p>
  </div>
);

/* ════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════ */
const AddressStep: React.FC<AddressStepProps> = ({
  form,
  warehouseId,
  onSuccess,
  isSubmitting: externalIsSubmitting,
  onBack,
  showBackButton = true,
  onClearError,
}) => {
  const { register, handleSubmit, formState: { errors, isValid }, watch, setValue, getValues, trigger } = form;
  const vendorId = useSelector((state: RootState) => state.auth.user?.vendorId);
  const watchedFields = watch();

  const [isEditMode, setIsEditMode] = useState(false);

  // Warehouse location state
  const [selectedDivisionId, setSelectedDivisionId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedThanaId, setSelectedThanaId] = useState('');
  const [locationOpen, setLocationOpen] = useState(false);

  // Return location state
  const [returnDivisionId, setReturnDivisionId] = useState('');
  const [returnDistrictId, setReturnDistrictId] = useState('');
  const [returnThanaId, setReturnThanaId] = useState('');
  const [returnLocationOpen, setReturnLocationOpen] = useState(false);

  const { data: divisionsData, isLoading: divisionsLoading } = useGetDivisionsQuery();
  const { data: districtsData } = useGetDistrictsQuery(selectedDivisionId, { skip: !selectedDivisionId });
  const { data: thanasData } = useGetThanasQuery(selectedDistrictId, { skip: !selectedDistrictId });
  const { data: returnDistrictsData } = useGetDistrictsQuery(returnDivisionId, { skip: !returnDivisionId });
  const { data: returnThanasData } = useGetThanasQuery(returnDistrictId, { skip: !returnDistrictId });

  const [createOrUpdateBulkWarehouses, { isLoading: isSaving }] = useCreateOrUpdateBulkWarehousesMutation();
  const { data: warehousesData, isLoading: isLoadingWarehouses } = useGetWarehousesByVendorQuery(
    { vendorId: vendorId || '' },
    { skip: !vendorId }
  );

  const isSubmitting = externalIsSubmitting || isSaving;

  const divisions: Location[] = divisionsData?.data || [];
  const districts: Location[] = districtsData?.data || [];
  const thanas: Location[] = thanasData?.data || [];
  const returnDistricts: Location[] = returnDistrictsData?.data || [];
  const returnThanas: Location[] = returnThanasData?.data || [];

  const pickupWarehouse = warehousesData?.data?.find((w: any) => w.type === WarehouseType.PICKUP);
  const dropoffWarehouse = warehousesData?.data?.find((w: any) => w.type === WarehouseType.DROPOFF);
  const hasExistingData = !isLoadingWarehouses && (pickupWarehouse || dropoffWarehouse);

  useEffect(() => { onClearError('submit'); }, [watchedFields, onClearError]);

  useEffect(() => {
    if (isEditMode && pickupWarehouse) {
      setValue('detailsAddress', pickupWarehouse.address || '');
      setValue('warehouseName', pickupWarehouse.name || '');
      setValue('warehouseEmail', pickupWarehouse.email || '');
      setValue('warehousePhone', pickupWarehouse.phone || '');
      if (pickupWarehouse.locationId) {
        setSelectedThanaId(pickupWarehouse.locationId);
        if (pickupWarehouse.location) {
          setValue('city', pickupWarehouse.location.city || '');
          setValue('zone', pickupWarehouse.location.state || '');
          setValue('area', pickupWarehouse.location.name || '');
        }
      }
      if (dropoffWarehouse) {
        setValue('sameAsWarehouse', false);
        setValue('returnAddress', dropoffWarehouse.address || '');
        setValue('returnName', dropoffWarehouse.name || '');
        setValue('returnEmail', dropoffWarehouse.email || '');
        setValue('returnPhone', dropoffWarehouse.phone || '');
        if (dropoffWarehouse.locationId) {
          setReturnThanaId(dropoffWarehouse.locationId);
          if (dropoffWarehouse.location) {
            setValue('returnCity', dropoffWarehouse.location.city || '');
            setValue('returnZone', dropoffWarehouse.location.state || '');
            setValue('returnArea', dropoffWarehouse.location.name || '');
          }
        }
      } else {
        setValue('sameAsWarehouse', true);
      }
    }
  }, [isEditMode, pickupWarehouse, dropoffWarehouse, setValue]);

  const getLocationDisplay = () => {
    const v = getValues();
    if (v.area && v.zone && v.city) return `${v.area} / ${v.zone} / ${v.city}`;
    const parts = [];
    if (selectedThanaId) { const t = thanas.find(x => x.id === selectedThanaId); if (t) parts.push(t.name); }
    if (selectedDistrictId) { const d = districts.find(x => x.id === selectedDistrictId); if (d) parts.push(d.name); }
    if (selectedDivisionId) { const d = divisions.find(x => x.id === selectedDivisionId); if (d) parts.push(d.name); }
    return parts.length ? parts.join(' / ') : 'Select area, district, division';
  };

  const getReturnLocationDisplay = () => {
    const v = getValues();
    if (v.returnArea && v.returnZone && v.returnCity) return `${v.returnArea} / ${v.returnZone} / ${v.returnCity}`;
    const parts = [];
    if (returnThanaId) { const t = returnThanas.find(x => x.id === returnThanaId); if (t) parts.push(t.name); }
    if (returnDistrictId) { const d = returnDistricts.find(x => x.id === returnDistrictId); if (d) parts.push(d.name); }
    if (returnDivisionId) { const d = divisions.find(x => x.id === returnDivisionId); if (d) parts.push(d.name); }
    return parts.length ? parts.join(' / ') : 'Select area, district, division';
  };

  const handleLocationSelect = (divId: string, disId: string, thanaId: string) => {
    setSelectedDivisionId(divId); setSelectedDistrictId(disId); setSelectedThanaId(thanaId);
    const div = divisions.find(d => d.id === divId);
    const dis = districts.find(d => d.id === disId);
    const thana = thanas.find(t => t.id === thanaId);
    if (div) setValue('city', div.name);
    if (dis) setValue('zone', dis.name);
    if (thana) setValue('area', thana.name);
    setLocationOpen(false);
  };

  const handleReturnLocationSelect = (divId: string, disId: string, thanaId: string) => {
    setReturnDivisionId(divId); setReturnDistrictId(disId); setReturnThanaId(thanaId);
    const div = divisions.find(d => d.id === divId);
    const dis = returnDistricts.find(d => d.id === disId);
    const thana = returnThanas.find(t => t.id === thanaId);
    if (div) setValue('returnCity', div.name);
    if (dis) setValue('returnZone', dis.name);
    if (thana) setValue('returnArea', thana.name);
    setReturnLocationOpen(false);
  };

  const resetLocationState = () => {
    setSelectedDivisionId(''); setSelectedDistrictId(''); setSelectedThanaId('');
    setReturnDivisionId(''); setReturnDistrictId(''); setReturnThanaId('');
    setValue('detailsAddress', ''); setValue('warehouseName', ''); setValue('warehouseEmail', ''); setValue('warehousePhone', '');
    setValue('returnAddress', ''); setValue('returnName', ''); setValue('returnEmail', ''); setValue('returnPhone', '');
  };

  const isFormValid = () => {
    const v = getValues();
    const wValid = v.detailsAddress && v.city && v.zone && v.area;
    const rValid = v.sameAsWarehouse || (v.returnAddress && v.returnCity && v.returnZone && v.returnArea);
    return !!(wValid && rValid && isValid);
  };

  const handleFormSubmit = async (data: AddressFormData) => {
    const valid = await trigger();
    if (!valid || !selectedThanaId) { toast.error('Please complete all required address fields'); return; }
    if (!vendorId) { toast.error('Vendor ID is missing. Please log in again.'); return; }

    try {
      const bulkData: BulkWarehouseRequest = {
        vendorId,
        pickupWarehouse: {
          locationId: selectedThanaId,
          address: data.detailsAddress,
          name: data.warehouseName,
          email: data.warehouseEmail,
          phone: data.warehousePhone,
        },
      };

      if (data.sameAsWarehouse) {
        bulkData.returnWarehouse = { locationId: selectedThanaId, address: data.detailsAddress, name: data.warehouseName, email: data.warehouseEmail, phone: data.warehousePhone, sameAsPickup: true };
      } else if (returnThanaId && data.returnAddress) {
        bulkData.returnWarehouse = { locationId: returnThanaId, address: data.returnAddress, name: data.returnName, email: data.returnEmail, phone: data.returnPhone, sameAsPickup: false };
      }

      const loadingToast = toast.loading(isEditMode ? 'Updating addresses…' : 'Saving addresses…');
      const result = await createOrUpdateBulkWarehouses(bulkData).unwrap();
      toast.dismiss(loadingToast);

      if (result.success) {
        setIsEditMode(false);
        resetLocationState();
        toast.success(isEditMode ? 'Addresses updated!' : 'Addresses saved!', { description: 'Warehouse and return addresses have been saved.', duration: 4000 });
        if (onSuccess && result.data.pickupWarehouse) onSuccess(result.data.pickupWarehouse.id, result.data.pickupWarehouse.locationId);
      }
    } catch (error: any) {
      toast.error('Failed to save addresses', { description: error?.data?.message || 'Please try again.', duration: 5000 });
    }
  };

  const handleCancelEdit = () => { setIsEditMode(false); resetLocationState(); };

  /* ── Section card wrapper ── */
  const SectionCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100" style={{ backgroundColor: '#f2f3ff' }}>
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">{icon}</div>
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">{title}</h3>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );

  /* ─── VIEW MODE (existing data) ─── */
  if (hasExistingData && !isEditMode) {
    const warehouseLocation = pickupWarehouse?.location
      ? [pickupWarehouse.location.name, pickupWarehouse.location.state, pickupWarehouse.location.city].filter(Boolean).join(', ')
      : '';
    const returnLocation = dropoffWarehouse?.location
      ? [dropoffWarehouse.location.name, dropoffWarehouse.location.state, dropoffWarehouse.location.city].filter(Boolean).join(', ')
      : '';

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Warehouse card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100" style={{ backgroundColor: '#f2f3ff' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-sm font-black uppercase tracking-wider text-slate-700">Warehouse Address</span>
            </div>
            <button
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <EditIcon /> Modify
            </button>
          </div>

          {pickupWarehouse ? (
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
              <InfoRow label="Name" value={pickupWarehouse.name || pickupWarehouse.vendor?.name} />
              <InfoRow label="Phone" value={pickupWarehouse.phone || pickupWarehouse.vendor?.phone} />
              <InfoRow label="Email" value={pickupWarehouse.email || pickupWarehouse.vendor?.email} />
              <div className="md:col-span-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Address</p>
                <p className="text-sm font-semibold text-slate-900">{pickupWarehouse.address}</p>
                {warehouseLocation && <p className="text-xs text-slate-500 mt-0.5">{warehouseLocation}</p>}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-slate-400 text-sm mb-4">No warehouse address found</p>
              <button onClick={() => setIsEditMode(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors">
                Add Address
              </button>
            </div>
          )}
        </div>

        {/* Return address card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100" style={{ backgroundColor: '#f2f3ff' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </div>
              <span className="text-sm font-black uppercase tracking-wider text-slate-700">Return Address</span>
            </div>
            {dropoffWarehouse && (
              <button
                onClick={() => setIsEditMode(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <EditIcon /> Modify
              </button>
            )}
          </div>

          {dropoffWarehouse ? (
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
              <InfoRow label="Name" value={dropoffWarehouse.name || dropoffWarehouse.vendor?.name} />
              <InfoRow label="Phone" value={dropoffWarehouse.phone || dropoffWarehouse.vendor?.phone} />
              <InfoRow label="Email" value={dropoffWarehouse.email || dropoffWarehouse.vendor?.email} />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Address</p>
                <p className="text-sm font-semibold text-slate-900">{dropoffWarehouse.address}</p>
                {returnLocation && <p className="text-xs text-slate-500 mt-0.5">{returnLocation}</p>}
              </div>
            </div>
          ) : (
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Same as warehouse address
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          {showBackButton ? (
            <button type="button" onClick={onBack} className="px-6 py-3 border-2 border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all">
              Back
            </button>
          ) : <div />}
          <button
            type="button"
            onClick={() => onSuccess?.(pickupWarehouse?.id || '', pickupWarehouse?.locationId || '')}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-all"
          >
            Continue
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  /* ─── FORM MODE ─── */
  const sameAsWarehouse = watch('sameAsWarehouse');

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="max-w-3xl mx-auto space-y-6">

      {!vendorId && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">
          <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Vendor ID not found. Please log in again.
        </div>
      )}

      {isLoadingWarehouses && (
        <div className="flex items-center justify-center gap-2 py-6 text-slate-500 text-sm">
          <SpinnerIcon /> Loading warehouse data…
        </div>
      )}

      {/* ── Warehouse Section ── */}
      <SectionCard
        title="Warehouse / Pickup Address"
        icon={
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        }
      >
        {/* Name / Email / Phone */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'warehouseName', label: 'Warehouse Name', type: 'text', placeholder: 'Enter name', reg: register('warehouseName') },
            { id: 'warehouseEmail', label: 'Email', type: 'email', placeholder: 'Enter email', reg: register('warehouseEmail', { pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' } }) },
            { id: 'warehousePhone', label: 'Phone', type: 'tel', placeholder: 'Enter phone', reg: register('warehousePhone', { pattern: { value: /^[0-9]{10,15}$/, message: 'Invalid phone (10-15 digits)' } }) },
          ].map(({ id, label, type, placeholder, reg }) => (
            <div key={id} className="space-y-1.5">
              <label htmlFor={id} className="block text-xs font-black uppercase tracking-widest text-slate-500">{label}</label>
              <input id={id} type={type} {...reg} className={inputCls((errors as any)[id])} placeholder={placeholder} style={{ backgroundColor: '#faf8ff' }} />
              {(errors as any)[id] && <p className="text-xs text-red-500 font-semibold">{(errors as any)[id]?.message}</p>}
            </div>
          ))}
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <label htmlFor="detailsAddress" className="block text-xs font-black uppercase tracking-widest text-slate-500">
            Street Address <span className="text-red-500 normal-case">*</span>
          </label>
          <input
            id="detailsAddress"
            type="text"
            {...register('detailsAddress', { required: 'Address is required', minLength: { value: 10, message: 'Minimum 10 characters' } })}
            className={inputCls(!!errors.detailsAddress)}
            placeholder="Building number, street, landmark…"
            style={{ backgroundColor: '#faf8ff' }}
          />
          {errors.detailsAddress && <p className="text-xs text-red-500 font-semibold">{errors.detailsAddress.message}</p>}
        </div>

        {/* Location dropdown */}
        <LocationDropdown
          label="Region / District / Area"
          required
          display={getLocationDisplay()}
          open={locationOpen}
          onToggle={() => setLocationOpen(p => !p)}
          divisions={divisions}
          districts={districts}
          thanas={thanas}
          selectedDivisionId={selectedDivisionId}
          selectedDistrictId={selectedDistrictId}
          selectedThanaId={selectedThanaId}
          onDivisionClick={(id) => { setSelectedDivisionId(id === selectedDivisionId ? '' : id); setSelectedDistrictId(''); }}
          onDistrictClick={(id) => { setSelectedDistrictId(id === selectedDistrictId ? '' : id); }}
          onThanaClick={handleLocationSelect}
          loading={divisionsLoading}
        />
      </SectionCard>

      {/* ── Return Section ── */}
      <SectionCard
        title="Return Address"
        icon={
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        }
      >
        {/* Same as warehouse toggle */}
        <label className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-blue-300 transition-colors" style={{ backgroundColor: '#faf8ff' }}>
          <div className="relative">
            <input type="checkbox" {...register('sameAsWarehouse')} className="sr-only peer" />
            <div className="w-11 h-6 rounded-full bg-slate-200 peer-checked:bg-blue-600 transition-colors" />
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Same as Warehouse Address</p>
            <p className="text-xs text-slate-500 mt-0.5">Return shipments go to the warehouse location</p>
          </div>
        </label>

        {!sameAsWarehouse && (
          <div className="space-y-5 pt-2">
            {/* Return name / email / phone */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'returnName', label: 'Return Name', type: 'text', placeholder: 'Enter name', reg: register('returnName') },
                { id: 'returnEmail', label: 'Email', type: 'email', placeholder: 'Enter email', reg: register('returnEmail', { pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' } }) },
                { id: 'returnPhone', label: 'Phone', type: 'tel', placeholder: 'Enter phone', reg: register('returnPhone', { pattern: { value: /^[0-9]{10,15}$/, message: 'Invalid phone (10-15 digits)' } }) },
              ].map(({ id, label, type, placeholder, reg }) => (
                <div key={id} className="space-y-1.5">
                  <label htmlFor={id} className="block text-xs font-black uppercase tracking-widest text-slate-500">{label}</label>
                  <input id={id} type={type} {...reg} className={inputCls((errors as any)[id])} placeholder={placeholder} style={{ backgroundColor: '#faf8ff' }} />
                  {(errors as any)[id] && <p className="text-xs text-red-500 font-semibold">{(errors as any)[id]?.message}</p>}
                </div>
              ))}
            </div>

            {/* Return address */}
            <div className="space-y-1.5">
              <label htmlFor="returnAddress" className="block text-xs font-black uppercase tracking-widest text-slate-500">
                Street Address <span className="text-red-500 normal-case">*</span>
              </label>
              <input
                id="returnAddress"
                type="text"
                {...register('returnAddress', { required: sameAsWarehouse ? false : 'Return address is required' })}
                className={inputCls(!!errors.returnAddress)}
                placeholder="Building number, street, landmark…"
                style={{ backgroundColor: '#faf8ff' }}
              />
              {errors.returnAddress && <p className="text-xs text-red-500 font-semibold">{errors.returnAddress.message}</p>}
            </div>

            {/* Return location dropdown */}
            <LocationDropdown
              label="Region / District / Area"
              required
              display={getReturnLocationDisplay()}
              open={returnLocationOpen}
              onToggle={() => setReturnLocationOpen(p => !p)}
              divisions={divisions}
              districts={returnDistricts}
              thanas={returnThanas}
              selectedDivisionId={selectedDivisionId}
              selectedDistrictId={selectedDistrictId}
              selectedThanaId={returnThanaId}
              onDivisionClick={(id) => { setReturnDivisionId(id === returnDivisionId ? '' : id); setReturnDistrictId(''); }}
              onDistrictClick={(id) => { setReturnDistrictId(id === returnDistrictId ? '' : id); }}
              onThanaClick={handleReturnLocationSelect}
              loading={divisionsLoading}
              isReturn
              returnDivisionId={returnDivisionId}
              returnDistrictId={returnDistrictId}
            />
          </div>
        )}
      </SectionCard>

      {/* Hidden fields */}
      <input type="hidden" {...register('city', { required: true })} />
      <input type="hidden" {...register('zone', { required: true })} />
      <input type="hidden" {...register('area', { required: true })} />
      <input type="hidden" {...register('warehouseType', { value: WarehouseType.PICKUP })} />

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <div className="flex gap-3">
          {showBackButton && !isEditMode && (
            <button type="button" onClick={onBack} disabled={isSubmitting} className="px-6 py-3 border-2 border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all">
              Back
            </button>
          )}
          {isEditMode && (
            <button type="button" onClick={handleCancelEdit} disabled={isSubmitting} className="px-6 py-3 border-2 border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all">
              Cancel
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !isFormValid() || !vendorId}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
        >
          {isSubmitting && <SpinnerIcon />}
          {isSubmitting ? 'Saving…' : isEditMode ? 'Update Addresses' : 'Save & Continue'}
          {!isSubmitting && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
};

export default AddressStep;