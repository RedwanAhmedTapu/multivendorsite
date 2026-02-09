import React, { useState, useEffect, useMemo } from "react";
import { X, AlertCircle } from "lucide-react";
import { ProductVariant } from "@/types/product";
interface PriceEditModalProps {
  productName: string;
  variant: ProductVariant;
  isSpecialPrice?: boolean;
  onClose: () => void;
  onSave: (price: number | null, autoCalculateDiscount: boolean) => void;
}

const PriceEditModal: React.FC<PriceEditModalProps> = ({
  productName,
  variant,
  isSpecialPrice = false,
  onClose,
  onSave,
}) => {
  const [price, setPrice] = useState<string>(
    isSpecialPrice
      ? variant.specialPrice?.toString() || ""
      : variant.price.toString()
  );
  const [autoCalculateDiscount, setAutoCalculateDiscount] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const variantName = variant.attributes
    .map((a) => a.attributeValue.value)
    .join(" / ");

  const currentPrice = variant.price;
  const currentSpecialPrice = variant.specialPrice;

  const calculateDiscount = (regularPrice: number, salePrice: number) => {
    return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
  };

  const validatePrice = (): boolean => {
    const newErrors: string[] = [];
    const priceValue = parseFloat(price);

    if (!price || isNaN(priceValue)) {
      newErrors.push("Price is required and must be a valid number");
    } else if (priceValue <= 0) {
      newErrors.push("Price must be greater than 0");
    } else if (isSpecialPrice && priceValue >= currentPrice) {
      newErrors.push("Special price must be less than regular price");
    } else if (!isSpecialPrice && currentSpecialPrice && priceValue <= currentSpecialPrice) {
      newErrors.push("Regular price must be greater than special price");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = () => {
    if (!validatePrice()) return;

    const priceValue = parseFloat(price);
    onSave(
      isSpecialPrice && !price ? null : priceValue,
      autoCalculateDiscount
    );
  };

  const handleRemoveSpecialPrice = () => {
    onSave(null, false);
  };

  const previewDiscount = useMemo(() => {
    if (!isSpecialPrice) return null;
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue >= currentPrice) return null;
    return calculateDiscount(currentPrice, priceValue);
  }, [price, currentPrice, isSpecialPrice]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative inline-block w-full max-w-lg px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isSpecialPrice ? "Update Special Price" : "Update Price"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">{productName}</p>
              {variantName && (
                <p className="mt-0.5 text-xs text-gray-400">{variantName}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Prices Info */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Price:</span>
                <span className="font-medium">৳{currentPrice.toLocaleString("en-BD")}</span>
              </div>
              {currentSpecialPrice && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Special Price:</span>
                    <span className="font-medium text-orange-600">
                      ৳{currentSpecialPrice.toLocaleString("en-BD")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Discount:</span>
                    <span className="font-medium text-green-600">
                      {calculateDiscount(currentPrice, currentSpecialPrice)}% OFF
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Price Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isSpecialPrice ? "Special Price" : "Regular Price"} (৳)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter price"
              autoFocus
            />
          </div>

          {/* Preview Discount */}
          {isSpecialPrice && previewDiscount !== null && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <div className="text-green-600 text-sm font-medium">
                  Discount Preview: {previewDiscount}% OFF
                </div>
              </div>
            </div>
          )}

          {/* Auto Calculate Discount */}
          {!isSpecialPrice && (
            <div className="mb-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCalculateDiscount}
                  onChange={(e) => setAutoCalculateDiscount(e.target.checked)}
                  className="mt-1 w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    Auto-calculate discount percentage
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Automatically update the discount percentage based on the new price
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">
                    Please fix the following errors:
                  </p>
                  <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                    {errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SKU Info */}
          <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <span className="font-medium">Seller SKU:</span> {variant.sku}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {isSpecialPrice && currentSpecialPrice && (
              <button
                onClick={handleRemoveSpecialPrice}
                className="flex-1 px-4 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
              >
                Remove Special Price
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceEditModal;