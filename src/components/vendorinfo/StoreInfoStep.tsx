// components/vendor/steps/StoreInfoStep.tsx
import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

interface StoreInfoStepProps {
  form: UseFormReturn<any>;
  onSubmit: (data: any, avatarFile?: File | null) => void;
  isSubmitting: boolean;
  vendor?: any;
  onClearError: (field: string) => void;
  onAvatarChange?: (file: File | null) => void;
  avatarPreview?: string | null;
  viewMode?: boolean;
  onEditClick?: () => void;
}

const StoreInfoStep: React.FC<StoreInfoStepProps> = ({
  form,
  onSubmit,
  isSubmitting,
  vendor,
  onClearError,
  onAvatarChange,
  avatarPreview,
  viewMode = false,
  onEditClick,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    trigger,
    setValue,
  } = form;

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarPreview || null);
  const [dragOver, setDragOver] = useState(false);

  const watchedFields = watch(['storeName']);

  useEffect(() => {
    onClearError('submit');
  }, [watchedFields, onClearError]);

  useEffect(() => {
    if (vendor) {
      if (vendor.storeName) setValue('storeName', vendor.storeName);
      if (vendor.avatar) setPreviewUrl(vendor.avatar);
    }
  }, [vendor, setValue]);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB');
      return;
    }
    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    onAvatarChange?.(file);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    else {
      setAvatarFile(null);
      setPreviewUrl(vendor?.avatar || null);
      onAvatarChange?.(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setPreviewUrl(vendor?.avatar || null);
    onAvatarChange?.(null);
    const el = document.getElementById('avatar') as HTMLInputElement;
    if (el) el.value = '';
  };

  const handleFormSubmit = async (data: any) => {
    const valid = await trigger();
    if (valid) onSubmit(data, avatarFile);
  };

  /* ─── VIEW MODE ─── */
  if (viewMode && vendor?.storeName) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Completed card */}
        <div
          className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          style={{ backgroundColor: '#f2f3ff' }}
        >
          {/* Header strip */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white font-bold text-sm tracking-wide uppercase">Store Information Saved</span>
            </div>
            <button
              type="button"
              onClick={onEditClick}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white text-sm font-semibold rounded-lg transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="flex items-center gap-6">
              {vendor.avatar ? (
                <img
                  src={vendor.avatar}
                  alt="Store logo"
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center border-4 border-white shadow-md">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Store Name</p>
                <h3 className="text-2xl font-black text-slate-900">{vendor.storeName}</h3>
                {vendor.user?.email && (
                  <p className="text-sm text-slate-500 mt-1">{vendor.user.email}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4 font-medium">
          Click <span className="text-blue-600 font-bold">Edit</span> to modify store information, or continue to the next step
        </p>
      </div>
    );
  }

  /* ─── EDIT MODE ─── */
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="max-w-2xl mx-auto space-y-8">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Store Information</h2>
        <p className="text-slate-500 mt-1 text-sm">Tell us about your business</p>
      </div>

      {/* Logo upload */}
      <div
        className="rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer"
        style={{
          borderColor: dragOver ? '#2563eb' : '#c3c6d7',
          backgroundColor: dragOver ? '#eaedff' : '#f2f3ff',
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !previewUrl && document.getElementById('avatar')?.click()}
      >
        {previewUrl ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative inline-block">
              <img
                src={previewUrl}
                alt="Store logo"
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeAvatar(); }}
                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors text-sm font-bold"
              >
                ×
              </button>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">
                {avatarFile ? avatarFile.name : 'Current logo'}
              </p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); document.getElementById('avatar')?.click(); }}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2"
              >
                Change logo
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Drop your logo here</p>
              <p className="text-xs text-slate-400 mt-0.5">or <span className="text-blue-600 font-semibold">browse files</span></p>
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">JPG · PNG · GIF · Max 2MB</p>
          </div>
        )}
        <input type="file" id="avatar" accept="image/*" onChange={handleAvatarChange} className="hidden" />
      </div>

      {/* Store Name */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-2">
        <label htmlFor="storeName" className="block text-xs font-black uppercase tracking-widest text-slate-500">
          Store Name <span className="text-red-500 normal-case">*</span>
        </label>
        <input
          type="text"
          id="storeName"
          {...register('storeName', {
            required: 'Store name is required',
            minLength: { value: 2, message: 'Minimum 2 characters' },
            maxLength: { value: 100, message: 'Maximum 100 characters' },
          })}
          className={`w-full px-4 py-3 rounded-xl border-2 text-slate-900 font-medium text-sm placeholder-slate-300 focus:outline-none transition-all ${
            errors.storeName
              ? 'border-red-300 bg-red-50 focus:border-red-400'
              : 'border-slate-200 focus:border-blue-500 focus:bg-white'
          }`}
          placeholder="e.g. Nordic Goods Co."
          style={{ backgroundColor: errors.storeName ? undefined : '#faf8ff' }}
        />
        {errors.storeName ? (
          <p className="flex items-center gap-1.5 text-xs text-red-500 font-semibold pt-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.storeName.message as string}
          </p>
        ) : vendor?.storeName ? (
          <p className="text-xs text-blue-600 font-semibold pt-1">✓ Current: {vendor.storeName}</p>
        ) : null}
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
        >
          {isSubmitting ? (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          )}
          {isSubmitting ? 'Saving...' : 'Continue to Address'}
        </button>
      </div>
    </form>
  );
};

export default StoreInfoStep;