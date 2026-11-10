// components/vendor/steps/AddressStep.tsx
import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  useGetDivisionsQuery,
  useGetDistrictsQuery,
  useGetThanasQuery,
  Location,
} from '@/features/locationApi';

export interface AddressFormData {
  detailsAddress: string;
  city: string;
  zone: string;
  area: string;
}

export interface SelectedLocation {
  city: string;
  zone: string;
  area: string;
}

interface ExistingAddress {
  detailsAddress?: string;
  city?: string;
  zone?: string;
  area?: string;
}

interface AddressStepProps {
  form: UseFormReturn<AddressFormData>;
  onSubmit: (data: AddressFormData) => void;
  isSubmitting?: boolean;
  onBack: () => void;
  showBackButton?: boolean;
  onClearError: (field: string) => void;
  onLocationSelected?: (loc: SelectedLocation) => void;
  selectedLocation?: SelectedLocation | null;
  existingAddress?: ExistingAddress | null;
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

const PinIcon = () => (
  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

/* ── Shared input style (matches StoreInfoStep) ── */
const inputCls = (hasError?: boolean) =>
  `w-full px-4 py-3 rounded-xl border-2 text-sm text-slate-900 font-medium placeholder-slate-300 focus:outline-none transition-all ${
    hasError
      ? 'border-red-300 bg-red-50 focus:border-red-400'
      : 'border-slate-200 focus:border-blue-500'
  }`;

/* ── Info row for read-only view ── */
const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
    <p className="text-sm font-semibold text-slate-900">{value || '—'}</p>
  </div>
);

/* ── Section card wrapper (matches StoreInfoStep/BankInfoStep pattern) ──
   FIX: removed `overflow-hidden` from the outer wrapper — that was clipping
   the absolutely-positioned location dropdown whenever it extended past the
   card's bounds (very common on mobile / smaller viewports). Rounded
   corners are preserved by rounding the header (`rounded-t-2xl`) and the
   bottom content block (`rounded-b-2xl`) individually instead of relying on
   overflow-hidden on the parent. */
const SectionCard = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
    <div
      className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-100 rounded-t-2xl"
      style={{ backgroundColor: '#f2f3ff' }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}
      >
        {icon}
      </div>
      <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">{title}</h3>
    </div>
    <div className="p-4 sm:p-6 space-y-5 rounded-b-2xl">{children}</div>
  </div>
);

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
  selectedDivisionId: string;
  selectedDistrictId: string;
  selectedThanaId: string;
  onDivisionClick: (id: string) => void;
  onDistrictClick: (id: string) => void;
  onThanaClick: (divId: string, disId: string, thanaId: string) => void;
  loading?: boolean;
}

