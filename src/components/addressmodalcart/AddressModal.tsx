// components/cart/AddressModal.tsx
import React, { useState } from 'react';
import { X, Plus, Check, MapPin } from 'lucide-react';
import {
  useGetAddressesQuery,
  useGetAddressCountQuery,
  UserAddress,
} from '@/features/userAddressApi';
import AddressForm from './AddressForm';

interface AddressModalProps {
  onClose: () => void;
  onSelectAddress: (addressId: string) => void;
  selectedAddressId?: string;
}

const AddressModal: React.FC<AddressModalProps> = ({
  onClose,
  onSelectAddress,
  selectedAddressId,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: addressesData, isLoading } = useGetAddressesQuery();
  const { data: countData } = useGetAddressCountQuery();

  const addresses = addressesData?.data || [];
  const canAddMore = countData?.data.canAddMore ?? true;

  const handleSelectAddress = (addressId: string) => {
    onSelectAddress(addressId);
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    // Address list will auto-refresh due to RTK Query cache invalidation
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-white">
          <h2 className="text-xl font-bold text-gray-900">
            {showAddForm ? 'Add Delivery Address' : 'Select Delivery Address'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {showAddForm ? (
            <AddressForm
              onSuccess={handleFormSuccess}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <>
              {/* Add New Address Button */}
              {canAddMore && (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="w-full mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-teal-600 cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Add New Address</span>
                </button>
              )}

              {/* Address Count Info */}
              <div className="mb-4 text-sm text-gray-600">
                {addresses.length} of 5 addresses saved
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && addresses.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">No addresses saved yet</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 inline-flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Address
                  </button>
                </div>
              )}

              {/* Address List */}
              {!isLoading && addresses.length > 0 && (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      onClick={() => handleSelectAddress(address.id)}
                      className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedAddressId === address.id
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-teal-300'
                      }`}
                    >
                      {/* Selected Indicator */}
                      {selectedAddressId === address.id && (
                        <div className="absolute top-4 right-4">
                          <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}

                      {/* Default Badge */}
                      {address.isDefault && (
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mb-2 font-medium">
                          Default
                        </span>
                      )}

                      {/* Address Type Badge */}
                      {address.addressType && (
                        <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full mb-2 ml-2 font-medium">
                          {address.addressType}
                        </span>
                      )}

                      {/* Address Details */}
                      <div className="pr-10">
                        <h4 className="font-semibold text-lg mb-1 text-gray-900">
                          {address.fullName}
                        </h4>
                        <p className="text-gray-700 mb-1">{address.addressLine1}</p>
                        {address.addressLine2 && (
                          <p className="text-gray-700 mb-1">{address.addressLine2}</p>
                        )}
                        {address.landmark && (
                          <p className="text-gray-600 text-sm mb-1">
                            <span className="font-medium">Landmark:</span> {address.landmark}
                          </p>
                        )}
                        {address.locations && (
                          <p className="text-gray-600 text-sm mb-1">
                            {address.locations.city}, {address.locations.state}{' '}
                            {address.locations.postalCode}
                          </p>
                        )}
                        <p className="text-gray-600 text-sm">
                          <span className="font-medium">Phone:</span> {address.phone}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - Only show when not in add form mode */}
        {!showAddForm && addresses.length > 0 && (
          <div className="px-6 py-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              disabled={!selectedAddressId}
              className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {selectedAddressId ? 'Confirm Address' : 'Select an Address'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressModal;