// components/offers/AdminFlashSalePage.tsx
"use client"
import React, { useState } from 'react';
import { useCreateFlashSaleMutation } from '@/features/offerApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

export const AdminFlashSalePage: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    productIds: [] as string[],
    originalPrice: 0,
    flashPrice: 0,
    quantityLimit: 0,
    duration: 2,
    urgencyText: 'Limited time only!',
  });

  const [productInput, setProductInput] = useState('');

  const [createFlashSale, { isLoading }] = useCreateFlashSaleMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createFlashSale(formData).unwrap();
      // Reset form
      setFormData({
        title: '',
        productIds: [],
        originalPrice: 0,
        flashPrice: 0,
        quantityLimit: 0,
        duration: 2,
        urgencyText: 'Limited time only!',
      });
    } catch (error: any) {
      console.error('Failed to create flash sale:', error);
    }
  };

  const addProductId = () => {
    if (productInput.trim() && !formData.productIds.includes(productInput.trim())) {
      setFormData({
        ...formData,
        productIds: [...formData.productIds, productInput.trim()]
      });
      setProductInput('');
    }
  };

  const removeProductId = (id: string) => {
    setFormData({
      ...formData,
      productIds: formData.productIds.filter(productId => productId !== id)
    });
  };

  const discountPercent = formData.originalPrice > 0 
    ? Math.round((1 - formData.flashPrice / formData.originalPrice) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create Flash Sale</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Flash Sale Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Weekend Electronics Flash Sale"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Product IDs *</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter product ID"
                  value={productInput}
                  onChange={(e) => setProductInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addProductId())}
                />
                <Button type="button" onClick={addProductId} variant="outline">
                  Add
                </Button>
              </div>
              
              {formData.productIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.productIds.map(id => (
                    <Badge key={id} variant="secondary" className="flex items-center gap-1">
                      {id}
                      <button
                        type="button"
                        onClick={() => removeProductId(id)}
                        className="hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="originalPrice">Original Price ($) *</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="flashPrice">Flash Sale Price ($) *</Label>
                <Input
                  id="flashPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.flashPrice}
                  onChange={(e) => setFormData({ ...formData, flashPrice: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            {formData.originalPrice > 0 && formData.flashPrice > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Discount:</span>
                  <Badge variant="default" className="bg-green-600">
                    {discountPercent}% OFF
                  </Badge>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>You save: ${(formData.originalPrice - formData.flashPrice).toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantityLimit">Quantity Limit *</Label>
                <Input
                  id="quantityLimit"
                  type="number"
                  min="1"
                  value={formData.quantityLimit}
                  onChange={(e) => setFormData({ ...formData, quantityLimit: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (hours) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="72"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgencyText">Urgency Text</Label>
              <Input
                id="urgencyText"
                placeholder="e.g., Selling Fast! Limited Stock!"
                value={formData.urgencyText}
                onChange={(e) => setFormData({ ...formData, urgencyText: e.target.value })}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isLoading || formData.productIds.length === 0}
            >
              {isLoading ? 'Creating Flash Sale...' : 'Create Flash Sale'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};