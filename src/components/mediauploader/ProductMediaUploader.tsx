"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Image as ImageIcon,
  X,
  Upload,
  Video,
  AlertCircle,
  CheckCircle,
  Scissors,
  Download,
  Play,
  RotateCcw,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  useUploadMultipleFilesMutation,
  useCheckQuotaMutation,
  useGetStorageStatsQuery,
} from "@/features/vendorManageApi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VideoValidation {
  duration: number;
  width: number;
  height: number;
  size: number;
  isValid: boolean;
  issues: string[];
}

interface ProductMediaUploaderProps {
  // Image props
  images?: string[];
  setImages?: (urls: string[]) => void;
  maxImages?: number;
  onUploadProgress?: (progress: number) => void;
  productId?: string;
  variantId?: string;
  existingImages?: string[];
  // Video props
  videoUrl?: string | null;
  setVideoUrl?: (url: string | null) => void;
  vendorId?: string;
  userRole?: "VENDOR" | "ADMIN";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VIDEO_MAX_SIZE = 100 * 1024 * 1024;
const VIDEO_MIN_DURATION = 10;
const VIDEO_MAX_DURATION = 60;
const VIDEO_REQUIRED_WIDTH = 480;
const VIDEO_REQUIRED_HEIGHT = 480;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductMediaUploader({
  images = [],
  setImages = () => {},
  maxImages = 10,
  onUploadProgress,
  productId,
  variantId,
  existingImages = [],
  videoUrl = null,
  setVideoUrl = () => {},
  vendorId = "",
  userRole = "VENDOR",
}: ProductMediaUploaderProps) {
  // ── Image state ──
  const [imgDragActive, setImgDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // ── Video state ──
  const [vidDragActive, setVidDragActive] = useState(false);
  const [vidUploading, setVidUploading] = useState(false);
  const [vidProgress, setVidProgress] = useState(0);
  const [vidError, setVidError] = useState<string | null>(null);
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [validationResult, setValidationResult] =
    useState<VideoValidation | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingVideo, setEditingVideo] = useState<File | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [editorVideoUrl, setEditorVideoUrl] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [compression, setCompression] = useState(23);
  const [resolution, setResolution] = useState("480x480");
  const vidInputRef = useRef<HTMLInputElement>(null);
  const vidPreviewRef = useRef<HTMLVideoElement>(null);
  const editorVideoRef = useRef<HTMLVideoElement>(null);
  const ffmpegRef = useRef<any>(null);

  // ── Auth ──
  const { user } = useSelector((state: RootState) => state.auth);
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const authVendorId = vendorId || user?.vendorId;

  // ── RTK Query ──
  const [uploadFiles, { isLoading: imgUploading }] =
    useUploadMultipleFilesMutation();
  const [checkQuota] = useCheckQuotaMutation();
  const { data: storageStats, refetch: refetchStats } = useGetStorageStatsQuery(
    authVendorId || "",
    { skip: !authVendorId }
  );

  // ── Effects ──
  useEffect(() => {
    loadFFmpeg();
    return () => {
      if (editorVideoUrl) URL.revokeObjectURL(editorVideoUrl);
    };
  }, []);

  useEffect(() => {
    if (storageStats && storageStats.usagePercent > 90) {
      toast.warning(
        `Storage is ${storageStats.usagePercent.toFixed(0)}% full. Consider purchasing more.`,
        { id: "storage-warning" }
      );
    }
  }, [storageStats?.usagePercent]);

  // ─────────────────────────────────────────────────────────────────────────────
  // IMAGE LOGIC
  // ─────────────────────────────────────────────────────────────────────────────

  const uploadImageFiles = async (files: File[]): Promise<string[]> => {
    if (!authVendorId) throw new Error("Vendor ID not found");
    const totalSize = files.reduce((s, f) => s + f.size, 0);

    try {
      const quotaResult = await checkQuota({
        vendorId: authVendorId,
        requiredSpace: totalSize,
      }).unwrap();
      if (!quotaResult.available) {
        toast.error(
          `Insufficient storage. Need ${(totalSize / 1024 / 1024).toFixed(2)}MB, ` +
            `only ${(parseInt(quotaResult.availableSpace) / 1024 / 1024).toFixed(2)}MB available.`
        );
        throw new Error("Insufficient storage");
      }
    } catch (err: any) {
      toast.error(err.data?.message || err.message || "Quota check failed");
      throw err;
    }

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    if (productId) formData.append("productId", productId);
    if (variantId) formData.append("variantId", variantId);

    let prog = 0;
    const interval = setInterval(() => {
      prog += 10;
      if (prog <= 90) {
        setUploadProgress(prog);
        onUploadProgress?.(prog);
      }
    }, 200);

    try {
      const response = await uploadFiles(formData).unwrap();
      clearInterval(interval);
      setUploadProgress(100);
      onUploadProgress?.(100);
      setTimeout(() => {
        setUploadProgress(0);
        onUploadProgress?.(0);
      }, 500);
      refetchStats();
      if (response.files) return response.files.map((f: any) => f.url);
      if (response.file) return [response.file.url];
      return [];
    } catch (err: any) {
      clearInterval(interval);
      setUploadProgress(0);
      toast.error(err.data?.message || err.message || "Upload failed");
      throw err;
    }
  };

  const handleImageFiles = async (files: FileList | null) => {
    if (!files || imgUploading) return;
    const arr = Array.from(files);
    if (images.length + arr.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed.`);
      return;
    }
    const valid: File[] = [];
    for (const f of arr) {
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name} exceeds 5MB.`);
        continue;
      }
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name} is not an image.`);
        continue;
      }
      valid.push(f);
    }
    if (!valid.length) return;
    try {
      const urls = await uploadImageFiles(valid);
      setImages([...images, ...urls]);
      toast.success(`Uploaded ${urls.length} image(s)`);
    } catch (_) {}
  };

  const handleImgDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setImgDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleImgDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setImgDragActive(false);
    handleImageFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    const updated = [...images];
    updated.splice(index, 1);
    setImages(updated);
    toast.success("Image removed");
  };

  const setMainImage = (index: number) => {
    if (index === 0) return;
    const updated = [...images];
    const [img] = updated.splice(index, 1);
    updated.unshift(img);
    setImages(updated);
    toast.success("Main image updated");
  };

  const storagePercent = storageStats ? storageStats.usagePercent : 0;

  // ─────────────────────────────────────────────────────────────────────────────
  // VIDEO LOGIC
  // ─────────────────────────────────────────────────────────────────────────────

  const loadFFmpeg = async () => {
    try {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile, toBlobURL } = await import("@ffmpeg/util");
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = { ffmpeg, fetchFile, toBlobURL };
      ffmpeg.on("progress", ({ progress }: { progress: number }) =>
        setProcessingProgress(Math.round(progress * 100))
      );
      const base = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(
          `${base}/ffmpeg-core.wasm`,
          "application/wasm"
        ),
      });
      setFfmpegLoaded(true);
    } catch (err) {
      console.error("FFmpeg load error:", err);
    }
  };

  const validateVideo = (file: File): Promise<VideoValidation> =>
    new Promise((resolve, reject) => {
      const issues: string[] = [];
      if (!file.type.startsWith("video/")) {
        issues.push("Please upload a video file");
        reject(new Error("Invalid file type"));
        return;
      }
      if (file.size > VIDEO_MAX_SIZE) {
        issues.push(
          `File size must be < 100MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`
        );
      }
      const vid = document.createElement("video");
      vid.preload = "metadata";
      vid.onloadedmetadata = () => {
        URL.revokeObjectURL(vid.src);
        const { duration, videoWidth: w, videoHeight: h } = vid;
        if (duration < VIDEO_MIN_DURATION)
          issues.push(`Minimum ${VIDEO_MIN_DURATION}s (current: ${duration.toFixed(1)}s)`);
        if (duration > VIDEO_MAX_DURATION)
          issues.push(`Maximum ${VIDEO_MAX_DURATION}s (current: ${duration.toFixed(1)}s)`);
        if (w !== VIDEO_REQUIRED_WIDTH || h !== VIDEO_REQUIRED_HEIGHT)
          issues.push(`Must be ${VIDEO_REQUIRED_WIDTH}×${VIDEO_REQUIRED_HEIGHT} (current: ${w}×${h})`);
        const result: VideoValidation = {
          duration,
          width: w,
          height: h,
          size: file.size,
          isValid: issues.length === 0,
          issues,
        };
        setValidationResult(result);
        resolve(result);
      };
      vid.onerror = () => {
        URL.revokeObjectURL(vid.src);
        reject(new Error("Metadata error"));
      };
      vid.src = URL.createObjectURL(file);
    });

  const openVideoEditor = async (file: File) => {
    setEditingVideo(file);
    setShowEditor(true);
    setProcessingProgress(0);
    if (editorVideoUrl) URL.revokeObjectURL(editorVideoUrl);
    const url = URL.createObjectURL(file);
    setEditorVideoUrl(url);
    await new Promise((resolve, reject) => {
      const v = document.createElement("video");
      v.onloadedmetadata = () => {
        const d = v.duration;
        setVideoDuration(d);
        setStartTime(0);
        setEndTime(Math.min(d, VIDEO_MAX_DURATION));
        URL.revokeObjectURL(v.src);
        resolve(true);
      };
      v.onerror = () => {
        URL.revokeObjectURL(v.src);
        reject(new Error("Load error"));
      };
      v.src = url;
    });
  };

  const processVideoInEditor = async (): Promise<File> => {
    if (!ffmpegLoaded || !ffmpegRef.current) throw new Error("Processor not ready");
    if (!editingVideo) throw new Error("No video to process");
    const { ffmpeg, fetchFile } = ffmpegRef.current;
    setProcessingProgress(0);
    const inputData = await fetchFile(editingVideo);
    await ffmpeg.writeFile("input.mp4", inputData);
    const [tw, th] = resolution.split("x").map(Number);
    const trimDuration = endTime - startTime;
    await ffmpeg.exec([
      "-i", "input.mp4",
      "-ss", startTime.toString(),
      "-t", trimDuration.toString(),
      "-vf", `scale=${tw}:${th}:force_original_aspect_ratio=decrease,pad=${tw}:${th}:(ow-iw)/2:(oh-ih)/2:color=black`,
      "-c:v", "libx264",
      "-crf", compression.toString(),
      "-preset", "medium",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      "-y",
      "output.mp4",
    ]);
    const data = await ffmpeg.readFile("output.mp4");
    const blob = new Blob([data], { type: "video/mp4" });
    const processed = new File([blob], `processed-${Date.now()}.mp4`, { type: "video/mp4" });
    try {
      await ffmpeg.deleteFile("input.mp4");
      await ffmpeg.deleteFile("output.mp4");
    } catch (_) {}
    return processed;
  };

  const uploadToR2 = async (file: File, skipValidation = false) => {
    try {
      if (!skipValidation) {
        const val = await validateVideo(file);
        if (!val.isValid) {
          await openVideoEditor(file);
          return;
        }
      }
      setVidUploading(true);
      setVidProgress(0);
      setVidError(null);
      if (!accessToken) throw new Error("Authentication required");

      const ts = Date.now();
      const ext = file.name.split(".").pop() || "mp4";
      const key =
        userRole === "VENDOR"
          ? `vendor/${vendorId}/videos/${ts}.${ext}`
          : `admin/videos/${ts}.${ext}`;

      const formData = new FormData();
      formData.append("video", file);
      formData.append("key", key);
      formData.append("userRole", userRole);
      formData.append("vendorId", vendorId);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable)
          setVidProgress(Math.round((e.loaded / e.total) * 100));
      });
      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const res = JSON.parse(xhr.responseText);
          if (res.success) {
            setVideoUrl(res.data.url);
            setVideoKey(res.data.key);
            setVidUploading(false);
            setVidProgress(100);
            setValidationResult(null);
            setEditingVideo(null);
            toast.success("Video uploaded successfully");
          } else throw new Error(res.message || "Upload failed");
        } else throw new Error(`Status: ${xhr.status}`);
      });
      xhr.addEventListener("error", () => {
        setVidError("Network error");
        setVidUploading(false);
      });
      xhr.open("POST", "http://localhost:5000/api/upload/video");
      xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
      xhr.send(formData);
    } catch (err: any) {
      setVidError(err.message || "Upload failed");
      setVidUploading(false);
    }
  };

  const handleEditAndUpload = async () => {
    try {
      setVidUploading(true);
      setVidError(null);
      const dur = endTime - startTime;
      if (dur < VIDEO_MIN_DURATION) throw new Error(`Minimum ${VIDEO_MIN_DURATION}s required`);
      if (dur > VIDEO_MAX_DURATION) throw new Error(`Maximum ${VIDEO_MAX_DURATION}s allowed`);
      const processed = await processVideoInEditor();
      const val = await validateVideo(processed);
      if (!val.isValid) throw new Error("Processed video still invalid: " + val.issues.join(", "));
      await uploadToR2(processed, true);
      setShowEditor(false);
    } catch (err: any) {
      setVidError(err.message || "Processing failed");
    } finally {
      setVidUploading(false);
      setProcessingProgress(0);
    }
  };

  const handleDeleteVideo = async () => {
    if (!videoKey) return;
    try {
      if (!accessToken) throw new Error("Authentication required");
      const res = await fetch("http://localhost:5000/api/upload/video", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ key: videoKey }),
      });
      const result = await res.json();
      if (result.success) {
        setVideoUrl(null);
        setVideoKey(null);
        setVidProgress(0);
        setValidationResult(null);
        setEditingVideo(null);
        if (vidInputRef.current) vidInputRef.current.value = "";
        toast.success("Video removed");
      } else throw new Error(result.message);
    } catch (err: any) {
      setVidError(err.message || "Delete failed");
    }
  };

  const handleVidDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setVidDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleVidDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setVidDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) { setVidError(null); uploadToR2(file); }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const trimDur = endTime - startTime;
  const trimValid = trimDur >= VIDEO_MIN_DURATION && trimDur <= VIDEO_MAX_DURATION;

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        fontSize: 14,
        color: "var(--text, #0D1B2E)",
      }}
    >
      {/* ── Hidden inputs ── */}
      <input
        ref={imgInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleImageFiles(e.target.files)}
        disabled={imgUploading}
      />
      <input
        ref={vidInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) { setVidError(null); uploadToR2(f); }
        }}
      />

      {/* ══ MEDIA FLEX LAYOUT — mirrors the HTML design ══ */}
      <div style={{ display: "flex", gap: 16 }}>

        {/* ── Images column (flex: 3) ── */}
        <div style={{ flex: 3, minWidth: 0 }}>
          {/* Header row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#3D5068",
                letterSpacing: "0.01em",
                textTransform: "uppercase",
              }}
            >
              Product Images{" "}
              <span style={{ color: "#D32F2F" }}>*</span>{" "}
              <span style={{ fontWeight: 400, color: "#7A90AB" }}>
                (max {maxImages})
              </span>
            </label>
            <span style={{ fontSize: 10.5, color: "#7A90AB" }}>
              {images.length} / {maxImages} images
              {storageStats && (
                <span>
                  {" "}
                  · {storageStats.usedGB}GB / {storageStats.totalGB}GB (
                  {storagePercent.toFixed(0)}%)
                </span>
              )}
            </span>
          </div>

          {/* Drop zone */}
          <div
            onDragEnter={handleImgDrag}
            onDragOver={handleImgDrag}
            onDragLeave={handleImgDrag}
            onDrop={handleImgDrop}
            onClick={() => !imgUploading && imgInputRef.current?.click()}
            style={{
              border: `1.5px dashed ${imgDragActive ? "#1565C0" : "#BDD0EE"}`,
              borderRadius: 12,
              padding: "16px 12px",
              textAlign: "center",
              cursor: imgUploading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              background: imgDragActive ? "#E3EEF9" : "#F5F8FF",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              minHeight: 110,
              opacity: imgUploading ? 0.6 : 1,
            }}
          >
            {imgUploading ? (
              <div style={{ width: "100%", maxWidth: 200 }}>
                <Upload
                  size={24}
                  color="#1565C0"
                  style={{ margin: "0 auto 6px", display: "block" }}
                />
                <p
                  style={{
                    fontSize: 12,
                    color: "#1565C0",
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  Uploading… {Math.round(uploadProgress)}%
                </p>
                <div
                  style={{
                    width: "100%",
                    background: "#D6E2F5",
                    borderRadius: 4,
                    height: 6,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${uploadProgress}%`,
                      background: "linear-gradient(90deg,#1565C0,#00ACC1)",
                      borderRadius: 4,
                      transition: "width 0.3s",
                    }}
                  />
                </div>
              </div>
            ) : (
              <>
                <ImageIcon size={22} color="#7A90AB" />
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "#3D5068",
                  }}
                >
                  Drag & drop or{" "}
                  <span style={{ color: "#1565C0" }}>browse</span>
                </div>
                <div style={{ fontSize: 11, color: "#7A90AB" }}>
                  JPG, PNG, WEBP · Max 5MB each
                </div>
              </>
            )}
          </div>

          {/* Thumbnail grid */}
          {images.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 8,
              }}
            >
              {images.map((url, i) => (
                <div
                  key={i}
                  style={{
                    position: "relative",
                    width: 54,
                    height: 54,
                    borderRadius: 7,
                    overflow: "hidden",
                    border: `1.5px solid ${i === 0 ? "#1565C0" : "#D6E2F5"}`,
                    background: "#F5F8FF",
                    flexShrink: 0,
                  }}
                  title={i === 0 ? "Main image" : "Click star to set as main"}
                >
                  <img
                    src={url}
                    alt={`Product ${i + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  {/* Main badge */}
                  {i === 0 && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: 2,
                        left: 2,
                        background: "#1565C0",
                        color: "#fff",
                        fontSize: 7,
                        fontWeight: 700,
                        padding: "1px 4px",
                        borderRadius: 3,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Main
                    </span>
                  )}
                  {/* Hover overlay */}
                  <div
                    className="group-hover-overlay"
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.45)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 3,
                      opacity: 0,
                      transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.opacity = "1")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.opacity = "0")
                    }
                  >
                    {i !== 0 && (
                      <button
                        onClick={() => setMainImage(i)}
                        title="Set as main"
                        style={{
                          background: "#1565C0",
                          border: "none",
                          borderRadius: 4,
                          padding: "2px 4px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Star size={10} color="#fff" />
                      </button>
                    )}
                    <button
                      onClick={() => removeImage(i)}
                      title="Remove"
                      style={{
                        background: "#D32F2F",
                        border: "none",
                        borderRadius: 4,
                        padding: "2px 4px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <X size={10} color="#fff" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              fontSize: 10.5,
              color: "#7A90AB",
              marginTop: 5,
            }}
          >
            {images.length === 0
              ? "No images yet. First image = main listing image."
              : `${images.length} image${images.length > 1 ? "s" : ""} · First image is the main listing image`}
          </div>
        </div>

        {/* ── Video column (flex: 2) ── */}
        <div style={{ flex: 2, minWidth: 0 }}>
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 700,
              color: "#3D5068",
              letterSpacing: "0.01em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Product Video{" "}
            <span style={{ fontWeight: 400, color: "#7A90AB" }}>
              (Optional)
            </span>
          </label>

          {!videoUrl ? (
            <>
              {/* Video drop zone */}
              <div
                onDragEnter={handleVidDrag}
                onDragOver={handleVidDrag}
                onDragLeave={handleVidDrag}
                onDrop={handleVidDrop}
                onClick={() =>
                  !vidUploading && !(!ffmpegLoaded) && vidInputRef.current?.click()
                }
                style={{
                  border: `1.5px dashed ${vidDragActive ? "#00ACC1" : "#BDD0EE"}`,
                  borderRadius: 12,
                  padding: "16px 12px",
                  textAlign: "center",
                  cursor:
                    vidUploading || !ffmpegLoaded ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  background: vidDragActive ? "#E0F7FA" : "#F5F8FF",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  minHeight: 110,
                  opacity: vidUploading ? 0.7 : 1,
                }}
              >
                {vidUploading ? (
                  <div style={{ width: "100%", maxWidth: 180 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        border: "3px solid #00ACC1",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                        margin: "0 auto 6px",
                      }}
                    />
                    <p
                      style={{
                        fontSize: 12,
                        color: "#00ACC1",
                        fontWeight: 600,
                        marginBottom: 6,
                      }}
                    >
                      {processingProgress > 0 && processingProgress < 100
                        ? `Processing… ${processingProgress}%`
                        : `Uploading… ${vidProgress}%`}
                    </p>
                    <div
                      style={{
                        width: "100%",
                        background: "#B2EBF2",
                        borderRadius: 4,
                        height: 6,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${vidProgress || processingProgress}%`,
                          background: "linear-gradient(90deg,#00ACC1,#00838F)",
                          borderRadius: 4,
                          transition: "width 0.3s",
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <Video size={22} color={!ffmpegLoaded ? "#BDD0EE" : "#7A90AB"} />
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "#3D5068",
                      }}
                    >
                      {!ffmpegLoaded
                        ? "Loading editor…"
                        : "Click to upload video"}
                    </div>
                    <div style={{ fontSize: 11, color: "#7A90AB" }}>
                      480×480 · 10–60 sec · Max 100MB
                    </div>
                  </>
                )}
              </div>

              {/* Error */}
              {vidError && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 7,
                    padding: "8px 10px",
                    background: "#FFEBEE",
                    border: "1px solid #FFCDD2",
                    borderRadius: 7,
                    marginTop: 7,
                  }}
                >
                  <AlertCircle size={13} color="#D32F2F" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 11, color: "#B71C1C" }}>
                    {vidError}
                  </span>
                </div>
              )}

              {/* Requirements box */}
              <div
                style={{
                  background: "#F5F8FF",
                  border: "1px solid #D6E2F5",
                  borderRadius: 8,
                  padding: "8px 10px",
                  marginTop: 7,
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: "#7A90AB",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 5,
                  }}
                >
                  Requirements
                </div>
                {[
                  "480×480 pixels",
                  "10–60 seconds",
                  "Max 100MB",
                  "MP4, MOV, AVI",
                ].map((req) => (
                  <div
                    key={req}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11,
                      color: "#00ACC1",
                      padding: "1px 0",
                    }}
                  >
                    <CheckCircle size={12} />
                    {req}
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Video uploaded preview */
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "relative",
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "1.5px solid #D6E2F5",
                  background: "#000",
                  aspectRatio: "1",
                  maxWidth: 180,
                }}
              >
                <video
                  ref={vidPreviewRef}
                  src={videoUrl}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  controls
                  preload="metadata"
                />
                <button
                  onClick={handleDeleteVideo}
                  title="Remove video"
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    background: "#D32F2F",
                    border: "none",
                    borderRadius: "50%",
                    width: 22,
                    height: 22,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X size={12} color="#fff" />
                </button>
              </div>
              <p
                style={{
                  fontSize: 10.5,
                  color: "#7A90AB",
                  marginTop: 5,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <CheckCircle size={11} color="#2E7D32" />
                Video uploaded
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ VIDEO EDITOR DIALOG ═══ */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent
          style={{
            maxWidth: 820,
            maxHeight: "90vh",
            overflowY: "auto",
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          }}
        >
          <DialogHeader>
            <DialogTitle
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              <Scissors size={16} color="#1565C0" />
              Edit Video to Meet Requirements
            </DialogTitle>
          </DialogHeader>

          {/* Issues banner */}
          {validationResult && validationResult.issues.length > 0 && (
            <div
              style={{
                background: "#FFF3E0",
                border: "1px solid #FFCC80",
                borderRadius: 8,
                padding: "9px 12px",
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#E65100",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 4,
                }}
              >
                Issues to fix
              </div>
              {validationResult.issues.map((issue, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11.5,
                    color: "#BF360C",
                    marginBottom: 2,
                  }}
                >
                  <AlertCircle size={12} />
                  {issue}
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
            }}
          >
            {/* Preview */}
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#3D5068",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Preview
              </label>
              <div
                style={{
                  borderRadius: 8,
                  overflow: "hidden",
                  background: "#000",
                  aspectRatio: "1",
                  border: "1px solid #D6E2F5",
                }}
              >
                {editorVideoUrl ? (
                  <video
                    ref={editorVideoRef}
                    src={editorVideoUrl}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    controls
                    preload="metadata"
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#7A90AB",
                      fontSize: 12,
                    }}
                  >
                    Loading video…
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Trim */}
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#3D5068",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Trim Video
                </label>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 10.5,
                    color: "#7A90AB",
                    marginBottom: 4,
                  }}
                >
                  <span>Start: {formatTime(startTime)}</span>
                  <span>End: {formatTime(endTime)}</span>
                  <span
                    style={{
                      color: trimValid ? "#2E7D32" : "#D32F2F",
                      fontWeight: 600,
                    }}
                  >
                    {formatTime(trimDur)}
                  </span>
                </div>
                <Slider
                  value={[startTime, endTime]}
                  min={0}
                  max={videoDuration}
                  step={0.1}
                  onValueChange={([s, e]) => {
                    setStartTime(s);
                    setEndTime(e);
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    marginTop: 8,
                  }}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (editorVideoRef.current) {
                        editorVideoRef.current.currentTime = startTime;
                        editorVideoRef.current.play();
                      }
                    }}
                    disabled={!editorVideoUrl}
                    style={{ fontSize: 11 }}
                  >
                    <Play size={11} style={{ marginRight: 4 }} />
                    Start
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (editorVideoRef.current) {
                        editorVideoRef.current.currentTime = endTime - 3;
                        editorVideoRef.current.play();
                      }
                    }}
                    disabled={!editorVideoUrl}
                    style={{ fontSize: 11 }}
                  >
                    <Play size={11} style={{ marginRight: 4 }} />
                    End
                  </Button>
                </div>
                {!trimValid && (
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      color: "#D32F2F",
                      background: "#FFEBEE",
                      border: "1px solid #FFCDD2",
                      borderRadius: 6,
                      padding: "5px 8px",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <AlertCircle size={11} />
                    {trimDur < VIDEO_MIN_DURATION
                      ? `Min ${VIDEO_MIN_DURATION}s required`
                      : `Max ${VIDEO_MAX_DURATION}s exceeded`}
                  </div>
                )}
              </div>

              {/* Resolution */}
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#3D5068",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Output Resolution
                </label>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger style={{ fontSize: 12.5 }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="480x480">480×480 (Required)</SelectItem>
                    <SelectItem value="720x720">720×720 → 480×480</SelectItem>
                    <SelectItem value="1080x1080">1080×1080 → 480×480</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quality */}
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#3D5068",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Quality (CRF: {compression})
                </label>
                <Slider
                  value={[compression]}
                  min={18}
                  max={28}
                  step={1}
                  onValueChange={([v]) => setCompression(v)}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 10,
                    color: "#7A90AB",
                    marginTop: 4,
                  }}
                >
                  <span>Higher Quality</span>
                  <span>Smaller File</span>
                </div>
              </div>

              {/* Processing progress */}
              {vidUploading && processingProgress > 0 && processingProgress < 100 && (
                <div
                  style={{
                    background: "#E3EEF9",
                    border: "1px solid #BBDEFB",
                    borderRadius: 8,
                    padding: "9px 12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#1565C0",
                      marginBottom: 6,
                    }}
                  >
                    Processing Video…
                  </div>
                  <div
                    style={{
                      background: "#BBDEFB",
                      borderRadius: 4,
                      height: 6,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${processingProgress}%`,
                        background: "linear-gradient(90deg,#1565C0,#00ACC1)",
                        borderRadius: 4,
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                  <div
                    style={{ fontSize: 10.5, color: "#1565C0", marginTop: 4 }}
                  >
                    {processingProgress}%
                  </div>
                </div>
              )}

              {/* Expected output */}
              <div
                style={{
                  background: "#E8F5E9",
                  border: "1px solid #A5D6A7",
                  borderRadius: 8,
                  padding: "9px 12px",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#2E7D32",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 5,
                  }}
                >
                  Expected Output
                </div>
                {[
                  ["Resolution", "480×480"],
                  ["Duration", formatTime(trimDur)],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11,
                      color: "#2E7D32",
                      marginBottom: 2,
                    }}
                  >
                    <CheckCircle size={11} />
                    {k}: <strong>{v}</strong>
                  </div>
                ))}
                {trimValid && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11,
                      color: "#2E7D32",
                      fontWeight: 600,
                      marginTop: 3,
                    }}
                  >
                    <CheckCircle size={11} />
                    Ready to process!
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter style={{ marginTop: 4 }}>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditor(false);
                setProcessingProgress(0);
                setValidationResult(null);
                setEditingVideo(null);
                if (editorVideoUrl) {
                  URL.revokeObjectURL(editorVideoUrl);
                  setEditorVideoUrl(null);
                }
              }}
              disabled={vidUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditAndUpload}
              disabled={vidUploading || !ffmpegLoaded || !trimValid}
              style={{
                background: "#2E7D32",
                color: "#fff",
                border: "none",
                opacity: vidUploading || !ffmpegLoaded || !trimValid ? 0.6 : 1,
              }}
            >
              {vidUploading ? (
                <>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid #fff",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                      marginRight: 7,
                    }}
                  />
                  {processingProgress > 0 && processingProgress < 100
                    ? "Processing…"
                    : "Uploading…"}
                </>
              ) : (
                <>
                  <Download size={14} style={{ marginRight: 7 }} />
                  Process & Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}