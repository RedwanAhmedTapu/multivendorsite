"use client"
import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  CreditCard, 
  Package, 
  CheckCircle, 
  User, 
  Phone, 
  Home,
  AlertCircle,
  Lock
} from 'lucide-react';
import { useGetCartQuery } from '@/features/cartWishApi';

interface DeliveryAddress {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  area: string;
  isDefault: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const CheckoutPage: React.FC = () => {
  const { data: cartData, isLoading } = useGetCartQuery();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [orderNote, setOrderNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');

  // Mock data - replace with actual API calls
  const deliveryAddresses: DeliveryAddress[] = [
    {
      id: '1',
      name: 'John Doe',
      phone: '+880 1234 567890',
      address: 'House 123, Road 456',
      city: 'Dhaka',
      area: 'Gulshan',
      isDefault: true
    },
    {
      id: '2',
      name: 'John Doe',
      phone: '+880 9876 543210',
      address: 'Apartment 789, Block C',
      city: 'Dhaka',
      area: 'Banani',
      isDefault: false
    }
  ];

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'cod',
      name: 'Cash on Delivery',
      icon: '💵',
      description: 'Pay when you receive your order'
    },
    {
      id: 'bkash',
      name: 'bKash',
      icon: '📱',
      description: 'Pay via bKash mobile banking'
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: '💳',
      description: 'Pay with Visa, Mastercard, or Amex'
    },
    {
      id: 'nagad',
      name: 'Nagad',
      icon: '💰',
      description: 'Pay via Nagad mobile banking'
    }
  ];

