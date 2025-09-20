"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useCreateProductMutation } from "@/features/productApi";
import CategoryTreeSelector from "./CategoryTreeSelector";
import ImageUploader from "@/components/imageuploader/ImageUploader";
import SpecAttributeManager from "./SpecAttributeManager";
import VariantManager from "./VariantManager";
import type { Attribute, Specification, VariantNamePart } from "@/types/type";
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
import ProductDescriptionEditor from "@/components/productdescription/ProductDescriptionl";
import ShippingWarrantyForm from "./ShippingWarrantyForm";

export default function AddProductForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isLeafCategory, setIsLeafCategory] = useState(false);
  const [categoryAttributes, setCategoryAttributes] = useState<Attribute[]>([]);
  const [categorySpecifications, setCategorySpecifications] = useState<
    Specification[]
  >([]);
  const [images, setImages] = useState<string[]>([]);

  const [specInputs, setSpecInputs] = useState<ProductSpecificationInput[]>([]);
  const [variantInputs, setVariantInputs] = useState<ProductVariantInput[]>([]);
  const [attributeSettings, setAttributeSettings] = useState<
    ProductAttributeSettingInput[]
  >([]);
  const [variantNameParts, setVariantNameParts] = useState<
    Record<string, VariantNamePart>
  >({});
  const [shippingWarranty, setShippingWarranty] =
    useState<ProductShippingWarrantyInput | null>(null);

  const [createProduct, { isLoading }] = useCreateProductMutation();

  // Handle category selection
  const handleCategorySelect = (
    id: string,
    path: string,
    isLeaf: boolean,
    attributes: Attribute[],
    specifications: Specification[]
  ) => {
    setCategoryId(id);
    setIsLeafCategory(isLeaf);
    setCategoryAttributes(attributes);
    setCategorySpecifications(specifications);

    // Initialize variant name parts
    const initialParts: Record<string, VariantNamePart> = {};
    specifications.forEach((spec) => {
      initialParts[spec.id] = { name: spec.name, value: "", include: false };
    });
    attributes.forEach((attr) => {
      initialParts[attr.id] = { name: attr.name, value: "", include: true };
    });
    setVariantNameParts(initialParts);

    // Initialize attribute settings
    setAttributeSettings(
      attributes.map((attr) => ({
        attributeId: attr.id,
        isVariant: true,
      }))
    );

    // Reset inputs
    setSpecInputs([]);
    setVariantInputs([]);
  };

  // Track variant field changes
  const handleVariantFieldChange = (
    fieldId: string,
    fieldName: string,
    value: any,
    includeInVariant: boolean
  ) => {
    setVariantNameParts((prev) => ({
      ...prev,
      [fieldId]: { name: fieldName, value, include: includeInVariant },
    }));
  };

  console.log(description, "description in form");
  // Convert uploaded image URLs to ProductImageInput[]
  const convertImages = (): ProductImageInput[] =>
    images.map((url, index) => ({
      url, // string
      altText: `${name} image ${index + 1}`,
      sortOrder: index,
    }));
  const { user } = useSelector((state: RootState) => state.auth);
  const vendorId = user?.vendorId;
  // Handle submit
  const handleSubmit = async () => {
    if (!name || !categoryId || !isLeafCategory) {
      alert("⚠️ Please fill in all required fields and select a leaf category");
      return;
    }

    const productData: CreateProductData = {
      name,
      description: description || undefined,
      categoryId,
      vendorId: vendorId ? vendorId : "",
      images: convertImages(),
      specifications: specInputs,
      variants: variantInputs.map((v) => ({
        ...v,
        images: v.images?.map((img) =>
          typeof img === "string" ? img : img.url
        ), // ensure string
      })),
      attributeSettings,
      shippingWarranty: shippingWarranty || undefined,
    };

    try {
      await createProduct(productData).unwrap();
      alert("✅ Product created successfully!");
      resetForm();
    } catch (err) {
      console.error("❌ Error creating product:", err);
      alert("❌ Failed to create product. Please try again.");
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategoryId(null);
    setIsLeafCategory(false);
    setCategoryAttributes([]);
    setCategorySpecifications([]);
    setImages([]);
    setSpecInputs([]);
    setVariantInputs([]);
    setAttributeSettings([]);
    setVariantNameParts({});
  };

  return (
    <Card className="w-full  mx-auto shadow-none border-none md:p-6">
      <CardHeader>
        <CardTitle>Add New Product</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-2">Product Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter product name"
              required
            />
          </div>
        </div>

        <CategoryTreeSelector onSelect={handleCategorySelect} />

        <div>
          <label className="block font-medium mb-2">Product Images</label>
          <ImageUploader images={images} setImages={setImages} maxImages={10} />
        </div>

        {isLeafCategory && (
          <SpecAttributeManager
            categoryId={categoryId}
            specs={specInputs}
            setSpecs={setSpecInputs}
            attributes={attributeSettings}
            setAttributes={setAttributeSettings}
            categoryAttributes={categoryAttributes}
            categorySpecifications={categorySpecifications}
            onVariantFieldChange={handleVariantFieldChange}
          />
        )}

        {isLeafCategory && (
          <VariantManager
            variants={variantInputs}
            setVariants={setVariantInputs}
            variantNameParts={variantNameParts}
          />
        )}

        {!isLeafCategory && categoryId && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-yellow-800">
              ⚠️ Please select a leaf category to add specifications and
              variants.
            </p>
          </div>
        )}
        <div>
          <label className="block font-medium mb-2">Description</label>
          <ProductDescriptionEditor
            value={description}
            onChange={setDescription}
          />
        </div>
        <ShippingWarrantyForm value={shippingWarranty} onChange={setShippingWarranty} />


        <div className="flex gap-4">
          <Button
            onClick={handleSubmit}
            disabled={!name || !categoryId || !isLeafCategory || isLoading}
            className="flex-1"
          >
            {isLoading ? "Saving..." : "Save Product"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (confirm("Are you sure you want to reset the form?"))
                resetForm();
            }}
            disabled={isLoading}
          >
            Reset Form
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
