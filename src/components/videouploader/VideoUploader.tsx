"use client";

import React, { useState, useRef, useEffect } from "react";
import { Upload, X, Video, AlertCircle, CheckCircle, Edit2, Scissors, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface VideoUploaderProps {
  videoUrl: string | null;
  setVideoUrl: (url: string | null) => void;
  vendorId: string;
  userRole: "VENDOR" | "ADMIN";
}

interface VideoValidation {
  duration: number;
  width: number;
  height: number;
  size: number;
  isValid: boolean;
  issues: string[];
}

export default function VideoUploader({
  videoUrl,
  setVideoUrl,
  vendorId,
  userRole,
}: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [originalVideo, setOriginalVideo] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<VideoValidation | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingVideo, setEditingVideo] = useState<File | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [editorVideoUrl, setEditorVideoUrl] = useState<string | null>(null);
  
  // Editor states
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [compression, setCompression] = useState<number>(23);
  const [resolution, setResolution] = useState<string>("480x480");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const editorVideoRef = useRef<HTMLVideoElement>(null);
  const ffmpegRef = useRef<any>(null);

  // Validation constants
  const MAX_SIZE = 100 * 1024 * 1024; // 100MB
  const MIN_DURATION = 10; // 10 seconds
  const MAX_DURATION = 60; // 60 seconds
  const REQUIRED_WIDTH = 480;
  const REQUIRED_HEIGHT = 480;

    const { accessToken } = useSelector((state: RootState) => state.auth);
  

  // Load FFmpeg
  useEffect(() => {
    loadFFmpeg();
  }, []);

  // Clean up video URLs
  useEffect(() => {
    return () => {
      if (editorVideoUrl) {
        URL.revokeObjectURL(editorVideoUrl);
      }
    };
  }, [editorVideoUrl]);

  const loadFFmpeg = async () => {
    try {
      // Dynamically import FFmpeg
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile, toBlobURL } = await import('@ffmpeg/util');
      
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = { ffmpeg, fetchFile, toBlobURL };
      
      ffmpeg.on('log', ({ message }) => {
        console.log('FFmpeg log:', message);
      });
      
      ffmpeg.on('progress', ({ progress }) => {
        const progressPercent = Math.round(progress * 100);
        setProcessingProgress(progressPercent);
        console.log('FFmpeg progress:', progressPercent);
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      setFfmpegLoaded(true);
      console.log('FFmpeg loaded successfully');
    } catch (err) {
      console.error('Failed to load FFmpeg:', err);
      setError('Failed to load video processing library. Please refresh the page.');
    }
  };

  const validateVideo = (file: File): Promise<VideoValidation> => {
    return new Promise((resolve, reject) => {
      setValidationError(null);

      const issues: string[] = [];
      let duration = 0;
      let width = 0;
      let height = 0;

      // Check file type
      if (!file.type.startsWith("video/")) {
        issues.push("Please upload a video file");
        reject(new Error("Invalid file type"));
        return;
      }

      // Check file size
      if (file.size > MAX_SIZE) {
        issues.push(`Video size must be less than 100MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      }

      // Create video element to check duration and dimensions
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);

        duration = video.duration;
        width = video.videoWidth;
        height = video.videoHeight;

        console.log('Video metadata:', { duration, width, height, size: file.size });

        // Check duration
        if (duration < MIN_DURATION) {
          issues.push(`Video must be at least ${MIN_DURATION} seconds (current: ${duration.toFixed(1)}s)`);
        }
        if (duration > MAX_DURATION) {
          issues.push(`Video must be maximum ${MAX_DURATION} seconds (current: ${duration.toFixed(1)}s)`);
        }

        // Check dimensions
        if (width !== REQUIRED_WIDTH || height !== REQUIRED_HEIGHT) {
          issues.push(`Video must be ${REQUIRED_WIDTH}x${REQUIRED_HEIGHT} (current: ${width}x${height})`);
        }

        const validation: VideoValidation = {
          duration,
          width,
          height,
          size: file.size,
          isValid: issues.length === 0,
          issues
        };

        setValidationResult(validation);
        resolve(validation);
      };

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        setValidationError("Failed to load video metadata");
        reject(new Error("Metadata error"));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const openVideoEditor = async (file: File) => {
    try {
      setOriginalVideo(file);
      setEditingVideo(file);
      setShowEditor(true);
      setProcessingProgress(0);
      
      // Create object URL for the editor video
      if (editorVideoUrl) {
        URL.revokeObjectURL(editorVideoUrl);
      }
      const url = URL.createObjectURL(file);
      setEditorVideoUrl(url);
      
      // Wait for video to load metadata
      await new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.onloadedmetadata = () => {
          const duration = video.duration;
          setVideoDuration(duration);
          
          // Set initial trim values
          if (duration > MAX_DURATION) {
            setEndTime(MAX_DURATION);
            setStartTime(0);
          } else if (duration < MIN_DURATION) {
            setEndTime(duration);
            setStartTime(0);
          } else {
            setEndTime(duration);
            setStartTime(0);
          }
          
          URL.revokeObjectURL(video.src);
          resolve(true);
        };
        video.onerror = () => {
          URL.revokeObjectURL(video.src);
          reject(new Error('Failed to load video'));
        };
        video.src = url;
      });
      
    } catch (err) {
      console.error('Error opening video editor:', err);
      setError('Failed to load video for editing');
    }
  };

  const processVideoInEditor = async (): Promise<File> => {
    if (!ffmpegLoaded || !ffmpegRef.current) {
      throw new Error('Video processor not ready. Please wait and try again.');
    }

    if (!editingVideo) {
      throw new Error('No video to process');
    }

    const { ffmpeg, fetchFile } = ffmpegRef.current;
    
    try {
      setProcessingProgress(0);
      console.log('Starting video processing...');
      
      // Write input file
      const inputData = await fetchFile(editingVideo);
      await ffmpeg.writeFile('input.mp4', inputData);
      console.log('Input file written');
      
      // Get resolution dimensions
      const [targetWidth, targetHeight] = resolution.split('x').map(Number);
      
      // Calculate trim duration
      const trimDuration = endTime - startTime;
      console.log('Trim settings:', { startTime, endTime, trimDuration });
      
      // Build FFmpeg command
      const ffmpegArgs = [
        '-i', 'input.mp4',
        '-ss', startTime.toString(),
        '-t', trimDuration.toString(),
        '-vf', `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2:color=black`,
        '-c:v', 'libx264',
        '-crf', compression.toString(),
        '-preset', 'medium',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-y', // Overwrite output file
        'output.mp4'
      ];
      
      console.log('Executing FFmpeg with args:', ffmpegArgs);
      
      // Execute FFmpeg command
      await ffmpeg.exec(ffmpegArgs);
      console.log('FFmpeg execution completed');
      
      // Read output file
      const data = await ffmpeg.readFile('output.mp4');
      console.log('Output file read, size:', data.length);
      
      // Create blob and file
      const blob = new Blob([data], { type: 'video/mp4' });
      const processedFile = new File(
        [blob],
        `processed-${Date.now()}.mp4`,
        { type: 'video/mp4' }
      );
      
      console.log('Processed file created:', processedFile.size);
      
      // Clean up
      try {
        await ffmpeg.deleteFile('input.mp4');
        await ffmpeg.deleteFile('output.mp4');
      } catch (cleanupErr) {
        console.warn('Cleanup warning:', cleanupErr);
      }
      
      return processedFile;
      
    } catch (err: any) {
      console.error('Video processing error:', err);
      throw new Error(`Failed to process video: ${err.message}`);
    }
  };

  const handleEditAndUpload = async () => {
    try {
      setUploading(true);
      setError(null);
      
      // Validate trim duration
      const trimDuration = endTime - startTime;
      if (trimDuration < MIN_DURATION) {
        throw new Error(`Trimmed video must be at least ${MIN_DURATION} seconds`);
      }
      if (trimDuration > MAX_DURATION) {
        throw new Error(`Trimmed video must be maximum ${MAX_DURATION} seconds`);
      }
      
      console.log('Starting video processing and upload...');
      const processedFile = await processVideoInEditor();
      console.log('Video processed successfully');
      
      // Validate processed file
      const validation = await validateVideo(processedFile);
      
      if (!validation.isValid) {
        throw new Error('Processed video still does not meet requirements: ' + validation.issues.join(', '));
      }
      
      await uploadToR2(processedFile, true);
      setShowEditor(false);
      
    } catch (err: any) {
      console.error('Edit and upload error:', err);
      setError(err.message || "Failed to process video");
    } finally {
      setUploading(false);
      setProcessingProgress(0);
    }
  };

  const uploadToR2 = async (file: File, skipValidation: boolean = false) => {
    try {
      // Validate video first (unless already validated)
      if (!skipValidation) {
        const validation = await validateVideo(file);
        
        if (!validation.isValid) {
          // Video doesn't meet criteria - automatically open editor
          await openVideoEditor(file);
          setValidationError(validation.issues.join(', '));
          return;
        }
      }

      // If video is valid, proceed with direct upload
      setUploading(true);
      setProgress(0);
      setError(null);

      // Get auth token
      
      if (!accessToken) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Generate unique key based on user role
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'mp4';
      const key = userRole === "VENDOR" 
        ? `vendor/${vendorId}/videos/${timestamp}.${fileExtension}`
        : `admin/videos/${timestamp}.${fileExtension}`;

      // Create FormData for upload
      const formData = new FormData();
      formData.append("video", file);
      formData.append("key", key);
      formData.append("userRole", userRole);
      formData.append("vendorId", vendorId);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setProgress(percentComplete);
        }
      });

      // Handle completion
      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            setVideoUrl(response.data.url);
            setVideoKey(response.data.key);
            setUploading(false);
            setProgress(100);
            setValidationResult(null);
            setOriginalVideo(null);
            setEditingVideo(null);
          } else {
            throw new Error(response.message || "Upload failed");
          }
        } else {
          throw new Error(`Upload failed with status: ${xhr.status}`);
        }
      });

      // Handle errors
      xhr.addEventListener("error", () => {
        setError("Network error during upload");
        setUploading(false);
        setProgress(0);
      });

      xhr.addEventListener("abort", () => {
        setError("Upload cancelled");
        setUploading(false);
        setProgress(0);
      });

      // Start upload with authorization header
      xhr.open("POST", "http://localhost:5000/api/upload/video");
      xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
      xhr.send(formData);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload video");
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!videoKey) return;

    try {
     
      if (!accessToken) {
        throw new Error('Authentication required. Please log in again.');
      }

      const response = await fetch("http://localhost:5000/api/upload/video", {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ key: videoKey }),
      });

      if (!response.ok) {
        throw new Error(`Delete failed with status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setVideoUrl(null);
        setVideoKey(null);
        setProgress(0);
        setValidationResult(null);
        setOriginalVideo(null);
        setEditingVideo(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        throw new Error(result.message || "Failed to delete video");
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      setError(err.message || "Failed to delete video. Please try again.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      setValidationError(null);
      uploadToR2(file);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFileSizeMB = (size: number) => {
    return (size / 1024 / 1024).toFixed(2);
  };

  // Calculate estimated output size
  const estimateOutputSize = () => {
    if (!validationResult) return 0;
    
    const trimRatio = (endTime - startTime) / validationResult.duration;
    const compressionRatio = compression / 28; // CRF 23 is default, adjust ratio
    const resolutionRatio = resolution === "480x480" ? 1 : 
                            resolution === "720x720" ? 2.25 : 3.375;
    
    return validationResult.size * trimRatio * compressionRatio / resolutionRatio;
  };

  const handlePreviewStart = () => {
    if (editorVideoRef.current && editorVideoUrl) {
      editorVideoRef.current.currentTime = startTime;
      editorVideoRef.current.play();
    }
  };

  const handlePreviewEnd = () => {
    if (editorVideoRef.current && editorVideoUrl) {
      editorVideoRef.current.currentTime = endTime;
      editorVideoRef.current.play();
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Area / Video Preview */}
      {!videoUrl ? (
        <div className="space-y-3">
          {/* Upload Button */}
          <button
            onClick={handleClickUpload}
            disabled={uploading || !ffmpegLoaded}
            className={`w-full border-2 border-dashed rounded-lg p-8 transition-all ${
              uploading || !ffmpegLoaded
                ? "border-teal-400 bg-teal-50 cursor-not-allowed"
                : "border-gray-300 hover:border-teal-500 hover:bg-gray-50 cursor-pointer"
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className={`p-4 rounded-full ${uploading || !ffmpegLoaded ? "bg-teal-100" : "bg-gray-100"}`}>
                {uploading || !ffmpegLoaded ? (
                  <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-600" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">
                  {!ffmpegLoaded ? "Loading video editor..." : uploading ? "Uploading video..." : "Click to upload video"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  480x480, 10-60 seconds, max 100MB
                </p>
              </div>
            </div>
          </button>

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, #0d9488 0, #0d9488 20px, #14b8a6 20px, #14b8a6 40px)",
                  }}
                />
                
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-300 ease-out overflow-hidden"
                  style={{ width: `${progress}%` }}
                >
                  <div
                    className="h-full"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, #0d9488 0, #0d9488 20px, #14b8a6 20px, #14b8a6 40px)",
                    }}
                  />
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-900 mix-blend-difference">
                    {progress}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-center text-gray-600">
                Please wait while your video is being uploaded...
              </p>
            </div>
          )}

          {/* Validation Requirements */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-medium text-blue-900 mb-2">Video Requirements:</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3" />
                Dimensions: 480x480 pixels
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3" />
                Duration: 10-60 seconds
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3" />
                File size: Maximum 100MB
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3" />
                Format: MP4, MOV, AVI, etc.
              </li>
            </ul>
          </div>
        </div>
      ) : (
        /* Video Preview */
        <div className="relative group">
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-cover"
              controls
              preload="metadata"
            />
            
            <button
              onClick={handleDelete}
              className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              title="Delete video"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            Video uploaded successfully. Hover to delete.
          </p>
        </div>
      )}

      {/* Video Editor Dialog - Automatically shown when video doesn't meet criteria */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scissors className="w-5 h-5" />
              Edit Video to Meet Requirements
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Video Preview */}
            <div className="space-y-4">
              <label className="text-sm font-medium">Preview</label>
              <div className="border rounded-lg overflow-hidden bg-black aspect-square">
                {editorVideoUrl ? (
                  <video
                    ref={editorVideoRef}
                    src={editorVideoUrl}
                    className="w-full h-full object-contain"
                    controls
                    preload="metadata"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    Loading video...
                  </div>
                )}
              </div>
              
              {/* Current Video Info */}
              {validationResult && (
                <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                  <p className="text-sm font-medium text-orange-900 mb-2">Current Video Issues:</p>
                  <div className="space-y-1 text-xs text-orange-800">
                    {validationResult.issues.map((issue, index) => (
                      <div key={index} className="flex items-start gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Editing Controls */}
            <div className="space-y-6">
              {/* Trim Controls */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Trim Video</label>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Start: {formatTime(startTime)}</span>
                    <span>End: {formatTime(endTime)}</span>
                    <span>Duration: {formatTime(endTime - startTime)}</span>
                  </div>
                  <Slider
                    value={[startTime, endTime]}
                    min={0}
                    max={videoDuration}
                    step={0.1}
                    onValueChange={([start, end]) => {
                      setStartTime(start);
                      setEndTime(end);
                    }}
                    className="py-4"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handlePreviewStart}
                      disabled={!editorVideoUrl}
                    >
                      Preview Start
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handlePreviewEnd}
                      disabled={!editorVideoUrl}
                    >
                      Preview End
                    </Button>
                  </div>
                </div>
              </div>

              {/* Resolution Settings */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Output Resolution</label>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="480x480">480x480 (Required)</SelectItem>
                    <SelectItem value="720x720">720x720 → 480x480 (Downscale)</SelectItem>
                    <SelectItem value="1080x1080">1080x1080 → 480x480 (Downscale)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  All resolutions will be scaled to 480x480 for upload
                </p>
              </div>

              {/* Compression Settings (CRF) */}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Quality (CRF: {compression})
                </label>
                <Slider
                  value={[compression]}
                  min={18}
                  max={28}
                  step={1}
                  onValueChange={([value]) => setCompression(value)}
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Higher Quality</span>
                  <span>Smaller File</span>
                </div>
                <p className="text-xs text-gray-500">
                  Lower CRF = better quality but larger file size
                </p>
              </div>

              {/* Processing Progress */}
              {uploading && processingProgress > 0 && processingProgress < 100 && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">Processing Video...</p>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-700 mt-1">{processingProgress}%</p>
                </div>
              )}

              {/* Expected Output */}
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <p className="text-sm font-medium text-green-900 mb-2">Expected Output:</p>
                <div className="text-xs text-green-800 space-y-1">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Resolution: 480x480
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Duration: {formatTime(endTime - startTime)}
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Est. Size: ~{getFileSizeMB(estimateOutputSize())}MB
                  </div>
                  {(endTime - startTime) >= MIN_DURATION && (endTime - startTime) <= MAX_DURATION && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span className="text-green-600 font-medium">Ready to process!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Validation Warning */}
              {((endTime - startTime) < MIN_DURATION || (endTime - startTime) > MAX_DURATION) && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    <div className="text-xs text-red-800">
                      {(endTime - startTime) < MIN_DURATION 
                        ? `Video must be at least ${MIN_DURATION} seconds (current: ${formatTime(endTime - startTime)})`
                        : `Video must be maximum ${MAX_DURATION} seconds (current: ${formatTime(endTime - startTime)})`
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditor(false);
                setProcessingProgress(0);
                setValidationResult(null);
                setOriginalVideo(null);
                setEditingVideo(null);
                if (editorVideoUrl) {
                  URL.revokeObjectURL(editorVideoUrl);
                  setEditorVideoUrl(null);
                }
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditAndUpload}
              disabled={
                uploading || 
                !ffmpegLoaded ||
                (endTime - startTime) > MAX_DURATION || 
                (endTime - startTime) < MIN_DURATION
              }
              className="bg-green-600 hover:bg-green-700"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {processingProgress > 0 && processingProgress < 100 ? 'Processing...' : 'Uploading...'}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Process & Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Error */}
      {error && !showEditor && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-red-900">Error</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}