// components/cart/AddressForm.tsx
import React, { useState, useEffect } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import {
  useCreateAddressMutation,
  AddressType,
} from '@/features/userAddressApi';
import {
  useGetDivisionsQuery,
  useGetDistrictsQuery,
  useGetThanasQuery,
  Location,
} from '@/features/locationApi';

interface AddressFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    addressType: 'HOME' as 'HOME' | 'WORK' | 'OTHER',
    isDefault: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Location selection state
  const [selectedDivisionId, setSelectedDivisionId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedThanaId, setSelectedThanaId] = useState('');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);

  // RTK Query hooks
  const [createAddress, { isLoading: isSaving }] = useCreateAddressMutation();
  
  const { data: divisionsData, isLoading: divisionsLoading } = useGetDivisionsQuery();
  const { data: districtsData } = useGetDistrictsQuery(selectedDivisionId, {
    skip: !selectedDivisionId,
  });
  const { data: thanasData } = useGetThanasQuery(selectedDistrictId, {
    skip: !selectedDistrictId,
  });

  const divisions: Location[] = divisionsData?.data || [];
  const districts: Location[] = districtsData?.data || [];
  const thanas: Location[] = thanasData?.data || [];

  const getLocationDisplay = () => {
    const parts: string[] = [];
    
    if (selectedThanaId) {
      const thana = thanas.find(t => t.id === selectedThanaId);
      if (thana) parts.push(thana.name);
    }
    
    if (selectedDistrictId) {
      const district = districts.find(d => d.id === selectedDistrictId);
      if (district) parts.push(district.name);
    }
    
    if (selectedDivisionId) {
      const division = divisions.find(d => d.id === selectedDivisionId);
      if (division) parts.push(division.name);
    }
    
    return parts.length > 0 ? parts.join(' / ') : 'Select District, Zone, Area';
  };

  const handleLocationSelect = (divisionId: string, districtId: string, thanaId: string) => {
    setSelectedDivisionId(divisionId);
    setSelectedDistrictId(districtId);
    setSelectedThanaId(thanaId);
    setIsLocationDropdownOpen(false);
    
    // Clear location error if exists
    if (errors.locationId) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.locationId;
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName) newErrors.fullName = 'Name is required';
    if (formData.fullName.length < 2) newErrors.fullName = 'Name must be at least 2 characters';
    
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }
    
    if (!formData.addressLine1) newErrors.addressLine1 = 'Address is required';
    if (formData.addressLine1.length < 5) newErrors.addressLine1 = 'Address must be at least 5 characters';
    
    if (!selectedThanaId) newErrors.locationId = 'Please select complete location (District/Zone/Area)';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await createAddress({
        locationId: selectedThanaId,
        fullName: formData.fullName,
        phone: formData.phone,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        landmark: formData.landmark,
        addressType: formData.addressType,
        isDefault: formData.isDefault,
      }).unwrap();

      onSuccess();
    } catch (error: any) {
      console.error('Failed to create address:', error);
      setErrors({ submit: error?.data?.message || 'Failed to save address' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Contact Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contact Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
            errors.fullName ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter full name"
        />
        {errors.fullName && (
          <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
        )}
      </div>

      {/* Mobile Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mobile Number <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-gray-50">
            <span className="text-gray-700">+880</span>
          </div>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="1234567890"
          />
        </div>
        {errors.phone && (
          <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
        )}
      </div>

      {/* Location Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Choose My Location <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
            className={`w-full px-3 py-2 border rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-teal-500 flex items-center justify-between cursor-pointer ${
              errors.locationId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <span className={selectedThanaId ? 'text-gray-900' : 'text-gray-500'}>
              {getLocationDisplay()}
            </span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
              isLocationDropdownOpen ? 'rotate-180' : ''
            }`} />
          </button>

          {isLocationDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
              {divisionsLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-600 mx-auto" />
                </div>
              ) : (
                <div>
                  {divisions.map((division) => (
                    <div key={division.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedDivisionId === division.id) {
                            setSelectedDivisionId('');
                            setSelectedDistrictId('');
                          } else {
                            setSelectedDivisionId(division.id);
                            setSelectedDistrictId('');
                          }
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-100 font-medium text-gray-700 border-b border-gray-200 cursor-pointer"
                      >
                        {division.name}
                      </button>
                      
                      {selectedDivisionId === division.id && districts.map((district) => (
                        <div key={district.id} className="bg-gray-50">
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedDistrictId === district.id) {
                                setSelectedDistrictId('');
                              } else {
                                setSelectedDistrictId(district.id);
                              }
                            }}
                            className="w-full px-8 py-2 text-left hover:bg-gray-200 text-gray-700 text-sm border-b border-gray-200 cursor-pointer"
                          >
                            {district.name}
                          </button>
                          
                          {selectedDistrictId === district.id && thanas.map((thana) => (
                            <button
                              key={thana.id}
                              type="button"
                              onClick={() => handleLocationSelect(division.id, district.id, thana.id)}
                              className="w-full px-12 py-2 text-left hover:bg-teal-50 text-gray-600 text-sm cursor-pointer"
                            >
                              {thana.name}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {errors.locationId && (
          <p className="text-red-500 text-sm mt-1">{errors.locationId}</p>
        )}
        <p className="text-gray-500 text-xs mt-1">
          If above address is incomplete please enter house no, road name and area name
        </p>
      </div>

      {/* Street/House/Apartment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Street, House/Apartment/Unit <span className="text-red-500">*</span>
        </label>
        <textarea
          name="addressLine1"
          value={formData.addressLine1}
          onChange={handleChange}
          rows={2}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
            errors.addressLine1 ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="House no, Building name, Street name"
        />
        {errors.addressLine1 && (
          <p className="text-red-500 text-sm mt-1">{errors.addressLine1}</p>
        )}
      </div>

      {/* Landmark */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Landmark
        </label>
        <input
          type="text"
          name="landmark"
          value={formData.landmark}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="e.g. nearby landmarks or direction"
        />
      </div>

      {/* Address Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address Category
        </label>
        <div className="flex gap-3">
          {['HOME', 'WORK', 'OTHER'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, addressType: type as any }))}
              className={`flex-1 px-4 py-2 border rounded-lg font-medium transition-all cursor-pointer ${
                formData.addressType === type
                  ? 'border-pink-500 bg-pink-50 text-pink-700'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Default Delivery Address */}
      <div className="flex items-center">
        <input
          type="checkbox"
          name="isDefault"
          checked={formData.isDefault}
          onChange={handleChange}
          className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
          id="isDefault"
        />
        <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700 cursor-pointer">
          Set as default delivery address
        </label>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
};

export default AddressForm;