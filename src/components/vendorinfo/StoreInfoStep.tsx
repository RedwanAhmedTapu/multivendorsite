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
  viewMode?: boolean; // New prop to control view/edit mode
  onEditClick?: () => void; // Callback when edit button is clicked
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
  onEditClick
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
      setPreviewUrl(vendor?.avatar || null);
      onAvatarChange?.(null);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setPreviewUrl(vendor?.avatar || null);
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
      onSubmit(data, avatarFile);
    }
  };

  // Render view mode (summary of completed data)
  if (viewMode && vendor?.storeName) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-bold text-green-900">Store Information Completed</h3>
              </div>
              
              <div className="space-y-4">
                {/* Avatar Display */}
                <div className="flex items-center gap-4">
                  {vendor.avatar ? (
                    <img 
                      src={vendor.avatar} 
                      alt="Store avatar" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-green-300"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Store Logo</p>
                    <p className="text-gray-900 font-medium">
                      {vendor.avatar ? 'Uploaded' : 'No logo uploaded'}
                    </p>
                  </div>
                </div>

                {/* Store Name Display */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Store Name</p>
                  <p className="text-lg font-semibold text-gray-900">{vendor.storeName}</p>
                </div>

                {/* Email Display (if available) */}
                {vendor.user?.email && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="text-gray-900">{vendor.user.email}</p>
                  </div>
                )}
              </div>
            </div>
            
            <button
              type="button"
              onClick={onEditClick}
              className="ml-4 px-4 py-2 bg-white border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50 font-semibold transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>
        </div>

        {/* Navigation hint */}
        <div className="text-center text-sm text-gray-500 pt-4">
          Click "Edit" to modify your store information, or continue to the next step
        </div>
      </div>
    );
  }

  // Render edit mode (form)
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Store Information</h2>
        <p className="text-gray-600">Tell us about your business</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Store Avatar Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Store Logo/Avatar
          </label>
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Store avatar preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-300 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 shadow-md transition-colors"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="cursor-pointer inline-flex items-center px-4 py-2 border-2 border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {previewUrl ? 'Change Logo' : 'Upload Logo'}
              </label>
              <p className="text-xs text-gray-500 mt-2">
                {vendor?.avatar && !avatarFile ? (
                  <span className="text-green-600 font-medium">✓ Current logo loaded</span>
                ) : (
                  'Recommended: Square image, 2MB max, JPG, PNG, or GIF'
                )}
              </p>
              {avatarFile && (
                <p className="text-xs text-blue-600 mt-1 font-medium">
                  ✓ New avatar selected: {avatarFile.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Store Name */}
        <div>
          <label htmlFor="storeName" className="block text-sm font-semibold text-gray-700 mb-2">
            Store Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="storeName"
            {...register('storeName', { 
              required: 'Store name is required',
              minLength: { value: 2, message: 'Store name must be at least 2 characters' },
              maxLength: { value: 100, message: 'Store name must be less than 100 characters' }
            })}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.storeName ? 'border-red-300' : 'border-gray-300'
            } hover:border-gray-400`}
            placeholder="Enter your store name"
          />
          {errors.storeName && (
            <p className="mt-2 text-sm text-red-600 flex items-center font-medium">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.storeName.message as string}
            </p>
          )}
          {vendor?.storeName && !errors.storeName && (
            <p className="mt-2 text-xs text-green-600 font-medium">
              ✓ Current: {vendor.storeName}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end pt-6 border-t-2 border-gray-200">
        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all font-semibold shadow-lg"
        >
          {isSubmitting && (
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
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