const LocationDropdown: React.FC<LocationDropdownProps> = ({
  label, required, display, open, onToggle,
  divisions, districts, thanas,
  selectedDivisionId, selectedDistrictId, selectedThanaId,
  onDivisionClick, onDistrictClick, onThanaClick,
  loading,
}) => {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-black uppercase tracking-widest text-slate-500">
        {label} {required && <span className="text-red-500 normal-case">*</span>}
      </label>
      {/* relative + isolate so the absolute panel below always stacks above
          any sibling/parent content instead of getting hidden underneath */}
      <div className="relative isolate">
        <button
          type="button"
          onClick={onToggle}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all focus:outline-none ${
            open ? 'border-blue-500 bg-white' : 'border-slate-200 hover:border-slate-300'
          }`}
          style={{ backgroundColor: open ? '#fff' : '#faf8ff' }}
        >
          <span className={`text-left truncate pr-2 ${selectedThanaId ? 'text-slate-900' : 'text-slate-400'}`}>
            {display}
          </span>
          <ChevronIcon open={open} />
        </button>

        {open && (
          // FIX: bumped z-index above the page-level z-50 elements that were
          // stacking on top of it, and capped height with a viewport-relative
          // max-height so the panel never runs off-screen on short mobile
          // viewports.
          <div className="absolute z-[100] left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-y-auto max-h-[60vh] sm:max-h-72">
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
                      selectedDivisionId === div.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {div.name}
                    {selectedDivisionId === div.id && (
                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>

                  {/* Districts */}
                  {selectedDivisionId === div.id && districts.map((dis) => (
                    <div key={dis.id}>
                      <button
                        type="button"
                        onClick={() => onDistrictClick(dis.id)}
                        className={`w-full flex items-center justify-between pl-8 pr-4 py-2.5 text-left text-sm border-b border-slate-100 transition-colors ${
                          selectedDistrictId === dis.id ? 'bg-blue-50/60 text-blue-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {dis.name}
                        {selectedDistrictId === dis.id && (
                          <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </button>

                      {/* Thanas */}
                      {selectedDistrictId === dis.id && thanas.map((thana) => (
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

/* ════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════ */
const AddressStep: React.FC<AddressStepProps> = ({
  form,
  onSubmit,
  isSubmitting = false,
  onBack,
  showBackButton = true,
  onClearError,
  onLocationSelected,
  selectedLocation,
  existingAddress,
}) => {
  const { register, handleSubmit, formState: { errors, isValid }, watch, setValue, getValues, trigger } = form;
  const watchedFields = watch();

  const [isEditMode, setIsEditMode] = useState(false);

  const [selectedDivisionId, setSelectedDivisionId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedThanaId, setSelectedThanaId] = useState('');
  const [locationOpen, setLocationOpen] = useState(false);

  const { data: divisionsData, isLoading: divisionsLoading } = useGetDivisionsQuery();
  const { data: districtsData } = useGetDistrictsQuery(selectedDivisionId, { skip: !selectedDivisionId });
  const { data: thanasData } = useGetThanasQuery(selectedDistrictId, { skip: !selectedDistrictId });

  const divisions: Location[] = divisionsData?.data || [];
  const districts: Location[] = districtsData?.data || [];
  const thanas: Location[] = thanasData?.data || [];

  const hasExistingAddress = !!(existingAddress?.detailsAddress && existingAddress?.city);

  useEffect(() => { onClearError('submit'); }, [watchedFields, onClearError]);

  // Pre-fill form when existing address is present (and not editing)
  useEffect(() => {
    if (existingAddress && !isEditMode) {
      setValue('detailsAddress', existingAddress.detailsAddress || '');
      setValue('city', existingAddress.city || '');
      setValue('zone', existingAddress.zone || '');
      setValue('area', existingAddress.area || '');
    }
  }, [existingAddress, isEditMode, setValue]);

  const getLocationDisplay = () => {
    const v = getValues();
    if (v.area && v.zone && v.city) return `${v.area} / ${v.zone} / ${v.city}`;
    const parts: string[] = [];
    if (selectedThanaId) { const t = thanas.find(x => x.id === selectedThanaId); if (t) parts.push(t.name); }
    if (selectedDistrictId) { const d = districts.find(x => x.id === selectedDistrictId); if (d) parts.push(d.name); }
    if (selectedDivisionId) { const d = divisions.find(x => x.id === selectedDivisionId); if (d) parts.push(d.name); }
    return parts.length ? parts.join(' / ') : 'Select area, district, division';
  };

  const handleLocationSelect = (divId: string, disId: string, thanaId: string) => {
    setSelectedDivisionId(divId); setSelectedDistrictId(disId); setSelectedThanaId(thanaId);
    const div = divisions.find(d => d.id === divId);
    const dis = districts.find(d => d.id === disId);
    const thana = thanas.find(t => t.id === thanaId);

    const loc: SelectedLocation = {
      city: div?.name || '',
      zone: dis?.name || '',
      area: thana?.name || '',
    };
    if (div) setValue('city', loc.city);
    if (dis) setValue('zone', loc.zone);
    if (thana) setValue('area', loc.area);
    onLocationSelected?.(loc);
    setLocationOpen(false);
  };

 const isFormValid = () => {
  const v = getValues();
  return !!(
    v.detailsAddress &&
    v.detailsAddress.trim().length >= 10 && 
    v.city &&
    v.zone &&
    v.area
  );
};

  const handleFormSubmit = async (data: AddressFormData) => {
    const valid = await trigger();
    if (!valid || !data.city || !data.zone || !data.area) return;
    onSubmit(data);
  };

  const handleEditClick = () => {
    setIsEditMode(true);
    setValue('detailsAddress', existingAddress?.detailsAddress || '');
  };

  /* ─── VIEW MODE (address already saved) ─── */
  if (hasExistingAddress && !isEditMode) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-0">
        <div
          className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          style={{ backgroundColor: '#f2f3ff' }}
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 sm:px-8 py-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white font-bold text-sm tracking-wide uppercase">Vendor Address Saved</span>
            </div>
            <button
              type="button"
              onClick={handleEditClick}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white text-sm font-semibold rounded-lg transition-all"
            >
              <EditIcon />
              Edit
            </button>
          </div>

          <div className="p-5 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-md flex-shrink-0">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 min-w-0">
                <div className="sm:col-span-2">
                  <InfoRow label="Street Address" value={existingAddress?.detailsAddress} />
                </div>
                <InfoRow label="Area" value={existingAddress?.area} />
                <InfoRow label="District / Region" value={`${existingAddress?.zone || '—'} / ${existingAddress?.city || '—'}`} />
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4 font-medium">
          Click <span className="text-blue-600 font-bold">Edit</span> to modify your address, or continue to the next step
        </p>

        <div className="flex justify-between pt-6">
          {showBackButton ? (
            <button type="button" onClick={onBack} className="px-6 py-3 border-2 border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all">
              Back
            </button>
          ) : <div />}
          <button
            type="button"
            onClick={() => onSubmit(getValues())}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] disabled:opacity-50 transition-all"
          >
            {isSubmitting && <SpinnerIcon />}
            Continue
            {!isSubmitting && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            )}
          </button>
        </div>
      </div>
    );
  }

  /* ─── FORM MODE ─── */
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="max-w-2xl mx-auto space-y-8 px-4 sm:px-0">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Vendor Address</h2>
        <p className="text-slate-500 mt-1 text-sm">Where should we reach you and pick up your products?</p>
      </div>

      <SectionCard title="Vendor Address" icon={<PinIcon />}>
        {/* Street Address */}
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
          {errors.detailsAddress ? (
            <p className="text-xs text-red-500 font-semibold">{errors.detailsAddress.message as string}</p>
          ) : existingAddress?.detailsAddress ? (
            <p className="text-xs text-blue-600 font-semibold">✓ Current: {existingAddress.detailsAddress}</p>
          ) : null}
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

      {/* Hidden fields registered for validation */}
      <input type="hidden" {...register('city', { required: true })} />
      <input type="hidden" {...register('zone', { required: true })} />
      <input type="hidden" {...register('area', { required: true })} />

      {/* Navigation */}
      <div className="flex justify-between pt-2 flex-wrap gap-3">
        <div className="flex gap-3">
          {showBackButton && !isEditMode && (
            <button type="button" onClick={onBack} disabled={isSubmitting} className="px-6 py-3 border-2 border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all">
              Back
            </button>
          )}
          {isEditMode && (
            <button type="button" onClick={() => setIsEditMode(false)} disabled={isSubmitting} className="px-6 py-3 border-2 border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all">
              Cancel
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !isFormValid()}
          className="flex items-center gap-2 px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
        >
          {isSubmitting && <SpinnerIcon />}
          {isSubmitting ? 'Saving…' : isEditMode ? 'Update Address' : 'Save & Continue'}
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