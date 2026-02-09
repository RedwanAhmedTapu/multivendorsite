// components/PaymentOptions.tsx (Client Component)
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, ChevronRight, CreditCard, Wallet, DollarSign, AlertCircle } from 'lucide-react';

interface PaymentGateway {
  id: number;
  iconUrl: string;
  name: string;
  description: string;
  gateWayCode: string;
  isPrePaymentGateway: boolean;
  sortId: number;
}

interface OrderSummary {
  subtotal: number;
  itemCount: number;
  total: number;
}

interface PaymentOptionsProps {
  orderId: number;
  orderSummary: OrderSummary;
}

const PaymentOptions: React.FC<PaymentOptionsProps> = ({ orderId, orderSummary }) => {
  const router = useRouter();
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(1091); // 18:11 in seconds
  const [error, setError] = useState<string | null>(null);
  const [fetchingGateways, setFetchingGateways] = useState(true);

  useEffect(() => {
    fetchPaymentGateways();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/cart'); // Redirect to cart when time expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const fetchPaymentGateways = async () => {
    try {
      setFetchingGateways(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/payment-gateways`);
      const data = await response.json();

      if (data.success) {
        const sorted = data.data.sort((a: PaymentGateway, b: PaymentGateway) =>
          a.sortId - b.sortId
        );
        setPaymentGateways(sorted);
      } else {
        setError('Failed to load payment methods. Please refresh the page.');
      }
    } catch (error) {
      console.error('Failed to fetch payment gateways:', error);
      setError('Failed to load payment methods. Please refresh the page.');
    } finally {
      setFetchingGateways(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePaymentSelect = async (gatewayCode: string) => {
    setSelectedGateway(gatewayCode);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/payment/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          gatewayCode,
          userId: 1, // TODO: Get from auth context or session
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (gatewayCode === 'COD') {
          // For COD, redirect to order confirmation
          router.push(`/orders/${orderId}/confirmation`);
        } else {
          // For online payments, redirect to payment gateway
          window.location.href = data.data.gatewayPageURL;
        }
      } else {
        setError(data.message || 'Payment initiation failed. Please try again.');
        setSelectedGateway(null);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Failed to process payment. Please check your connection and try again.');
      setSelectedGateway(null);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendedGateways = () => {
    return paymentGateways.filter((gw) => gw.isPrePaymentGateway);
  };

  const getOtherGateways = () => {
    return paymentGateways.filter((gw) => !gw.isPrePaymentGateway);
  };

  const getGatewayIcon = (gatewayCode: string) => {
    switch (gatewayCode) {
      case 'EBL_COF':
        return <CreditCard className="w-6 h-6 text-purple-600" />;
      case 'COD':
        return <DollarSign className="w-6 h-6 text-green-600" />;
      case 'BKASH':
        return <Wallet className="w-6 h-6 text-pink-600" />;
      case 'NAGAD':
        return <Wallet className="w-6 h-6 text-orange-600" />;
      case 'UPAY':
        return <Wallet className="w-6 h-6 text-red-600" />;
      default:
        return <Wallet className="w-6 h-6 text-blue-600" />;
    }
  };

  const isGatewayDisabled = (gatewayCode: string) => {
    return loading && selectedGateway !== gatewayCode;
  };

  if (fetchingGateways) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Payment Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Methods Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              {/* Recommended Method */}
              {getRecommendedGateways().length > 0 && (
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Recommended Method
                  </h2>

                  <div className="space-y-3">
                    {getRecommendedGateways().map((gateway) => (
                      <button
                        key={gateway.id}
                        onClick={() => handlePaymentSelect(gateway.gateWayCode)}
                        disabled={loading || isGatewayDisabled(gateway.gateWayCode)}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 ${
                          selectedGateway === gateway.gateWayCode
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-500 hover:bg-purple-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <div className="flex items-center space-x-4">
                          {gateway.iconUrl ? (
                            <img
                              src={gateway.iconUrl}
                              alt={gateway.name}
                              className="w-12 h-12 object-contain"
                            />
                          ) : (
                            getGatewayIcon(gateway.gateWayCode)
                          )}
                          <div className="text-left">
                            <h3 className="font-semibold text-gray-900">
                              {gateway.name}
                            </h3>
                            {gateway.description && (
                              <p className="text-sm text-gray-500 mt-0.5">
                                {gateway.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-2 mt-1">
                              {gateway.gateWayCode === 'EBL_COF' && (
                                <div className="flex space-x-1">
                                  <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                                    VISA
                                  </div>
                                  <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">
                                    MC
                                  </div>
                                  <div className="w-8 h-5 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">
                                    AE
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {selectedGateway === gateway.gateWayCode && loading ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                        ) : (
                          <ChevronRight className="w-6 h-6 text-gray-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Methods */}
              {getOtherGateways().length > 0 && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Other Methods
                  </h2>

                  <div className="space-y-3">
                    {getOtherGateways().map((gateway) => (
                      <button
                        key={gateway.id}
                        onClick={() => handlePaymentSelect(gateway.gateWayCode)}
                        disabled={loading || isGatewayDisabled(gateway.gateWayCode)}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                          selectedGateway === gateway.gateWayCode
                            ? 'border-gray-400 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <div className="flex items-center space-x-4">
                          {gateway.iconUrl ? (
                            <img
                              src={gateway.iconUrl}
                              alt={gateway.name}
                              className="w-10 h-10 object-contain"
                            />
                          ) : (
                            getGatewayIcon(gateway.gateWayCode)
                          )}
                          <div className="text-left">
                            <span className="font-medium text-gray-900">
                              {gateway.name}
                            </span>
                            {gateway.description && (
                              <p className="text-sm text-gray-500 mt-0.5">
                                {gateway.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {selectedGateway === gateway.gateWayCode && loading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No payment methods available */}
              {paymentGateways.length === 0 && (
                <div className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No payment methods available</p>
                  <button
                    onClick={fetchPaymentGateways}
                    className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              {/* Timer */}
              <div className="mb-6 pb-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 text-pink-600">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Complete payment within
                    </span>
                  </div>
                  <span className={`text-2xl font-bold ${
                    timeRemaining < 300 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        timeRemaining < 300 ? 'bg-red-500' : 'bg-pink-500'
                      }`}
                      style={{
                        width: `${(timeRemaining / 1091) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                {timeRemaining < 300 && (
                  <p className="text-xs text-red-600 mt-2">
                    Hurry! Your order will expire soon
                  </p>
                )}
              </div>

              {/* Order Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Summary
                </h3>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Subtotal ({orderSummary.itemCount} {orderSummary.itemCount === 1 ? 'Item' : 'Items'})
                    </span>
                    <span className="font-medium text-gray-900">
                      ৳ {orderSummary.subtotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-lg font-semibold text-gray-900">
                      Total
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      ৳ {orderSummary.total.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800">
                    <p className="font-medium mb-1">Secure Payment</p>
                    <p className="text-xs text-purple-700">
                      Your payment information is encrypted and secure
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentOptions;