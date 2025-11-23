// components/vendor/steps/StoreInfoStep.tsx
import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

interface StoreInfoStepProps {
  form: UseFormReturn<any>;
  onSubmit: (data: any, avatarFile?: File | null) => void; // Updated to accept avatar file
  isSubmitting: boolean;
  vendor?: any;
  onClearError: (field: string) => void;
  onAvatarChange?: (file: File | null) => void;
  avatarPreview?: string | null;
}

const StoreInfoStep: React.FC<StoreInfoStepProps> = ({ 
  form, 
  onSubmit, 
  isSubmitting, 
  vendor, 
  onClearError,
  onAvatarChange,
  avatarPreview
}) => {
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isValid }, 
    watch,
    trigger,
    setValue
  } = form;
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarPreview || null);
  
  const watchedFields = watch(['storeName']);
  
  useEffect(() => {
    onClearError('submit');
  }, [watchedFields, onClearError]);

  // Load existing vendor data
  useEffect(() => {
    if (vendor) {
      console.log('🔄 Loading vendor data in StoreInfoStep:', {
        storeName: vendor.storeName,
        avatar: vendor.avatar
      });
      
      // Only set values if they exist and are not already set
      if (vendor.storeName) {
        setValue('storeName', vendor.storeName);
      }
      
      if (vendor.avatar) {
        setPreviewUrl(vendor.avatar);
      }
    }
  }, [vendor, setValue]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        return;
      }
      
      setAvatarFile(file);
      
      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      // Notify parent component
      onAvatarChange?.(file);
    } else {
      setAvatarFile(null);
      setPreviewUrl(vendor?.avatar || null); // Fall back to existing avatar
      onAvatarChange?.(null);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setPreviewUrl(vendor?.avatar || null); // Keep existing avatar if available
    onAvatarChange?.(null);
    
    // Clear file input
    const fileInput = document.getElementById('avatar') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Validate form before submission and pass avatar file
  const handleFormSubmit = async (data: any) => {
    const isValid = await trigger();
    if (isValid) {
      onSubmit(data, avatarFile); // Pass avatar file to parent
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Store Information</h2>
        <p className="text-gray-600 mb-6">Tell us about your business</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Store Avatar Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Store Logo/Avatar
          </label>
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Store avatar preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                id="avatar"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <label
                htmlFor="avatar"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {previewUrl ? 'Change Logo' : 'Upload Logo'}
              </label>
              <p className="text-xs text-gray-500 mt-1">
                {vendor?.avatar ? 'Current logo loaded from server' : 'Recommended: Square image, 2MB max, JPG, PNG, or GIF'}
              </p>
              {avatarFile && (
                <p className="text-xs text-green-600 mt-1">
                  New avatar selected: {avatarFile.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Store Name */}
        <div>
          <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-2">
            Store Name *
          </label>
          <input
            type="text"
            id="storeName"
            {...register('storeName', { 
              required: 'Store name is required',
              minLength: { value: 2, message: 'Store name must be at least 2 characters' },
              maxLength: { value: 100, message: 'Store name must be less than 100 characters' }
            })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.storeName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder={vendor?.storeName ? vendor.storeName : "Enter your store name"}
          />
          {errors.storeName && (
            <p className="mt-1 text-sm text-red-600">{errors.storeName.message as string}</p>
          )}
          {vendor?.storeName && (
            <p className="mt-1 text-xs text-green-600">Current store name loaded from server</p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isSubmitting && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isSubmitting ? 'Saving...' : 'Continue to Address'}
        </button>
      </div>
    </form>
  );
};

export default StoreInfoStep;