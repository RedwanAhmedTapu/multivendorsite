// components/vendor/steps/AddressStep.tsx
import React, { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';

interface AddressFormData {
  detailsAddress: string;
  city: string;
  zone: string;
  area: string;
}

interface AddressStepProps {
  form: UseFormReturn<AddressFormData>;
  onSubmit: (data: AddressFormData) => void;
  isSubmitting: boolean;
  onBack: () => void;
  showBackButton?: boolean;
  onClearError: (field: string) => void;
  onLocationSelected: (location: { city: string; zone: string; area: string } | null) => void;
  selectedLocation: { city: string; zone: string; area: string } | null;
  existingAddress?: any;
}

const AddressStep: React.FC<AddressStepProps> = ({ 
  form, 
  onSubmit, 
  isSubmitting, 
  onBack,
  showBackButton = true,
  onClearError,
  onLocationSelected,
  selectedLocation,
  existingAddress
}) => {
  const { register, handleSubmit, formState: { errors, isValid }, watch, setValue, getValues, trigger } = form;
  
  const watchedFields = watch();
  
  useEffect(() => {
    onClearError('submit');
  }, [watchedFields, onClearError]);

  // Set existing address data when available
  useEffect(() => {
    if (existingAddress) {
      console.log('🔄 Loading existing address data:', existingAddress);
      setValue('detailsAddress', existingAddress.detailsAddress || '');
      setValue('city', existingAddress.city || '');
      setValue('zone', existingAddress.zone || '');
      setValue('area', existingAddress.area || '');
    }
  }, [existingAddress, setValue]);

  const isFormValid = () => {
    const values = getValues();
    const hasAllValues = values.detailsAddress && values.city && values.zone && values.area;
    return hasAllValues && isValid;
  };

  const getPlaceholder = (field: keyof AddressFormData) => {
    if (existingAddress && existingAddress[field]) {
      return existingAddress[field];
    }
    return `Select ${field.charAt(0).toUpperCase() + field.slice(1)}`;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pickup Address</h2>
        <p className="text-gray-600 mb-6">Where should we collect your products?</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
            City *
          </label>
          <select
            id="city"
            {...register('city', { required: 'City is required' })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.city ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">{getPlaceholder('city')}</option>
            <option value="Dhaka">Dhaka</option>
            <option value="Chittagong">Chittagong</option>
            <option value="Sylhet">Sylhet</option>
            <option value="Khulna">Khulna</option>
          </select>
          {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
          {existingAddress?.city && (
            <p className="mt-1 text-xs text-green-600">Current city loaded from server</p>
          )}
        </div>

        <div>
          <label htmlFor="zone" className="block text-sm font-medium text-gray-700 mb-2">
            Zone *
          </label>
          <select
            id="zone"
            {...register('zone', { required: 'Zone is required' })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.zone ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">{getPlaceholder('zone')}</option>
            <option value="Central">Central</option>
            <option value="North">North</option>
            <option value="South">South</option>
          </select>
          {errors.zone && <p className="mt-1 text-sm text-red-600">{errors.zone.message}</p>}
          {existingAddress?.zone && (
            <p className="mt-1 text-xs text-green-600">Current zone loaded from server</p>
          )}
        </div>

        <div>
          <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
            Area *
          </label>
          <select
            id="area"
            {...register('area', { required: 'Area is required' })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.area ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">{getPlaceholder('area')}</option>
            <option value="Gulshan">Gulshan</option>
            <option value="Banani">Banani</option>
            <option value="Dhanmondi">Dhanmondi</option>
          </select>
          {errors.area && <p className="mt-1 text-sm text-red-600">{errors.area.message}</p>}
          {existingAddress?.area && (
            <p className="mt-1 text-xs text-green-600">Current area loaded from server</p>
          )}
        </div>

        <div>
          <label htmlFor="detailsAddress" className="block text-sm font-medium text-gray-700 mb-2">
            Detailed Address *
          </label>
          <textarea
            id="detailsAddress"
            rows={3}
            {...register('detailsAddress', { 
              required: 'Detailed address is required',
              minLength: { value: 10, message: 'Please provide a detailed address (minimum 10 characters)' }
            })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.detailsAddress ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder={existingAddress?.detailsAddress || "House/Building number, floor, street name..."}
          />
          {errors.detailsAddress && <p className="mt-1 text-sm text-red-600">{errors.detailsAddress.message}</p>}
          {existingAddress?.detailsAddress && (
            <p className="mt-1 text-xs text-green-600">Current address loaded from server</p>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        {showBackButton ? (
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Back
          </button>
        ) : (
          <div></div>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !isFormValid()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isSubmitting && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isSubmitting ? 'Saving...' : 'Continue to Account Type'}
        </button>
      </div>
    </form>
  );
};

export default AddressStep;