"use client"
import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Minus, Loader2, MapPin } from 'lucide-react';
import { 
  useGetCartQuery, 
  useUpdateCartItemMutation, 
  useRemoveFromCartMutation,
  useToggleItemSelectionMutation,
  useCalculateDeliveryFeesMutation,
  CartItem 
} from '@/features/cartWishApi';
import { 
  useGetAddressesQuery,
  useGetDefaultAddressQuery 
} from '@/features/userAddressApi';
import AddressModal from '@/components/addressmodalcart/AddressModal';
import { Container } from '@/components/Container';

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

const CartPage: React.FC = () => {
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [codEnabled, setCodEnabled] = useState(false);

  // Cart queries
  const { data: cartData, isLoading: isLoadingCart, error: cartError } = useGetCartQuery();
  const [updateCartItem, { isLoading: isUpdating }] = useUpdateCartItemMutation();
  const [removeFromCart, { isLoading: isRemoving }] = useRemoveFromCartMutation();
  const [toggleItemSelection] = useToggleItemSelectionMutation();

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

  // Type assertion helper to check if items have extended properties
  const isExtendedCartItem = (item: CartItem): item is ExtendedCartItem => {
    return 'itemTotal' in item && 'isInStock' in item && 'availableStock' in item;
  };

  // Cast items to ExtendedCartItem type with proper validation
  const cartItems = (cartData?.data.items || []).filter(isExtendedCartItem);

  // Auto-select default address on mount
  useEffect(() => {
    if (defaultAddress && !selectedAddressId) {
      setSelectedAddressId(defaultAddress.id);
    }
  }, [defaultAddress, selectedAddressId]);

  // Calculate delivery fees when address or COD changes - ONLY if address is selected
  useEffect(() => {
    if (selectedAddressId && cartItems.length) {
      handleCalculateDeliveryFees();
    }
  }, [selectedAddressId, codEnabled]);

  const handleCalculateDeliveryFees = async () => {
    if (!selectedAddressId) return; // Don't calculate if no address selected

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
  const itemsByVendor = cartItems.reduce((acc, item) => {
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

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await updateCartItem({
        itemId,
        data: { quantity: newQuantity }
      }).unwrap();
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const handleToggleSelection = async (itemId: string) => {
    try {
      await toggleItemSelection(itemId).unwrap();
    } catch (error) {
      console.error('Failed to toggle selection:', error);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeFromCart(itemId).unwrap();
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const handleToggleVendorItems = async (items: ExtendedCartItem[]) => {
    const allSelected = items.every(item => item.isSelected);
    try {
      await Promise.all(
        items.map(item => 
          updateCartItem({
            itemId: item.id,
            data: { isSelected: !allSelected }
          }).unwrap()
        )
      );
    } catch (error) {
      console.error('Failed to toggle vendor items:', error);
    }
  };

  const handleToggleAllItems = async () => {
    const allSelected = cartItems.every(item => item.isSelected);
    try {
      await Promise.all(
        cartItems.map(item => 
          updateCartItem({
            itemId: item.id,
            data: { isSelected: !allSelected }
          }).unwrap()
        )
      );
    } catch (error) {
      console.error('Failed to toggle all items:', error);
    }
  };

  const handleDeleteSelected = async () => {
    const selectedItems = cartItems.filter(item => item.isSelected);
    if (selectedItems.length === 0) return;
    
    if (!confirm(`Delete ${selectedItems.length} selected item(s)?`)) return;

    try {
      await Promise.all(
        selectedItems.map(item => removeFromCart(item.id).unwrap())
      );
    } catch (error) {
      console.error('Failed to delete selected items:', error);
    }
  };

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    setIsAddressModalOpen(false);
  };

  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
  const subtotal = cartData?.data.selectedSubtotal || 0;
  const selectedItemsCount = cartItems.filter(item => item.isSelected).length;
  
  // Calculate totals from delivery fees - properly access the data array
  const deliveryCalculations = Array.isArray(deliveryFeesData?.data) 
    ? deliveryFeesData.data 
    : [];
  const totalDeliveryFee = deliveryCalculations.reduce((sum, calc) => sum + (calc.deliveryCharge || 0), 0);
  const totalCodCharge = deliveryCalculations.reduce((sum, calc) => sum + (calc.codCharge || 0), 0);
  const grandTotal = subtotal + totalDeliveryFee + totalCodCharge;

  if (isLoadingCart) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">Failed to load cart</p>
          <p className="text-gray-600 mt-2">Please try again later</p>
        </div>
      </div>
    );
  }

  if (!cartItems.length) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Your cart is empty</p>
          <button className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 cursor-pointer transition-all">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
     <Container>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items Section */}
          <div className="lg:col-span-2">
            {/* Cart List Header */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
              <h1 className="text-2xl font-bold text-gray-900 px-6 pt-6 pb-4">Cart List</h1>
              
              {/* Select All Header */}
              <div className="px-6 py-4 bg-gray-50 border-y border-gray-200 flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cartItems.length > 0 && cartItems.every(item => item.isSelected)}
                    onChange={handleToggleAllItems}
                    className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Select all ({cartItems.length} items)
                  </span>
                </label>
                
                <button
                  onClick={handleDeleteSelected}
                  disabled={selectedItemsCount === 0}
                  className="flex items-center gap-2 text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Delete</span>
                </button>
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-teal-50 border-b border-gray-200">
                <div className="col-span-6 text-sm font-semibold text-gray-700">Product Details</div>
                <div className="col-span-2 text-sm font-semibold text-gray-700 text-center">Price</div>
                <div className="col-span-2 text-sm font-semibold text-gray-700 text-center">QTY</div>
                <div className="col-span-2 text-sm font-semibold text-gray-700 text-right">Total</div>
              </div>

              {/* Vendor Groups */}
              {Object.entries(itemsByVendor).map(([vendorId, { vendorName, items }]) => {
                const vendorDelivery = deliveryCalculations.find(
                  calc => calc.vendorId === vendorId
                );

                return (
                  <div key={vendorId} className="border-b border-gray-200 last:border-b-0">
                    {/* Vendor Header */}
                    <div className="px-6 py-3 bg-gray-50 flex items-center justify-between">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={items.every(item => item.isSelected)}
                          onChange={() => handleToggleVendorItems(items)}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{vendorName}</span>
                      </label>
                    </div>

                    {/* Cart Items */}
                    {items.map((item) => (
                      <div key={item.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                        <div className="grid grid-cols-12 gap-4 px-6 py-6 items-center">
                          {/* Product Details */}
                          <div className="col-span-6 flex items-start gap-4">
                            <input
                              type="checkbox"
                              checked={item.isSelected}
                              onChange={() => handleToggleSelection(item.id)}
                              className="w-4 h-4 mt-1 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer flex-shrink-0"
                            />
                            
                            <img
                              src={item.product_variants.variantImage}
                              alt={item.products.name}
                              className="w-20 h-20 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                            />
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
                                {item.products.name}
                              </h3>
                              <p className="text-xs text-gray-500 mb-1">
                                SKU: {item.product_variants.sku}
                              </p>
                              {item.product_variants.attributeValues && 
                                Object.entries(item.product_variants.attributeValues).map(([key, value]) => (
                                  <p key={key} className="text-xs text-gray-500">
                                    {key}: {value}
                                  </p>
                                ))
                              }
                              <p className="text-xs text-teal-600 font-medium mt-1">Fulfilled by Seller</p>
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={isRemoving}
                                className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                Remove
                              </button>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="col-span-2 text-center">
                            <div className="text-base font-bold text-teal-600">
                              ৳ {(item.product_variants.specialPrice || item.price).toLocaleString()}
                            </div>
                            {item.product_variants.specialPrice && item.product_variants.price > item.product_variants.specialPrice && (
                              <div className="text-sm text-gray-400 line-through">
                                ৳ {item.product_variants.price.toLocaleString()}
                              </div>
                            )}
                          </div>

                          {/* Quantity */}
                          <div className="col-span-2 flex justify-center">
                            <div className="inline-flex items-center border-2 border-gray-200 rounded-full overflow-hidden">
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                disabled={isUpdating || item.quantity <= 1}
                                className="p-2 hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5 text-gray-600" />
                              </button>
                              <span className="px-5 py-1.5 text-sm font-semibold text-gray-900 min-w-[50px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                disabled={isUpdating || item.quantity >= item.availableStock}
                                className="p-2 hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5 text-gray-600" />
                              </button>
                            </div>
                          </div>

                          {/* Total */}
                          <div className="col-span-2 text-right">
                            <div className="text-base font-bold text-gray-900">
                              ৳ {item.itemTotal.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Delivery Info - Only show if address is selected */}
                    {selectedAddressId && vendorDelivery && (
                      <div className="px-6 py-3 bg-teal-50 border-t border-teal-100 flex items-center justify-between">
                        <div className="text-sm font-medium text-teal-700">
                          {vendorDelivery.courierProvider || 'Standard'} Delivery
                        </div>
                        <div className="text-sm text-teal-600 font-semibold">
                          {selectedItemsCount > 0 ? (
                            `Delivery Fee: ৳${vendorDelivery.deliveryCharge}`
                          ) : (
                            <span className="text-gray-500">No Product Selected</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

           

            {/* Calculating Fees Indicator */}
            {isCalculatingFees && (
              <div className="mt-4 bg-teal-50 border border-teal-200 rounded-lg p-4 flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                <span className="text-teal-800 text-sm font-medium">
                  Calculating delivery fees...
                </span>
              </div>
            )}

            {/* Delivery Error */}
            {deliveryError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm font-medium">
                  Failed to calculate delivery fees. Please try again.
                </p>
              </div>
            )}
          </div>

          {/* Order Summary Section */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-700 text-sm">
                  <span>Product Price ({selectedItemsCount} items)</span>
                  <span className="font-semibold text-gray-900">৳ {subtotal.toLocaleString()}</span>
                </div>
                
                {/* Only show delivery charge if address is selected */}
                {selectedAddressId && (
                  <div className="flex justify-between text-gray-700 text-sm">
                    <span>Delivery Charge</span>
                    {isCalculatingFees ? (
                      <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
                    ) : (
                      <span className="font-semibold text-gray-900">৳ {totalDeliveryFee.toLocaleString()}</span>
                    )}
                  </div>
                )}

                {codEnabled && totalCodCharge > 0 && selectedAddressId && (
                  <div className="flex justify-between text-gray-700 text-sm">
                    <span>COD Charge</span>
                    <span className="font-semibold text-gray-900">৳ {totalCodCharge.toLocaleString()}</span>
                  </div>
                )}

                <div className="border-t pt-4 flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Total Payment</span>
                  <span className="text-teal-600">৳ {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <button 
                disabled={!selectedAddressId || isCalculatingFees || selectedItemsCount === 0}
                className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-all shadow-md hover:shadow-lg mb-6 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {!selectedAddressId ? 'Select Address to Continue' : 
                 selectedItemsCount === 0 ? 'Select Items to Continue' :
                 'Proceed to Checkout'}
              </button>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">We Accept</h3>
                <div className="text-xs text-gray-600 mb-3">Cash on Delivery Available</div>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm">
                    AMEX
                  </div>
                  <div className="bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm">
                    Mastercard
                  </div>
                  <div className="bg-blue-800 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm">
                    VISA
                  </div>
                  <div className="bg-pink-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm">
                    bKash
                  </div>
                  <div className="bg-orange-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm">
                    Nagad
                  </div>
                  <div className="bg-purple-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm">
                    Rocket
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

    </Container>
    </div>
  );
};

export default CartPage;