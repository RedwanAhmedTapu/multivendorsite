"use client";
import React, { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Image as ImageIcon, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ImageUploaderProps = {
  images: string[];
  setImages: (urls: string[]) => void;
  maxImages?: number;
};

export default function ImageUploader({ images, setImages, maxImages = 10 }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { accessToken } = useSelector((state: RootState) => state.auth);

  const handleFiles = async (files: FileList | null) => {
    if (!files ) return;

    const fileArray = Array.from(files);
    if (images.length + fileArray.length > maxImages) {
      alert(`❌ You can only upload up to ${maxImages} images.`);
      return;
    }

    const validFiles = fileArray.filter(file => file.size <= 5 * 1024 * 1024);
    if (validFiles.length === 0) return;

    const formData = new FormData();
    validFiles.forEach(file => formData.append("images", file));

    setUploading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/products/upload/product`, {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.urls)) {
        setImages([...images, ...data.urls.map((u: any) => String(u))]);
      } else {
        alert("Upload failed: " + data.message);
      }
    } catch (err: any) {
      alert("Upload error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    const updated = [...images];
    updated.splice(index, 1);
    setImages(updated);
  };

  return (
    <div className="space-y-4">
      <label className="font-medium text-sm">Upload Images (max {maxImages})</label>
      <Card
        className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center transition cursor-pointer
          ${dragActive ? "border-primary bg-primary/10" : "border-muted-foreground/30 hover:border-primary/60"}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Drag & drop your images here, or <span className="text-primary font-medium">browse</span>
        </p>
        {uploading && <p className="text-xs text-primary mt-2">Uploading...</p>}
        <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
      </Card>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((url, i) => (
            <div key={i} className="relative group">
              <img src={url} alt="" className="w-24 h-24 object-cover rounded-xl border shadow-sm" />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-1 right-1 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition"
                onClick={() => removeImage(i)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
