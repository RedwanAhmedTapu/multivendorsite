import React, { useState } from "react";
import { X, AlertCircle, Package, TrendingUp, TrendingDown, Database } from "lucide-react";
import { ProductVariant } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface StockEditModalProps {
  productName: string;
  variant: ProductVariant;
  onClose: () => void;
  onSave: (stock: number) => void;
}

const StockEditModal: React.FC<StockEditModalProps> = ({
  productName,
  variant,
  onClose,
  onSave,
}) => {
  const [stock, setStock] = useState<string>(variant.stock.toString());
  const [errors, setErrors] = useState<string[]>([]);

  const variantName = variant.attributes
    .map((a) => a.attributeValue.value)
    .join(" / ");

  const validateStock = (): boolean => {
    const newErrors: string[] = [];
    const stockValue = parseInt(stock);

    if (!stock || isNaN(stockValue)) {
      newErrors.push("Stock quantity is required and must be a valid number");
    } else if (stockValue < 0) {
      newErrors.push("Stock quantity cannot be negative");
    } else if (!Number.isInteger(stockValue)) {
      newErrors.push("Stock quantity must be a whole number");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = () => {
    if (!validateStock()) return;
    onSave(parseInt(stock));
  };

  const stockDifference = parseInt(stock) - variant.stock;
  const currentStock = variant.stock;
  const newStock = parseInt(stock) || 0;

  const quickActions = [
    { label: "Restock to 10", value: "10" },
    { label: "Restock to 25", value: "25" },
    { label: "Restock to 50", value: "50" },
    { label: "Restock to 100", value: "100" },
    { label: "Mark as OOS", value: "0" },
    { label: "Add 10", value: (currentStock + 10).toString() },
    { label: "Add 25", value: (currentStock + 25).toString() },
    { label: "Add 50", value: (currentStock + 50).toString() },
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Update Stock Quantity
          </DialogTitle>
          <DialogDescription>
            {productName}
            {variantName && <span className="block text-xs text-gray-500">{variantName}</span>}
          </DialogDescription>
        </DialogHeader>

        {/* Current Stock Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">Current Stock</p>
                <p className="text-xs text-teal-600">SKU: {variant.sku}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-teal-700">{currentStock}</div>
                <div className="text-xs text-gray-500">units available</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock Input */}
        <div className="space-y-2">
          <Label htmlFor="stock" className="text-sm font-medium text-teal-700">
            New Stock Quantity
          </Label>
          <Input
            id="stock"
            type="number"
            step="1"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="Enter new stock quantity"
            className="border-teal-200 focus:border-teal-500 focus:ring-teal-500 text-lg font-medium"
            autoFocus
          />
        </div>

        {/* Stock Change Preview */}
        {!isNaN(newStock) && stockDifference !== 0 && (
          <Alert className={
            stockDifference > 0 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : "bg-amber-50 border-amber-200 text-amber-800"
          }>
            {stockDifference > 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-amber-600" />
            )}
            <AlertTitle className="flex items-center gap-2">
              Stock {stockDifference > 0 ? "Increase" : "Decrease"}
            </AlertTitle>
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  {stockDifference > 0 ? "+" : ""}{stockDifference} units
                </span>
                <Badge variant="outline" className={
                  stockDifference > 0 
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
                    : "bg-amber-100 text-amber-800 border-amber-200"
                }>
                  {currentStock} → {newStock}
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stock Status Warnings */}
        {newStock < 10 && newStock > 0 && (
          <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle>Low Stock Warning</AlertTitle>
            <AlertDescription>
              Product will have low inventory. Consider restocking soon.
            </AlertDescription>
          </Alert>
        )}

        {newStock === 0 && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle>Out of Stock</AlertTitle>
            <AlertDescription>
              Product will be unavailable for purchase until restocked.
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-teal-600" />
            <Label className="text-sm font-medium text-teal-700">Quick Actions</Label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                onClick={() => setStock(action.value)}
                className="border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800 text-xs"
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Validation Errors</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Stock Levels Guide */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="w-3 h-3 bg-red-500 rounded-full mx-auto"></div>
              <p className="text-xs font-medium text-gray-900">Out of Stock</p>
              <p className="text-xs text-gray-500">0 units</p>
            </div>
            <div className="space-y-1">
              <div className="w-3 h-3 bg-amber-500 rounded-full mx-auto"></div>
              <p className="text-xs font-medium text-gray-900">Low Stock</p>
              <p className="text-xs text-gray-500">1-9 units</p>
            </div>
            <div className="space-y-1">
              <div className="w-3 h-3 bg-emerald-500 rounded-full mx-auto"></div>
              <p className="text-xs font-medium text-gray-900">In Stock</p>
              <p className="text-xs text-gray-500">10+ units</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-teal-200 text-teal-700 hover:bg-teal-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-teal-600 hover:bg-teal-700"
            disabled={newStock === currentStock}
          >
            Update Stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StockEditModal;