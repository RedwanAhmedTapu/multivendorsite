"use client"
import React, { useState, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { 
  useGetCartQuery,
  useCalculateDeliveryFeesMutation,
  CartItem 
} from '@/features/cartWishApi';
import { 
  useGetAddressesQuery,
  useGetDefaultAddressQuery 
} from '@/features/userAddressApi';
import AddressModal from '@/components/addressmodalcart/AddressModal';

// Extended type to include computed properties from API response
interface ExtendedCartItem extends Omit<CartItem, 'product_variants'> {
  itemTotal: number;
  savings?: number;
  isInStock: boolean;
  availableStock: number;
  product_variants: {
    id: string;
    sku: string;
    price: number;
    specialPrice?: number;
    stock: number;
    variantImage: string;
    attributeValues?: Record<string, string>;
  };
}

const CheckoutPage: React.FC = () => {
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [codEnabled, setCodEnabled] = useState(false);
  const [promoCode, setPromoCode] = useState('');

  // Cart queries
  const { data: cartData, isLoading: isLoadingCart, error: cartError } = useGetCartQuery();

  // Address queries
  const { data: addressesData } = useGetAddressesQuery();
  const { data: defaultAddressData } = useGetDefaultAddressQuery();

  // Delivery fee calculation
  const [calculateDeliveryFees, { 
    data: deliveryFeesData, 
    isLoading: isCalculatingFees,
    error: deliveryError 
  }] = useCalculateDeliveryFeesMutation();

  const addresses = addressesData?.data || [];
  const defaultAddress = defaultAddressData?.data;

  // Type assertion helper
  const isExtendedCartItem = (item: CartItem): item is ExtendedCartItem => {
    return 'itemTotal' in item && 'isInStock' in item && 'availableStock' in item;
  };

  // Get selected items only
  const selectedCartItems = (cartData?.data.items || [])
    .filter(isExtendedCartItem)
    .filter(item => item.isSelected);

  // Auto-select default address on mount
  useEffect(() => {
    if (defaultAddress && !selectedAddressId) {
      setSelectedAddressId(defaultAddress.id);
    }
  }, [defaultAddress, selectedAddressId]);

  // Calculate delivery fees when address or COD changes
  useEffect(() => {
    if (selectedAddressId && selectedCartItems.length) {
      handleCalculateDeliveryFees();
    }
  }, [selectedAddressId, codEnabled]);

  const handleCalculateDeliveryFees = async () => {
    if (!selectedAddressId) return;

    try {
      await calculateDeliveryFees({
        userAddressId: selectedAddressId,
        codEnabled: codEnabled,
      }).unwrap();
    } catch (error) {
      console.error('Failed to calculate delivery fees:', error);
    }
  };

  // Group items by vendor
  const itemsByVendor = selectedCartItems.reduce((acc, item) => {
    const vendorId = item.products.vendorId;
    const vendorName = item.products.vendorId || 'Unknown Vendor';
    
    if (!acc[vendorId]) {
      acc[vendorId] = {
        vendorName,
        items: []
      };
    }
    acc[vendorId].items.push(item);
    return acc;
  }, {} as Record<string, { vendorName: string; items: ExtendedCartItem[] }>);

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    setIsAddressModalOpen(false);
  };

  const handleApplyPromo = () => {
    // Implement promo code logic
    console.log('Applying promo code:', promoCode);
  };

  const handlePlaceOrder = () => {
    if (!selectedAddressId) {
      alert('Please select a delivery address');
      return;
    }
    // Implement order placement logic
    console.log('Placing order...');
  };

  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
  const subtotal = cartData?.data.selectedSubtotal || 0;
  
  // Calculate totals from delivery fees
  const deliveryCalculations = Array.isArray(deliveryFeesData?.data) 
    ? deliveryFeesData.data 
    : [];
  const totalDeliveryFee = deliveryCalculations.reduce((sum, calc) => sum + (calc.deliveryCharge || 0), 0);
  const totalCodCharge = deliveryCalculations.reduce((sum, calc) => sum + (calc.codCharge || 0), 0);
  const grandTotal = subtotal + totalDeliveryFee + totalCodCharge;

  if (isLoadingCart) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">Failed to load checkout</p>
          <p className="text-gray-600 mt-2">Please try again later</p>
        </div>
      </div>
    );
  }

  if (!selectedCartItems.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">No items selected for checkout</p>
          <button className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 cursor-pointer transition-all">
            Go to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <span className="cursor-pointer hover:text-teal-600">🏠</span>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">Checkout</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Checkout Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address Section - TOP */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Select a Delivery Address ({addresses.length}/10)
                </h2>
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(true)}
                  className="flex items-center gap-1 text-pink-600 hover:text-pink-700 font-medium text-sm cursor-pointer transition-colors"
                >
                  <span className="text-lg">+</span>
                  Add Address
                </button>
              </div>

              {selectedAddress ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">{selectedAddress.fullName}</span>
                        {selectedAddress.isDefault && (
                          <span className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm mb-1">{selectedAddress.addressLine1}</p>
                      {selectedAddress.addressLine2 && (
                        <p className="text-gray-700 text-sm mb-1">{selectedAddress.addressLine2}</p>
                      )}
                      {selectedAddress.locations && (
                        <p className="text-gray-600 text-sm">
                          {selectedAddress.locations.city}, {selectedAddress.locations.state} {selectedAddress.locations.postalCode}
                        </p>
                      )}
                      <p className="text-gray-600 text-sm mt-2">Phone: {selectedAddress.phone}</p>
                    </div>
                    <button
                      onClick={() => setIsAddressModalOpen(true)}
                      className="text-teal-600 hover:text-teal-700 text-sm font-medium cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                  <MapPin className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                  <p className="text-amber-800 text-sm font-medium mb-3">
                    Please select a delivery address
                  </p>
                  <button
                    onClick={() => setIsAddressModalOpen(true)}
                    className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 cursor-pointer transition-all"
                  >
                    Add Address
                  </button>
                </div>
              )}
            </div>

            {/* Order Summary Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="bg-amber-50 px-6 py-4 border-b border-gray-200">
                <h2 className="font-bold text-gray-900">
                  Order summary - {selectedCartItems.length} items
                </h2>
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
                <div className="col-span-6">Product Details</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-2 text-center">QTY</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {/* Items by Vendor */}
              {Object.entries(itemsByVendor).map(([vendorId, { vendorName, items }]) => {
                const vendorDelivery = deliveryCalculations.find(
                  calc => calc.vendorId === vendorId
                );
                const vendorSubtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);

                return (
                  <div key={vendorId} className="border-b border-gray-200 last:border-b-0">
                    {/* Vendor Header */}
                    <div className="px-6 py-3 bg-gray-50">
                      <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                        {vendorName}
                      </span>
                    </div>

                    {/* Items */}
                    {items.map((item) => (
                      <div key={item.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-gray-100 last:border-b-0">
                        {/* Product Details */}
                        <div className="col-span-6 flex items-start gap-4">
                          <img
                            src={item.product_variants.variantImage}
                            alt={item.products.name}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                              {item.products.name}
                            </h3>
                            <p className="text-xs text-gray-500 mb-1">
                              {item.product_variants.sku}
                            </p>
                            {item.product_variants.attributeValues && 
                              Object.entries(item.product_variants.attributeValues).map(([key, value]) => (
                                <p key={key} className="text-xs text-gray-500">
                                  {key}-{value}
                                </p>
                              ))
                            }
                            <p className="text-xs text-teal-600 font-medium mt-1">
                              Fulfilled by Seller
                            </p>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="col-span-2 text-center">
                          <div className="text-base font-bold text-pink-600">
                            ৳ {(item.product_variants.specialPrice || item.price).toLocaleString()}
                          </div>
                          {item.product_variants.specialPrice && item.product_variants.price > item.product_variants.specialPrice && (
                            <div className="text-sm text-gray-400 line-through">
                              ৳ {item.product_variants.price.toLocaleString()}
                            </div>
                          )}
                        </div>

                        {/* Quantity - Read Only */}
                        <div className="col-span-2 text-center">
                          <span className="text-sm font-semibold text-gray-900">
                            {item.quantity}
                          </span>
                        </div>

                        {/* Total */}
                        <div className="col-span-2 text-right">
                          <div className="text-base font-bold text-gray-900">
                            ৳ {item.itemTotal.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Vendor Subtotal and Delivery */}
                    <div className="px-6 py-3 bg-gray-50 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-gray-700">
                          {items.length} Item(s). Subtotal:
                        </span>
                        <span className="font-bold text-gray-900">
                          ৳ {vendorSubtotal.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Delivery Info */}
                    {selectedAddressId && vendorDelivery && (
                      <div className="px-6 py-3 bg-white border-t border-gray-200 flex items-center justify-between">
                        <span className="text-sm text-blue-600">
                          {vendorDelivery.courierProvider || 'Standard'} Delivery
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {vendorDelivery.deliveryCharge === 0 ? (
                            <span className="text-pink-600">No Product Selected</span>
                          ) : (
                            `৳ ${vendorDelivery.deliveryCharge.toLocaleString()}`
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h3 className="font-bold text-gray-900 mb-4">Order Summary:</h3>

              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Product Price:</span>
                  <span className="font-semibold text-gray-900">৳ {subtotal.toLocaleString()}</span>
                </div>

                {selectedAddressId && totalDeliveryFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Delivery Charge:</span>
                    {isCalculatingFees ? (
                      <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                    ) : (
                      <span className="font-semibold text-gray-900">৳ {totalDeliveryFee.toLocaleString()}</span>
                    )}
                  </div>
                )}

                {codEnabled && totalCodCharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">COD Charge:</span>
                    <span className="font-semibold text-gray-900">৳ {totalCodCharge.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-base font-bold mb-6 pb-6 border-b border-gray-200">
                <span className="text-gray-900">Total Payment:</span>
                <span className="text-teal-600">৳ {grandTotal.toLocaleString()}</span>
              </div>

              {/* Promo Code */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Have a FinixMart Coupon?</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Promo / Coupon Code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleApplyPromo}
                    className="px-6 py-2 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 cursor-pointer transition-all text-sm"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  defaultChecked
                />
                <span className="text-xs text-gray-600">
                  I agree to the{' '}
                  <a href="#" className="text-blue-600 hover:underline">Terms & Conditions</a>,{' '}
                  <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a> and{' '}
                  <a href="#" className="text-blue-600 hover:underline">Return & Refund Policy</a> of FinixMart
                </span>
              </label>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={!selectedAddressId || isCalculatingFees}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition-all shadow-md hover:shadow-lg mb-6 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Place Order
              </button>

              {/* Payment Methods */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">We Accept</h4>
                <div className="bg-gray-100 px-3 py-2 rounded text-xs text-gray-700 mb-3">
                  Cash on Delivery
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                    AMEX
                  </div>
                  <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                    Mastercard
                  </div>
                  <div className="bg-blue-800 text-white px-2 py-1 rounded text-xs font-semibold">
                    VISA
                  </div>
                  <div className="bg-pink-600 text-white px-2 py-1 rounded text-xs font-semibold">
                    bKash
                  </div>
                  <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-semibold">
                    Nagad
                  </div>
                  <div className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-semibold">
                    Rocket
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {isAddressModalOpen && (
        <AddressModal
          onClose={() => setIsAddressModalOpen(false)}
          onSelectAddress={handleAddressSelect}
          selectedAddressId={selectedAddressId}
        />
      )}
    </div>
  );
};

export default CheckoutPage;