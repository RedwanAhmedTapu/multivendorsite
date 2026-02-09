"use client";

import React, { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Image as ImageIcon, X, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; 
import { 
  useUploadMultipleFilesMutation,
  useCheckQuotaMutation,
  useGetStorageStatsQuery 
} from "@/features/vendorManageApi";

type ImageUploaderProps = {
  images: string[];
  setImages: (urls: string[]) => void;
  maxImages?: number;
  onUploadProgress?: (progress: number) => void;
  productId?: string;
  variantId?: string;
  existingImages?: string[];
};

export default function ImageUploader({ 
  images, 
  setImages, 
  maxImages = 10,
  onUploadProgress,
  productId,
  variantId,
  existingImages = []
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useSelector((state: RootState) => state.auth);
  const vendorId = user?.vendorId;

  const [uploadFiles, { isLoading: uploading }] = useUploadMultipleFilesMutation();
  const [checkQuota] = useCheckQuotaMutation();
  const { data: storageStats, refetch: refetchStats } = useGetStorageStatsQuery(
    vendorId || "", 
    { skip: !vendorId }
  );

  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (!vendorId) throw new Error("Vendor ID not found");

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    // Check quota
    try {
      const quotaResult = await checkQuota({ 
        vendorId, 
        requiredSpace: totalSize 
      }).unwrap();

      if (!quotaResult.available) {
        toast.error(`Insufficient storage. You need ${(totalSize / 1024 / 1024).toFixed(2)}MB, ` +
                    `but only ${(parseInt(quotaResult.availableSpace) / 1024 / 1024).toFixed(2)}MB available.`);
        throw new Error("Insufficient storage");
      }
    } catch (err: any) {
      toast.error(err.data?.message || err.message || "Quota check failed");
      throw err;
    }

    const formData = new FormData();
    files.forEach(file => formData.append("files", file));
    if (productId) formData.append("productId", productId);
    if (variantId) formData.append("variantId", variantId);

    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      if (progress <= 90) {
        setUploadProgress(progress);
        onUploadProgress?.(progress);
      }
    }, 200);

    try {
      const response = await uploadFiles(formData).unwrap();
      clearInterval(progressInterval);
      setUploadProgress(100);
      onUploadProgress?.(100);

      setTimeout(() => {
        setUploadProgress(0);
        onUploadProgress?.(0);
      }, 500);

      refetchStats();

      if (response.files) return response.files.map(file => file.url);
      if (response.file) return [response.file.url];

      return [];
    } catch (err: any) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      toast.error(err.data?.message || err.message || "Upload failed");
      throw err;
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || uploading) return;

    const fileArray = Array.from(files);

    if (images.length + fileArray.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images.`);
      return;
    }

    const validFiles: File[] = [];
    for (const file of fileArray) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 5MB.`);
        continue;
      }
      if (!file.type.startsWith("image/")) {
        toast.error(`File ${file.name} is not an image.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    try {
      const uploadedUrls = await uploadImages(validFiles);
      setImages([...images, ...uploadedUrls]);
      toast.success(`Successfully uploaded ${uploadedUrls.length} image(s)`);
    } catch (err) {
      // errors handled by uploadImages
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    const updated = [...images];
    updated.splice(index, 1);
    setImages(updated);
    toast.success("Image removed");
  };

  // Show storage warning when component mounts/updates if storage is low
  React.useEffect(() => {
    if (storageStats && storageStats.usagePercent > 90) {
      toast.warning(
        `Storage is ${storageStats.usagePercent.toFixed(0)}% full. Consider purchasing more.`,
        { id: 'storage-warning' } // Prevent duplicate toasts
      );
    }
  }, [storageStats?.usagePercent]);

  const storagePercent = storageStats ? storageStats.usagePercent : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="font-medium text-sm">
          Product Images (max {maxImages})
        </label>
        {storageStats && (
          <div className="text-xs text-muted-foreground">
            Storage: {storageStats.usedGB}GB / {storageStats.totalGB}GB ({storagePercent.toFixed(1)}%)
          </div>
        )}
      </div>

      <Card
        className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center transition cursor-pointer
          ${dragActive ? "border-primary bg-primary/10" : "border-muted-foreground/30 hover:border-primary/60"}
          ${uploading ? "opacity-50 pointer-events-none" : ""}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {uploading ? (
          <div className="space-y-2 w-full max-w-xs">
            <Upload className="w-8 h-8 text-primary animate-pulse mx-auto" />
            <p className="text-sm text-primary">Uploading... {Math.round(uploadProgress)}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : (
          <>
            <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Drag & drop your images here, or <span className="text-primary font-medium">browse</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports JPG, PNG, WEBP • Max 5MB per image
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
        />
      </Card>

      {images.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{images.length} of {maxImages} images selected</p>
          <div className="flex flex-wrap gap-3">
            {images.map((url, i) => (
              <div key={i} className="relative group">
                <img src={url} alt={`Product image ${i + 1}`} className="w-24 h-24 object-cover rounded-xl border shadow-sm" />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition"
                  onClick={() => removeImage(i)}
                  type="button"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}