  // Calculate totals
  const calculateTotals = () => {
    if (!cartData?.data.items) return { subtotal: 0, delivery: 0, total: 0 };
    
    const itemsByVendor = cartData.data.items.reduce((acc, item) => {
      const vendorId = item.products.vendorId;
      if (!acc[vendorId]) acc[vendorId] = [];
      acc[vendorId].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    const subtotal = cartData.data.selectedSubtotal;
    const deliveryCharge = Object.keys(itemsByVendor).length * 80; // 80 per vendor
    const total = subtotal + deliveryCharge;

    return { subtotal, delivery: deliveryCharge, total };
  };

  const { subtotal, delivery, total } = calculateTotals();

  const handleNextStep = () => {
    if (currentStep === 1 && !selectedAddress) {
      alert('Please select a delivery address');
      return;
    }
    if (currentStep === 2 && !selectedPayment) {
      alert('Please select a payment method');
      return;
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      const newOrderId = 'ORD-' + Math.floor(Math.random() * 1000000);
      setOrderId(newOrderId);
      setIsProcessing(false);
      setIsOrderPlaced(true);
    }, 2000);
  };

  const steps = [
    { number: 1, title: 'Delivery Address', icon: <MapPin className="w-5 h-5" /> },
    { number: 2, title: 'Payment Method', icon: <CreditCard className="w-5 h-5" /> },
    { number: 3, title: 'Review Order', icon: <Package className="w-5 h-5" /> },
    { number: 4, title: 'Confirmation', icon: <CheckCircle className="w-5 h-5" /> }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!cartData?.data.items || cartData.data.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add items to your cart to checkout</p>
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Continue Shopping
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your purchase in just a few steps</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>
            <div 
              className="absolute top-1/2 left-0 h-0.5 bg-teal-600 -translate-y-1/2 z-0 transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            ></div>

            {/* Steps */}
            {steps.map((step) => (
              <div key={step.number} className="relative z-10 flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  currentStep >= step.number
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {step.icon}
                </div>
                <span className={`mt-3 text-sm font-medium ${
                  currentStep >= step.number ? 'text-teal-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Checkout Steps */}
          <div className="lg:col-span-2 space-y-8">
            {!isOrderPlaced ? (
              <>
                {/* Step 1: Delivery Address */}
                {currentStep === 1 && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <MapPin className="w-6 h-6" />
                        Delivery Address
                      </h2>
                      <button className="text-sm text-teal-600 font-semibold hover:text-teal-700">
                        + Add New Address
                      </button>
                    </div>

                    <div className="space-y-4">
                      {deliveryAddresses.map((address) => (
                        <div
                          key={address.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-teal-500 ${
                            selectedAddress === address.id
                              ? 'border-teal-500 bg-teal-50'
                              : 'border-gray-200'
                          }`}
                          onClick={() => setSelectedAddress(address.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <input
                                  type="radio"
                                  name="address"
                                  checked={selectedAddress === address.id}
                                  onChange={() => setSelectedAddress(address.id)}
                                  className="w-5 h-5 text-teal-600 focus:ring-teal-500"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900">
                                      {address.name}
                                    </span>
                                    {address.isDefault && (
                                      <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{address.phone}</p>
                                </div>
                              </div>
                              <div className="ml-8">
                                <p className="text-gray-700">{address.address}</p>
                                <p className="text-gray-600">
                                  {address.area}, {address.city}
                                </p>
                              </div>
                            </div>
                            <button className="text-sm text-gray-500 hover:text-teal-600 ml-4">
                              Edit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Payment Method */}
                {currentStep === 2 && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                      <CreditCard className="w-6 h-6" />
                      Payment Method
                    </h2>

                    <div className="space-y-4">
                      {paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-teal-500 ${
                            selectedPayment === method.id
                              ? 'border-teal-500 bg-teal-50'
                              : 'border-gray-200'
                          }`}
                          onClick={() => setSelectedPayment(method.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <input
                                type="radio"
                                name="payment"
                                checked={selectedPayment === method.id}
                                onChange={() => setSelectedPayment(method.id)}
                                className="w-5 h-5 text-teal-600 focus:ring-teal-500"
                              />
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{method.icon}</span>
                                <div>
                                  <div className="font-semibold text-gray-900">{method.name}</div>
                                  <p className="text-sm text-gray-600">{method.description}</p>
                                </div>
                              </div>
                            </div>
                            {method.id === 'bkash' && (
                              <img
                                src="https://www.bkash.com/img/logo/bKash.svg"
                                alt="bKash"
                                className="h-6"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Payment Details for bKash */}
                    {selectedPayment === 'bkash' && (
                      <div className="mt-6 p-4 border border-teal-200 bg-teal-50 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-3">bKash Payment Instructions</h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                          <li>Dial *247# from your mobile phone</li>
                          <li>Select "Send Money"</li>
                          <li>Enter merchant number: 01770618529</li>
                          <li>Enter amount: ৳ {total.toFixed(2)}</li>
                          <li>Enter reference: {orderId || 'ORDER123'}</li>
                          <li>Enter your bKash PIN</li>
                        </ol>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Review Order */}
                {currentStep === 3 && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                      <Package className="w-6 h-6" />
                      Review Your Order
                    </h2>

                    {/* Selected Address */}
                    <div className="mb-8 p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Delivery To
                      </h3>
                      {deliveryAddresses.find(addr => addr.id === selectedAddress) && (
                        <div className="ml-7">
                          <p className="font-medium text-gray-900">
                            {deliveryAddresses.find(addr => addr.id === selectedAddress)?.name}
                          </p>
                          <p className="text-gray-600">
                            {deliveryAddresses.find(addr => addr.id === selectedAddress)?.phone}
                          </p>
                          <p className="text-gray-600 mt-1">
                            {deliveryAddresses.find(addr => addr.id === selectedAddress)?.address}
                          </p>
                          <p className="text-gray-600">
                            {deliveryAddresses.find(addr => addr.id === selectedAddress)?.area}, 
                            {deliveryAddresses.find(addr => addr.id === selectedAddress)?.city}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Order Items */}
                    <div className="mb-8">
                      <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
                      <div className="space-y-4">
                        {cartData.data.items.filter(item => item.isSelected).map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.product_variants.variantImage}
                                alt={item.products.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                              <div>
                                <p className="font-medium text-gray-900 text-sm line-clamp-1">
                                  {item.products.name}
                                </p>
                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                <p className="text-sm text-gray-500">
                                  Vendor: {item.products.vendor?.name || 'Unknown Store'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">৳ {item.itemTotal}</p>
                              {item.product_variants.specialPrice && (
                                <p className="text-sm text-gray-400 line-through">
                                  ৳ {item.product_variants.price * item.quantity}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Note */}
                    <div className="mb-8">
                      <h3 className="font-semibold text-gray-900 mb-3">Add Order Note (Optional)</h3>
                      <textarea
                        value={orderNote}
                        onChange={(e) => setOrderNote(e.target.value)}
                        placeholder="Add special instructions for delivery..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        rows={3}
                      />
                    </div>

                    {/* Terms and Conditions */}
                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-gray-700">
                        <p className="font-medium mb-1">Important Information</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Orders are processed within 24 hours</li>
                          <li>Delivery time: 3-5 business days</li>
                          <li>Return policy: 7 days from delivery</li>
                          <li>For any issues, contact our support at support@example.com</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <button
                    onClick={handlePreviousStep}
                    disabled={currentStep === 1}
                    className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Previous
                  </button>
                  
                  <button
                    onClick={currentStep === 3 ? handlePlaceOrder : handleNextStep}
                    disabled={isProcessing}
                    className="flex items-center px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : currentStep === 3 ? (
                      <>
                        <Lock className="w-5 h-5 mr-2" />
                        Place Order
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Order Confirmation */
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h2>
                <p className="text-gray-600 mb-2">Thank you for your purchase.</p>
                <p className="text-gray-600 mb-8">Your order has been confirmed and is being processed.</p>
                
                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-500">Order Number</p>
                    <p className="text-2xl font-bold text-gray-900">{orderId}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                      <p className="text-xl font-bold text-gray-900">৳ {total.toFixed(2)}</p>
                    </div>
                    
                    <div className="text-center p-4 bg-white rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                      <p className="text-xl font-bold text-gray-900">
                        {paymentMethods.find(m => m.id === selectedPayment)?.name}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/orders"
                    className="px-6 py-3 border border-teal-600 text-teal-600 font-semibold rounded-lg hover:bg-teal-50"
                  >
                    View Order Details
                  </a>
                  <a
                    href="/"
                    className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700"
                  >
                    Continue Shopping
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {/* Product Breakdown */}
                <div>
                  <div className="flex justify-between text-gray-700 mb-2">
                    <span>Products ({cartData.data.items.filter(item => item.isSelected).length} items)</span>
                    <span className="font-semibold">৳ {subtotal.toFixed(2)}</span>
                  </div>
                  
                  {/* Vendor-wise breakdown */}
                  <div className="ml-4 space-y-2 text-sm text-gray-500">
                    {Object.entries(
                      cartData.data.items
                        .filter(item => item.isSelected)
                        .reduce((acc, item) => {
                          const vendor = item.products.vendor?.name || 'Unknown Store';
                          if (!acc[vendor]) acc[vendor] = 0;
                          acc[vendor] += item.itemTotal;
                          return acc;
                        }, {} as Record<string, number>)
                    ).map(([vendor, amount]) => (
                      <div key={vendor} className="flex justify-between">
                        <span className="truncate max-w-[120px]">{vendor}:</span>
                        <span>৳ {amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Delivery Breakdown */}
                <div>
                  <div className="flex justify-between text-gray-700 mb-2">
                    <span>Delivery Charge</span>
                    <span className="font-semibold">৳ {delivery.toFixed(2)}</span>
                  </div>
                  
                  <div className="ml-4 space-y-1 text-sm text-gray-500">
                    <div className="flex justify-between">
                      <span>Standard Delivery:</span>
                      <span>৳ 80/store</span>
                    </div>
                  </div>
                </div>
                
                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>৳ {total.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Including all taxes</p>
                </div>
              </div>
              
              {/* Security Badge */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Lock className="w-4 h-4" />
                  <span>Secure SSL Encryption</span>
                </div>
                <p className="text-xs text-center text-gray-500 mt-2">
                  Your payment information is securely encrypted
                </p>
              </div>
              
              {/* Need Help */}
              <div className="border-t pt-6 mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Need Help?</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>📞 Call us: 09678-111-222</p>
                  <p>💬 Chat with us</p>
                  <p>📧 Email: support@example.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;