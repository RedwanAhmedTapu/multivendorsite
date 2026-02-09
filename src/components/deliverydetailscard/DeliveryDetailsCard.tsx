// components/cart/DeliveryDetailsCard.tsx
import React from 'react';
import { Package, Truck, Clock, AlertCircle } from 'lucide-react';
import { VendorDeliveryCalculation } from '@/features/cartWishApi';

interface DeliveryDetailsCardProps {
  delivery: VendorDeliveryCalculation;
}

const DeliveryDetailsCard: React.FC<DeliveryDetailsCardProps> = ({ delivery }) => {
  const hasError = !!delivery.error;

  return (
    <div className={`p-4 border-t ${hasError ? 'bg-red-50' : 'bg-green-50'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {hasError ? (
            <>
              <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                <AlertCircle className="w-5 h-5" />
                <span>Delivery Information Unavailable</span>
              </div>
              <p className="text-sm text-red-600">{delivery.error}</p>
              <p className="text-sm text-red-600 mt-1">
                Using standard shipping rate: ৳{delivery.shippingCost}
              </p>
            </>
          ) : (
            <>
              {/* Courier Provider */}
              <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                <Truck className="w-5 h-5" />
                <span>
                  {delivery.courierProvider || 'Standard'} Delivery
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                {/* Delivery Charge */}
                <div className="flex items-start gap-2">
                  <Package className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <div className="text-gray-600">Delivery Fee</div>
                    <div className="font-semibold text-gray-900">
                      ৳ {delivery.deliveryCharge}
                    </div>
                  </div>
                </div>

                {/* COD Charge */}
                {delivery.codCharge > 0 && (
                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <div className="text-gray-600">COD Charge</div>
                      <div className="font-semibold text-gray-900">
                        ৳ {delivery.codCharge}
                      </div>
                    </div>
                  </div>
                )}

                {/* Estimated Delivery */}
                {delivery.estimatedDeliveryDays && (
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <div className="text-gray-600">Estimated Delivery</div>
                      <div className="font-semibold text-gray-900">
                        {delivery.estimatedDeliveryDays === 1
                          ? 'Within 1 day'
                          : `${delivery.estimatedDeliveryDays} days`}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Route Information */}
              {delivery.warehouseLocation && delivery.deliveryLocation && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">From:</span> {delivery.warehouseLocation}
                    {' → '}
                    <span className="font-medium">To:</span> {delivery.deliveryLocation}
                  </div>
                  {delivery.totalWeight && (
                    <div className="text-xs text-gray-600 mt-1">
                      <span className="font-medium">Package Weight:</span> {delivery.totalWeight} kg
                    </div>
                  )}
                </div>
              )}

              {/* Total Shipping Cost */}
              <div className="mt-3 pt-3 border-t border-green-200 flex justify-between items-center">
                <span className="font-semibold text-green-800">Total Shipping Cost</span>
                <span className="text-lg font-bold text-green-700">
                  ৳ {delivery.shippingCost}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Items Summary */}
      {delivery.items && delivery.items.length > 0 && (
        <div className="mt-3 pt-3 border-t border-green-200">
          <div className="text-xs text-gray-600">
            <span className="font-medium">Items:</span> {delivery.items.length} product
            {delivery.items.length > 1 ? 's' : ''} (Subtotal: ৳{delivery.subtotal})
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDetailsCard;