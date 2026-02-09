// components/vendor/steps/AddressStep.tsx - UPDATED VERSION
import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { RootState } from '@/store/store';
import { 
  useGetDivisionsQuery, 
  useGetDistrictsQuery, 
  useGetThanasQuery,
  Location
} from '@/features/locationApi';
import {
  useCreateOrUpdateBulkWarehousesMutation,
  useGetWarehousesByVendorQuery,
  WarehouseType,
  BulkWarehouseRequest,
  Warehouse
} from '@/features/warehouseApi';

interface AddressFormData {
  // Warehouse/Pickup fields
  detailsAddress: string;
  city: string;
  zone: string;
  area: string;
  warehouseType: WarehouseType;
  warehouseName?: string;
  warehouseEmail?: string;
  warehousePhone?: string;
  
  // Return address fields
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

const ChevronDownIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const EditIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const AddressStep: React.FC<AddressStepProps> = ({ 
  form, 
  warehouseId,
  onSuccess,
  isSubmitting: externalIsSubmitting,
  onBack,
  showBackButton = true,
  onClearError
}) => {
  const { register, handleSubmit, formState: { errors, isValid }, watch, setValue, getValues, trigger } = form;
  
  // Get vendorId from Redux store
  const vendorId = useSelector((state: RootState) => state.auth.user?.vendorId);
  
  const watchedFields = watch();
  
  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  
  // State management for warehouse location
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [selectedThanaId, setSelectedThanaId] = useState<string>('');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  
  // State management for return location
  const [returnDivisionId, setReturnDivisionId] = useState<string>('');
  const [returnDistrictId, setReturnDistrictId] = useState<string>('');
  const [returnThanaId, setReturnThanaId] = useState<string>('');
  const [isReturnLocationDropdownOpen, setIsReturnLocationDropdownOpen] = useState(false);
  
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch locations from API
  const { data: divisionsData, isLoading: divisionsLoading } = useGetDivisionsQuery();
  const { data: districtsData, isLoading: districtsLoading } = useGetDistrictsQuery(selectedDivisionId, {
    skip: !selectedDivisionId
  });
  const { data: thanasData, isLoading: thanasLoading } = useGetThanasQuery(selectedDistrictId, {
    skip: !selectedDistrictId
  });
  
  // Return location queries
  const { data: returnDistrictsData } = useGetDistrictsQuery(returnDivisionId, {
    skip: !returnDivisionId
  });
  const { data: returnThanasData } = useGetThanasQuery(returnDistrictId, {
    skip: !returnDistrictId
  });

  // RTK Query hooks for warehouse - USE BULK MUTATION
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

  // Get warehouse and return warehouse
  const pickupWarehouse = warehousesData?.data?.find(w => w.type === WarehouseType.PICKUP);
  const dropoffWarehouse = warehousesData?.data?.find(w => w.type === WarehouseType.DROPOFF);
  
  // Check if warehouses exist
  const hasExistingData = !isLoadingWarehouses && (pickupWarehouse || dropoffWarehouse);

  useEffect(() => {
    onClearError('submit');
  }, [watchedFields, onClearError]);

  // Check if vendorId is available
  useEffect(() => {
    if (!vendorId) {
      console.error('❌ VendorId is not available in Redux store');
    } else {
      console.log('✅ VendorId found:', vendorId);
    }
  }, [vendorId]);

  // Load existing warehouse address data when editing
  useEffect(() => {
    if (isEditMode && pickupWarehouse) {
      console.log('🔄 Loading warehouse data for editing:', pickupWarehouse);
      
      // Populate pickup warehouse data - ALL FIELDS
      setValue('detailsAddress', pickupWarehouse.address || '');
      setValue('warehouseName', pickupWarehouse.name || '');
      setValue('warehouseEmail', pickupWarehouse.email || '');
      setValue('warehousePhone', pickupWarehouse.phone || '');
      
      // For location, we'll set the thana ID and display
      // The actual hierarchy will be reconstructed when user opens the dropdown
      if (pickupWarehouse.locationId) {
        setSelectedThanaId(pickupWarehouse.locationId);
        
        // If location object has the full address string, use it for display
        if (pickupWarehouse.location) {
          // Set form values for hidden fields
          setValue('city', pickupWarehouse.location.city || '');
          setValue('zone', pickupWarehouse.location.state || '');
          setValue('area', pickupWarehouse.location.name || '');
        }
      }
      
      // Populate return warehouse data if exists - ALL FIELDS  
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

  // Get formatted location display
  const getLocationDisplay = () => {
    const parts: string[] = [];
    
    // If in edit mode and we have form values, use those for display
    const values = getValues();
    
    if (values.area && values.zone && values.city) {
      return `${values.area} / ${values.zone} / ${values.city}`;
    }
    
    // Otherwise, build from selected IDs
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
    
    return parts.length > 0 ? parts.join(' / ') : 'Please Select';
  };

  // Get formatted return location display
  const getReturnLocationDisplay = () => {
    const parts: string[] = [];
    
    // If in edit mode and we have form values, use those for display
    const values = getValues();
    
    if (values.returnArea && values.returnZone && values.returnCity) {
      return `${values.returnArea} / ${values.returnZone} / ${values.returnCity}`;
    }
    
    // Otherwise, build from selected IDs
    if (returnThanaId) {
      const thana = returnThanas.find(t => t.id === returnThanaId);
      if (thana) parts.push(thana.name);
    }
    
    if (returnDistrictId) {
      const district = returnDistricts.find(d => d.id === returnDistrictId);
      if (district) parts.push(district.name);
    }
    
    if (returnDivisionId) {
      const division = divisions.find(d => d.id === returnDivisionId);
      if (division) parts.push(division.name);
    }
    
    return parts.length > 0 ? parts.join(' / ') : 'Please Select';
  };

  // Handle location selection from dropdown
  const handleLocationSelect = (divisionId: string, districtId: string, thanaId: string) => {
    setSelectedDivisionId(divisionId);
    setSelectedDistrictId(districtId);
    setSelectedThanaId(thanaId);
    
    const division = divisions.find(d => d.id === divisionId);
    const district = districts.find(d => d.id === districtId);
    const thana = thanas.find(t => t.id === thanaId);
    
    if (division) setValue('city', division.name);
    if (district) setValue('zone', district.name);
    if (thana) setValue('area', thana.name);
    
    setIsLocationDropdownOpen(false);
  };

  // Handle return location selection
  const handleReturnLocationSelect = (divisionId: string, districtId: string, thanaId: string) => {
    setReturnDivisionId(divisionId);
    setReturnDistrictId(districtId);
    setReturnThanaId(thanaId);
    
    const division = divisions.find(d => d.id === divisionId);
    const district = returnDistricts.find(d => d.id === districtId);
    const thana = returnThanas.find(t => t.id === thanaId);
    
    if (division) setValue('returnCity', division.name);
    if (district) setValue('returnZone', district.name);
    if (thana) setValue('returnArea', thana.name);
    
    setIsReturnLocationDropdownOpen(false);
  };

  const isFormValid = () => {
    const values = getValues();
    const warehouseValid = values.detailsAddress && values.city && values.zone && values.area;
    const returnValid = values.sameAsWarehouse || (values.returnAddress && values.returnCity && values.returnZone && values.returnArea);
    return warehouseValid && returnValid && isValid;
  };

  // Handle form submission with BULK warehouse creation/update
  const handleFormSubmit = async (data: AddressFormData) => {
    const isFormValid = await trigger();
    if (!isFormValid || !selectedThanaId) {
      toast.error('Please complete all required address fields');
      return;
    }

    if (!vendorId) {
      toast.error('Vendor ID is missing. Please log in again.');
      return;
    }

    try {
      // Prepare bulk warehouse data with ALL fields
      const bulkData: BulkWarehouseRequest = {
        vendorId: vendorId,
        pickupWarehouse: {
          locationId: selectedThanaId,
          address: data.detailsAddress,
          name: data.warehouseName,
          email: data.warehouseEmail,
          phone: data.warehousePhone,
        },
      };

      // Add return warehouse data with ALL fields
      if (data.sameAsWarehouse) {
        bulkData.returnWarehouse = {
          locationId: selectedThanaId,
          address: data.detailsAddress,
          name: data.warehouseName,
          email: data.warehouseEmail,
          phone: data.warehousePhone,
          sameAsPickup: true,
        };
      } else if (returnThanaId && data.returnAddress) {
        bulkData.returnWarehouse = {
          locationId: returnThanaId,
          address: data.returnAddress,
          name: data.returnName,
          email: data.returnEmail,
          phone: data.returnPhone,
          sameAsPickup: false,
        };
      }

      console.log('📦 Saving bulk warehouses:', bulkData);
      
      // Show loading toast
      const loadingToast = toast.loading(isEditMode ? 'Updating addresses...' : 'Saving addresses...');
      
      const result = await createOrUpdateBulkWarehouses(bulkData).unwrap();

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (result.success) {
        console.log('✅ Warehouses saved successfully:', result.data);
        
        // Reset edit mode
        setIsEditMode(false);
        
        // Clear form fields
        setValue('detailsAddress', '');
        setValue('warehouseName', '');
        setValue('warehouseEmail', '');
        setValue('warehousePhone', '');
        setValue('returnAddress', '');
        setValue('returnName', '');
        setValue('returnEmail', '');
        setValue('returnPhone', '');
        setSelectedDivisionId('');
        setSelectedDistrictId('');
        setSelectedThanaId('');
        setReturnDivisionId('');
        setReturnDistrictId('');
        setReturnThanaId('');
        
        // Show success toast
        toast.success(
          isEditMode 
            ? 'Addresses updated successfully!' 
            : 'Addresses saved successfully!',
          {
            description: 'Your warehouse and return addresses have been saved.',
            duration: 4000,
          }
        );
        
        // Call onSuccess callback
        if (onSuccess && result.data.pickupWarehouse) {
          onSuccess(result.data.pickupWarehouse.id, result.data.pickupWarehouse.locationId);
        }
      }
    } catch (error: any) {
      console.error('❌ Error saving warehouse addresses:', error);
      
      // Show error toast with details
      toast.error(
        'Failed to save addresses',
        {
          description: error?.data?.message || 'Please try again or contact support if the problem persists.',
          duration: 5000,
        }
      );
    }
  };

  // Handle edit mode
  const handleEditAddresses = () => {
    setIsEditMode(true);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditMode(false);
    
    // Reset all form fields
    setValue('detailsAddress', '');
    setValue('warehouseName', '');
    setValue('warehouseEmail', '');
    setValue('warehousePhone', '');
    setValue('returnAddress', '');
    setValue('returnName', '');
    setValue('returnEmail', '');
    setValue('returnPhone', '');
    setSelectedDivisionId('');
    setSelectedDistrictId('');
    setSelectedThanaId('');
    setReturnDivisionId('');
    setReturnDistrictId('');
    setReturnThanaId('');
  };

  // If data exists and not in edit mode, show table view
  if (hasExistingData && !isEditMode) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto p-6">
        {/* Warehouse Address Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Warehouse Address</h2>
          </div>
          
          {pickupWarehouse ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Address</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Phone</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {pickupWarehouse.name || pickupWarehouse.vendor?.name || 'Ecomm'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {pickupWarehouse.address && (
                        <>
                          <div className="font-medium text-gray-900">{pickupWarehouse.address}</div>
                          {pickupWarehouse.location && (
                            <div className="text-gray-500 mt-1">
                              {[
                                pickupWarehouse.location.name,
                                pickupWarehouse.location.state,
                                pickupWarehouse.location.city
                              ].filter(Boolean).join(', ') || pickupWarehouse.location.city}
                            </div>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {pickupWarehouse.phone || pickupWarehouse.vendor?.phone || '1951959919'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {pickupWarehouse.email || pickupWarehouse.vendor?.email || 'redwan25880@gmail.com'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={handleEditAddresses}
                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                      >
                        <EditIcon className="w-4 h-4" />
                        Modify
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>No warehouse address found</p>
              <button
                onClick={() => setIsEditMode(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Warehouse Address
              </button>
            </div>
          )}
        </div>

        {/* Return Address Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Return Address</h2>
          </div>
          
          {dropoffWarehouse ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Address</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Phone</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {dropoffWarehouse.name || dropoffWarehouse.vendor?.name || 'Ecomm'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {dropoffWarehouse.address && (
                        <>
                          <div className="font-medium text-gray-900">{dropoffWarehouse.address}</div>
                          {dropoffWarehouse.location && (
                            <div className="text-gray-500 mt-1">
                              {[
                                dropoffWarehouse.location.name,
                                dropoffWarehouse.location.state,
                                dropoffWarehouse.location.city
                              ].filter(Boolean).join(', ') || dropoffWarehouse.location.city}
                            </div>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {dropoffWarehouse.phone || dropoffWarehouse.vendor?.phone || '1951959919'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {dropoffWarehouse.email || dropoffWarehouse.vendor?.email || 'redwan25880@gmail.com'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={handleEditAddresses}
                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                      >
                        <EditIcon className="w-4 h-4" />
                        Modify
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>Same as Warehouse Address</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6">
          {showBackButton ? (
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all font-medium"
            >
              Back
            </button>
          ) : (
            <div></div>
          )}
          <button
            type="button"
            onClick={() => onSuccess && onSuccess(pickupWarehouse?.id || '', pickupWarehouse?.locationId || '')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Show form view for adding/editing - SAME AS BEFORE BUT WITH UPDATED SUBMIT
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 max-w-2xl mx-auto p-6">
      {!vendorId && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
          <p className="text-red-800 font-semibold">⚠️ Vendor ID not found. Please log in again.</p>
        </div>
      )}

      {isLoadingWarehouses && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600 mt-2">Loading warehouse data...</p>
        </div>
      )}

      {/* Warehouse Address Section */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">Warehouse Address</h2>
        
        {/* Name, Email, Phone Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="warehouseName" className="block text-sm font-medium text-gray-700 mb-2">
              Warehouse Name
            </label>
            <input
              id="warehouseName"
              type="text"
              {...register('warehouseName')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all bg-white"
              placeholder="Enter name"
            />
          </div>
          
          <div>
            <label htmlFor="warehouseEmail" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="warehouseEmail"
              type="email"
              {...register('warehouseEmail', {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all ${
                errors.warehouseEmail ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
              placeholder="Enter email"
            />
            {errors.warehouseEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.warehouseEmail.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="warehousePhone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              id="warehousePhone"
              type="tel"
              {...register('warehousePhone', {
                pattern: {
                  value: /^[0-9]{10,15}$/,
                  message: 'Invalid phone number (10-15 digits)'
                }
              })}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all ${
                errors.warehousePhone ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
              placeholder="Enter phone"
            />
            {errors.warehousePhone && (
              <p className="mt-1 text-sm text-red-600">{errors.warehousePhone.message}</p>
            )}
          </div>
        </div>
        
        {/* Address Details Input */}
        <div>
          <label htmlFor="detailsAddress" className="block text-sm font-medium text-gray-700 mb-2">
            <span className="text-red-500">*</span> Address Details: Number, Street, Landmark, etc.
          </label>
          <input
            id="detailsAddress"
            type="text"
            {...register('detailsAddress', { 
              required: 'Address details are required',
              minLength: { 
                value: 10, 
                message: 'Please provide a detailed address (minimum 10 characters)' 
              }
            })}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all ${
              errors.detailsAddress ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
            }`}
            placeholder="Enter detailed address"
          />
          {errors.detailsAddress && (
            <p className="mt-1 text-sm text-red-600">{errors.detailsAddress.message}</p>
          )}
        </div>

        {/* Region/City/District Dropdown - SAME AS BEFORE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="text-red-500">*</span> Region/City/District
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
              className={`w-full px-4 py-3 border rounded-lg text-left focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all flex items-center justify-between ${
                errors.area ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
            >
              <span className={selectedThanaId ? 'text-gray-900' : 'text-gray-500'}>
                {getLocationDisplay()}
              </span>
              <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${
                isLocationDropdownOpen ? 'rotate-180' : ''
              }`} />
            </button>

            {/* Dropdown Menu - SAME AS BEFORE */}
            {isLocationDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                {divisionsLoading ? (
                  <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-gray-600 mt-2">Loading locations...</p>
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
                          className="w-full px-4 py-3 text-left hover:bg-gray-100 font-medium text-gray-700 border-b border-gray-200"
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
                              className="w-full px-8 py-2 text-left hover:bg-gray-200 text-gray-700 text-sm border-b border-gray-200"
                            >
                              {district.name}
                            </button>
                            
                            {selectedDistrictId === district.id && thanas.map((thana) => (
                              <button
                                key={thana.id}
                                type="button"
                                onClick={() => handleLocationSelect(division.id, district.id, thana.id)}
                                className="w-full px-12 py-2 text-left hover:bg-blue-50 text-gray-600 text-sm"
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
          {errors.area && (
            <p className="mt-1 text-sm text-red-600">Please select a complete location</p>
          )}
        </div>
      </div>

      {/* Return Address Section - SAME AS BEFORE */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Return Address</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                {...register('sameAsWarehouse')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
            </div>
            <span className="text-sm text-gray-600">Same as Warehouse Address</span>
          </label>
        </div>

        {!watch('sameAsWarehouse') && (
          <>
            {/* Name, Email, Phone Row for Return Address */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="returnName" className="block text-sm font-medium text-gray-700 mb-2">
                  Return Warehouse Name
                </label>
                <input
                  id="returnName"
                  type="text"
                  {...register('returnName')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all bg-white"
                  placeholder="Enter name"
                />
              </div>
              
              <div>
                <label htmlFor="returnEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="returnEmail"
                  type="email"
                  {...register('returnEmail', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all ${
                    errors.returnEmail ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="Enter email"
                />
                {errors.returnEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.returnEmail.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="returnPhone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  id="returnPhone"
                  type="tel"
                  {...register('returnPhone', {
                    pattern: {
                      value: /^[0-9]{10,15}$/,
                      message: 'Invalid phone number (10-15 digits)'
                    }
                  })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all ${
                    errors.returnPhone ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="Enter phone"
                />
                {errors.returnPhone && (
                  <p className="mt-1 text-sm text-red-600">{errors.returnPhone.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="returnAddress" className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span> Address Details: Number, Street, Landmark, etc.
              </label>
              <input
                id="returnAddress"
                type="text"
                {...register('returnAddress', { 
                  required: watch('sameAsWarehouse') ? false : 'Return address is required',
                })}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all ${
                  errors.returnAddress ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                }`}
                placeholder="Enter return address"
              />
              {errors.returnAddress && (
                <p className="mt-1 text-sm text-red-600">{errors.returnAddress.message}</p>
              )}
            </div>

            {/* Return Location Dropdown - SIMILAR TO WAREHOUSE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span> Region/City/District
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsReturnLocationDropdownOpen(!isReturnLocationDropdownOpen)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all flex items-center justify-between"
                >
                  <span className={returnThanaId ? 'text-gray-900' : 'text-gray-500'}>
                    {getReturnLocationDisplay()}
                  </span>
                  <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${
                    isReturnLocationDropdownOpen ? 'rotate-180' : ''
                  }`} />
                </button>

                {isReturnLocationDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    <div>
                      {divisions.map((division) => (
                        <div key={division.id}>
                          <button
                            type="button"
                            onClick={() => {
                              if (returnDivisionId === division.id) {
                                setReturnDivisionId('');
                                setReturnDistrictId('');
                              } else {
                                setReturnDivisionId(division.id);
                                setReturnDistrictId('');
                              }
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-100 font-medium text-gray-700 border-b border-gray-200"
                          >
                            {division.name}
                          </button>
                          
                          {returnDivisionId === division.id && returnDistricts.map((district) => (
                            <div key={district.id} className="bg-gray-50">
                              <button
                                type="button"
                                onClick={() => {
                                  if (returnDistrictId === district.id) {
                                    setReturnDistrictId('');
                                  } else {
                                    setReturnDistrictId(district.id);
                                  }
                                }}
                                className="w-full px-8 py-2 text-left hover:bg-gray-200 text-gray-700 text-sm border-b border-gray-200"
                              >
                                {district.name}
                              </button>
                              
                              {returnDistrictId === district.id && returnThanas.map((thana) => (
                                <button
                                  key={thana.id}
                                  type="button"
                                  onClick={() => handleReturnLocationSelect(division.id, district.id, thana.id)}
                                  className="w-full px-12 py-2 text-left hover:bg-blue-50 text-gray-600 text-sm"
                                >
                                  {thana.name}
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hidden inputs */}
      <input type="hidden" {...register('city', { required: true })} />
      <input type="hidden" {...register('zone', { required: true })} />
      <input type="hidden" {...register('area', { required: true })} />
      <input type="hidden" {...register('warehouseType', { value: WarehouseType.PICKUP })} />

      {/* Action Buttons */}
      <div className="flex justify-between pt-6">
        <div className="flex gap-3">
          {showBackButton && !isEditMode && (
            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              Back
            </button>
          )}
          {isEditMode && (
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              Cancel
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !isFormValid() || !vendorId}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all font-medium"
        >
          {isSubmitting && (
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Both Addresses' : 'Save & Continue')}
        </button>
      </div>
    </form>
  );
};

export default AddressStep;