import React, { useState, useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { ProductVariant } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

    if (isSpecialPrice && price.trim() === "") {
      // Allow empty string for special price (means remove special price)
      setErrors([]);
      return true;
    }

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

    const priceValue = price.trim() === "" ? null : parseFloat(price);
    onSave(priceValue, autoCalculateDiscount);
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

  const formatCurrency = (value: number) => {
    return `৳${value.toLocaleString("en-BD")}`;
  };

  return (
    <>
      {/* Product Info */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{productName}</p>
        {variantName && (
          <p className="text-xs text-muted-foreground">{variantName}</p>
        )}
      </div>

      {/* Current Prices Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Current Price:</span>
              <span className="font-medium">{formatCurrency(currentPrice)}</span>
            </div>
            {currentSpecialPrice && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Special Price:</span>
                  <span className="font-medium text-orange-600">
                    {formatCurrency(currentSpecialPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Discount:</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {calculateDiscount(currentPrice, currentSpecialPrice)}% OFF
                  </Badge>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Price Input */}
      <div className="space-y-2">
        <Label htmlFor="price">
          {isSpecialPrice ? "Special Price" : "Regular Price"} (৳)
        </Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Enter price"
          autoFocus
        />
      </div>

      {/* Preview Discount */}
      {isSpecialPrice && previewDiscount !== null && (
        <Alert className="bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Discount Preview: <span className="font-semibold">{previewDiscount}% OFF</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Auto Calculate Discount */}
      {!isSpecialPrice && (
        <div className="flex items-start space-x-2">
          <Checkbox
            id="auto-calculate"
            checked={autoCalculateDiscount}
            onCheckedChange={(checked) => setAutoCalculateDiscount(checked as boolean)}
          />
          <Label htmlFor="auto-calculate" className="space-y-1 cursor-pointer">
            <span className="text-sm font-medium leading-none">Auto-calculate discount percentage</span>
            <p className="text-xs text-muted-foreground">
              Automatically update the discount percentage based on the new price
            </p>
          </Label>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* SKU Info */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertDescription className="text-blue-800 text-xs">
          <span className="font-medium">Seller SKU:</span> {variant.sku}
        </AlertDescription>
      </Alert>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        {isSpecialPrice && currentSpecialPrice && (
          <Button
            variant="outline"
            onClick={handleRemoveSpecialPrice}
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            Remove Special Price
          </Button>
        )}
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          className="flex-1"
        >
          Save Changes
        </Button>
      </div>
    </>
  );
};

export default PriceEditModal;