// components/bulkupload/BulkUploadPage.tsx
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCreateProductMutation } from "@/features/productApi";
import type { Attribute, Specification } from "@/types/type";
import {
  CreateProductData,
  ProductAttributeSettingInput,
  ProductImageInput,
  ProductShippingWarrantyInput,
  ProductSpecificationInput,
  ProductVariantInput,
} from "@/types/product";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import CategoryTreeSelector from "@/components/product/vendor/productform/CategoryTreeSelector";
import { BulkUploadProgress } from "./BulkUploadProgress";
import { ProductsTable } from "./ProductsTable";
import { BulkUploadInstructions } from "./BulkUploadInstructions";

interface BulkProductData {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  stock: number;
  variantGroupNo?: number;
  images: string[];
  videoUrl?: string;
  specInputs: ProductSpecificationInput[];
  attributeSettings: ProductAttributeSettingInput[];
  variantInputs: ProductVariantInput[];
  shippingWarranty?: ProductShippingWarrantyInput;
  errors: Record<string, string>;
  status: 'draft' | 'processing' | 'success' | 'error';
}

export default function BulkUploadPage() {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categoryPath, setCategoryPath] = useState<string>("");
  const [isLeafCategory, setIsLeafCategory] = useState(false);
  const [categoryAttributes, setCategoryAttributes] = useState<Attribute[]>([]);
  const [categorySpecifications, setCategorySpecifications] = useState<Specification[]>([]);
  const [categorySelected, setCategorySelected] = useState(false);
  
  const [products, setProducts] = useState<BulkProductData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const [createProduct, { isLoading }] = useCreateProductMutation();

  const { user } = useSelector((state: RootState) => state.auth);
  const vendorId = user?.vendorId;
  const userRole = user?.role as "VENDOR" | "ADMIN";

  // Add new product
  const addNewProduct = useCallback(() => {
    const newProduct: BulkProductData = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: "",
      description: "",
      sku: "",
      price: 0,
      stock: 0,
      variantGroupNo: undefined,
      images: [],
      videoUrl: "",
      specInputs: categorySpecifications.map(spec => ({
        specificationId: spec.id,
        value: "",
      })),
      attributeSettings: categoryAttributes.map(attr => ({
        attributeId: attr.id,
        isVariant: true,
        selectedValueId: undefined,
      })),
      variantInputs: [],
      errors: {},
      status: 'draft'
    };
    setProducts(prev => [...prev, newProduct]);
    
    const totalPages = Math.ceil((products.length + 1) / productsPerPage);
    if (totalPages > currentPage) {
      setCurrentPage(totalPages);
    }
  }, [categoryAttributes, categorySpecifications, products.length, currentPage, productsPerPage]);

  // Initialize only once when category becomes leaf
  useEffect(() => {
    if (isLeafCategory && !hasInitialized && products.length === 0) {
      addNewProduct();
      setHasInitialized(true);
    }
  }, [isLeafCategory, hasInitialized, products.length, addNewProduct]);

  // Handle category selection
  const handleCategorySelect = (
    id: string,
    path: string,
    isLeaf: boolean,
    attributes: Attribute[],
    specifications: Specification[]
  ) => {
    setCategoryId(id);
    setCategoryPath(path);
    setIsLeafCategory(isLeaf);
    setCategoryAttributes(attributes);
    setCategorySpecifications(specifications);
    setCategorySelected(true);
    setHasInitialized(false);
    setCurrentPage(1);

    if (isLeaf) {
      if (products.length === 0) {
        const initialProduct: BulkProductData = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: "",
          description: "",
          sku: "",
          price: 0,
          stock: 0,
          variantGroupNo: undefined,
          images: [],
          videoUrl: "",
          specInputs: specifications.map(spec => ({
            specificationId: spec.id,
            value: "",
          })),
          attributeSettings: attributes.map(attr => ({
            attributeId: attr.id,
            isVariant: true,
            selectedValueId: undefined,
          })),
          variantInputs: [],
          errors: {},
          status: 'draft'
        };
        setProducts([initialProduct]);
      }
    } else {
      setProducts([]);
      setCategorySelected(false);
    }
  };

  // Change category
  const handleChangeCategory = () => {
    setCategorySelected(false);
    setCategoryId(null);
    setCategoryPath("");
    setIsLeafCategory(false);
    setCategoryAttributes([]);
    setCategorySpecifications([]);
    setProducts([]);
    setCurrentPage(1);
    setHasInitialized(false);
  };

  // Remove product row
  const removeProduct = (productId: string) => {
    if (products.length > 1) {
      setProducts(prev => {
        const updatedProducts = prev.filter(p => p.id !== productId);
        const totalPages = Math.ceil(updatedProducts.length / productsPerPage);
        if (currentPage > totalPages) {
          setCurrentPage(totalPages);
        }
        return updatedProducts;
      });
    }
  };

  // Update product field
  const updateProductField = (productId: string, field: string, value: any) => {
    setProducts(prev => prev.map(product => {
      if (product.id === productId) {
        const updated = { ...product, [field]: value };
        const errors = validateProductField(updated, field, value);
        return { ...updated, errors: { ...product.errors, ...errors } };
      }
      return product;
    }));
  };

  // Update specification value
  const updateSpecValue = (productId: string, specId: string, value: string) => {
    setProducts(prev => prev.map(product => {
      if (product.id === productId) {
        const updatedSpecs = product.specInputs.map(spec =>
          spec.specificationId === specId ? { ...spec, value } : spec
        );
        return { ...product, specInputs: updatedSpecs };
      }
      return product;
    }));
  };

  // Update attribute value
  const updateAttributeValue = (productId: string, attrId: string, valueId: string) => {
    setProducts(prev => prev.map(product => {
      if (product.id === productId) {
        const updatedAttrs = product.attributeSettings.map(attr =>
          attr.attributeId === attrId ? { ...attr, selectedValueId: valueId } : attr
        );
        return { ...product, attributeSettings: updatedAttrs };
      }
      return product;
    }));
  };

  // Update product images
  const updateProductImages = (productId: string, images: string[]) => {
    setProducts(prev => prev.map(product =>
      product.id === productId ? { ...product, images } : product
    ));
  };

  // Update product video
  const updateProductVideo = (productId: string, videoUrl: string | null) => {
    setProducts(prev => prev.map(product =>
      product.id === productId ? { ...product, videoUrl: videoUrl ?? "" } : product
    ));
  };

  // Update product shipping warranty
  const updateProductShippingWarranty = (productId: string, shippingWarranty: ProductShippingWarrantyInput) => {
    setProducts(prev => prev.map(product =>
      product.id === productId ? { ...product, shippingWarranty } : product
    ));
  };

  // Validate product field
  const validateProductField = (product: BulkProductData, field: string, value: any): Record<string, string> => {
    const errors: Record<string, string> = {};

    switch (field) {
      case 'name':
        if (!value || value.trim().length === 0) {
          errors.name = 'Required';
        } else if (value.length > 200) {
          errors.name = 'Too long';
        }
        break;

      case 'sku':
        if (!value || value.trim().length === 0) {
          errors.sku = 'Required';
        } else {
          const duplicateCount = products.filter(p => 
            p.id !== product.id && p.sku === value
          ).length;
          if (duplicateCount > 0) {
            errors.sku = 'Duplicate';
          }
        }
        break;

      case 'price':
        if (value === null || value === undefined || value < 0) {
          errors.price = 'Invalid';
        }
        break;

      case 'stock':
        if (value === null || value === undefined || value < 0) {
          errors.stock = 'Invalid';
        } else if (!Number.isInteger(Number(value))) {
          errors.stock = 'Must be integer';
        }
        break;
    }

    return errors;
  };

  // Validate all products
  const validateAllProducts = (): boolean => {
    const updatedProducts = products.map(product => {
      const errors: Record<string, string> = {};

      if (!product.name.trim()) errors.name = 'Required';
      if (!product.sku.trim()) errors.sku = 'Required';
      if (product.price <= 0) errors.price = 'Must be > 0';
      if (product.stock < 0) errors.stock = 'Cannot be negative';

      const duplicateSkus = products.filter(p => 
        p.id !== product.id && p.sku === product.sku && p.sku.trim() !== ''
      );
      if (duplicateSkus.length > 0) {
        errors.sku = 'Duplicate';
      }

      return { ...product, errors };
    });

    setProducts(updatedProducts);
    return !updatedProducts.some(product => Object.keys(product.errors).length > 0);
  };

  // Process bulk upload
  const processBulkUpload = async () => {
    if (!validateAllProducts()) {
      alert('Please fix all validation errors before submitting.');
      return;
    }

    if (!categoryId || !vendorId) {
      alert('Category and vendor information is required.');
      return;
    }

    setProducts(prev => prev.map(p => ({ ...p, status: 'processing' })));

    const results = [];
    
    for (const product of products) {
      try {
        const productData: CreateProductData = {
          name: product.name,
          description: product.description || undefined,
          categoryId,
          vendorId,
          images: product.images.map((url, index) => ({
            url,
            altText: `${product.name} image ${index + 1}`,
            sortOrder: index,
          })),
          videoUrl: product.videoUrl || undefined,
          specifications: product.specInputs,
          variants: product.variantInputs,
          attributeSettings: product.attributeSettings,
          shippingWarranty: product.shippingWarranty,
        };

        const result = await createProduct(productData).unwrap();
        results.push({ success: true, productId: product.id, data: result });
        
        setProducts(prev => prev.map(p => 
          p.id === product.id ? { ...p, status: 'success' } : p
        ));
        
      } catch (error) {
        console.error(`Failed to create product ${product.name}:`, error);
        results.push({ success: false, productId: product.id, error });
        
        setProducts(prev => prev.map(p => 
          p.id === product.id ? { ...p, status: 'error' } : p
        ));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    
    alert(`Bulk upload completed!\nSuccess: ${successCount}\nFailed: ${errorCount}`);
  };

  // Quick add multiple rows
  const quickAddRows = (count: number) => {
    for (let i = 0; i < count; i++) {
      addNewProduct();
    }
  };

  // Get current page products
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / productsPerPage);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bulk Product Upload</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Category Selection */}
          {!categorySelected && (
            <Card>
              <CardHeader>
                <CardTitle>Category Selection</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryTreeSelector onSelect={handleCategorySelect} />
              </CardContent>
            </Card>
          )}

          {/* Selected Category Info */}
          {categorySelected && isLeafCategory && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Selected Category</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{categoryPath}</p>
                </div>
                <Button variant="outline" onClick={handleChangeCategory}>
                  Change Category
                </Button>
              </CardHeader>
            </Card>
          )}

          {/* Warning for non-leaf categories */}
          {categorySelected && !isLeafCategory && (
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="text-yellow-800">Invalid Category Selection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <p className="text-yellow-800">
                    ⚠️ Please select a leaf category to add products. 
                    The selected category "{categoryPath}" is not a leaf category.
                  </p>
                  <Button 
                    onClick={handleChangeCategory} 
                    variant="outline" 
                    className="mt-3"
                  >
                    Select Different Category
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products Table */}
          {categorySelected && isLeafCategory && (
            <ProductsTable
              products={currentProducts}
              categoryAttributes={categoryAttributes}
              categorySpecifications={categorySpecifications}
              totalProducts={products.length}
              onUpdateField={updateProductField}
              onUpdateSpec={updateSpecValue}
              onUpdateAttribute={updateAttributeValue}
              onUpdateImages={updateProductImages}
              onUpdateVideo={updateProductVideo}
              onUpdateShippingWarranty={updateProductShippingWarranty as any}
              onRemoveProduct={removeProduct}
              onAddProduct={addNewProduct}
              onQuickAddRows={quickAddRows}
              onUploadAll={processBulkUpload}
              isLoading={isLoading}
              vendorId={vendorId}
              userRole={userRole}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <BulkUploadInstructions />
          <BulkUploadProgress products={products} />
        </div>
      </div>
    </div>
  );
}